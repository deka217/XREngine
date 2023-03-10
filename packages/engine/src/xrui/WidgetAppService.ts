import { defineAction, defineState, dispatchAction, getState, useState } from '@xrengine/hyperflux'
import { none } from '@xrengine/hyperflux/functions/StateFunctions'

import { matches, Validator } from '../common/functions/MatchesUtils'
import { Engine } from '../ecs/classes/Engine'

type WidgetState = Record<string, { enabled: boolean; visible: boolean }>

export const WidgetAppState = defineState({
  name: 'WidgetAppState',
  initial: () => ({
    widgetsMenuOpen: false,
    widgets: {} as WidgetState,
    handedness: 'left' as 'left' | 'right'
  })
})

export const WidgetAppServiceReceptor = (action) => {
  const s = getState(WidgetAppState)
  matches(action)
    .when(WidgetAppActions.showWidgetMenu.matches, (action) => {
      s.widgetsMenuOpen.set(action.shown)
      if (action.handedness) s.handedness.set(action.handedness)
    })
    .when(WidgetAppActions.registerWidget.matches, (action) => {
      s.widgets.merge({
        [action.id]: {
          enabled: true,
          visible: false
        }
      })
    })
    .when(WidgetAppActions.unregisterWidget.matches, (action) => {
      if (s.widgets[action.id].visible) {
        s.widgetsMenuOpen.set(true)
      }
      s.widgets[action.id].set(none)
    })
    .when(WidgetAppActions.enableWidget.matches, (action) => {
      s.widgets[action.id].merge({
        enabled: action.enabled
      })
    })
    .when(WidgetAppActions.showWidget.matches, (action) => {
      // if opening or closing a widget, close or open the main menu
      if (action.handedness) s.handedness.set(action.handedness)
      if (action.shown) s.widgetsMenuOpen.set(false)
      if (action.openWidgetMenu && !action.shown) s.widgetsMenuOpen.set(true)
      s.widgets[action.id].merge({
        visible: action.shown
      })
    })
}

export const WidgetAppService = {
  setWidgetVisibility: (widgetName: string, visibility: boolean) => {
    const widgetState = getState(WidgetAppState)
    const widgets = Object.entries(widgetState.widgets.value).map(([id, widgetState]) => ({
      id,
      ...widgetState,
      ...Engine.instance.currentWorld.widgets.get(id)!
    }))

    const currentWidget = widgets.find((w) => w.label === widgetName)

    // close currently open widgets until we support multiple widgets being open at once
    for (let widget of widgets) {
      if (currentWidget && widget.id !== currentWidget.id && widget.visible) {
        dispatchAction(WidgetAppActions.showWidget({ id: widget.id, shown: false }))
      }
    }

    currentWidget && dispatchAction(WidgetAppActions.showWidget({ id: currentWidget.id, shown: visibility }))
  }
}

export class WidgetAppActions {
  static showWidgetMenu = defineAction({
    type: 'xre.xrui.WidgetAppActions.SHOW_WIDGET_MENU' as const,
    shown: matches.boolean,
    handedness: matches.string.optional() as Validator<unknown, 'left' | 'right' | undefined>
  })

  static registerWidget = defineAction({
    type: 'xre.xrui.WidgetAppActions.REGISTER_WIDGET' as const,
    id: matches.string
  })

  static unregisterWidget = defineAction({
    type: 'xre.xrui.WidgetAppActions.UNREGISTER_WIDGET' as const,
    id: matches.string
  })

  static enableWidget = defineAction({
    type: 'xre.xrui.WidgetAppActions.ENABLE_WIDGET' as const,
    id: matches.string,
    enabled: matches.boolean
  })

  static showWidget = defineAction({
    type: 'xre.xrui.WidgetAppActions.SHOW_WIDGET' as const,
    id: matches.string,
    shown: matches.boolean,
    openWidgetMenu: matches.boolean.optional(),
    handedness: matches.string.optional() as Validator<unknown, 'left' | 'right' | undefined>
  })
}
