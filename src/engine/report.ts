/**
 * 明鉴 · 学习报告聚合（纯函数）
 * 文档 7.5：所有数字来自真实存档记录，不随机生成、不伪造。
 */

import type { CaseDefinition, CaseScoreBreakdown, SkillTag, StoredProgress } from "../types";
import {
  ALL_SKILLS,
  MAX_ACTION,
  MAX_EVIDENCE,
  MAX_REASONING,
  MAX_VERDICT,
  SKILL_LABELS,
} from "./scoring";
import { countCompleted } from "./progression";

/** 技能聚合的最小样本量：低于此值提示“还需要完成更多案例” */
export const MIN_SKILL_SAMPLE = 2;

export interface DimensionSummary {
  key: "verdict" | "evidence" | "reasoning" | "action";
  label: string;
  max: number;
  earned: number;
  ratio: number;
}

export interface SkillSummary {
  skill: SkillTag;
  label: string;
  /** 已完成且携带该标签的案例数 */
  sample: number;
  /** 平均分（0—100），样本不足时为 null */
  score: number | null;
  sufficient: boolean;
}

export interface CaseScoreRow {
  caseId: string;
  title: string;
  best: number | null;
  last: number | null;
  attempts: number;
  status: string;
}

export interface PrePostSummary {
  available: boolean;
  preScore: number | null;
  postScore: number | null;
  delta: number | null;
  note: string;
}

export interface ReportData {
  completedCount: number;
  totalCases: number;
  averageBest: number | null;
  dimensions: DimensionSummary[];
  skills: SkillSummary[];
  caseRows: CaseScoreRow[];
  prepost: PrePostSummary;
  strengths: string[];
  suggestions: string[];
  /** 薄弱技能（用于“重新训练薄弱技能”） */
  weakSkills: SkillTag[];
  /** 建议重练的案例 id */
  recommendedCaseIds: string[];
  hasData: boolean;
}

const DIMENSION_META: Array<{
  key: "verdict" | "evidence" | "reasoning" | "action";
  label: string;
  max: number;
}> = [
  { key: "verdict", label: "结论判断", max: MAX_VERDICT },
  { key: "evidence", label: "证据选择", max: MAX_EVIDENCE },
  { key: "reasoning", label: "核查步骤", max: MAX_REASONING },
  { key: "action", label: "下一步行动", max: MAX_ACTION },
];

/**
 * 生成学习报告。
 * 口径说明：案例得分默认使用“最佳成绩”（文档 10.3：报告默认展示最佳成绩），
 * 同时保留最近一次成绩供用户查看。
 */
export function buildReport(progress: StoredProgress, cases: CaseDefinition[]): ReportData {
  const totalCases = cases.length;
  const completedCount = countCompleted(progress.cases);

  // 已完成案例的“最佳成绩”列表
  const completedRecords = cases
    .map((c) => ({ def: c, record: progress.cases[c.id] }))
    .filter((item) => item.record && item.record.status === "completed");

  const bestScores = completedRecords
    .map((item) => item.record!.bestScore ?? item.record!.score?.total ?? 0)
    .filter((n) => typeof n === "number" && !Number.isNaN(n));

  const averageBest =
    bestScores.length > 0
      ? Math.round((bestScores.reduce((a, b) => a + b, 0) / bestScores.length) * 10) / 10
      : null;

  // 四项维度：使用已完成案例的最佳成绩所对应的维度分求和平均
  const dimensions: DimensionSummary[] = DIMENSION_META.map((meta) => {
    const values = completedRecords
      .map((item) => item.record!.score?.[meta.key])
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
    const earned =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return {
      key: meta.key,
      label: meta.label,
      max: meta.max,
      earned: Math.round(earned * 10) / 10,
      ratio: meta.max === 0 ? 0 : earned / meta.max,
    };
  });

  // 技能聚合：只统计“已完成且携带该标签”的案例
  const skills: SkillSummary[] = ALL_SKILLS.map((skill) => {
    const matched = completedRecords.filter((item) => item.def.skillTags.includes(skill));
    const sample = matched.length;
    if (sample === 0) {
      return {
        skill,
        label: SKILL_LABELS[skill],
        sample: 0,
        score: null,
        sufficient: false,
      };
    }
    const total = matched.reduce(
      (acc, item) => acc + (item.record!.bestScore ?? item.record!.score?.total ?? 0),
      0
    );
    return {
      skill,
      label: SKILL_LABELS[skill],
      sample,
      score: Math.round((total / sample) * 10) / 10,
      sufficient: sample >= MIN_SKILL_SAMPLE,
    };
  });

  const caseRows: CaseScoreRow[] = cases.map((def) => {
    const record = progress.cases[def.id];
    const lastScore = record?.score?.total ?? null;
    return {
      caseId: def.id,
      title: def.title,
      best: typeof record?.bestScore === "number" ? record.bestScore : lastScore,
      last: lastScore,
      attempts: record?.attemptCount ?? 0,
      status: record?.status ?? "locked",
    };
  });

  // 前后测（文档 6.4）
  const pre = progress.pretest;
  const post = progress.posttest;
  const prepost: PrePostSummary = (() => {
    if (!pre && !post) {
      return {
        available: false,
        preScore: null,
        postScore: null,
        delta: null,
        note: "前测与后测均尚未完成。完成两次测评后，这里会显示真实的前后测分数与变化。",
      };
    }
    if (!pre || !post) {
      const missing = !pre ? "前测" : "后测";
      return {
        available: false,
        preScore: pre ? pre.score : null,
        postScore: post ? post.score : null,
        delta: null,
        note: `${missing}尚未完成，暂不显示前后测对比，也不会用 0 分代替未完成成绩。`,
      };
    }
    return {
      available: true,
      preScore: pre.score,
      postScore: post.score,
      delta: post.score - pre.score,
      note: "该变化反映本次模拟训练中的答题表现，不构成严格实验结论。",
    };
  })();

  const { strengths, suggestions, weakSkills } = buildStrengthsAndSuggestions(
    completedCount,
    dimensions,
    skills,
    completedRecords.map((item) => ({
      def: item.def,
      score: item.record!.score,
      confidence: item.record!.confidence,
      verdict: item.record!.verdict,
      standard: item.def.verdict,
    }))
  );

  const recommendedCaseIds = recommendCases(weakSkills, cases);

  return {
    completedCount,
    totalCases,
    averageBest,
    dimensions,
    skills,
    caseRows,
    prepost,
    strengths,
    suggestions,
    weakSkills,
    recommendedCaseIds,
    hasData: completedCount > 0 || Boolean(pre) || Boolean(post),
  };
}

interface CompletedCaseForAdvice {
  def: CaseDefinition;
  score?: CaseScoreBreakdown;
  confidence?: number;
  verdict?: CaseDefinition["verdict"];
  standard: CaseDefinition["verdict"];
}

/**
 * 两条优势 + 两条建议：完全由真实得分/错误模式生成，不随机。
 */
function buildStrengthsAndSuggestions(
  completedCount: number,
  dimensions: DimensionSummary[],
  skills: SkillSummary[],
  completed: CompletedCaseForAdvice[]
): { strengths: string[]; suggestions: string[]; weakSkills: SkillTag[] } {
  if (completedCount === 0) {
    return {
      strengths: [],
      suggestions: [
        "还没有已完成的案例。建议从 C01 开始，完整走一遍“查看证据 → 加入证据链 → 完成核查步骤 → 提交结论”。",
        "开始前可以先做一次前测，建立你自己的基线。",
      ],
      weakSkills: [],
    };
  }

  const strengths: string[] = [];
  const suggestions: string[] = [];

  // 优势 1：得分率最高的维度
  const dimSorted = [...dimensions].sort((a, b) => b.ratio - a.ratio);
  const best = dimSorted[0];
  if (best && best.ratio >= 0.7) {
    strengths.push(
      `${best.label}表现稳定：已完成案例中平均拿到 ${best.earned} / ${best.max} 分（约 ${Math.round(
        best.ratio * 100
      )}%）。`
    );
  }

  // 优势 2：结论正确比例 / 证据命中率
  const correctVerdict = completed.filter((c) => c.verdict === c.standard).length;
  const correctRatio = completed.length === 0 ? 0 : correctVerdict / completed.length;
  if (correctRatio >= 0.6) {
    strengths.push(
      `结论判断准确：${completed.length} 个已完成案例中有 ${correctVerdict} 个与标准结论一致（${Math.round(
        correctRatio * 100
      )}%）。`
    );
  } else if (strengths.length === 0) {
    const enough = skills.filter((s) => s.sufficient).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (enough.length > 0 && enough[0].score !== null) {
      strengths.push(`${enough[0].label}类案例平均 ${enough[0].score} 分，是当前相对扎实的方向。`);
    } else {
      strengths.push("你已完成至少一例完整核查流程，具备继续训练的基础。");
    }
  }
  if (strengths.length < 2) {
    strengths.push(
      "你已完整走过“主张 → 证据 → 步骤 → 结论 → 行动”的核查闭环，这是后续提升的前提。"
    );
  }

  // 建议 1：得分率最低的维度
  const worst = dimSorted[dimSorted.length - 1];
  if (worst && worst.ratio < 0.7) {
    suggestions.push(dimensionAdvice(worst));
  }

  // 建议 2：信心校准或技能短板
  const overconfident = completed.filter(
    (c) => (c.confidence ?? 50) >= 70 && c.verdict !== c.standard
  ).length;
  if (overconfident > 0) {
    suggestions.push(
      `有 ${overconfident} 个案例在你把握 ≥70% 时结论与标准答案不一致。下一次可以先补齐关键证据，再决定把握程度。`
    );
  } else {
    const weak = skills
      .filter((s) => s.score !== null)
      .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0];
    if (weak && (weak.score ?? 100) < 85) {
      suggestions.push(
        `${weak.label}类案例平均 ${weak.score} 分（样本 ${weak.sample} 个），建议重做相关案例并重点看反馈里的“遗漏证据”。`
      );
    } else {
      suggestions.push(
        "整体表现较稳。可以尝试用更高难度的正向案例（如 C08）练习“如何有依据地确认一条信息”，而不只是怀疑。"
      );
    }
  }
  if (suggestions.length < 2) {
    suggestions.push(
      "完成后测并对比前测，看哪些技能维度变化最明显；变化只代表本次模拟训练中的表现。"
    );
  }

  const weakSkills = skills
    .filter((s) => s.score !== null && (s.score as number) < 80)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .map((s) => s.skill);

  return { strengths: strengths.slice(0, 2), suggestions: suggestions.slice(0, 2), weakSkills };
}

function dimensionAdvice(d: DimensionSummary): string {
  switch (d.key) {
    case "verdict":
      return `结论判断平均 ${d.earned} / ${d.max} 分。建议提交前先问一句：“现有材料是支持、冲突、误导，还是根本不够？”——把“没查到”与“肯定是假”分开。`;
    case "evidence":
      return `证据选择平均 ${d.earned} / ${d.max} 分。建议优先找“原始来源 / 完整上下文 / 官方说明”，少依赖转发截图和评论区。`;
    case "reasoning":
      return `核查步骤平均 ${d.earned} / ${d.max} 分。建议逐条勾选核查清单：拆解主张、确认发布主体、检查时间与数据、寻找独立来源、说明证据限制。`;
    case "action":
      return `下一步行动平均 ${d.earned} / ${d.max} 分。遇到付款、扫码、个人信息或紧急要求时，默认先暂停，并用独立找到的官方渠道核验。`;
  }
}

/** 为薄弱技能推荐可重练的案例（优先未完成的挑战案例，其次最低分案例） */
function recommendCases(weakSkills: SkillTag[], cases: CaseDefinition[]): string[] {
  if (weakSkills.length === 0) return [];
  const matched = cases.filter((c) => c.skillTags.some((t) => weakSkills.includes(t)));
  return matched.slice(0, 3).map((c) => c.id);
}

/**
 * 用户测试数据说明（文档 1.5 / 6.4）
 * 本项目不内置任何虚构的试用人数、完成率或提升幅度。
 */
export const USER_TESTING_DISCLAIMER =
  "尚无用户测试数据。本页面所有分数均来自你在本机浏览器中的真实作答记录；" +
  "若后续开展试用测试，应由作者另行记录实际人数与反馈，不得在此填写估计值。";
