import styled from 'styled-components';
import * as breakpoints from 'styles/breakpoints';
import FullWidthPage from 'Components/FullWidthPage.styled';

export const Page = styled(FullWidthPage)``;

export const Form = styled.form``;

export const FieldSet = styled.fieldset`
  margin: 2rem;
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

export const InputWrapper = styled.div`
  flex: 1;
  &:not(:last-child) {
    margin-right: 1rem;
  }
`;

export const SearchInputWrapper = styled(InputWrapper)`
  flex: 3;
  position: relative;
  z-index: 1;
`;
