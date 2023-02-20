import { ImageInterface } from '@xrengine/common/src/dbmodels/Image'

import { Application } from '../../../declarations'
import { Image } from './image.class'
import imageDocs from './image.docs'
import hooks from './image.hooks'
import createModel from './image.model'
import authenticate from "../../hooks/authenticate";
import verifyScope from "../../hooks/verify-scope";
import {imageUpload} from "./image-upload.helper";

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    image: Image
    'image-upload': any
  }
  interface Models {
    image: ReturnType<typeof createModel> & ImageInterface
  }
}

export default (app: Application) => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  /**
   * Initialize our service with any options it requires and docs
   */
  const event = new Image(options, app)
  event.docs = imageDocs

  app.use('image', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('image')

  service.hooks(hooks)

  app.use('image-upload', {
    create: async(data) => {
      return imageUpload(app, data)
    }
  })

  app.service('image-upload').hooks({
    before: {
      get: [authenticate(), verifyScope('editor', 'write')]
    }
  })
}
