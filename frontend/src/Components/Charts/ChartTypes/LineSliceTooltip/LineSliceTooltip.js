import React from 'react';
import { useTheme } from 'styled-components';
import { LineSliceTooltipStyled, LineSlicePoint } from './LineSliceTooltip.styled';

// Util
import toTitleCase from 'util/toTitleCase';


function LineSliceTooltip({ slice }) {
  const theme = useTheme();

  const _formatDisplayName = serieId => {
    const justId = serieId.split("__")[0]
    return toTitleCase(justId);
  }

  return (
    <LineSliceTooltipStyled theme={theme}>
      <p>{slice.points[0].data.xFormatted}</p>
      {slice.points.map(point => (
        <LineSlicePoint key={point.serieId} color={point.serieColor}>
          <span >{_formatDisplayName(point.serieId)}</span> {point.data.yFormatted}
        </LineSlicePoint>
      ))}
    </LineSliceTooltipStyled>
  );
}

export default LineSliceTooltip;
