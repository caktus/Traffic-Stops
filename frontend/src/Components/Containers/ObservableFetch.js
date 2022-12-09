import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';

const initialState = {
  data: null,
  fetching: false,
  error: false,
};

function reducer(state, action) {
  switch (action.type) {
    case FETCH_START:
      return {
        fetching: true,
        error: false,
      };
    case FETCH_SUCCESS:
      return {
        data: {
          ...state.data,
          [action.payload.fetchName]: action.payload.fetchData,
        },
        fetching: false,
        error: false,
      };
    case FETCH_ERROR:
      return {
        fetching: false,
        error: 'There was an error fetching this data.',
      };
    default:
      throw new Error();
  }
}

const FETCH_START = 'FETCH_START';
const FETCH_SUCCESS = 'FETCH_SUCCESS';
const FETCH_ERROR = 'FETCH_ERROR';

/**
 * ObservableFetch hydrates wrapped components with the following props after
 * fetching from a list of urls.
 * - fetching {boolean} - fetch in progress
 * - error {string} - any resultant errors
 * - data {object} - result of successful fetches, arranged by original url key
 */
function ObservableFetch({ children, urls, scrollAreaRef, fetchMethod }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const observableRef = React.createRef();

  useEffect(() => {
    const element = scrollAreaRef.current || observableRef.current;
    function handleObserved([intersection], self) {
      if (intersection.isIntersecting) {
        dispatch({ type: FETCH_START });
        // eslint-disable-next-line no-restricted-syntax,guard-for-in
        for (const fetchName in urls) {
          fetchMethod(urls[fetchName])
            .then((response) => {
              dispatch({
                type: FETCH_SUCCESS,
                payload: {
                  fetchName,
                  fetchData: response.data,
                },
              });
              self.unobserve(intersection.target);
            })
            .catch((error) => {
              dispatch({ type: FETCH_ERROR, payload: error });
              self.unobserve(intersection.target);
            });
        }
      }
    }
    if (element) {
      const observerOptions = {};
      const observer = new IntersectionObserver(handleObserved, observerOptions);
      observer.observe(element);
    }
  }, []);

  return (
    <div data-name="Observable" ref={observableRef}>
      {React.cloneElement(children, state)}
    </div>
  );
}

ObservableFetch.displayName = 'Observable';

ObservableFetch.propTypes = {
  /** An object containing keys whose values the urls from which to fetch. Keys will be used in resultant `data` */
  urls: PropTypes.objectOf(PropTypes.string).isRequired,
  /** Defaults to a div around the wrapped object. If provided, must be a ref of any element currently in the DOM */
  // eslint-disable-next-line react/forbid-prop-types
  scrollAreaRef: PropTypes.shape({ current: PropTypes.any }),
  /** method by which to fetch. Must return a promise. Ex. fetchMethod={axios.get}. So that you can use a pre-configured client. */
  fetchMethod: PropTypes.instanceOf(Object),
};

ObservableFetch.defaultProps = {};

export default ObservableFetch;
