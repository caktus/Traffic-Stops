import { DEMOGRAPHICS_COLORS, CONTRANBAND_TYPE_COLORS } from "Components/Charts/chartUtils";

export default Object.freeze({
  /* Colors */
  colors: {
    blue: '#272973',
    teal: '#02BCBB',
    purple: '#9E7B9B',
    yellow: '#FFE066',
    red: '#F25F5C',

    // Greyscale
    black: '#212121',
    darkGrey: '#666666',
    grey: '#ACACAC',
    greySemi: '#E6E6E6',
    greyLight: '#F5F5F5',
    white: '#fff',

    // aliased colors
    primary: '#272973',
    primaryDark: '#1565B3',
    secondary: '#29A3A1',
    background: '#ffffff',
    disabled: '#ACACAC',
    caution: '#F25F5C',

    text: '#212121',
    textLight: '#666666',
    border: '#666666',

    // Charting
    ethnicGroup: {
      asian: DEMOGRAPHICS_COLORS.asian,
      black: DEMOGRAPHICS_COLORS.black,
      hispanic: DEMOGRAPHICS_COLORS.hispanic,
      native_american: DEMOGRAPHICS_COLORS.nativeAmerican,
      other: DEMOGRAPHICS_COLORS.other,
      white:DEMOGRAPHICS_COLORS.white,
      average: '#939393',
    },

    contrabandTypes: {
      alcohol: CONTRANBAND_TYPE_COLORS.alcohol,
      drugs: CONTRANBAND_TYPE_COLORS.drugs,
      money: CONTRANBAND_TYPE_COLORS.money,
      other: CONTRANBAND_TYPE_COLORS.other,
      weapons: CONTRANBAND_TYPE_COLORS.weapons,
    },
    fontColorsByEthnicGroup: {
      asian: '#212121',
      black: '#212121',
      hispanic: '#ffffff',
      native_american: '#ffffff',
      other: '#212121',
      white: '#212121',
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
    thick: '2px solid',
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
  fontSizes: ['12px', '16px', '18px', '24px', '32px', '48px', '64px', '96px', '128px'],
  fonts: {
    heading: "'Bebas Neue', sans-serif",
    subheading: "'Oxygen', sans-serif",
    body: "'Montserrat', sans-serif",
  },
  fontWeights: ['light', 'normal', 'bold'],

  /* Variants */
  buttons: {
    positive: {
      color: 'white',
      bg: 'primary',
      borderColor: 'primary',
      cursor: 'pointer',
    },
    neutral: {
      color: 'primary',
      bg: 'white',
      borderColor: 'primary',
      cursor: 'pointer',
    },
    caution: {
      color: 'white',
      bg: 'caution',
      cursor: 'pointer',
    },
  },
});
