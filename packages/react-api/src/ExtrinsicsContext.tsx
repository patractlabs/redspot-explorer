/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable header/header */
import type { Vec } from '@polkadot/types';
import type { SignedBlock } from '@polkadot/types/interfaces';
import type { EventRecord } from '@polkadot/types/interfaces/system';

import React, { Context, useEffect, useRef, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { useApi } from '@polkadot/react-hooks';
import { stringToU8a, u8aToHex } from '@polkadot/util';

export interface Extrinsic {
  contract: string;
  data: string;
  hash: string;
  index: number;
  method: { method: string; section: string; };
}

export interface Block {
  hash: string;
  height: number;
  extrinsics: Extrinsic[];

}

const ExtrisnicsContext: Context<{
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
}> = React.createContext({
  blocks: []
} as unknown as {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
});

interface Props {
  children: React.ReactNode;
  url?: string;
}

export const generateKey = (genesisHash: string): string => {
  const CONTRACT_EXTRINSICS_KEY = 'contract-extrinsics';

  return `${CONTRACT_EXTRINSICS_KEY}-${genesisHash}`;
};

export const saveBlocksToStorage = (genesisHash: string, blocks: Block[]): void => {
  localStorage.setItem(generateKey(genesisHash), JSON.stringify(blocks));
};

export const retriveBlocksFromStorage = (genesisHash: string): Block[] => {
  try {
    const retrivedString = localStorage.getItem(generateKey(genesisHash)) || '';

    return JSON.parse(retrivedString) as Block[];
  } catch {
    return [];
  }
};

const retriveBlock = async (api: ApiPromise, blockHash: string, height: number): Promise<Block> => {
  const [block, events] = await Promise.all([
    api.rpc.chain.getBlock(blockHash),
    api.query.system.events.at(blockHash)
  ]);

  return transformBlock(block, height, events);
};

const retriveBlocksFromNode = async (api: ApiPromise, startHeight = 1): Promise<Block[]> => {
  const header = await api.rpc.chain.getHeader();
  const currentHeight = header.number.toNumber();

  if (currentHeight <= startHeight) {
    return [];
  }

  type NullableBlock = Block | null;

  const blocks: NullableBlock[] = await Promise.all(
    (new Array(currentHeight - startHeight + 1))
      .fill(1)
      .map(async (_, i) => {
        try {
          const blockHash = await api.rpc.chain.getBlockHash(startHeight + i);

          return await retriveBlock(api, blockHash.toString(), startHeight + i);
        } catch (e) {
          return null;
        }
      })
  );

  // console.log('retriveBlocksFromEuropaNode', blocks, currentHeight, startHeight);

  return blocks.filter((block) => !!block) as Block[];
};

const isCall = (extrinsic: { method: { section: string; method: string; } }) => {
  return extrinsic.method.section === 'contracts' && extrinsic.method.method === 'call';
};

const isInstantiation = (extrinsic: { method: { section: string; method: string; } }) => {
  return extrinsic.method.section === 'contracts' && (extrinsic.method.method === 'instantiateWithCode' || extrinsic.method.method === 'instantiate');
};

const transformBlock = (block: SignedBlock, number: number, events: Vec<EventRecord>): Block => {
  const extrinsics: Extrinsic[] = block.block.extrinsics
    .map((extrinsic, index) => {
      let contract = '';

      if (isCall(extrinsic)) {
        contract = (extrinsic.args[0].toJSON() as { id: string }).id;
      } else if (isInstantiation(extrinsic)) {
        const event = events.find(({ event: { method, section }, phase }) =>
          phase.isApplyExtrinsic &&
            phase.asApplyExtrinsic.eq(index) &&
            section === 'contracts' &&
            method === 'Instantiated'
        );

        contract = event?.event.data[1].toString() || '';
      }

      return {
        contract,
        data: u8aToHex(extrinsic.args[3]?.toU8a() || stringToU8a('')),
        hash: extrinsic.hash.toString(),
        index,
        method: extrinsic.method.toHuman() as { method: string; section: string; }
      };
    })
    .filter((extrinsic) => isCall(extrinsic) || isInstantiation(extrinsic));

  return {
    extrinsics,
    hash: block.hash.toString(),
    height: number
  };
};

const patchBlocks = (oldBlocks: Block[], newBlocks: Block[]) => {
  if (!newBlocks.length) {
    return [...oldBlocks];
  }

  let sliceIndex = oldBlocks.findIndex((block) => block.height >= newBlocks[0].height);

  sliceIndex = sliceIndex < 0 ? oldBlocks.length : sliceIndex;

  return [
    ...oldBlocks.slice(0, sliceIndex),
    ...newBlocks
  ];
};

const ExtrisnicsProvider = React.memo(function Api ({ children }: Props): React.ReactElement<Props> {
  const { api, isApiReady, systemName } = useApi();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const blocksRef = useRef<Block[]>([]);

  useEffect(() => {
    if (!isApiReady) {
      return;
    }

    let initPromise: Promise<void>;

    if (systemName.toLowerCase().includes('europa')) {
      initPromise = retriveBlocksFromNode(api).then(
        (_blocks) => {
          blocksRef.current = _blocks;
          setBlocks(_blocks);
        },
        () => {}
      );
    } else {
      const savedBlocks = retriveBlocksFromStorage(api.genesisHash.toString());

      blocksRef.current = savedBlocks;
      setBlocks(savedBlocks);
      // console.log('savedBlocks', savedBlocks, systemName);
      initPromise = Promise.resolve();
    }

    initPromise.then(() => {
      api.derive.chain.subscribeNewHeads(async (header) => {
        const newBlock = await retriveBlock(api, header.hash.toString(), header.number.toNumber());

        if (!newBlock.extrinsics.length) {
          return;
        }

        const newBlocks = patchBlocks(blocksRef.current, [newBlock]);

        blocksRef.current = newBlocks;
        setBlocks(newBlocks);

        if (!systemName.toLowerCase().includes('europa')) {
          saveBlocksToStorage(api.genesisHash.toString(), newBlocks);
        }
      });
    }, () => {});
  }, [api, isApiReady, systemName]);

  return <ExtrisnicsContext.Provider value={{
    blocks,
    setBlocks
  }}>{children}</ExtrisnicsContext.Provider>;
});

export {
  ExtrisnicsContext,
  ExtrisnicsProvider
};
