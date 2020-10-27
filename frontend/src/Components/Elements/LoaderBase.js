import React, { useEffect, useState } from 'react';

// Deps
import { AnimatePresence, motion } from 'framer-motion';

const LOADER_DELAY = 300;

function LoaderBase({ children }) {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowLoader(true);
    }, LOADER_DELAY);
    return () => clearTimeout(t);
  }, []);

  return showLoader ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  ) : null;
}

export default LoaderBase;
