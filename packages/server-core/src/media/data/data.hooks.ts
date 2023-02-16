import { disallow, iff, isProvider } from 'feathers-hooks-common'

import collectAnalytics from '@xrengine/server-core/src/hooks/collect-analytics'
import replaceThumbnailLink from '@xrengine/server-core/src/hooks/replace-thumbnail-link'
import attachOwnerIdInQuery from '@xrengine/server-core/src/hooks/set-loggedin-user-in-query'

import addAssociations from '../../hooks/add-associations'
import authenticate from '../../hooks/authenticate'
import verifyScope from '../../hooks/verify-scope'

export default {
  before: {
    all: [],
    find: [
      collectAnalytics(),
      addAssociations({
        models: [
          {
            model: 'static-resource'
          }
        ]
      })
    ],
    get: [disallow('external')],
    create: [authenticate(), iff(isProvider('external'), verifyScope('admin', 'admin') as any)],
    update: [authenticate(), iff(isProvider('external'), verifyScope('admin', 'admin') as any)],
    patch: [authenticate(), iff(isProvider('external'), verifyScope('admin', 'admin') as any)],
    remove: [authenticate(), iff(isProvider('external'), verifyScope('admin', 'admin') as any)]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
} as any
