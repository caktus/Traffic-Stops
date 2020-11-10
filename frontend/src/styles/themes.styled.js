import { lighten, darken } from './styleUtils/lighten-darken';

export default Object.freeze({
  ForwardJusticeLight: {
    // Colors
    colorPrimary: '#272973',
    colorSecondary: '#02BCBB',
    colorTertiary: '#9E7B9B',

    // Color States
    colorWarning: '#FFE066',
    colorError: '#F25F5C',

    // Greyscale
    colorBlack: '#000',
    colorGreyDark: '#666666',
    colorGrey: '#ACACAC',
    colorGreySemi: '#E6E6E6',
    colorGreyLight: '#F5F5F5',
    colorWhite: '#fff',

    // Color Variants
    colorPrimaryLight: '#4BA6FF',
    colorPrimaryDark: '#1565B3',
    colorTertiaryLight: '#8879FC',
    colorWarningLight: '#FFCF74',
    colorErrorLight: '#E95C7B',
    colorErrorDark: '#9C0F2E',

    /* Fonts */
    fontHeading: "'Bebas Neue', sans-serif",
    fontSubHeading: "'Oxygen', sans-serif",
    fontBody: "'Montserrat', sans-serif",

    // Elements
    elementBorder: '1px solid',
    toolTipBorder: '6px solid #272973',
    toolTipBorderRadius: '10px',
    commonBorderRadius: '6px',

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
