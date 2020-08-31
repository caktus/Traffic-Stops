import React from 'react';
import ContentLoader from 'react-content-loader';
import { AnimatePresence, motion } from 'framer-motion';

function ChartSkeleton() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
      >
        <ContentLoader viewBox="0 0 400 200" height={200} width={400} speed={2}>
          <rect x="100" y="5" rx="0" ry="0" width="200" height="15" />
          <circle cx="140" cy="110" r="70" />
          <rect x="230" y="50" rx="0" ry="0" width="7" height="7" />
          <rect x="250" y="50" rx="0" ry="0" width="30" height="7" />
          <rect x="230" y="64" rx="0" ry="0" width="7" height="7" />
          <rect x="250" y="64" rx="0" ry="0" width="30" height="7" />
          <rect x="230" y="78" rx="0" ry="0" width="7" height="7" />
          <rect x="250" y="78" rx="0" ry="0" width="30" height="7" />
          <rect x="230" y="92" rx="0" ry="0" width="7" height="7" />
          <rect x="250" y="92" rx="0" ry="0" width="30" height="7" />
        </ContentLoader>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChartSkeleton;
