import React, { useEffect, useState } from 'react';
import * as S from './ResourcePage.styled';

import { H1, H2, P } from '../../styles/StyledComponents/Typography';
import axios from '../../Services/Axios';
import { RESOURCES_URL } from '../../Services/endpoints';
import LinkButton from '../Elements/LinkButton';

function Resource({ resource }) {
  // Published dates are in UTC, convert it to EST.
  const resourcePublicationDate = new Date(
    `${resource.publication_date}T05:00`
  ).toLocaleDateString();
  return (
    <S.ResourceBlock>
      <div style={{ marginRight: '20px' }}>
        <S.ResourceImage src={resource.image_url} alt={resource.title} />
      </div>
      <div>
        <H2 dangerouslySetInnerHTML={{ __html: resource.title }} />
        {resource.publication_date && <P size={14}>{resourcePublicationDate}</P>}
        <P size={18} dangerouslySetInnerHTML={{ __html: resource.description }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {resource.agencies_list.map((a) => (
            <S.ResourceTag href={`/agencies/${a.id}`}>{a.name}</S.ResourceTag>
          ))}
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}
        >
          {!!resource.view_more_link && (
            <div style={{ marginTop: '30px', marginBottom: '15px' }}>
              <LinkButton href={resource.view_more_link} title="View More" />
            </div>
          )}
          {resource.resource_files.map((rf) => (
            <a href={rf.url} target="_blank" rel="noreferrer" style={{ marginRight: '10px' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className=""
                style={{ width: '25px', height: '25px', paddingTop: '10px' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
              {rf.name}
            </a>
          ))}
        </div>
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
