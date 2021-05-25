// Copyright 2017-2021 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useRef, useMemo, useEffect, useCallback, useState } from "react";

import { Table, Button } from "@polkadot/react-components";
import { useToggle } from "@polkadot/react-hooks";
import contracts from "../store";
import { useTranslation } from "../translate";
import Code from "./Code";
import store from "../store";
import Deploy from "./Deploy";
import CodeAdd from "./Add";
import { useContractAbi } from "../hooks";
interface Props {
  // updated: number;
}

function Codes({}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [allCodes, setAllCodes] = useState(() => store.getAllCode());
  const [codeHash, setCodeHash] = useState<string | undefined>();
  const [constructorIndex, setConstructorIndex] = useState(0);
  const [isDeployOpen, toggleDeploy, setIsDeployOpen] = useToggle();
  const [updated, setUpdated] = useState(() => Date.now());
  const [isHashOpen, toggleHash] = useToggle();

  const onShowDeploy = useCallback(
    (codeHash: string, constructorIndex: number): void => {
      setCodeHash(codeHash || (allCodes && allCodes[0] ? allCodes[0].json.codeHash : undefined));
      setConstructorIndex(constructorIndex);
      toggleDeploy();
    },
    [allCodes, toggleDeploy]
  );

  const onCloseDeploy = useCallback(() => setIsDeployOpen(false), [setIsDeployOpen]);

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

  const inMemoryHeaderRef = useRef<[string?, string?, number?][]>([
    [t("local contract bundles"), "start"],
    [],
    [],
    [t("status"), "start"],
    [t("upload time"), "start"],
    []
  ]);

  const inStoreHeaderRef = useRef<[string?, string?, number?][]>([
    [t("saved contract bundles"), "start"],
    [],
    [],
    [t("status"), "start"],
    [t("upload time"), "start"],
    []
  ]);

  const allCode = contracts.getAllCode();

  const inMemoryCode = useMemo(() => {
    return allCode.filter(code => {
      return (code.json as any).isMemory;
    });
  }, [allCode]);

  const inStoreCode = useMemo(() => {
    return allCode.filter(code => {
      return !(code.json as any).isMemory;
    });
  }, [allCode]);

  return (
    <>
      <Button.Group>
        <Button icon="plus" label={t("Add contract bundle")} onClick={toggleHash} />
      </Button.Group>
      <Table empty={t<string>("No contract bundle available")} header={inMemoryHeaderRef.current}>
        {inMemoryCode.map(
          (code): React.ReactNode => (
            <Code code={code} key={code.json.codeHash} onShowDeploy={onShowDeploy} />
          )
        )}
      </Table>
      <Table empty={t<string>("No contract bundle available")} header={inStoreHeaderRef.current}>
        {inStoreCode.map(
          (code): React.ReactNode => (
            <Code code={code} key={code.json.codeHash} onShowDeploy={onShowDeploy} />
          )
        )}
      </Table>
      {codeHash && isDeployOpen && (
        <Deploy
          codeHash={codeHash}
          constructorIndex={constructorIndex}
          onClose={onCloseDeploy}
          setConstructorIndex={setConstructorIndex}
        />
      )}
      {isHashOpen && <CodeAdd onClose={toggleHash} />}
    </>
  );
}

export default React.memo(Codes);
