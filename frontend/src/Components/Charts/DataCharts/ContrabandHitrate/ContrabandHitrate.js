import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from '../UseOfForce/node_modules/util/toTitleCase';

// State
import useDataset, { CONTRABAND_HIT_RATE } from 'Hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartPrimitives/ChartBase';
import Select from 'Components/Elements/Inputs/Select';
import Bar from 'Components/Charts/ChartPrimitives/Bar';
import ContrabandHitrateTable from 'Components/Tables/ContrabandHitrateTable';

const CHART_TITLE = 'Contraband Hit-rate';

// In most cases, the reverse of this order ends up on the screen
const GROUP_KEYS = ['hispanic', 'other', 'asian', 'native_american', 'black', 'white'];

const YEARS_ALL = 'total';

function ContrabandHitrate() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);
  const [availableYears, setAvailableYears] = useState([]);
  const [yearSelected, setYearSelected] = useState(YEARS_ALL);

  /* LIFECYCLE AND DATA PREP */

  useEffect(() => {
    const data = chartState.data[CONTRABAND_HIT_RATE];
    if (data) {
      const { contraband } = data;
      const years = contraband.map((s) => s.year);
      setAvailableYears(years);
    }
  }, [chartState.data[CONTRABAND_HIT_RATE]]);

  /* DATA MAPPING */

  const _reduceDataByEthnicity = (data, ethnicGroup) => {
    return data.reduce((acc, curr) => {
      return { [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] };
    });
  };

  const _getQuantityForYear = (data, year, ethnicGroup) => {
    return data.find((d) => d.year === year)[ethnicGroup];
  };

  const _caclulateHitRate = (contraband, searches) => {
    return searches === 0 ? 0 : Math.round((contraband / searches) * 100);
  };

  const mapData = () => {
    const data = chartState.data[CONTRABAND_HIT_RATE];
    const mappedData = [];
    if (data) {
      const { contraband, searches } = data;
      GROUP_KEYS.forEach((ethnicGroup) => {
        const groupBar = {};
        const displaName = toTitleCase(ethnicGroup);
        groupBar.displayName = displaName;
        groupBar.color = theme.colors.ethnicGroup[ethnicGroup];
        groupBar.x = displaName;
        if (yearSelected === YEARS_ALL) {
          const groupContraband = _reduceDataByEthnicity(contraband, ethnicGroup)[ethnicGroup];
          const groupSearches = _reduceDataByEthnicity(searches, ethnicGroup)[ethnicGroup];
          groupBar.y = _caclulateHitRate(groupContraband, groupSearches);
        } else {
          const yearInt = parseInt(yearSelected);
          const groupContrabandForYear = _getQuantityForYear(contraband, yearInt, ethnicGroup);
          const groupSearchesForYear = _getQuantityForYear(searches, yearInt, ethnicGroup);
          groupBar.y = _caclulateHitRate(groupContrabandForYear, groupSearchesForYear);
        }
        mappedData.push(groupBar);
      });
    }
    return mappedData;
  };

  return (
    <>
      <ChartBase
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        hideLegend
        getLabelFromKey={(key) => toTitleCase(key)}
        renderAdditionalFilter={() => (
          <Select
            label="Year"
            value={yearSelected}
            onChange={(e) => setYearSelected(e.target.value)}
            options={availableYears.map((year) => ({ name: year, value: year }))}
            nullValue={{ name: 'Total', value: YEARS_ALL }}
          />
        )}
        chartTitle={CHART_TITLE}
        datasetKey={CONTRABAND_HIT_RATE}
        chartState={chartState}
        data-testid={CHART_TITLE}
      >
        <Bar
          chartProps={{ horizontal: true, domainPadding: { x: 10 } }}
          xAxisProps={{ tickValues: GROUP_KEYS.map((k) => toTitleCase(k)), crossAxis: false }}
          yAxisProps={{ domain: [0, 100], tickFormat: (t) => `${t}%`, crossAxis: false }}
          barProps={{
            labels: ({ datum }) => `${datum.y}%`,
            style: {
              labels: { fontSize: 10 },
              data: { fill: ({ datum }) => datum.color },
            },
          }}
        />
      </ChartBase>
      <ContrabandHitrateTable data={chartState.data[CONTRABAND_HIT_RATE]} />
    </>
  );
}

export default ContrabandHitrate;
