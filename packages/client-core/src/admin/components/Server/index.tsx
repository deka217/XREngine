import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex'

import LoadingView from '@xrengine/client-core/src/common/components/LoadingView'
import { ServerInfoInterface } from '@xrengine/common/src/interfaces/ServerInfo'
import Box from '@xrengine/ui/src/Box'
import Card from '@xrengine/ui/src/Card'
import CardActionArea from '@xrengine/ui/src/CardActionArea'
import CardContent from '@xrengine/ui/src/CardContent'
import Grid from '@xrengine/ui/src/Grid'
import Typography from '@xrengine/ui/src/Typography'

import { ServerInfoService, useServerInfoState } from '../../services/ServerInfoService'
import styles from '../../styles/admin.module.scss'
import ServerTable from './ServerTable'

import 'react-reflex/styles.css'

import { useServerLogsState } from '../../services/ServerLogsService'
import ServerLogs from './ServerLogs'

const Server = () => {
  const { t } = useTranslation()
  const [selectedCard, setSelectedCard] = useState('all')
  const serverInfo = useServerInfoState()
  const serverLogs = useServerLogsState()

  let displayLogs = serverLogs.podName.value ? true : false

  useEffect(() => {
    if (serverInfo.updateNeeded.value) ServerInfoService.fetchServerInfo()
  }, [serverInfo.updateNeeded.value])

  if (!serverInfo.value.fetched) {
    return (
      <LoadingView title={t('admin:components.server.loading')} variant="body2" sx={{ position: 'absolute', top: 0 }} />
    )
  }

  return (
    <Box sx={{ height: 'calc(100% - 106px)' }}>
      <Grid container spacing={1} className={styles.mb10px}>
        {serverInfo.value.servers.map((item, index) => (
          <Grid item key={item.id} xs={12} sm={6} md={2}>
            <ServerItemCard
              key={index}
              data={item}
              isSelected={selectedCard === item.id}
              onCardClick={setSelectedCard}
            />
          </Grid>
        ))}
      </Grid>
      {displayLogs === false && <ServerTable selectedCard={selectedCard} />}
      {displayLogs && (
        <ReflexContainer orientation="horizontal">
          <ReflexElement flex={0.45} style={{ display: 'flex', flexDirection: 'column' }}>
            <ServerTable selectedCard={selectedCard} />
          </ReflexElement>

          <ReflexSplitter />

          <ReflexElement flex={0.55} style={{ overflow: 'hidden' }}>
            <ServerLogs />
          </ReflexElement>
        </ReflexContainer>
      )}
    </Box>
  )
}

interface ServerItemProps {
  data: ServerInfoInterface
  isSelected: boolean
  onCardClick: (key: string) => void
}

const ServerItemCard = ({ data, isSelected, onCardClick }: ServerItemProps) => {
  return (
    <Card className={`${styles.rootCardNumber} ${isSelected ? styles.selectedCard : ''}`}>
      <CardActionArea onClick={() => onCardClick(data.id)}>
        <CardContent className="text-center">
          <Typography variant="h5" component="h5" className={styles.label}>
            {data.label}
          </Typography>
          <Typography variant="body1" component="p" className={styles.label}>
            {data.pods.filter((item) => item.status === 'Running').length}/{data.pods.length}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default Server
