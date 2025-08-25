import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import * as S from './Dropdown.styled';
import { ICONS } from '../../../img/icons/Icon';

export default function Dropdown({ value, onChange, options, dropUp, dropDown, width }) {
  const theme = useTheme();
  const inputRef = React.useRef();
  const containerRef = React.useRef();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selection, idx) => {
    setIsOpen(false);
    onChange(selection, idx);
  };

  const getParentNodes = (elNode) => {
    // Return ancestor nodes for the input node
    let el = elNode.target;
    const elements = [];
    while (el) {
      elements.push(el);
      el = el.parentNode;
    }
    return elements;
  };

  // Close dropdown when anything else is clicked.
  useEffect(() => {
    function _closeOnBlur(e) {
      const inputNodes = getParentNodes(e);
      // Check to see if the element that is clicked is or is a child of the refs to show/hide the dropdown.
      if (inputNodes.includes(containerRef.current) || inputNodes.includes(inputRef.current)) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener('click', _closeOnBlur, false);
    return () => document.removeEventListener('click', _closeOnBlur, false);
  }, [containerRef.current, inputRef.current]);

  return (
    <S.DropdownContainer>
      <S.DropdownHeader ref={inputRef} onClick={() => setIsOpen(!isOpen)} width={width}>
        {value}
        <S.IconWrapper>
          <S.Icon icon={ICONS.chevronRight} width={25} height={25} fill={theme.colors.primary} />
        </S.IconWrapper>
      </S.DropdownHeader>
      <S.DropdownListContainer
        ref={containerRef}
        isOpen={isOpen}
        dropUp={dropUp}
        dropDown={dropDown}
      >
        <S.DropdownList>
          {options?.map((option, i) => (
            <S.ListItem key={option} onClick={() => handleSelect(option, i)}>
              {option}
            </S.ListItem>
          ))}
        </S.DropdownList>
      </S.DropdownListContainer>
    </S.DropdownContainer>
  );
}
