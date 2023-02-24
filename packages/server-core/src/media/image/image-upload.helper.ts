import probe from 'probe-image-size'

import execa from 'execa'
import isStream from 'is-stream'

import fetch from "node-fetch";
import {guessContentType} from "@xrengine/common/src/utils/guessContentType";
import {Readable} from "stream";
import {createHash} from "crypto";
import { Op } from 'sequelize'

import logger from "../../ServerLogger";
import {uploadMediaStaticResource} from "../static-resource/static-resource-helper";
import {Application} from "../../../declarations";

export const imageUpload = async (app: Application, data, mediaType = 'image') => {
    try {
        let fileHead = await fetch(data.url, {method: 'HEAD'})
        if (!/^[23]/.test(fileHead.status.toString())) throw new Error('Invalid URL')
        const contentLength = fileHead.headers['content-length'] || fileHead.headers.get('content-length')
        if (!data.name) data.name = data.url.split('/').pop().split('.')[0]
        const hash = createHash('sha3-256').update(contentLength).update(data.name).digest('hex')
        let extension = data.url.split('.').pop()
        let existingImage, thumbnail
        let existingResource = await app.service('static-resource').Model.findOne({
            where: {
                hash
            }
        })
        const include = [
            {
                model: app.service('static-resource').Model,
                as: 'jpegStaticResource'
            },
            {
                model: app.service('static-resource').Model,
                as: 'gifStaticResource',
            },
            {
                model: app.service('static-resource').Model,
                as: 'ktx2StaticResource'
            },
            {
                model: app.service('static-resource').Model,
                as: 'pngStaticResource',
            }
        ]

        if (existingResource)
            existingImage = await app.service('image').Model.findOne({
                where: {
                    [Op.or]: [
                        {
                            pngStaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            jpegStaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            gifStaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        },
                        {
                            ktx2StaticResourceId: {
                                [Op.eq]: existingResource.id
                            }
                        }
                    ]
                },
                include: include
            })
        if (existingResource && existingImage) return existingImage
        else {
            const file = await fetch(data.url)
            const body = Buffer.from(await file.arrayBuffer())
            const stream = new Readable()
            stream.push(body)
            stream.push(null)
            const imageDimensions = await probe(stream)
            const newImage = await app.service('image').create({
                width: imageDimensions.width,
                height: imageDimensions.height
            })
            if (!existingResource)
                [existingResource, thumbnail] = await uploadMediaStaticResource(
                    app,
                    {
                        media: body,
                        hash,
                        fileName: data.name,
                        mediaId: newImage.id,
                        mediaFileType: extension
                    },
                    'image'
                )
            const update = {} as any
            if (newImage?.id) {
                if (extension === 'jpg') extension = 'jpeg'
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = existingResource.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
            try {
                await app.service('image').patch(newImage.id, update)
            } catch (err) {
                logger.error('error updating image with resources')
                logger.error(err)
                throw err
            }
            return app.service('image').Model.findOne({
                where: {
                    id: newImage.id
                },
                include
            })
        }
    } catch (err) {
        logger.error('image upload error')
        logger.error(err)
        throw err
    }
}