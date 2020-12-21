import React, { useState, createRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import useObservable from 'Hooks/useObservable';

/**
 * ObservableRender asynchronously loads a bundle when it comes in to view
 * @param {function} renderChild - should return jsx
 * @param {ref} scrollAreaRef - optional DOM ref to observe intersection with. Defaults to window.
 */
function ObservableRender({ renderChild, scrollAreaRef }) {
  const [shouldRenderChild, setShouldRenderChild] = useState(false);
  let observableRef = createRef();

  useObservable({
    observableRef,
    scrollAreaRef,
    onIntersect: () => setShouldRenderChild(true),
  });

  return (
    <StyledObservable ref={observableRef}>{shouldRenderChild && renderChild()}</StyledObservable>
  );
}

ObservableRender.displayName = 'ObservableRender';

ObservableRender.propTypes = {
  /** Defaults to a div around the wrapped object. If provided, must be a ref of any element currently in the DOM */
  scrollAreaRef: PropTypes.shape({ current: PropTypes.any }),
};

const StyledObservable = styled.div`
  min-height: 90vh;
`;

export default ObservableRender;

/**
 * when url == "#myChart"
 */
