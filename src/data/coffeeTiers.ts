import type { LocalizedText } from "@/types/country";

/** 一个打赏套餐：金额 + 表情包（emoji 占位，后续可换真实图）+ 搞笑反馈文案。 */
export interface CoffeeTier {
  /** 金额（人民币元）；null 表示"随意，多多益善"档 */
  amount: number | null;
  /** 大号表情包（占位，后续可替换为真实图片 URL） */
  emoji: string;
  /** 点击套餐后弹出的搞笑提示 */
  reaction: LocalizedText;
}

/**
 * 打赏套餐（情绪价值拉满版）。
 * 20 元设一道"坎"，>20 元统一走"震惊 + 更搞笑"档。
 */
export const COFFEE_TIERS: CoffeeTier[] = [
  {
    amount: 1,
    emoji: "🙏",
    reaction: { zh: "感恩赏光～您的 1 块钱已在路上闪闪发光 ✨", en: "Bless you! Your ¥1 is already sparkling on its way ✨" },
  },
  {
    amount: 3,
    emoji: "🥰",
    reaction: { zh: "感谢老板！这 3 块钱我先替服务器谢谢您了 🙇", en: "Thanks, boss! The server thanks you for these ¥3 🙇" },
  },
  {
    amount: 5,
    emoji: "😎",
    reaction: { zh: "老板大气！5 块到账，今晚的泡面加个蛋 🍜🥚", en: "So generous! ¥5 in — tonight's instant noodles get an egg 🍜🥚" },
  },
  {
    amount: 10,
    emoji: "🤩",
    reaction: { zh: "久旱逢甘霖！10 块巨款，我感动得代码都不报错了 🌧️→🌈", en: "Rain after drought! A whopping ¥10 — even my bugs fixed themselves 🌧️→🌈" },
  },
  {
    amount: 20,
    emoji: "🫡",
    reaction: { zh: "20 块！这是一道坎，您跨过去了，我给您敬礼 🫡", en: "¥20! That's a milestone — you crossed it. I salute you 🫡" },
  },
  {
    // > 20 元档：震惊 + 更搞笑
    amount: null,
    emoji: "😱",
    reaction: {
      zh: "啊这——超过 20 块？！我的下巴已经掉到键盘上了 ⌨️😱 您是天使投资人吧！这网站从此以您冠名 🏆",
      en: "Wait—over ¥20?! My jaw just hit the keyboard ⌨️😱 Are you an angel investor? This site is now named after you 🏆",
    },
  },
];
