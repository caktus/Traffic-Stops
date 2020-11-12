export const FETCH_START = 'FETCH_START';
export const FETCH_SUCCESS = 'FETCH_SUCCESS';
export const FETCH_FAILURE = 'FETCH_FAILURE';
export const SET_SHOW_SEARCH = 'SET_SHOW_SEARCH';

export const initialState = {
  loading: {},
  errors: {},
  data: {},
  showHeaderSearch: false,
};

const rootReducer = (state, action) => {
  switch (action.type) {
    case SET_SHOW_SEARCH: {
      return {
        ...state,
        showHeaderSearch: action.payload,
      };
    }
    case FETCH_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.dataSet]: true,
        },
        errors: initialState.errors,
      };
    }
    case FETCH_SUCCESS: {
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.dataSet]: false,
        },
        data: {
          ...state.data,
          [action.dataSet]: action.payload,
        },
        errors: initialState.errors,
      };
    }
    case FETCH_FAILURE: {
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.dataSet]: false,
        },
        errors: {
          ...state.errors,
          [action.dataSet]: action.payload,
        },
      };
    }

    default:
      return state;
  }
};

export default rootReducer;
