import { createState } from '@hookstate/core'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { WidgetAppService } from '@xrengine/engine/src/xrui/WidgetAppService'
import { WidgetName } from '@xrengine/engine/src/xrui/Widgets'
import Icon from '@xrengine/ui/src/Icon'

import XRTextButton from '../../components/XRTextButton'
import styleString from './index.scss?inline'

export function createSocialsMenuView() {
  return createXRUI(SocialsMenuView, createSocialsMenuState())
}

function createSocialsMenuState() {
  return createState({})
}

const SocialsMenuView = () => {
  const { t } = useTranslation()

  const handleOpenFriendMenuWidget = () => {
    // TODO open friend menu widget here...
  }

  const handleOpenPartyGroupMenuWidget = () => {
    // TODO open party group menu widget here...
  }

  const handleOpenMediaSessionsMenuWidget = () => {
    WidgetAppService.setWidgetVisibility(WidgetName.MEDIA_SESSION, true)
  }

  const handleOpenShareLocationMenuWidget = () => {
    WidgetAppService.setWidgetVisibility(WidgetName.SHARE_LOCATION, true)
  }

  return (
    <>
      <style>{styleString}</style>
      <div className="container" xr-layer="true">
        <h3 className="heading">{t('user:usermenu.socials.containerHeading')}</h3>
        <XRTextButton onClick={handleOpenFriendMenuWidget}>
          <Icon type="Group" />
          {t('user:usermenu.socials.btn-friend')}
        </XRTextButton>
        <XRTextButton onClick={handleOpenPartyGroupMenuWidget}>
          <Icon type="Groups" />
          {t('user:usermenu.socials.btn-party-group')}
        </XRTextButton>
        <XRTextButton onClick={handleOpenMediaSessionsMenuWidget}>
          <Icon type="Newspaper" />
          {t('user:usermenu.socials.btn-mediaSession')}
        </XRTextButton>
        <XRTextButton onClick={handleOpenShareLocationMenuWidget}>
          <Icon type="QrCode2" />
          {t('user:usermenu.socials.btn-share-invite')}
        </XRTextButton>
      </div>
    </>
  )
}

export default SocialsMenuView
