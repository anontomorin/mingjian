/**
 * 明鉴 · 案例内分步引导
 *
 * 纯函数：根据当前作答状态判断「下一步该做什么」，避免玩家进入工作台后不知道从哪开始。
 * 只做操作指引，不提示任何答案（不指出哪条证据关键、哪个结论正确）。
 */

import type { CaseDefinition, CaseRecord } from "../types";

export interface GuideStep {
  /** 1—6 的步骤序号，用于界面上的进度标记 */
  index: number;
  /** 该步骤的短标题 */
  title: string;
  /** 具体怎么做 */
  text: string;
}

export const TOTAL_GUIDE_STEPS = 6;

export function guideStep(caseDef: CaseDefinition, record: CaseRecord): GuideStep {
  const openedCount = record.openedEvidenceIds.length;
  const chainCount = record.selectedEvidenceIds.length;
  const checksTotal = caseDef.requiredChecks.length;
  const checksDone = record.completedChecks.length;

  if (openedCount === 0) {
    return {
      index: 1,
      title: "看材料",
      text: "先点开任意一份材料的「查看详情」，看清它的来源、时间，以及它覆盖了主张的哪一部分。",
    };
  }
  if (chainCount === 0) {
    return {
      index: 2,
      title: "建证据链",
      text: "把你认为能支持判断的材料「加入证据链」。只有加入的材料才计入证据分。",
    };
  }
  if (checksDone < checksTotal) {
    return {
      index: 3,
      title: "做核查",
      text: `完成核查步骤清单里的动作，并手动勾选（${checksDone}/${checksTotal}）。`,
    };
  }
  if (!record.verdict) {
    return {
      index: 4,
      title: "下结论",
      text: "在右栏选择一个结论：有证据支持、与证据冲突、呈现方式误导，还是证据不足。",
    };
  }
  if (!record.actionId) {
    return {
      index: 5,
      title: "选行动",
      text: "选择你接下来的真实做法，并拖动滑块报告你对结论的把握程度。",
    };
  }
  return {
    index: 6,
    title: "提交",
    text: "确认无误后提交，就能看到逐项反馈：分数来源、关键证据、遗漏证据与建议路径。",
  };
}

/** 提交是否可用（用于提示条上的状态说明） */
export function isReadyToSubmit(record: CaseRecord): boolean {
  return Boolean(record.verdict && record.actionId);
}
