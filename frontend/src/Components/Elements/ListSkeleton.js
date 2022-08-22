import React from 'react';
import ListSkeletonStyled from './ListSkeleton.styled';
// Deps
import ContentLoader from 'react-content-loader';

const REPS = 4;

function ListSkeleton({ reps = REPS }) {
  return (
    <ListSkeletonStyled>
      <ContentLoader
        viewBox={`0 0 400 ${100 * reps}`}
        width={1000}
        height={200 * reps}
        speed={2}
        data-testid="ListSkeleton"
      >
        {[...Array(reps)].map((_, r) => {
          const ySpacer = r * 80;
          return (
            <React.Fragment key={r}>
              <rect x="15" y={0 + ySpacer} rx="3" ry="3" width="20" height="10" />
              <rect x="0" y={13 + ySpacer} rx="3" ry="3" width="400" height="1" />

              <rect x="10" y={20 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="145" y={20 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="275" y={20 + ySpacer} rx="3" ry="3" width="115" height="10" />

              <rect x="10" y={35 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="145" y={35 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="275" y={35 + ySpacer} rx="3" ry="3" width="115" height="10" />

              <rect x="10" y={50 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="145" y={50 + ySpacer} rx="3" ry="3" width="115" height="10" />
              <rect x="275" y={50 + ySpacer} rx="3" ry="3" width="115" height="10" />
            </React.Fragment>
          );
        })}
      </ContentLoader>
    </ListSkeletonStyled>
  );
}

export default ListSkeleton;
