import { DataTypes, Model, Sequelize } from 'sequelize'

import { StaticResourceInterface } from '@xrengine/common/src/dbmodels/StaticResource'

import { Application } from '../../../declarations'
import generateShortId from '../../util/generate-short-id'

export default (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const staticResource = sequelizeClient.define<Model<StaticResourceInterface>>(
    'static_resource',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      sid: {
        type: DataTypes.STRING,
        defaultValue: (): string => generateShortId(8),
        allowNull: false
      },
      hash: {
        type: DataTypes.STRING,
          allowNull: false
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true
      },
      key: DataTypes.STRING,
      mimeType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      project: {
        type: DataTypes.STRING,
        allowNull: true
      },
      driver: {
        type: DataTypes.STRING
      },
      LOD0_url: {
        type: DataTypes.STRING
      },
      LOD0_size: {
        type: DataTypes.INTEGER
      },
      LOD1_url: {
        type: DataTypes.STRING
      },
      LOD1_size: {
        type: DataTypes.INTEGER
      },
      LOD2_url: {
        type: DataTypes.STRING
      },
      LOD2_size: {
        type: DataTypes.INTEGER
      },
      LOD3_url: {
        type: DataTypes.STRING
      },
      LOD3_size: {
        type: DataTypes.INTEGER
      },
      LOD4_url: {
        type: DataTypes.STRING
      },
      LOD4_size: {
        type: DataTypes.INTEGER
      },
      LOD5_url: {
        type: DataTypes.STRING
      },
      LOD5_size: {
        type: DataTypes.INTEGER
      },
      LOD6_url: {
        type: DataTypes.STRING
      },
      LOD6_size: {
        type: DataTypes.INTEGER
      },
      LOD7_url: {
        type: DataTypes.STRING
      },
      LOD7_size: {
        type: DataTypes.INTEGER
      },
      LOD8_url: {
        type: DataTypes.STRING
      },
      LOD8_size: {
        type: DataTypes.INTEGER
      },
      LOD9_url: {
        type: DataTypes.STRING
      },
      LOD9_size: {
        type: DataTypes.INTEGER
      },
      LOD10_url: {
        type: DataTypes.STRING
      },
      LOD10_size: {
        type: DataTypes.INTEGER
      },
      LOD11_url: {
        type: DataTypes.STRING
      },
      LOD11_size: {
        type: DataTypes.INTEGER
      },
      LOD12_url: {
        type: DataTypes.STRING
      },
      LOD12_size: {
        type: DataTypes.INTEGER
      },
      LOD13_url: {
        type: DataTypes.STRING
      },
      LOD13_size: {
        type: DataTypes.INTEGER
      },
      LOD14_url: {
        type: DataTypes.STRING
      },
      LOD14_size: {
        type: DataTypes.INTEGER
      },
      LOD15_url: {
        type: DataTypes.STRING
      },
      LOD15_size: {
        type: DataTypes.INTEGER
      },
      LOD16_url: {
        type: DataTypes.STRING
      },
      LOD16_size: {
        type: DataTypes.INTEGER
      },
      LOD17_url: {
        type: DataTypes.STRING
      },
      LOD17_size: {
        type: DataTypes.INTEGER
      },
      licensing: {
        type: DataTypes.STRING
      },
      attribution: {
        type: DataTypes.STRING
      },
      tags: {
        type: DataTypes.JSON
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )

  ;(staticResource as any).associate = (models: any): void => {
    ;(staticResource as any).belongsTo(models.static_resource_type, {
      foreignKey: 'staticResourceType',
      required: true
    })
    ;(staticResource as any).belongsTo(models.user)
    ;(staticResource as any).hasMany(models.static_resource, {
      as: 'parent',
      foreignKey: 'parentResourceId',
      allowNull: true
    })
  }

  return staticResource
}
