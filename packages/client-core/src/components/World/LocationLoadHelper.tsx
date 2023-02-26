import { useNavigate } from 'react-router-dom'

import { LocationService } from '@xrengine/client-core/src/social/services/LocationService'
import config from '@xrengine/common/src/config'
import { SceneData } from '@xrengine/common/src/interfaces/SceneInterface'
import multiLogger from '@xrengine/common/src/logger'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions, EngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { initSystems, SystemModuleType } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { updateSceneFromJSON } from '@xrengine/engine/src/scene/systems/SceneLoadingSystem'
import { dispatchAction, getState } from '@xrengine/hyperflux'
import { loadEngineInjection } from '@xrengine/projects/loadEngineInjection'

import { API } from '../../API'
import { ClientModules } from '../../world/ClientModules'

const logger = multiLogger.child({ component: 'client-core:world' })

export const retrieveLocationByName = (locationName: string, userId: string) => {
  if (locationName === config.client.lobbyLocationName) {
    const navigate = useNavigate()
    LocationService.getLobby()
      .then((lobby) => {
        navigate('/location/' + lobby?.slugifiedName)
      })
      .catch((err) => logger.error(err, 'getLobby'))
  } else {
    LocationService.getLocationByName(locationName, userId)
  }
}

export const initClient = async (injectedSystems: SystemModuleType<any>[] = []) => {
  if (getState(EngineState).isEngineInitialized.value) return

  const world = Engine.instance.currentWorld
  const projects = API.instance.client.service('projects').find()

  await ClientModules()
  await initSystems(world, injectedSystems)
  await loadEngineInjection(world, await projects)

  dispatchAction(EngineActions.initializeEngine({ initialised: true }))
}

export const loadScene = async (sceneData: SceneData) => {
  EngineActions.sceneLoadingProgress({ progress: 0 })
  await updateSceneFromJSON(sceneData)
}
