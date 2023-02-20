import React from 'react'
import { useTranslation } from 'react-i18next'

import { useComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { getEntityErrors } from '@xrengine/engine/src/scene/components/ErrorComponent'
import { ImageComponent } from '@xrengine/engine/src/scene/components/ImageComponent'

import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual'

import ImageInput from '../inputs/ImageInput'
import InputGroup from '../inputs/InputGroup'
import ImageSourceProperties from './ImageSourceProperties'
import NodeEditor from './NodeEditor'
import ScreenshareTargetNodeEditor from './ScreenshareTargetNodeEditor'
import { EditorComponentType, updateProperty } from './Util'
import {StaticResourceService} from "@xrengine/client-core/src/media/services/StaticResourceService";

export const ImageNodeEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()
  const entity = props.node.entity
  const imageComponent = useComponent(entity, ImageComponent)
  const errors = getEntityErrors(props.node.entity, ImageComponent)

  const updateResources = async (path: string) => {
    const media = await StaticResourceService.uploadImage(path)
    updateProperty(ImageComponent, 'resource')(media)
  }

  return (
    <NodeEditor
      {...props}
      name={t('editor:properties.image.name')}
      description={t('editor:properties.image.description')}
    >
      <InputGroup name="Image Url" label={t('editor:properties.image.lbl-imgURL')}>
        <ImageInput value={imageComponent.source.value} onChange={updateResources} />
      </InputGroup>
      {errors && <div style={{ marginTop: 2, color: '#FF8C00' }}>{t('editor:properties.image.error-url')}</div>}
      <ImageSourceProperties node={props.node} multiEdit={props.multiEdit} />
      <ScreenshareTargetNodeEditor node={props.node} multiEdit={props.multiEdit} />
    </NodeEditor>
  )
}

ImageNodeEditor.iconComponent = PhotoSizeSelectActualIcon

export default ImageNodeEditor
