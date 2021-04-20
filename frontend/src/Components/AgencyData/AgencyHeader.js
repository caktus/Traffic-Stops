import React from 'react';
import { useTheme } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import * as S from './AgencyHeader.styled';
import { P, SIZES, WEIGHTS, COLORS } from 'styles/StyledComponents/Typography';

// Routing
import { useHistory, useParams } from 'react-router-dom';

// Hooks
import useOfficerId from 'Hooks/useOfficerId';

// Util
import { calculatePercentage, RACES } from 'Components/Charts/chartUtils';
import toTitleCase from 'util/toTitleCase';

import BackButton from 'Components/Elements/BackButton';
import { ICONS } from 'img/icons/Icon';
import { AGENCY_LIST_SLUG } from 'Routes/slugs';

function AgencyHeader({ agencyHeaderOpen, agencyDetails }) {
  const history = useHistory();
  const { agencyId } = useParams();
  const theme = useTheme();
  const officerId = useOfficerId();

  const handleGoToAgency = () => {
    history.push(`${AGENCY_LIST_SLUG}/${agencyId}`);
  };

  return (
    <AnimatePresence>
      {agencyHeaderOpen && (
        <motion.div
          key="AgencyHeader"
          initial={{ opacity: 0.35, y: '-100%', duration: 750 }}
          animate={{ opacity: 1, y: 0, duration: 750 }}
          exit={{ opacity: 0.35, y: '-100%', duration: 750 }}
          transition={{ ease: 'easeIn' }}
        >
          <S.AgencyHeader>
            <S.SubHeaderNavRow>
              <BackButton />
            </S.SubHeaderNavRow>
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
                  last reported stop {agencyId ? 'from department ' : ''}
                  {agencyDetails.last_reported_stop && 'on'}
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
              <S.CensusDemographics>
                <S.CensusTitle>CENSUS DEMOGRAPHICS</S.CensusTitle>
                <S.CensusRow>
                  {Object.keys(agencyDetails.census_profile).length > 0 ? (
                    RACES.map((race) => {
                      const profile = agencyDetails.census_profile;
                      return (
                        <S.CensusDatum key={race}>
                          <S.CensusRace color={COLORS[0]} size={SIZES[0]}>
                            {toTitleCase(race)}*
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
          </S.AgencyHeader>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgencyHeader;
