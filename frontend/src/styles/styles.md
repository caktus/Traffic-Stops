# Styles 💅🏻

### This guide attempts to describe the styling conventions followed in this project.

## Philosophy

Using stylesheets for styling doesn't fit the React component pattern very well. Separating markup and styles just doesn't make sense in this pattern-- a UI component should not exist without its styles, and the logic of that component is tightly linked to its display. Imagine a reusable button that changes color on hover/click/focus.

This project uses the styling paradigm of "css-in-js", but using a library that makes that approach more friendly and delartive.

## Styled-Components

This project uses the [styled-components](https://styled-components.com/) library for styling. The docs are good.

## Creating a new component with styles

1. If your new component is MyComponent.js, create another file beside that one called MyComponent.styled.js.
2. Inside MyComponent.styled.js, export styled components as needed for your new component.
3. Read the docs on how Themes and passed Props can be used to change styles dynamically.

## Adding/Updating global styles

[GlobalStyles.styled.js](src/styles/GlobalStyles.styled.js) contains global styles. This file should be limited to truly global styles!

## Creating a reusable BaseComponent

Styled components can inherit styles from other styled components, allowing us to define base styles for certain page types.
See [MainBase](src/styles/MainBase.js) for an example base style. And see [AboutPage.styled.js](src/./AboutPage.styled.js) for implementation.

## Theming/Constants

It's good practice to use contants whever possible for your static styling values; eg. colors, fonts, borders, shadows...
With just a single extra step, and using styled-components, we can turn this in an implementation of theming. See [themes.styled.js](src/styles/themes.styled.js) to see what a theme looks like. In [App.js](src/./App.js), we use styled-components [ThemeProvider]() to set the theme, and wherever we need to pull in a constant, we reference `props.theme.myConstant`. To change themes (not implemented at time of writing), we might stick the theme name in component state in `App.js` to allow toggling somewhere in the app.

## Device responsiveness

Media queries are defined in [breakpoints.js](src/styles/breakpoints.js). See example usage in [AgencyData.styled.js](src/./AgencyData/AgencyData.styled.js).
This project is "desktop-first"-- that is, the opposite of "mobile-first" in practice. Components are styled with desktop in mind, and media queries are used to adjust downward in screensize.
