// Copyright 2017-2021 @polkadot/app-storage authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ParitalQueryTypes } from '../types';

import React, { useCallback, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'react-router';

import { Tabs } from '@polkadot/react-components';

import { useTranslation } from '../translate';
import Consts from './Consts';
import Modules from './Modules';
import Extrinsics from '@polkadot/app-extrinsics/Selection';
import Rpc from '@polkadot/app-rpc/Rpc';
import Raw from './Raw';
interface Props {
  basePath: string;
}


function Selection ({ basePath }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { pathname } = useLocation();


  const itemsRef = useRef([
    {
      isRoot: true,
      name: 'extrinsics',
      text: t<string>('Extrinsics')
    },
    {
      name: 'storage',
      text: t<string>('Storage')
    },
    {
      name: 'rpc',
      text: t<string>('RPC calls')
    },
    {
      name: 'constants',
      text: t<string>('Constants')
    },
    {
      name: 'raw',
      text: t<string>('Raw storage')
    },
  ]);

  
  return (
    <>
      <Tabs
        basePath={basePath}
        items={itemsRef.current}
      />
      <div>
        <div style={{ display: pathname === '/chain/storage' ? 'block' : 'none'}}><Modules /></div>
        <div style={{ display: pathname === '/chain/constants' ? 'block' : 'none'}}><Consts /></div>
        <div style={{ display: pathname === '/chain/raw' ? 'block' : 'none'}}><Raw /></div>
        <div style={{ display: pathname === '/chain/rpc' ? 'block' : 'none'}}><Rpc /></div>
        <div style={{ display: pathname === '/chain' ? 'block' : 'none'}}><Extrinsics /></div>
      </div>
    </>
  );
}

export default React.memo(Selection);
