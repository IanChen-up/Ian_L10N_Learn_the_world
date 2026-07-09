import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "data");
const US_ATLAS = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_DATA = [
  ["Alabama", "亚拉巴马州", "AL", "Montgomery", "蒙哥马利", 5108468, 135767, "美国民权运动的重要发生地，蒙哥马利与伯明翰都保留了大量历史记忆。"],
  ["Alaska", "阿拉斯加州", "AK", "Juneau", "朱诺", 733406, 1723337, "美国面积最大的州，以北极圈、冰川、极光和原住民文化闻名。"],
  ["Arizona", "亚利桑那州", "AZ", "Phoenix", "菲尼克斯", 7431344, 295234, "大峡谷所在州，沙漠地貌与美洲原住民保留地构成鲜明地域特色。"],
  ["Arkansas", "阿肯色州", "AR", "Little Rock", "小石城", 3067732, 137732, "位于美国南部与中西部交界，奥扎克山区和密西西比河平原塑造了州内差异。"],
  ["California", "加利福尼亚州", "CA", "Sacramento", "萨克拉门托", 38965193, 423967, "美国人口最多的州，硅谷、好莱坞、中央谷地农业和太平洋海岸共同构成全球影响力。"],
  ["Colorado", "科罗拉多州", "CO", "Denver", "丹佛", 5877610, 269601, "落基山脉核心州，以高海拔城市、滑雪产业、户外运动和航空航天产业著称。"],
  ["Connecticut", "康涅狄格州", "CT", "Hartford", "哈特福德", 3617176, 14357, "新英格兰南部州，保险业、港口城市和殖民时期城镇格局影响深远。"],
  ["Delaware", "特拉华州", "DE", "Dover", "多佛", 1031890, 6446, "美国最早批准宪法的州之一，公司注册制度使其在商业法领域很有存在感。"],
  ["District of Columbia", "华盛顿哥伦比亚特区", "DC", "Washington", "华盛顿", 678972, 177, "美国首都所在地，不属于任何州，是联邦政府、国家纪念建筑和博物馆高度集中的地区。"],
  ["Florida", "佛罗里达州", "FL", "Tallahassee", "塔拉哈西", 22610726, 170312, "半岛州，旅游、航天发射、加勒比文化联系和湿地生态都非常突出。"],
  ["Georgia", "佐治亚州", "GA", "Atlanta", "亚特兰大", 11029227, 153910, "美国东南部交通和商业枢纽，亚特兰大也是民权运动与现代媒体产业的重要城市。"],
  ["Hawaii", "夏威夷州", "HI", "Honolulu", "檀香山", 1435138, 28313, "太平洋群岛州，波利尼西亚文化、火山地貌和海洋旅游是核心特色。"],
  ["Idaho", "爱达荷州", "ID", "Boise", "博伊西", 1964726, 216443, "山地与高原农业州，以马铃薯、户外运动和快速增长的博伊西都市区闻名。"],
  ["Illinois", "伊利诺伊州", "IL", "Springfield", "斯普林菲尔德", 12549689, 149995, "芝加哥所在州，是五大湖工业、金融、铁路与移民文化的重要节点。"],
  ["Indiana", "印第安纳州", "IN", "Indianapolis", "印第安纳波利斯", 6862199, 94326, "中西部制造业州，汽车零部件、篮球文化和印第安纳波利斯 500 赛事知名度高。"],
  ["Iowa", "艾奥瓦州", "IA", "Des Moines", "得梅因", 3207004, 145746, "美国玉米带核心州，农业、可再生能源和总统初选政治文化很有代表性。"],
  ["Kansas", "堪萨斯州", "KS", "Topeka", "托皮卡", 2940546, 213100, "大平原州，以小麦、草原、龙卷风气候和美国地理中心意象闻名。"],
  ["Kentucky", "肯塔基州", "KY", "Frankfort", "法兰克福", 4526154, 104656, "蓝草音乐、赛马、波本威士忌和阿巴拉契亚山地文化共同塑造州内形象。"],
  ["Louisiana", "路易斯安那州", "LA", "Baton Rouge", "巴吞鲁日", 4573749, 135659, "法裔、克里奥尔与卡津文化浓厚，新奥尔良音乐、美食和密西西比河口地理特征鲜明。"],
  ["Maine", "缅因州", "ME", "Augusta", "奥古斯塔", 1395722, 91633, "美国东北角州，以崎岖海岸、龙虾产业、森林和灯塔景观闻名。"],
  ["Maryland", "马里兰州", "MD", "Annapolis", "安纳波利斯", 6180253, 32131, "切萨皮克湾塑造了海鲜、港口和海军传统，也与华盛顿都市圈联系紧密。"],
  ["Massachusetts", "马萨诸塞州", "MA", "Boston", "波士顿", 7001399, 27336, "美国高等教育和早期殖民历史重镇，波士顿都市区聚集大量大学、医疗与科技产业。"],
  ["Michigan", "密歇根州", "MI", "Lansing", "兰辛", 10037261, 250487, "五大湖半岛州，底特律汽车工业和湖区生态是最具代表性的标签。"],
  ["Minnesota", "明尼苏达州", "MN", "Saint Paul", "圣保罗", 5737915, 225163, "“万湖之州”，北欧移民文化、寒冷气候、医疗与零售企业总部都很突出。"],
  ["Mississippi", "密西西比州", "MS", "Jackson", "杰克逊", 2939690, 125438, "密西西比河下游州，布鲁斯音乐、三角洲农业和美国南方历史联系紧密。"],
  ["Missouri", "密苏里州", "MO", "Jefferson City", "杰斐逊城", 6196156, 180540, "位于中西部与南部交界，圣路易斯和堪萨斯城分别体现河港与平原城市传统。"],
  ["Montana", "蒙大拿州", "MT", "Helena", "海伦娜", 1132812, 380831, "大天空之州，以落基山、牧场、国家公园和低人口密度著称。"],
  ["Nebraska", "内布拉斯加州", "NE", "Lincoln", "林肯", 1978379, 200330, "大平原农业州，玉米、牛肉、铁路通道和奥马哈商业传统较有代表性。"],
  ["Nevada", "内华达州", "NV", "Carson City", "卡森城", 3194176, 286380, "沙漠州，拉斯维加斯旅游娱乐业、矿业和联邦公地面积都很突出。"],
  ["New Hampshire", "新罕布什尔州", "NH", "Concord", "康科德", 1402054, 24214, "新英格兰山地州，以小政府传统、总统初选和白山自然景观闻名。"],
  ["New Jersey", "新泽西州", "NJ", "Trenton", "特伦顿", 9290841, 22591, "人口密度极高，连接纽约和费城都市圈，制药、港口和海岸度假城市发达。"],
  ["New Mexico", "新墨西哥州", "NM", "Santa Fe", "圣菲", 2114371, 314917, "西南部州，普韦布洛、拉美和美国边疆文化交织，沙漠高原和艺术传统鲜明。"],
  ["New York", "纽约州", "NY", "Albany", "奥尔巴尼", 19571216, 141297, "纽约市是全球金融、文化和移民中心，州北部则有五大湖、哈德逊河谷和尼亚加拉瀑布。"],
  ["North Carolina", "北卡罗来纳州", "NC", "Raleigh", "罗利", 10835491, 139391, "从大西洋海岸到阿巴拉契亚山地跨度大，研究三角区、金融和高教资源突出。"],
  ["North Dakota", "北达科他州", "ND", "Bismarck", "俾斯麦", 783926, 183108, "北部大平原州，农业、能源开发和严寒气候是主要特征。"],
  ["Ohio", "俄亥俄州", "OH", "Columbus", "哥伦布", 11785935, 116098, "五大湖与中西部工业州，制造业、航空传统和多个中型城市网络突出。"],
  ["Oklahoma", "俄克拉荷马州", "OK", "Oklahoma City", "俄克拉荷马城", 4053824, 181037, "大平原南部州，美洲原住民部族历史、能源产业和龙卷风气候都很典型。"],
  ["Oregon", "俄勒冈州", "OR", "Salem", "塞勒姆", 4233358, 254799, "太平洋西北州，以森林、火山、威拉米特谷地农业和波特兰城市文化闻名。"],
  ["Pennsylvania", "宾夕法尼亚州", "PA", "Harrisburg", "哈里斯堡", 12961683, 119280, "美国建国历史重镇，费城、匹兹堡分别代表殖民历史与钢铁工业转型。"],
  ["Rhode Island", "罗得岛州", "RI", "Providence", "普罗维登斯", 1095962, 4001, "美国面积最小的州，港湾、海洋贸易、布朗大学和新英格兰城镇传统突出。"],
  ["South Carolina", "南卡罗来纳州", "SC", "Columbia", "哥伦比亚", 5373555, 82933, "东南沿海州，查尔斯顿历史城区、海岛文化和制造业投资较有代表性。"],
  ["South Dakota", "南达科他州", "SD", "Pierre", "皮尔", 919318, 199729, "大平原州，拉什莫尔山、黑山地区和拉科塔文化是重要标签。"],
  ["Tennessee", "田纳西州", "TN", "Nashville", "纳什维尔", 7126489, 109153, "乡村音乐之都纳什维尔、孟菲斯布鲁斯与物流产业共同构成州内文化经济特色。"],
  ["Texas", "得克萨斯州", "TX", "Austin", "奥斯汀", 30503301, 695662, "美国面积和人口大州，能源、科技、航天、边境贸易和独特州身份认同都很鲜明。"],
  ["Utah", "犹他州", "UT", "Salt Lake City", "盐湖城", 3417734, 219882, "山地与高原州，摩门文化、国家公园、滑雪和盐湖城科技产业增长显著。"],
  ["Vermont", "佛蒙特州", "VT", "Montpelier", "蒙彼利埃", 647464, 24906, "新英格兰山地州，以枫糖、奶业、小城镇政治传统和秋季景观闻名。"],
  ["Virginia", "弗吉尼亚州", "VA", "Richmond", "里士满", 8715698, 110787, "美国早期殖民和建国历史重镇，北弗吉尼亚与首都圈经济联系紧密。"],
  ["Washington", "华盛顿州", "WA", "Olympia", "奥林匹亚", 7812880, 184661, "太平洋西北州，西雅图科技、航空、咖啡文化和喀斯喀特山地景观突出。"],
  ["West Virginia", "西弗吉尼亚州", "WV", "Charleston", "查尔斯顿", 1770071, 62756, "阿巴拉契亚山地州，煤炭历史、山谷城镇和户外旅游是主要特征。"],
  ["Wisconsin", "威斯康星州", "WI", "Madison", "麦迪逊", 5910955, 169635, "五大湖州，以乳制品、麦迪逊大学城、密尔沃基工业和湖区文化闻名。"],
  ["Wyoming", "怀俄明州", "WY", "Cheyenne", "夏延", 584057, 253335, "美国人口最少的州，黄石国家公园、牧场文化和能源矿产资源非常突出。"],
];

function provinceFor([nameEn, zh, abbr, capitalEn, capitalZh, population, areaKm2, highlight]) {
  return {
    name: zh,
    nameEn,
    abbr,
    capital: { zh: capitalZh, en: capitalEn },
    capitalNote: { zh: "州首府", en: "State capital" },
    population,
    areaKm2,
    gdpHistoryKey: `US-${abbr}`,
    gdpSource: {
      label: {
        zh: "GDP 数据来源：美国经济分析局（BEA）州 GDP，FRED 镜像；单位为现价美元。",
        en: "GDP source: U.S. Bureau of Economic Analysis (BEA), GDP by state via FRED; current dollars.",
      },
      url: `https://fred.stlouisfed.org/series/${abbr}NGSP`,
    },
    dialects: [
      {
        name: { zh: "美式英语", en: "American English" },
        family: { zh: "印欧语系·日耳曼语族", en: "Indo-European · Germanic" },
      },
    ],
    ethnicGroups: [
      { name: { zh: "白人", en: "White" } },
      { name: { zh: "拉丁裔", en: "Hispanic or Latino" } },
      { name: { zh: "非裔美国人", en: "African American" } },
      { name: { zh: "亚裔", en: "Asian" } },
    ],
    religions: ["christianity", "secular"],
    highlights: [
      {
        name: { zh: "地域特色", en: "Local identity" },
        note: { zh: highlight, en: highlight },
      },
      {
        name: { zh: "行政与地理", en: "Administration & geography" },
        note: {
          zh: `${capitalZh}是州首府；面积约 ${areaKm2.toLocaleString()} 平方公里，人口约 ${population.toLocaleString()}。`,
          en: `${capitalEn} is the state capital; area is about ${areaKm2.toLocaleString()} km² and population is about ${population.toLocaleString()}.`,
        },
      },
    ],
  };
}

async function fetchFredSeries(seriesId) {
  const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`);
  if (!res.ok) throw new Error(`FRED ${seriesId} ${res.status}`);
  const csv = await res.text();
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, raw] = line.split(",");
      const value = Number(raw);
      return {
        year: Number(date.slice(0, 4)),
        // FRED/BEA state GDP series are in millions of current dollars.
        value: Number.isFinite(value) ? value * 1_000_000 : null,
      };
    })
    .filter((p) => p.year && p.value != null)
    .slice(-30);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const topo = await (await fetch(US_ATLAS)).json();
  const geo = feature(topo, topo.objects.states);
  await writeFile(join(OUT, "us-states.json"), JSON.stringify(geo));

  const data = Object.fromEntries(STATE_DATA.map((row) => [row[0], provinceFor(row)]));
  const histories = {};
  for (const row of STATE_DATA) {
    const [, , abbr] = row;
    const key = `US-${abbr}`;
    try {
      const pts = await fetchFredSeries(`${abbr}NGSP`);
      histories[key] = pts;
      const latest = pts[pts.length - 1];
      if (latest) {
        data[row[0]].gdpUSD = latest.value;
        data[row[0]].gdpYear = latest.year;
        data[row[0]].highlights.push({
          name: { zh: "经济规模", en: "Economic scale" },
          note: {
            zh: `${latest.year} 年现价 GDP 约为 ${Math.round(latest.value / 100_000_000).toLocaleString()} 亿美元，历史曲线来自 BEA/FRED 年度州 GDP 序列。`,
            en: `Current-dollar GDP in ${latest.year} was about $${Math.round(latest.value / 1_000_000_000).toLocaleString()} billion, with the historical chart from BEA/FRED annual state GDP series.`,
          },
        });
      }
    } catch (e) {
      console.warn(`⚠ GDP history failed for ${abbr}: ${e.message}`);
    }
  }
  await writeFile(join(OUT, "us-provinces.json"), JSON.stringify(data));
  await writeFile(join(OUT, "province-gdp-history.json"), JSON.stringify(histories));
  console.log(`✓ wrote ${geo.features.length} US geometries, ${STATE_DATA.length} state profiles, ${Object.keys(histories).length} GDP histories`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
