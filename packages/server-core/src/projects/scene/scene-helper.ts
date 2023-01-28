import { Paginated } from '@feathersjs/feathers'
import express from 'express'
import fetch from 'node-fetch'
import { Op } from 'sequelize'

import { AudioInterface } from '@xrengine/common/src/interfaces/AudioInterface'
import { EntityUUID } from '@xrengine/common/src/interfaces/EntityUUID'
import { PortalDetail } from '@xrengine/common/src/interfaces/PortalInterface'
import {ComponentJson} from '@xrengine/common/src/interfaces/SceneInterface'
import { StaticResourceInterface } from '@xrengine/common/src/interfaces/StaticResourceInterface'
import { MediaResource } from '@xrengine/engine/src/scene/components/MediaComponent'

import { Application } from '../../../declarations'
import { addGenericAssetToS3AndStaticResources } from '../../media/upload-asset/upload-asset.service'
import { parseScenePortals } from './scene-parser'
import { SceneParams } from './scene.service'

const FILE_NAME_REGEX = /(\w+\.\w+)$/

export const getAllPortals = (app: Application) => {
  return async (params?: SceneParams) => {
    params!.metadataOnly = false
    const scenes = (await app.service('scene-data').find(params!)).data
    return {
      data: scenes.map((scene) => parseScenePortals(scene)).flat()
    }
  }
}

export const getPortal = (app: any) => {
  return async (id: string, params?: SceneParams) => {
    params!.metadataOnly = false
    const scenes = await (await app.service('scene-data').find(params!)).data
    const portals = scenes.map((scene) => parseScenePortals(scene)).flat() as PortalDetail[]
    return {
      data: portals.find((portal) => portal.portalEntityId === id)
    }
  }
}

export const getEnvMapBake = (app: any) => {
  return async (req: express.Request, res: express.Response) => {
    const envMapBake = await getEnvMapBakeById(app, req.params.entityId)

    res.json(envMapBake)
  }
}

export const getEnvMapBakeById = async (app, entityId: string) => {
  // TODO: reimplement with new scene format
  // const models = app.get('sequelizeClient').models
  // return models.component.findOne({
  //   where: {
  //     type: 'envmapbake',
  //     '$entity.entityId$': entityId
  //   },
  //   include: [
  //     {
  //       model: models.entity,
  //       attributes: ['collectionId', 'name', 'entityId'],
  //       as: 'entity'
  //     }
  //   ]
  // })
}

export const uploadAudio = async (app: Application, component: ComponentJson, projectName: string) => {
  const resources = component?.props.resources as MediaResource[]
  console.log('resources on media', resources)
  for (const [, resource] of Object.entries(resources)) {
    if (resource.id) {
      const existingAudio = await app.service('audio').get(resource.id)
      console.log('existingAudio', existingAudio)
      if (existingAudio) delete resource.id
    }
    if (!resource.id) {
      console.log('creating audio for', resource, resource.path)
      const result = await fetch(resource.path)

      console.log('file fetch result', result)
      const dataBuffer = await result.buffer()
      console.log('audio buffer', dataBuffer)
      const filenameRegexExec = FILE_NAME_REGEX.exec(resource.path)
      const filename = filenameRegexExec ? filenameRegexExec[0] : 'untitled.mp3'

      const existingResource = (await app.service('static-resource').find({
        query: {
          [Op.or]: [
            {
              originalURL: resource.path
            },
            {
              url: resource.path
            }
          ]
        }
      })) as Paginated<StaticResourceInterface>
      if (existingResource.total === 0) {
        const newStaticResource = await addGenericAssetToS3AndStaticResources(app, dataBuffer, 'audio', {
          name: filename,
          key: `/audio/${filename}`,
          project: projectName,
          staticResourceType: 'audio'
        })

        console.log('new static resource', newStaticResource)
        const newAudio = await app.service('audio').create({
          name: resource.path,
          src: newStaticResource.id
        })
        console.log('new audio entity', newAudio)
        resource.id = newAudio.id as EntityUUID
      } else {
        const existingAudio = (await app.service('audio').find({
          query: {
            src: existingResource.data[0].id
          }
        })) as Paginated<AudioInterface>
        if (existingAudio.total > 0) {
          console.log('existing audio', existingAudio)
          resource.id = existingAudio.data[0].id as EntityUUID
        }
      }
    }
  }
}

export const uploadVideo = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadVolumetric = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadAnimation = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadMaterial = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadScript = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadCubemap = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadImage = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadSpawnPoint = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadEquippable = async (app: Application, component: ComponentJson, projectName: string) => {}

export const uploadModel = async (app: Application, component: ComponentJson, projectName: string) => {}
