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
import Console from './Console';

function ContractsApp ({ basePath, className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const itemsRef = useRef([
    {
      isRoot: true,
      name: 'codes',
      text: t('Codes')
    },
    {
      name: 'contract',
      text: t('Contracts')
    },
    {
      name: 'console',
      text: t('Console')
    },
  ]);

  return (
    <main className={`contracts--App ${className}`}>
      <HelpOverlay md={introMd as string} />
      <Tabs
        basePath={basePath}
        items={itemsRef.current}
      />
      <Display isHide={true} path="/contracts/contract">
        <Contracts />
      </Display>
      <Display isHide={true} path="/contracts">
        <Codes />
      </Display>
      <Display isHide={true} path="/contracts/console">
        <Console />
      </Display>
    </main>
  );
}

export default React.memo(ContractsApp);
