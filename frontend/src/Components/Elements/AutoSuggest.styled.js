import styled from 'styled-components';

export const Suggestion = styled.p`
  background: ${(props) => (props.isHighlighted ? '#ddd' : 'inherit')};
`;

export const SuggestionPart = styled.span`
  font-weight: ${(props) => (props.highlighted ? 700 : 300)};
  color: ${(props) => (props.highlighted ? props.theme.colorSecondary : 'inherit')};
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  z-index: 10;
`;

export const InputStyled = styled.input`
  height: 2.5rem;
  width: 350px;
  font-size: 1rem;
  padding: 0.5rem 1.5rem 0.5rem 1rem;
`;

export const AutoSuggestionContainerStyled = styled.div`
  position: absolute;
  z-index: 10;
  min-width: 13rem;
  display: flex;
  flex-direction: column;
  max-height: 250px;
  overflow: scroll;

  border: ${(props) => props.theme.toolTipBorder};
  border-radius: ${(props) => props.theme.toolTipBorderRadius};
  background-color: ${(props) => props.theme.colorWhite};

  & p {
    margin: 1rem 0;
    white-space: nowrap;
    padding: 0 1.5rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.colorBlack};
  }
`;
