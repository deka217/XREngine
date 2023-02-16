import * as ffprobe from '@ffprobe-installer/ffprobe'

import execa from 'execa'
import isStream from 'is-stream'

import fetch from "node-fetch";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {Application} from "../../../declarations";
import {addGenericAssetToS3AndStaticResources} from "../upload-asset/upload-asset.service";
import {UserParams} from "../../user/user/user.class";
import { videoUpload } from '../video/video-upload.helper'

const getFFprobeWrappedExecution = (
    input: string | Readable,
    ffprobePath?: string
): execa.ExecaChildProcess => {
    const params = ['-v', 'error', '-show_format', '-show_streams']

    const overriddenPath = ffprobePath || ffprobe.path

    if (typeof input === 'string') {
        return execa(overriddenPath, [...params, input])
    }

    if (isStream(input)) {
        return execa(overriddenPath, [...params, '-i', 'pipe:0'], {
            reject: false,
            input,
        })
    }

    throw new Error('Given input was neither a string nor a Stream')
}

const handleManifest = async(app: Application, params: UserParams, url: string) => {
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
        const key = `static-resources/volumetric/${hash}`
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

const handleDrcs = async(app: Application, params: UserParams, url: string) => {
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
    const stream = new Readable()
    stream.push(body)
    stream.push(null)
    console.log('readStream', stream)
    const { stdout } = await getFFprobeWrappedExecution(stream)
    console.log('stdout', stdout)
    if (existingResource) return existingResource
    else {
        const key = `static-resources/volumetric/${hash}/${name}.manifest`
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
        const videoUrl = `${root}.mp4`
        const drcsUrl = `${root}.drcs`
        const manifestUrl = `${root}.manifest`

        const [video, manifest, drcs] = await Promise.all([
            videoUpload(app, { url: videoUrl }, 'volumetric'),
            handleManifest(app, params, manifestUrl),
            handleDrcs(app, params, drcsUrl)
        ])

        console.log('Got children')

        const existingVolumetric = await app.service('volumetric').Model.findOne({
            where: {
                [Op.or]: [
                    {
                        drcsStaticResourceId: {
                            [Op.eq]: drcs.id
                        }
                    }
                ]
            },
            include: [
                {
                    model: app.service('static-resource').Model,
                    as: 'drcsStaticResource'
                }
            ]
        })
        console.log('existingVolumetric', existingVolumetric)
        if (existingVolumetric) {
            return existingVolumetric
        } else {
            const newVolumetric = await app.service('volumetric').create({
                drcsStaticResourceId: drcs.id,
                videoId: video.id,
                manifestId: manifest.id
            })

            return app.service('volumetric').Model.findOne({
                where: {
                    id: newVolumetric.id
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
                        model: app.service('data').Model
                    },
                    {
                        model: app.service('image').Model
                    },
                    {
                        model: app.service('video').Model
                    }
                ]
            })
        }
    } catch (err) {
        logger.error('volumetric upload error')
        logger.error(err)
        throw err
    }
}

//https://resources-dev.etherealengine.com/volumetric/biglatto_bigenergy.drcs