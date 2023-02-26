import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import {
  AuthSettingsService,
  AuthSettingsServiceReceptor,
  useAuthSettingState
} from '@xrengine/client-core/src/admin/services/Setting/AuthSettingService'
import {
  ClientSettingsServiceReceptor,
  useClientSettingState
} from '@xrengine/client-core/src/admin/services/Setting/ClientSettingService'
import ErrorBoundary from '@xrengine/client-core/src/common/components/ErrorBoundary'
import { AppLoadingServiceReceptor } from '@xrengine/client-core/src/common/services/AppLoadingService'
import { AppServiceReceptor } from '@xrengine/client-core/src/common/services/AppService'
import { DialogServiceReceptor } from '@xrengine/client-core/src/common/services/DialogService'
import { MediaInstanceConnectionServiceReceptor } from '@xrengine/client-core/src/common/services/MediaInstanceConnectionService'
import { ProjectServiceReceptor } from '@xrengine/client-core/src/common/services/ProjectService'
import { RouterServiceReceptor, RouterState, useRouter } from '@xrengine/client-core/src/common/services/RouterService'
import { LoadingCircle } from '@xrengine/client-core/src/components/LoadingCircle'
import { FriendServiceReceptor } from '@xrengine/client-core/src/social/services/FriendService'
import { InviteService, InviteServiceReceptor } from '@xrengine/client-core/src/social/services/InviteService'
import { LocationServiceReceptor } from '@xrengine/client-core/src/social/services/LocationService'
import { AuthService, AuthServiceReceptor } from '@xrengine/client-core/src/user/services/AuthService'
import { AvatarServiceReceptor } from '@xrengine/client-core/src/user/services/AvatarService'
import { addActionReceptor, getState, removeActionReceptor, useHookstate } from '@xrengine/hyperflux'

import $404 from '../pages/404'
import $503 from '../pages/503'
import { CustomRoute, getCustomRoutes } from './getCustomRoutes'

const $index = lazy(() => import('@xrengine/client/src/pages'))
const $auth = lazy(() => import('@xrengine/client/src/pages/auth/authRoutes'))
const $offline = lazy(() => import('@xrengine/client/src/pages/offline/offline'))
const $custom = lazy(() => import('@xrengine/client/src/route/customRoutes'))
const $admin = lazy(() => import('@xrengine/client-core/src/admin/adminRoutes'))

function RouterComp() {
  const [customRoutes, setCustomRoutes] = useState(null as any as CustomRoute[])
  const clientSettingsState = useClientSettingState()
  const authSettingsState = useAuthSettingState()
  const location = useLocation()
  const navigate = useNavigate()
  const [routesReady, setRoutesReady] = useState(false)
  const routerState = useHookstate(getState(RouterState))
  const route = useRouter()
  const { t } = useTranslation()

  InviteService.useAPIListeners()

  useEffect(() => {
    addActionReceptor(RouterServiceReceptor)
    addActionReceptor(ClientSettingsServiceReceptor)
    addActionReceptor(AuthSettingsServiceReceptor)
    addActionReceptor(AuthServiceReceptor)
    addActionReceptor(AvatarServiceReceptor)
    addActionReceptor(InviteServiceReceptor)
    addActionReceptor(LocationServiceReceptor)
    addActionReceptor(DialogServiceReceptor)
    addActionReceptor(AppLoadingServiceReceptor)
    addActionReceptor(AppServiceReceptor)
    addActionReceptor(ProjectServiceReceptor)
    addActionReceptor(MediaInstanceConnectionServiceReceptor)
    addActionReceptor(FriendServiceReceptor)

    // Oauth callbacks may be running when a guest identity-provider has been deleted.
    // This would normally cause doLoginAuto to make a guest user, which we do not want.
    // Instead, just skip it on oauth callbacks, and the callback handler will log them in.
    // The client and auth settigns will not be needed on these routes
    if (!/auth\/oauth/.test(location.pathname)) {
      AuthService.doLoginAuto()
      AuthSettingsService.fetchAuthSetting()
    }
    getCustomRoutes().then((routes) => {
      setCustomRoutes(routes)
    })

    return () => {
      removeActionReceptor(RouterServiceReceptor)
      removeActionReceptor(ClientSettingsServiceReceptor)
      removeActionReceptor(AuthSettingsServiceReceptor)
      removeActionReceptor(AuthServiceReceptor)
      removeActionReceptor(AvatarServiceReceptor)
      removeActionReceptor(InviteServiceReceptor)
      removeActionReceptor(LocationServiceReceptor)
      removeActionReceptor(DialogServiceReceptor)
      removeActionReceptor(AppServiceReceptor)
      removeActionReceptor(AppLoadingServiceReceptor)
      removeActionReceptor(ProjectServiceReceptor)
      removeActionReceptor(MediaInstanceConnectionServiceReceptor)
      removeActionReceptor(FriendServiceReceptor)
    }
  }, [])

  useEffect(() => {
    if (location.pathname !== routerState.pathname.value) {
      route(location.pathname)
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname !== routerState.pathname.value) {
      navigate(routerState.pathname.value)
    }
  }, [routerState.pathname])

  useEffect(() => {
    // For the same reason as above, we will not need to load the client and auth settings for these routes
    if (/auth\/oauth/.test(location.pathname) && customRoutes) return setRoutesReady(true)
    if (clientSettingsState.client.value.length && authSettingsState.authSettings.value.length && customRoutes)
      return setRoutesReady(true)
  }, [clientSettingsState.client.length, authSettingsState.authSettings.length, customRoutes])

  if (!routesReady) {
    return <LoadingCircle message={t('common:loader.loadingRoutes')} />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingCircle message={t('common:loader.loadingRoute')} />}>
        <Routes>
          <Route key={'custom'} path={'/*'} element={<$custom customRoutes={customRoutes} />} />
          <Route key={'offline'} path={'/offline/*'} element={<$offline />} />
          {/* default to allowing admin access regardless */}
          <Route key={'default-admin'} path={'/admin/*'} element={<$admin />} />
          <Route key={'default-auth'} path={'/auth/*'} element={<$auth />} />
          <Route key={'default-index'} path={'/'} element={<$index />} />
          {/* if no index page has been provided, indicate this as obviously as possible */}
          <Route key={'/503'} path={'/'} element={<$503 />} />
          <Route key={'404'} path="*" element={<$404 />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default RouterComp
