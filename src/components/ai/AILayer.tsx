import SelectionAsk from "./SelectionAsk";
import AIChatPanel from "./AIChatPanel";
import AISettingsModal from "./AISettingsModal";

/** 全局挂载：划词提问按钮 + AI 对话侧栏 + AI 设置弹窗 */
export default function AILayer() {
  return (
    <>
      <SelectionAsk />
      <AIChatPanel />
      <AISettingsModal />
    </>
  );
}
