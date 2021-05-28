// Copyright 2017-2021 @polkadot/app-js authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { editor as Editor, languages, KeyMod, KeyCode } from "monaco-editor";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "../translate";
import store from 'store'

interface Props {
  className?: string;
  editor: Editor.IStandaloneCodeEditor;
  setEditor: React.Dispatch<React.SetStateAction<Editor.IStandaloneCodeEditor | undefined>>;
}
const initCode = `
  import { patract, network } from "redspot";

  const { getContractFactory } = patract;
  const { createSigner, keyring, api, getSigners } = network;

  async function run() {
    await api.isReady;
    const signer = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

    const contractFactory = await getContractFactory("erc20", signer);

    const balance = await api.query.system.account(signer);

    console.log("Balance: ", balance.toHuman());

    const contract = await contractFactory.deploy("new", "1000000", {
      gasLimit: "200000000000",
      value: "1000 UNIT",
    });

    await contract.tx.transfer(signer, 7);
    console.log("");
    console.log(
      "Deploy successfully. The contract address: ",
      contract.address.toString()
    );

    api.disconnect();
  }

  run().catch((err) => {
    console.log(err);
  });
`
function PlayGround({ className = "", editor, setEditor }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      const storeCode = store.get('REDSPOT_CODE')
      const editorInstance: Editor.IStandaloneCodeEditor = Editor.create(container.current, {
        value: storeCode || initCode,
        language: "typescript"
      });

      languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true
      });

      editorInstance.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, function() {
        console.log("SAVE pressed!");
      });

      setEditor(editorInstance);

      const id = setInterval(() => {
        store.set('REDSPOT_CODE', editorInstance.getValue())
      }, 3000)

      return () => {
        clearInterval(id)
      }
    }
  }, [container]);

  return <div ref={container} className={className} style={{ minHeight: "calc(100vh - 120px)" }}></div>;
}

export default React.memo(styled(PlayGround)`
  width: 60%;

  .monaco-editor {
    border-radius: 0.25em;
  }
  .monaco-editor .overflow-guard {
    border-radius: 0.25em;
  }
`);
