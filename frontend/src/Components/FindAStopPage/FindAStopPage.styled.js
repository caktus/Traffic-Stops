import styled from 'styled-components';
import * as breakpoints from 'styles/breakpoints';
import { FullWidthPage } from 'styles/StyledComponents/FullWidthPage.styled';

export const Page = styled(FullWidthPage)`
  padding: 2em 0;
`;

export const Form = styled.form``;

export const FieldSet = styled.fieldset`
  margin: 2rem;
`;

export const Label = styled.p`
  padding-top: 8px;
  padding-bottom: 8px;
  display: block;
`;

export const Legend = styled.legend`
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: bold;
  font-size: 21px;
`;

export const LegendSpan = styled.span`
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: normal;
  font-size: 21px;
  color: ${(props) => props.theme.colors.darkGrey};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: row;
  margin: 2rem 1rem;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    flex-direction: column;
  }
`;

export const InputColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: flex-start;
`;

export const InputWrapper = styled.div`
  flex: 1;
  &:not(:last-child) {
    margin-right: 1rem;
  }
  .react-datepicker-wrapper {
    height: 100%;
    .react-datepicker__input-container {
      height: 100%;
    }
  }
`;

export const SearchInputWrapper = styled(InputWrapper)`
  flex: 3;
  position: relative;
  z-index: 1;
`;

export const Note = styled.p`
  color: ${(props) => props.theme.colors.darkGrey};
  padding: 1em 1em 1em 0;
  line-height: 32px;
`;
