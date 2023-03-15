import React, { useEffect, useState } from 'react';
import * as S from './ResourcePage.styled';

import { H1, H2, P } from '../../styles/StyledComponents/Typography';
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
        <H2>{resource.title} </H2>
        <P size={14}>{new Date(resource.created_date).toLocaleDateString()}</P>
        <P size={18}>{resource.description}</P>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {resource.agencies_list.map((a) => (
            <S.ResourceTag href={`/agencies/${a.id}`}>{a.name}</S.ResourceTag>
          ))}
        </div>

        {!!resource.view_more_link && (
          <div style={{ marginTop: '30px' }}>
            <LinkButton href={resource.view_more_link} title="View More" />
          </div>
        )}
      </div>
    </S.ResourceBlock>
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
        setResources(() => data.results);
        setLoading(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        setLoading(false);
      }
    }
    _fetchResources();
  }, []);

  const renderedResources = resources.map((resource) => <Resource resource={resource} />);
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
