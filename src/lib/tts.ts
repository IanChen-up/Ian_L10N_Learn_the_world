/** 浏览器 TTS 朗读工具（Web Speech API）。无依赖、静态托管可用。
 *  注：纯静态站只能用浏览器内置嗓音，音质因设备/系统而异；此处尽量挑选最自然的本地嗓音。 */

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesCache: SpeechSynthesisVoice[] = [];

/** 预热并缓存嗓音列表（部分浏览器首次为空，需监听 voiceschanged）。 */
function getVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  const list = window.speechSynthesis.getVoices();
  if (list.length) voicesCache = list;
  return voicesCache;
}

if (canSpeak()) {
  // 提前触发一次，并在列表就绪后缓存
  getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

/** 依 BCP-47 语言标签挑选最合适、尽量自然的嗓音。 */
function pickVoice(langTag: string): SpeechSynthesisVoice | undefined {
  const voices = getVoices();
  if (!voices.length) return undefined;
  const lower = langTag.toLowerCase();
  const prefix = lower.slice(0, 2);

  // 优先级：完全匹配 langTag > 同语言 + 本地嗓音 > 同语言 > 同语系前缀
  const exact = voices.filter((v) => v.lang?.toLowerCase() === lower);
  const sameLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(prefix));

  // 更自然：优先 localService（离线高质量）与包含 natural/premium/enhanced 的嗓音名
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    if (v.localService) s += 2;
    if (/natural|premium|enhanced|neural/i.test(v.name)) s += 3;
    if (v.default) s += 1;
    return s;
  };
  const best = (arr: SpeechSynthesisVoice[]) =>
    arr.length ? [...arr].sort((a, b) => score(b) - score(a))[0] : undefined;

  return best(exact) || best(sameLang);
}

/** 朗读一段文字。langTag 为 BCP-47 语言代码（如 zh-CN / ar-SA / fr-FR）。 */
export function speak(text: string, langTag?: string): void {
  if (!canSpeak() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (langTag) {
    u.lang = langTag;
    const v = pickVoice(langTag);
    if (v) u.voice = v;
  }
  // 稍慢、正常音高，听感更清晰自然
  u.rate = 0.92;
  u.pitch = 1;
  u.volume = 1;
  synth.speak(u);
}

/** 判断某语言标签是否有可用嗓音（无则 UI 可给出降级提示）。 */
export function hasVoiceFor(langTag?: string): boolean {
  if (!langTag) return true;
  return Boolean(pickVoice(langTag)) || getVoices().length === 0; // 列表未就绪时不误报
}
