import { lighten, darken } from './styleUtils/lighten-darken';

export default Object.freeze({
  /**
   * This is the base theme.
   */
  ForwardJusticeLight: {
    /* Colors */
    colorPrimary: '#272973',
    colorSecondary: '#e49a43',
    colorTertiary: '#02bcbb',

    // Color Variants
    colorPrimaryLight: lighten('#272973'),
    colorPrimaryDark: darken('#272973'),

    // Greyscale
    colorBlack: '#111111',
    colorGrey: '#ACACAC',
    colorWhite: '#fff',

    /* Fonts */
    fontHeading: "'Bebas Neue', sans-serif",
    fontBody: "'Montserrat', sans-serif",

    /* Elements */
    elementBorder: '1px solid black',
  },

  /**
   * This is a pretend theme. New themes would start out like this. New themes will break the app if they don't have all the same keys defined.
   */
  MyOtherTheme: {},
});
