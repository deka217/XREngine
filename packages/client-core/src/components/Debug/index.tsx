import { getEntityComponents } from 'bitecs'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import JSONTree from 'react-json-tree'

import { mapToObject } from '@xrengine/common/src/utils/mapToObject'
import { AvatarControllerComponent } from '@xrengine/engine/src/avatar/components/AvatarControllerComponent'
import { respawnAvatar } from '@xrengine/engine/src/avatar/functions/respawnAvatar'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import {
  Component,
  getComponent,
  getOptionalComponent,
  hasComponent
} from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { entityExists } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { EntityTreeNode } from '@xrengine/engine/src/ecs/functions/EntityTree'
import { SystemInstance } from '@xrengine/engine/src/ecs/functions/SystemFunctions'
import { RendererState } from '@xrengine/engine/src/renderer/RendererState'
import { NameComponent } from '@xrengine/engine/src/scene/components/NameComponent'
import { getState, useHookstate } from '@xrengine/hyperflux'

import FormatColorResetIcon from '@mui/icons-material/FormatColorReset'
import GridOnIcon from '@mui/icons-material/GridOn'
import Refresh from '@mui/icons-material/Refresh'
import SelectAllIcon from '@mui/icons-material/SelectAll'
import SquareFootIcon from '@mui/icons-material/SquareFoot'

import { StatsPanel } from './StatsPanel'
import styles from './styles.module.scss'

export const Debug = ({ showingStateRef }) => {
  useHookstate(getState(EngineState).frameTime).value
  const rendererState = useHookstate(getState(RendererState))
  const engineState = useHookstate(getState(EngineState))
  const { t } = useTranslation()
  const hasActiveControlledAvatar =
    engineState.joinedWorld.value &&
    hasComponent(Engine.instance.currentWorld.localClientEntity, AvatarControllerComponent)

  const networks = mapToObject(Engine.instance.currentWorld.networks)

  const onClickRespawn = (): void => {
    respawnAvatar(Engine.instance.currentWorld.localClientEntity)
  }

  const toggleDebug = () => {
    rendererState.debugEnable.set(!rendererState.debugEnable.value)
  }

  const tree = Engine.instance.currentWorld.entityTree

  const renderEntityTree = (node: EntityTreeNode) => {
    return {
      entity: node.entity,
      uuid: node.uuid,
      components: renderEntityComponents(node.entity),
      children: {
        ...node.children.reduce(
          (r, child, i) =>
            Object.assign(r, {
              [`${i} - ${getComponent(child, NameComponent) ?? tree.entityNodeMap.get(child)?.uuid}`]: renderEntityTree(
                tree.entityNodeMap.get(child)!
              )
            }),
          {}
        )
      }
    }
  }

  const renderEntityComponents = (entity: Entity) => {
    return Object.fromEntries(
      entityExists(entity)
        ? getEntityComponents(Engine.instance.currentWorld, entity).reduce<[string, any][]>(
            (components, C: Component<any, any>) => {
              if (C !== NameComponent) {
                const component = getComponent(entity, C)
                components.push([C.name, { ...component }])
              }
              return components
            },
            []
          )
        : []
    )
  }

  const renderAllEntities = () => {
    return {
      ...Object.fromEntries(
        [...Engine.instance.currentWorld.entityQuery().entries()]
          .map(([key, eid]) => {
            const name = getOptionalComponent(eid, NameComponent)
            try {
              return [
                '(eid:' + eid + ') ' + (name ?? tree.entityNodeMap.get(eid)?.uuid ?? ''),
                renderEntityComponents(eid)
              ]
            } catch (e) {
              return null!
            }
          })
          .filter((exists) => !!exists)
      )
    }
  }

  const toggleNodeHelpers = () => {
    getState(RendererState).nodeHelperVisibility.set(!getState(RendererState).nodeHelperVisibility.value)
  }

  const toggleGridHelper = () => {
    getState(RendererState).gridVisibility.set(!getState(RendererState).gridVisibility.value)
  }

  const namedEntities = useHookstate({})
  const entityTree = useHookstate({})
  const pipelines = Engine.instance.currentWorld.pipelines

  namedEntities.set(renderAllEntities())
  entityTree.set(renderEntityTree(tree.rootNode))
  return (
    <div className={styles.debugContainer}>
      <div className={styles.debugOptionContainer}>
        <h1>{t('common:debug.debugOptions')}</h1>
        <div className={styles.optionBlock}>
          <div className={styles.flagContainer}>
            <button
              type="button"
              onClick={toggleDebug}
              className={styles.flagBtn + (rendererState.debugEnable.value ? ' ' + styles.active : '')}
              title={t('common:debug.debug')}
            >
              <SquareFootIcon fontSize="small" />
            </button>
            <button
              type="button"
              onClick={toggleNodeHelpers}
              className={styles.flagBtn + (rendererState.nodeHelperVisibility.value ? ' ' + styles.active : '')}
              title={t('common:debug.nodeHelperDebug')}
            >
              <SelectAllIcon fontSize="small" />
            </button>
            <button
              type="button"
              onClick={toggleGridHelper}
              className={styles.flagBtn + (rendererState.gridVisibility.value ? ' ' + styles.active : '')}
              title={t('common:debug.gridDebug')}
            >
              <GridOnIcon fontSize="small" />
            </button>
            <button
              type="button"
              onClick={() => rendererState.forceBasicMaterials.set(!rendererState.forceBasicMaterials.value)}
              className={styles.flagBtn + (rendererState.forceBasicMaterials.value ? ' ' + styles.active : '')}
              title={t('common:debug.forceBasicMaterials')}
            >
              <FormatColorResetIcon fontSize="small" />
            </button>
            {hasActiveControlledAvatar && (
              <button type="button" className={styles.flagBtn} id="respawn" onClick={onClickRespawn}>
                <Refresh />
              </button>
            )}
          </div>
        </div>
      </div>
      <StatsPanel show={showingStateRef.current} />
      <div className={styles.jsonPanel}>
        <h1>{t('common:debug.systems')}</h1>
        <JSONTree
          data={pipelines}
          postprocessValue={(v: SystemInstance) => {
            if (!v?.name) return v
            const s = new String(v.sceneSystem ? v.name : v.uuid) as any
            if (v.subsystems?.length) {
              s.parentSystem = v
              return {
                [s]: s,
                subsystems: v.subsystems
              }
            }
            s.instance = v
            return s
          }} // yes, all this is a hack. We probably shouldn't use JSONTree for this
          valueRenderer={(raw, value: { instance: SystemInstance; parentSystem: SystemInstance }) => {
            return value.parentSystem ? (
              <>
                <input
                  type="checkbox"
                  checked={value?.parentSystem?.enabled}
                  onChange={() => (value.parentSystem.enabled = !value.parentSystem.enabled)}
                ></input>
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={value?.instance?.enabled}
                  onChange={() => (value.instance.enabled = !value.instance.enabled)}
                ></input>{' '}
                — {value}
              </>
            )
          }}
          shouldExpandNode={(keyPath, data, level) => level > 0}
        />
      </div>
      <div className={styles.jsonPanel}>
        <h1>{t('common:debug.state')}</h1>
        <JSONTree data={Engine.instance.store.state} postprocessValue={(v) => v?.value ?? v} />
      </div>
      <div className={styles.jsonPanel}>
        <h1>{t('common:debug.entityTree')}</h1>
        <JSONTree data={entityTree.value} postprocessValue={(v) => v?.value ?? v} />
      </div>
      <div className={styles.jsonPanel}>
        <h1>{t('common:debug.entities')}</h1>
        <JSONTree data={namedEntities.value} postprocessValue={(v) => v?.value ?? v} />
      </div>
      <div className={styles.jsonPanel}>
        <h1>{t('common:debug.networks')}</h1>
        <JSONTree data={{ ...networks }} />
      </div>
    </div>
  )
}

export const DebugToggle = () => {
  const [isShowing, setShowing] = useState(false)
  const showingStateRef = useRef(isShowing)

  useEffect(() => {
    function downHandler({ keyCode }) {
      if (keyCode === 192) {
        showingStateRef.current = !showingStateRef.current
        setShowing(showingStateRef.current)
      }
    }
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [])

  return isShowing ? <Debug showingStateRef={showingStateRef} /> : <></>
}

export default DebugToggle
