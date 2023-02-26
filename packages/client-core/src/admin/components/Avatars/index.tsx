import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ConfirmDialog from '@xrengine/client-core/src/common/components/ConfirmDialog'
import { AvatarClientModule } from '@xrengine/engine/src/avatar/AvatarClientModule'
import { AvatarCommonModule } from '@xrengine/engine/src/avatar/AvatarCommonModule'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { initSystems, unloadSystems } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { SceneClientModule } from '@xrengine/engine/src/scene/SceneClientModule'
import { SceneCommonModule } from '@xrengine/engine/src/scene/SceneCommonModule'
import { TransformModule } from '@xrengine/engine/src/transform/TransformModule'
import Box from '@xrengine/ui/src/Box'
import Button from '@xrengine/ui/src/Button'
import Grid from '@xrengine/ui/src/Grid'
import Icon from '@xrengine/ui/src/Icon'
import IconButton from '@xrengine/ui/src/IconButton'

import Search from '../../common/Search'
import { AdminAvatarService } from '../../services/AvatarService'
import styles from '../../styles/admin.module.scss'
import AvatarDrawer, { AvatarDrawerMode } from './AvatarDrawer'
import AvatarTable from './AvatarTable'

const Avatar = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [openAvatarDrawer, setOpenAvatarDrawer] = useState(false)
  const [openDeleteAvatarModal, setOpenDeleteAvatarModal] = React.useState(false)
  const [selectedAvatarIds, setSelectedAvatarIds] = useState(() => new Set<string>())

  useEffect(() => {
    const systems = [
      ...TransformModule(),
      ...SceneCommonModule(),
      ...SceneClientModule(),
      ...AvatarCommonModule(),
      ...AvatarClientModule()
    ]
    initSystems(Engine.instance.currentWorld, systems)
    return () => {
      unloadSystems(
        Engine.instance.currentWorld,
        systems.map((s) => s.uuid)
      )
    }
  }, [])

  const handleChange = (e: any) => {
    setSearch(e.target.value)
  }

  const handleDeleteAll = () => {
    for (let id of selectedAvatarIds) AdminAvatarService.removeAdminAvatar(id)
    setOpenDeleteAvatarModal(false)
  }

  return (
    <React.Fragment>
      <Grid container spacing={1} className={styles.mb10px}>
        <Grid item xs={12} sm={8}>
          <Search text="avatar" handleChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex' }}>
            <Button
              className={styles.openModalBtn}
              type="submit"
              variant="contained"
              onClick={() => setOpenAvatarDrawer(true)}
            >
              {t('user:avatar.createAvatar')}
            </Button>

            {selectedAvatarIds.size > 0 && (
              <IconButton
                className={styles.filterButton}
                sx={{ ml: 1 }}
                size="small"
                title={t('admin:components.avatar.deleteSelected')}
                onClick={() => setOpenDeleteAvatarModal(true)}
                icon={<Icon type="Delete" color="info" fontSize="large" />}
              />
            )}
          </Box>
        </Grid>
      </Grid>
      <AvatarTable
        className={styles.rootTableWithSearch}
        search={search}
        selectedAvatarIds={selectedAvatarIds}
        setSelectedAvatarIds={setSelectedAvatarIds}
      />

      {openAvatarDrawer && (
        <AvatarDrawer open mode={AvatarDrawerMode.Create} onClose={() => setOpenAvatarDrawer(false)} />
      )}

      <ConfirmDialog
        open={openDeleteAvatarModal}
        description={t('admin:components.avatar.confirmMultiDelete')}
        onSubmit={handleDeleteAll}
        onClose={() => setOpenDeleteAvatarModal(false)}
      />
    </React.Fragment>
  )
}

export default Avatar
