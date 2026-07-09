import { useEffect, useState } from "react";

/** 每分钟刷新一次的计时器，用于展示各国当地实时时间。 */
export function useNowTick(intervalMs = 30000): number {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
