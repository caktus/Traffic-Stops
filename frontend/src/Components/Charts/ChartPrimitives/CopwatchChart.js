import React from 'react';
import * as S from './CopwatchChart.styled'
import { VictoryChart, VictoryVoronoiContainer, VictoryTooltip } from 'victory'

function CopwatchChart({ children, yAxisLabel, transformCenter, voronoiDimension = "x", ...props }) {
  return (
    <VictoryChart
      {...props}
      containerComponent={
        <VictoryVoronoiContainer
          voronoiDimension={voronoiDimension}
          style={{ touchAction: 'auto' }}
          labels={() => ' '}
          labelComponent={<CopwatchTooltip yAxisLabel={yAxisLabel} transformCenter={transformCenter} />}
        />}
    >
      {children}
    </VictoryChart>
  )
}

export default CopwatchChart;

export function CopwatchTooltip({ yAxisLabel, transformCenter, pie, tooltipFontSize = null, ...props }) {
  return (
    <VictoryTooltip
      {...props}
      renderInPortal={true}
      flyoutComponent={<CopwatchChartFlyout tooltipFontSize={tooltipFontSize} yAxisLabel={yAxisLabel} pie={pie} transformCenter={transformCenter} />}
    />
  )
}

CopwatchTooltip.defaultEvents = VictoryTooltip.defaultEvents;

const VORONOI_LABEL_X_OFFSET = 10;
const defaultYAxisLabel = (value) => value;
const defaultTransformCenter = ({ x, y, datum }) => ({ x: x + VORONOI_LABEL_X_OFFSET, y: y - datum.height })

export function CopwatchChartFlyout({ yAxisLabel = defaultYAxisLabel, transformCenter = defaultTransformCenter, pie, tooltipFontSize, ...data }) {
  const centered = transformCenter({ x: data.center.x, y: data.center.y, datum: data })

  const isVoronoi = !!data.activePoints

  const getColor = (d) => {
    if (pie) {
      return d.datum.color
    }
    if (isVoronoi) {
      return d.color || d.style.data.stroke
    }
    return d.datum.color
  }

  const getLabel = d => {
    if (pie) {
      return d.datum.x
    }
    if (isVoronoi) {
      return d.displayName
    }
    return d.datum.ethnicGroup
  }

  const getValue = d => {
    if (pie) {
      return yAxisLabel(d.datum.y)
    }
    if (isVoronoi) {
      return yAxisLabel(d.y)
    }
    return yAxisLabel(d.datum.y)
  }


  return (
    <foreignObject width="100%" height="100%" {...centered}>
      <S.FlyoutContainer
        xmlns="http://www.w3.org/1999/xhtml"
        data-testid="graphTooltip"
        fontSize={tooltipFontSize}
      >
        {!pie && <S.FlyoutLabel>{data.datum.x}</S.FlyoutLabel>}
        <S.DataList >
          {
            data.activePoints?.map(p => <S.DataListItem color={getColor(p)} fontSize={tooltipFontSize} key={getLabel(p)}><S.DatumLabel>{getLabel(p)}:</S.DatumLabel> <S.DatumValue>{getValue(p)}</S.DatumValue></S.DataListItem>)
            || <S.DataListItem fontSize={tooltipFontSize} color={getColor(data)} key={getLabel(data)}><S.DatumLabel>{getLabel(data)}:</S.DatumLabel> <S.DatumValue>{getValue(data)}</S.DatumValue></S.DataListItem>
          }
        </S.DataList>
      </S.FlyoutContainer>
    </foreignObject>
  )
}
