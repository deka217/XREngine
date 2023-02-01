import { Paginated, Params } from '@feathersjs/feathers'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'
import { Op } from 'sequelize'

import { StaticResourceInterface } from '@xrengine/common/src/interfaces/StaticResourceInterface'

import { Application } from '../../../declarations'
import verifyScope from '../../hooks/verify-scope'
import { UserParams } from '../../user/user/user.class'
import { NotFoundException, UnauthenticatedException } from '../../util/exceptions/exception'
import { getStorageProvider } from '../storageprovider/storageprovider'

export type CreateStaticResourceType = {
  name?: string
  mimeType: string
  key: string
  hash: string
  staticResourceType?: string
  LOD0_url: string
  LOD0_size?: number
  LOD1_url?: string
  LOD1_size?: number
  LOD2_url?: string
  LOD2_size?: number
  LOD3_url?: string
  LOD3_size?: number
  LOD4_url?: string
  LOD4_size?: number
  LOD5_url?: string
  LOD5_size?: number
  LOD6_url?: string
  LOD6_size?: number
  LOD7_url?: string
  LOD7_size?: number
  LOD8_url?: string
  LOD8_size?: number
  LOD9_url?: string
  LOD9_size?: number
  LOD10_url?: string
  LOD10_size?: number
  LOD11_url?: string
  LOD11_size?: number
  LOD12_url?: string
  LOD12_size?: number
  LOD13_url?: string
  LOD13_size?: number
  LOD14_url?: string
  LOD14_size?: number
  LOD15_url?: string
  LOD15_size?: number
  LOD16_url?: string
  LOD16_size?: number
  LOD17_url?: string
  LOD17_size?: number
  userId?: string
  project?: string
}

export class StaticResource extends Service<StaticResourceInterface> {
  app: Application
  public docs: any

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  // @ts-ignore
  async create(data: CreateStaticResourceType, params?: UserParams): Promise<StaticResourceInterface> {
    const self = this
    const query = {
      $select: ['id'],
      url: data.url
    } as any
    if (data.project) query.project = data.project
    const oldResource = await this.find({
      query
    })

    if ((oldResource as any).total > 0) {
      return this.Model.update(data, {
        where: { url: data.url }
      }).then(() => self.Model.findOne({ where: { url: data.url } }))
    } else {
      return this.Model.create(data)
    }
  }

  async find(params?: Params): Promise<StaticResourceInterface[] | Paginated<StaticResourceInterface>> {
    const search = params?.query?.search ?? ''
    const key = params?.query?.key ?? ''
    const mimeTypes = params?.query?.mimeTypes && params?.query?.mimeTypes.length > 0 ? params?.query?.mimeTypes : null
    const resourceTypes =
      params?.query?.resourceTypes && params?.query?.resourceTypes.length > 0 ? params?.query?.resourceTypes : null

    const sort = params?.query?.$sort
    const order: any[] = []
    if (sort != null) {
      Object.keys(sort).forEach((name, val) => {
        order.push([name, sort[name] === 0 ? 'DESC' : 'ASC'])
      })
    }
    const limit = params?.query?.$limit ?? 10
    const skip = params?.query?.$skip ?? 0
    const result = await super.Model.findAndCountAll({
      limit: limit,
      offset: skip,
      select: params?.query?.$select,
      order: order,
      where: {
        key: {
          [Op.or]: {
            [Op.like]: `%${search}%`,
            [Op.eq]: key
          }
        },
        mimeType: {
          [Op.or]: mimeTypes
        },
        staticResourceType: {
          [Op.or]: resourceTypes
        }
      },
      raw: true,
      nest: true
    })

    return {
      data: result.rows,
      total: result.count,
      skip: skip,
      limit: limit
    }
  }

  async remove(id: string, params?: UserParams): Promise<StaticResourceInterface> {
    const resource = await super.get(id)

    if (!resource) {
      throw new NotFoundException('Unable to find specified resource id.')
    }

    if (!resource.userId) {
      if (params?.provider) await verifyScope('admin', 'admin')({ app: this.app, params } as any)
    } else if (params?.provider && resource.userId !== params?.user?.id)
      throw new UnauthenticatedException('You are not the creator of this resource')

    if (resource.key) {
      const storageProvider = getStorageProvider(params?.query?.storageProviderName)
      await storageProvider.deleteResources([resource.key])
    }
    return (await super.remove(id)) as StaticResourceInterface
  }
}
