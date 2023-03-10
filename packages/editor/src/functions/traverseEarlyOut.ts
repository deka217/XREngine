import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EntityTreeNode } from '@xrengine/engine/src/ecs/functions/EntityTree'

export default function traverseEarlyOut(
  node: EntityTreeNode,
  cb: (node: EntityTreeNode) => boolean,
  tree = Engine.instance.currentWorld.entityTree
): boolean {
  let stopTravel = cb(node)

  if (stopTravel) return stopTravel

  const children = node.children
  if (!children) return stopTravel

  for (let i = 0; i < children.length; i++) {
    const child = tree.entityNodeMap.get(children[i])

    if (child) {
      stopTravel = traverseEarlyOut(child, cb, tree)
      if (stopTravel) break
    }
  }

  return stopTravel
}
