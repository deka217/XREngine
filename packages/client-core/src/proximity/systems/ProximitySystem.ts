import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { forwardVector3, multiplyQuaternion, normalize, subVector } from '@xrengine/common/src/utils/mathUtils'
import { getPlayerName } from '@xrengine/engine/src/networking/utils/getUser'
import { System } from '@xrengine/engine/src/ecs/classes/System'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { getComponent, defineQuery } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { isEntityLocalClient } from '@xrengine/engine/src/networking/functions/isEntityLocalClient'
import { ProximityComponent } from '../components/ProximityComponent'
import { sendChatMessage } from '../../social/reducers/chat/service'
import { accessAuthState } from '../../user/reducers/auth/AuthState'
import { NameComponent } from '@xrengine/engine/src/scene/components/NameComponent'
import { NetworkObjectComponent } from '@xrengine/engine/src/networking/components/NetworkObjectComponent'

const maxDistance: number = 10
const intimateDistance: number = 5
const harassmentDistance: number = 1

export default async function ProximitySystem(world: World): Promise<System> {
  const proximityCheckerQuery = defineQuery([TransformComponent, ProximityComponent])

  return () => {
    for (const eid of proximityCheckerQuery(world)) {
      if (isEntityLocalClient(eid)) {
        const { usersInRange, usersInIntimateRange, usersInHarassmentRange, usersLookingTowards } = getComponent(
          eid,
          ProximityComponent
        )
        const _usersInRange: any[] = []
        const _usersInIntimateRange: any = []
        const _usersInHarassmentRange: any = []
        const _usersLookingTowards: any[] = []
        const userId = getComponent(eid, NetworkObjectComponent).userId
        const transform = getComponent(eid, TransformComponent)
        let remoteTransform
        let distance: number = -1
        let dot: number = -1

        for (const [_, client] of world.clients) {
          if (client.userId === userId) continue
          const userEntity = world.getUserAvatarEntity(client.userId)
          if (!userEntity) continue

          const { name } = getComponent(userEntity, NameComponent)

          remoteTransform = getComponent(userEntity, TransformComponent)
          if (remoteTransform === undefined) continue

          distance = transform.position.distanceTo(remoteTransform.position)
          if (distance > 0 && distance <= maxDistance && distance > intimateDistance) {
            if (!_usersInRange.includes(userEntity)) {
              if (_usersInIntimateRange.includes(userEntity))
                _usersInIntimateRange.slice(_usersInIntimateRange.indexOf(userEntity), 1)
              if (_usersInHarassmentRange.includes(userEntity))
                _usersInHarassmentRange.slice(_usersInHarassmentRange.indexOf(userEntity), 1)

              _usersInRange.push(userEntity)
              if (!usersInRange.includes(userEntity)) {
                sendProximityChatMessage(name + ' in range with ' + getPlayerName(eid))
                console.log('proximity|inRange|' + name + '|' + distance)
              }
            }
          } else if (distance > 0 && distance <= intimateDistance && distance > harassmentDistance) {
            if (!_usersInIntimateRange.includes(userEntity)) {
              if (_usersInRange.includes(userEntity)) _usersInRange.splice(_usersInRange.indexOf(userEntity), 1)
              if (_usersInHarassmentRange.includes(userEntity))
                _usersInHarassmentRange.splice(_usersInHarassmentRange.indexOf(userEntity), 1)

              _usersInIntimateRange.push(userEntity)
              if (!usersInIntimateRange.includes(userEntity)) {
                sendProximityChatMessage(name + ' in intimage range with ' + getPlayerName(eid))
                console.log('proximity|intimate|' + name + '|' + distance)
              }
            }
          } else if (distance > 0 && distance <= harassmentDistance) {
            if (!_usersInHarassmentRange.includes(userEntity)) {
              if (_usersInRange.includes(userEntity)) _usersInRange.splice(_usersInRange.indexOf(userEntity), 1)
              if (_usersInIntimateRange.includes(userEntity))
                _usersInIntimateRange.slice(_usersInIntimateRange.indexOf(userEntity), 1)

              _usersInHarassmentRange.push(userEntity)
              if (!usersInHarassmentRange.includes(userEntity)) {
                sendProximityChatMessage(name + ' in harassment range with ' + getPlayerName(eid))
                console.log('proximity|harassment|' + name + '|' + distance)
              }
            }
          }

          const forward = multiplyQuaternion(transform.rotation, forwardVector3)
          const toOther = normalize(subVector(remoteTransform.position, transform.position))
          dot = forward.dot(toOther)
          if (dot >= 0.7) {
            if (!_usersLookingTowards.includes(userEntity)) {
              _usersLookingTowards.push(userEntity)
              if (!usersLookingTowards.includes(userEntity)) {
                sendProximityChatMessage(name + ' looking at ' + getPlayerName(eid))
                console.log('proximity|lookAt|' + name + '|' + dot)
              }
            }
          }

          for (let i = 0; i < usersInRange.length; i++) {
            if (!_usersInRange.includes(usersInRange[i]) && !_usersInIntimateRange.includes(usersInRange[i])) {
              sendProximityChatMessage(name + ' not in range with ' + getPlayerName(eid))
              console.log('proximity|inRange|' + name + '|left')
            }
          }
          for (let i = 0; i < usersInIntimateRange.length; i++) {
            if (!_usersInIntimateRange.includes(usersInIntimateRange[i])) {
              sendProximityChatMessage(name + ' not in intimate range with ' + getPlayerName(eid))
              console.log('proximity|intimate|' + name + '|left')
            }
          }
          for (let i = 0; i < usersInHarassmentRange.length; i++) {
            if (!_usersInHarassmentRange.includes(usersInHarassmentRange[i])) {
              sendProximityChatMessage(name + ' not in harassment range with ' + getPlayerName(eid))
              console.log('proximity|harassment|' + name + '|left')
            }
          }
          for (let i = 0; i < usersLookingTowards.length; i++) {
            if (!_usersLookingTowards.includes(usersLookingTowards[i])) {
              sendProximityChatMessage(name + ' not looking at ' + getPlayerName(eid))
              console.log('proximity|lookAt|' + name + '|left')
            }
          }

          getComponent(eid, ProximityComponent).usersInRange = _usersInRange
          getComponent(eid, ProximityComponent).usersInIntimateRange = _usersInIntimateRange
          getComponent(eid, ProximityComponent).usersInHarassmentRange = _usersInHarassmentRange
          getComponent(eid, ProximityComponent).usersLookingTowards = _usersLookingTowards
        }
      }
    }
  }
}

function sendProximityChatMessage(text) {
  const user = accessAuthState().user.value
  sendChatMessage({
    targetObjectId: user.instanceId,
    targetObjectType: 'instance',
    text: '[proximity]' + text
  })
}