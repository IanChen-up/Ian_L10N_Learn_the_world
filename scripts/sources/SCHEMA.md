# 供数据子代理遵循的补充数据 Schema（严格）

目标：为每个国家补充 world-countries 未包含的字段：**宗教、政体、独特假期**，以及**中文首都名**（若与英文不同）。

## 输出文件
每个子代理输出一个 JSON 文件，形如：
```json
{
  "JPN": {
    "capitalZh": "东京",
    "religions": [{ "key": "shinto", "share": 70 }, { "key": "buddhism", "share": 67 }],
    "government": "parliamentary_monarchy",
    "holidays": [
      { "name": { "zh": "成人节", "en": "Coming of Age Day" }, "date": "1 月第二个周一", "note": { "zh": "庆祝年满二十岁的青年", "en": "Celebrates those turning 20" } },
      { "name": { "zh": "黄金周", "en": "Golden Week" }, "date": "4 月底至 5 月初" }
    ]
  },
  "CHN": { ... }
}
```
顶层 key = ISO3 三字码（与提供的清单一致）。

## 字段规则

### religions（数组，1-4 项，按占比从高到低）
- 每项 `{ "key": <宗教key>, "share"?: <0-100 整数，可选> }`
- **key 只能取以下枚举之一**（务必精确匹配，拼写一致）：
  `christianity, catholicism, protestantism, orthodoxy, islam, sunni, shia, buddhism, hinduism, judaism, sikhism, shinto, taoism, folk, indigenous, animism, bahai, jainism, confucianism, secular, other`
- 说明：基督宗教若以天主教为主用 `catholicism`，以新教为主用 `protestantism`，东正教用 `orthodoxy`，笼统时用 `christianity`。伊斯兰教可细分 `sunni`/`shia`，笼统用 `islam`。无宗教/世俗占比高用 `secular`。民间信仰用 `folk`，原住民/传统信仰用 `indigenous` 或 `animism`。
- share 为大致主流数据即可（无需精确），不确定可省略。

### government（字符串，单值）
- **只能取以下枚举之一**：
  `presidential_republic, parliamentary_republic, semi_presidential_republic, federal_republic, constitutional_monarchy, absolute_monarchy, parliamentary_monarchy, one_party_state, socialist_republic, theocracy, federation, provisional, military, other`
- 例：美国=`federal_republic`（也可 `presidential_republic`，优先 `federal_republic`）；英国/日本/西班牙=`parliamentary_monarchy`；沙特=`absolute_monarchy`；中国/朝鲜/越南/老挝/古巴=`one_party_state`；法国/俄罗斯=`semi_presidential_republic`；德国/意大利=`parliamentary_republic`；伊朗=`theocracy`。

### holidays（数组，2-3 项，突出"独特/有文化特色"的假期）
- 每项：`{ "name": {"zh","en"}, "date"?: 字符串, "note"?: {"zh","en"} }`
- 选择**该国独有或最具文化代表性**的节日（避免只写"新年/圣诞"这类通用节日；宗教节日、独立日、民族传统节日更佳）。
- `date` 用简短中文描述（如 "1 月第二个周一"、"07-04"、"农历正月"），可选。
- `note` 一句话双语说明，可选但推荐，帮助小白理解。

### capitalZh（字符串，可选）
- 提供该国**首都的规范中文名**（如 "东京"、"华盛顿哥伦比亚特区"）。若不确定可省略，构建脚本会回退到英文。

## 质量要求
- 宁可信息准确、克制，也不要编造。不确定的 share/date/note 可省略对应字段。
- 所有 key 必须精确匹配上面枚举，**不得自造 key**。
- 输出必须是**合法 JSON**（无注释、无尾逗号），仅输出 JSON 内容本身。
