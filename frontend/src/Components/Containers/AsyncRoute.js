import React from 'react';

// Sentry/Error Boundaries
import * as Sentry from '@sentry/react';

// Async component tools
import loadable from '@loadable/component';

// PropTypes
import PropTypes from 'prop-types';

// Router
import { Route } from 'react-router-dom';

// const MIN_DELAY = 500;
// export const MIN_DELAY = 1000;

// TODO: implement a delay before showing loading!
const AsyncPage = loadable(({ importComponent }) => importComponent());

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
