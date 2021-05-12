// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { useLocation } from "react-router";

interface Props {
  path: string;
  children: React.ReactNode;
  isHide?: boolean;
}

function Display({ path, children, isHide }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();

  if (isHide) {
    return path === pathname ? (
      <div style={{ display: path === pathname ? "block" : "none" }}>{children}</div>
    ) : (
      <div></div>
    );
  }
  return <div style={{ display: path === pathname ? "block" : "none" }}>{children}</div>;
}

export default React.memo(Display);
