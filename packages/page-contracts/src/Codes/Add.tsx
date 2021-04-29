// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useMemo, useState } from "react";

import { Button, Input, Modal } from "@polkadot/react-components";
import { isNull } from "@polkadot/util";

import { ABI, InputName } from "../shared";
import store from "../store";
import { useTranslation } from "../translate";
import useAbi from "../useAbi";
import ValidateCode from "./ValidateCode";

interface Props {
  onClose: () => void;
}

function Add({ onClose }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [isCodeHashValid, setIsCodeHashValid] = useState(false);
  const { abi, contractAbi, errorText, isAbiError, isAbiSupplied, isAbiValid, onChangeAbi, onRemoveAbi } = useAbi();

  const [name, codeHash] = useMemo(() => {
    const name = contractAbi?.project?.contract?.name?.toString();
    const hash = contractAbi?.project?.source?.wasmHash?.toString();
    
    if (name && hash) {
      return [`${name}-${hash.slice(2,6)}`, hash];
    } else {
      return [];
    }
  }, [contractAbi]);

  const source = useMemo(() => {
    return contractAbi?.project?.source
  }, [contractAbi])

  const _onSave = useCallback((): void => {
    if (!codeHash || !name) {
      return;
    }

    store
      .saveCode(codeHash, { abi, name, tags: [] })
      .then(() => onClose())
      .catch((error): void => {
        console.error("Unable to save code", error);
      });
  }, [abi, codeHash, name, onClose]);

  const isNameValid = !isNull(name) && name && name.length > 0;
  const isValid = isCodeHashValid && isNameValid && isAbiSupplied && isAbiValid;

  return (
    <Modal header={t("Add contract bundle")}>
      <Modal.Content>
        <ValidateCode source={source} codeHash={codeHash} onChange={setIsCodeHashValid} />
        <ABI
          contractAbi={contractAbi}
          errorText={errorText}
          isError={isAbiError || !isAbiError}
          isSupplied={isAbiSupplied}
          isValid={isAbiValid}
          onChange={onChangeAbi}
          onRemove={onRemoveAbi}
        />
        {name && <InputName isDisabled isError={!isNameValid} value={name || undefined} />}
        {codeHash && (
          <Input
            isDisabled
            help={t("The code hash for the on-chain deployed code.")}
            isError={codeHash.length > 0 && !isCodeHashValid}
            label={t("code hash")}
            value={codeHash}
          />
        )}
      </Modal.Content>
      <Modal.Actions onCancel={onClose}>
        <Button icon="save" isDisabled={!isValid} label={t("Save")} onClick={_onSave} />
      </Modal.Actions>
    </Modal>
  );
}

export default React.memo(Add);
