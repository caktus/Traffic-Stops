import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as S from './AgencyHeader.styled';

// Util
import { getCensusPercentage } from 'Components/Charts/chartUtils';
import toTitleCase from 'util/toTitleCase';

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
              <p>back button</p>
            </S.SubHeaderNavRow>
            <S.SubHeaderContentRow>
              <S.EntityDetails>
                <S.AgencyTitle>{agencyDetails.name}</S.AgencyTitle>
                <S.LastReported>
                  last reported stop {agencyDetails.last_stop_date && 'on'}{' '}
                  <S.ReportedDate>{agencyDetails.last_stop_date || 'Unknown'}</S.ReportedDate>
                </S.LastReported>
              </S.EntityDetails>
              <S.CensusDemographics>
                <S.CensusTitle>CENSUS DEMOGRAPHICS</S.CensusTitle>
                <S.CensusRow>
                  {agencyDetails.census_profile ? (
                    Object.keys(agencyDetails.census_profile).map((race) => (
                      <S.CensusDatum key={race}>
                        <S.CensusRace>{toTitleCase(race)}</S.CensusRace>
                        <S.CensusPercentage>
                          {getCensusPercentage(
                            agencyDetails.census_profile[race],
                            agencyDetails.census_profile.total
                          )}
                          %
                        </S.CensusPercentage>
                      </S.CensusDatum>
                    ))
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
