// Copyright 2017-2021 @polkadot/app-contracts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@polkadot/react-components';
import type { AppProps as Props } from '@polkadot/react-components/types';
import { useContracts, useToggle } from '@polkadot/react-hooks';
import React from 'react';
import styled from 'styled-components';
import CodeUpload from '../Codes/Upload';
import ContractAdd from '../Contracts/Add';
import ContractsTable from '../Contracts/ContractsTable';
import { useTranslation } from '../translate';



function Contracts ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { allContracts } = useContracts();
  const [isAddOpen, toggleAdd] = useToggle();
  const [isUploadOpen, toggleUpload] = useToggle();

  return (
    <div className={className}>
      {/* <Summary trigger={updated} /> */}
      <Button.Group>
        {/* <Button
          icon='plus'
          label={t('Upload & deploy code')}
          onClick={toggleUpload}
        /> */}
        <Button
          icon='plus'
          label={t('Add an existing contract')}
          onClick={toggleAdd}
        />
      </Button.Group>
      <ContractsTable
        contracts={allContracts}
      />
      {isUploadOpen && (
        <CodeUpload onClose={toggleUpload} />
      )}
      {isAddOpen && (
        <ContractAdd onClose={toggleAdd} />
      )}
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
