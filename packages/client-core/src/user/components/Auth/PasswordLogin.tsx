import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { dispatchAction } from '@xrengine/hyperflux'
import Avatar from '@xrengine/ui/src/Avatar'
import Button from '@xrengine/ui/src/Button'
import Checkbox from '@xrengine/ui/src/Checkbox'
import Container from '@xrengine/ui/src/Container'
import FormControlLabel from '@xrengine/ui/src/FormControlLabel'
import Grid from '@xrengine/ui/src/Grid'
import Icon from '@xrengine/ui/src/Icon'
import TextField from '@xrengine/ui/src/TextField'
import Typography from '@xrengine/ui/src/Typography'

import { DialogAction } from '../../../common/services/DialogService'
import { useAuthState } from '../../services/AuthService'
import { AuthService } from '../../services/AuthService'
import ForgotPassword from './ForgotPassword'
import styles from './index.module.scss'
import SignUp from './Register'

const initialState = { email: '', password: '' }

interface Props {
  isAddConnection?: boolean
}

const PasswordLogin = ({ isAddConnection }: Props): JSX.Element => {
  const auth = useAuthState()
  const [state, setState] = useState(initialState)
  const { t } = useTranslation()

  const handleInput = (e: any): void => setState({ ...state, [e.target.name]: e.target.value })

  const handleEmailLogin = (e: any): void => {
    e.preventDefault()

    if (isAddConnection) {
      const user = auth.user
      const userId = user ? user.id.value : ''

      AuthService.addConnectionByPassword(
        {
          email: state.email,
          password: state.password
        },
        userId as string
      )
      dispatchAction(DialogAction.dialogClose({}))
    } else {
      AuthService.loginUserByPassword({
        email: state.email,
        password: state.password
      })
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <div className={styles.paper}>
        <Avatar className={styles.avatar}>
          <Icon type="LockOutlined" />
        </Avatar>
        <Typography component="h1" variant="h5">
          {t('user:auth.passwordLogin.header')}
        </Typography>
        <form className={styles.form} noValidate onSubmit={(e) => handleEmailLogin(e)}>
          <Grid container>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label={t('user:auth.passwordLogin.lbl-email')}
                name="email"
                autoComplete="email"
                autoFocus
                onChange={(e) => handleInput(e)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('user:auth.passwordLogin.lbl-password')}
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={(e) => handleInput(e)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label={t('user:auth.passwordLogin.lbl-rememberMe') as string}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" fullWidth variant="contained" color="primary" className={styles.submit}>
                {t('user:auth.passwordLogin.lbl-signin')}
              </Button>
            </Grid>

            <Grid item xs>
              {!isAddConnection && (
                <a
                  href="#"
                  // variant="body2"
                  onClick={() =>
                    dispatchAction(
                      DialogAction.dialogShow({
                        content: <ForgotPassword />
                      })
                    )
                  }
                >
                  {t('user:auth.passwordLogin.forgotPassword')}
                </a>
              )}
            </Grid>
            <Grid item>
              {!isAddConnection && (
                <a
                  href="#"
                  // variant="body2"
                  onClick={() =>
                    dispatchAction(
                      DialogAction.dialogShow({
                        content: <SignUp />
                      })
                    )
                  }
                >
                  {t('user:auth.passwordLogin.signup')}
                </a>
              )}
            </Grid>
          </Grid>
        </form>
      </div>
    </Container>
  )
}

export default PasswordLogin
