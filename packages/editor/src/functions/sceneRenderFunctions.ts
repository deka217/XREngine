import { Group, Object3D, Scene, Vector3, WebGLInfo } from 'three'

import { SceneData } from '@xrengine/common/src/interfaces/SceneInterface'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions } from '@xrengine/engine/src/ecs/classes/EngineState'
import { addComponent, getComponent, removeComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { removeEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { emptyEntityTree } from '@xrengine/engine/src/ecs/functions/EntityTree'
import { matchActionOnce } from '@xrengine/engine/src/networking/functions/matchActionOnce'
import InfiniteGridHelper from '@xrengine/engine/src/scene/classes/InfiniteGridHelper'
import TransformGizmo from '@xrengine/engine/src/scene/classes/TransformGizmo'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { updateSceneFromJSON } from '@xrengine/engine/src/scene/systems/SceneLoadingSystem'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { dispatchAction } from '@xrengine/hyperflux'

import { EditorCameraComponent } from '../classes/EditorCameraComponent'
import { EditorHistoryAction } from '../services/EditorHistory'
import { EditorAction } from '../services/EditorServices'

export type DefaultExportOptionsType = {
  shouldCombineMeshes: boolean
  shouldRemoveUnusedObjects: boolean
}

export const DefaultExportOptions: DefaultExportOptionsType = {
  shouldCombineMeshes: true,
  shouldRemoveUnusedObjects: true
}

type SceneStateType = {
  isInitialized: boolean
  transformGizmo: TransformGizmo
  onUpdateStats?: (info: WebGLInfo) => void
}

export const SceneState: SceneStateType = {
  isInitialized: false,
  transformGizmo: null!
}

export async function initializeScene(sceneData: SceneData): Promise<Error[] | void> {
  SceneState.isInitialized = false

  const world = Engine.instance.currentWorld

  if (!world.scene) world.scene = new Scene()

  // getting scene data
  await updateSceneFromJSON(sceneData)
  console.log('Updated scene from JSON')
  await new Promise((resolve) => matchActionOnce(EngineActions.sceneLoaded.matches, resolve))

  dispatchAction(EditorHistoryAction.clearHistory({}))
  console.log('Cleared history on initialize')

  const camera = world.camera
  const transform = getComponent(world.cameraEntity, TransformComponent)
  camera.position.set(0, 5, 10)
  camera.lookAt(new Vector3())
  transform.position.copy(camera.position)
  transform.rotation.copy(camera.quaternion)
  world.dirtyTransforms[world.cameraEntity] = true

  world.camera.layers.enable(ObjectLayers.Scene)
  world.camera.layers.enable(ObjectLayers.NodeHelper)
  world.camera.layers.enable(ObjectLayers.Gizmos)

  removeComponent(world.cameraEntity, EditorCameraComponent)
  addComponent(world.cameraEntity, EditorCameraComponent, {
    center: new Vector3(),
    zoomDelta: 0,
    isOrbiting: false,
    isPanning: false,
    cursorDeltaX: 0,
    cursorDeltaY: 0,
    focusedObjects: []
  })

  // Require when changing scene
  if (!world.scene.children.includes(InfiniteGridHelper.instance)) {
    InfiniteGridHelper.instance = new InfiniteGridHelper()
    world.scene.add(InfiniteGridHelper.instance)
  }

  SceneState.isInitialized = true

  return []
}

/**
 * Function initializeRenderer used to render canvas.
 *
 * @param  {any} canvas [ contains canvas data ]
 */
export async function initializeRenderer(): Promise<void> {
  try {
    dispatchAction(EditorAction.rendererInitialized({ initialized: true }))
  } catch (error) {
    console.error(error)
  }
}

function removeUnusedObjects(object3d: Object3D) {
  function hasExtrasOrExtensions(object) {
    const userData = object.userData
    const keys = Object.keys(userData)
    for (const key of keys) {
      if (typeof userData[key] !== 'undefined') {
        return true
      }
    }
    return false
  }

  function _removeUnusedObjects(object: Object3D) {
    let canBeRemoved = !!object.parent
    const children = object.children?.slice(0)

    if (children) {
      for (const child of children) {
        if (!_removeUnusedObjects(child)) {
          canBeRemoved = false
        }
      }
    }

    if (
      canBeRemoved &&
      object.children.length === 0 &&
      (object.constructor === Object3D || object.constructor === Scene || object.constructor === Group) &&
      !hasExtrasOrExtensions(object)
    ) {
      object.parent?.remove(object)
      return true
    }

    return false
  }

  _removeUnusedObjects(object3d)
}

/**
 * Function exportScene used to export scene.
 *
 * @param  {any}  signal       [show the Network status]
 * @param  {Object}  [options={}]
 * @return {Promise}              [scene data as object]
 */
/*
export async function exportScene(options = {} as DefaultExportOptionsType) {
  const { shouldCombineMeshes, shouldRemoveUnusedObjects } = Object.assign({}, DefaultExportOptions, options)

  executeCommand({ type: EditorCommands.REPLACE_SELECTION, affectedNodes: [] })

  if ((Engine.instance.currentWorld.scene as any).entity == undefined) {
    ;(Engine.instance.currentWorld.scene as any).entity = Engine.instance.currentWorld.entityTree.rootNode.entity
  }

  const clonedScene = serializeForGLTFExport(Engine.instance.currentWorld.scene)

  if (shouldCombineMeshes) await MeshCombinationGroup.combineMeshes(clonedScene)
  if (shouldRemoveUnusedObjects) removeUnusedObjects(clonedScene)

  const exporter = new GLTFExporter({
    mode: 'glb',
    onlyVisible: false,
    includeCustomExtensions: true,
    animations: getAnimationClips()
  })

  let chunks

  try {
    chunks = await exporter.exportChunks(clonedScene)
  } catch (error) {
    throw new RethrownError(`Error exporting scene`, error)
  }

  const json = chunks.json

  const nodeDefs = json.nodes
  if (nodeDefs) {
    const uuidToIndexMap = {}

    for (let i = 0; i < nodeDefs.length; i++) {
      const nodeDef = nodeDefs[i]

      if (nodeDef.extras && nodeDef.extras.editor_uuid) {
        uuidToIndexMap[nodeDef.extras.editor_uuid] = i
        delete nodeDef.extras.editor_uuid

        if (isEmptyObject(nodeDef.extras)) {
          delete nodeDef.extras
        }
      }
    }
  }

  try {
    const glbBlob = await exporter.exportGLBBlob(chunks)
    return { glbBlob, chunks }
  } catch (error) {
    throw new RethrownError('Error creating glb blob', error)
  }
}*/

export function disposeScene() {
  if (Engine.instance.currentWorld.scene) {
    // Empty existing scene
    Engine.instance.currentWorld.scene.traverse((child: any) => {
      if (child.geometry) child.geometry.dispose()

      if (child.material) {
        if (child.material.length) {
          for (let i = 0; i < child.material.length; ++i) {
            child.material[i].dispose()
          }
        } else {
          child.material.dispose()
        }
      }
    })

    //clear ecs
    const eTree = Engine.instance.currentWorld.entityTree
    for (const entity of Array.from(eTree.entityNodeMap.keys())) {
      removeEntity(entity, true)
    }
    emptyEntityTree(eTree)
    eTree.entityNodeMap.clear()
    Engine.instance.currentWorld.scene.clear()
  }

  SceneState.isInitialized = false
}
