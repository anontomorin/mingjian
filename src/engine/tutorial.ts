/**
 * 明鉴 · 引导关步骤引擎
 *
 * 纯函数：描述「引导关分几步、每步要用户做什么、做到没有」。
 * 页面只负责渲染与交互，判断逻辑集中在这里，方便单独测试。
 * 引导关不写入案例进度、不参与解锁、不进入学习报告。
 */

import type { Verdict } from "../types";

/** 引导关要求查看的材料份数 */
export const TUTORIAL_MIN_OPENED = 2;
/** 引导关要求加入证据链的最少份数 */
export const TUTORIAL_MIN_CHAIN = 1;

export interface TutorialState {
  /** 是否已确认读过主张 */
  readClaim: boolean;
  openedEvidenceIds: string[];
  selectedEvidenceIds: string[];
  completedChecks: string[];
  verdict?: Verdict;
  confidence: number;
  actionId?: string;
  /** 是否已提交（提交后进入教学反馈，不再回到操作步骤） */
  submitted: boolean;
}

export interface TutorialContext {
  /** 本案材料总数 */
  totalEvidence: number;
  /** 本案核查步骤总数 */
  totalChecks: number;
}

/** 每一步高亮的工作台区域 */
export type TutorialTarget = "claim" | "evidence" | "chain" | "checks" | "verdict" | "action";

export interface TutorialStepDef {
  id: string;
  /** 1—6 的序号 */
  no: number;
  title: string;
  /** 引导气泡里的操作说明 */
  hint: string;
  /** 完成条件的简短描述，显示在气泡右侧 */
  requirement: string;
  /** 引导关首页卡片上的一句话说明 */
  intro: string;
  target: TutorialTarget;
  isDone: (s: TutorialState, ctx: TutorialContext) => boolean;
  /** 进度文案，例如「已查看 1/2」 */
  progressText: (s: TutorialState, ctx: TutorialContext) => string;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: "claim",
    no: 1,
    title: "读主张",
    intro: "看清是谁说的、什么时候说的、会影响谁。",
    hint: "先看主张本身：发布账号是不是官方渠道、有没有明确时间、这条信息会影响哪些人。看清楚再往下走。",
    requirement: "确认已阅读",
    target: "claim",
    isDone: (s) => s.readClaim,
    progressText: (s) => (s.readClaim ? "已确认" : "待确认"),
  },
  {
    id: "evidence",
    no: 2,
    title: "查证据",
    intro: "点开材料详情，看来源、时间与它覆盖主张的哪一部分。",
    hint: "点开每份材料的「查看详情」。你会看到材料的模拟界面和全文。至于它「能支持什么、不能证明什么」，本关会在你提交后揭晓——那是你要自己练的部分。",
    requirement: `至少查看 ${TUTORIAL_MIN_OPENED} 份材料`,
    target: "evidence",
    isDone: (s) => s.openedEvidenceIds.length >= TUTORIAL_MIN_OPENED,
    progressText: (s, ctx) =>
      `已查看 ${Math.min(s.openedEvidenceIds.length, ctx.totalEvidence)}/${Math.min(
        TUTORIAL_MIN_OPENED,
        ctx.totalEvidence
      )}`,
  },
  {
    id: "chain",
    no: 3,
    title: "建证据链",
    intro: "把你认为有用的材料加进来，让判断有据可依。",
    hint: "把你认为能支持判断的材料「加入证据链」。只有加入的材料才计入证据分；拿不准的可以先不放进去。",
    requirement: `至少加入 ${TUTORIAL_MIN_CHAIN} 份`,
    target: "chain",
    isDone: (s) => s.selectedEvidenceIds.length >= TUTORIAL_MIN_CHAIN,
    progressText: (s) => `证据链 ${s.selectedEvidenceIds.length} 份`,
  },
  {
    id: "checks",
    no: 4,
    title: "做核查",
    intro: "完成核查动作后手动勾选，系统不会替你完成。",
    hint: "按清单上的动作实际核查一次，然后手动勾选。未查看对应材料时步骤会提示你先去看材料。",
    requirement: "勾选全部步骤",
    target: "checks",
    isDone: (s, ctx) => s.completedChecks.length >= ctx.totalChecks,
    progressText: (s, ctx) => `已完成 ${s.completedChecks.length}/${ctx.totalChecks}`,
  },
  {
    id: "verdict",
    no: 5,
    title: "下结论",
    intro: "四选一，并报告你的把握程度。",
    hint: "从四个结论里选一个：有证据支持、与证据冲突、呈现方式误导、证据不足。再拖动滑块报告你的把握程度——它不计入总分。",
    requirement: "选择一个结论",
    target: "verdict",
    isDone: (s) => Boolean(s.verdict),
    progressText: (s) => (s.verdict ? `已选择 · 把握 ${s.confidence}%` : "未选择"),
  },
  {
    id: "action",
    no: 6,
    title: "选行动",
    intro: "选择你接下来真的会做的事，然后提交。",
    hint: "选一个你在真实生活里会采取的行动，再点「提交」。提交后你会看到逐项反馈。",
    requirement: "选择一个行动",
    target: "action",
    isDone: (s) => Boolean(s.actionId),
    progressText: (s) => (s.actionId ? "已选择" : "未选择"),
  },
];

export function createTutorialState(): TutorialState {
  return {
    readClaim: false,
    openedEvidenceIds: [],
    selectedEvidenceIds: [],
    completedChecks: [],
    confidence: 50,
    submitted: false,
  };
}

/** 当前应该停在哪一步（0-based）；全部完成时返回步骤总数（表示可以提交） */
export function tutorialStepIndex(
  state: TutorialState,
  ctx: TutorialContext
): number {
  for (let i = 0; i < TUTORIAL_STEPS.length; i += 1) {
    if (!TUTORIAL_STEPS[i].isDone(state, ctx)) return i;
  }
  return TUTORIAL_STEPS.length;
}

/** 某一步是否已解锁（前一步完成后才解锁） */
export function isTutorialStepUnlocked(
  index: number,
  state: TutorialState,
  ctx: TutorialContext
): boolean {
  if (index <= 0) return true;
  return TUTORIAL_STEPS.slice(0, index).every((s) => s.isDone(state, ctx));
}

/** 是否可以提交（六步全部完成） */
export function canSubmitTutorial(state: TutorialState, ctx: TutorialContext): boolean {
  return TUTORIAL_STEPS.every((s) => s.isDone(state, ctx));
}
