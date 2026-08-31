import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTheme } from 'styled-components';

import axios from '../../Services/Axios';
import { DISPARITY_YEARS_URL } from '../../Services/endpoints';
import { AGENCY_LIST_SLUG } from '../../Routes/slugs';

import DataSubsetPicker from '../Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import FjButton from '../Elements/Button';
import { ICONS } from '../../img/icons/Icon';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';

import DisparityBarChart from './DisparityBarChart';
import SheriffCountyMap from './SheriffCountyMap';
import PoliceBubbleMap from './PoliceBubbleMap';
import ParityScatter from './ParityScatter';
import { RACE_OPTIONS, DEFAULT_RACE, ALL_YEARS } from './disparityConstants';
import * as S from './AgencyDisparities.styled';

export default function AgencyDisparities() {
  const history = useHistory();
  const theme = useTheme();
  const [years, setYears] = useState([]);
  const [yearSelection, setYearSelection] = useState(ALL_YEARS);
  const [race, setRace] = useState(DEFAULT_RACE);

  useEffect(() => {
    let active = true;
    axios
      .get(DISPARITY_YEARS_URL)
      .then((res) => active && setYears(res.data.years || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // The API treats an absent year as "all available data".
  const year = yearSelection === ALL_YEARS ? undefined : yearSelection;
  const yearOptions = [ALL_YEARS, ...years.map((y) => String(y))];
  const chartProps = { year, race };

  return (
    <S.Page>
      <S.PageTitle>Agency-Level Stop Disparities</S.PageTitle>

      <S.Intro>
        <p>
          <strong>Likelihood of stop</strong> — The likelihood of stop compares the rate at which
          drivers of different racial groups are stopped by a law enforcement agency. NC CopWatch
          calculates a Stop Rate Ratio to show how much more or less likely Non-White drivers are to
          be stopped compared with white drivers. A ratio of 1.0 means drivers are stopped at the
          same rate. A ratio above 1.0 means the selected racial group is more likely to be stopped
          than white drivers.
        </p>
        <S.Note>
          The calculation uses traffic stop data and U.S. Census Bureau population data. Yearly data
          is currently available through 2023. Because the calculation requires 5-year American
          Community Survey (ACS) data, Stop Rate Ratios cannot currently be calculated for 2024 or
          later. However, users can select any available year from the available period to compare
          agency-level disparities, or view the ranking based on all available data.
        </S.Note>
      </S.Intro>

      <S.Filters>
        <DataSubsetPicker
          label="Year"
          value={yearSelection}
          onChange={(selection) => setYearSelection(selection)}
          options={yearOptions}
          dropDown
          labelOnLeft
          dropdownWidth="120px"
        />
        <DataSubsetPicker
          label="Race"
          value={race}
          onChange={(selection) => setRace(selection)}
          options={RACE_OPTIONS}
          dropDown
          labelOnLeft
          dropdownWidth="160px"
        />
      </S.Filters>

      <S.Section>
        <DisparityBarChart {...chartProps} />
      </S.Section>

      <S.Section>
        <S.SectionTitle>Where are stop disparities occurring across North Carolina?</S.SectionTitle>
        <S.SectionTitle as="h3">Sheriff&apos;s Offices: Stop Rate Ratios by County</S.SectionTitle>
        <S.SectionCopy>
          Because North Carolina sheriff&apos;s offices generally have countywide jurisdictions,
          county boundaries provide a useful way to visualize disparities in stops by sheriff&apos;s
          office.
        </S.SectionCopy>
        <SheriffCountyMap {...chartProps} />
      </S.Section>

      <S.Section>
        <S.SectionTitle as="h3">
          Police Departments: Stop Rate Ratios Across North Carolina
        </S.SectionTitle>
        <S.SectionCopy>
          Unlike sheriff&apos;s offices, municipal police departments may operate within the same
          county. Each bubble represents an individual police department, allowing users to see
          differences between agencies operating in the same geographic area.
        </S.SectionCopy>
        <PoliceBubbleMap {...chartProps} />
      </S.Section>

      <S.Section>
        <S.SectionTitle>How Do Traffic Stops Compare With the Community Population?</S.SectionTitle>
        <S.SectionCopy>
          This chart compares each racial group&apos;s share of the local population with its share
          of traffic stops. Each dot represents a law enforcement agency. When a racial group
          accounts for a larger share of traffic stops than its share of the population, the agency
          appears above the parity line. When the two shares are similar, the agency falls closer to
          the line.
        </S.SectionCopy>
        <ParityScatter {...chartProps} />
      </S.Section>

      <S.BottomLink>
        <FjButton
          variant="positive"
          border={`2px solid ${theme.colors.primary}`}
          {...ChartHeaderStyles.ButtonInlines}
          onClick={() => history.push(AGENCY_LIST_SLUG)}
        >
          <ChartHeaderStyles.Icon
            icon={ICONS.arrowRight}
            height={25}
            width={25}
            fill={theme.colors.white}
          />
          Explore Your Agency&apos;s Full Traffic Stop Data
        </FjButton>
      </S.BottomLink>
    </S.Page>
  );
}
