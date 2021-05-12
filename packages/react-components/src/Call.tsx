// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicSignature } from '@polkadot/types/interfaces';
import type { Codec, IExtrinsic, IMethod, TypeDef } from '@polkadot/types/types';

import BN from 'bn.js';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { Abi } from '@polkadot/api-contract';
import { getContractAbiByHash, getContractAbi } from './util';
import Params from '@polkadot/react-params';
import { FormatBalance } from '@polkadot/react-query';
import { Enum, GenericCall, getTypeDef } from '@polkadot/types';
import { useApi } from '@polkadot/react-hooks';
import { blake2AsU8a, decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { Input } from '@polkadot/react-components';
import { NavLink } from 'react-router-dom';

import Static from './Static';
import { useTranslation } from './translate';

export interface Props {
  children?: React.ReactNode;
  className?: string;
  labelHash?: React.ReactNode;
  labelSignature?: React.ReactNode;
  mortality?: string;
  onError?: () => void;
  value: IExtrinsic | IMethod;
  withBorder?: boolean;
  withHash?: boolean;
  withSignature?: boolean;
  tip?: BN;
}

interface Param {
  name: string;
  type: TypeDef;
}

interface Value {
  isValid: boolean;
  value: Codec;
}

interface Extracted {
  hash: string | null;
  params: Param[];
  signature: string | null;
  signatureType: string | null;
  values: Value[];
}

const LinkCodes = styled.div`
  text-align: right;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`

function isExtrinsic (value: IExtrinsic | IMethod): value is IExtrinsic {
  return !!(value as IExtrinsic).signature;
}

// This is no doubt NOT the way to do things - however there is no other option
function getRawSignature (value: IExtrinsic): ExtrinsicSignature | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (value as any)._raw?.signature?.multiSignature as ExtrinsicSignature;
}

function extractState (value: IExtrinsic | IMethod, withHash?: boolean, withSignature?: boolean): Extracted {
  const params = GenericCall.filterOrigin(value.meta).map(({ name, type }): Param => ({
    name: name.toString(),
    type: getTypeDef(type.toString())
  }));
  const values = value.args.map((value): Value => ({
    isValid: true,
    value
  }));
  const hash = withHash
    ? value.hash.toHex()
    : null;
  let signature: string | null = null;
  let signatureType: string | null = null;

  if (withSignature && isExtrinsic(value) && value.isSigned) {
    const raw = getRawSignature(value);

    signature = value.signature.toHex();
    signatureType = raw instanceof Enum
      ? raw.type
      : null;
  }

  // console.log('params', params, values[3]?.value.toHuman());

  return { hash, params, signature, signatureType, values };
}

function Call ({ children, className = '', labelHash, labelSignature, mortality, onError, tip, value, withBorder, withHash, withSignature }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [{ hash, params, signature, signatureType, values }, setExtracted] = useState<Extracted>({ hash: null, params: [], signature: null, signatureType: null, values: [] });

  useEffect((): void => {
    console.log('extractState', value.args[3]?.toString(), value, value.toHuman(), value.meta.toHuman());

    setExtracted(extractState(value, withHash, withSignature));
  }, [value, withHash, withSignature]);

  const [abiCall, setAbiCall]  = useState<any>(null)
  const { api } = useApi();
  const { meta, method, section } = useMemo(
    () => value.registry.findMetaCall(value.callIndex),
    [value]
  );

  const isAbiCall = useMemo(() => {
    return section === 'contracts' && (method === 'instantiateWithCode' || method === 'instantiate' || method ==='call')
  }, [value])

  const getAbiCall = useCallback(
    async () => {
      console.log(method, section)
      // for contracts, we decode the actual event
      if (section === 'contracts' && (method === 'instantiateWithCode' || method === 'instantiate'  || method ==='call')) {
        // see if we have info for this contract
        // console.log(value.args[3])
        const data = value.args[3]


        try {
          let decoded: any
          if(method === 'instantiateWithCode') {
            const code = value.args[2]
            const hash = blake2AsU8a(code.toHex())
            const abi = getContractAbiByHash(u8aToHex(hash))
            decoded = abi?.decodeConstructor(value.args[3].toU8a());
          }

          if(method === 'instantiate') {
            const hash = value.args[2].toHex()
            const abi = getContractAbiByHash(hash)
            decoded = abi?.decodeConstructor(value.args[3].toU8a());
          }

          if(method === 'call') {
            const accountId = value.args[0]
            
            let abi: Abi | null;
        
            abi = getContractAbi(accountId.toString()) 

            if(!abi) {
              const data = await api.query.contracts.contractInfoOf(accountId.toString());
              if(!data.isNone && data.unwrap().isAlive) {
                abi = getContractAbiByHash(data.unwrap().asAlive.codeHash.toHex());
              }
            }

            decoded = abi?.decodeMessage(value.args[3].toU8a());
          }

         


          
          if (decoded) {
            
            setAbiCall({
              ...decoded,
              values: decoded.args.map((value: any) => ({ isValid: true, value }))
            })

            return 
          }
          
        } catch (error) {
          // ABI mismatch?
          console.error(error);
        }
      }

      setAbiCall(null);
    },
    [value, api, method, section]
  );

  console.log(abiCall)
  
  useEffect(() => {
    getAbiCall()
  }, [getAbiCall]);

  return (
    <div className={`ui--Extrinsic ${className}`}>
      <Params
        isDisabled
        onError={onError}
        params={params}
        registry={value.registry}
        values={values}
        withBorder={withBorder}
      >
        {isAbiCall ? abiCall ? (
          <>
            <Input
              isDisabled
              label={t<string>('contract message')}
              value={abiCall.message.identifier}
            />
            <Params
              isDisabled
              isContractParam={true}
              params={abiCall.message.args}
              values={abiCall.values}
            />
          </>
        ): <LinkCodes>
          <NavLink to="/contracts/codes">upload contract bundle</NavLink>
        </LinkCodes> : null}
      </Params>
      {children}
      <div className='ui--Extrinsic--toplevel'>
        {signature && (
          <Static
            className='hash'
            label={labelSignature || t<string>('signature {{type}}', { replace: { type: signatureType ? `(${signatureType})` : '' } })}
            withCopy
          >
            {signature}
          </Static>
        )}
        {hash && (
          <Static
            className='hash'
            label={labelHash || t<string>('extrinsic hash')}
            withCopy
          >
            {hash}
          </Static>
        )}
        {mortality && (
          <Static
            className='mortality'
            label={t<string>('lifetime')}
          >
            {mortality}
          </Static>
        )}
        {tip?.gtn(0) && (
          <Static
            className='tip'
            label={t<string>('tip')}
          >
            <FormatBalance value={tip} />
          </Static>
        )}
      </div>
    </div>
  );
}

export default React.memo(styled(Call)`
  .hash .ui--Static {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: unset;
    word-wrap: unset;
  }

  .ui--Extrinsic--toplevel {
    margin-top: 0.75rem;

    .ui--Labelled {
      padding-left: 0;

      > label {
        left: 1.55rem !important;
      }
    }
  }
`);
