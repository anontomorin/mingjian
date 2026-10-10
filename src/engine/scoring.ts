/**
 * 明鉴 · 评分引擎（纯函数）
 * 严格实现《详细开发文档》第 7 章的计分公式，不得随意更改分值。
 */

import type {
  ActionOption,
  CaseDefinition,
  CaseScoreBreakdown,
  CaseSubmissionInput,
  SkillTag,
  Verdict,
} from "../types";

/** 各维度分值上限（文档 7.1） */
export const MAX_VERDICT = 30;
export const MAX_EVIDENCE = 35;
export const MAX_REASONING = 25;
export const MAX_ACTION = 10;
export const MAX_TOTAL = 100;

/** 每选中一个干扰证据的扣分项（文档 7.2） */
export const DISTRACTOR_PENALTY = 8;

/** 结论标签定义（文档 2.1） */
export const VERDICT_LABELS: Record<Verdict, string> = {
  supported: "有证据支持",
  contradicted: "与证据冲突",
  misleading: "呈现方式存在误导",
  insufficient: "证据不足",
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  supported: "有证据支持",
  contradicted: "与证据冲突",
  misleading: "存在误导",
  insufficient: "证据不足",
};

export const VERDICT_DESCRIPTIONS: Record<Verdict, string> = {
  supported: "目前提供的来源和材料与主张相符，且来源可追溯。",
  contradicted: "可核验的材料直接与主张的关键部分冲突。",
  misleading: "材料可能真实，但标题、语境、样本、指标或图表的呈现方式会引导错误理解。",
  insufficient: "当前资料不能合理支持或推翻关键主张；应继续核实，而不是强行下结论。",
};

/** 技能维度显示名（文档 7.5） */
export const SKILL_LABELS: Record<SkillTag, string> = {
  source: "来源核查",
  context: "语境追溯",
  crossCheck: "交叉验证",
  data: "数据解读",
  aiMedia: "AI 内容辨识",
  responsibleAction: "负责任行动",
};

export const ALL_SKILLS: SkillTag[] = [
  "source",
  "context",
  "crossCheck",
  "data",
  "aiMedia",
  "responsibleAction",
];

/** 数值钳制 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * 结论计分（文档 7.4）
 * 结论与标准标签完全一致：30 分；否则 0 分。
 * 多条合理路径只能来自内容配置里的 acceptableLabels，代码不做猜测。
 */
export function scoreVerdict(
  selected: Verdict | undefined,
  standard: Verdict,
  acceptable?: Verdict[]
): number {
  if (!selected) return 0;
  if (selected === standard) return MAX_VERDICT;
  if (acceptable && acceptable.includes(selected)) return MAX_VERDICT;
  return 0;
}

/**
 * 证据选择计分（文档 7.2）
 * recall = 正确选中的关键证据数 / 关键证据总数
 * evidenceScore = clamp(round(35 * recall) - 8 * 已选干扰证据数, 0, 35)
 */
export function scoreEvidence(
  selectedEvidenceIds: string[],
  requiredEvidenceIds: string[],
  distractorEvidenceIds: string[]
): number {
  const selected = new Set(selectedEvidenceIds);
  const required = new Set(requiredEvidenceIds);

  const requiredTotal = required.size;
  if (requiredTotal === 0) return 0;

  let hit = 0;
  required.forEach((id) => {
    if (selected.has(id)) hit += 1;
  });

  let distractorCount = 0;
  new Set(distractorEvidenceIds).forEach((id) => {
    if (selected.has(id)) distractorCount += 1;
  });

  const recall = hit / requiredTotal;
  const raw = Math.round(MAX_EVIDENCE * recall) - DISTRACTOR_PENALTY * distractorCount;
  return clamp(raw, 0, MAX_EVIDENCE);
}

/**
 * 核查步骤计分（文档 7.3）
 * reasoningScore = round(25 * 已完成的关键步骤数 / 关键步骤总数)
 * 步骤必须由用户主动勾选；不在此处自动补全。
 */
export function scoreReasoning(completedChecks: string[], requiredCheckIds: string[]): number {
  const total = new Set(requiredCheckIds).size;
  if (total === 0) return 0;
  const done = new Set(completedChecks);
  let count = 0;
  new Set(requiredCheckIds).forEach((id) => {
    if (done.has(id)) count += 1;
  });
  return clamp(Math.round((MAX_REASONING * count) / total), 0, MAX_REASONING);
}

/** 行动计分（文档 7.4）：分值来自案例配置中的 points（0/5/10） */
export function scoreAction(actionId: string | undefined, options: ActionOption[]): number {
  if (!actionId) return 0;
  const found = options.find((o) => o.id === actionId);
  return found ? found.points : 0;
}

/** 完整计分：返回四项维度与总分 */
export function scoreCase(
  caseDef: CaseDefinition,
  input: CaseSubmissionInput
): CaseScoreBreakdown {
  const verdict = scoreVerdict(input.verdict, caseDef.verdict, caseDef.acceptableLabels);
  const evidence = scoreEvidence(
    input.selectedEvidenceIds,
    caseDef.requiredEvidenceIds,
    caseDef.distractorEvidenceIds
  );
  const reasoning = scoreReasoning(
    input.completedChecks,
    caseDef.requiredChecks.map((c) => c.id)
  );
  const action = scoreAction(input.actionId, caseDef.actionOptions);

  const total = clamp(verdict + evidence + reasoning + action, 0, MAX_TOTAL);
  return { verdict, evidence, reasoning, action, total };
}

/* ---------------- 反馈所需的结构化结果 ---------------- */

/**
 * 单条材料在本案中的角色。
 * 仅在提交后用于回看展示；提交前界面不得使用该结果（否则等于泄露答案）。
 */
export function evidenceRole(
  caseDef: CaseDefinition,
  evidenceId: string
): "key" | "distractor" | "neutral" {
  if (caseDef.requiredEvidenceIds.includes(evidenceId)) return "key";
  if (caseDef.distractorEvidenceIds.includes(evidenceId)) return "distractor";
  return "neutral";
}

export interface EvidenceAnalysis {
  /** 已选中的关键证据 */
  hitRequired: string[];
  /** 遗漏的关键证据 */
  missedRequired: string[];
  /** 误选的干扰证据 */
  hitDistractor: string[];
  /** 选中的中性材料（既非关键也非干扰） */
  selectedNeutral: string[];
  /** 关键证据总数 */
  requiredTotal: number;
  /** 命中率 */
  recall: number;
}

export function analyzeEvidence(
  caseDef: CaseDefinition,
  selectedEvidenceIds: string[]
): EvidenceAnalysis {
  const selected = new Set(selectedEvidenceIds);
  const required = new Set(caseDef.requiredEvidenceIds);
  const distractor = new Set(caseDef.distractorEvidenceIds);

  const hitRequired: string[] = [];
  const missedRequired: string[] = [];
  required.forEach((id) => {
    if (selected.has(id)) hitRequired.push(id);
    else missedRequired.push(id);
  });

  const hitDistractor: string[] = [];
  distractor.forEach((id) => {
    if (selected.has(id)) hitDistractor.push(id);
  });

  const selectedNeutral = Array.from(selected).filter(
    (id) => !required.has(id) && !distractor.has(id)
  );

  const requiredTotal = required.size;
  return {
    hitRequired,
    missedRequired,
    hitDistractor,
    selectedNeutral,
    requiredTotal,
    recall: requiredTotal === 0 ? 0 : hitRequired.length / requiredTotal,
  };
}

/**
 * 信心程度反馈（文档 4.6.6）
 * 只解释“信心与证据是否匹配”，不做人格判断。
 */
export function confidenceFeedback(
  confidence: number,
  evidenceHit: boolean,
  verdictCorrect: boolean
): { tone: "good" | "overconfident" | "underconfident" | "neutral"; text: string } {
  const high = confidence >= 70;
  const low = confidence <= 30;

  if (high && (!evidenceHit || !verdictCorrect)) {
    return {
      tone: "overconfident",
      text: `你给出了 ${confidence}% 的把握，但本次作答中关键证据或结论仍有缺口。把握偏高而证据不足时，建议先补齐来源与原始语境，再决定是否提高确定程度——这不是能力问题，而是核查节奏问题。`,
    };
  }
  if (low && evidenceHit && verdictCorrect) {
    return {
      tone: "underconfident",
      text: `你的把握只有 ${confidence}%，但这次证据选择和结论都站得住。证据充分时，可以更有依据地表达自己的判断，同时说明判断依据。`,
    };
  }
  if (high && evidenceHit && verdictCorrect) {
    return {
      tone: "good",
      text: `${confidence}% 的把握与本次证据情况相匹配：你找到了关键材料，也作出了与证据一致的结论。在真实场景中，仍然建议保留原始链接，便于他人复核。`,
    };
  }
  return {
    tone: "neutral",
    text: `你给出的把握是 ${confidence}%。中等把握本身是合理的：当证据还不完整时，把结论表达为“目前看起来……还需要确认……”往往比给出确定结论更可靠。`,
  };
}

/** 校验一次提交是否满足提交条件（文档 4.5） */
export function validateSubmission(
  input: CaseSubmissionInput
): { ok: boolean; missing: Array<"verdict" | "action"> } {
  const missing: Array<"verdict" | "action"> = [];
  if (!input.verdict) missing.push("verdict");
  if (!input.actionId) missing.push("action");
  return { ok: missing.length === 0, missing };
}

/** 测评计分（文档 6.1）：每题 10 分结论 + 10 分行动，共 5 题 100 分 */
export function scoreQuiz(
  questions: Array<{ id: string; verdict: Verdict; correctActionId: string; actionOptions: ActionOption[] }>,
  answers: Record<string, { verdict: Verdict; actionId: string }>
): number {
  let total = 0;
  questions.forEach((q) => {
    const a = answers[q.id];
    if (!a) return;
    if (a.verdict === q.verdict) total += 10;
    const opt = q.actionOptions.find((o) => o.id === a.actionId);
    if (opt && opt.id === q.correctActionId) total += 10;
  });
  return clamp(total, 0, 100);
}

/** 测评按技能维度聚合：返回 技能 -> {correct, total} */
export function quizSkillBreakdown(
  questions: Array<{ id: string; verdict: Verdict; skill: SkillTag }>,
  answers: Record<string, { verdict: Verdict; actionId: string }>
): Record<SkillTag, { correct: number; total: number }> {
  const result = {} as Record<SkillTag, { correct: number; total: number }>;
  questions.forEach((q) => {
    if (!result[q.skill]) result[q.skill] = { correct: 0, total: 0 };
    result[q.skill].total += 1;
    const a = answers[q.id];
    if (a && a.verdict === q.verdict) result[q.skill].correct += 1;
  });
  return result;
}
