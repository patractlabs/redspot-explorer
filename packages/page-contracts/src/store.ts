// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Hash } from '@polkadot/types/interfaces';
import type { CodeJson, CodeStored } from './types';

import EventEmitter from 'eventemitter3';
import store from 'store';

import { Abi } from '@polkadot/api-contract';
import { api } from '@polkadot/react-api';

const KEY_CODE = 'code:';
const REDSPOT_KEY_CODE = 'redspotCode:';

let MEMORY = new Map()

class Store extends EventEmitter {
  private allCode: CodeStored[] = [];

  public get hasCode (): boolean {
    return this.allCode.length !== 0;
  }

  public getAllCode (): CodeStored[] {
    return [...this.allCode].sort((a, b) => b.json.whenCreated - a.json.whenCreated);
  }

  public getCode (codeHash: string): CodeStored | undefined {
    return this.allCode.find((item) => item.json.codeHash === codeHash);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async saveCode (codeHash: string | Hash, partial: Partial<CodeJson>, isMemory = false): Promise<void> {
    const hex = (typeof codeHash === 'string' ? api.registry.createType('Hash', codeHash) : codeHash).toHex();
    const existing = this.getCode(hex);
    
    const json = {
      ...(existing ? existing.json : {}),
      ...partial,
      codeHash: hex,
      isMemory: isMemory,
      genesisHash: api.genesisHash.toHex(),
      whenCreated: existing?.json.whenCreated || Date.now()
    };
    
    if(isMemory) {
      const key = `${REDSPOT_KEY_CODE}${json.codeHash}`
      MEMORY.set(key, json)
      this.addCode(key, json as CodeJson);
    } else {
      const key = `${KEY_CODE}${json.codeHash}`
      store.set(key, json);
      this.addCode(key, json as CodeJson);
    }
  }

  public forgetCode (codeHash: string): void {
    this.removeCode(`${KEY_CODE}${codeHash}`, codeHash);
  }

  public async loadAll (): Promise<void> {
    try {
      await api.isReady;

      const genesisHash = api.genesisHash.toHex();

      store.each((json: CodeJson, key: string): void => {
        if (json && json.genesisHash !== genesisHash) {
          return;
        }

        if (key.startsWith(KEY_CODE)) {
          this.addCode(key, json);
        }
      });

      MEMORY.forEach((json, key): void => {
        if (json && json.genesisHash !== genesisHash) {
          return;
        }

        if (key.startsWith(REDSPOT_KEY_CODE)) {
          this.addCode(key, json);
        }
      });
    } catch (error) {
      console.error('Unable to load code', error);
    }
  }

  private addCode (key: string, json: CodeJson): void {
    try {
      const isMemory = !key.startsWith(KEY_CODE) 
      const finded = this.allCode.find(item => item.json.codeHash === json.codeHash && !!(item as any).json?.isMemory === isMemory)
      const isNew = !finded

      if(isNew) {
        this.allCode.push({
          contractAbi: json.abi
            ? new Abi(json.abi, api.registry.getChainProperties())
            : undefined,

          json
        });
      }

      isNew && this.emit('new-code');
    } catch (error) {
      this.removeCode(key, json.codeHash);
    }
  }

  private removeCode (key: string, codeHash: string): void {
    try {
      this.allCode = this.allCode.filter((item) => {
        if((item.json as any).isMemory) {
          return true
        } else {
          return item.json.codeHash !== codeHash
        }
      })
      store.remove(key);
      MEMORY.delete(key)
      this.emit('removed-code');
    } catch (error) {
      console.error(error);
    }
  }
}

export default new Store();
