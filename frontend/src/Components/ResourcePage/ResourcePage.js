import React, { useEffect, useState } from 'react';
import * as S from './ResourcePage.styled';

import { H1, H2, H3, P } from '../../styles/StyledComponents/Typography';
import axios from '../../Services/Axios';
import { RESOURCES_URL } from '../../Services/endpoints';
import LinkButton from '../Elements/LinkButton';

function Resource({ resource }) {
  return (
    <S.ResourceBlock>
      <div style={{ marginRight: '20px' }}>
        <S.ResourceImage src={resource.image_url} alt={resource.title} />
      </div>
      <div>
        <H3>{resource.title} </H3>
        <P>{resource.description}</P>

        {!!resource.view_more_link && (
          <div style={{ marginTop: '30px' }}>
            <LinkButton href={resource.view_more_link} title="View More" />
          </div>
        )}
      </div>
    </S.ResourceBlock>
  );
}

function AgencyGroup({ agency }) {
  return (
    <div style={{ paddingVertical: '50px' }}>
      <H2>{agency.agency}</H2>
      {agency.results.map((resource, index) => (
        <>
          <Resource resource={resource} />
          {index !== agency.results.length - 1 && <S.ResourceDividingLine />}
        </>
      ))}
    </div>
  );
}

function ResourcePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function _fetchResources() {
      setLoading(true);
      try {
        const { data } = await axios.get(RESOURCES_URL);
        setResources(() => data.grouped_agencies);
        setLoading(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        setLoading(false);
      }
    }
    _fetchResources();
  }, []);

  const renderedResources = resources.map((agency) => <AgencyGroup agency={agency} />);
  return (
    <S.ResourcePageStyled data-testid="ResourcePage">
      <S.ResourcePageContent>
        <H1>Resources</H1>
        {loading ?? <H1>Loading</H1>}
        <ul>{renderedResources}</ul>
      </S.ResourcePageContent>
    </S.ResourcePageStyled>
  );
}

export default ResourcePage;
