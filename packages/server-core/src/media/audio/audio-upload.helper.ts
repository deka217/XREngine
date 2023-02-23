
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
        if (!data.name) {
            console.log('Grabbing data name', data.url, data.url.split('/'), data.url.split('/').pop(), data.url.split('/').pop().split('.')[0])
            data.name = data.url.split('/').pop().split('.')[0]
            console.log('new data name', data.name)
        }
        const file = await fetch(data.url)
        console.log('file', file, file.status, file.headers)
        const extension = data.url.split('.').pop()
        const contentType = guessContentType(data.url)
        console.log('contentType', contentType)
        const body = Buffer.from(await file.arrayBuffer())
        console.log('body', body)
        const hash = createHash('sha3-256').update(body).digest('hex')
        console.log('audio hash', hash)
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
            const existingAudio = await app.service('audio').Model.findOne({
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
            console.log('matching audio', existingAudio)

            if (existingAudio) return existingAudio
            else {
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
                const update = {}
                if (existingResource?.id) {
                    const staticResourceColumn = `${extension}StaticResourceId`
                    update[staticResourceColumn] = existingResource.id
                }
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
        } else {
            let audioDuration
            if (extension === 'mp3') {
                audioDuration = await new Promise((resolve, reject) => mp3Duration(body, (err, duration) => {
                    console.log('mp3Duration', err, duration)
                    if (err) reject(err)
                    resolve(audioDuration = duration * 1000)
                }))
            } else {
                const stream = new Readable()
                stream.push(body)
                stream.push(null)
                console.log('readStream', stream)
                audioDuration = await getAudioDurationInSeconds(stream)
            }
            console.log('audio duration', audioDuration)
            const newAudio = await app.service('audio').create({
                duration: audioDuration
            })
            console.log('new audio', newAudio)
            console.log('data')
            const args = {}
            args.audioId = newAudio.id
            args.audioFileType = extension
            console.log('calling uploadAudioStaticResource')
            const [audio, thumbnail] = await uploadMediaStaticResource(
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

            console.log('uploaded audio and thumbnail resources', audio, thumbnail)
            const update = {} as any
            if (audio?.id) {
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = audio.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
            try {
                await app.service('audio').patch(newAudio.id, update)
            } catch (err) {
                logger.error('error updating audio with resources')
                logger.error(err)
                throw err
            }
            return app.service('audio').findOne({
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