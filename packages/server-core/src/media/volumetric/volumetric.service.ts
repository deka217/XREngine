import { VolumetricInterface } from '@xrengine/common/src/dbmodels/Volumetric'

import { Application } from '../../../declarations'
import { Volumetric } from './volumetric.class'
import volumetricDocs from './volumetric.docs'
import hooks from './volumetric.hooks'
import createModel from './volumetric.model'
import authenticate from "../../hooks/authenticate";
import verifyScope from "../../hooks/verify-scope";
import {volumetricUpload} from "./volumetric-upload.helper";

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    volumetric: Volumetric
    'volumetric-upload': any
  }
  interface Models {
    volumetric: ReturnType<typeof createModel> & VolumetricInterface
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
  const event = new Volumetric(options, app)
  event.docs = volumetricDocs

  app.use('volumetric', event)

  /**
   * Get our initialized service so that we can register hooks
   */
  const service = app.service('volumetric')

  service.hooks(hooks)


  app.use('volumetric-upload', {
    create: async(data, params) => {
      return volumetricUpload(app, data, params)
    }
  })

  app.service('volumetric-upload').hooks({
    before: {
      get: [authenticate(), verifyScope('editor', 'write')]
    }
  })
}
