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
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;700&family=Oxygen:wght@300;400;700&display=swap"
        rel="stylesheet"
      />

      {/* Default site title */}
      <title>NC CopWatch</title>
    </Helmet>
  );
}

export default AppMeta;
