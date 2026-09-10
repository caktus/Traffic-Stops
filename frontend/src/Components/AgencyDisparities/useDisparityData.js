import { useEffect, useState } from 'react';

import axios from '../../Services/Axios';

// Fetches a disparities endpoint and tracks loading/error state. The response
// payload nests its rows under a key ("agencies" or "sheriffs"). The effect
// re-runs whenever the URL changes, which already encodes the year/race filters.
export default function useDisparityData(url, key = 'agencies') {
  const [state, setState] = useState({ rows: [], payload: {}, loading: true, error: false });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    axios
      .get(url)
      .then((res) => {
        if (active)
          setState({
            rows: res.data[key] || [],
            payload: res.data || {},
            loading: false,
            error: false,
          });
      })
      .catch(() => {
        if (active) setState({ rows: [], payload: {}, loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [url, key]);

  return state;
}
