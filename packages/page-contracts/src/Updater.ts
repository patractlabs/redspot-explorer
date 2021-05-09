import { useEffect } from "react";
import { useLoadAbi } from "./hooks/useLoadAbi";
import { keyring } from "@polkadot/ui-keyring";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aEq } from "@polkadot/util";
import { Keyring } from "@polkadot/keyring";
import { useApi } from "@polkadot/react-hooks";
import { settings } from "@polkadot/ui-settings";
import { io } from "socket.io-client";
import { web3FromSource } from "@polkadot/extension-dapp";
import store from "store";
import { getSpecAlias, getSpecTypes, getSpecHasher } from "@polkadot/types-known";

export const Updater = () => {
  const { isApiReady, api } = useApi();

  useLoadAbi();

  useEffect(() => {
    if (isApiReady) {
      try {
        const accounts = keyring.getAccounts();

        const config = (window as any).redspotConfig;

        if (!config) return;

        const currentNetwork = Object.keys(config.networks).find(name => {
          return config.networks[name].endpoint === settings.apiUrl;
        });

        const currentNetworkConfig = currentNetwork && config.networks[currentNetwork];

        if (currentNetworkConfig) {
          try {
            if (
              currentNetworkConfig.types ||
              currentNetworkConfig.typesAlias ||
              currentNetworkConfig.typesBundle ||
              currentNetworkConfig.typesChain ||
              currentNetworkConfig.typesSpec
            ) {
              api.registry.setKnownTypes({
                types: currentNetworkConfig.types,
                typesAlias: currentNetworkConfig.typesAlias,
                typesBundle: currentNetworkConfig.typesBundle,
                typesChain: currentNetworkConfig.typesChain,
                typesSpec: currentNetworkConfig.typesSpec
              });

              api.registry.register(
                getSpecTypes(
                  api.registry,
                  api.runtimeChain,
                  api.runtimeVersion.specName,
                  api.runtimeVersion.specVersion
                )
              );
              api.registry.setHasher(getSpecHasher(api.registry, api.runtimeChain, api.runtimeVersion.specName));

              store.set("types", api.registry.knownTypes.types);

              // for bundled types, pull through the aliases defined
              if (api.registry.knownTypes.typesBundle) {
                api.registry.knownTypes.typesAlias = getSpecAlias(
                  api.registry,
                  api.runtimeChain,
                  api.runtimeVersion.specName
                );
              }
            }
          } catch (error) {
            console.error(error);
          }

          for (const suri of currentNetworkConfig.accounts) {
            const pair = new Keyring({
              type: "sr25519"
            }).addFromUri(suri, {
              genesisHash: api.genesisHash,
              source: "redspot"
            });

            const existingAccount = accounts.find(({ address }) =>
              u8aEq(decodeAddress(address), decodeAddress(pair.address))
            );

            if (!existingAccount) {
              keyring.addPair(pair, "");
            }
          }
        }
      } catch {}
    }
  }, [isApiReady, api]);

  useEffect(() => {
    const client = io("http://127.0.0.1:8011");

    client.on("reconnect", () => {
      console.log("reconnect");
      client.emit("explorer");
    });

    client.on("connect", () => {
      console.log("connect");
      client.emit("explorer");
    });

    client.on("signPayload", async (payload, cb) => {
      try {
        const pair = keyring.getPair(payload.address);
        const isInjected = pair.meta.source && pair.meta.isInjected;

        if (isInjected) {
          const signer = await web3FromSource(pair.meta.source as string)
            .catch((): null => null)
            .then(injected => injected?.signer);

          if (!signer) {
            cb(new Error("not found"), null);
            return;
          }

          const result = signer.signPayload && (await signer.signPayload(payload));

          cb(null, result);
        } else {
          //@ts-ignore
          const result = await api.signPayload(payload);
          cb(null, result);
        }
      } catch (error) {
        cb(error, null);
      }
    });

    return () => {
      client.close();
    };
  }, [api]);

  return null;
};
