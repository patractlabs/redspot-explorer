// Copyright 2017-2021 @polkadot/app-js authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AppProps as Props } from '@polkadot/react-components/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import Editor from './Editor';
import Output from './Output';
import { Button } from '@polkadot/react-components';
import { io, Socket } from "socket.io-client";
import { editor } from 'monaco-editor';
import {StatusContext} from '@polkadot/react-components';


function Console ({ basePath, className = '' }: Props): React.ReactElement<Props> {
  const [client, setClient] = useState<Socket>()
  const [logs, setLogs] = useState<React.ReactNode[]>()
  const [loading, setLoading] = useState(false)
  const [isCompile, setIsCompile] = useState(false)
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>()
  const { queueAction } = useContext(StatusContext);


  useEffect(() => {
    const client = io("http://127.0.0.1:8011");

    setClient(client)
  }, [])

  const run = () => {
    setLoading(true)
    setLogs([])
    try {
      client?.off("execute-result");

      if(!client?.connected || !editor) {
        setLogs([<div className="js--Log error">Error, can't connect to service</div>])
      } else {

        client.emit('execute', {
          code: editor.getValue(),
          network: (window as any).currentNetwork
        }, (result:any) => {
          let pid = result.pid

          setLoading(false)

          client.on('execute-result', (data) => {
            if(data.pid === pid && data.messages) {
              console.log(data.messages)
              setLogs(logs => logs?.concat(data.messages))
            }
          })
        })
      }
    } catch(error) {
      setLoading(false)
      console.log(error)
    }
  }

  const onCompile = (): void => {
    setIsCompile(true)
    try {
      client?.emit('compile', () => {
        setIsCompile(false)
        queueAction && queueAction({
          action: 'contract',
          message: 'compiled',
          status: 'queued'
        });
      })
    } catch(error) {
      queueAction && queueAction({
        action: 'contract',
        message: error?.message,
        status: 'error'
      });
      setIsCompile(false)
      console.error(error)
    }
  }

  return (
    <div className={className}>
      <div className="console-header">
        <Button
          icon='sign-in-alt'
          label={"Compile Contract"}
          onClick={onCompile}
          className="console-header-button"
          isBusy={isCompile}
        />
        <Button
          icon='play'
          label={"Run"}
          onClick={run}
          isBusy={loading}
        />
      </div>  
      <div className="console-main">
        <Editor editor={editor} setEditor={setEditor} />
        <Output logs={logs} />
      </div> 
    </div> 
  );
}

export default React.memo(styled(Console)`
  .console-header {
    display: flex;
    margin-bottom: 0.5rem;
  }

  .console-header-button {
    margin-right: 1rem;
  }

  .console-main {
    display: flex;
  }
`);
