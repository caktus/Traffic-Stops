import React, { useState, useEffect } from 'react';

// Sentry/Error Boundaries
import * as Sentry from '@sentry/react';

// Async component tools
import loadable from '@loadable/component';
import pMinDelay from 'p-min-delay';

// PropTypes
import PropTypes from 'prop-types';

// Router
import { Route } from 'react-router-dom';

const SUSPENSE_TIMEOUT = 200;

const AsyncPage = loadable(({ importComponent }) => pMinDelay(importComponent(), SUSPENSE_TIMEOUT));

function AsyncRoute({ renderLoading, renderError, importComponent, ...props }) {
  return (
    <Route {...props}>
      <Sentry.ErrorBoundary fallback={renderError ? renderError() : <p>Error loading...</p>}>
        <AsyncPage
          importComponent={importComponent}
          fallback={renderLoading ? renderLoading() : <p>loading...</p>}
        />
      </Sentry.ErrorBoundary>
    </Route>
  );
}

AsyncRoute.propTypes = {
  importComponent: PropTypes.func.isRequired,
  renderLoading: PropTypes.func,
  renderError: PropTypes.func,
};

export default AsyncRoute;
