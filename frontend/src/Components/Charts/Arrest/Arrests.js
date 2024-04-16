import React, { useEffect, useState } from 'react';
import ArrestsStyled from './Arrests.styles';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import PercentageOfStops from './Charts/PercentageOfStops';
import PercentageOfSearches from './Charts/PercentageOfSearches';
import CountOfStopsAndArrests from './Charts/CountOfStopsAndArrests';
import PercentageOfStopsForStopPurposeGroup from './Charts/PercentageOfStopsForPurposeGroup';
import PercentageOfStopsForStopPurpose from './Charts/PercentageOfStopsPerStopPurpose';
import PercentageOfSearchesForStopPurposeGroup from './Charts/PercentageOfSearchesForPurposeGroup';
import PercentageOfSearchesPerStopPurpose from './Charts/PercentageOfSearchesPerStopPurpose';
import PercentageOfStopsPerContrabandType from './Charts/PercentageOfStopsPerContrabandType';
import Switch from 'react-switch';
import { SwitchContainer } from '../TrafficStops/TrafficStops.styled';

function Arrests(props) {
  const { year } = props;
  const [togglePercentageOfStops, setTogglePercentageOfStops] = useState(true);
  const [togglePercentageOfSearches, setTogglePercentageOfSearches] = useState(true);

  const renderMetaTags = useMetaTags();
  const [renderTableModal] = useTableModal();

  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(`${window.location.hash}`).scrollIntoView();
    }
  }, []);

  const stopGraphToggle = () => (
    <SwitchContainer>
      <span>
        Switch to view {togglePercentageOfStops ? 'all stop purposes' : 'grouped stop purposes '}
      </span>
      <Switch
        onChange={() => setTogglePercentageOfStops(!togglePercentageOfStops)}
        checked={togglePercentageOfStops}
        className="react-switch"
      />
    </SwitchContainer>
  );

  const searchGraphToggle = () => (
    <SwitchContainer>
      <span>
        Switch to view {togglePercentageOfSearches ? 'all stop purposes' : 'grouped stop purposes '}
      </span>
      <Switch
        onChange={() => setTogglePercentageOfSearches(!togglePercentageOfSearches)}
        checked={togglePercentageOfSearches}
        className="react-switch"
      />
    </SwitchContainer>
  );

  return (
    <ArrestsStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <PercentageOfStops {...props} year={year} />
      <PercentageOfSearches {...props} year={year} />
      <CountOfStopsAndArrests {...props} year={year} />

      {togglePercentageOfStops ? (
        <PercentageOfStopsForStopPurposeGroup {...props} year={year}>
          {stopGraphToggle()}
        </PercentageOfStopsForStopPurposeGroup>
      ) : (
        <PercentageOfStopsForStopPurpose {...props} year={year}>
          {stopGraphToggle()}
        </PercentageOfStopsForStopPurpose>
      )}

      {togglePercentageOfSearches ? (
        <PercentageOfSearchesForStopPurposeGroup {...props} year={year}>
          {searchGraphToggle()}
        </PercentageOfSearchesForStopPurposeGroup>
      ) : (
        <PercentageOfSearchesPerStopPurpose {...props} year={year}>
          {searchGraphToggle()}
        </PercentageOfSearchesPerStopPurpose>
      )}

      <PercentageOfStopsPerContrabandType {...props} year={year} />
    </ArrestsStyled>
  );
}

export default Arrests;
