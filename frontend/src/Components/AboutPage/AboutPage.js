import React from 'react';
import { AboutPageStyled } from './AboutPage.styled';

// Tooltips
import Tooltip from 'Components/Elements/Tooltip/Tooltip';
import tooltips from 'tooltips.json';

function AboutPage(props) {
  return (
    <AboutPageStyled data-testid="AboutPage">
      <h1>About</h1>
      <p>
        According to the US Department of Justice, vehicle stops are the number one reason for
        contact between citizens and police. NC CopWatch aims to provide a platform for North
        Carolina community members to have access to law enforcement stop, search, and use of force
        data. The site displays this data in graphs and charts and incorporates features that allow
        the user to compare the traffic stop data to population data, as well as review traffic stop
        data for individual departments over time. NC CopWatch was created to serve as a resource to
        community members, organizers, and{' '}
        <Tooltip tooltipId={tooltips.advocate.id}>advocates </Tooltip> across the state of North
        Carolina seeking transparency and accountability in our statewide policing practices. The
        site should operate as an advocacy tool for those seeking policy changes in law enforcement
        practices.
      </p>
    </AboutPageStyled>
  );
}

export default AboutPage;
