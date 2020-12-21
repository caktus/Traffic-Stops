import React from 'react';
import useObservable from 'Hooks/useObservable';

function HashObserver({ children, hashId, elementId }) {
  let observableRef = React.createRef();
  useObservable({
    observableRef,
    onIntersect: () => {
      console.log('hashId: ', hashId);
    },
  });

  return (
    <div id={elementId || hashId} ref={observableRef}>
      {children}
    </div>
  );
}

export default HashObserver;
