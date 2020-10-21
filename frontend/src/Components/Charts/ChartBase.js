import React, { useState, useEffect } from 'react';
import { ChartBaseStyled } from './ChartBase.styled';
import { AnimatePresence } from 'framer-motion';

// Children
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';
import ResponsiveChartContainer from "Components/Charts/ResponsiveChartContainer.styled"
import Legend from './Legend/Legend';

function ChartBase({
  children, 
  chartKey, 
  chartState, 
  chartTitle,
  rawData,
  mapData,
  groupKeys,
  getLabelFromKey,
  renderAdditionalFilter,
  ...props 
}) {
  const [keysToShow, setKeysToShow] = useState(groupKeys)
  const [data, setData] = useState([])

  useEffect(() => {
    const mapped = mapData(rawData, keysToShow)
    setData(mapped)
  },[rawData, keysToShow, mapData])

  const handleLegendKeyClick = (keyId) => {
    let newKeys = [ ...keysToShow];
    if (keysToShow.includes(keyId)) newKeys = newKeys.filter(k => k !== keyId)
    else newKeys.push(keyId)
    setKeysToShow(newKeys)
  }

  useEffect(() => {

  }, [data])

  return (
    <AnimatePresence>
      <ChartBaseStyled
        initial={{ opacity: 0.35, x: -50, duration: 350 }}
        animate={{ opacity: 1, x: 0, duration: 350 }}
        exit={{ opacity: 0.35, x: 50, duration: 350 }}
        transition={{ ease: 'easeIn' }}
        {...props}
      >
        {chartState.loading[chartKey]}
        {chartState?.chartErrors[chartKey] && <p>some chart error message</p>}
        {chartState?.loading[chartKey] && <ChartSkeleton />}
        <h2>{chartTitle}</h2>
        {<Legend groupKeys={groupKeys} keysToShow={keysToShow} handleLegendKeyClick={handleLegendKeyClick} getLabelFromKey={getLabelFromKey} />}
        {renderAdditionalFilter && renderAdditionalFilter()}
        <ResponsiveChartContainer>
          {React.cloneElement(children, { data })}
        </ResponsiveChartContainer>
      </ChartBaseStyled>
    </AnimatePresence>
  );
}

export default ChartBase;
