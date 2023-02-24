import { getVideoDurationInSeconds } from 'get-video-duration'
import fetch from "node-fetch";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {uploadMediaStaticResource} from "../static-resource/static-resource-helper";
import {Application} from "../../../declarations";

export const videoUpload = async (app: Application, data, parentId?: string, parentType?: string) => {
    try {
        let fileHead = await fetch(data.url, {method: 'HEAD'})
        if (parentType === 'volumetric') {
            if (!/^[23]/.test(fileHead.status.toString())) {
                let parts = data.url.split('.')
                if (parts.length === 2) parts.splice(1, 0, 'LOD0')
                // else if (parts.length === 3 && /LOD[0-9]?[0-9]/.test(parts[1]))
                //     parts[1] = 'LOD0'
                data.url = parts.join('.')
                fileHead = await fetch(data.url, {method: 'HEAD'})
            }
        }
        if (!/^[23]/.test(fileHead.status.toString())) throw new Error('Invalid URL')
        const contentLength = fileHead.headers['content-length'] || fileHead.headers.get('content-length')
        if (!data.name) data.name = data.url.split('/').pop().split('.')[0]
        const hash = createHash('sha3-256').update(contentLength).update(data.name).digest('hex')
        const extension = data.url.split('.').pop()
        let existingVideo, thumbnail
        let existingResource = await app.service('static-resource').Model.findOne({
            where: {
                hash
            }
        })

        const include = [
            {
                model: app.service('static-resource').Model,
                as: 'm3u8StaticResource'
            },
            {
                model: app.service('static-resource').Model,
                as: 'mp4StaticResource',
            }
        ]

        if (existingResource) {
            existingVideo = await app.service('video').Model.findOne({
                where: {
                    [Op.or]: [
                        {
                            mp4StaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            m3u8StaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        }
                    ]
                },
                include
            })
        }
        if (existingResource && existingVideo) return existingVideo
        else {
            const file = await fetch(data.url)
            const body = Buffer.from(await file.arrayBuffer())
            const stream = new Readable()
            stream.push(body)
            stream.push(null)
            const videoDuration = await getVideoDurationInSeconds(stream) * 1000
            const newVideo = await app.service('video').create({
                duration: videoDuration
            })
            if (!existingResource) {
                const uploadData = {
                    media: body,
                    hash,
                    fileName: data.name,
                    mediaId: newVideo.id,
                    mediaFileType: extension
                } as any
                if (parentId)
                    uploadData.parentId = parentId
                if (parentType)
                    uploadData.parentType = parentType;
                [existingResource, thumbnail] = await uploadMediaStaticResource(
                    app,
                    uploadData,
                    'video'
                )
            }
            const update = {} as any
            if (existingResource?.id) {
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = existingResource.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
            try {
                await app.service('video').patch(newVideo.id, update)
            } catch (err) {
                logger.error('error updating video with resources')
                logger.error(err)
                throw err
            }
            return app.service('video').Model.findOne({
                where: {
                    id: newVideo.id
                },
                include
            })
        }
    } catch (err) {
        logger.error('video upload error')
        logger.error(err)
        throw err
    }
}