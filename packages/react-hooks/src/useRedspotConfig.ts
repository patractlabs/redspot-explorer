import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { settings } from "@polkadot/ui-settings";

export const useRedspotConfig = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8011/redspot-config");
      if (res.data) {
        (window as any).redspotConfig = res.data;
      }
    } catch (error) {
      return null;
    } finally {
      setIsLoading(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, []);

  return isLoading;
};
