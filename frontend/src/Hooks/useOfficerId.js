// import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useOfficerId() {
  return new URLSearchParams(useLocation().search).get('officer');
}

export default useOfficerId;
