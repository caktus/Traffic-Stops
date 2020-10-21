

import React from 'react';
import ContentLoader from 'react-content-loader';
import { AnimatePresence, motion } from 'framer-motion';

function SmallContentSkeleton() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
      >
        <ContentLoader
          viewBox="0 0 400 200"
          height={200}
          width={400}
          speed={2}
          data-testid="SmallContentSkeleton"
        >
          <rect x="0" y="0" rx="3" ry="3" width="67" height="11" /> 
          <rect x="76" y="0" rx="3" ry="3" width="140" height="11" /> 
          <rect x="127" y="48" rx="3" ry="3" width="53" height="11" /> 
          <rect x="187" y="48" rx="3" ry="3" width="72" height="11" /> 
          <rect x="18" y="48" rx="3" ry="3" width="100" height="11" /> 
          <rect x="0" y="71" rx="3" ry="3" width="37" height="11" /> 
          <rect x="18" y="23" rx="3" ry="3" width="140" height="11" /> 
          <rect x="166" y="23" rx="3" ry="3" width="173" height="11" />
        </ContentLoader>
      </motion.div>
    </AnimatePresence>
  );
}

export default SmallContentSkeleton;
