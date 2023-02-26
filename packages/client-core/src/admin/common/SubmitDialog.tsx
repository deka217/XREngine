import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Box from '@xrengine/ui/src/Box'
import Button from '@xrengine/ui/src/Button'
import Dialog from '@xrengine/ui/src/Dialog'
import DialogActions from '@xrengine/ui/src/DialogActions'
import DialogContent from '@xrengine/ui/src/DialogContent'
import DialogContentText from '@xrengine/ui/src/DialogContentText'
import DialogTitle from '@xrengine/ui/src/DialogTitle'
import TextField from '@xrengine/ui/src/TextField'

import ProfileMenu from '../../user/components/UserMenu/menus/ProfileMenu'
import SettingMenu from '../../user/components/UserMenu/menus/SettingMenu'
import { Views } from '../../user/components/UserMenu/util'
import styles from '../styles/admin.module.scss'

const FormDialog = () => {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(true)
  const [selectedMenu, setSelectedMenu] = useState(Views.Profile)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        classes={{ paper: styles.paperDialog }}
      >
        <DialogTitle id="form-dialog-title"> {t('admin:components.dialog.noAccess')}</DialogTitle>
        <DialogContent>
          <DialogContentText className={`${styles.spanNone} ${styles.mgBottom}`}>
            {t('admin:components.dialog.askAccessResourceMessage')}
          </DialogContentText>
          <TextField autoFocus id="name" label="Username" type="text" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className={styles.outlinedButton}>
            {t('admin:components.dialog.login')}
          </Button>
          <Button onClick={handleClose} className={styles.gradientButton}>
            {t('admin:components.common.submit')}
          </Button>
        </DialogActions>
      </Dialog>
      {!open && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            position: 'absolute'
          }}
        >
          <Box sx={{ width: '50%' }}>
            {selectedMenu === Views.Profile && (
              <ProfileMenu isPopover changeActiveMenu={(type) => setSelectedMenu(type ? type : Views.Profile)} />
            )}
            {selectedMenu === Views.Settings && (
              <SettingMenu isPopover changeActiveMenu={(type) => setSelectedMenu(type ? type : Views.Profile)} />
            )}
          </Box>
        </Box>
      )}
    </div>
  )
}

export default FormDialog
