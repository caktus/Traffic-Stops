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
        background: ${(props) => props.theme.colors.background};
        font-family: ${(props) => props.theme.fonts.ui};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;

        color: ${(props) => props.theme.colors.text};

        box-sizing: border-box;
    }

    fieldset {
      border: none;
    }

    .fj-date-range-month {
        font-size: 1.5rem;
        margin: 15px;
    }

    .react-datepicker {
        font-family: ${(props) => props.theme.fonts.ui};
        background-color: ${(props) => props.theme.colors.greyLight};
        border-color: ${(props) => props.theme.colors.mist};
    }

    .react-datepicker__header {
        background-color: ${(props) => props.theme.colors.mist};
        border-bottom-color: ${(props) => props.theme.colors.mist};
    }

    .react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::before,
    .react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::after {
        border-bottom-color: ${(props) => props.theme.colors.mist};
    }

    .react-datepicker__month-text:hover,
    .react-datepicker__month-text--keyboard-selected {
        background-color: ${(props) => props.theme.colors.mist};
        color: ${(props) => props.theme.colors.text};
    }

    .react-datepicker .react-datepicker__month--selected,
    .react-datepicker .react-datepicker__month--in-range,
    .react-datepicker .react-datepicker__month-text--selected,
    .react-datepicker .react-datepicker__month-text--in-range,
    .react-datepicker .react-datepicker__day--selected,
    .react-datepicker .react-datepicker__day--in-range {
        background-color: ${(props) => props.theme.colors.primary};
        color: ${(props) => props.theme.colors.white};
    }

    .react-datepicker .react-datepicker__month--in-selecting-range,
    .react-datepicker .react-datepicker__month-text--in-selecting-range,
    .react-datepicker .react-datepicker__month--selected:hover,
    .react-datepicker .react-datepicker__month--in-range:hover,
    .react-datepicker .react-datepicker__month--in-selecting-range:hover {
        background-color: ${(props) => props.theme.colors.secondary};
        color: ${(props) => props.theme.colors.white};
    }
`;
