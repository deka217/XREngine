/* eslint-disable @typescript-eslint/no-var-requires */
import appRootPath from 'app-root-path'
import axios from 'axios'
import cli from 'cli'
import dotenv from 'dotenv-flow'
import fetch from 'node-fetch'
import Sequelize, { DataTypes, Op } from 'sequelize'

import { ServerMode } from '@xrengine/server-core/declarations'
import { createFeathersExpressApp } from '@xrengine/server-core/src/createApp'
import { getCachedURL } from '@xrengine/server-core/src/media/storageprovider/getCachedURL'
import { addGenericAssetToS3AndStaticResources } from '@xrengine/server-core/src/media/upload-asset/upload-asset.service'

dotenv.config({
    path: appRootPath.path,
    silent: true
})
const db = {
    username: process.env.MYSQL_USER ?? 'server',
    password: process.env.MYSQL_PASSWORD ?? 'password',
    database: process.env.MYSQL_DATABASE ?? 'xrengine',
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: process.env.MYSQL_PORT ?? 3306,
    dialect: 'mysql'
}

db.url = process.env.MYSQL_URL ?? `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`

cli.enable('status')

cli.main(async () => {
    try {
        const app = createFeathersExpressApp(ServerMode.API)
        const sequelizeClient = new Sequelize({
            ...db,
            logging: console.log,
            define: {
                freezeTableName: true
            }
        })

        await sequelizeClient.sync()

        const StaticResource = sequelizeClient.define('static_resource', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV1,
                allowNull: false,
                primaryKey: true
            },
            sid: {
                type: DataTypes.STRING,
                allowNull: false
            },
            url: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },
            name: DataTypes.STRING,
            key: DataTypes.STRING,
            mimeType: {
                type: DataTypes.STRING,
                allowNull: true
            },
            staticResourceType: {
                type: DataTypes.STRING
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true
            }
        })

        const staticResources = await app.service('static-resource').Model.findAll({
            paginate: false,
            where: {
                LOD0_url: null
            }
        })

        console.log('static resources', staticResources)

        for (const resource of staticResources) {
            if (resource.url && resource.LOD0_url == null)
                await app.service('static-resource').Model.update({
                    LOD0_url: resource.url
                },
                {
                    where: {
                        id: resource.id
                    }
                })
        }
        cli.ok(`All static resources updated`)

        process.exit(0)
    } catch (err) {
        console.log(err)
        cli.fatal(err)
    }
})
