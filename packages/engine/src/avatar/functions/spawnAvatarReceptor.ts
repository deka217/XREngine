import {
  Collider,
  ColliderDesc,
  KinematicCharacterController,
  RigidBody,
  RigidBodyDesc
} from '@dimforge/rapier3d-compat'
import { AnimationClip, AnimationMixer, Group, Object3D, Quaternion, Vector3 } from 'three'

import { getState } from '@xrengine/hyperflux'

import { setTargetCameraRotation } from '../../camera/systems/CameraInputSystem'
import { Engine } from '../../ecs/classes/Engine'
import { Entity } from '../../ecs/classes/Entity'
import {
  addComponent,
  getComponent,
  hasComponent,
  removeComponent,
  setComponent
} from '../../ecs/functions/ComponentFunctions'
import { LocalAvatarTagComponent } from '../../input/components/LocalAvatarTagComponent'
import { LocalInputTagComponent } from '../../input/components/LocalInputTagComponent'
import { NetworkObjectAuthorityTag } from '../../networking/components/NetworkObjectComponent'
import { NetworkPeerFunctions } from '../../networking/functions/NetworkPeerFunctions'
import { WorldNetworkAction } from '../../networking/functions/WorldNetworkAction'
import { WorldState } from '../../networking/interfaces/WorldState'
import { Physics } from '../../physics/classes/Physics'
import { VectorSpringSimulator } from '../../physics/classes/springs/VectorSpringSimulator'
import { CollisionComponent } from '../../physics/components/CollisionComponent'
import { RigidBodyComponent } from '../../physics/components/RigidBodyComponent'
import { AvatarCollisionMask, CollisionGroups } from '../../physics/enums/CollisionGroups'
import { getInteractionGroups } from '../../physics/functions/getInteractionGroups'
import { NameComponent } from '../../scene/components/NameComponent'
import { ShadowComponent } from '../../scene/components/ShadowComponent'
import { VisibleComponent } from '../../scene/components/VisibleComponent'
import { DistanceFromCameraComponent, FrustumCullCameraComponent } from '../../transform/components/DistanceComponents'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { AnimationComponent } from '../components/AnimationComponent'
import { AvatarAnimationComponent } from '../components/AvatarAnimationComponent'
import { AvatarComponent } from '../components/AvatarComponent'
import { AvatarControllerComponent } from '../components/AvatarControllerComponent'
import { AvatarIKTargetsComponent } from '../components/AvatarIKComponents'
import { SpawnPoseComponent } from '../components/SpawnPoseComponent'

export const avatarRadius = 0.25
export const defaultAvatarHeight = 1.8
export const defaultAvatarHalfHeight = defaultAvatarHeight / 2

export const spawnAvatarReceptor = (spawnAction: typeof WorldNetworkAction.spawnAvatar.matches._TYPE) => {
  const world = Engine.instance.currentWorld
  const userId = spawnAction.$from
  const existingAvatarEntity = world.getUserAvatarEntity(spawnAction.$from)

  // already spawned into the world on another device or tab
  if (existingAvatarEntity) {
    const didSpawnEarlierThanThisClient = NetworkPeerFunctions.getCachedActionsForUser(userId).find(
      (action) =>
        WorldNetworkAction.spawnAvatar.matches.test(action) &&
        action !== spawnAction &&
        action.$time > spawnAction.$time
    )
    if (didSpawnEarlierThanThisClient) {
      hasComponent(existingAvatarEntity, NetworkObjectAuthorityTag) &&
        removeComponent(existingAvatarEntity, NetworkObjectAuthorityTag)
    }
    return
  }

  const entity = world.getNetworkObject(spawnAction.$from, spawnAction.networkId)!
  const transform = getComponent(entity, TransformComponent)

  addComponent(entity, AvatarComponent, {
    avatarHalfHeight: defaultAvatarHalfHeight,
    avatarHeight: defaultAvatarHeight,
    model: null
  })

  const userNames = getState(WorldState).userNames
  const userName = userNames[userId].value
  const shortId = userId.substring(0, 7)
  addComponent(entity, NameComponent, 'avatar-' + (userName ? shortId + ' (' + userName + ')' : shortId))

  addComponent(entity, VisibleComponent, true)

  setComponent(entity, DistanceFromCameraComponent)
  setComponent(entity, FrustumCullCameraComponent)

  addComponent(entity, AnimationComponent, {
    mixer: new AnimationMixer(new Object3D()),
    animations: [] as AnimationClip[],
    animationSpeed: 1
  })

  addComponent(entity, AvatarAnimationComponent, {
    animationGraph: {
      states: {},
      transitionRules: {},
      currentState: null!,
      stateChanged: null!
    },
    rootYRatio: 1,
    locomotion: new Vector3()
  })
  setComponent(entity, AvatarIKTargetsComponent, {
    head: false,
    leftHand: false,
    rightHand: false
  })

  addComponent(entity, SpawnPoseComponent, {
    position: new Vector3().copy(transform.position),
    rotation: new Quaternion().copy(transform.rotation)
  })

  if (userId === Engine.instance.userId) {
    createAvatarController(entity)
    addComponent(entity, LocalAvatarTagComponent, true)
    addComponent(entity, LocalInputTagComponent, true)
  } else {
    createAvatarRigidBody(entity)
    createAvatarCollider(entity)
  }

  setComponent(entity, ShadowComponent)
}

export const createAvatarCollider = (entity: Entity): Collider => {
  const interactionGroups = getInteractionGroups(CollisionGroups.Avatars, AvatarCollisionMask)
  const avatarComponent = getComponent(entity, AvatarComponent)
  const rigidBody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)
  rigidBody.position.copy(transform.position)
  rigidBody.rotation.copy(transform.rotation)

  const bodyColliderDesc = ColliderDesc.capsule(
    avatarComponent.avatarHalfHeight - avatarRadius,
    avatarRadius
  ).setCollisionGroups(interactionGroups)
  bodyColliderDesc.setTranslation(0, avatarComponent.avatarHalfHeight, 0)

  return Physics.createColliderAndAttachToRigidBody(
    Engine.instance.currentWorld.physicsWorld,
    bodyColliderDesc,
    rigidBody.body
  )
}

const createAvatarRigidBody = (entity: Entity): RigidBody => {
  const rigidBodyDesc = RigidBodyDesc.kinematicPositionBased()
  const rigidBody = Physics.createRigidBody(entity, Engine.instance.currentWorld.physicsWorld, rigidBodyDesc, [])
  rigidBody.lockRotations(true, false)
  rigidBody.setEnabledRotations(false, true, false, false)

  return rigidBody
}

export const createAvatarController = (entity: Entity) => {
  createAvatarRigidBody(entity)
  const rigidbody = getComponent(entity, RigidBodyComponent)
  const transform = getComponent(entity, TransformComponent)
  rigidbody.position.copy(transform.position)
  rigidbody.rotation.copy(transform.rotation)
  rigidbody.targetKinematicPosition.copy(transform.position)
  rigidbody.targetKinematicRotation.copy(transform.rotation)

  addComponent(entity, AvatarControllerComponent, {
    cameraEntity: Engine.instance.currentWorld.cameraEntity,
    bodyCollider: undefined!,
    movementEnabled: true,
    isJumping: false,
    isWalking: false,
    isInAir: false,
    gamepadLocalInput: new Vector3(),
    gamepadWorldMovement: new Vector3(),
    verticalVelocity: 0,
    speedVelocity: { value: 0 },
    translationApplied: new Vector3()
  })

  const CameraTransform = getComponent(Engine.instance.currentWorld.cameraEntity, TransformComponent)
  const avatarForward = new Vector3(0, 0, -1).applyQuaternion(transform.rotation)
  const cameraForward = new Vector3(0, 0, 1).applyQuaternion(CameraTransform.rotation)
  let targetTheta = (cameraForward.angleTo(avatarForward) * 180) / Math.PI
  const orientation = cameraForward.x * avatarForward.z - cameraForward.z * avatarForward.x
  if (orientation > 0) targetTheta = 2 * Math.PI - targetTheta
  setTargetCameraRotation(Engine.instance.currentWorld.cameraEntity, 0, targetTheta)

  const avatarControllerComponent = getComponent(entity, AvatarControllerComponent)
  avatarControllerComponent.bodyCollider = createAvatarCollider(entity)
  avatarControllerComponent.controller = Physics.createCharacterController(
    Engine.instance.currentWorld.physicsWorld,
    {}
  )

  addComponent(entity, CollisionComponent, new Map())
}
