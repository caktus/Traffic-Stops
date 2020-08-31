import { lighten, darken } from './styleUtils/lighten-darken';

export default Object.freeze({
  ForwardJusticeLight: {
    // Colors
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

    // Fonts
    fontHeading: "'Bebas Neue', sans-serif",
    fontBody: "'Montserrat', sans-serif",

    // Elements
    elementBorder: '1px solid black',
  },
});

/*

// Forward Justice colors from forwardjustice.org
@brand-primary:    #272973;
@brand-secondary:  #e49a43;
@brand-tertiary:   #02bcbb;
@brand-quaternary: @brand-primary;

@brand-black: #111111;
@brand-grey: #ACACAC;

@link-color: @brand-primary;
@link-hover - color: darken(@link-color, 30 %);
@border-radius - base: 2px;

@navbar-default -link - color: @brand-primary;
@navbar-default -link - hover - color: @brand-quaternary;
@navbar-inverse - bg: @brand-primary;
@navbar-inverse - border: @brand-primary;
@navbar-inverse - link - color: white;

@font-heading: 'Bebas Neue', sans - serif;
@font-body: 'Montserrat', sans - serif;
*/
