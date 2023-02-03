import RAPIER, { QueryFilterFlags } from '@dimforge/rapier3d-compat'
import { Euler, Matrix4, Quaternion, Ray, Vector3 } from 'three'

import { smootheLerpAlpha } from '@xrengine/common/src/utils/smootheLerpAlpha'
import { getState } from '@xrengine/hyperflux'

import { ObjectDirection } from '../../common/constants/Axis3D'
import { V_000, V_010, V_111 } from '../../common/constants/MathConstants'
import checkPositionIsValid from '../../common/functions/checkPositionIsValid'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import { getComponent, hasComponent } from '../../ecs/functions/ComponentFunctions'
import { Physics, RaycastArgs } from '../../physics/classes/Physics'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { RaycastHit, SceneQueryType } from '../../physics/types/PhysicsTypes'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { computeAndUpdateWorldOrigin, updateWorldOrigin } from '../../transform/updateWorldOrigin'
import { getCameraMode, ReferenceSpace, XRState } from '../../xr/XRState'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarControllerComponent, AvatarControllerComponentType } from '../components/AvatarControllerComponent'
import { AvatarHeadDecapComponent } from '../components/AvatarIKComponents'
import { AvatarMovementSettingsState } from '../state/AvatarMovementSettingsState'
import { markerInstance, ScaleFluctuate } from './autopilotFunctions'

const avatarGroundRaycastDistanceIncrease = 0.5
const avatarGroundRaycastDistanceOffset = 1
const avatarGroundRaycastAcceptableDistance = 1.2

/**
 * raycast internals
 */
const avatarGroundRaycast = {
  type: SceneQueryType.Closest,
  origin: new Vector3(),
  direction: ObjectDirection.Down,
  maxDistance: avatarGroundRaycastDistanceOffset + avatarGroundRaycastDistanceIncrease,
  groups: 0
}

const cameraDirection = new Vector3()
const forwardOrientation = new Quaternion()
const targetWorldMovement = new Vector3()
const desiredMovement = new Vector3()
const viewerMovement = new Vector3()
const finalAvatarMovement = new Vector3()
const avatarHeadPosition = new Vector3()

export function updateLocalAvatarPosition(additionalMovement?: Vector3) {
  const world = Engine.instance.currentWorld
  const entity = world.localClientEntity
  const xrFrame = Engine.instance.xrFrame

  if (!entity || (!xrFrame && !additionalMovement)) return

  const xrState = getState(XRState)
  const rigidbody = getComponent(entity, RigidBodyComponent)
  const controller = getComponent(entity, AvatarControllerComponent)
  const userHeight = xrState.userEyeLevel.value
  const avatarHeight = getComponent(entity, AvatarComponent)?.avatarHeight ?? 1.6

  const viewerPose = xrFrame && ReferenceSpace.origin ? xrFrame.getViewerPose(ReferenceSpace.origin) : null
  xrState.viewerPose.set(viewerPose)

  desiredMovement.copy(V_000)

  const attached = getCameraMode() === 'attached'
  if (attached) {
    /** move head position forward a bit to not be inside the avatar's body */
    avatarHeadPosition
      .set(0, avatarHeight * 0.95, 0.15)
      .applyQuaternion(rigidbody.targetKinematicRotation)
      .add(rigidbody.targetKinematicPosition)
    viewerPose && viewerMovement.copy(viewerPose.transform.position as any).sub(avatarHeadPosition)
    // vertical viewer movement should only apply updward movement to the rigidbody,
    // when the viewerpose is moving up over the current avatar head position
    viewerMovement.y = 0 // Math.max(viewerMovement.y, 0)
    desiredMovement.copy(viewerMovement)
    // desiredMovement.y = 0 // Math.max(desiredMovement.y, 0)
  } else {
    viewerMovement.copy(V_000)
  }

  if (controller.movementEnabled && additionalMovement) desiredMovement.add(additionalMovement)

  const avatarCollisionGroups = controller.bodyCollider.collisionGroups() & ~CollisionGroups.Trigger

  controller.controller.computeColliderMovement(
    controller.bodyCollider,
    desiredMovement,
    QueryFilterFlags.EXCLUDE_SENSORS,
    avatarCollisionGroups
  )

  const computedMovement = controller.controller.computedMovement() as Vector3
  if (desiredMovement.y === 0) computedMovement.y = 0

  rigidbody.targetKinematicPosition.copy(rigidbody.position).add(computedMovement)

  // const grounded = controller.controller.computedGrounded()
  /** rapier's computed movement is a bit bugged, so do a small raycast at the avatar's feet to snap it to the ground if it's close enough */
  avatarGroundRaycast.origin.copy(rigidbody.targetKinematicPosition)
  avatarGroundRaycast.groups = avatarCollisionGroups
  avatarGroundRaycast.origin.y += avatarGroundRaycastDistanceOffset
  const groundHits = Physics.castRay(world.physicsWorld, avatarGroundRaycast)
  controller.isInAir = true

  const originTransform = getComponent(world.originEntity, TransformComponent)

  if (groundHits.length) {
    const hit = groundHits[0]
    const controllerOffset = controller.controller.offset()
    // controller.isInAir = !grounded
    controller.isInAir = hit.distance > 1 + controllerOffset * 1.5
    if (!controller.isInAir) rigidbody.targetKinematicPosition.y = hit.position.y + controllerOffset
    if (hit.distance <= avatarGroundRaycastAcceptableDistance) {
      if (attached) originTransform.position.y = hit.position.y
      /** @todo after a physical jump, only apply viewer vertical movement once the user is back on the virtual ground */
    }
  }

  if (!controller.isInAir) controller.verticalVelocity = 0

  if (attached) updateReferenceSpaceFromAvatarMovement(finalAvatarMovement.subVectors(computedMovement, viewerMovement))
}

export const updateReferenceSpaceFromAvatarMovement = (movement: Vector3) => {
  const world = Engine.instance.currentWorld
  const originTransform = getComponent(world.originEntity, TransformComponent)
  originTransform.position.add(movement)
  computeAndUpdateWorldOrigin()
  updateLocalAvatarPositionAttachedMode()
}

const _additionalMovement = new Vector3()

/**
 * Avatar movement via click/pointer position
 */

const minimumDistanceSquared = 0.5 * 0.5

export const applyAutopilotInput = (entity: Entity) => {
  const controller = getComponent(entity, AvatarControllerComponent)
  if (!controller || controller.autopilotWalkpoint == undefined) return

  if (controller.gamepadLocalInput.lengthSq() > 0) {
    controller.autopilotWalkpoint = undefined
    return
  }

  const walkpoint = new Vector3()
  walkpoint.set(controller.autopilotWalkpoint.x, controller.autopilotWalkpoint.y, controller.autopilotWalkpoint.z)
  const autopilotMarkerObject = markerInstance.object
  if (autopilotMarkerObject) ScaleFluctuate(autopilotMarkerObject)
  const avatarPos = getComponent(entity, TransformComponent).position
  const moveDirection = walkpoint.sub(avatarPos)
  const distanceSquared = moveDirection.lengthSq()
  const avatarMovementSettings = getState(AvatarMovementSettingsState).value
  const legSpeed = controller.isWalking ? avatarMovementSettings.walkSpeed : avatarMovementSettings.runSpeed
  const delta = 0.0175

  if (distanceSquared > minimumDistanceSquared)
    updateLocalAvatarPosition(
      moveDirection
        .normalize()
        .multiplyScalar(delta * legSpeed)
        .add(new Vector3(0, controller.verticalVelocity, 0))
    )
  else controller.autopilotWalkpoint = undefined
}

/**
 * Avatar movement via gamepad
 */

export const applyGamepadInput = (entity: Entity) => {
  if (!entity) return

  const world = Engine.instance.currentWorld
  const camera = world.camera
  const deltaSeconds = world.fixedDeltaSeconds
  const controller = getComponent(entity, AvatarControllerComponent)

  const avatarMovementSettings = getState(AvatarMovementSettingsState).value
  const legSpeed = controller.isWalking ? avatarMovementSettings.walkSpeed : avatarMovementSettings.runSpeed
  camera.getWorldDirection(cameraDirection).setY(0).normalize()
  forwardOrientation.setFromUnitVectors(ObjectDirection.Forward, cameraDirection)

  targetWorldMovement
    .copy(controller.gamepadLocalInput)
    .normalize()
    .multiplyScalar(legSpeed * deltaSeconds)
    .applyQuaternion(forwardOrientation)

  // movement in the world XZ plane
  controller.gamepadWorldMovement.lerp(targetWorldMovement, 5 * deltaSeconds)

  // set vertical velocity on ground
  applyVerticalVelocity(controller, avatarMovementSettings)

  // apply gamepad movement and gravity
  if (controller.movementEnabled) controller.verticalVelocity -= 9.81 * deltaSeconds
  const verticalMovement = controller.verticalVelocity * deltaSeconds
  _additionalMovement.set(
    controller.gamepadWorldMovement.x,
    (controller.isInAir || verticalMovement) > 0 ? verticalMovement : 0,
    controller.gamepadWorldMovement.z
  )

  updateLocalAvatarPosition(_additionalMovement)
}

const applyVerticalVelocity = (controller: AvatarControllerComponentType, avatarMovementSettings) => {
  if (!controller.isInAir) {
    controller.verticalVelocity = 0
    if (controller.gamepadJumpActive) {
      if (!controller.isJumping) {
        console.log('jump')
        // Formula: takeoffVelocity = sqrt(2 * jumpHeight * gravity)
        controller.verticalVelocity = Math.sqrt(2 * avatarMovementSettings.jumpHeight * 9.81)
        controller.isJumping = true
      }
    } else if (controller.isJumping) {
      controller.isJumping = false
    }
  } else {
    controller.isJumping = false
  }
}

const _mat4 = new Matrix4()
const vec3 = new Vector3()

/**
 * Rotates a matrix around it's own origin with a quaternion
 * @param matrix
 * @param point
 * @param rotation
 */
export const spinMatrixWithQuaternion = (matrix: Matrix4, rotation: Quaternion) => {
  rotateMatrixAboutPoint(matrix, vec3.set(matrix.elements[12], matrix.elements[13], matrix.elements[14]), rotation)
}

/**
 * Rotates a matrix around a specific point
 * @param matrix
 * @param point
 * @param rotation
 */
export const rotateMatrixAboutPoint = (matrix: Matrix4, point: Vector3, rotation: Quaternion) => {
  matrix.premultiply(_mat4.makeTranslation(-point.x, -point.y, -point.z))
  matrix.premultiply(_mat4.makeRotationFromQuaternion(rotation))
  matrix.premultiply(_mat4.makeTranslation(point.x, point.y, point.z))
}

const desiredAvatarMatrix = new Matrix4()
const originRelativeToAvatarMatrix = new Matrix4()

/**
 * Translates and rotates the avatar and reference space
 * @param entity
 * @param translation
 * @param rotation
 */
export const translateAndRotateAvatar = (entity: Entity, translation: Vector3, rotation: Quaternion) => {
  const rigidBody = getComponent(entity, RigidBodyComponent)
  rigidBody.targetKinematicPosition.add(translation)
  rigidBody.targetKinematicRotation.multiply(rotation)

  if (getCameraMode() === 'attached') {
    const world = Engine.instance.currentWorld
    const avatarTransform = getComponent(entity, TransformComponent)
    const originTransform = getComponent(world.originEntity, TransformComponent)

    originRelativeToAvatarMatrix.multiplyMatrices(avatarTransform.matrixInverse, originTransform.matrix)
    desiredAvatarMatrix.compose(
      rigidBody.targetKinematicPosition,
      rigidBody.targetKinematicRotation,
      avatarTransform.scale
    )
    originTransform.matrix.multiplyMatrices(desiredAvatarMatrix, originRelativeToAvatarMatrix)
    originTransform.matrix.decompose(originTransform.position, originTransform.rotation, originTransform.scale)
    originTransform.matrixInverse.copy(originTransform.matrix).invert()

    updateWorldOrigin()
  }
}

export const updateLocalAvatarPositionAttachedMode = () => {
  const entity = Engine.instance.currentWorld.localClientEntity
  const rigidbody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)

  // for immersive and attached avatars, we don't want to interpolate the rigidbody in the transform system, so set
  // previous and current position to the target position

  rigidbody.previousPosition.copy(rigidbody.targetKinematicPosition)
  rigidbody.position.copy(rigidbody.targetKinematicPosition)
  transform.position.copy(rigidbody.targetKinematicPosition)
  rigidbody.body.setTranslation(rigidbody.targetKinematicPosition, true)
}

const viewerQuat = new Quaternion()
const avatarRotationAroundY = new Euler()
const avatarRotation = new Quaternion()

const _updateLocalAvatarRotationAttachedMode = () => {
  const entity = Engine.instance.currentWorld.localClientEntity
  const rigidbody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)
  const viewerPose = getState(XRState).viewerPose.value

  if (!viewerPose) return

  const viewerOrientation = viewerPose.transform.orientation
  viewerQuat.set(viewerOrientation.x, viewerOrientation.y, viewerOrientation.z, viewerOrientation.w)
  // const avatarRotation = extractRotationAboutAxis(viewerQuat, V_010, _quat)
  avatarRotationAroundY.setFromQuaternion(viewerQuat, 'YXZ')
  avatarRotation.setFromAxisAngle(V_010, avatarRotationAroundY.y + Math.PI)

  // for immersive and attached avatars, we don't want to interpolate the rigidbody in the transform system, so set
  // previous and current rotation to the target rotation
  rigidbody.targetKinematicRotation.copy(avatarRotation)
  rigidbody.previousRotation.copy(avatarRotation)
  rigidbody.rotation.copy(avatarRotation)
  transform.rotation.copy(avatarRotation)
}

export const updateLocalAvatarRotation = () => {
  const world = Engine.instance.currentWorld
  const entity = world.localClientEntity
  if (getCameraMode() === 'attached') {
    _updateLocalAvatarRotationAttachedMode()
  } else {
    const alpha = smootheLerpAlpha(3, world.deltaSeconds)
    if (hasComponent(entity, AvatarHeadDecapComponent)) {
      _slerpBodyTowardsCameraDirection(entity, alpha)
    } else {
      _slerpBodyTowardsVelocity(entity, alpha)
    }
  }
}

/**
 * Teleports the avatar to new position
 * @param entity
 * @param newPosition
 */
export const teleportAvatar = (entity: Entity, targetPosition: Vector3): void => {
  if (!hasComponent(entity, AvatarComponent)) {
    console.warn('Teleport avatar called on non-avatar entity')
    return
  }

  const raycastOrigin = targetPosition.clone()
  raycastOrigin.y += 0.1
  const { raycastHit } = checkPositionIsValid(raycastOrigin, false)

  if (raycastHit) {
    const transform = getComponent(entity, TransformComponent)
    const rigidbody = getComponent(entity, RigidBodyComponent)
    const newPosition = raycastHit.position as Vector3
    rigidbody.targetKinematicPosition.copy(newPosition)
    rigidbody.position.copy(newPosition)
    const attached = getCameraMode() === 'attached'
    if (attached)
      updateReferenceSpaceFromAvatarMovement(
        new Vector3().subVectors(raycastHit.position as Vector3, transform.position)
      )
  } else {
    console.log('invalid position', targetPosition, raycastHit)
  }
}

const _cameraDirection = new Vector3()
const _mat = new Matrix4()

const rotMatrix = new Matrix4()
const targetOrientation = new Quaternion()

const _slerpBodyTowardsCameraDirection = (entity: Entity, alpha: number) => {
  const rigidbody = getComponent(entity, RigidBodyComponent)
  if (!rigidbody) return

  const cameraRotation = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent).rotation
  const direction = _cameraDirection.set(0, 0, 1).applyQuaternion(cameraRotation).setComponent(1, 0)
  targetOrientation.setFromRotationMatrix(_mat.lookAt(V_000, direction, V_010))
  rigidbody.targetKinematicRotation.slerp(targetOrientation, alpha)
}

const _velXZ = new Vector3()
const prevVectors = new Map<Entity, Vector3>()
const _slerpBodyTowardsVelocity = (entity: Entity, alpha: number) => {
  const rigidbody = getComponent(entity, RigidBodyComponent)
  if (!rigidbody) return

  const vector = rigidbody.linearVelocity

  let prevVector = prevVectors.get(entity)!
  if (!prevVector) {
    prevVector = new Vector3(0, 0, 1)
    prevVectors.set(entity, prevVector)
  }

  _velXZ.set(vector.x, 0, vector.z)
  const isZero = _velXZ.distanceTo(V_000) < 0.1
  if (isZero) _velXZ.copy(prevVector)
  if (!isZero) prevVector.copy(_velXZ)

  rotMatrix.lookAt(_velXZ, V_000, V_010)
  targetOrientation.setFromRotationMatrix(rotMatrix)

  rigidbody.targetKinematicRotation.slerp(targetOrientation, alpha)
}
