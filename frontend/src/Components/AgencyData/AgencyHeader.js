import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import * as S from './AgencyHeader.styled';
import { P, SIZES, WEIGHTS, COLORS } from '../../styles/StyledComponents/Typography';
import { usePopper } from 'react-popper';

// Routing
import { useHistory, useParams } from 'react-router-dom';

// Hooks
import useOfficerId from '../../Hooks/useOfficerId';

// Util
import { calculatePercentage, RACES } from '../Charts/chartUtils';
import toTitleCase from '../../util/toTitleCase';

import { ICONS } from '../../img/icons/Icon';
import { ABOUT_SLUG, AGENCY_LIST_SLUG } from '../../Routes/slugs';
import BackButton from '../Elements/BackButton';
import Button from '../Elements/Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';

function AgencyHeader({
  agencyHeaderOpen,
  agencyDetails,
  toggleShowCompare,
  showCompareDepartments,
  showCloseButton,
}) {
  const history = useHistory();
  const { agencyId } = useParams();
  const theme = useTheme();
  const officerId = useOfficerId();

  const handleGoToAgency = () => {
    history.push(`${AGENCY_LIST_SLUG}/${agencyId}`);
  };

  const lastReportedStop = () => {
    if (officerId) {
      return `last reported stop from officer`;
    }
    if (agencyId) {
      return `last reported stop from department`;
    }
    return '';
  };

  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [showCompareDepartments ? 0 : -300, 10],
        },
      },
    ],
  });

  const showTooltip = () => {
    popperElement.setAttribute('data-show', true);
  };

  const hideTooltip = () => {
    popperElement.removeAttribute('data-show');
  };

  return (
    <AnimatePresence>
      {agencyHeaderOpen && (
        <S.AgencyHeader>
          <S.SubHeaderNavRow>{!showCompareDepartments && <BackButton />}</S.SubHeaderNavRow>
          <S.SubHeaderContentRow>
            <S.EntityDetails>
              {officerId ? (
                <>
                  <S.AgencyTitle>Officer #{officerId}</S.AgencyTitle>
                  <S.AgencySub>
                    <P>from {agencyDetails.name}</P>
                    <S.GoToAgency onClick={() => handleGoToAgency()}>
                      View department statistics
                      <S.ViewIcon
                        icon={ICONS.arrowRight}
                        fill={theme.colors.primaryDark}
                        height={24}
                        width={24}
                      />
                    </S.GoToAgency>
                  </S.AgencySub>
                </>
              ) : (
                <S.AgencyTitle>{agencyDetails.name}</S.AgencyTitle>
              )}
              <P size={SIZES[0]} color={COLORS[0]} weight={WEIGHTS[0]}>
                {lastReportedStop()} {agencyDetails.last_reported_stop && 'on'}
                <S.ReportedDate size={SIZES[0]} color={COLORS[0]} weight={WEIGHTS[1]}>
                  {' '}
                  <S.ReportedDate size={SIZES[0]} color={COLORS[0]} weight={WEIGHTS[1]}>
                    {agencyDetails.last_reported_stop
                      ? new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(agencyDetails.last_reported_stop))
                      : 'Unknown'}
                  </S.ReportedDate>
                </S.ReportedDate>
              </P>
            </S.EntityDetails>
            <S.Tooltip ref={setPopperElement} style={styles.popper} {...attributes.popper}>
              Sourced from U.S. Census Bureau. See About page for more info.
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
              <S.CensusRow>
                {Object.keys(agencyDetails.census_profile).length > 0 ? (
                  RACES.map((race) => {
                    const profile = agencyDetails.census_profile;
                    return (
                      <S.CensusDatum key={race}>
                        <S.CensusRace color={COLORS[0]} size={SIZES[0]}>
                          {toTitleCase(race)}
                          {race !== 'hispanic' && '*'}
                        </S.CensusRace>
                        <S.Datum size={SIZES[0]}>
                          {calculatePercentage(profile[race], profile.total)}%
                        </S.Datum>
                      </S.CensusDatum>
                    );
                  })
                ) : (
                  <S.NoCensus>There is no census data for {agencyDetails.name}</S.NoCensus>
                )}
              </S.CensusRow>
            </S.CensusDemographics>
          </S.SubHeaderContentRow>
          {!showCloseButton && (
            <S.ShowDepartmentsButton>
              <Button
                variant="positive"
                border={`2px solid ${theme.colors.primary}`}
                {...ChartHeaderStyles.ButtonInlines}
                onClick={() => toggleShowCompare()}
              >
                <ChartHeaderStyles.Icon
                  icon={showCompareDepartments ? ICONS.checkboxFilled : ICONS.checkboxEmpty}
                  height={25}
                  width={25}
                  fill={theme.colors.white}
                />
                Compare Departments
              </Button>
            </S.ShowDepartmentsButton>
          )}
          {showCloseButton && (
            <div style={{ display: 'block' }}>
              <Button
                variant="positive"
                border={`2px solid ${theme.colors.primary}`}
                {...ChartHeaderStyles.ButtonInlines}
                onClick={() => toggleShowCompare()}
              >
                <ChartHeaderStyles.Icon
                  icon={ICONS.close}
                  height={25}
                  width={25}
                  fill={theme.colors.white}
                />
                Close
              </Button>
            </div>
          )}
        </S.AgencyHeader>
      )}
    </AnimatePresence>
  );
}

export default AgencyHeader;
