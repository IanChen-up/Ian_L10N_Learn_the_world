import { Marker } from "react-simple-maps";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { localized } from "@/services/countryData";
import { POLAR_STATIONS } from "@/data/polarStations";

interface Props {
  onEnterTip: (label: string, x: number, y: number) => void;
  onLeaveTip: () => void;
}

/** 在平面 / 地球 SVG 地图上标注南北极科考站（中国站高亮）。 */
export default function PolarMarkers({ onEnterTip, onLeaveTip }: Props) {
  const { locale } = useLocaleStore();

  return (
    <>
      {POLAR_STATIONS.map((s) => {
        const [lat, lng] = s.latlng;
        const color = s.cn ? "hsl(0 72% 52%)" : "hsl(var(--muted))";
        const label = `${s.cn ? "🇨🇳 " : "🔬 "}${localized(s.name, locale)} · ${localized(s.note, locale)}`;
        return (
          <Marker
            key={s.id}
            coordinates={[lng, lat]}
            onMouseEnter={(e) => onEnterTip(label, e.clientX, e.clientY)}
            onMouseMove={(e) => onEnterTip(label, e.clientX, e.clientY)}
            onMouseLeave={onLeaveTip}
            style={{ default: { cursor: "help" }, hover: { cursor: "help" }, pressed: {} }}
          >
            {/* 科考站三角旗标记 */}
            <g transform="translate(0,0)">
              <line x1={0} y1={0} x2={0} y2={-9} stroke={color} strokeWidth={0.7} />
              <path d="M0,-9 L6,-7 L0,-5 Z" fill={color} />
              <circle r={1.4} fill={color} stroke="white" strokeWidth={0.4} />
            </g>
          </Marker>
        );
      })}
    </>
  );
}
