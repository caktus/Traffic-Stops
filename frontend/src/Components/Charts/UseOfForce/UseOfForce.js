import React, { useState, useEffect } from 'react';
import { UseOfForceStyled } from './UseOfForce.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import {
  YEARS_DEFAULT,
  STATIC_LEGEND_KEYS,
  RACES,
  reduceFullDataset,
  calculatePercentage,
  calculateYearTotal,
} from '../chartUtils';

// State
import useDataset, { USE_OF_FORCE } from '../../../Hooks/useDataset';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import Legend from '../ChartSections/Legend/Legend';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import toTitleCase from '../../../util/toTitleCase';
import useOfficerId from "../../../Hooks/useOfficerId";
import GroupedBar from "../ChartPrimitives/GroupedBar";
import Pie from "../ChartPrimitives/Pie";

function UseOfForce() {
  let { agencyId } = useParams();
  const officerId = useOfficerId();
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [useOfForceData, setUseOfForceData] = useState([]);
  const [useOfForcePieData, setUseOfForcePieData] = useState([]);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  const subjectObserving = () => {
    if (officerId) {
      return "whom this officer";
    } else if (agencyId) {
      return "whom law enforcement officers";
    }
  }

  /* BUILD DATA */
  // Bar chart data
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      const mappedData = ethnicGroupKeys
        .filter((e) => e.selected)
        .map((eg) => {
          const ethnicGroup = eg.value;
          return {
            id: ethnicGroup,
            color: theme.colors.ethnicGroup[ethnicGroup],
            data: data.map((d) => ({
              x: d.year,
              y: d[ethnicGroup],
              ethnicGroup: eg.label,
              color: theme.colors.ethnicGroup[ethnicGroup],
            })),
          };
        });
      setUseOfForceData(mappedData);
    }
  }, [chartState.data[USE_OF_FORCE], ethnicGroupKeys]);

  // Pie chart data
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      if (!year || year === YEARS_DEFAULT) {
        setUseOfForcePieData(reduceFullDataset(data, RACES, theme));
      } else {
        const yearData = data.find((d) => d.year === year);
        const total = calculateYearTotal(yearData);
        setUseOfForcePieData(
          RACES.map((race) => {
            const rData = {
              x: toTitleCase(race),
              color: theme.colors.ethnicGroup[race],
              fontColor: theme.colors.fontColorsByEthnicGroup[race],
            };
            rData.y = yearData ? calculatePercentage(yearData[race], total) : 0;
            return rData;
          })
        );
      }
    }
  }, [chartState.data[USE_OF_FORCE], year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };
  // Handle stops by percentage legend interactions
  const handleGroupKeySelected = (ethnicGroup) => {
    const groupIndex = ethnicGroupKeys.indexOf(
      ethnicGroupKeys.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...ethnicGroupKeys];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setEthnicGroupKeys(updatedGroups);
  };
  const handleViewData = () => {
    openModal(USE_OF_FORCE, TABLE_COLUMNS);
  };

  return (
    <UseOfForceStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle="Use of Force" handleViewData={handleViewData} />
        <S.ChartDescription>
          <P>
            Shows the race/ethnic composition of drivers {subjectObserving()} reported
            using force against
          </P>
        </S.ChartDescription>
        <S.ChartSubsection>
          <S.LineSection>
            <S.LineWrapper>
              <GroupedBar
                data={useOfForceData}
                iTickFormat={(t) => (t % 2 === 0 ? t : null)}
                iTickValues={chartState.yearSet}
                loading={chartState.loading[USE_OF_FORCE]}
                toolTipFontSize={16}
                dAxisProps={{
                  tickFormat: (t) => `${t}`,
                }}
              />
            </S.LineWrapper>
            <S.LegendBelow>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleGroupKeySelected}
                showNonHispanic
                row
              />
            </S.LegendBelow>
          </S.LineSection>
          <S.PieSection>
            <S.PieWrapper>
              <Pie data={useOfForcePieData} loading={chartState.loading[USE_OF_FORCE]} />
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelected}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </UseOfForceStyled>
  );
}

export default UseOfForce;

const TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'White*',
    accessor: 'white',
  },
  {
    Header: 'Black*',
    accessor: 'black',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
];
