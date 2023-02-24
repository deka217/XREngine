
import { getAudioDurationInSeconds } from 'get-audio-duration'
import mp3Duration from 'mp3-duration'
import fetch from "node-fetch";
import {guessContentType} from "@xrengine/common/src/utils/guessContentType";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import { uploadMediaStaticResource } from '../static-resource/static-resource-helper'
import {Application} from "../../../declarations";

export const audioUpload = async (app: Application, data, params) => {
    try {
        let fileHead = await fetch(data.url, {method: 'HEAD'})
        if (!/^[23]/.test(fileHead.status.toString())) throw new Error('Invalid URL')
        const contentLength = fileHead.headers['content-length'] || fileHead.headers.get('content-length')
        if (!data.name) data.name = data.url.split('/').pop().split('.')[0]
        const hash = createHash('sha3-256').update(contentLength).update(data.name).digest('hex')
        const extension = data.url.split('.').pop()
        let existingAudio, thumbnail
        let existingResource = await app.service('static-resource').Model.findOne({
            where: {
                hash
            }
        })

        const include = [
            {
                model: app.service('static-resource').Model,
                as: 'oggStaticResource'
            },
            {
                model: app.service('static-resource').Model,
                as: 'mp3StaticResource',
            },
            {
                model: app.service('static-resource').Model,
                as: 'mpegStaticResource',
            }
        ]

        if (existingResource) {
            existingAudio = await app.service('audio').Model.findOne({
                where: {
                    [Op.or]: [
                        {
                            mp3StaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            mpegStaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            oggStaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        }
                    ]
                },
                include
            })
        }

        if (existingResource && existingAudio) return existingAudio
        else {
            const file = await fetch(data.url)
            const body = Buffer.from(await file.arrayBuffer())
            let audioDuration
            if (extension === 'mp3') {
                audioDuration = await new Promise((resolve, reject) => mp3Duration(body, (err, duration) => {
                    if (err) reject(err)
                    resolve(audioDuration = duration * 1000)
                }))
            } else {
                const stream = new Readable()
                stream.push(body)
                stream.push(null)
                audioDuration = await getAudioDurationInSeconds(stream)
            }
            const newAudio = await app.service('audio').create({
                duration: audioDuration
            })
            if (!existingResource)
                [existingResource, thumbnail] = await uploadMediaStaticResource(
                    app,
                    {
                        media: body,
                        hash,
                        fileName: data.name,
                        mediaId: newAudio.id,
                        mediaFileType: extension
                    },
                    'audio'
                )
            const update = {} as any
            if (existingResource?.id) {
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = existingResource.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
             try {
                await app.service('audio').patch(newAudio.id, update)
             } catch(err) {
                 logger.error('error updating audio with resources')
                 logger.error(err)
                 throw err
             }
            return app.service('audio').Model.findOne({
                where: {
                    id: newAudio.id
                },
                include
            })
        }
    } catch (err) {
        logger.error('audio upload error')
        logger.error(err)
        throw err
    }
}