import React from 'react';
import { createRoot } from 'react-dom/client';
import * as serviceWorker from './serviceWorker';

import * as Sentry from '@sentry/react';

// Settings
import { SENTRY_DSN } from './settings';

// Children
import App from './Components/App';

// Eventually, we'll want to make sure NODE_ENV is set up
// so that the following commented code wont run locally.
if (process.env.NODE_ENV !== 'development') Sentry.init({ dsn: SENTRY_DSN });

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
