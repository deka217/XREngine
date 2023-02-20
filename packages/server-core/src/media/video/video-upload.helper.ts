import { getVideoDurationInSeconds } from 'get-video-duration'
import fetch from "node-fetch";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {uploadMediaStaticResource} from "../static-resource/static-resource-helper";
import {Application} from "../../../declarations";

export const videoUpload = async (app: Application, data, mediaType = 'video') => {
    try {
        const file = await fetch(data.url)
        const extension = data.url.split('.').pop()
        const body = Buffer.from(await file.arrayBuffer())
        const hash = createHash('sha3-256').update(body).digest('hex')
        let existingResource
        try {
            existingResource = await app.service('static-resource').Model.findOne({
                where: {
                    hash
                }
            })
        } catch(err) {}
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
            return app.service('video').Model.findOne({
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
        } else {
            let videoDuration
            const stream = new Readable()
            stream.push(body)
            stream.push(null)
            videoDuration = await getVideoDurationInSeconds(stream) * 1000
            const newVideo = await app.service('video').create({
                duration: videoDuration
            })
            const [video, thumbnail] = await uploadMediaStaticResource(
                app,
                {
                    media: body,
                    hash,
                    mediaId: newVideo.id,
                    mediaFileType: extension
                },
                'video'
            )

            const update = {} as any
            if (video?.id) {
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = video.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
            try {
                await app.service('video').patch(newVideo.id, update)
            } catch (err) {
                logger.error('error updating video with resources')
                logger.error(err)
                throw err
            }
            return app.service('video').get(newVideo.id, {
                sequelize: {
                    include: include
                }
            })
        }
    } catch (err) {
        logger.error('video upload error')
        logger.error(err)
        throw err
    }
}