import React from 'react';
import { useTheme } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import * as S from './AgencyHeader.styled';
import { P, SIZES, WEIGHTS, COLORS } from '../../styles/StyledComponents/Typography';

// Routing
import { useHistory, useParams } from 'react-router-dom';

// Hooks
import useOfficerId from '../../Hooks/useOfficerId';

// Util

import { ICONS } from '../../img/icons/Icon';
import { AGENCY_LIST_SLUG } from '../../Routes/slugs';
import BackButton from '../Elements/BackButton';
import Button from '../Elements/Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import CensusData from './CensusData';

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
      return `last reported stop`;
    }
    return '';
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
            <CensusData
              agencyDetails={agencyDetails}
              showCompareDepartments={showCompareDepartments}
            />
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
