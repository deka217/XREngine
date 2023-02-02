import {Application} from "../../../declarations";
import {UserParams} from "../../user/user/user.class";
import {addGenericAssetToS3AndStaticResources} from "../upload-asset/upload-asset.service";
import {CommonKnownContentTypes} from "@xrengine/common/src/utils/CommonKnownContentTypes";
import logger from "../../ServerLogger";


export type MediaUploadArguments = {
    media: Buffer
    thumbnail?: Buffer
    hash: string
    mediaId: string
    // fileName: string
    mediaFileType: string
}

export type VideoUploadArguments = {
    video: Buffer
    thumbnail?: Buffer
    hash: string
    videoId: string
    // fileName: string
    videoFileType: string
}

export const uploadMediaStaticResource = async (
    app: Application,
    data: MediaUploadArguments,
    params?: UserParams
) => {
    console.log('uploadMediaStaticResources', data)
    // const name = data.fileName ? data.fileName : 'audio-' + Math.round(Math.random() * 100000)

    const key = `static-resources/audio/${data.hash}`

    console.log('key', key)
    // const thumbnail = await generateAvatarThumbnail(data.avatar as Buffer)
    // if (!thumbnail) throw new Error('Thumbnail generation failed - check the model')

    const audioPromise = addGenericAssetToS3AndStaticResources(app, data.media, CommonKnownContentTypes[data.mediaFileType], {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/LOD0.${data.mediaFileType}`,
        staticResourceType: 'audio'
    })

    const thumbnailPromise = data.thumbnail ? addGenericAssetToS3AndStaticResources(app, data.thumbnail, CommonKnownContentTypes.png, {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/thumbnail.png`,
        staticResourceType: 'image'
    }) : Promise.resolve()

    const [audioResource, thumbnailResource] = await Promise.all([audioPromise, thumbnailPromise])

    return [audioResource, thumbnailResource]
}
