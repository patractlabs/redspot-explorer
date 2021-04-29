// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ActionStatus } from '@polkadot/react-components/Status/types';

import React, { useCallback, useState, useMemo } from 'react';

import { AddressRow, Button, Input, Modal } from '@polkadot/react-components';
import { useApi, useNonEmptyString } from '@polkadot/react-hooks';
import { keyring } from '@polkadot/ui-keyring';
import styled from 'styled-components';
import { ABI, InputName } from '../shared';
import { useTranslation } from '../translate';
import useAbi from '../useAbi';
import ValidateAddr from './ValidateAddr';
import ValidateCode from '../Codes/ValidateCode';
import store from "../store";

interface Props {
  onClose: () => void;
}

function Add ({ onClose }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { api } = useApi();
  const [address, setAddress] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const { abi, contractAbi, errorText, isAbiError, isAbiSupplied, isAbiValid, onChangeAbi, onRemoveAbi } = useAbi([null, null], null, true);

  const [name, codeHash] = useMemo(() => {
    const name = contractAbi?.project?.contract?.name?.toString();
    const hash = contractAbi?.project?.source?.wasmHash?.toString();
    
    if (name && hash) {
      return [`${name}-${hash.slice(2,6)}`, hash];
    } else {
      return [];
    }
  }, [contractAbi]);

  const [isCodeHashValid, setIsCodeHashValid] = useState(false);

  const source = useMemo(() => {
    return contractAbi?.project?.source
  }, [contractAbi])

  const _onAdd = useCallback(
    (): void => {
      const status: Partial<ActionStatus> = { action: 'create' };

      if (!address || !abi || !name || !codeHash) {
        return;
      }

      try {
        const json = {
          contract: {
            codeHash,
            abi,
            genesisHash: api.genesisHash.toHex()
          },
          name: `${name}(${address.toString().slice(0, 4)})`,
          tags: []
        };

        keyring.saveContract(address, json);
        store
          .saveCode(codeHash, { abi, name, tags: [] })

        status.account = address;
        status.status = address ? 'success' : 'error';
        status.message = 'contract added';

        onClose();
      } catch (error) {
        console.error(error);

        status.status = 'error';
        status.message = (error as Error).message;
      }
    },
    [abi, address, api, name, onClose, codeHash]
  );

  const isValid = isAddressValid && isAbiValid && isCodeHashValid;

  return (
    <Modal header={t('Add an existing contract')}>
      <Modal.Content>
        <AddressRow
          defaultName={name}
          isValid
          value={address || null}
        >
          <Input
            autoFocus
            help={t<string>('The address for the deployed contract instance.')}
            isError={!isAddressValid}
            label={t<string>('contract address')}
            onChange={setAddress}
            value={address || ''}
          />
          <ValidateAddr
            address={address}
            onChange={setIsAddressValid}
          />
          <div style={{marginTop: '1rem', marginBottom: '1rem'}}>
            <ValidateCode source={source} codeHash={codeHash} onChange={setIsCodeHashValid} />
          </div>
          <ABI
            contractAbi={contractAbi}
            errorText={errorText}
            isError={isAbiError || !isAbiValid}
            isSupplied={isAbiSupplied}
            isValid={isAbiValid}
            onChange={onChangeAbi}
            onRemove={onRemoveAbi}
          />
        </AddressRow>
      </Modal.Content>
      <Modal.Actions onCancel={onClose}>
        <Button
          icon='save'
          isDisabled={!isValid}
          label={t<string>('Save')}
          onClick={_onAdd}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default React.memo(Add);
