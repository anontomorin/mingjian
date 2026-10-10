/**
 * 试用数据导出（浏览器 IO 层）
 * 只负责把序列化好的文本交给浏览器下载；计分与脱敏一律在 engine/trialExport 中完成。
 */

import type { CaseDefinition, QuizForm, StoredProgress } from "../types";
import {
  buildTrialSnapshot,
  serializeTrialSnapshot,
  snapshotFileName,
} from "../engine/trialExport";

export interface DownloadOutcome {
  ok: boolean;
  message: string;
}

/** 触发一次 JSON 文件下载；失败时返回可读提示，不影响页面继续运行 */
export function downloadTrialSnapshot(
  progress: StoredProgress,
  cases: CaseDefinition[],
  forms: { pre: QuizForm; post: QuizForm }
): DownloadOutcome {
  try {
    const snapshot = buildTrialSnapshot(progress, cases, forms);
    const text = serializeTrialSnapshot(snapshot);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = snapshotFileName();
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return {
      ok: true,
      message: `已导出 ${snapshotFileName()}：只包含分数与完成状态，不含任何个人身份信息。`,
    };
  } catch {
    return {
      ok: false,
      message: "导出失败：当前浏览器阻止了文件下载，可改用浏览器设置允许下载后重试。",
    };
  }
}
