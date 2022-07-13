import React from 'react';
import { LayoutStyled } from './Layout.styled';

function Layout({ children, ...props }) {
  return <LayoutStyled {...props}>{children}</LayoutStyled>;
}

export default Layout;
