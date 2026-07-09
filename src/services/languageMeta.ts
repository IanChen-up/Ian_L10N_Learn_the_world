import type { LanguageMetaMap, LanguageMeta, LocalizedText } from "@/types/country";

const BASE = import.meta.env.BASE_URL || "/";
let cache: LanguageMetaMap | null = null;
let inflight: Promise<LanguageMetaMap> | null = null;

const meta = (
  ja: string,
  ko: string,
  ar: string,
  fr: string,
  ru: string,
  es: string,
  zhHant?: string,
): Partial<LocalizedText> => ({ ja, ko, ar, fr, ru, es, ...(zhHant ? { "zh-Hant": zhHant } : {}) });

const META_I18N: Record<string, Partial<LocalizedText>> = {
  "印欧语系·斯拉夫语族": meta("インド・ヨーロッパ語族·スラヴ語派", "인도유럽어족·슬라브어파", "الهندو-أوروبية · السلافية", "Indo-européenne · slave", "Индоевропейская · славянская", "Indoeuropea · eslava", "印歐語系·斯拉夫語族"),
  "尼日尔-刚果语系·班图语族": meta("ニジェール・コンゴ語族·バントゥー語派", "니제르콩고어족·반투어군", "النيجر-الكونغو · البانتو", "Niger-Congo · bantoue", "Нигеро-конголезская · банту", "Níger-Congo · bantú", "尼日爾-剛果語系·班圖語族"),
  "印欧语系·日耳曼语族": meta("インド・ヨーロッパ語族·ゲルマン語派", "인도유럽어족·게르만어파", "الهندو-أوروبية · الجرمانية", "Indo-européenne · germanique", "Индоевропейская · германская", "Indoeuropea · germánica", "印歐語系·日耳曼語族"),
  "印欧语系·印度-雅利安语族": meta("インド・ヨーロッパ語族·インド・アーリア語派", "인도유럽어족·인도아리아어파", "الهندو-أوروبية · الهندية الآرية", "Indo-européenne · indo-aryenne", "Индоевропейская · индоарийская", "Indoeuropea · indoaria", "印歐語系·印度-雅利安語族"),
  "印欧语系·罗曼语族": meta("インド・ヨーロッパ語族·ロマンス語派", "인도유럽어족·로망스어파", "الهندو-أوروبية · الرومانسية", "Indo-européenne · romane", "Индоевропейская · романская", "Indoeuropea · romance", "印歐語系·羅曼語族"),
  "突厥语系": meta("テュルク語族", "튀르크어족", "اللغات التركية", "Langues turciques", "Тюркская семья", "Lenguas túrquicas", "突厥語系"),
  "南岛语系": meta("オーストロネシア語族", "오스트로네시아어족", "الأسترونيزية", "Austronésienne", "Австронезийская семья", "Austronesia", "南島語系"),
  "亚非语系·闪米特语族": meta("アフロ・アジア語族·セム語派", "아프리카아시아어족·셈어파", "الأفروآسيوية · السامية", "Afro-asiatique · sémitique", "Афразийская · семитская", "Afroasiática · semítica", "亞非語系·閃米特語族"),
  "达罗毗荼语系": meta("ドラヴィダ語族", "드라비다어족", "الدرافيدية", "Dravidienne", "Дравидийская семья", "Dravídica", "達羅毗荼語系"),
  "印欧语系·伊朗语族": meta("インド・ヨーロッパ語族·イラン語派", "인도유럽어족·이란어파", "الهندو-أوروبية · الإيرانية", "Indo-européenne · iranienne", "Индоевропейская · иранская", "Indoeuropea · irania", "印歐語系·伊朗語族"),
  "尼日尔-刚果语系": meta("ニジェール・コンゴ語族", "니제르콩고어족", "النيجر-الكونغو", "Niger-Congo", "Нигеро-конголезская семья", "Níger-Congo", "尼日爾-剛果語系"),
  "乌拉尔语系": meta("ウラル語族", "우랄어족", "الأورالية", "Ouralienne", "Уральская семья", "Urálica", "烏拉爾語系"),
  "汉藏语系": meta("シナ・チベット語族", "중국티베트어족", "الصينية-التبتية", "Sino-tibétaine", "Сино-тибетская семья", "Sino-tibetana", "漢藏語系"),
  "南亚语系": meta("オーストロアジア語族", "오스트로아시아어족", "الأستروآسيوية", "Austroasiatique", "Австроазиатская семья", "Austroasiática", "南亞語系"),
  "壮侗语系": meta("タイ・カダイ語族", "타이카다이어족", "تاي-كاداي", "Tai-kadai", "Тай-кадайская семья", "Tai-kadai", "壯侗語系"),
  "日本语系": meta("日本語族", "일본어족", "اليابانية", "Japonique", "Японская семья", "Japónica", "日本語系"),
  "朝鲜语系": meta("朝鮮語族", "한국어족", "الكورية", "Coréanique", "Корейская семья", "Coreánica", "朝鮮語系"),
  "拉丁字母": meta("ラテン文字", "라틴 문자", "الأبجدية اللاتينية", "Alphabet latin", "Латиница", "Alfabeto latino", "拉丁字母"),
  "西里尔字母": meta("キリル文字", "키릴 문자", "الأبجدية السيريلية", "Alphabet cyrillique", "Кириллица", "Alfabeto cirílico", "西里爾字母"),
  "天城文": meta("デーヴァナーガリー文字", "데바나가리 문자", "الديفاناغارية", "Dévanagari", "Деванагари", "Devanagari", "天城文"),
  "阿拉伯字母（波斯体）": meta("アラビア文字（ペルシア式）", "아랍 문자(페르시아식)", "الأبجدية العربية (النمط الفارسي)", "Alphabet arabe (style persan)", "Арабское письмо (персидский стиль)", "Alfabeto árabe (estilo persa)", "阿拉伯字母（波斯體）"),
  "阿拉伯字母": meta("アラビア文字", "아랍 문자", "الأبجدية العربية", "Alphabet arabe", "Арабское письмо", "Alfabeto árabe", "阿拉伯字母"),
  "吉兹字母": meta("ゲエズ文字", "그으즈 문자", "خط الجعز", "Alphabet guèze", "Эфиопское письмо", "Alfabeto ge'ez", "吉茲字母"),
  "拉丁 / 西里尔字母": meta("ラテン文字 / キリル文字", "라틴 문자 / 키릴 문자", "اللاتينية / السيريلية", "Latin / cyrillique", "Латиница / кириллица", "Latino / cirílico", "拉丁 / 西里爾字母"),
  "汉字": meta("漢字", "한자", "الحروف الصينية", "Sinogrammes", "Китайские иероглифы", "Caracteres chinos", "漢字"),
  "孟加拉文": meta("ベンガル文字", "벵골 문자", "البنغالية", "Alphabet bengali", "Бенгальское письмо", "Escritura bengalí", "孟加拉文"),
  "汉字 + 假名": meta("漢字 + 仮名", "한자 + 가나", "الحروف الصينية + الكانا", "Sinogrammes + kana", "Кандзи + кана", "Kanji + kana", "漢字 + 假名"),
  "谚文": meta("ハングル", "한글", "الهانغل", "Hangul", "Хангыль", "Hangul", "諺文"),
  "泰文": meta("タイ文字", "태국 문자", "التايلندية", "Alphabet thaï", "Тайское письмо", "Escritura tailandesa", "泰文"),
  "缅文": meta("ビルマ文字", "미얀마 문자", "البورمية", "Alphabet birman", "Бирманское письмо", "Escritura birmana", "緬文"),
  "高棉文": meta("クメール文字", "크메르 문자", "الخميرية", "Alphabet khmer", "Кхмерское письмо", "Escritura jemer", "高棉文"),
  "老挝文": meta("ラオ文字", "라오 문자", "اللاوية", "Alphabet lao", "Лаосское письмо", "Escritura lao", "寮文"),
  "希腊字母": meta("ギリシャ文字", "그리스 문자", "الأبجدية اليونانية", "Alphabet grec", "Греческий алфавит", "Alfabeto griego", "希臘字母"),
  "希伯来字母": meta("ヘブライ文字", "히브리 문자", "الأبجدية العبرية", "Alphabet hébreu", "Еврейское письмо", "Alfabeto hebreo", "希伯來字母"),
};

function enrichText(text: LocalizedText): LocalizedText {
  return { ...text, ...(META_I18N[text.zh] || {}) };
}

function enrichMetaMap(data: LanguageMetaMap): LanguageMetaMap {
  return Object.fromEntries(
    Object.entries(data || {}).map(([code, info]) => [
      code,
      { ...info, family: enrichText(info.family), script: enrichText(info.script) },
    ]),
  );
}

export async function loadLanguageMeta(): Promise<LanguageMetaMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${BASE}data/language-meta.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: LanguageMetaMap) => {
      cache = enrichMetaMap(data);
      return cache;
    })
    .catch(() => ({}));
  return inflight;
}

export function getLanguageMetaSync(code: string): LanguageMeta | undefined {
  return cache?.[code];
}
