import styled from 'styled-components';
import { motion } from 'framer-motion';

export const HeaderStyled = styled.header`
  /* display: flex; */
  /* flex-direction: row; */
  /* align-items: center; */
  /* justify-content: space-between; */
  position: relative;
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

export const HeaderNavWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const SearchWrapper = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;
