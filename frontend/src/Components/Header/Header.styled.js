import styled from 'styled-components';

export const HeaderStyled = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-bottom: ${(props) => props.theme.elementBorder};
  background: ${(props) => props.theme.colorPrimary};
  padding: 1.2rem 2.5rem;
`;

export const LogosStyled = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
`;
