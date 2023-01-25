import { hookstate, none } from '@xrengine/hyperflux'

import { Entity } from '../../ecs/classes/Entity'
import {defineComponent, getComponent} from '../../ecs/functions/ComponentFunctions'
import {NameComponent} from "./NameComponent";

export const TypeComponent = defineComponent({
  name: 'TypeComponent',

  onInit: () => '',

  onSet: (entity, component, type?: string) => {
    const existingType = getComponent(entity, TypeComponent)
    const name = getComponent(entity, NameComponent)
    console.log('existingType', existingType)
    console.log('name', name)
    // if (typeof type !== 'string') throw new Error('TypeComponent expects a non-empty string')
    if (type) {
      component.set(type)
      const typedEntities = TypeComponent.entitiesByType[type]
      const exists = !!typedEntities.value
      exists && typedEntities.set([...typedEntities.value!, entity])
      !exists && typedEntities.set([entity])
    }
  },

  onRemove: (entity, component) => {
    const type = component.value
    const typedEntities = TypeComponent.entitiesByType[type]
    const isSingleton = typedEntities.length === 1
    isSingleton && typedEntities.set(none)
    !isSingleton && typedEntities.set(typedEntities.value.filter((typedEntity) => typedEntity !== entity))
  },

  entitiesByType: hookstate({} as Record<string, Entity[]>)
})
