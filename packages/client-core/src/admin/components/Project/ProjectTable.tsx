import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ConfirmDialog from '@xrengine/client-core/src/common/components/ConfirmDialog'
import { ProjectInterface } from '@xrengine/common/src/interfaces/ProjectInterface'
import multiLogger from '@xrengine/common/src/logger'
import Box from '@xrengine/ui/src/Box'
import Icon from '@xrengine/ui/src/Icon'
import IconButton from '@xrengine/ui/src/IconButton'
import Tooltip from '@xrengine/ui/src/Tooltip'

import { NotificationService } from '../../../common/services/NotificationService'
import { PROJECT_PAGE_LIMIT, ProjectService, useProjectState } from '../../../common/services/ProjectService'
import { useAuthState } from '../../../user/services/AuthService'
import TableComponent from '../../common/Table'
import { projectsColumns } from '../../common/variables/projects'
import styles from '../../styles/admin.module.scss'
import ProjectDrawer from './ProjectDrawer'
import ProjectFilesDrawer from './ProjectFilesDrawer'
import UserPermissionDrawer from './UserPermissionDrawer'

const logger = multiLogger.child({ component: 'client-core:ProjectTable' })

interface Props {
  className?: string
}

interface ConfirmData {
  open: boolean
  processing: boolean
  description: string
  onSubmit: () => void
}

const defaultConfirm: ConfirmData = {
  open: false,
  processing: false,
  description: '',
  onSubmit: () => {}
}

const ProjectTable = ({ className }: Props) => {
  const { t } = useTranslation()
  const [processing, setProcessing] = useState(false)
  const [confirm, setConfirm] = useState({ ...defaultConfirm })
  const [project, _setProject] = useState<ProjectInterface | undefined>()
  const [showProjectFiles, setShowProjectFiles] = useState(false)
  const [openProjectDrawer, setOpenProjectDrawer] = useState(false)
  const [openUserPermissionDrawer, setOpenUserPermissionDrawer] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PROJECT_PAGE_LIMIT)
  const [changeDestination, setChangeDestination] = useState(false)

  const adminProjectState = useProjectState()
  const adminProjects = adminProjectState.projects
  const adminProjectCount = adminProjects.value.length
  const authState = useAuthState()
  const user = authState.user

  const projectRef = useRef(project)

  const setProject = (project: ProjectInterface | undefined) => {
    projectRef.current = project
    _setProject(project)
  }

  ProjectService.useAPIListeners()

  useEffect(() => {
    if (project) setProject(adminProjects.value.find((proj) => proj.name === project.name)!)
  }, [adminProjects])

  const handleRemoveProject = async () => {
    try {
      if (projectRef.current) {
        const projectToRemove = adminProjects.value.find((p) => p.name === projectRef.current?.name)!
        if (projectToRemove) {
          await ProjectService.removeProject(projectToRemove.id)
          handleCloseConfirmation()
        } else {
          throw new Error('Failed to find the project')
        }
      }
    } catch (err) {
      logger.error(err)
    }
  }

  const handlePushProjectToGithub = async () => {
    try {
      if (projectRef.current) {
        if (!projectRef.current.repositoryPath && projectRef.current.name !== 'default-project') return

        setProcessing(true)
        await ProjectService.pushProject(projectRef.current.id)
        setProcessing(false)

        handleCloseConfirmation()
      }
    } catch (err) {
      setProcessing(false)
      logger.error(err)
    }
  }

  const handleInvalidateCache = async () => {
    try {
      setProcessing(true)
      await ProjectService.invalidateProjectCache(projectRef.current!.name)
      setProcessing(false)

      handleCloseConfirmation()
    } catch (err) {
      setProcessing(false)
      logger.error(err)
    }
  }

  const openPushConfirmation = (row) => {
    setProject(row)

    setConfirm({
      open: true,
      processing: processing,
      description: `${t('admin:components.project.confirmPushProjectToGithub')}? ${row.name} - ${row.repositoryPath}`,
      onSubmit: handlePushProjectToGithub
    })
  }

  const openInvalidateConfirmation = (row) => {
    setProject(row)

    setConfirm({
      open: true,
      processing: processing,
      description: `${t('admin:components.project.confirmProjectInvalidate')} '${row.name}'?`,
      onSubmit: handleInvalidateCache
    })
  }

  const openRemoveConfirmation = (row) => {
    setProject(row)

    setConfirm({
      open: true,
      processing: false,
      description: `${t('admin:components.project.confirmProjectDelete')} '${row.name}'?`,
      onSubmit: handleRemoveProject
    })
  }

  const openViewProject = (row) => {
    setProject(row)
    setShowProjectFiles(true)
  }

  const handleOpenProjectDrawer = (row, changeDestination = false) => {
    setProject(row)
    setChangeDestination(changeDestination)
    setOpenProjectDrawer(true)
  }

  const handleOpenUserPermissionDrawer = (row) => {
    setProject(row)
    setOpenUserPermissionDrawer(true)
  }

  const handleCloseProjectDrawer = () => {
    setChangeDestination(false)
    setOpenProjectDrawer(false)
    setProject(undefined)
  }

  const handleCloseUserPermissionDrawer = () => {
    setOpenUserPermissionDrawer(false)
    setProject(undefined)
  }

  const handleCloseConfirmation = () => {
    setConfirm({ ...confirm, open: false })
    setConfirm({ ...defaultConfirm })
    setProject(undefined)
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const copyShaToClipboard = (sha: string) => {
    navigator.clipboard.writeText(sha)
    NotificationService.dispatchNotify(t('admin:components.project.commitSHACopied'), {
      variant: 'success'
    })
  }

  const isAdmin = user.scopes?.value?.find((scope) => scope.type === 'admin:admin')

  const createData = (el: ProjectInterface, name: string) => {
    const commitSHA = el.commitSHA
    return {
      el,
      name: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <span className={`${el.needsRebuild ? styles.orangeColor : ''}`}>{name}</span>
          {el.needsRebuild && (
            <Tooltip title={t('admin:components.project.outdatedBuild')} arrow>
              <Icon type="ErrorOutline" sx={{ marginLeft: 1 }} className={styles.orangeColor} />
            </Tooltip>
          )}
        </Box>
      ),
      projectVersion: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <span>{el.version}</span>
        </Box>
      ),
      commitSHA: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <div className={styles.commitContents}>
            {commitSHA?.substring(0, 8)}
            {commitSHA ? <Icon type="ContentCopy" onClick={() => copyShaToClipboard(commitSHA)} /> : '-'}
          </div>
        </Box>
      ),
      commitDate: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <span>
            {el.commitDate
              ? new Date(el.commitDate).toLocaleString('en-us', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })
              : '-'}
          </span>
        </Box>
      ),
      update: (
        <>
          {isAdmin && name !== 'default-project' && (
            <IconButton
              className={styles.iconButton}
              name="update"
              disabled={el.repositoryPath === null}
              onClick={() => handleOpenProjectDrawer(el)}
              icon={<Icon type="Download" />}
            />
          )}
          {isAdmin && name === 'default-project' && (
            <Tooltip title={t('admin:components.project.defaultProjectUpdateTooltip')} arrow>
              <IconButton className={styles.iconButton} name="update" disabled={true} icon={<Icon type="Download" />} />
            </Tooltip>
          )}
        </>
      ),
      push: (
        <>
          {isAdmin && (
            <IconButton
              className={styles.iconButton}
              name="update"
              disabled={!el.hasWriteAccess || !el.repositoryPath}
              onClick={() => openPushConfirmation(el)}
              icon={<Icon type="Upload" />}
            />
          )}
        </>
      ),
      link: (
        <>
          <IconButton
            className={styles.iconButton}
            name="update"
            disabled={name === 'default-project'}
            onClick={() => handleOpenProjectDrawer(el, true)}
            icon={<Icon type={!el.repositoryPath ? 'LinkOff' : 'Link'} />}
          />
        </>
      ),
      projectPermissions: (
        <>
          {isAdmin && (
            <IconButton
              className={styles.iconButton}
              name="editProjectPermissions"
              onClick={() => handleOpenUserPermissionDrawer(el)}
              icon={<Icon type="Group" />}
            />
          )}
        </>
      ),
      invalidate: (
        <>
          {isAdmin && (
            <IconButton
              className={styles.iconButton}
              name="invalidate"
              onClick={() => openInvalidateConfirmation(el)}
              icon={<Icon type="CleaningServices" />}
            />
          )}
        </>
      ),
      view: (
        <>
          {isAdmin && (
            <IconButton
              className={styles.iconButton}
              name="view"
              onClick={() => openViewProject(el)}
              icon={<Icon type="Visibility" />}
            />
          )}
        </>
      ),
      action: (
        <>
          {isAdmin && (
            <IconButton
              className={styles.iconButton}
              name="remove"
              onClick={() => openRemoveConfirmation(el)}
              icon={<Icon type="Cancel" />}
            />
          )}
        </>
      )
    }
  }

  const rows = adminProjects.value?.map((el) => {
    return createData(el, el.name)
  })

  return (
    <Box className={className}>
      <TableComponent
        allowSort={true}
        rows={rows}
        column={projectsColumns}
        page={page}
        rowsPerPage={rowsPerPage}
        count={adminProjectCount}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
      />

      {openProjectDrawer && project && (
        <ProjectDrawer
          open={openProjectDrawer}
          changeDestination={changeDestination}
          inputProject={project}
          existingProject={true}
          onClose={() => handleCloseProjectDrawer()}
        />
      )}

      {project && (
        <UserPermissionDrawer
          open={openUserPermissionDrawer}
          project={project}
          onClose={handleCloseUserPermissionDrawer}
        />
      )}

      {showProjectFiles && project && (
        <ProjectFilesDrawer open selectedProject={project} onClose={() => setShowProjectFiles(false)} />
      )}

      <ConfirmDialog
        open={confirm.open}
        description={confirm.description}
        onClose={handleCloseConfirmation}
        onSubmit={confirm.onSubmit}
      />
    </Box>
  )
}

export default ProjectTable
