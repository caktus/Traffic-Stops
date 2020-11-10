import React from 'react';
import { AboutChartsStyled } from './AboutCharts.styled';

// State
import { useChartState } from 'Context/chart-state';

// Components
import SmallContentSkeleton from 'Components/Elements/Skeletons/SmallContentSkeleton'

function AboutCharts() {
  const [state] = useChartState();
  return (
    <AboutChartsStyled>
      {state.loading.base && <SmallContentSkeleton />}
      {state.chartData.base && 
        <>
          <h2>Agency Data for {state.chartData.base.name}</h2>
          <p>
            Here are some charts with statistics. This is a paragaph explaining how to use these charts.
          </p>
        </>
      }
    </AboutChartsStyled>
  );
}

export default AboutCharts;
