import styled from 'styled-components';

import LogoFull from 'Components/Elements/LogoFull';
import { FullWidthPage } from 'styles/StyledComponents/FullWidthPage.styled';
import { H1point5, H2 } from 'styles/StyledComponents/Typography';
import { smallerThanTabletLandscape } from 'styles/breakpoints';
import FJIcon from 'img/icons/Icon';

export const HomePage = styled(FullWidthPage)`
  display: flex;
  flex-direction: column;
`;

export const Heading = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: 2.5em;
  padding-bottom: 0.5em;
  border-bottom: 2px solid ${(p) => p.theme.colors.secondary};
`;

export const Logo = styled(LogoFull)``;

export const SubTitle = styled.p`
  margin-bottom: 8px;
  margin-left: 1em;
`;

export const SubTitleLink = styled.a`
  color: ${(p) => p.theme.colors.primaryDark};
  text-decoration: none;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    align-items: center;
  }
`;

export const About = styled.aside`
  width: 381px;
  margin-right: 3em;

  @media (${smallerThanTabletLandscape}) {
    margin: 0;
    width: 100%;
  }
`;

export const AboutImage = styled.img`
  height: 335px;
  width: 335px;
  margin-left: 1.5em;
  margin-bottom: -2.5em;
`;

export const AboutContent = styled.div`
  min-height: 400px;
  background: ${(p) => p.theme.colors.greyLight};
  box-shadow: 0px 0px 1px rgba(48, 49, 51, 0.05), 0px 2px 4px rgba(48, 49, 51, 0.1);
  padding: 2.5em 2em 2em 2em;
`;

export const AboutHeading = styled(H2)`
  font-size: 24px;
`;

export const AboutSubTitle = styled.p`
  font-size: 14px;
  color: ${(p) => p.theme.colors.textLight};
`;

export const Datum = styled.span`
  font-weight: bold;
  margin-right: 0.5em;
`;

export const AboutExtra = styled.div`
  line-height: 28px;
`;

export const FormLink = styled.a`
  color: ${(p) => p.theme.colors.primaryDark};
  vertical-align: middle;
  text-decoration: none;
`;

export const FormIcon = styled(FJIcon)`
  vertical-align: inherit;
  margin: 0 3px;
`;

export const AboutSubSection = styled.div`
  margin: 1.2em 0;
`;

export const FetchError = styled.p`
  color: ${(p) => p.theme.colors.caution};
`;

export const SubContent = styled.div`
  margin-top: 4em;
  flex: 1;

  @media (${smallerThanTabletLandscape}) {
    flex: none;
  }
`;

export const SubHeading = styled(H1point5)`
  margin: 0.5em 0;
`;

export const SearchWrapper = styled.div`
  max-width: 500px;
  margin: 1.5em 0;
`;

export const ViewAllDepts = styled.p`
  color: ${(props) => props.theme.colors.primaryDark};
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 18px;
  cursor: pointer;
`;

export const ViewAllIcon = styled(FJIcon)`
  margin-left: 1em;
`;

export const DeptCTA = styled.div`
  @media (${smallerThanTabletLandscape}) {
    width: 90%;
    margin: 2em auto;
  }
`;

export const StopCTA = styled.div`
  margin-top: 2em;
  @media (${smallerThanTabletLandscape}) {
    width: 90%;
    margin: 2em auto;
  }
`;

export const ButtonWrapper = styled.div`
  width: 360px;
  margin: 2em 0;
  @media (${smallerThanTabletLandscape}) {
    width: 90%;
    margin: 2em auto;
  }
`;

export const ButtonInner = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-left: auto;
  width: 85%;
  font-size: 22px;
`;

export const ButtonIcon = styled(FJIcon)``;
