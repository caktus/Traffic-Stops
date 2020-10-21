import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function SkeletonBase(props) {
  return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0.35, x: -50, duration: 350 }}
          animate={{ opacity: 1, x: 0, duration: 350 }}
          exit={{ opacity: 0.35, x: 50, duration: 350 }}
          transition={{ ease: 'easeIn' }}
        >
          {props.children}
        </motion.div>
    </AnimatePresence>
  );
}

export default SkeletonBase;
