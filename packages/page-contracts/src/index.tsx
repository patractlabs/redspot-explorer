// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AppProps as Props } from '@polkadot/react-components/types';

import React, { useEffect, useRef } from 'react';

import { useTranslation } from '@polkadot/app-contracts/translate';
import { HelpOverlay, Tabs } from '@polkadot/react-components';
import { Display } from '@polkadot/react-components';

import introMd from './md/intro.md';
import Contracts from './Contracts';
import Codes from './Codes';

function ContractsApp ({ basePath, className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const itemsRef = useRef([
    {
      isRoot: true,
      name: 'codes',
      text: t('Codes')
    },
    {
      name: 'playground',
      text: t('Contracts')
    },
  ]);

  return (
    <main className={`contracts--App ${className}`}>
      <HelpOverlay md={introMd as string} />
      <Tabs
        basePath={basePath}
        items={itemsRef.current}
      />
      <Display path="/contracts/playground">
        <Contracts />
      </Display>
      <Display path="/contracts">
        <Codes />
      </Display>
    </main>
  );
}

export default React.memo(ContractsApp);
