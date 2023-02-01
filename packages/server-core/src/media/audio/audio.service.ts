import { AudioInterface } from '@xrengine/common/src/dbmodels/Audio'

import logger from '../../ServerLogger'
import { Application } from '../../../declarations'
import authenticate from '../../hooks/authenticate'
import verifyScope from '../../hooks/verify-scope'
import { Audio } from './audio.class'
import audioDocs from './audio.docs'
import hooks from './audio.hooks'
import createModel from './audio.model'
import {audioUpload} from "./audio-upload.helper";

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    audio: Audio
    'audio-upload': any
  }
  interface Models {
    audio: ReturnType<typeof createModel> & AudioInterface
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
  const event = new Audio(options, app)
  event.docs = audioDocs

  app.use('audio', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('audio')

  service.hooks(hooks)

  app.use('audio-upload', {
    create: async(data, params) => {
      return audioUpload(app, data, params)
    }
  })

  app.service('audio-upload').hooks({
    before: {
      get: [authenticate(), verifyScope('editor', 'write')]
    }
  })
}
