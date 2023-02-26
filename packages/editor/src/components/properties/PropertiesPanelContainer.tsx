import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useForceUpdate } from '@xrengine/common/src/utils/useForceUpdate'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { getAllComponents } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { EntityTreeNode, getEntityTreeNodeByUUID } from '@xrengine/engine/src/ecs/functions/EntityTree'
import { MaterialComponentType } from '@xrengine/engine/src/renderer/materials/components/MaterialComponent'
import { getMaterialLibrary } from '@xrengine/engine/src/renderer/materials/MaterialLibrary'

import { EntityNodeEditor } from '../../functions/PrefabEditors'
import { useEditorState } from '../../services/EditorServices'
import { useSelectionState } from '../../services/SelectionServices'
import MaterialEditor from '../materials/MaterialEditor'
import { CoreNodeEditor } from './CoreNodeEditor'
import Object3DNodeEditor from './Object3DNodeEditor'

const StyledNodeEditor = styled.div``

/**
 * PropertiesPanelContent used as container element contains content of editor view.
 * @type {Styled Component}
 */
const PropertiesPanelContent = styled.div`
  overflow-y: auto;
  height: 100%;
`

/**
 * NoNodeSelectedMessage used to show the message when no selected no is there.
 *
 * @type {Styled component}
 */
const NoNodeSelectedMessage = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--textColor);
`

/**
 * PropertiesPanelContainer used to render editor view to customize property of selected element.
 *
 * @extends Component
 */
export const PropertiesPanelContainer = () => {
  const selectionState = useSelectionState()
  const editorState = useEditorState()
  const selectedEntities = selectionState.selectedEntities.value
  const { t } = useTranslation()

  const forceUpdate = useForceUpdate()

  // force react to re-render upon any object changing
  useEffect(() => {
    forceUpdate()
  }, [selectionState.objectChangeCounter])
  const materialLibrary = getMaterialLibrary()
  //rendering editor views for customization of element properties
  let content
  const world = Engine.instance.currentWorld
  const lockedNode = editorState.lockPropertiesPanel.value
  const multiEdit = selectedEntities.length > 1
  let nodeEntity = lockedNode
    ? getEntityTreeNodeByUUID(lockedNode)?.entity ?? lockedNode
    : selectedEntities[selectedEntities.length - 1]
  const isMaterial =
    typeof nodeEntity === 'string' &&
    (!!materialLibrary.materials[nodeEntity].value ||
      Object.values(materialLibrary.materials.value)
        .map(({ material }) => material.uuid)
        .includes(nodeEntity))
  const isObject3D = typeof nodeEntity === 'string' && !isMaterial
  const node = isMaterial
    ? materialLibrary.materials[nodeEntity as string].value ??
      Object.values(materialLibrary.materials.value).find(({ material }) => material.uuid === nodeEntity)
    : isObject3D
    ? world.scene.getObjectByProperty('uuid', nodeEntity as string)
    : world.entityTree.entityNodeMap.get(nodeEntity as Entity)

  if (!nodeEntity || !node) {
    content = <NoNodeSelectedMessage>{t('editor:properties.noNodeSelected')}</NoNodeSelectedMessage>
  } else if (isObject3D) {
    content = (
      <StyledNodeEditor>
        <Object3DNodeEditor multiEdit={multiEdit} node={node as EntityTreeNode} />
      </StyledNodeEditor>
    )
  } else if (isMaterial) {
    content = (
      <StyledNodeEditor>
        <MaterialEditor key={`${nodeEntity}-MaterialEditor`} material={(node as MaterialComponentType).material} />
      </StyledNodeEditor>
    )
  } else {
    nodeEntity = nodeEntity as Entity
    const components = getAllComponents(nodeEntity as Entity).filter((c) => EntityNodeEditor.has(c))

    content = (
      <StyledNodeEditor>
        <CoreNodeEditor node={node as EntityTreeNode} />
        {components.map((c, i) => {
          const Editor = EntityNodeEditor.get(c)!
          // nodeEntity is used as key here to signal to React when the entity has changed,
          // and to prevent state from being recycled between editor instances, which
          // can cause hookstate to throw errors.
          return (
            <Editor
              key={`${nodeEntity}-${Editor.name}`}
              multiEdit={multiEdit}
              node={node as EntityTreeNode}
              component={c}
            />
          )
        })}
      </StyledNodeEditor>
    )
  }

  return <PropertiesPanelContent>{content}</PropertiesPanelContent>
}

export default PropertiesPanelContainer
