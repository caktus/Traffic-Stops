import React from 'react';
import LayoutStyled from './Layout.styled';

export default function Layout({ children, ...props }) {
  return <LayoutStyled {...props}>{children}</LayoutStyled>;
}
