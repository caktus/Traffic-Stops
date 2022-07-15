import React from 'react';
import { TooltipStyled, TooltipableText, TooltipText, TooltipLink } from './Tooltip.styled';
import { useTheme } from 'styled-components';
import PropTypes from 'prop-types';

// Tooltip data
// eslint-disable-next-line import/no-unresolved
import tooltips from 'tooltips.json';

function Tooltip({ children, tooltipId }) {
  const theme = useTheme();

  // If the provided tooltipId is not registered in tooltips.json,
  // just bail-- render original text in its original form.
  // PropTypes will throw a useful console error
  if (
    !Object.keys(tooltips)
      .map((key) => tooltips[key].id)
      .includes(tooltipId)
  ) {
    return children;
  }

  return (
    <>
      <TooltipableText data-tip data-for={tooltipId} data-event="click focus">
        {children}
      </TooltipableText>
      <TooltipStyled
        clickable
        className="tooltip"
        id={tooltipId}
        tipType={tooltips[tooltipId]?.type}
        globalEventOff="click"
        aria-haspopup="true"
        theme={theme}
      >
        <TooltipText dangerouslySetInnerHTML={{ __html: tooltips[tooltipId]?.text }} />
        {tooltips[tooltipId].link && (
          <TooltipLink
            target="_blank"
            rel="noopener noreferrer"
            href={tooltips[tooltipId]?.link.url}
          >
            {tooltips[tooltipId]?.link.link_text}
          </TooltipLink>
        )}
      </TooltipStyled>
    </>
  );
}

Tooltip.propTypes = {
  tooltipId: PropTypes.oneOf(Object.keys(tooltips).map((key) => tooltips[key].id)),
};

Tooltip.defaultProps = {};

export default Tooltip;
