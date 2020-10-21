export const BASE_FETCH_START = 'BASE_FETCH_START';
export const BASE_FETCH_SUCCESS = 'BASE_FETCH_SUCCESS';
export const BASE_FETCH_FAILURE = 'BASE_FETCH_FAILURE';

export const CHART_FETCH_START = 'CHART_FETCH_START';
export const CHART_FETCH_SUCCESS = 'CHART_FETCH_SUCCESS';
export const CHART_FETCH_FAILURE = 'CHART_FETCH_FAILURE';

export const initialState = {
  loading: {},
  chartErrors: {},
  chartData: {},
};

const chartStateReducer = (state, action) => {
  switch (action.type) {
    case BASE_FETCH_START: {
      return {
        ...state,
        loading: { ...state.loading, base: true },
        chartErrors: { ...state.chartErrors, base: false },
      };
    }
    case BASE_FETCH_SUCCESS: {
      return {
        ...state,
        loading: { ...state.loading, base: false },
        chartData: { ...state.chartData, base: action.payload },
        chartErrors: { ...state.chartErrors, base: false },
      };
    }
    case BASE_FETCH_FAILURE: {
      return {
        ...state,
        loading: { ...state.loading, base: false },
        chartErrors: { ...state.chartData, base: action.payload },
      };
    }

    case CHART_FETCH_START: {
      return {
        ...state,
        loading: { ...state.loading, [action.chartName]: true },
        chartErrors: { ...state.chartErrors, [action.chartName]: false },
      };
    }
    case CHART_FETCH_SUCCESS: {
      return {
        ...state,
        loading: { ...state.loading, [action.chartName]: false },
        chartData: { ...state.chartData, [action.chartName]: action.payload },
        chartErrors: { ...state.chartErrors, [action.chartName]: false },
      };
    }
    case CHART_FETCH_FAILURE: {
      return {
        ...state,
        loading: { ...state.loading, [action.chartName]: false },
        chartErrors: { ...state.chartData, [action.chartName]: action.payload },
      };
    }

    default:
      return state;
  }
};

export default chartStateReducer;
