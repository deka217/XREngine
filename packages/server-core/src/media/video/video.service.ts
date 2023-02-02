import { VideoInterface } from '@xrengine/common/src/dbmodels/Video'

import { Application } from '../../../declarations'
import authenticate from '../../hooks/authenticate'
import verifyScope from '../../hooks/verify-scope'
import { Video } from './video.class'
import videoDocs from './video.docs'
import hooks from './video.hooks'
import createModel from './video.model'
import {videoUpload} from "./video-upload.helper";

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    video: Video
  }
  interface Models {
    video: ReturnType<typeof createModel> & VideoInterface
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
  const event = new Video(options, app)
  event.docs = videoDocs

  app.use('video', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('video')

  service.hooks(hooks)

  app.use('video-upload', {
    create: async(data, params) => {
      return videoUpload(app, data, params)
    }
  })

  app.service('video-upload').hooks({
    before: {
      get: [authenticate(), verifyScope('editor', 'write')]
    }
  })
}
