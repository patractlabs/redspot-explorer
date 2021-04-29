// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Abi } from "@polkadot/api-contract";
import store from "@polkadot/app-contracts/store";

export default function getContractAbiByHash(hash: string | null): Abi | null {
  if (!hash) {
    return null;
  }

  const code = store.getCode(hash);

  if (!code) return null;

  return code?.contractAbi || null;
}
