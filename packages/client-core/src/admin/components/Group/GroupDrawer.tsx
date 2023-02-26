import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AutoComplete, { AutoCompleteData } from '@xrengine/client-core/src/common/components/AutoComplete'
import InputText from '@xrengine/client-core/src/common/components/InputText'
import { CreateGroup, Group, GroupScope } from '@xrengine/common/src/interfaces/Group'
import Avatar from '@xrengine/ui/src/Avatar'
import Box from '@xrengine/ui/src/Box'
import Button from '@xrengine/ui/src/Button'
import Container from '@xrengine/ui/src/Container'
import DialogActions from '@xrengine/ui/src/DialogActions'
import DialogContentText from '@xrengine/ui/src/DialogContentText'
import DialogTitle from '@xrengine/ui/src/DialogTitle'
import Grid from '@xrengine/ui/src/Grid'
import Typography from '@xrengine/ui/src/Typography'

import { NotificationService } from '../../../common/services/NotificationService'
import { useAuthState } from '../../../user/services/AuthService'
import DrawerView from '../../common/DrawerView'
import { validateForm } from '../../common/validation/formValidation'
import { AdminGroupService } from '../../services/GroupService'
import { AdminScopeTypeService, useScopeTypeState } from '../../services/ScopeTypeService'
import styles from '../../styles/admin.module.scss'

export enum GroupDrawerMode {
  Create,
  ViewEdit
}

interface Props {
  open: boolean
  mode: GroupDrawerMode
  selectedGroup?: Group
  onClose: () => void
}

const defaultState = {
  name: '',
  description: '',
  scopeTypes: [] as Array<GroupScope>,
  formErrors: {
    name: '',
    description: '',
    scopeTypes: ''
  }
}

const GroupDrawer = ({ open, mode, selectedGroup, onClose }: Props) => {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)
  const [state, setState] = useState({ ...defaultState })

  const { user } = useAuthState().value
  const { scopeTypes } = useScopeTypeState().value

  const hasWriteAccess = user.scopes && user.scopes.find((item) => item.type === 'groups:write')
  const viewMode = mode === GroupDrawerMode.ViewEdit && editMode === false

  const scopeMenu: AutoCompleteData[] = scopeTypes.map((el) => {
    return {
      type: el.type
    }
  })

  if (selectedGroup) {
    for (const scope of selectedGroup.scopes || []) {
      const scopeExists = scopeMenu.find((item) => item.type === scope.type)
      if (!scopeExists) {
        scopeMenu.push({
          type: scope.type
        })
      }
    }
  }

  useEffect(() => {
    AdminScopeTypeService.getScopeTypeService()
  }, [])

  useEffect(() => {
    loadSelectedGroup()
  }, [selectedGroup])

  const loadSelectedGroup = () => {
    if (selectedGroup) {
      setState({
        ...defaultState,
        name: selectedGroup.name || '',
        description: selectedGroup.description || '',
        scopeTypes: selectedGroup.scopes || []
      })
    }
  }

  const handleCancel = () => {
    if (editMode) {
      loadSelectedGroup()
      setEditMode(false)
    } else handleClose()
  }

  const handleClose = () => {
    onClose()
    setState({ ...defaultState })
  }

  const handleChangeScopeType = (scope) => {
    let tempErrors = {
      ...state.formErrors,
      scopeTypes: scope.length < 1 ? t('admin:components.group.scopeTypeRequired') : ''
    }

    setState({ ...state, scopeTypes: scope, formErrors: tempErrors })
  }

  const handleSelectAllScopes = () =>
    handleChangeScopeType(
      scopeTypes.map((el) => {
        return { type: el.type }
      })
    )

  const handleClearAllScopes = () => handleChangeScopeType([])

  const handleChange = (e) => {
    const { name, value } = e.target

    let tempErrors = { ...state.formErrors }

    switch (name) {
      case 'name':
        tempErrors.name = value.length < 2 ? t('admin:components.group.nameRequired') : ''
        break
      case 'description':
        tempErrors.description = value.length < 2 ? t('admin:components.group.descriptionRequired') : ''
        break
      default:
        break
    }

    setState({ ...state, [name]: value, formErrors: tempErrors })
  }

  const handleSubmit = async () => {
    const data: CreateGroup = {
      name: state.name,
      description: state.description,
      scopes: state.scopeTypes
    }

    let tempErrors = {
      ...state.formErrors,
      name: state.name ? '' : t('admin:components.group.nameCantEmpty'),
      description: state.description ? '' : t('admin:components.group.descriptionCantEmpty'),
      scopeTypes: state.scopeTypes.length > 0 ? '' : t('admin:components.group.scopeTypeCantEmpty')
    }

    setState({ ...state, formErrors: tempErrors })

    if (validateForm(state, tempErrors)) {
      if (mode === GroupDrawerMode.Create) {
        await AdminGroupService.createGroupByAdmin(data)
      } else if (selectedGroup) {
        AdminGroupService.patchGroupByAdmin(selectedGroup.id, data)
        setEditMode(false)
      }

      handleClose()
    } else {
      NotificationService.dispatchNotify(t('admin:components.common.fillRequiredFields'), { variant: 'error' })
    }
  }

  return (
    <DrawerView open={open} onClose={onClose}>
      <Container maxWidth="sm" className={styles.mt20}>
        <DialogTitle className={styles.textAlign}>
          {mode === GroupDrawerMode.Create && t('admin:components.group.createGroup')}
          {mode === GroupDrawerMode.ViewEdit &&
            editMode &&
            `${t('admin:components.common.update')} ${selectedGroup?.name}`}
          {mode === GroupDrawerMode.ViewEdit && !editMode && selectedGroup?.name}
        </DialogTitle>

        <InputText
          name="name"
          label={t('admin:components.group.name')}
          value={state.name}
          error={state.formErrors.name}
          disabled={viewMode}
          onChange={handleChange}
        />

        <InputText
          name="description"
          label={t('admin:components.group.description')}
          value={state.description}
          error={state.formErrors.description}
          disabled={viewMode}
          onChange={handleChange}
        />

        {viewMode && (
          <AutoComplete
            data={scopeMenu}
            label={t('admin:components.group.grantScope')}
            value={state.scopeTypes}
            disabled
          />
        )}

        {!viewMode && (
          <div>
            <AutoComplete
              data={scopeMenu}
              label={t('admin:components.group.grantScope')}
              value={state.scopeTypes}
              onChange={handleChangeScopeType}
            />
            <div className={styles.scopeButtons}>
              <Button className={styles.outlinedButton} onClick={handleSelectAllScopes}>
                {t('admin:components.user.selectAllScopes')}
              </Button>
              <Button className={styles.outlinedButton} onClick={handleClearAllScopes}>
                {t('admin:components.user.clearAllScopes')}
              </Button>
            </div>
          </div>
        )}

        {viewMode && (
          <DialogContentText className={`${styles.dialogContentText} ${styles.textAlign}`} sx={{ mb: 2 }}>
            {t('admin:components.group.groupUsers')}
          </DialogContentText>
        )}

        {viewMode && (!selectedGroup || !selectedGroup.scopes) && (
          <DialogContentText className={`${styles.dialogContentText} ${styles.textAlign}`}>
            {t('admin:components.common.none')}
          </DialogContentText>
        )}

        <Grid container sx={{ mb: 1 }}>
          {viewMode &&
            selectedGroup?.groupUsers?.map((groupUser) => (
              <Grid
                item
                key={groupUser.id}
                xs={12}
                md={6}
                sm={6}
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 1 }}
              >
                <Avatar sx={{ textTransform: 'uppercase' }}>{groupUser.user.name.slice(0, 1)}</Avatar>
                <Box sx={{ flexGrow: 1, ml: 1 }}>
                  <Typography>{groupUser.user.name}</Typography>
                  <Typography variant="body2">{groupUser.groupUserRank}</Typography>
                </Box>
              </Grid>
            ))}
        </Grid>

        <DialogActions>
          <Button className={styles.outlinedButton} onClick={handleCancel}>
            {t('admin:components.common.cancel')}
          </Button>
          {(mode === GroupDrawerMode.Create || editMode) && (
            <Button className={styles.gradientButton} onClick={handleSubmit}>
              {t('admin:components.common.submit')}
            </Button>
          )}
          {mode === GroupDrawerMode.ViewEdit && !editMode && (
            <Button className={styles.gradientButton} disabled={!hasWriteAccess} onClick={() => setEditMode(true)}>
              {t('admin:components.common.edit')}
            </Button>
          )}
        </DialogActions>
      </Container>
    </DrawerView>
  )
}

export default GroupDrawer
