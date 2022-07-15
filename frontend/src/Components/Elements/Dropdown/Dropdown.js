import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import * as S from './Dropdown.styled';
import { ICONS } from '../../../img/icons/Icon';

export function Dropdown({ value, onChange, options, dropUp }) {
  const theme = useTheme();
  const inputRef = React.useRef();
  const containerRef = React.useRef();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selection) => {
    setIsOpen(false);
    onChange(selection);
  };

  // Close dropdown when anything else is clicked.
  useEffect(() => {
    function _closeOnBlur(e) {
      if (e.target === containerRef.current || e.target === inputRef.current) return;
      else setIsOpen(false);
    }
    document.addEventListener('click', _closeOnBlur, false);
    return () => document.removeEventListener('click', _closeOnBlur, false);
  }, [containerRef.current, inputRef.current]);

  return (
    <S.DropdownContainer>
      <S.DropdownHeader ref={inputRef} onClick={() => setIsOpen(!isOpen)}>
        {value}
        <S.IconWrapper>
          <S.Icon icon={ICONS.chevronRight} width={25} height={25} fill={theme.colors.primary} />
        </S.IconWrapper>
      </S.DropdownHeader>
      <S.DropdownListContainer ref={containerRef} isOpen={isOpen} dropUp={dropUp}>
        <S.DropdownList>
          {options?.map((option) => (
            <S.ListItem key={option} onClick={() => handleSelect(option)}>
              {option}
            </S.ListItem>
          ))}
        </S.DropdownList>
      </S.DropdownListContainer>
    </S.DropdownContainer>
  );
}
