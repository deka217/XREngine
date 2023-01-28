import { DataTypes, Model, Sequelize } from 'sequelize'

import { ModelInterface } from '@xrengine/common/src/dbmodels/Model'

import { Application } from '../../../declarations'

export default (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const model = sequelizeClient.define<Model<ModelInterface>>(
    'model',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      name: {
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

  ;(model as any).associate = (models: any): void => {
    ;(model as any).belongsTo(models.static_resource, {
      foreignKey: 'glbStaticResourceId',
      required: false
    })
    ;(model as any).belongsTo(models.static_resource, {
      foreignKey: 'gltfStaticResourceId',
      required: false
    })
    ;(model as any).belongsTo(models.static_resource, {
      foreignKey: 'fbxStaticResourceId',
      required: false
    })
    ;(model as any).belongsTo(models.static_resource, {
      foreignKey: 'usdzStaticResourceId',
      required: false
    })
    ;(model as any).belongsTo(models.image, {
      foreignKey: 'thumbnail',
      required: false
    })
  }

  return model
}
