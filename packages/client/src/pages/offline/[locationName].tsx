import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { AppLoadingState } from '@xrengine/client-core/src/common/services/AppLoadingService'
import { LoadingCircle } from '@xrengine/client-core/src/components/LoadingCircle'
import { LocationIcons } from '@xrengine/client-core/src/components/LocationIcons'
import { LoadEngineWithScene } from '@xrengine/client-core/src/components/World/LoadEngineWithScene'
import { OfflineLocation } from '@xrengine/client-core/src/components/World/OfflineLocation'
import { LocationAction } from '@xrengine/client-core/src/social/services/LocationService'
import { DefaultLocationSystems } from '@xrengine/client-core/src/world/DefaultLocationSystems'
import { useEngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { dispatchAction, getState, useHookstate } from '@xrengine/hyperflux'

import { loadSceneJsonOffline } from './utils'

const LocationPage = () => {
  const { t } = useTranslation()
  const params = useParams()
  const appState = useHookstate(getState(AppLoadingState).state)

  useEffect(() => {
    dispatchAction(LocationAction.setLocationName({ locationName: `${params.projectName}/${params.sceneName}` }))
    loadSceneJsonOffline(params.projectName, params.sceneName)
  }, [])

  return (
    <>
      {appState.value === 'START_STATE' ? <LoadingCircle message={t('common:loader.loadingEngine')} /> : <></>}
      <LoadEngineWithScene injectedSystems={DefaultLocationSystems} />
      <OfflineLocation />
      <LocationIcons />
    </>
  )
}

export default LocationPage
