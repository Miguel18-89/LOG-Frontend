// theme.js
import { extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: '#e8963a',
          solidHoverBg: '#fb8c00',
          solidActiveBg: '#ef6c00',
          plainColor: '#f57c00',
        },
        warning: {
          solidBg: '#f88500',
          solidHoverBg: '#e07800',
          solidActiveBg: '#c96e00',
          softBg: '#fff3e0',
          softColor: '#f88500',
          plainColor: '#f88500',
          outlinedBorder: '#f88500',
          outlinedColor: '#f88500',
        },
        neutral: {
          solidBg: '#212121',
          solidHoverBg: '#424242',
          plainColor: '#212121',
        },
        background: {
          body: '#f5f5f5',
          surface: '#ffffff',
        },
        text: {
          primary: '#212121',
          secondary: '#757575',
        },
      },
    },
  },
  fontFamily: {
    body: 'Segoe UI, sans-serif',
    display: 'Segoe UI, sans-serif',
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
        },
      },
    },
    JoyInput: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
  },
});

export default theme;