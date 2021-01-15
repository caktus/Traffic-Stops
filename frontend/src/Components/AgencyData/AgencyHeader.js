import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as S from './AgencyHeader.styled';
import { P, SIZES, WEIGHTS, COLORS } from 'styles/StyledComponents/Typography';

// Util
import { getCensusPercentage, RACES } from 'Components/Charts/chartUtils';
import toTitleCase from 'util/toTitleCase';

import BackButton from 'Components/Elements/BackButton';

function AgencyHeader({ agencyHeaderOpen, agencyDetails }) {
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
                <S.AgencyTitle>{agencyDetails.name}</S.AgencyTitle>
                <P size={SIZES[0]} color={COLORS[0]} weight={WEIGHTS[0]}>
                  last reported stop {agencyDetails.last_stop_date && 'on'}{' '}
                  <S.ReportedDate size={SIZES[0]} color={COLORS[0]} weight={WEIGHTS[1]}>
                    {agencyDetails.last_stop_date || 'Unknown'}
                  </S.ReportedDate>
                </P>
              </S.EntityDetails>
              <S.CensusDemographics>
                <S.CensusTitle>CENSUS DEMOGRAPHICS</S.CensusTitle>
                <S.CensusRow>
                  {agencyDetails.census_profile ? (
                    RACES.map((race) => {
                      const profile = agencyDetails.census_profile;
                      return (
                        <S.CensusDatum key={race}>
                          <S.CensusRace color={COLORS[0]} size={SIZES[0]}>
                            {toTitleCase(race)}*
                          </S.CensusRace>
                          <P size={SIZES[0]}>
                            {getCensusPercentage(profile[race], profile.total)}%
                          </P>
                        </S.CensusDatum>
                      );
                    })
                  ) : (
                    <S.NoCensus>Census data for {agencyDetails.name} could not be found</S.NoCensus>
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
