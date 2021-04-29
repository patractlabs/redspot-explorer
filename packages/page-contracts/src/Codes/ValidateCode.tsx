// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

import type { Option } from '@polkadot/types';
import type { PrefabWasmModule } from '@polkadot/types/interfaces';

import React, { useMemo } from 'react';

import { InfoForInput } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import { isHex } from '@polkadot/util';
import { ContractProjectSource } from '@polkadot/types/interfaces/types';

import { useTranslation } from '../translate';

interface Props {
  codeHash?: string | null;
  source?: ContractProjectSource | null;
  onChange: React.Dispatch<boolean>;
}

function ValidateCode ({ codeHash, source, onChange }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();

  const [isValidHex, isWasmValid, isValid] = useMemo(
    (): [boolean, boolean, boolean] => {
      const isValidHex = !!codeHash && isHex(codeHash) && codeHash.length === 66;
      const isWasmValid = !!source?.wasm && !source.wasm.isEmpty;
      const isValid = isValidHex && isWasmValid;

      onChange(isValid)
      
      return [
        isValidHex,
        isWasmValid,
        isValid
      ];
    },
    [codeHash, source]
  );

  if (isValid || !source) {
    return null;
  }


  return (
    <InfoForInput type='error'>
      {
        !isValidHex
          ? t('The codeHash is not a valid hex hash')
          : !isWasmValid ? t('The abi file needs to contain the wasm code.') : 'Unknow error'
      }
    </InfoForInput>
  );
}

export default React.memo(ValidateCode);
