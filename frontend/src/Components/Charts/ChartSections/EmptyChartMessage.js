import React from 'react';
import * as S from './ChartsCommon.styled';


function EmptyChartMessage({ data }) {
    let isEmpty = data && data.length === 0;
    return isEmpty ? (
        <S.LegendBelow>
            <S.ChartWarning>NO DATA AVAILABLE</S.ChartWarning>
        </S.LegendBelow>
    ) : <></>
}

export default EmptyChartMessage;
