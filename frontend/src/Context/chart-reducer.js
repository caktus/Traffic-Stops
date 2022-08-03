export const DATASET_FETCH_START = 'DATASET_FETCH_START';
export const DATASET_FETCH_SUCCESS = 'DATASET_FETCH_SUCCESS';
export const DATASET_FETCH_FAILURE = 'DATASET_FETCH_FAILURE';

export const initialState = {
  loading: {},
  errors: {},
  data: {},
  compareData: {},
};

const chartStateReducer = (state, action) => {
  switch (action.type) {
    case DATASET_FETCH_START: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: true },
        errors: { ...state.errors, [action.dataset]: false },
      };
    }
    case DATASET_FETCH_SUCCESS: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: false },
        data: { ...state.data, [action.dataset]: action.payload },
        errors: { ...state.errors, [action.dataset]: false },
      };
    }
    case DATASET_FETCH_FAILURE: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: false },
        errors: { ...state.data, [action.dataset]: action.payload },
      };
    }

    default:
      return state;
  }
};

export default chartStateReducer;
