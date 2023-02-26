import { createState, useHookstate } from '@hookstate/core'
import React, { useState } from 'react'

// import { VrIcon } from '../../../common/components/Icons/VrIcon'
import { Channel } from '@xrengine/common/src/interfaces/Channel'
import { respawnAvatar } from '@xrengine/engine/src/avatar/functions/respawnAvatar'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { WidgetAppActions, WidgetAppState } from '@xrengine/engine/src/xrui/WidgetAppService'
import { dispatchAction, getState } from '@xrengine/hyperflux'
import Icon from '@xrengine/ui/src/Icon'

import { useMediaInstance } from '../../../common/services/MediaInstanceConnectionService'
import { MediaStreamService, useMediaStreamState } from '../../../media/services/MediaStreamService'
import { useChatState } from '../../../social/services/ChatService'
import { MediaStreams } from '../../../transports/MediaStreams'
import {
  configureMediaTransports,
  createCamAudioProducer,
  pauseProducer,
  resumeProducer
} from '../../../transports/SocketWebRTCClientFunctions'
import { SocketWebRTCClientNetwork } from '../../../transports/SocketWebRTCClientNetwork'
import XRIconButton from '../../components/XRIconButton'
import styleString from './index.scss?inline'

export function createWidgetButtonsView() {
  return createXRUI(WidgetButtons, createWidgetButtonsState())
}

function createWidgetButtonsState() {
  return createState({})
}

type WidgetButtonProps = {
  icon: any
  toggle: () => any
  label: string
  disabled?: boolean
}

const WidgetButton = ({ icon: name, toggle, label, disabled }: WidgetButtonProps) => {
  const [mouseOver, setMouseOver] = useState(false)
  return (
    <XRIconButton
      disabled={disabled}
      size="large"
      content={
        <>
          <Icon type={name} className="svgIcon" />
          {mouseOver && <div>{label}</div>}
        </>
      }
      onClick={toggle}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      xr-layer="true"
    />
  )
}

const WidgetButtons = () => {
  let activeChannel: Channel | null = null
  const chatState = useChatState()
  const widgetState = useHookstate(getState(WidgetAppState))
  const channelState = chatState.channels
  const channels = channelState.channels.value as Channel[]
  const activeChannelMatch = Object.entries(channels).find(([key, channel]) => channel.channelType === 'instance')
  if (activeChannelMatch && activeChannelMatch.length > 0) {
    activeChannel = activeChannelMatch[1]
  }
  const mediaInstanceState = useMediaInstance()

  const channelEntries = Object.values(channels).filter((channel) => !!channel) as any
  const instanceChannel = channelEntries.find(
    (entry) => entry.instanceId === Engine.instance.currentWorld.worldNetwork?.hostId
  )
  const mediastream = useMediaStreamState()
  const isCamAudioEnabled = mediastream.isCamAudioEnabled

  // TODO: add a notification hint function to the widget wrapper and move unread messages there
  // useEffect(() => {
  //   activeChannel &&
  //     activeChannel.messages &&
  //     activeChannel.messages.length > 0 &&
  //     !widgetState.chatMenuOpen.value &&
  //     setUnreadMessages(true)
  // }, [activeChannel?.messages])

  // const toggleVRSession = () => {
  //   if (engineState.xrSessionStarted.value) {
  //     dispatchAction(XRAction.endSession({}))
  //   } else {
  //     dispatchAction(XRAction.requestSession({}))
  //   }
  // }

  const handleRespawnAvatar = () => {
    respawnAvatar(Engine.instance.currentWorld.localClientEntity)
  }

  const widgets = Object.entries(widgetState.widgets.value).map(([id, widgetState]) => ({
    id,
    ...widgetState,
    ...Engine.instance.currentWorld.widgets.get(id)!
  }))

  const toggleWidget = (toggledWidget) => () => {
    const state = widgetState.widgets.value
    const visible = state[toggledWidget.id].visible
    // close currently open widgets until we support multiple widgets being open at once
    if (!visible) {
      Object.entries(state).forEach(([id, widget]) => {
        if (widget.visible && id !== toggledWidget.id) dispatchAction(WidgetAppActions.showWidget({ id, shown: false }))
      })
    }
    dispatchAction(WidgetAppActions.showWidget({ id: toggledWidget.id, shown: !visible }))
  }

  const handleMicClick = async () => {
    const mediaNetwork = Engine.instance.currentWorld.mediaNetwork as SocketWebRTCClientNetwork
    if (!mediaNetwork) return
    if (await configureMediaTransports(mediaNetwork, ['audio'])) {
      if (MediaStreams.instance.camAudioProducer == null) await createCamAudioProducer(mediaNetwork)
      else {
        const audioPaused = MediaStreams.instance.toggleAudioPaused()
        if (audioPaused) await pauseProducer(mediaNetwork, MediaStreams.instance.camAudioProducer)
        else await resumeProducer(mediaNetwork, MediaStreams.instance.camAudioProducer)
      }
      MediaStreamService.updateCamAudioState()
    }
  }

  const activeWidgets = widgets.filter((widget) => widget.enabled && widget.icon)

  const additionalWidgetCount = 1 + (mediaInstanceState?.value ? 1 : 0)
  const gridTemplateColumns = new Array(additionalWidgetCount)
    .fill('1fr')
    .concat(activeWidgets.map(() => ' 1fr'))
    .join(' ')

  return (
    <>
      <style>{styleString}</style>
      <div className="container" style={{ gridTemplateColumns }} xr-pixel-ratio="8" xr-layer="true">
        <WidgetButton icon="Refresh" toggle={handleRespawnAvatar} label={'Respawn'} />
        {mediaInstanceState?.value && (
          <WidgetButton
            icon={isCamAudioEnabled.value ? 'Mic' : 'MicOff'}
            toggle={handleMicClick}
            label={isCamAudioEnabled.value ? 'Audio on' : 'Audio Off'}
          />
        )}
        {/* <WidgetButton
          Icon={VrIcon}
          toggle={toggleVRSession}
          label={engineState.xrSessionStarted.value ? 'Exit VR' : 'Enter VR'}
        /> */}
        {activeWidgets.map((widget, i) => (
          <WidgetButton key={i} icon={widget.icon} toggle={toggleWidget(widget)} label={widget.label} />
        ))}
      </div>
    </>
  )
}
