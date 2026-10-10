/**
 * 明鉴 · 任务解锁与进度（纯函数）
 * 文档 3.2：默认顺序解锁，C01 可直接进入；C01 完成后开放 C02；
 * 完成任意 2 个案例后开放其余案例，防止用户被永久卡住。
 * 解锁只依赖“完成状态”，不依赖分数高低（文档 10.3）。
 */

import type { CaseRecord, StoredProgress } from "../types";

export type CaseStatus = CaseRecord["status"];

/** 开放后续案例所需的已完成案例数 */
export const UNLOCK_THRESHOLD = 2;

export interface UnlockResult {
  status: CaseStatus;
  /** 未解锁时的原因说明 */
  reason?: string;
}

/**
 * 判断某个案例在给定进度下的状态。
 * @param order 案例在任务序列中的序号（从 0 开始）
 */
export function resolveCaseStatus(
  order: number,
  caseId: string,
  progress: Pick<StoredProgress, "cases" | "demoMode">
): UnlockResult {
  const record = progress.cases[caseId];
  // 已完成的案例永远保持 completed，不受解锁规则回退影响
  if (record && record.status === "completed") {
    return { status: "completed" };
  }

  // 演示模式：开放全部案例，方便评审快速查看
  if (progress.demoMode) {
    return { status: record?.status === "inProgress" ? "inProgress" : "available" };
  }

  const completedCount = countCompleted(progress.cases);

  // 第一个案例始终可直接进入
  if (order === 0) {
    return { status: record?.status === "inProgress" ? "inProgress" : "available" };
  }

  // 已完成 2 个及以上案例后，开放其余全部案例
  if (completedCount >= UNLOCK_THRESHOLD) {
    return { status: record?.status === "inProgress" ? "inProgress" : "available" };
  }

  // 第二个案例：需要完成 C01（序列中第一个案例）
  if (order === 1) {
    const firstId = progress.cases ? undefined : undefined;
    void firstId;
    if (completedCount >= 1) {
      return { status: record?.status === "inProgress" ? "inProgress" : "available" };
    }
    return { status: "locked", reason: "先完成第 1 个案例，即可解锁本案。" };
  }

  return {
    status: "locked",
    reason: `完成任意 ${UNLOCK_THRESHOLD} 个案例后自动解锁（当前已完成 ${completedCount} 个）。`,
  };
}

export function countCompleted(cases: Record<string, CaseRecord>): number {
  return Object.values(cases).filter((c) => c.status === "completed").length;
}

export function countInProgress(cases: Record<string, CaseRecord>): number {
  return Object.values(cases).filter((c) => c.status === "inProgress").length;
}

/**
 * 主用户路径的下一步建议（用于首页 CTA 与页面引导）
 */
export function nextStep(progress: StoredProgress): {
  route: string;
  label: string;
  hint: string;
} {
  if (!progress.pretest && !progress.demoMode) {
    return {
      route: "/assessment/pre",
      label: "开始训练",
      hint: "先用 5 道题建立你自己的基线，再进入 8 个案例。",
    };
  }

  const completed = countCompleted(progress.cases);
  if (completed >= 8 && !progress.posttest) {
    return {
      route: "/assessment/post",
      label: "完成后测",
      hint: "8 个案例已完成，做一次后测看看变化。",
    };
  }
  if (completed >= 8 && progress.posttest) {
    return {
      route: "/report",
      label: "查看学习报告",
      hint: "训练已完成，查看你的完整报告。",
    };
  }
  if (completed > 0) {
    return {
      route: "/missions",
      label: "继续调查",
      hint: `已完成 ${completed}/8 个案例，继续下一个。`,
    };
  }
  return {
    route: "/missions",
    label: "开始训练",
    hint: "进入任务地图，从第一个案例开始。",
  };
}

/** 是否已完成全部 8 个案例 */
export function isAllCasesCompleted(progress: StoredProgress, totalCases: number): boolean {
  return countCompleted(progress.cases) >= totalCases;
}
