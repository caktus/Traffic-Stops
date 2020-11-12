import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
    *,
    *::after,
    *::before {
        margin: 0;
        padding: 0;
        box-sizing: inherit;
    }

    body {
        font-family: ${(props) => props.theme.fontBody};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        box-sizing: border-box;
    }

    h1, h2, h3{
        font-family: ${(props) => props.theme.fontHeading};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    h1 {
        margin: 1rem;
        font-size: 48px;
        font-style: normal;
        font-weight: normal;
        color: ${(props) => props.theme.colorBlack};
    }

    h2 {
      font-style: normal;
      font-weight: normal;
      font-size: 31px;
      color: ${(props) => props.theme.colorGrey};
    }

    h3 {
      font-style: normal;
      font-weight: normal;
      font-size: 26px;
      color: ${(props) => props.theme.colorGrey};
    }

    h4 {
      font-family: ${(props) => props.theme.fontSubHeading};
      font-style: normal;
      font-weight: bold;
      font-size: 21px;
      color: ${(props) => props.theme.colorGrey};
    }

    fieldset {
      border: none;
    }
`;
