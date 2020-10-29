import React, { useState, useEffect } from 'react';
import { ChartBaseStyled } from './ChartBase.styled';

// Children
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';
import ResponsiveChartContainer from 'Components/Charts/ResponsiveChartContainer.styled';
import Legend from './Legend/Legend';

function ChartBase({
  children,
  datasetKey,
  hideLegend,
  chartState,
  chartTitle,
  mapData,
  groupKeys,
  getLabelFromKey,
  renderAdditionalFilter,
  ...props
}) {
  const [keysToShow, setKeysToShow] = useState(groupKeys);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const mapped = mapData(keysToShow);
    setData(mapped);
  }, [keysToShow, mapData]);

  const handleLegendKeyClick = (keyId) => {
    let newKeys = [...keysToShow];
    if (keysToShow.includes(keyId)) newKeys = newKeys.filter((k) => k !== keyId);
    else newKeys.push(keyId);
    setKeysToShow(newKeys);
  };

  // set isLoading
  useEffect(() => {
    if (Array.isArray(datasetKey)) {
      const loadingStates = datasetKey.map((dk) => chartState?.loading[dk]);
      setIsLoading(loadingStates.some(Boolean));
    } else setIsLoading(chartState?.loading[datasetKey]);
  }, [chartState?.loading[datasetKey]]);

  // set hasError
  useEffect(() => {
    if (Array.isArray(datasetKey)) {
      const errorsPresent = datasetKey.map((dk) => chartState?.chartErrors[dk]);
      setHasError(errorsPresent.some((e) => e));
    } else setHasError(chartState?.chartErrors[datasetKey]);
  }, [chartState?.chartErrors[datasetKey]]);

  return (
      <ChartBaseStyled
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
        {...props}
      >
        {hasError && <p>some chart error message</p>}
        {isLoading && <ChartSkeleton />}
        <h2>{chartTitle}</h2>
        {!hideLegend && (
          <Legend
            groupKeys={groupKeys}
            keysToShow={keysToShow}
            handleLegendKeyClick={handleLegendKeyClick}
            getLabelFromKey={getLabelFromKey}
          />
        )}
        {renderAdditionalFilter && renderAdditionalFilter()}
        <ResponsiveChartContainer>
          {data.length > 0 && React.cloneElement(children, { data })}
        </ResponsiveChartContainer>
      </ChartBaseStyled>
  );
}

export default ChartBase;
