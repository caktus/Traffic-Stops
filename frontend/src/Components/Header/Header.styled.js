import styled from 'styled-components';
import { motion } from 'framer-motion';

export const Header = styled.header`
  position: relative;
  width: 100%;
  border-bottom: ${(props) => props.theme.borders.standard};
  border-bottom-color: ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.primary};
  /* padding: 1.2rem 2.5rem; */
  height: 80px;
`;

export const Logos = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
`;

export const HeaderNavWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 2em;
`;

export const SearchWrapper = styled(motion.div)`
  position: absolute;
  left: 50%;
  z-index: 10;
  width: calc(333px + 5vw);
`;
