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

    fieldset {
      border: none;
    }
`;
