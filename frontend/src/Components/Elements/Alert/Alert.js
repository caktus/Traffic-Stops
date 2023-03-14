import React from 'react';
import * as S from './Alert.styled';

function Alert({ message }) {
  return <div>{message}</div>;
}
function AlertBox({ message, color }) {
  return (
    <S.Alert color={color}>
      <Alert message={message} />
    </S.Alert>
  );
}

export function CompareAlertBox() {
  return (
    <S.CompareAlert color="red">
      <Alert message="Please rotate your device to landscape mode for optimum viewing of data" />
    </S.CompareAlert>
  );
}

export default AlertBox;
