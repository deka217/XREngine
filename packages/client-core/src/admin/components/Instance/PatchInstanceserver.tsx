import { useState } from '@hookstate/core'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@xrengine/client-core/src/common/components/InputSelect'
import InputText from '@xrengine/client-core/src/common/components/InputText'
import Button from '@xrengine/ui/src/Button'
import Container from '@xrengine/ui/src/Container'
import DialogActions from '@xrengine/ui/src/DialogActions'
import DialogTitle from '@xrengine/ui/src/DialogTitle'

import { useAuthState } from '../../../user/services/AuthService'
import DrawerView from '../../common/DrawerView'
import { InstanceserverService } from '../../services/InstanceserverService'
import { AdminLocationService, useAdminLocationState } from '../../services/LocationService'
import styles from '../../styles/admin.module.scss'

interface Props {
  open: boolean
  onClose: () => void
}

const PatchInstanceserver = ({ open, onClose }: Props) => {
  const state = useState({
    location: '',
    locationError: '',
    count: 1
  })

  const { t } = useTranslation()
  const authState = useAuthState()
  const user = authState.user
  const adminLocationState = useAdminLocationState()
  const location = adminLocationState
  const adminLocations = adminLocationState.locations

  useEffect(() => {
    if (user?.id.value && adminLocationState.updateNeeded.value) {
      AdminLocationService.fetchAdminLocations()
    }
  }, [user?.id?.value, adminLocationState.updateNeeded.value])

  const locationsMenu: InputMenuItem[] = adminLocations.value.map((el) => {
    return {
      label: el.name,
      value: el.id
    }
  })

  useEffect(() => {
    if (location.created.value) {
      onClose()
      state.location.set('')
    }
  }, [location.created])

  const handleChangeLocation = (e) => {
    const { value } = e.target
    state.merge({
      location: value,
      locationError: value.length < 2 ? 'Location is required!' : ''
    })
  }

  const handleChangeCount = (e) => {
    const { value } = e.target
    state.count.set(value)
  }

  const handleSubmit = () => {
    let locationError = ''
    if (!state.location.value) {
      locationError = "Location can't be empty"
      state.locationError.set(locationError)
    } else {
      InstanceserverService.patchInstanceserver(state.location.value, state.count.value)
      onClose()
    }
  }

  return (
    <DrawerView open={open} onClose={onClose}>
      <Container maxWidth="sm" className={styles.mt20}>
        <DialogTitle className={styles.textAlign}>{t('admin:components.setting.patchInstanceserver')}</DialogTitle>

        <InputSelect
          name="location"
          label={t('admin:components.instance.location')}
          value={state.location.value}
          error={state.locationError.value}
          menu={locationsMenu}
          onChange={handleChangeLocation}
        />
        <InputText
          type="number"
          name="location"
          label={t('admin:components.instance.count')}
          value={state.count.value}
          onChange={handleChangeCount}
        />
        <DialogActions>
          <Button onClick={onClose} className={styles.outlinedButton}>
            {t('admin:components.common.cancel')}
          </Button>
          <Button className={styles.gradientButton} onClick={handleSubmit}>
            {t('admin:components.common.submit')}
          </Button>
        </DialogActions>
      </Container>
    </DrawerView>
  )
}

export default PatchInstanceserver
