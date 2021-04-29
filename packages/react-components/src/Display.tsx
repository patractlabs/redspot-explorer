// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useLocation } from "react-router";

interface Props {
  path: string;
  children: React.ReactNode;
}

function Display({ path, children }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();

  return <div style={{ display: path === pathname ? "block" : "none" }}>{children}</div>;
}

export default React.memo(Display);
