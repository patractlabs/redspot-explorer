// Copyright 2017-2021 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { LinkOption } from '@polkadot/apps-config/settings/types';
import type { Group } from './types';

// ok, this seems to be an eslint bug, this _is_ a package import
/* eslint-disable-next-line node/no-deprecated-api */
import punycode from 'punycode';
import React, { useCallback, useMemo, useState } from 'react';
import store from 'store';
import styled from 'styled-components';

import { createWsEndpoints, CUSTOM_ENDPOINT_KEY } from '@polkadot/apps-config';
import { Button, Input, Sidebar } from '@polkadot/react-components';
import { settings } from '@polkadot/ui-settings';
import { isAscii } from '@polkadot/util';

import { useTranslation } from '../translate';
import GroupDisplay from './Group';

interface Props {
  className?: string;
  offset?: number | string;
  onClose: () => void;
}

interface UrlState {
  apiUrl: string;
  groupIndex: number;
  hasUrlChanged: boolean;
  isUrlValid: boolean;
}

const STORAGE_AFFINITIES = 'network:affinities';

function isValidUrl (url: string): boolean {
  return (
    // some random length... we probably want to parse via some lib
    (url.length >= 7) &&
    // check that it starts with a valid ws identifier
    (url.startsWith('ws://') || url.startsWith('wss://'))
  );
}

function combineEndpoints (endpoints: LinkOption[]): Group[] {
  return endpoints.reduce((result: Group[], e): Group[] => {
    if (e.isHeader) {
      result.push({ header: e.text, isDevelopment: e.isDevelopment, networks: [] });
    } else {
      const prev = result[result.length - 1];
      const prov = { name: e.textBy, url: e.value as string };

      if (prev.networks[prev.networks.length - 1] && e.text === prev.networks[prev.networks.length - 1].name) {
        prev.networks[prev.networks.length - 1].providers.push(prov);
      } else {
        prev.networks.push({
          icon: e.info,
          isChild: e.isChild,
          name: e.text as string,
          providers: [prov]
        });
      }
    }

    return result;
  }, []);
}

function getCustomEndpoints (): string[] {
  try {
    const storedAsset = localStorage.getItem(CUSTOM_ENDPOINT_KEY);

    if (storedAsset) {
      return JSON.parse(storedAsset) as string[];
    }
  } catch (e) {
    console.error(e);
    // ignore error
  }

  return [];
}

function extractUrlState (apiUrl: string, groups: Group[]): UrlState {
  let groupIndex = groups.findIndex(({ networks }) =>
    networks.some(({ providers }) =>
      providers.some(({ url }) => url === apiUrl)
    )
  );

  if (groupIndex === -1) {
    groupIndex = groups.findIndex(({ isDevelopment }) => isDevelopment);
  }

  return {
    apiUrl,
    groupIndex,
    hasUrlChanged: settings.get().apiUrl !== apiUrl,
    isUrlValid: isValidUrl(apiUrl)
  };
}

function loadAffinities (groups: Group[]): Record<string, string> {
  return Object
    .entries<string>(store.get(STORAGE_AFFINITIES) || {})
    .filter(([network, apiUrl]) =>
      groups.some(({ networks }) =>
        networks.some(({ name, providers }) =>
          name === network && providers.some(({ url }) => url === apiUrl)
        )
      )
    )
    .reduce((result: Record<string, string>, [network, apiUrl]): Record<string, string> => ({
      ...result,
      [network]: apiUrl
    }), {});
}

function Endpoints ({ className = '', offset, onClose }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const linkOptions = createWsEndpoints(t);
  const [groups, setGroups] = useState(() => combineEndpoints(linkOptions));
  const [{ apiUrl, groupIndex, hasUrlChanged, isUrlValid }, setApiUrl] = useState<UrlState>(() => extractUrlState(settings.get().apiUrl, groups));
  const [storedCustomEndpoints, setStoredCustomEndpoints] = useState<string[]>(() => getCustomEndpoints());
  const [affinities, setAffinities] = useState(() => loadAffinities(groups));

  const isKnownUrl = useMemo(() => {
    let result = false;

    linkOptions.some((endpoint) => {
      if (endpoint.value === apiUrl) {
        result = true;

        return true;
      }

      return false;
    });

    return result;
  }, [apiUrl, linkOptions]);

  const isSavedCustomEndpoint = useMemo(() => {
    let result = false;

    storedCustomEndpoints.some((endpoint) => {
      if (endpoint === apiUrl) {
        result = true;

        return true;
      }

      return false;
    });

    return result;
  }, [apiUrl, storedCustomEndpoints]);

  const _changeGroup = useCallback(
    (groupIndex: number) => setApiUrl((state) => ({ ...state, groupIndex })),
    []
  );

  const _saveApiEndpoint = () => {
    try {
      localStorage.setItem(CUSTOM_ENDPOINT_KEY, JSON.stringify([...storedCustomEndpoints, apiUrl]));
      _onApply();
    } catch (e) {
      console.error(e);
      // ignore error
    }
  };

  const _removeApiEndpoint = () => {
    if (!isSavedCustomEndpoint) return;

    const newStoredCurstomEndpoints = storedCustomEndpoints.filter((url) => url !== apiUrl);

    try {
      localStorage.setItem(CUSTOM_ENDPOINT_KEY, JSON.stringify(newStoredCurstomEndpoints));
      // setGroups(combineEndpoints(createWsEndpoints(t)));
      setStoredCustomEndpoints(getCustomEndpoints());
    } catch (e) {
      console.error(e);
      // ignore error
    }
  };

  const _setApiUrl = useCallback(
    (network: string, apiUrl: string): void => {
      setAffinities((affinities): Record<string, string> => {
        const newValue = { ...affinities, [network]: apiUrl };

        store.set(STORAGE_AFFINITIES, newValue);

        return newValue;
      });
      setApiUrl(extractUrlState(apiUrl, groups));
    },
    [groups]
  );

  const _onChangeCustom = useCallback(
    (apiUrl: string): void => {
      if (!isAscii(apiUrl)) {
        apiUrl = punycode.toASCII(apiUrl);
      }

      setApiUrl(extractUrlState(apiUrl, groups));
    },
    [groups]
  );

  const _onApply = useCallback(
    (): void => {
      settings.set({ ...(settings.get()), apiUrl });

      window.location.assign(`${window.location.origin}${window.location.pathname}?rpc=${encodeURIComponent(apiUrl)}${window.location.hash}`);
      // window.location.reload();

      onClose();
    },
    [apiUrl, onClose]
  );
  
  const redspotProviders = useMemo(() => {
    return groups.find(({ header}) => header === 'Redspot')?.networks.find(({ name }) => name === 'Redspot Network')?.providers || []
  }, [groups])

  // const isSelected = useMemo(
  //   () => redspotProviders.some(({ url }) => url === apiUrl),
  //   [apiUrl, redspotProviders]
  // );


  return (
    <Sidebar
      button={
        <Button
          icon='sync'
          isDisabled={!(hasUrlChanged && isUrlValid)}
          label={t<string>('Switch')}
          onClick={_onApply}
        />
      }
      className={className}
      offset={offset}
      onClose={onClose}
      position='left'
    >
      {/* {groups.map((group, index): React.ReactNode => (
        <GroupDisplay
          affinities={affinities}
          apiUrl={apiUrl}
          index={index}
          isSelected={groupIndex === index}
          key={index}
          setApiUrl={_setApiUrl}
          setGroup={_changeGroup}
          value={group}
        >
          {group.isDevelopment && (
            <div className='endpointCustomWrapper'>
              <Input
                className='endpointCustom'
                isError={!isUrlValid}
                isFull
                label={t<string>('custom endpoint')}
                onChange={_onChangeCustom}
                value={apiUrl}
              />
              {isSavedCustomEndpoint
                ? <Button
                  className='customButton'
                  icon='trash-alt'
                  onClick={_removeApiEndpoint}
                />
                : <Button
                  className='customButton'
                  icon='save'
                  isDisabled={!isUrlValid || isKnownUrl}
                  onClick={_saveApiEndpoint}
                />
              }
            </div>
          )}
        </GroupDisplay>
      ))} */}
      <div className="menuItems">
      {
        redspotProviders.map(({name, url}) => {
          return <div className={`ui--MenuItem ${url === apiUrl ? 'isActive': ''}`}>
            <a onClick={() => _setApiUrl(name, url)}>
              {name}
              <div className="ui--MenuItemUrl">{url}</div>
            </a>
          </div>
        })
      }
      </div> 
      <div className='endpointCustomWrapper'>
        <Input
          className='endpointCustom'
          isError={!isUrlValid}
          isFull
          label={t<string>('endpoint')}
          onChange={_onChangeCustom}
          value={apiUrl}
        />
        {isSavedCustomEndpoint
          ? <Button
            className='customButton'
            icon='trash-alt'
            onClick={_removeApiEndpoint}
          />
          : <Button
            className='customButton'
            icon='save'
            isDisabled={!isUrlValid || isKnownUrl}
            onClick={_saveApiEndpoint}
          />
        }
      </div>
    </Sidebar>
  );
}

export default React.memo(styled(Endpoints)`
  color: var(--color-text);
  padding-top: 3.5rem;

  .customButton {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .endpointCustom {
    input {
      padding-right: 4rem;
    }
  }

  .endpointCustomWrapper {
    position: relative;
  }

  .menuItems {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  .ui--MenuItem {
    &.ui--MenuItem {
      margin-bottom: 1rem;
    }


    font-size: 1rem;
    font-weight: 400;
    line-height: 1.214rem;
    border-radius: 0.15rem;

    a {
      padding: 0.857rem 0.857em 0.857rem 1rem;
      line-height: 1.214rem;
      border-radius: 0.25rem;
    }

    &.isActive {
      font-size: 1.15rem;
      font-weight: 400;
      color: var(--color-text);

      a {
        background-color: #991a51;
      }
    }

    &.isActive {
      border-radius: 0.15rem 0.15rem 0 0;

      a {
        /* padding: 0.857rem 1.429rem 0.857rem; */
        cursor: default;
      }
    }

    a {
      color: inherit !important;
      display: block;
      padding: 0.5rem 1.15rem 0.57rem;
      text-decoration: none;
      font-weight: 400;
      font-size: 1rem;
      line-height: 1.5rem;
    }

    &.isActive .ui--MenuItemUrl {
      color: #ffffff;
    }
  }

  .network {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  .ui--MenuItemUrl {
    margin-top: 0;
    margin-bottom: 0;
    color: #97e1f1;
  }

  .networkItem {
    border-radius: 0.25rem;
    cursor: pointer;
    line-height: 1;
    padding: 0.75rem 1rem;
    position: relative;
    text-transform: uppercase;

    &:hover {
      background: var(--bg-table);
    }

    .ui--Icon {
      margin-right: 0.5rem;
    }
  }
`);
