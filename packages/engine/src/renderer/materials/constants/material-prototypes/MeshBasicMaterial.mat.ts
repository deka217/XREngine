import { MeshBasicMaterial as Basic } from 'three'

import { MaterialPrototypeComponentType } from '../../components/MaterialPrototypeComponent'
import { SourceType } from '../../components/MaterialSource'
import { AoMapArgs, BasicArgs, EmissiveMapArgs, EnvMapArgs, LightMapArgs } from '../BasicArgs'
import { TextureArg } from '../DefaultArgs'

export const DefaultArgs = {
  ...BasicArgs,
  ...EmissiveMapArgs,
  ...LightMapArgs,
  ...AoMapArgs,
  ...EnvMapArgs,
  specularMap: TextureArg
}

export const MeshBasicMaterial: MaterialPrototypeComponentType = {
  prototypeId: 'MeshBasicMaterial',
  baseMaterial: Basic,
  arguments: DefaultArgs,
  src: { type: SourceType.BUILT_IN, path: '' }
}

export default MeshBasicMaterial
