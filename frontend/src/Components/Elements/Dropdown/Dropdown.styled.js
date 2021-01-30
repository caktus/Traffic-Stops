import styled, { css } from 'styled-components';
import FJIcon from 'img/icons/Icon';

export const DropdownContainer = styled.div`
  position: relative;
`;

export const DropdownHeader = styled.div`
  position: relative;
  cursor: pointer;
  border: 1px solid ${(props) => props.theme.colors.primary};
  border-radius: ${(props) => props.theme.radii.standard}px;
  padding: 0.6em 2em 0.6em 1em;
  font-size: ${(props) => props.theme.fontSizes[2]};
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.white};
  min-height: 48px;
  width: 260px;
`;

export const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
`;

export const Icon = styled(FJIcon)`
  transform: rotate(90deg);
`;

export const DropdownListContainer = styled.div`
  position: absolute;

  ${(props) =>
    props.dropUp
      ? css`
          bottom: 100%;
        `
      : css`
          top: 100%;
        `}

  min-width: 100%;
  display: ${(props) => (props.isOpen ? 'block' : 'none')};

  background: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.grey};
  box-shadow: ${(props) => props.theme.shadows.depth4};
  z-index: 10;

  max-height: 300px;
  overflow-y: scroll;
`;

export const DropdownList = styled.ul`
  padding: 0;
  margin: 0;
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.fontSizes[2]};
  font-family: ${(props) => props.theme.fonts.body};
`;

export const ListItem = styled.li`
  cursor: pointer;
  list-style: none;
  padding: 1em;
  &:hover {
    background: ${(props) => props.theme.colors.greySemi};
  }
`;
