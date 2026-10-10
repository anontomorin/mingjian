/**
 * 明鉴 · 试用数据导出
 *
 * 目的：让「真实用户试用」这条路径可执行——每台设备完成试用后可以导出一份
 * 只包含统计结果的 JSON，用 scripts/aggregate-trial.mjs 汇总成群体数据。
 *
 * 隐私边界（文档 2 / 9）：
 * - 只导出分数、完成状态、技能维度统计，不导出姓名、账号、设备标识；
 * - 不导出逐题作答内容与案例内的自由文本；
 * - 导出文件不上传任何服务器，由试用者本人手动交给组织者。
 */

import type {
  CaseDefinition,
  QuizForm,
  QuizRecord,
  SkillTag,
  StoredProgress,
} from "../types";
import { SKILL_LABELS, quizSkillBreakdown } from "./scoring";
import { buildReport } from "./report";

export const SNAPSHOT_KIND = "mingjian-trial-snapshot";
export const SNAPSHOT_VERSION = 1;

export interface QuizSnapshot {
  completed: boolean;
  /** 原始总分 0—100；未完成为 null（不得记作 0） */
  score: number | null;
  /** 按技能维度统计结论题命中数：correct / total */
  skills: Record<string, { correct: number; total: number }>;
}

export interface TrialSnapshot {
  kind: typeof SNAPSHOT_KIND;
  snapshotVersion: number;
  exportedAt: string;
  /** 演示模式（跳过前测）产生的数据，汇总时单独标记，不混入正式前后测 */
  demoMode: boolean;
  completedCases: number;
  totalCases: number;
  averageBest: number | null;
  dimensions: Array<{ key: string; label: string; earned: number; max: number }>;
  skills: Array<{ skill: string; label: string; sample: number; score: number | null }>;
  cases: Array<{
    caseId: string;
    best: number | null;
    last: number | null;
    attempts: number;
    status: string;
  }>;
  pretest: QuizSnapshot;
  posttest: QuizSnapshot;
  /** 后测 − 前测；任一未完成为 null */
  delta: number | null;
}

const EMPTY_QUIZ: QuizSnapshot = { completed: false, score: null, skills: {} };

function buildQuizSnapshot(record: QuizRecord | undefined, form: QuizForm): QuizSnapshot {
  if (!record || Object.keys(record.answers).length === 0) return EMPTY_QUIZ;
  const breakdown = quizSkillBreakdown(form.questions, record.answers);
  const skills: Record<string, { correct: number; total: number }> = {};
  (Object.keys(breakdown) as SkillTag[]).forEach((skill) => {
    skills[skill] = { ...breakdown[skill] };
  });
  return { completed: true, score: record.score, skills };
}

/** 由本机存档生成一份脱敏的试用快照（纯函数，可单独测试） */
export function buildTrialSnapshot(
  progress: StoredProgress,
  cases: CaseDefinition[],
  forms: { pre: QuizForm; post: QuizForm }
): TrialSnapshot {
  const report = buildReport(progress, cases);
  const pretest = buildQuizSnapshot(progress.pretest, forms.pre);
  const posttest = buildQuizSnapshot(progress.posttest, forms.post);
  const delta =
    pretest.score !== null && posttest.score !== null ? posttest.score - pretest.score : null;

  return {
    kind: SNAPSHOT_KIND,
    snapshotVersion: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    demoMode: progress.demoMode === true,
    completedCases: report.completedCount,
    totalCases: report.totalCases,
    averageBest: report.averageBest,
    dimensions: report.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      earned: d.earned,
      max: d.max,
    })),
    skills: report.skills.map((s) => ({
      skill: s.skill,
      label: SKILL_LABELS[s.skill] ?? s.label,
      sample: s.sample,
      score: s.score,
    })),
    cases: report.caseRows.map((r) => ({
      caseId: r.caseId,
      best: r.best,
      last: r.last,
      attempts: r.attempts,
      status: r.status,
    })),
    pretest,
    posttest,
    delta,
  };
}

/** 序列化为可保存的 JSON 文本 */
export function serializeTrialSnapshot(snapshot: TrialSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/** 生成导出文件名：mingjian-trial-YYYYMMDD-HHmm.json */
export function snapshotFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
  return `mingjian-trial-${stamp}.json`;
}
