// Copyright 2017-2021 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ContractCallOutcome } from '@polkadot/api-contract/types';
import type { SignedBlockExtended } from '@polkadot/api-derive/types';
import type { ContractLink } from './types';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { Table } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import { formatNumber } from '@polkadot/util';
import store from '../store'
import { useTranslation } from '../translate';
import Call from './Call';
import Contract from './Contract';
import { getContractForAddress } from './util';

export interface Props {
  contracts: ContractPromise[];
  updated: any
  type: 'local' | 'store'
}

interface Indexes {
  contractIndex: number;
  messageIndex: number;
  onCallResult?: (messageIndex: number, result?: ContractCallOutcome) => void;
}



function ContractsTable ({ updated, contracts, type }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();
  const newBlock = useCall<SignedBlockExtended>(api.derive.chain.subscribeNewBlocks);
  const [{ contractIndex, messageIndex, onCallResult }, setIndexes] = useState<Indexes>({ contractIndex: 0, messageIndex: 0 });
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [contractLinks, setContractLinks] = useState<Record<string, ContractLink[]>>({});

  const headerRef = useRef<[string?, string?, number?][]>([
    [t(type === 'local' ? 'recent contracts' : 'saved contracts'), 'start'],
    [t('extrinsics'), 'start'],
    [undefined, undefined, 3],
    [t('status'), 'start'],
    [t('projection'), 'media--1100'],
    [t('upload time'), 'start'],
    []
  ]);

  useEffect((): void => {
    if (newBlock) {
      const exts = newBlock.block.extrinsics
        .filter(({ method }) => api.tx.contracts.call.is(method))
        .map(({ args }): ContractLink | null => {
          const contractId = contracts.find((contract) => args[0].eq(contract.address));

          if (!contractId) {
            return null;
          }

          return {
            blockHash: newBlock.block.header.hash.toHex(),
            blockNumber: formatNumber(newBlock.block.header.number),
            contractId: contract.address.toString()
          };
        })
        .filter((value): value is ContractLink => !!value);

      exts.length && setContractLinks((links): Record<string, ContractLink[]> => {
        exts.forEach((value): void => {
          links[value.contractId] = [value].concat(links[value.contractId] || []).slice(0, 3);
        });

        return { ...links };
      });
    }
  }, [api, contracts, newBlock]);

  const _toggleCall = useCallback(
    () => setIsCallOpen((isCallOpen) => !isCallOpen),
    []
  );

  const _onCall = useCallback(
    (contractIndex: number, messageIndex: number, onCallResult: (messageIndex: number, result?: ContractCallOutcome) => void): void => {
      setIndexes({ contractIndex, messageIndex, onCallResult });
      setIsCallOpen(true);
    },
    []
  );

  const _setMessageIndex = useCallback(
    (messageIndex: number) => setIndexes((state) => ({ ...state, messageIndex })),
    []
  );

  const contract = contracts[contractIndex] || null;

  return (
    <>
      <Table
        empty={t<string>('No contracts available')}
        header={headerRef.current}
      >
        {contracts.map((contract, index): React.ReactNode => (
          <Contract
            contract={contract}
            index={index}
            key={contract.address.toString()}
            links={contractLinks[contract.address.toString()]}
            onCall={_onCall}
            type={type}
          />
        ))}
      </Table>
      {isCallOpen && contract && (
        <Call
          contract={contract}
          isOpen={isCallOpen}
          messageIndex={messageIndex}
          onCallResult={onCallResult}
          onChangeMessage={_setMessageIndex}
          onClose={_toggleCall}
        />
      )}
    </>
  );
}

export default React.memo(ContractsTable);
