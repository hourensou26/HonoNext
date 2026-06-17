'use client';

import styled from 'styled-components';

const Wrapper = styled.aside`
  margin-top: 16px;
  border: 2px solid #052e16;
  border-radius: 0;
  background: #ecfdf5;
  box-shadow: 4px 4px 0 #052e16;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.8;
  letter-spacing: 0.08em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: #064e3b;

  code {
    border: 1px solid #064e3b;
    background: #d1fae5;
    padding: 1px 4px;
  }
`;

export const StyledNote = () => {
  return (
    <Wrapper>
      このボックスは <code>styled-components</code> でスタイリングしています。MDX本文に React
      コンポーネントを差し込んで表示できます。
    </Wrapper>
  );
};
