import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'

import {API} from "../../API";

//State
export const StaticResourceState = defineState({
  name: 'StaticResourceState',
  initial: () => ({
  })
})

export const MediaServiceReceptor = (action) => {
  const s = getState(StaticResourceState)
  matches(action)
}

export const accessStaticResourceState = () => getState(StaticResourceState)
export const useStaticResourceState = () => useState(accessStaticResourceState())

let updateConsumerTimeout

//Service
export const StaticResourceService = {
  async uploadAudio (url: string) {
    return API.instance.client.service('audio-upload').create({
      url
    })
  }
}

//Action
export type BooleanAction = { [key: string]: boolean }
export class StaticResourceAction {

}
