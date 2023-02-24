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
    fileName: string
    mediaFileType: string
    parentType?: string
    parentId?: string
}

export const uploadMediaStaticResource = async (
    app: Application,
    data: MediaUploadArguments,
    mediaType: string,
    params?: UserParams
) => {
    const key = `static-resources/${data.parentType || mediaType}/${data.parentId || data.mediaId}`

    console.log('key', key)
    // const thumbnail = await generateAvatarThumbnail(data.avatar as Buffer)
    // if (!thumbnail) throw new Error('Thumbnail generation failed - check the model')

    const mediaPromise = addGenericAssetToS3AndStaticResources(app, data.media, CommonKnownContentTypes[data.mediaFileType], {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/${data.fileName}.LOD0.${data.mediaFileType}`,
        staticResourceType: mediaType
    })

    const thumbnailPromise = data.thumbnail ? addGenericAssetToS3AndStaticResources(app, data.thumbnail, CommonKnownContentTypes.png, {
        hash: data.hash,
        userId: params?.user!.id,
        key: `${key}/thumbnail.png`,
        staticResourceType: 'image'
    }) : Promise.resolve()

    const [mediaResource, thumbnailResource] = await Promise.all([mediaPromise, thumbnailPromise])

    return [mediaResource, thumbnailResource]
}
