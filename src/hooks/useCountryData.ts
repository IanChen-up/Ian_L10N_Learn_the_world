import { useEffect, useState } from "react";
import { loadCountries } from "@/services/countryData";

type Status = "loading" | "ready" | "error";

export function useCountryData() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let alive = true;
    loadCountries()
      .then(() => alive && setStatus("ready"))
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  return status;
}
