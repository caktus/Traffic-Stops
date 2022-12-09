import React from 'react';

// Sentry/Error Boundaries
import * as Sentry from '@sentry/react';

// PropTypes
import PropTypes from 'prop-types';

// Router
import { Route } from 'react-router-dom';

export const MIN_DELAY = 10000;

function FJRoute({ renderLoading, renderError, importComponent, ...props }) {
  return (
    <Route {...props}>
      <Sentry.ErrorBoundary fallback={renderError ? renderError() : <p>Error loading...</p>}>
        {importComponent}
      </Sentry.ErrorBoundary>
    </Route>
  );
}

FJRoute.propTypes = {
  importComponent: PropTypes.instanceOf(Object).isRequired,
  renderLoading: PropTypes.func,
  renderError: PropTypes.func,
};

export default FJRoute;
