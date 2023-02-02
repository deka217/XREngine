
import * as ffprobe from '@ffprobe-installer/ffprobe'

import execa from 'execa'
import isStream from 'is-stream'

import { getVideoDurationInSeconds } from 'get-video-duration'
import fetch from "node-fetch";
import {guessContentType} from "@xrengine/common/src/utils/guessContentType";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {uploadMediaStaticResource} from "../static-resource/static-resource-helper";
import {Application} from "../../../declarations";

const getFFprobeWrappedExecution = (
    input: string | Readable,
    ffprobePath?: string
): execa.ExecaChildProcess => {
    const params = ['-v', 'error', '-show_format', '-show_streams']

    const overridenPath = ffprobePath || ffprobe.path

    if (typeof input === 'string') {
        return execa(overridenPath, [...params, input])
    }

    if (isStream(input)) {
        return execa(overridenPath, [...params, '-i', 'pipe:0'], {
            reject: false,
            input,
        })
    }

    throw new Error('Given input was neither a string nor a Stream')
}

export const videoUpload = async (app: Application, data, params) => {
    try {
        const file = await fetch(data.url)
        console.log('file', file, file.status, file.headers)
        const extension = data.url.split('.').pop()
        const contentType = guessContentType(data.url)
        console.log('contentType', contentType)
        const body = Buffer.from(await file.arrayBuffer())
        console.log('body', body)
        const hash = createHash('sha3-256').update(body).digest('hex')
        console.log('video hash', hash)
        let existingResource
        try {
            existingResource = await app.service('static-resource').Model.findOne({
                where: {
                    hash
                }
            })
        } catch(err) {}
        const stream = new Readable()
        stream.push(body)
        stream.push(null)
        console.log('readStream', stream)
        const { stdout } = await getFFprobeWrappedExecution(stream)
        console.log('stdout', stdout)
        if (existingResource) {
            const searchParams = {} as any
            if (extension === 'mp3') searchParams.mp3StaticResourceId = hash

            const video = await app.service('video').Model.findOne({
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
                include: [
                    {
                        model: app.service('static-resource').Model,
                        as: 'm3u8StaticResource'
                    },
                    {
                        model: app.service('static-resource').Model,
                        as: 'mp4StaticResource',
                    }
                ]
            })
            console.log('matching video', video)
            return video
        } else {
            let videoDuration
            const stream = new Readable()
            stream.push(body)
            stream.push(null)
            console.log('readStream', stream)
            videoDuration = await getVideoDurationInSeconds(stream) * 1000
            console.log('video duration', videoDuration)
            const newVideo = await app.service('video').create({
                duration: videoDuration
            })
            console.log('new video', newVideo)
            console.log('data')
            const args = Object.assign({})
            args.videoId = newVideo.id
            args.videoFileType = extension
            console.log('calling uploadVideoStaticResource')
            const [video, thumbnail] = await uploadMediaStaticResource(
                app,
                {
                    media: body,
                    hash,
                    mediaId: newVideo.id,
                    mediaFileType: extension
                }
            )

            console.log('uploaded video and thumbnail resources', video, thumbnail)
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
                    include: [
                        {
                            model: app.service('static-resource').Model,
                            as: 'm3u8StaticResource'
                        },
                        {
                            model: app.service('static-resource').Model,
                            as: 'mp4StaticResource',
                        }
                    ]
                }
            })
        }
    } catch (err) {
        logger.error('video upload error')
        logger.error(err)
        throw err
    }
}