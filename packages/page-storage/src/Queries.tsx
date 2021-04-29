// Copyright 2017-2021 @polkadot/app-storage authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryTypes } from './types';

import React from 'react';
import styled from 'styled-components';
import Query from './Query';

interface Props {
  onRemove: (id: number) => void;
  value?: QueryTypes[];
  className?: string;
}

function Queries ({ className="" ,onRemove, value }: Props): React.ReactElement<Props> | null {
  if (!value || !value.length) {
    return null;
  }

  return (
    <section className={`storage--Queries ${className}`}>
      {value.map((query): React.ReactNode =>
        <Query
          key={query.id}
          onRemove={onRemove}
          value={query}
        />
      )}
    </section>
  );
}

export default React.memo(styled(Queries)`
  margin-top: 2em;
`);
