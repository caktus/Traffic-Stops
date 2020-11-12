import styled from 'styled-components';

export const Suggestion = styled.p`
  background: ${(props) => (props.isHighlighted ? '#ddd' : 'inherit')};
`;

export const SuggestionPart = styled.span`
  font-weight: ${(props) => (props.highlighted ? 700 : 300)};
  color: ${(props) => (props.highlighted ? props.theme.colorSecondary : 'inherit')};
`;

export const InputStyled = styled.input`
  height: 2.5rem;
  width: 350px;
  font-size: 1rem;
  padding: 0.5rem 1.5rem 0.5rem 1rem;
`;

export const AutoSuggestionContainerStyled = styled.div`
  position: absolute;
  top: 73%;
  z-index: 10000;
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 250px;
  overflow: scroll;

  box-shadow: ${(props) => props.theme.boxShadowDark};
  background-color: ${(props) => props.theme.colorWhite};

  & p {
    margin: 1rem 0;
    white-space: nowrap;
    padding: 0 1.5rem;
    font-size: 16px;
    color: ${(props) => props.theme.colorBlack};
  }
`;

export const ContainerList = styled.div`
  max-height: 500px;
  overflow-y: scroll;
  z-index: 10;
`;
