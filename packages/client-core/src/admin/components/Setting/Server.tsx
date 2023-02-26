import { Icon } from '@iconify/react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import InputSwitch from '@xrengine/client-core/src/common/components/InputSwitch'
import InputText from '@xrengine/client-core/src/common/components/InputText'
import { useHookstate } from '@xrengine/hyperflux'

import { Box, Button, Grid, Typography } from '@mui/material'

import { useAuthState } from '../../../user/services/AuthService'
import { ServerSettingService, useServerSettingState } from '../../services/Setting/ServerSettingService'
import styles from '../../styles/settings.module.scss'

const Server = () => {
  const { t } = useTranslation()

  const authState = useAuthState()
  const user = authState.user
  const serverSettingState = useServerSettingState()
  const [serverSetting] = serverSettingState?.server?.value || []
  const id = serverSetting?.id

  const gaTrackingId = useHookstate(serverSetting?.gaTrackingId)
  const githubWebhookSecret = useHookstate(serverSetting?.githubWebhookSecret)
  const instanceserverUnreachableTimeoutSeconds = useHookstate(serverSetting?.instanceserverUnreachableTimeoutSeconds)
  const [dryRun, setDryRun] = useState(true)
  const [local, setLocal] = useState(true)

  useEffect(() => {
    if (serverSetting) {
      gaTrackingId.set(serverSetting?.gaTrackingId)
      githubWebhookSecret.set(serverSetting?.githubWebhookSecret)
      instanceserverUnreachableTimeoutSeconds.set(serverSetting?.instanceserverUnreachableTimeoutSeconds)
    }
  }, [serverSettingState?.updateNeeded?.value])

  const handleSubmit = (event) => {
    ServerSettingService.patchServerSetting(
      {
        gaTrackingId: gaTrackingId.value,
        githubWebhookSecret: githubWebhookSecret.value,
        instanceserverUnreachableTimeoutSeconds: instanceserverUnreachableTimeoutSeconds.value
      },
      id
    )
  }

  const handleCancel = () => {
    gaTrackingId.set(serverSetting?.gaTrackingId)
    githubWebhookSecret.set(serverSetting?.githubWebhookSecret)
  }

  useEffect(() => {
    if (user?.id?.value != null && serverSettingState?.updateNeeded?.value === true) {
      ServerSettingService.fetchServerSettings()
    }
  }, [authState?.user?.id?.value, serverSettingState?.updateNeeded?.value])

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.server')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <InputText
            name="mode"
            label={t('admin:components.setting.mode')}
            value={serverSetting?.mode || 'test'}
            disabled
          />

          <InputText
            name="hostName"
            label={t('admin:components.setting.hostName')}
            value={serverSetting?.hostname || 'test'}
            disabled
          />

          <InputText
            name="port"
            label={t('admin:components.setting.port')}
            value={serverSetting?.port || ''}
            disabled
          />

          <InputText
            name="clientHost"
            label={t('admin:components.setting.clientHost')}
            value={serverSetting?.clientHost || ''}
            disabled
          />

          <InputText
            name="rootDir"
            label={t('admin:components.setting.rootDirectory')}
            value={serverSetting?.rootDir || ''}
            disabled
          />

          <InputText
            name="publicDir"
            label={t('admin:components.setting.publicDirectory')}
            value={serverSetting?.publicDir || ''}
            disabled
          />

          <InputText
            name="nodeModulesDir"
            label={t('admin:components.setting.nodeModulesDirectory')}
            value={serverSetting?.nodeModulesDir || ''}
            disabled
          />

          <InputText
            name="localStorageProvider"
            label={t('admin:components.setting.localStorageProvider')}
            value={serverSetting?.localStorageProvider || ''}
            disabled
          />

          <InputSwitch
            name="performDryRun"
            label={t('admin:components.setting.performDryRun')}
            checked={dryRun}
            disabled
            onChange={(event) => setDryRun(event.target.checked)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputText
            name="storageProvider"
            label={t('admin:components.setting.storageProvider')}
            value={serverSetting?.storageProvider || ''}
            disabled
          />

          <InputText
            name="gaTrackingId"
            label={t('admin:components.setting.googleAnalyticsTrackingId')}
            value={gaTrackingId.value || ''}
            startAdornment={<Icon style={{ marginRight: 8 }} fontSize={18} icon="emojione:key" />}
            onChange={(e) => gaTrackingId.set(e.target.value)}
          />

          <InputText
            name="hub"
            label={t('admin:components.setting.hub')}
            value={serverSetting?.hub?.endpoint || ''}
            disabled
          />

          <InputText name="paginateDefault" label={t('admin:components.setting.paginateDefault')} value="10" disabled />

          <InputText
            name="paginateMax"
            label={t('admin:components.setting.paginateMax')}
            value={serverSetting?.paginate || ''}
            disabled
          />

          <InputText name="url" label={t('admin:components.setting.url')} value={serverSetting?.url || ''} disabled />

          <InputText
            name="certPath"
            label={t('admin:components.setting.certPath')}
            value={serverSetting?.certPath || ''}
            disabled
          />

          <InputText
            name="keyPath"
            label={t('admin:components.setting.keyPath')}
            value={serverSetting?.keyPath || ''}
            disabled
          />

          <InputText
            name="githubWebhookSecret"
            label={t('admin:components.setting.githubWebhookSecret')}
            value={githubWebhookSecret.value || ''}
            onChange={(e) => githubWebhookSecret.set(e.target.value)}
          />

          <InputText
            name="releaseName"
            label={t('admin:components.setting.releaseName')}
            value={serverSetting?.releaseName || ''}
            disabled
          />

          <InputText
            name="releaseName"
            label={t('admin:components.setting.instanceserverUnreachableTimeoutSeconds')}
            value={instanceserverUnreachableTimeoutSeconds.value}
            onChange={(e) => instanceserverUnreachableTimeoutSeconds.set(e.target.value)}
          />

          <InputSwitch
            name="local"
            label={t('admin:components.setting.local')}
            checked={local}
            disabled
            onChange={(event) => setLocal(event.target.checked)}
          />
        </Grid>
      </Grid>
      <Button sx={{ maxWidth: '100%' }} className={styles.outlinedButton} onClick={handleCancel}>
        {t('admin:components.common.cancel')}
      </Button>
      <Button sx={{ maxWidth: '100%', ml: 1 }} className={styles.gradientButton} onClick={handleSubmit}>
        {t('admin:components.common.save')}
      </Button>
    </Box>
  )
}

export default Server
