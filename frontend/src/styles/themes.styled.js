export default Object.freeze({
  /* Colors */
  colors: {
    blue: '#272973',
    teal: '#02BCBB',
    purple: '#9E7B9B',
    yellow: '#FFE066',
    red: '#F25F5C',

    // Greyscale
    black: '#000',
    darkGrey: '#666666',
    grey: '#ACACAC',
    greySemi: '#E6E6E6',
    greyLight: '#F5F5F5',
    white: '#fff',

    // aliased colors
    primary: '#272973',
    primaryDark: '#1565B3',
    secondary: '#02BCBB',
    background: '#ffffff',
    disabled: '#ACACAC',

    text: '#000000',
    border: '#666666',

    // Charting
    ethnicGroup: {
      asian: '#1b9e77',
      black: '#e7298a',
      hispanic: '#7570b3',
      native_american: '#d95f02',
      other: '#66a61e',
      white: '#e6ab02',
    },
  },

  /* Layout, spacing */
  layout: [],
  space: [0, 4, 8, 16, 32, 64, 128, 256],
  sizes: ['1em', '2em', '4em', '8em', '16em', '24em', '32em', '48em', '64em'],

  /* Borders */
  borders: {
    standard: '1px solid',
    tooltip: '1px solid',
  },
  radii: {
    none: 0,
    standard: 6,
    rounded: '10%',
  },

  /* Shadows */
  shadows: {
    depth1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    depth2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    depth3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    depth4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    depth5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
  },

  /* Typography */
  fontSizes: [12, 14, 16, 24, 32, 48, 64, 96, 128],
  fonts: {
    heading: "'Bebas Neue', sans-serif",
    subheading: "'Oxygen', sans-serif",
    body: "'Montserrat', sans-serif",
  },
  fontWeights: ['light', 'normal', 'bold'],
});

// /*

//     // Elements
//     // elementBorder: '1px solid',
//     // toolTipBorder: '1px solid #272973',
//     toolTipBorderRadius: '6px',
//     commonBorderRadius: '6px',

//     // Shadows
//     boxShadowLight: '0px 0px 1px rgba(48, 49, 51, 0.05), 0px 2px 4px rgba(48, 49, 51, 0.1)',
//     boxShadowDark: '0px 0px 1px rgba(13, 13, 13, 0.9), 0px 2px 4px #0D0D0D',
//     boxShadowDarkDeep: '0px 0px 1px rgba(13, 13, 13, 0.9), 0px 4px 8px #0D0D0D',

//     // Presets
//     fontBody18: css`
//       font-family: 'Montserrat', sans-serif;
//       font-style: normal;
//       font-weight: normal;
//       font-size: 18px;
//       line-height: 32px;
//       color: #000;
//     `,

//     // Racial group colors
//     ethnicGroup: {
//       asian: '#1b9e77',
//       black: '#e7298a',
//       hispanic: '#7570b3',
//       native_american: '#d95f02',
//       other: '#66a61e',
//       white: '#e6ab02',
//     },
//   },
// });
