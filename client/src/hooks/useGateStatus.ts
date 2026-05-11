import { useEffect, useState } from "react";
import { isGateClosed } from "../lib/gate";

export function useGateStatus() {
  const [gateClosed, setGateClosed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const closed = await isGateClosed();

      setGateClosed(closed);
      setLoading(false);
    };

    load();
  }, []);

  return {
    gateClosed,
    loading,
  };
}