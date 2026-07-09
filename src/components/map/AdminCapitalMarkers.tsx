import { useEffect, useState } from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { loadAdminCapitals, type AdminCapitalsMap } from "@/services/adminCapitals";

/** 在地形图（leaflet）上叠加"悬停/选中国家"的一级行政区首府打点。 */
export default function AdminCapitalMarkers({ activeIso }: { activeIso: string | null }) {
  const { locale } = useLocaleStore();
  const [data, setData] = useState<AdminCapitalsMap>({});

  useEffect(() => {
    let alive = true;
    loadAdminCapitals().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);

  if (!activeIso) return null;
  const caps = data[activeIso];
  if (!caps || !caps.length) return null;

  return (
    <>
      {caps.map((c, i) => (
        <CircleMarker
          key={i}
          center={c.latlng}
          radius={3}
          pathOptions={{
            color: "#0ea5e9",
            weight: 1,
            fillColor: "#38bdf8",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip direction="top" offset={[0, -2]}>
            <b>{localized(c.name, locale)}</b>
            <br />
            {localized(c.region, locale)}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
