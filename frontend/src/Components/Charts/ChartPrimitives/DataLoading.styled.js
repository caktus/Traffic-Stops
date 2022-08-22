import styled from 'styled-components';

export default styled.div`
  padding: 2rem 0;
  h3 {
    text-align: center;
    font-size: 28px;
    font-weight: 200;
    color: ${(props) => props.theme.colors.grey};
  }
`;
