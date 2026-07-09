import type { LocalizedText } from "@/types/country";

export interface Insights {
  measurement: Record<string, string[]>;
  female: Record<string, number>;
  sexRatio: Record<string, number>;
  visaFree: Record<string, number>;
  internetPct: Record<string, number>;
  lifeExpectancy: Record<string, number>;
  density: Record<string, number>;
  nobel: Record<string, number>;
  fortune500: Record<string, number>;
  worldCup: Record<string, { titles: number; appearances: number; titleYears?: number[] }>;
  peaceIndex: Record<string, number>;
  mostPeaceful: string[];
  ww1: { allied: string[]; central: string[] };
  ww2: { allied: string[]; axis: string[] };
}

const BASE = import.meta.env.BASE_URL || "/";
let cache: Insights | null = null;
let inflight: Promise<Insights | null> | null = null;

export async function loadInsights(): Promise<Insights | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${BASE}data/insights.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: Insights | null) => {
      cache = d;
      return d;
    })
    .catch(() => null);
  return inflight;
}

/** 一个"有趣指标 / 历史"取值：驱动地图高亮与左侧列表。 */
export interface InsightValue {
  /** 唯一 key，如 "nobel" / "ww2.allied" */
  key: string;
  label: LocalizedText;
  /** 命中的国家 iso2 集合 */
  countries: string[];
  /** 可选：每国数值（用于加深显示与徽标），如诺贝尔次数 */
  values?: Record<string, number>;
  /** 图例颜色 css 变量名 */
  cssVar: string;
  emoji: string;
  /** 数值型说明单位（如 "次"），可选 */
  unit?: LocalizedText;
  /**
   * 发散型指标：以 midpoint 为中点向两侧着色。
   * lowCssVar/highCssVar 分别对应 <中点 / >中点 的颜色变量。
   */
  diverging?: { midpoint: number; lowCssVar: string; highCssVar: string; lowLabel: LocalizedText; highLabel: LocalizedText };
  /** 可选：每国附加年份列表（如世界杯夺冠年份），供列表展示 */
  years?: Record<string, number[]>;
}

export interface InsightGroup {
  key: string;
  title: LocalizedText;
  emoji: string;
  items: InsightValue[];
}

const t9 = (
  zh: string,
  en: string,
  ja: string,
  ko: string,
  ar: string,
  fr: string,
  ru: string,
  es: string,
  zhHant = zh,
): LocalizedText => ({ zh, "zh-Hant": zhHant, en, ja, ko, ar, fr, ru, es });

/** 由 insights 数据构造左侧分类（有趣指标 + 历史·世界大战）。 */
export function buildInsightGroups(ins: Insights): InsightGroup[] {
  const wcTitles: Record<string, number> = {};
  const wcApps: Record<string, number> = {};
  const wcYears: Record<string, number[]> = {};
  for (const [iso, v] of Object.entries(ins.worldCup)) {
    if (v.titles > 0) wcTitles[iso] = v.titles;
    if (v.titleYears && v.titleYears.length) wcYears[iso] = v.titleYears;
    wcApps[iso] = v.appearances;
  }

  const fun: InsightGroup = {
    key: "fun",
    emoji: "✨",
    title: t9("有趣的指标", "Fun metrics", "おもしろ指標", "재미있는 지표", "مؤشرات ممتعة", "Indicateurs ludiques", "Интересные показатели", "Indicadores curiosos", "有趣的指標"),
    items: [
      {
        key: "measurement.imperial",
        label: t9("使用英制的国家", "Imperial-system countries", "英米単位系を使う国", "야드파운드법을 사용하는 국가", "دول تستخدم النظام الإمبراطوري", "Pays utilisant le système impérial", "Страны с имперской системой мер", "Países que usan el sistema imperial", "使用英制的國家"),
        countries: [...(ins.measurement.imperial || []), ...(ins.measurement.mixed || [])],
        cssVar: "--dim-currency",
        emoji: "📏",
      },
      {
        key: "sexRatio",
        label: t9("男女比例", "Sex ratio", "男女比", "성비", "نسبة الجنس", "Ratio hommes-femmes", "Соотношение полов", "Proporción por sexo"),
        countries: Object.keys(ins.sexRatio || {}),
        values: ins.sexRatio,
        cssVar: "--dim-male",
        emoji: "⚖️",
        unit: t9("男/百女", "M per 100F", "男性/女性100人", "남성/여성 100명", "ذكر/100 امرأة", "H/100 F", "муж./100 жен.", "h/100 mujeres", "男/百女"),
        diverging: {
          midpoint: 100,
          lowCssVar: "--dim-female",
          highCssVar: "--dim-male",
          lowLabel: t9("女性偏多", "More women", "女性が多い", "여성이 더 많음", "نساء أكثر", "Plus de femmes", "Больше женщин", "Más mujeres", "女性偏多"),
          highLabel: t9("男性偏多", "More men", "男性が多い", "남성이 더 많음", "رجال أكثر", "Plus d’hommes", "Больше мужчин", "Más hombres", "男性偏多"),
        },
      },
      {
        key: "lifeExpectancy",
        label: t9("平均预期寿命", "Life expectancy", "平均寿命", "기대수명", "متوسط العمر المتوقع", "Espérance de vie", "Ожидаемая продолжительность жизни", "Esperanza de vida", "平均預期壽命"),
        countries: Object.keys(ins.lifeExpectancy || {}),
        values: ins.lifeExpectancy,
        cssVar: "--dim-capital",
        emoji: "🫀",
        unit: t9("岁", "yrs", "歳", "세", "سنة", "ans", "лет", "años", "歲"),
      },
      {
        key: "density",
        label: t9("人口密度", "Population density", "人口密度", "인구 밀도", "الكثافة السكانية", "Densité de population", "Плотность населения", "Densidad de población", "人口密度"),
        countries: Object.keys(ins.density || {}),
        values: ins.density,
        cssVar: "--dim-religion",
        emoji: "🏙️",
        unit: t9("人/km²", "/km²", "人/km²", "명/km²", "شخص/كم²", "hab./km²", "чел./км²", "pers./km²", "人/km²"),
      },
      {
        key: "visaFree",
        label: t9("护照免签目的地数", "Passport visa-free destinations", "パスポートのビザなし渡航先数", "여권 무비자 목적지 수", "وجهات جواز السفر بلا تأشيرة", "Destinations sans visa du passeport", "Безвизовые направления по паспорту", "Destinos sin visado del pasaporte", "護照免簽目的地數"),
        countries: Object.keys(ins.visaFree || {}),
        values: ins.visaFree,
        cssVar: "--dim-capital",
        emoji: "🛂",
        unit: t9("个", "", "件", "곳", "وجهة", "", "", "", "個"),
      },
      {
        key: "internetPct",
        label: t9("互联网普及率", "Internet penetration", "インターネット普及率", "인터넷 보급률", "انتشار الإنترنت", "Pénétration d’Internet", "Проникновение интернета", "Penetración de Internet", "網際網路普及率"),
        countries: Object.keys(ins.internetPct || {}),
        values: ins.internetPct,
        cssVar: "--dim-language",
        emoji: "🌐",
        unit: t9("%", "%", "%", "%", "%", "%", "%", "%"),
      },
      {
        key: "mostPeaceful",
        label: t9("最和平的国家 (GPI)", "Most peaceful (GPI)", "最も平和な国 (GPI)", "가장 평화로운 국가 (GPI)", "الأكثر سلمًا (GPI)", "Les plus pacifiques (GPI)", "Самые мирные страны (GPI)", "Países más pacíficos (GPI)", "最和平的國家 (GPI)"),
        countries: ins.mostPeaceful,
        cssVar: "--dim-capital",
        emoji: "🕊️",
      },
      {
        key: "fortune500",
        label: t9("世界 500 强所在国", "Fortune Global 500 HQs", "Fortune Global 500 本社所在国", "Fortune Global 500 본사 소재국", "مقار Fortune Global 500", "Sièges du Fortune Global 500", "Штаб-квартиры Fortune Global 500", "Sedes de Fortune Global 500", "世界 500 強所在國"),
        countries: Object.keys(ins.fortune500),
        values: ins.fortune500,
        cssVar: "--dim-government",
        emoji: "🏢",
        unit: t9("家", "", "社", "개", "شركة", "", "", "", "家"),
      },
      {
        key: "nobel",
        label: t9("诺贝尔奖得主数", "Nobel laureates", "ノーベル賞受賞者数", "노벨상 수상자 수", "عدد الحاصلين على نوبل", "Lauréats du prix Nobel", "Лауреаты Нобелевской премии", "Premios Nobel", "諾貝爾獎得主數"),
        countries: Object.keys(ins.nobel),
        values: ins.nobel,
        cssVar: "--dim-holiday",
        emoji: "🏅",
        unit: t9("位", "", "人", "명", "فائز", "", "", "", "位"),
      },
      {
        key: "worldCup.titles",
        label: t9("世界杯夺冠国", "World Cup winners", "ワールドカップ優勝国", "월드컵 우승국", "الفائزون بكأس العالم", "Vainqueurs de la Coupe du monde", "Победители чемпионата мира", "Campeones de la Copa del Mundo", "世界盃奪冠國"),
        countries: Object.keys(wcTitles),
        values: wcTitles,
        years: wcYears,
        cssVar: "--dim-language",
        emoji: "🏆",
        unit: t9("次", "", "回", "회", "مرة", "", "", "", "次"),
      },
      {
        key: "worldCup.appearances",
        label: t9("世界杯参赛次数", "World Cup appearances", "ワールドカップ出場回数", "월드컵 출전 횟수", "مرات المشاركة في كأس العالم", "Participations à la Coupe du monde", "Участия в чемпионате мира", "Participaciones en la Copa del Mundo", "世界盃參賽次數"),
        countries: Object.keys(wcApps),
        values: wcApps,
        cssVar: "--dim-language",
        emoji: "⚽",
        unit: t9("次", "", "回", "회", "مرة", "", "", "", "次"),
      },
    ],
  };

  const history: InsightGroup = {
    key: "history",
    emoji: "🕰️",
    title: t9("历史 · 世界大战", "History · World Wars", "歴史 · 世界大戦", "역사 · 세계대전", "التاريخ · الحربان العالميتان", "Histoire · Guerres mondiales", "История · мировые войны", "Historia · Guerras mundiales", "歷史 · 世界大戰"),
    items: [
      {
        key: "ww2.allied",
        label: t9("二战·同盟国(反法西斯)", "WWII · Allied powers", "第二次世界大戦 · 連合国", "제2차 세계대전 · 연합국", "الحرب العالمية الثانية · الحلفاء", "Seconde Guerre mondiale · Alliés", "Вторая мировая · союзники", "Segunda Guerra Mundial · Aliados", "二戰·同盟國(反法西斯)"),
        countries: ins.ww2.allied,
        cssVar: "--dim-capital",
        emoji: "🕊️",
      },
      {
        key: "ww2.axis",
        label: t9("二战·轴心国", "WWII · Axis powers", "第二次世界大戦 · 枢軸国", "제2차 세계대전 · 추축국", "الحرب العالمية الثانية · دول المحور", "Seconde Guerre mondiale · Axe", "Вторая мировая · страны Оси", "Segunda Guerra Mundial · Eje", "二戰·軸心國"),
        countries: ins.ww2.axis,
        cssVar: "--dim-government",
        emoji: "⚔️",
      },
      {
        key: "ww1.allied",
        label: t9("一战·协约国", "WWI · Allied/Entente", "第一次世界大戦 · 連合国/協商国", "제1차 세계대전 · 연합국/협상국", "الحرب العالمية الأولى · الحلفاء/الوفاق", "Première Guerre mondiale · Alliés/Entente", "Первая мировая · Антанта", "Primera Guerra Mundial · Aliados/Entente", "一戰·協約國"),
        countries: ins.ww1.allied,
        cssVar: "--dim-language",
        emoji: "🕊️",
      },
      {
        key: "ww1.central",
        label: t9("一战·同盟国", "WWI · Central powers", "第一次世界大戦 · 中央同盟国", "제1차 세계대전 · 동맹국", "الحرب العالمية الأولى · القوى المركزية", "Première Guerre mondiale · Empires centraux", "Первая мировая · Центральные державы", "Primera Guerra Mundial · Potencias Centrales", "一戰·同盟國"),
        countries: ins.ww1.central,
        cssVar: "--dim-currency",
        emoji: "⚔️",
      },
    ],
  };

  return [fun, history];
}
