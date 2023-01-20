import React from 'react';

function LinkButton({ href, title }) {
  return (
    <a
      href={href}
      style={{
        padding: '15px',
        backgroundColor: '#00B2B0',
        borderRadius: 10,
        color: 'white',
        fontWeight: '700',
        textDecoration: 'none',
      }}
    >
      {title}
    </a>
  );
}

export default LinkButton;
