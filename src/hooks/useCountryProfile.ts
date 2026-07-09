import { useEffect, useState } from "react";
import { loadProfile } from "@/services/profiles";
import type { CountryProfile } from "@/types/profile";

/** 懒加载国家档案；随 iso 变化重新拉取。 */
export function useCountryProfile(iso: string | null | undefined) {
  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!iso) {
      setProfile(null);
      return;
    }
    let alive = true;
    setLoading(true);
    loadProfile(iso)
      .then((p) => alive && setProfile(p))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [iso]);

  return { profile, loading };
}
