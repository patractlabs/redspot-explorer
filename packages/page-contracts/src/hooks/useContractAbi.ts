import { useEffect } from "react";
import store from "../store";

export const useContractAbi = () => {
  useEffect((): void => {
    // const triggerUpdate = (): void => {
    //   setUpdated(Date.now());
    //   setAllCodes(store.getAllCode());
    // };

    // store.on("new-code", triggerUpdate);
    // store.on("removed-code", triggerUpdate);
    store
      .loadAll()
      .then((data) => {
        console.log(store.getAllCode())
      })
      .catch((): void => {
        // noop, handled internally
      });
  }, []);
};
