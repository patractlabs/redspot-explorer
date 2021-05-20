/* eslint-disable sort-keys */
/* eslint-disable header/header */
import React, { FC, ReactElement, useContext, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ContractPromise } from '@polkadot/api-contract';
import { Extrinsic, ExtrisnicsContext } from '@polkadot/react-api/ExtrinsicsContext';
import { Modal, Table } from '@polkadot/react-components';
import { hexToU8a } from '@polkadot/util';

import { useTranslation } from '../translate';
import { useApi } from '@polkadot/react-hooks';

interface ArgPair {
  name: string;
  type: string;
  value: string;
}

type ExtendedExtrinsic = Extrinsic & {
  height: number;
  blockHash: string;
  identifier: string;
  messageArgs: ArgPair[];
}

const TableNoMargin = styled(Table)`
  margin-bottom: 0rem;
`;
const Tip = styled.div`
  margin-bottom: 10px;
  color: rgba(254, 240, 240, 0.66);
`;


const transformMessage = (contract: ContractPromise, extrinsic: Extrinsic): {
  identifier: string;
  args: ArgPair[];
} => {
  try {
    const message = contract.abi.decodeMessage(hexToU8a(extrinsic.data));

    const args: ArgPair[] = message.args.map((arg, index) => ({
      name: message.message.args[index].name,
      type: message.message.args[index].type.displayName || '',
      value: arg.toString()
    }));

    return { identifier: message.message.identifier, args };
  } catch (e) {
    return { identifier: '', args: [] };
  }
};

export const Extrinsics: FC<{
  contract: ContractPromise;
  contractAddress: string;
  onClose: () => void;
}> = ({ contract, contractAddress, onClose }): ReactElement => {
  const { t } = useTranslation();
  const { systemName } = useApi();
  const { blocks } = useContext(ExtrisnicsContext);
  const headerRef = useRef([
    [t('block')],
    [t('method'), 'start'],
    [t('extrinsic hash'), 'start']
  ]);

  const extrisnics: ExtendedExtrinsic[] = useMemo(
    () =>
      blocks.reduce((list: ExtendedExtrinsic[], current) =>
        list.concat(
          current.extrinsics.map(
            (_extrinsic) => {
              const message = transformMessage(contract, _extrinsic);
              const extrinsic: ExtendedExtrinsic = {
                ..._extrinsic,
                blockHash: current.hash,
                height: current.height,
                messageArgs: message.args,
                identifier: message.identifier
              };

              return extrinsic;
            }
          )
        ).reverse(),
      [])
        .filter((extrisnic) => extrisnic.contract === contractAddress),
    [blocks, contractAddress, contract]
  );

  return (
    <Modal header={t('Related Extrinsics')}>
      <Modal.Content>
        {
          !systemName.toLowerCase().includes('europa') &&
            <Tip>{t('Not all related extrinsics included')}</Tip>
        }
        <TableNoMargin
          empty={t<string>('No Related Extrinsics')}
          header={headerRef.current}>
          {
            extrisnics.map((extrisnic) =>
              <tr key={extrisnic.hash}>
                <td><Link to={`/explorer/query/${extrisnic.height}`}>
                  {extrisnic.height} - {extrisnic.index === undefined ? '0' : extrisnic.index}
                </Link></td>
                <td style={{ color: '#2f8ddb' }}>{ extrisnic.identifier }</td>
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
