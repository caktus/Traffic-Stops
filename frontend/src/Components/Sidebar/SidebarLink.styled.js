import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

import Icon from '../../img/icons/Icon';
import { phoneOnly, smallerThanDesktop } from '../../styles/breakpoints';

export const Wrapper = styled.div`
  position: relative;
  margin: 8px 0;

  @media (${smallerThanDesktop}) {
    border-right: 1px solid ${(p) => p.theme.colors.white};
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 0.5em;
  }
`;

export const Chevron = styled(Icon)`
  position: absolute;
  right: 105%;
  @media (${smallerThanDesktop}) {
    right: 102%;
    top: 50%;
    transform: translateY(-50%);
  }

  @media (${phoneOnly}) {
    display: none;
  }
`;

export const SidebarLink = styled(NavLink)`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 18px;
  line-height: 32px;
  color: ${(props) => props.theme.colors.text};
  text-decoration: none;

  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  color: ${(props) => (props.active ? props.theme.colors.primaryDark : props.theme.colors.text)};

  @media (${smallerThanDesktop}) {
    font-size: 14px;
    font-weight: normal;
    line-height: 1em;
  }
`;
