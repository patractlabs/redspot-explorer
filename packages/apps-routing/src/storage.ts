// Copyright 2017-2021 @polkadot/apps-routing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { TFunction } from 'i18next';
import type { Route } from './types';

import Component from '@polkadot/app-storage';

export default function create (t: TFunction): Route {
  return {
    Component,
    display: {
      needsApi: []
    },
    group: 'chain',
    icon: 'envelope-open-text',
    name: 'chain',
    text: t('nav.storage', 'Chain', { ns: 'apps-routing' })
  };
}
