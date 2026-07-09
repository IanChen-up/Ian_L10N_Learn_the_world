import { useEffect, useState, useCallback } from "react";

export interface SelectionInfo {
  text: string;
  x: number;
  y: number;
}

/**
 * 监听页面文本选区。选中非空文本时返回选区文本与位置（用于浮现提问按钮）。
 * 忽略输入框内与带 data-no-ask 容器内的选区。
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);

  const clear = useCallback(() => setSelection(null), []);

  useEffect(() => {
    const handle = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text || text.length < 2) {
        setSelection(null);
        return;
      }

      const anchor = sel.anchorNode;
      const el =
        anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as HTMLElement | null);
      if (el?.closest("input, textarea, [data-no-ask]")) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelection(null);
        return;
      }
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    document.addEventListener("mouseup", handle);
    document.addEventListener("touchend", handle);
    return () => {
      document.removeEventListener("mouseup", handle);
      document.removeEventListener("touchend", handle);
    };
  }, []);

  return { selection, clear };
}
