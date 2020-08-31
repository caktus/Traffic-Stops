import React from 'react';

// Sentry/Error Boundaries
import * as Sentry from '@sentry/react';

// Async component tools
import loadable from '@loadable/component';
import pMinDelay from 'p-min-delay';

// PropTypes
import PropTypes from 'prop-types';

// Router
import { Route } from 'react-router-dom';

// const MIN_DELAY = 500;
const MIN_DELAY = 50000;

const AsyncPage = loadable(({ importComponent }) => pMinDelay(importComponent(), MIN_DELAY));

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
