import React from 'react';
import styled from 'styled-components';
import { phoneOnly } from '../../styles/breakpoints';

function LinkButton({ href, title }) {
  return (
    <LinkStyled href={href} target="_blank" rel="noopener noreferrer">
      {title}
    </LinkStyled>
  );
}

export default LinkButton;

const LinkStyled = styled.a`
  padding: 15px;
  background-color: #00b2b0;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  text-decoration: none;

  @media (${phoneOnly}) {
    padding: 8px;
  }
`;
