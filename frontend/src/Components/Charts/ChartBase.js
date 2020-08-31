import React from 'react';
import { ChartBaseStyled } from './ChartBase.styled';
import { AnimatePresence } from 'framer-motion';

function ChartBase({ children }) {
  return (
    <AnimatePresence>
      <ChartBaseStyled
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
      >
        {children}
      </ChartBaseStyled>
    </AnimatePresence>
  );
}

export default ChartBase;
