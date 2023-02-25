import fetch from "node-fetch";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {Application} from "../../../declarations";
import {addGenericAssetToS3AndStaticResources} from "../upload-asset/upload-asset.service";
import {UserParams} from "../../user/user/user.class";
import { videoUpload } from '../video/video-upload.helper'

const handleManifest = async(app: Application, url: string, name="untitled", volumetricId: string) => {
    const drcsFileHead = await fetch(url, {method: 'HEAD'})
    if (!/^[23]/.test(drcsFileHead.status.toString())) throw new Error('Invalid URL')
    const contentLength = drcsFileHead.headers['content-length'] || drcsFileHead.headers.get('content-length')
    if (!name) name = url.split('/').pop().split('.')[0]
    const hash = createHash('sha3-256').update(contentLength).update(name).digest('hex')
    let existingData

    let existingResource = await app.service('static-resource').Model.findOne({
        where: {
            hash
        }
    })
    if (existingResource) {
        existingData = await app.service('data').Model.findOne({
            where: {
                [Op.or]: [
                    {
                        staticResourceId: {
                            [Op.eq]: existingResource.id
                        }
                    }
                ]
            },
            include: [
                {
                    model: app.service('static-resource').Model,
                    as: 'staticResource'
                }
            ]
        })
    }
    if (existingResource && existingData) return existingData
    else {
        if (!existingResource) {
            const file = await fetch(url)
            const body = Buffer.from(await file.arrayBuffer())
            const key = `static-resources/volumetric/${volumetricId}/${name}`
            existingResource = await addGenericAssetToS3AndStaticResources(app, body, 'application/octet-stream', {
                hash: hash,
                key: `${key}.manifest`,
                staticResourceType: 'data'
            })
        }
        return app.service('data').create({
            staticResourceId: existingResource.id
        })
    }
}

export const volumetricUpload = async (app: Application, data) => {
    try {
        console.log('volumetric upload data', data)
        const root = data.url.replace(/.drcs$/, '').replace(/.mp4$/, '')
        const name = root.split('/').pop()
        const videoUrl = `${root}.mp4`
        const drcsUrl = `${root}.drcs`
        const manifestUrl = `${root}.manifest`
        let volumetricEntry, video, manifest

        const drcsFileHead = await fetch(drcsUrl, {method: 'HEAD'})
        if (!/^[23]/.test(drcsFileHead.status.toString())) throw new Error('Invalid URL')
        const contentLength = drcsFileHead.headers['content-length'] || drcsFileHead.headers.get('content-length')
        if (!data.name) data.name = data.url.split('/').pop().split('.')[0]
        const hash = createHash('sha3-256').update(contentLength).update(data.name).digest('hex')
        const extension = drcsUrl.split('.').pop()

        let drcs = await app.service('static-resource').Model.findOne({
            where: {
                hash
            }
        })
        if (!drcs) {
            const drcsFile = await fetch(drcsUrl)
            const drcsBody = Buffer.from(await drcsFile.arrayBuffer())
            volumetricEntry = await app.service('volumetric').create({})
            const key = `static-resources/volumetric/${volumetricEntry.id}/${name}`
            drcs = await addGenericAssetToS3AndStaticResources(app, drcsBody, 'application/octet-stream', {
                hash: hash,
                key: `${key}.${extension}`,
                staticResourceType: 'volumetric'
            })
        } else {
            volumetricEntry = await app.service('volumetric').Model.findOne({
                where: {
                    [Op.or]: [
                        {
                            drcsStaticResourceId: {
                                [Op.eq]: drcs.id
                            }
                        }
                    ]
                }
            })
            if (!volumetricEntry) volumetricEntry = await app.service('volumetric').create({
                drcsStaticResourceId: drcs.id
            })
        }

        [video, manifest] = await Promise.all([
            videoUpload(app, { url: videoUrl, name }, volumetricEntry.id, 'volumetric'),
            handleManifest(app, manifestUrl, name, volumetricEntry.id)
        ])

        await app.service('volumetric').patch(volumetricEntry.id, {
            drcsStaticResourceId: drcs.id,
            videoId: video.id,
            manifestId: manifest.id
        })

        return app.service('volumetric').Model.findOne({
            where: {
                id: volumetricEntry.id
            },
            include: [
                {
                    model: app.service('static-resource').Model,
                    as: 'drcsStaticResource'
                },
                {
                    model: app.service('static-resource').Model,
                    as: 'uvolStaticResource'
                },
                {
                    model: app.service('data').Model,
                    as: 'manifest',
                    include: [
                        {
                            model: app.service('static-resource').Model,
                            as: 'staticResource'
                        }
                    ]
                },
                {
                    model: app.service('image').Model,
                    as: 'thumbnail',
                    include: [
                        {
                            model: app.service('static-resource').Model,
                            as: 'pngStaticResource'
                        },
                        {
                            model: app.service('static-resource').Model,
                            as: 'ktx2StaticResource'
                        },
                        {
                            model: app.service('static-resource').Model,
                            as: 'jpegStaticResource'
                        },
                        {
                            model: app.service('static-resource').Model,
                            as: 'gifStaticResource'
                        }
                    ]
                },
                {
                    model: app.service('video').Model,
                    as: 'video',
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
            ]
        })
    } catch (err) {
        logger.error('volumetric upload error')
        logger.error(err)
        throw err
    }
}

//https://resources-dev.etherealengine.com/volumetric/biglatto_bigenergy.drcs