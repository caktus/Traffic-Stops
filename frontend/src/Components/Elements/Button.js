import React from 'react';
import { Button } from 'reaktus';

function FjButton({ children, ...props }) {
  return (
    <Button boxShadow="none" borderRadius="standard" fontFamily="body" {...props}>
      {children}
    </Button>
  );
}

export default FjButton;
