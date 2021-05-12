/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable header/header */
import type { SignedBlock } from '@polkadot/types/interfaces';

import React, { Context, useEffect, useRef, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { useApi } from '@polkadot/react-hooks';

export interface Extrinsic {
  contract: string;
  args: string[];
  callIndex: string;
  createdAtHash?: string;
  data: string;
  hash: string;
  index: number;
  isSigned: boolean;
  method: { method: string, section: string };
  nonce: number;
  signature: string;
  signer: string;
  type: number;
}

export interface Block {
  hash: string;
  height: number;
  extrinsics: Extrinsic[];

}

const ExtrisnicsContext: Context<{
  blocks: Block[];
}> = React.createContext({
  blocks: []
} as {
  blocks: Block[];
});

interface Props {
  children: React.ReactNode;
  url?: string;
}

const CONTRACT_EXTRINSICS_KEY = 'contract-extrinsics';

const retriveBlocksFromStorage = (systemName: string): Block[] => {
  try {
    const retrivedString = localStorage.getItem(`${CONTRACT_EXTRINSICS_KEY}-${systemName}`) || '';

    return JSON.parse(retrivedString) as Block[];
  } catch {
    return [];
  }
};

const retriveBlocksFromEuropaNode = async (api: ApiPromise, startIndex = 1): Promise<{
  block: SignedBlock;
  height: number;
}[]> => {
  const header = await api.rpc.chain.getHeader();
  const currentHeight = header.number.toNumber();

  type NullableBlock = {
    block: SignedBlock;
    height: number;
  } | null;

  const blocks: NullableBlock[] = await Promise.all(
    (new Array(currentHeight - startIndex + 1))
      .fill(1)
      .map(async (_, i) => {
        try {
          const blockHash = await api.rpc.chain.getBlockHash(startIndex + i);
          const block = await api.rpc.chain.getBlock(blockHash.toString());

          return {
            block,
            height: startIndex + i
          };
        } catch (e) {
          return null;
        }
      })
  );

  console.log('retriveBlocksFromEuropaNode', blocks, currentHeight, startIndex);

  return blocks.filter((block) => !!block) as { block: SignedBlock; height: number; }[];
};

const transformBlock = (block: SignedBlock, number: number): Block => {
  const extrinsics: Extrinsic[] = block.block.extrinsics
    .map((e, index) => {
      const dest: { id: string } = e.args[0]?.toJSON() as { id: string };

      return {
        args: e.args.map((a) => a.toString()),
        callIndex: e.callIndex.toString(),
        contract: dest.id,
        createdAtHash: e.createdAtHash?.toString(),
        data: e.args[3]?.toString() || '',
        hash: e.hash.toString(),
        index,
        isSigned: e.isSigned,
        method: e.method.toHuman() as { method: string, section: string },
        nonce: e.nonce.toNumber(),
        signature: e.signature.toString(),
        signer: e.signer.toString(),
        type: e.type
      };
    })
    .filter((e) => e.method.section === 'contracts' && e.method.method === 'call');

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
    ...newBlocks.filter((block) => block.extrinsics.length)
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
      initPromise = retriveBlocksFromEuropaNode(api, 1).then(
        (_blocks) => {
          const blocks = _blocks.map((block) => transformBlock(block.block, block.height));

          blocksRef.current = blocks;
          setBlocks(blocks);
          localStorage.setItem(`${CONTRACT_EXTRINSICS_KEY}-${systemName}`, JSON.stringify(blocks));
          console.log('patch from europa', blocks);
        },
        () => {}
      );
    } else {
      const savedBlocks = retriveBlocksFromStorage(systemName);

      blocksRef.current = savedBlocks;
      setBlocks(savedBlocks);
      console.log('savedBlocks', savedBlocks, systemName);
      initPromise = Promise.resolve();
    }

    initPromise.then(() => {
      api.derive.chain.subscribeNewHeads((header) => {
        console.log('new header', header);

        api.rpc.chain.getBlock(header.hash.toString()).then((block) => {
          const newBlock = transformBlock(block, header.number.toNumber());
          const newBlocks = patchBlocks(blocksRef.current, [newBlock]);

          blocksRef.current = newBlocks;
          setBlocks(newBlocks);
          localStorage.setItem(`${CONTRACT_EXTRINSICS_KEY}-${systemName}`, JSON.stringify(newBlocks));

          console.log('new blocks', newBlocks);
        });
      });
    }, () => {});
  }, [api, isApiReady, systemName]);

  return <ExtrisnicsContext.Provider value={{
    blocks
  }}>{children}</ExtrisnicsContext.Provider>;
});

export {
  ExtrisnicsContext,
  ExtrisnicsProvider
};
