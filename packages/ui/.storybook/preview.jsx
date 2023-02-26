import {
  Title,
  Subtitle,
  Description,
  Primary,
  ArgsTable,
  Stories,
  PRIMARY_STORY,
} from '@storybook/addon-docs'

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'

import { withRouter } from 'storybook-addon-react-router-v6'

import { withTests } from '@storybook/addon-jest'
import results from '../tests/jest-test-results.json'

import { withThemes } from '@react-theming/storybook-addon'

import GlobalStyle from '@xrengine/client-core/src/util/GlobalStyle'

import { theme as defaultTheme, useTheme } from '@xrengine/client-core/src/theme'

// const providerFn = ({ theme, children }) => {
//   const compliledTheme = useTheme(theme)
//   return (
//     <StyledEngineProvider injectFirst>
//       <ThemeProvider theme={theme}>
//         <GlobalStyle />
//         {children}
//       </ThemeProvider>
//     </StyledEngineProvider>
//   )
// }


export const decorators = [
  withRouter,
  withTests({ results }),
  // withThemes(null, [defaultTheme], { providerFn })
]

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      order: [],
    },
  },
  docs: {
    source: {
      type: 'code',
    },
    page: () => (
      <>
        <Title />
        <Subtitle />
        <Description />
        <Primary />
        <ArgsTable story={PRIMARY_STORY} />
        <Stories />
      </>
    ),
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
}