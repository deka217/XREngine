import fetch from "node-fetch";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {Application} from "../../../declarations";
import {addGenericAssetToS3AndStaticResources} from "../upload-asset/upload-asset.service";
import {UserParams} from "../../user/user/user.class";
import { videoUpload } from '../video/video-upload.helper'

const handleManifest = async(app: Application, params: UserParams, url: string, name="untitled") => {
    const file = await fetch(url)
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
    if (existingResource) {
        const data = await app.service('data').Model.findOne({
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
        console.log('matching data', data)
        if (data) return data
        else return app.service('data').create({
            staticResourceId: existingResource.id
        })
    }
    else {
        const key = `static-resources/data/${hash}/${name}`
        const dataResource = await addGenericAssetToS3AndStaticResources(app, body, 'application/octet-stream', {
            hash: hash,
            key: `${key}.manifest`,
            staticResourceType: 'data'
        })
        return app.service('data').create({
            staticResourceId: dataResource.id
        })
    }
}

const handleDrcs = async(app: Application, params: UserParams, url: string, name="untitled") => {
    const file = await fetch(url)
    const extension = url.split('.').pop()
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
    if (existingResource) return existingResource
    else {
        const key = `static-resources/volumetric/${hash}/${name}`
        return addGenericAssetToS3AndStaticResources(app, body, 'application/octet-stream', {
            hash: hash,
            key: `${key}.${extension}`,
            staticResourceType: 'volumetric'
        })
    }
}

export const volumetricUpload = async (app: Application, data, params) => {
    try {
        const root = data.url.replace(/.drcs$/, '')
        const name = root.split('/').pop()
        const videoUrl = `${root}.mp4`
        const drcsUrl = `${root}.drcs`
        const manifestUrl = `${root}.manifest`

        console.log('video, drcs, manifest url', videoUrl, drcsUrl, manifestUrl)
        const [video, manifest, drcs] = await Promise.all([
            videoUpload(app, { url: videoUrl, name }, 'volumetric'),
            handleManifest(app, params, manifestUrl, name),
            handleDrcs(app, params, drcsUrl, name)
        ])

        console.log('Got children')

        let existingVolumetric = await app.service('volumetric').Model.findOne({
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
        console.log('existingVolumetric', existingVolumetric)
        if (existingVolumetric) {
            await app.service('volumetric').patch(existingVolumetric.id, {
                drcsStaticResourceId: drcs.id,
                videoId: video.id,
                manifestId: manifest.id
            })
        } else {
            existingVolumetric = await app.service('volumetric').create({
                drcsStaticResourceId: drcs.id,
                videoId: video.id,
                manifestId: manifest.id
            })
        }

        return app.service('volumetric').Model.findOne({
            where: {
                id: existingVolumetric.id
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