/* eslint-disable header/header */
import React, { FC, ReactElement, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ContractPromise } from '@polkadot/api-contract';
import { Extrinsic, ExtrisnicsContext } from '@polkadot/react-api/ExtrinsicsContext';
import { Modal, Table } from '@polkadot/react-components';
import { stringToU8a } from '@polkadot/util';

import { useTranslation } from '../translate';

type ExtendedExtrinsic = Extrinsic & {
  height: number;
  blockHash: string;
}

const TableNoMargin = styled(Table)`
  margin-bottom: 0rem;
`;

export const Extrinsics: FC<{
  contract: ContractPromise;
  contractAddress: string;
  onClose: () => void;
}> = ({ contract, contractAddress, onClose }): ReactElement => {
  const { t } = useTranslation();
  const { blocks } = useContext(ExtrisnicsContext);

  const extrisnics: ExtendedExtrinsic[] = useMemo(
    () => {
      console.log('contract, contractAddress', contract, contractAddress, blocks);

      return blocks.reduce((list: ExtendedExtrinsic[], current) =>
        list.concat(
          current.extrinsics.map(
            (extrinsic) => ({
              ...extrinsic,
              blockHash: current.hash,
              height: current.height
            })
          )
        ), [])
        .filter((extrisnic) => extrisnic.contract === contractAddress);
    },
    [blocks, contractAddress]
  );

  console.log('selectors', contract.abi.messages.map(m => m.selector.toHuman()), extrisnics.map(e => e.data));

  console.log('asdfasd', contract.abi.decodeMessage(stringToU8a(extrisnics[0]?.data)))

  return (
    <Modal header={t('Related Extrinsics')}>
      <Modal.Content>
        <TableNoMargin
          empty={t<string>('No Related Extrinsics')}>
          {
            extrisnics.map((extrisnic) =>
              <tr key={extrisnic.hash}>
                <td>{ contract.abi.messages.find((message) => message.selector.toHex() === extrisnic.data?.slice(0, 10))?.identifier }</td>
                <td><Link to={`/explorer/query/${extrisnic.height}`}>
                  {extrisnic.height} - {extrisnic.index === undefined ? '0' : extrisnic.index}
                </Link></td>
                <td>{extrisnic.hash}</td>
              </tr>
            )
          }
        </TableNoMargin>
      </Modal.Content>
      <Modal.Actions
        cancelLabel={ t('Close') }
        onCancel={onClose}>
      </Modal.Actions>
    </Modal>
  );
};
