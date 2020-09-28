import tinycolor from 'tinycolor2';

export const lighten = (color, percent = 10) => tinycolor(color).lighten(percent).toString();

export const darken = (color, percent = 10) => tinycolor(color).darken(percent).toString();
