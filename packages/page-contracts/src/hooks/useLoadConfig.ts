import axios from "axios";
import { useCallback, useEffect } from "react";
import { useApi } from "@polkadot/react-hooks";
import { useInterval } from "./useInterval";
import store from "../store";

export const useLoadAbi = () => {
  const { api } = useApi();

  const loadAbi = useCallback(async () => {
    await api.isReady;
    try {
      const res = await axios.get("http://127.0.0.1:8011/artifacts/all");
      if (Array.isArray(res.data)) {
        const result = await Promise.all(
          res.data.map(path => {
            return axios.get(`http://127.0.0.1:8011/artifacts/${path}`).then(res => res.data);
          })
        );

        for (const abi of result) {

          await store.saveCode(abi.source.hash, {
            abi,
            name: `${abi.contract.name}-${abi.source.hash.slice(2, 8)}`,
            tags: []
          }, true);
        }
      }
    } catch (error) {
      return null;
    }
  }, []);

  useInterval(loadAbi, 3000, true);
};
