// Copyright 2017-2021 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { TFunction } from 'i18next';
import type { Routes } from './types';

import accounts from './accounts';
import assets from './assets';
import contracts from './contracts';
import explorer from './explorer';
import js from './js';
import settings from './settings';
import signing from './signing';
import storage from './storage';
import sudo from './sudo';

export default function create (t: TFunction): Routes {
  return [
    explorer(t),
    contracts(t),
    accounts(t),
    assets(t),
    storage(t),
    signing(t),
    sudo(t),
    js(t),
    settings(t)
  ];
}
