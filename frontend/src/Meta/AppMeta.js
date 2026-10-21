import React from 'react';
import { Helmet } from 'react-helmet';

function AppMeta() {
  return (
    <Helmet>
      {/* Set charset */}
      <meta charset="utf-8" />

      {/* Set viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Set site description */}
      <meta name="description" content="NC CopWatch" />

      {/* Possibly temporary? Get fonts from gapi */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      {/* Default site title */}
      <title>NC CopWatch</title>
    </Helmet>
  );
}

export default AppMeta;
