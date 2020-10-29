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

    // Elements
    elementBorder: '1px solid',
    toolTipBorder: '6px solid #272973',
    toolTipBorderRadius: '10px',

    // Racial group colors
    ethnicGroup: {
      asian: '#1b9e77',
      black: '#e7298a',
      hispanic: '#7570b3',
      native_american: '#d95f02',
      other: '#66a61e',
      white: '#e6ab02',
    },
  },
});

/*
What IS the best color scheme??
{
  asian: "#1b9e77",
  black: "#e7298a",
  hispanic: "#7570b3",
  native_american: "#d95f02",
  other: "#66a61e",
  white: "#e6ab02",
}

{
  asian: #003f5c,
  black: #444e86,
  hispanic: #955196,
  native_american: #dd5182,
  other: #ff6e54,
  white: #ffa600,
}

{
  asian: "#72e5ef", 
  black: "#cb907b", 
  hispanic: "#58df8c", 
  native_american: "#eb6756", 
  other: "#579ba1", 
  white: "#f6dce3",
}

{
    asian: "#FF1DC0",
    black: "#0CEEFF",
    hispanic: "#FFF600",
    native_american: "#1AFF00",
    other: "#FF0046",
    white: "#0161FF",
}
*/
