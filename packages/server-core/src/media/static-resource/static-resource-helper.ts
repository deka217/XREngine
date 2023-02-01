import {Application} from "../../../declarations";
import {UserParams} from "../../user/user/user.class";
import {addGenericAssetToS3AndStaticResources} from "../upload-asset/upload-asset.service";
import {CommonKnownContentTypes} from "@xrengine/common/src/utils/CommonKnownContentTypes";
import logger from "../../ServerLogger";


export type AudioUploadArguments = {
    audio: Buffer
    thumbnail?: Buffer
    hash: string
    audioId: string
    // fileName: string
    audioFileType: string
}

export const uploadAudioStaticResource = async (
    app: Application,
    data: AudioUploadArguments,
    params?: UserParams
) => {
    console.log('uploadAudioStaticResources', data)
    // const name = data.fileName ? data.fileName : 'audio-' + Math.round(Math.random() * 100000)

    const key = `static-resources/audio/${data.hash}/`

    console.log('key', key)
    // const thumbnail = await generateAvatarThumbnail(data.avatar as Buffer)
    // if (!thumbnail) throw new Error('Thumbnail generation failed - check the model')

    const audioPromise = addGenericAssetToS3AndStaticResources(app, data.audio, CommonKnownContentTypes[data.audioFileType], {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/LOD0.${data.audioFileType}`,
        staticResourceType: 'audio'
    })

    const thumbnailPromise = data.thumbnail ? addGenericAssetToS3AndStaticResources(app, data.thumbnail, CommonKnownContentTypes.png, {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/thumbnail.png`,
        staticResourceType: 'image'
    }) : Promise.resolve()

    const [audioResource, thumbnailResource] = await Promise.all([audioPromise, thumbnailPromise])

    logger.info('Successfully uploaded avatar %o %o', audioResource, thumbnailResource)

    const staticResourceColumn = `${data.audioFileType}StaticResourceId`
    if (data.audioId) {
        const update = {
            [staticResourceColumn]: audioResource.id
        } as any
        if (thumbnailResource?.id)
            update.thumbnail = thumbnailResource.id
        try {
            await app.service('audio').patch(data.audioId, update)
        } catch (err) {
            logger.error('error updating audio with resources', err)
        }
    }

    return [audioResource, thumbnailResource]
}