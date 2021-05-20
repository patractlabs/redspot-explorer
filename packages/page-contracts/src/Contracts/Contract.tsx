// Copyright 2017-2021 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ContractCallOutcome } from '@polkadot/api-contract/types';
import type { ActionStatus } from '@polkadot/react-components/Status/types';
import type { Option } from '@polkadot/types';
import type { BlockNumber, ContractInfo } from '@polkadot/types/interfaces';
import type { ContractLink } from './types';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { ContractPromise } from '@polkadot/api-contract';
import { Block, ExtrisnicsContext, retriveBlocksFromStorage, saveBlocksToStorage } from '@polkadot/react-api/ExtrinsicsContext';
import { AddressInfo, AddressMini, Button, Forget } from '@polkadot/react-components';
import { getAddressMeta } from '@polkadot/react-components/util';
import { useApi, useBestNumber, useCall, useToggle } from '@polkadot/react-hooks';
import { BlockToTime } from '@polkadot/react-query';
import { keyring } from '@polkadot/ui-keyring';
import { formatNumber, isFunction, isUndefined } from '@polkadot/util';

import Messages from '../shared/Messages';
import { useTranslation } from '../translate';
import { Extrinsics } from './Extrinsics';

interface Props {
  className?: string;
  contract: ContractPromise;
  index: number;
  links?: ContractLink[];
  onCall: (contractIndex: number, messaeIndex: number, resultCb: (messageIndex: number, result?: ContractCallOutcome) => void) => void;
}

function transformInfo (optInfo: Option<ContractInfo>): ContractInfo | null {
  return optInfo.unwrapOr(null);
}

function removeContractRelatedExtrinsics (genesisHash: string, contract: string): Block[] {
  let blocks = retriveBlocksFromStorage(genesisHash);

  blocks = blocks.filter((block) => {
    block.extrinsics = block.extrinsics.filter((extrinsic) => extrinsic.contract !== contract);

    return !!block.extrinsics.length;
  });
  saveBlocksToStorage(genesisHash, blocks);

  return blocks;
}

dayjs.extend(relativeTime);

function Contract ({ className, contract, index, links, onCall }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const bestNumber = useBestNumber();
  const info = useCall<ContractInfo | null>(api.query.contracts.contractInfoOf, [contract.address], { transform: transformInfo });
  const [evictAt, setEvictAt] = useState<BlockNumber | null>(null);
  const [isForgetOpen, toggleIsForgetOpen] = useToggle();
  const [ isExtrinsicsOpen, toggleIsExtrinsicsOpen ] = useState(false);
  const { setBlocks } = useContext(ExtrisnicsContext);

  useEffect((): void => {
    if (info && isFunction(api.rpc.contracts?.rentProjection)) {
      api.rpc.contracts
        .rentProjection(contract.address)
        .then((value) => setEvictAt(value.unwrapOr(null)))
        .catch(() => undefined);
    }
  }, [api, contract, info]);

  const _onCall = useCallback(
    (messageIndex: number, resultCb: (messageIndex: number, result?: ContractCallOutcome) => void) => onCall(index, messageIndex, resultCb),
    [index, onCall]
  );

  const _onForget = useCallback(
    (): void => {
      const status: Partial<ActionStatus> = {
        account: contract.address,
        action: 'forget'
      };

      try {
        keyring.forgetContract(contract.address.toString());
        status.status = 'success';
        status.message = t<string>('address forgotten');
      } catch (error) {
        status.status = 'error';
        status.message = (error as Error).message;
      }

      const remainedBlocks = removeContractRelatedExtrinsics(api.genesisHash.toString(), contract.address.toString());

      setBlocks(remainedBlocks);
      toggleIsForgetOpen();
    },
    [contract.address, t, toggleIsForgetOpen, api, setBlocks]
  );

  const createdTime = useMemo(() => {
    const meta = getAddressMeta(contract.address.toString(), 'contract')

    if(meta.whenCreated) {
      return dayjs(meta.whenCreated).fromNow()
    }
    return null
  }, [contract.address])

  return (
    <tr className={className}>
      <td className='address'>
        {isForgetOpen && (
          <Forget
            address={contract.address.toString()}
            key='modal-forget-contract'
            mode='contract'
            onClose={toggleIsForgetOpen}
            onForget={_onForget}
          />
        )}
        <AddressMini value={contract.address} />
      </td>
      <td>
        {
          isExtrinsicsOpen &&
            <Extrinsics
              contract={contract}
              contractAddress={contract.address.toString()}
              onClose={() => toggleIsExtrinsicsOpen(false)} />
        }
        <a onClick={() => toggleIsExtrinsicsOpen(true)}> {t('extrinsics')} </a>
      </td>
      <td className='all' >
        <Messages
          contract={contract}
          contractAbi={contract.abi}
          isWatching
          onSelect={_onCall}
          withMessages
        />
      </td>
      <td className='top'>
        {links?.map(({ blockHash, blockNumber }, index): React.ReactNode => (
          <a
            href={`#/explorer/query/${blockHash}`}
            key={`${index}-${blockNumber}`}
          >#{blockNumber}</a>
        ))}
      </td>
      <td className='number'>
        <AddressInfo
          address={contract.address}
          withBalance
          withBalanceToggle
          withExtended={false}
        />
      </td>
      <td className='start together'>
        {!isUndefined(info) && (
          info
            ? info.type
            : t<string>('Not on-chain')
        )}
      </td>
      <td className='number together media--1100'>
        {bestNumber && (
          evictAt
            ? (
              <>
                <BlockToTime value={evictAt.sub(bestNumber)} />
                #{formatNumber(evictAt)}
              </>
            )
            : t<string>('None')
        )}
      </td>
      <td>
        {createdTime}
      </td>
      <td className='button'>
        <Button
          icon='trash'
          onClick={toggleIsForgetOpen}
        />
      </td>
    </tr>
  );
}

export default React.memo(styled(Contract)`
  > .all {
    > .ui--Messages {
      padding-bottom: 0px !important;
    }
  }
  td.top a+a {
    margin-left: 0.75rem;
  }
`);
