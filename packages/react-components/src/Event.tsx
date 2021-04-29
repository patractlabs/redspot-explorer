// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DecodedEvent } from '@polkadot/api-contract/types';
import type { Bytes } from '@polkadot/types';
import type { Event } from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import { useApi } from '@polkadot/react-hooks';
import { NavLink } from 'react-router-dom';
import { Abi } from '@polkadot/api-contract';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Input } from '@polkadot/react-components';
import Params from '@polkadot/react-params';
import { getTypeDef } from '@polkadot/types';

import { useTranslation } from './translate';
import { getContractAbiByHash, getContractAbi } from './util';
import styled from 'styled-components';

const LinkCodes = styled.div`
  text-align: right;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`
export interface Props {
  children?: React.ReactNode;
  className?: string;
  value: Event;
}

interface Value {
  isValid: boolean;
  value: Codec;
}

interface AbiEvent extends DecodedEvent {
  values: Value[];
}

function EventDisplay ({ children, className = '', value }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const params = value.typeDef.map(({ type }) => ({ type: getTypeDef(type) }));
  const values = value.data.map((value) => ({ isValid: true, value }));
  const [abiEvent, setAbiEvent]  = useState<AbiEvent | null>(null)
  const { api } = useApi();
  
  const isAbiEvent = useMemo(() => {
    return value.section === 'contracts' && value.method === 'ContractEmitted'  && value.data.length === 2
  }, [value])

  const getAbiEvent = useCallback(
    async () => {
      // for contracts, we decode the actual event
      if (value.section === 'contracts' && value.method === 'ContractEmitted' && value.data.length === 2) {
        // see if we have info for this contract
        const [accountId, encoded] = value.data;

        let abi: Abi | null;
        try {
          abi = getContractAbi(accountId.toString()) 

          if(!abi) {
            const data = await api.query.contracts.contractInfoOf(accountId.toString());
            if(!data.isNone && data.unwrap().isAlive) {
              abi = getContractAbiByHash(data.unwrap().asAlive.codeHash.toHex());
            }
          }


          if (abi) {
            const decoded = abi.decodeEvent(encoded as Bytes);
            
            
            setAbiEvent({
              ...decoded,
              values: decoded.args.map((value) => ({ isValid: true, value }))
            })

            return 
          }
          
        } catch (error) {
          // ABI mismatch?
          console.error(error);
        }
      }

      setAbiEvent(null);
    },
    [value, api]
  );
  
  useEffect(() => {
    getAbiEvent()
  }, [getAbiEvent]);

  return (
    <div className={`ui--Event ${className}`}>
      {children}
      <Params
        isDisabled
        params={params}
        values={values}
      >
        {isAbiEvent ? abiEvent ? (
          <>
            <Input
              isDisabled
              label={t<string>('contract event')}
              value={abiEvent.event.identifier}
            />
            <Params
              isDisabled
              params={abiEvent.event.args}
              values={abiEvent.values}
            />
          </>
        ): <LinkCodes>
          <NavLink to="/contracts/codes">upload contract bundle</NavLink>
        </LinkCodes> : null}
      </Params>
    </div>
  );
}

export default React.memo(EventDisplay);
