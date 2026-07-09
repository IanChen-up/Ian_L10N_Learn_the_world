import type { LocalizedText } from "@/types/country";

/** 一个极地科考站：名称 + 经纬度 + 简介 + 所属类别。 */
export interface PolarStation {
  id: string;
  name: LocalizedText;
  /** [lat, lng] */
  latlng: [number, number];
  /** 归属：中国站以突出显示 */
  cn: boolean;
  note: LocalizedText;
  /** 南极 / 北极 */
  pole: "antarctic" | "arctic";
}

/**
 * 极地科考站标注（三视角地图通用）。
 * 以中国科考站为主，附少量国际知名站点作参照，均为公开地理常识。
 */
export const POLAR_STATIONS: PolarStation[] = [
  // —— 中国南极科考站 ——
  {
    id: "great-wall",
    name: { zh: "长城站", en: "Great Wall Station" },
    latlng: [-62.22, -58.96],
    cn: true,
    pole: "antarctic",
    note: { zh: "中国第一个南极考察站（1985 年建成），位于乔治王岛。", en: "China's first Antarctic station (1985), on King George Island." },
  },
  {
    id: "zhongshan",
    name: { zh: "中山站", en: "Zhongshan Station" },
    latlng: [-69.37, 76.37],
    cn: true,
    pole: "antarctic",
    note: { zh: "1989 年建成，位于东南极拉斯曼丘陵，是重要的越冬考察站。", en: "Built 1989 in the Larsemann Hills, East Antarctica; a key wintering base." },
  },
  {
    id: "kunlun",
    name: { zh: "昆仑站", en: "Kunlun Station" },
    latlng: [-80.42, 77.12],
    cn: true,
    pole: "antarctic",
    note: { zh: "2009 年建成，坐落于南极内陆冰盖最高点冰穹 A 附近。", en: "Built 2009 near Dome A, the highest point of the Antarctic inland ice sheet." },
  },
  {
    id: "taishan",
    name: { zh: "泰山站", en: "Taishan Station" },
    latlng: [-73.86, 76.97],
    cn: true,
    pole: "antarctic",
    note: { zh: "2014 年建成，是中山站与昆仑站之间的中继考察站。", en: "Built 2014 as a relay base between Zhongshan and Kunlun stations." },
  },
  {
    id: "qinling",
    name: { zh: "秦岭站", en: "Qinling Station" },
    latlng: [-74.9, 163.9],
    cn: true,
    pole: "antarctic",
    note: { zh: "2024 年建成，位于罗斯海区域，是中国第五个南极考察站。", en: "Built 2024 by the Ross Sea; China's fifth Antarctic station." },
  },
  // —— 中国北极科考站 ——
  {
    id: "yellow-river",
    name: { zh: "黄河站", en: "Yellow River Station" },
    latlng: [78.92, 11.93],
    cn: true,
    pole: "arctic",
    note: { zh: "2004 年建于挪威斯瓦尔巴群岛新奥尔松，中国首个北极科考站。", en: "China's first Arctic station (2004), at Ny-Ålesund, Svalbard, Norway." },
  },
  // —— 国际知名站（参照） ——
  {
    id: "amundsen-scott",
    name: { zh: "阿蒙森-斯科特站", en: "Amundsen–Scott Station" },
    latlng: [-90, 0],
    cn: false,
    pole: "antarctic",
    note: { zh: "美国科考站，坐落于地理南极点。", en: "US station located exactly at the geographic South Pole." },
  },
  {
    id: "vostok",
    name: { zh: "东方站", en: "Vostok Station" },
    latlng: [-78.46, 106.84],
    cn: false,
    pole: "antarctic",
    note: { zh: "俄罗斯站，曾记录地表最低气温 −89.2°C。", en: "Russian station; recorded Earth's lowest surface temperature, −89.2°C." },
  },
];
