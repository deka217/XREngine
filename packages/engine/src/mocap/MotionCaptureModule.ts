import { SystemModuleType } from '../ecs/functions/SystemFunctions'
import { SystemUpdateType } from '../ecs/functions/SystemUpdateType'
import MotionCaptureSystem from './systems/MotionCaptureSystem'

export function MotionCaptureModule() {
  const systemsToLoad: SystemModuleType<any>[] = []
  systemsToLoad.push({
    uuid: 'xre.engine.MotionCaptureSystem',
    type: SystemUpdateType.FIXED_EARLY,
    systemLoader: () => Promise.resolve({ default: MotionCaptureSystem })
  })

  return systemsToLoad
}
