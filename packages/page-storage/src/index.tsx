// Copyright 2017-2021 @polkadot/app-storage authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AppProps as Props } from '@polkadot/react-components/types';

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';


import Selection from './Selection';

function StorageApp ({ basePath, className = '' }: Props): React.ReactElement<Props> {
  return (
    <main className={`storage--App ${className}`}>
      <Selection
        basePath={basePath}
      />
    </main>
  );
}

export default React.memo(styled(StorageApp)`
  .storage--actionrow {
    align-items: flex-start;
    display: flex;

    .ui--Button {
      margin: 0.25rem;
    }

    &.head {
      flex: 1 1 100%;
      margin: 0 auto;
      max-width: 620px;
    }
  }

  .storage--actionrow-value {
    flex: 1;
    min-width: 0;

    .ui--output {
      word-break: break-all;
    }
  }

  .storage--actionrow-buttons {
    flex: 0;
    padding: 0.5rem 0.25rem;
  }
`);
