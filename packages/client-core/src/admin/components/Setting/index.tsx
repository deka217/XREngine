import { Icon as Iconify } from '@iconify/react'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Avatar from '@xrengine/ui/src/Avatar'
import Button from '@xrengine/ui/src/Button'
import Divider from '@xrengine/ui/src/Divider'
import Grid from '@xrengine/ui/src/Grid'
import Icon from '@xrengine/ui/src/Icon'
import IconButton from '@xrengine/ui/src/IconButton'
import List from '@xrengine/ui/src/List'
import ListItem from '@xrengine/ui/src/ListItem'
import ListItemAvatar from '@xrengine/ui/src/ListItemAvatar'
import ListItemText from '@xrengine/ui/src/ListItemText'
import Typography from '@xrengine/ui/src/Typography'

import styles from '../../styles/settings.module.scss'
import Authentication from './Authentication'
import Aws from './Aws'
import ChargeBee from './Chargebee'
import Client from './Client'
import ClientTheme from './ClientTheme'
import Coil from './Coil'
import Email from './Email'
import InstanceServer from './InstanceServer'
import Project from './Project'
import Redis from './Redis'
import Server from './Server'
import TaskServer from './TaskServer'

const settingItems = [
  {
    name: 'project',
    title: 'Project',
    icon: <Icon type="Code" sx={{ color: 'orange' }} />,
    content: <Project />
  },
  {
    name: 'server',
    title: 'Server',
    icon: <Iconify icon="carbon:bare-metal-server" color="orange" />,
    content: <Server />
  },
  {
    name: 'client',
    title: 'Client',
    icon: <Icon type="ViewCompact" sx={{ color: 'orange' }} />,
    content: <Client />
  },
  {
    name: 'clientTheme',
    title: 'Client Theme',
    icon: <Icon type="FormatColorFill" sx={{ color: 'orange' }} />,
    content: <ClientTheme />
  },
  {
    name: 'instanceServer',
    title: 'Instance Server',
    icon: <Icon type="Hub" sx={{ color: 'orange' }} />,
    content: <InstanceServer />
  },
  {
    name: 'taskServer',
    title: 'Task Server',
    icon: <Icon type="ListAlt" sx={{ color: 'orange' }} />,
    content: <TaskServer />
  },
  {
    name: 'email',
    title: 'Email',
    icon: <Icon type="MailOutline" sx={{ color: 'orange' }} />,
    content: <Email />
  },
  {
    name: 'authentication',
    title: 'Authentication',
    icon: <Icon type="Lock" sx={{ color: 'orange' }} />,
    content: <Authentication />
  },
  {
    name: 'aws',
    title: 'Aws',
    icon: <Iconify icon="logos:aws" />,
    content: <Aws />
  },
  {
    name: 'chargebee',
    title: 'Chargebee',
    icon: <Iconify icon="logos:chargebee-icon" />,
    content: <ChargeBee />
  },
  {
    name: 'redis',
    title: 'Redis',
    icon: <Iconify icon="logos:redis" />,
    content: <Redis />
  },
  {
    name: 'coil',
    title: 'Coil',
    icon: <Iconify icon="simple-icons:coil" color="orange" />,
    content: <Coil />
  }
]

interface SidebarProps {
  selected: string
  onChange: (name: string) => void
}

const Sidebar = ({ selected, onChange }: SidebarProps) => {
  return (
    <List>
      {settingItems.map((item) => (
        <Fragment key={item.name}>
          <ListItem
            button
            onClick={() => onChange(item.name)}
            className={selected === item.name ? `${styles.focused}` : `${styles.notFocused}`}
          >
            <ListItemAvatar>
              <Avatar style={{ background: '#5e5a4d' }}>{item.icon}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={item.title} />
          </ListItem>
          <Divider variant="inset" component="li" sx={{ marginLeft: '0px' }} />
        </Fragment>
      ))}
    </List>
  )
}

const Setting = () => {
  const rootRef = useRef<any>()
  const [selectedItem, setSelectedItem] = useState('project')
  const [menuVisible, setMenuVisible] = useState(false)
  const { t } = useTranslation()

  const settingItem = settingItems.find((item) => item.name === selectedItem)

  useEffect(() => {
    rootRef?.current?.scrollIntoView()
  }, [menuVisible])

  return (
    <div ref={rootRef}>
      <div className={styles.invisible}>
        <Button size="small" onClick={() => setMenuVisible(!menuVisible)} className={styles.menuBtn}>
          <Icon type="Menu" />
        </Button>
        {menuVisible && (
          <div className={styles.hoverSettings}>
            <Grid display="flex" flexDirection="row" alignItems="center" marginBottom="10px">
              <Typography variant="h6" className={styles.settingsHeading}>
                {t('admin:components.setting.settings')}
              </Typography>
              <IconButton
                onClick={() => setMenuVisible(!menuVisible)}
                style={{
                  color: 'orange',
                  fontSize: '3rem',
                  background: 'transparent',
                  position: 'absolute',
                  right: '10px'
                }}
                icon={<Icon type="Close" />}
              />
            </Grid>
            <Sidebar
              selected={selectedItem}
              onChange={(name) => {
                setSelectedItem(name)
              }}
            />
          </div>
        )}
      </div>
      <Grid container spacing={3}>
        <Grid item sm={3} lg={3} className={styles.visible}>
          <Typography variant="h6" className={styles.settingsHeading}>
            {t('admin:components.setting.settings')}
          </Typography>
          <Sidebar
            selected={selectedItem}
            onChange={(name) => {
              setSelectedItem(name)
            }}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={9}>
          <div className={styles.contents}>{settingItem?.content}</div>
        </Grid>
      </Grid>
    </div>
  )
}

export default Setting
