// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AnyJson } from '@polkadot/types/types';

import { Abi } from '@polkadot/api-contract';
import { api } from '@polkadot/react-api';
import store from "@polkadot/app-contracts/store";

import getAddressMeta from './getAddressMeta';

export default function getContractAbi (address: string | null): Abi | null {
  if (!address) {
    return null;
  }

  let abi: Abi | undefined;
  const meta = getAddressMeta(address, 'contract');

  if(!meta.contract || !(meta.contract as any).codeHash) {
    return null
  }

  try {
    const codeHash = (meta.contract as any).codeHash
    const code = store.getCode(codeHash);

    const data = code?.json.abi as AnyJson;

    abi = new Abi(data, api.registry.getChainProperties());
  } catch (error) {
    console.error(error);
  }

  return abi || null;
}
