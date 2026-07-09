import { useEffect, useState } from "react";
import { Marker } from "react-simple-maps";
import { localized } from "@/services/countryData";
import { loadAdminCapitals, type AdminCapitalsMap } from "@/services/adminCapitals";

interface Props {
  locale: string;
  /** 当前应展示首府的国家（悬停或选中/聚焦的单个国家 iso2）。 */
  activeIso: string | null;
  onEnterTip: (label: string, x: number, y: number) => void;
  onLeaveTip: () => void;
}

/**
 * 平面 / 地球 SVG 地图上叠加"某一个国家"的一级行政区首府打点。
 * 仅在悬停某国或聚焦某国时显示该国首府，避免全球铺点造成的标签重叠。
 */
export default function AdminCapitalSvgMarkers({ locale, activeIso, onEnterTip, onLeaveTip }: Props) {
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
      {caps.map((c, i) => {
        const [lat, lng] = c.latlng;
        const name = localized(c.name, locale);
        return (
          <Marker
            key={i}
            coordinates={[lng, lat]}
            onMouseEnter={(e) => onEnterTip(`${name} · ${localized(c.region, locale)}`, e.clientX, e.clientY)}
            onMouseMove={(e) => onEnterTip(`${name} · ${localized(c.region, locale)}`, e.clientX, e.clientY)}
            onMouseLeave={onLeaveTip}
            style={{ default: { cursor: "help" }, hover: { cursor: "help" }, pressed: {} }}
          >
            <circle r={1.5} fill="hsl(199 89% 55%)" stroke="white" strokeWidth={0.45} />
            <text
              x={2.2}
              y={1.4}
              fontSize={2.8}
              fontWeight={600}
              fill="hsl(var(--text-primary))"
              stroke="hsl(var(--bg-base))"
              strokeWidth={0.6}
              paintOrder="stroke"
              style={{ pointerEvents: "none" }}
            >
              {name}
            </text>
          </Marker>
        );
      })}
    </>
  );
}
