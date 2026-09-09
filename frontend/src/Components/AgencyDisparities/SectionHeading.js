import React from 'react';

import * as S from './AgencyDisparities.styled';

// Section heading with a hover-revealed "#" anchor link (the common docs-site
// pattern for deep-linking to a section). `subtitle` renders a smaller h3
// used under a section's main h2.
export default function SectionHeading({ id, subtitle, children }) {
  const Title = subtitle ? S.SectionSubTitle : S.SectionTitle;
  return (
    <Title as={subtitle ? 'h3' : 'h2'} id={id}>
      {children}
      <S.SectionAnchor href={`#${id}`} aria-label="Link to this section">
        #
      </S.SectionAnchor>
    </Title>
  );
}
