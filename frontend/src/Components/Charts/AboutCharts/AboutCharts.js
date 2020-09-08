import React from 'react';
import { AboutChartsStyled } from './AboutCharts.styled';

function AboutCharts({ agency }) {
  return (
    <AboutChartsStyled>
      <h2>Agency Data for {agency && agency.name}</h2>
      <p>
        Here are some charts with statistics. This is a paragaph explaining how to use these charts.
      </p>
    </AboutChartsStyled>
  );
}

export default AboutCharts;
