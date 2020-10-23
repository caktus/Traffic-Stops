export const DATASET_FETCH_START = 'DATASET_FETCH_START';
export const DATASET_FETCH_SUCCESS = 'DATASET_FETCH_SUCCESS';
export const DATASET_FETCH_FAILURE = 'DATASET_FETCH_FAILURE';

export const initialState = {
  loading: {},
  chartErrors: {},
  chartData: {},
};

const chartStateReducer = (state, action) => {
  switch (action.type) {
    case DATASET_FETCH_START: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: true },
        chartErrors: { ...state.chartErrors, [action.dataset]: false },
      };
    }
    case DATASET_FETCH_SUCCESS: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: false },
        chartData: { ...state.chartData, [action.dataset]: action.payload },
        chartErrors: { ...state.chartErrors, [action.dataset]: false },
      };
    }
    case DATASET_FETCH_FAILURE: {
      return {
        ...state,
        loading: { ...state.loading, [action.dataset]: false },
        chartErrors: { ...state.chartData, [action.dataset]: action.payload },
      };
    }

    default:
      return state;
  }
};

export default chartStateReducer;
