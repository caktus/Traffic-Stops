import { useEffect } from 'react';

function useObservable({ observableRef, onIntersect, scrollAreaRef }) {
  useEffect(() => {
    const element = scrollAreaRef?.current || observableRef?.current;
    function handleObserved([intersection]) {
      if (intersection.isIntersecting) onIntersect();
    }
    if (element) {
      const observerOptions = {};
      let observer = new IntersectionObserver(handleObserved, observerOptions);
      observer.observe(element);
    }
  }, [observableRef, onIntersect, scrollAreaRef]);
}

export default useObservable;
