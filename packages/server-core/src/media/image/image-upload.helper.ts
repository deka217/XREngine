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
        const file = await fetch(data.url)
        console.log('file', file, file.status, file.headers)
        const extension = data.url.split('.').pop()
        const contentType = guessContentType(data.url)
        console.log('contentType', contentType)
        const body = Buffer.from(await file.arrayBuffer())
        console.log('body', body)
        const hash = createHash('sha3-256').update(body).digest('hex')
        console.log('image hash', hash)
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
        if (existingResource) {
            const image = await app.service('image').Model.findOne({
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
            console.log('matching image', image)
            return image
        } else {
            const stream = new Readable()
            stream.push(body)
            stream.push(null)
            console.log('readStream', stream)
            const imageDimensions = await probe(stream)
            console.log('image duration', imageDimensions)
            const newImage = await app.service('image').create({
                width: imageDimensions.width,
                height: imageDimensions.height
            })
            console.log('new image', newImage)
            console.log('data', data)
            const args = Object.assign({})
            args.imageId = newImage.id
            args.imageFileType = extension
            console.log('calling uploadImageStaticResource')
            const [image, thumbnail] = await uploadMediaStaticResource(
                app,
                {
                    media: body,
                    hash,
                    mediaId: newImage.id,
                    mediaFileType: extension
                },
                'image'
            )

            console.log('uploaded image and thumbnail resources', image, thumbnail)
            const update = {} as any
            if (image?.id) {
                const staticResourceColumn = `${extension}StaticResourceId`
                update[staticResourceColumn] = image.id
            }
            if (thumbnail?.id) update.thumbnail = thumbnail.id
            try {
                await app.service('image').patch(newImage.id, update)
            } catch (err) {
                logger.error('error updating image with resources')
                logger.error(err)
                throw err
            }
            return app.service('image').get(newImage.id, {
                sequelize: {
                    include: include
                }
            })
        }
    } catch (err) {
        logger.error('image upload error')
        logger.error(err)
        throw err
    }
}