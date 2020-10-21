import styled from 'styled-components';

export const LineSliceTooltipStyled = styled.ul`
  background: ${props => props.theme.colorWhite};
  border: ${props => props.theme.toolTipBorder};
  border-radius: ${props => props.theme.toolTipBorderRadius};
  list-style: none;
  padding: 1rem;

  p {
    font-weight: bold;
  }

`;

export const LineSlicePoint = styled.li`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: .1rem 0;

    span {
      font-weight: bold;
      color: ${props => props.color};
      margin-right: 4rem;
    }
`;