
import { getAudioDurationInSeconds } from 'get-audio-duration'
import mp3Duration from 'mp3-duration'
import fetch from "node-fetch";
import {guessContentType} from "@xrengine/common/src/utils/guessContentType";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {uploadAudioStaticResource} from "../static-resource/static-resource-helper";
import {Application} from "../../../declarations";

export const audioUpload = async (app: Application, data, params) => {
    try {
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

        if (existingResource) {
            const searchParams = {} as any
            if (extension === 'mp3') searchParams.mp3StaticResourceId = hash

            const audio = await app.service('audio').Model.findOne({
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
                include: [
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
            })
            console.log('matching audio', audio)
            return audio
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
            const args = Object.assign({})
            args.audioId = newAudio.id
            args.audioFileType = extension
            console.log('calling uploadAudioStaticResource')
            const [audio, thumbnail] = await uploadAudioStaticResource(
                app,
                {
                    audio: body,
                    hash,
                    audioId: newAudio.id,
                    audioFileType: extension
                }
            )

            const updatedAudio = await app.service('audio').get(newAudio.id, {
                sequelize: {
                    include: [
                        {
                            model: app.service('static-resource').Model
                        }
                    ]
                }
            })
            console.log('audio to return', updatedAudio)
        }
    } catch (err) {
        logger.error('audio upload error')
        logger.error(err)
        throw err
    }
}