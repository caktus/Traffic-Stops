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
        font-family: ${(props) => props.theme.fonts.body};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        color: ${(props) => props.theme.colors.text};

        box-sizing: border-box;
    }

    h1, h2, h3{
        font-family: ${(props) => props.theme.fonts.heading};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    h1 {
        margin: 1rem;
        font-size: 48px;
        font-style: normal;
        font-weight: normal;
        color: ${(props) => props.theme.colors.text};
    }

    h2 {
      font-style: normal;
      font-weight: normal;
      font-size: 31px;
      color: ${(props) => props.theme.colors.grey};
    }

    h3 {
      font-style: normal;
      font-weight: normal;
      font-size: 26px;
      color: ${(props) => props.theme.colors.grey};
    }

    h4 {
      font-family: ${(props) => props.theme.fonts.subheading};
      font-style: normal;
      font-weight: bold;
      font-size: 21px;
      color: ${(props) => props.theme.colors.grey};
    }

    fieldset {
      border: none;
    }
`;
