import * as S from './CensusData.styled';
import { ABOUT_SLUG } from '../../Routes/slugs';
import { calculatePercentage, RACES } from '../Charts/chartUtils';
import { COLORS, SIZES } from '../../styles/StyledComponents/Typography';
import toTitleCase from '../../util/toTitleCase';
import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { useHistory } from 'react-router-dom';

export default function CensusData({ agencyDetails, showCompareDepartments }) {
  const history = useHistory();
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes, update } = usePopper(referenceElement, popperElement, {
    placement: 'top-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  useEffect(() => {
    if (popperElement) {
      // Force updating the position of the census tooltip when showing/hiding compare departments
      update();
    }
  }, [showCompareDepartments]);

  const showTooltip = () => {
    popperElement.setAttribute('data-show', true);
  };

  const hideTooltip = () => {
    popperElement.removeAttribute('data-show');
  };

  const censusData = () =>
    Object.keys(agencyDetails.census_profile).length > 0 ? (
      RACES.map((race) => {
        const profile = agencyDetails.census_profile;
        return (
          <S.CensusDatum key={race}>
            <S.CensusRace color={COLORS[0]} size={SIZES[0]}>
              {toTitleCase(race)}
              {race !== 'hispanic' && '*'}
            </S.CensusRace>
            <S.Datum size={SIZES[0]}>{calculatePercentage(profile[race], profile.total)}%</S.Datum>
          </S.CensusDatum>
        );
      })
    ) : (
      <S.NoCensus>There is no census data for {agencyDetails.name}</S.NoCensus>
    );

  return (
    <>
      <S.Tooltip ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        Sourced from most receent U.S. Census Bureau. See About page for more info.
      </S.Tooltip>
      <S.CensusDemographics>
        <S.CensusTitle
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          ref={setReferenceElement}
          onClick={() => history.push(ABOUT_SLUG)}
        >
          CENSUS DEMOGRAPHICS
        </S.CensusTitle>
        <S.CensusRow>{censusData()}</S.CensusRow>
      </S.CensusDemographics>
      <S.CensusDemographicsMobile>
        <summary>
          <S.CensusTitleMobile>CENSUS DEMOGRAPHICS</S.CensusTitleMobile>
        </summary>
        <p>
          {censusData()}
          <a href={ABOUT_SLUG}>
            Sourced from most recent U.S. Census Bureau. See About page for more info.
          </a>
        </p>
      </S.CensusDemographicsMobile>
    </>
  );
}
