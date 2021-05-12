// Copyright 2017-2021 @polkadot/app-js authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import styled from "styled-components";

interface Props {
  children?: React.ReactNode;
  className?: string;
  logs: React.ReactNode[];
}


function Output({ children, className = "", logs }: Props): React.ReactElement<Props> {
  return (
    <article className={`container ${className}`}>
      <div className="logs-wrapper">
        <div className="logs-container">
          <pre className="logs-content">{logs}</pre>
        </div>
      </div>
      {children}
    </article>
  );
}

export default React.memo(styled(Output)`
  background-color: #4e4e4e;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  font: var(--font-mono);
  font-variant-ligatures: common-ligatures;
  line-height: 18px;
  position: relative;
  width: 40%;
  margin: 0;
  margin-left: 1rem;

  .logs-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .logs-container {
    flex: 1;
    overflow: auto;
  }

  .logs-content {
    height: auto;
  }

  .js--Log {
    animation: fadein 0.2s;
    margin: 0 0 5px 0;
    word-break: break-all;

    &.error {
      color: #f88;
    }
  }
`);
