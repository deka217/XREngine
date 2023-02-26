import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { API } from '@xrengine/client-core/src/API'
import { useProjectState } from '@xrengine/client-core/src/common/services/ProjectService'
import { LoadingCircle } from '@xrengine/client-core/src/components/LoadingCircle'
import PortalLoadSystem from '@xrengine/client-core/src/systems/PortalLoadSystem'
import { useAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { ClientModules } from '@xrengine/client-core/src/world/ClientModules'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions } from '@xrengine/engine/src/ecs/classes/EngineState'
import { initSystems } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { SystemUpdateType } from '@xrengine/engine/src/ecs/functions/SystemUpdateType'
import { dispatchAction } from '@xrengine/hyperflux'
import { loadEngineInjection } from '@xrengine/projects/loadEngineInjection'

import EditorContainer from '../components/EditorContainer'
import { EditorAction, useEditorState } from '../services/EditorServices'
import { registerEditorReceptors } from '../services/EditorServicesReceptor'
import EditorCameraSystem from '../systems/EditorCameraSystem'
import EditorControlSystem from '../systems/EditorControlSystem'
import EditorFlyControlSystem from '../systems/EditorFlyControlSystem'
import GizmoSystem from '../systems/GizmoSystem'
import ModelHandlingSystem from '../systems/ModelHandlingSystem'
import RenderSystem from '../systems/RenderSystem'

export const EditorPage = () => {
  const params = useParams()
  const editorState = useEditorState()
  const projectState = useProjectState()
  const authState = useAuthState()
  const authUser = authState.authUser
  const user = authState.user
  const [clientInitialized, setClientInitialized] = useState(false)
  const [isAuthenticated, setAuthenticated] = useState(false)

  const [engineReady, setEngineReady] = useState(true)

  const systems = [
    {
      uuid: 'core.editor.RenderSystem',
      systemLoader: () => Promise.resolve({ default: RenderSystem }),
      type: SystemUpdateType.POST_RENDER,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.EditorFlyControlSystem',
      systemLoader: () => Promise.resolve({ default: EditorFlyControlSystem }),
      type: SystemUpdateType.PRE_RENDER,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.EditorControlSystem',
      systemLoader: () => Promise.resolve({ default: EditorControlSystem }),
      type: SystemUpdateType.PRE_RENDER,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.EditorCameraSystem',
      systemLoader: () => Promise.resolve({ default: EditorCameraSystem }),
      type: SystemUpdateType.PRE_RENDER,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.GizmoSystem',
      systemLoader: () => Promise.resolve({ default: GizmoSystem }),
      type: SystemUpdateType.PRE_RENDER,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.PortalLoadSystem',
      systemLoader: () => Promise.resolve({ default: PortalLoadSystem }),
      type: SystemUpdateType.FIXED,
      args: { enabled: true }
    },
    {
      uuid: 'core.editor.ModelHandlingSystem',
      systemLoader: () => Promise.resolve({ default: ModelHandlingSystem }),
      type: SystemUpdateType.FIXED,
      args: { enabled: true }
    }
  ]

  useEffect(() => {
    Engine.instance.isEditor = true
    const world = Engine.instance.currentWorld
    const projects = API.instance.client.service('projects').find()
    ClientModules().then(async () => {
      initSystems(world, systems)
      await loadEngineInjection(world, await projects)
      setEngineReady(true)
      dispatchAction(EngineActions.initializeEngine({ initialised: true }))
    })
  }, [])

  useEffect(() => {
    registerEditorReceptors()
  }, [])

  useEffect(() => {
    const _isAuthenticated =
      authUser.accessToken.value != null && authUser.accessToken.value.length > 0 && user.id.value != null

    if (isAuthenticated !== _isAuthenticated) setAuthenticated(_isAuthenticated)
  }, [authUser.accessToken, user.id, isAuthenticated])

  useEffect(() => {
    const { projectName, sceneName } = params
    dispatchAction(EditorAction.projectChanged({ projectName: projectName ?? null }))
    dispatchAction(EditorAction.sceneChanged({ sceneName: sceneName ?? null }))
  }, [params])

  useEffect(() => {
    if (clientInitialized || projectState.projects.value.length <= 0) return
    setClientInitialized(true)
  }, [projectState.projects.value])

  return <>{editorState.projectName.value && isAuthenticated && engineReady && <EditorContainer />}</>
}
