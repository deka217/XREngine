import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import commonStyles from '@xrengine/client-core/src/common/components/common.module.scss'
import LoadingView from '@xrengine/client-core/src/common/components/LoadingView'
import Text from '@xrengine/client-core/src/common/components/Text'
import {
  loadAvatarForPreview,
  resetAnimationLogic,
  validate
} from '@xrengine/client-core/src/user/components/Panel3D/helperFunctions'
import { useRender3DPanelSystem } from '@xrengine/client-core/src/user/components/Panel3D/useRender3DPanelSystem'
import { AvatarRigComponent } from '@xrengine/engine/src/avatar/components/AvatarAnimationComponent'
import { getOptionalComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import Box from '@xrengine/ui/src/Box'
import Icon from '@xrengine/ui/src/Icon'
import Tooltip from '@xrengine/ui/src/Tooltip'

import { SxProps, Theme } from '@mui/material/styles'

import styles from './index.module.scss'

interface Props {
  fill?: boolean
  avatarUrl?: string
  sx?: SxProps<Theme>
  onAvatarError?: (error: string) => void
  onAvatarLoaded?: () => void
}

const AvatarPreview = ({ fill, avatarUrl, sx, onAvatarError, onAvatarLoaded }: Props) => {
  const { t } = useTranslation()
  const panelRef = useRef() as React.MutableRefObject<HTMLDivElement>

  const [avatarLoading, setAvatarLoading] = useState(false)

  const renderPanel = useRender3DPanelSystem(panelRef)
  const { entity, camera, scene, renderer } = renderPanel.state

  useEffect(() => {
    loadAvatarPreview()
  }, [avatarUrl])

  const loadAvatarPreview = async () => {
    const oldAvatar = scene.value.children.find((item) => item.name === 'avatar')
    if (oldAvatar) {
      scene.value.remove(oldAvatar)
    }

    if (!avatarUrl) return

    setAvatarLoading(true)
    resetAnimationLogic(entity.value)
    const avatar = await loadAvatarForPreview(entity.value, avatarUrl)

    if (!avatar) return

    avatar.name = 'avatar'
    scene.value.add(avatar)

    const error = validate(avatar, renderer.value, scene.value, camera.value)
    onAvatarError && onAvatarError(error)

    const avatarRigComponent = getOptionalComponent(entity.value, AvatarRigComponent)
    if (avatarRigComponent) {
      avatarRigComponent.rig.Neck.getWorldPosition(camera.value.position)
      camera.value.position.y += 0.2
      camera.value.position.z = 0.6
    }
    setAvatarLoading(false)
    onAvatarLoaded && onAvatarLoaded()
  }

  return (
    <Box className={`${commonStyles.preview} ${fill ? styles.fill : ''}`} sx={sx}>
      <div ref={panelRef} id="stage" className={`${styles.stage} ${fill ? styles.fill : ''}`} />

      {avatarLoading && (
        <LoadingView
          title={t('admin:components.avatar.loading')}
          variant="body2"
          sx={{ position: 'absolute', top: 0 }}
        />
      )}

      {!avatarUrl && (
        <Text className={commonStyles.previewText} variant="body2">
          {t('admin:components.avatar.avatarPreview')}
        </Text>
      )}

      <Tooltip
        arrow
        title={
          <Box sx={{ width: 100 }}>
            <Text variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {t('user:avatar.rotate')}:
            </Text>
            <Text variant="body2" sx={{ display: 'flex', justifyContent: 'center' }}>
              {t('admin:components.avatar.leftClick')}
              <Icon type="Mouse" fontSize="small" />
            </Text>

            <br />

            <Text variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {t('user:avatar.pan')}:
            </Text>
            <Text variant="body2" sx={{ display: 'flex', justifyContent: 'center' }}>
              {t('admin:components.avatar.rightClick')} <Icon type="Mouse" fontSize="small" />
            </Text>

            <br />

            <Text variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {t('admin:components.avatar.zoom')}:
            </Text>
            <Text variant="body2" sx={{ display: 'flex', justifyContent: 'center' }}>
              {t('admin:components.avatar.scroll')} <Icon type="Mouse" fontSize="small" />
            </Text>
          </Box>
        }
      >
        <Icon type="Help" sx={{ position: 'absolute', top: 0, right: 0, margin: 1 }} />
      </Tooltip>
    </Box>
  )
}

export default AvatarPreview
