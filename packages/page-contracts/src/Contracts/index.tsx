// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Button } from "@polkadot/react-components";
import type { AppProps as Props } from '@polkadot/react-components/types';
import { useApi, useContracts, useToggle } from "@polkadot/react-hooks";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import styled from "styled-components";
import CodeUpload from "../Codes/Upload";
import ContractAdd from "../Contracts/Add";
import ContractsTable from "../Contracts/ContractsTable";
import store from "../store";
import { useTranslation } from "../translate";
import Contract from './Contract';
import { getContractForAddress } from './util';

function filterContracts (api: ApiPromise, keyringContracts: string[] = []): ContractPromise[] {
  return keyringContracts
    .map((address) => getContractForAddress(api, address.toString()))
    .filter((contract): contract is ContractPromise => !!contract);
}

function Contracts({ className = "" }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { allContracts } = useContracts();
  const [isAddOpen, toggleAdd] = useToggle();
  const [count, setCount] = useReducer((x: any) => x + 1, 0);
  const [onRefresh, setOnRefresh] = useState(false);
  const [isUploadOpen, toggleUpload] = useToggle();
  const { api } = useApi();
  const [allCodes, setAllCodes] = useState(() => store.getAllCode());
  const [updated, setUpdated] = useState(() => Date.now());

  const [localContracts, setLocalContracts] = useState<ContractPromise[]>([])

  useEffect((): void => {
    const triggerUpdate = (): void => {
      setUpdated(Date.now());
      setAllCodes(store.getAllCode());
    };

    store.on("new-code", triggerUpdate);
    store.on("removed-code", triggerUpdate);
    store
      .loadAll()
      .then(() => setAllCodes(store.getAllCode()))
      .catch((): void => {
        // noop, handled internally
      });
  }, []);

  useEffect((): void => {
    setOnRefresh(true)
    api.query.contracts.contractInfoOf.entries()
    .then(arr => {
      const result = arr.map(([address, info]) => {
        if(!info.isEmpty) {
          if(info.unwrap().isAlive) {
            const code = store.getCode(info.unwrap().asAlive.codeHash.toHex())

            if(code) {
              return new ContractPromise(api, code.contractAbi, address.args[0].toString())
            }
          }
        };
        return null
        
      }).filter((data) => data)

      setLocalContracts(result as any)
    })
    .catch(console.error)
    .finally(() => setOnRefresh(false));
  }, [api, count]);

  const savedContracts = useMemo(
    () => filterContracts(api, allContracts),
    [api, updated, allContracts]
  );

  

  return (
    <div className={className}>
      <Button.Group>
        <Button icon="plus" label={t("Add an existing contract")} onClick={toggleAdd} />
        <Button icon="sync-alt" isBusy={onRefresh} label={t("Refresh")} onClick={() => setCount()} />
      </Button.Group>
      <ContractsTable updated={updated} contracts={localContracts} type="local" />
      <ContractsTable updated={updated} contracts={savedContracts} type="store" />
      {isUploadOpen && <CodeUpload onClose={toggleUpload} />}
      {isAddOpen && <ContractAdd onClose={toggleAdd} />}
    </div>
  );
}

export default React.memo(styled(Contracts)`
  .ui--Table td > article {
    background: transparent;
    border: none;
    margin: 0;
    padding: 0;
  }
`);
