import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'

import { AppLoadingState } from '@xrengine/client-core/src/common/services/AppLoadingService'
import { LoadingCircle } from '@xrengine/client-core/src/components/LoadingCircle'
import { LocationIcons } from '@xrengine/client-core/src/components/LocationIcons'
import { LoadEngineWithScene } from '@xrengine/client-core/src/components/World/LoadEngineWithScene'
import LoadLocationScene from '@xrengine/client-core/src/components/World/LoadLocationScene'
import NetworkInstanceProvisioning from '@xrengine/client-core/src/components/World/NetworkInstanceProvisioning'
import { OfflineLocation } from '@xrengine/client-core/src/components/World/OfflineLocation'
import { FriendService } from '@xrengine/client-core/src/social/services/FriendService'
import { LocationAction, useLocationState } from '@xrengine/client-core/src/social/services/LocationService'
import { AuthService } from '@xrengine/client-core/src/user/services/AuthService'
import { DefaultLocationSystems } from '@xrengine/client-core/src/world/DefaultLocationSystems'
import { SceneService } from '@xrengine/client-core/src/world/services/SceneService'
import { dispatchAction, getState, useHookstate, useState } from '@xrengine/hyperflux'

const LocationPage = () => {
  const { t } = useTranslation()
  const params = useParams()
  const { search } = useLocation()
  const locationState = useLocationState()
  const offline = new URLSearchParams(search).get('offline') === 'true'
  const appState = useHookstate(getState(AppLoadingState).state)

  const locationName = params.locationName ?? `${params.projectName}/${params.sceneName}`

  AuthService.useAPIListeners()
  SceneService.useAPIListeners()
  FriendService.useAPIListeners()

  useEffect(() => {
    dispatchAction(LocationAction.setLocationName({ locationName }))
  }, [])

  /**
   * Once we have the location, fetch the current scene data
   */
  useEffect(() => {
    if (locationState.currentLocation.location.sceneId.value) {
      const [project, scene] = locationState.currentLocation.location.sceneId.value.split('/')
      SceneService.fetchCurrentScene(project, scene)
    }
  }, [locationState.currentLocation.location.sceneId])

  return (
    <>
      {appState.value === 'START_STATE' ? <LoadingCircle message={t('common:loader.loadingEngine')} /> : <></>}
      <LoadEngineWithScene injectedSystems={DefaultLocationSystems} />
      {offline ? <OfflineLocation /> : <NetworkInstanceProvisioning />}
      <LoadLocationScene />
      <LocationIcons />
    </>
  )
}

export default LocationPage
