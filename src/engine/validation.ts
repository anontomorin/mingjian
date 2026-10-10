/**
 * 明鉴 · 数据校验（纯函数）
 * 文档 11.5：案例缺少证据 ID、标准标签或行动分值时，开发时校验并在控制台指出具体 caseId；
 * 正式 UI 不显示原始错误堆栈。
 */

import type { CaseDefinition, QuizForm, Verdict } from "../types";

export interface ValidationIssue {
  caseId: string;
  message: string;
  level: "error" | "warn";
}

const VALID_VERDICTS: Verdict[] = ["supported", "contradicted", "misleading", "insufficient"];

/** 校验单个案例定义的完整性 */
export function validateCase(def: CaseDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (message: string, level: ValidationIssue["level"] = "error") =>
    issues.push({ caseId: def.id, message, level });

  if (!def.id) push("缺少 id");
  if (!def.title) push("缺少标题");

  // 证据
  const evidenceIds = def.evidence.map((e) => e.id);
  if (new Set(evidenceIds).size !== evidenceIds.length) push("证据 ID 重复");
  if (evidenceIds.length === 0) push("没有任何证据条目");

  def.evidence.forEach((e) => {
    if (!e.fullContent || !e.summary) push(`证据 ${e.id} 缺少摘要或详情正文`);
    if (!e.canSupport?.length || !e.cannotProve?.length)
      push(`证据 ${e.id} 缺少“能支持什么 / 不能证明什么”`, "warn");
  });

  // 关键证据 / 干扰证据
  def.requiredEvidenceIds.forEach((id) => {
    if (!evidenceIds.includes(id)) push(`关键证据 ${id} 不存在于证据列表`);
  });
  def.distractorEvidenceIds.forEach((id) => {
    if (!evidenceIds.includes(id)) push(`干扰证据 ${id} 不存在于证据列表`);
  });
  const overlap = def.requiredEvidenceIds.filter((id) => def.distractorEvidenceIds.includes(id));
  if (overlap.length > 0) push(`以下 ID 同时被标记为关键与干扰：${overlap.join("、")}`);

  // 标准结论
  if (!VALID_VERDICTS.includes(def.verdict)) push("标准结论标签不合法");
  def.acceptableLabels?.forEach((v) => {
    if (!VALID_VERDICTS.includes(v)) push(`acceptableLabels 含非法标签 ${v}`);
  });

  // 核查步骤
  if (def.requiredChecks.length < 3 || def.requiredChecks.length > 5)
    push(`核查步骤应为 3—5 项，当前 ${def.requiredChecks.length} 项`, "warn");
  const checkIds = def.requiredChecks.map((c) => c.id);
  if (new Set(checkIds).size !== checkIds.length) push("核查步骤 ID 重复");

  // 行动选项
  if (def.actionOptions.length !== 3) push("行动选项应为 3 个", "warn");
  const validPoints = [0, 5, 10];
  def.actionOptions.forEach((a) => {
    if (!validPoints.includes(a.points)) push(`行动 ${a.id} 的分值 ${a.points} 不在 0/5/10 内`);
  });
  if (!def.actionOptions.some((a) => a.points === 10))
    push("没有任何 10 分行动选项，用户无法拿到行动满分");

  // 反馈内容
  if (!def.answerExplanation) push("缺少结论解释");
  if (!def.reasoningPath?.length) push("缺少建议核查路径");
  if (!def.takeaway) push("缺少可迁移原则");

  return issues;
}

/** 批量校验，并把问题输出到控制台（仅开发期） */
export function validateCases(cases: CaseDefinition[]): ValidationIssue[] {
  const all: ValidationIssue[] = [];
  cases.forEach((c) => all.push(...validateCase(c)));
  if (all.length > 0) {
    // eslint-disable-next-line no-console
    console.warn("[明鉴] 案例数据校验发现问题：");
    all.forEach((i) => {
      // eslint-disable-next-line no-console
      console.warn(`  · [${i.level}] ${i.caseId}: ${i.message}`);
    });
  }
  return all;
}

/** 校验测评卷 */
export function validateQuiz(form: QuizForm): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (message: string, level: ValidationIssue["level"] = "error") =>
    issues.push({ caseId: form.formId, message, level });

  if (form.questions.length !== 5) push(`测评题应为 5 题，当前 ${form.questions.length} 题`, "warn");
  form.questions.forEach((q) => {
    if (!VALID_VERDICTS.includes(q.verdict)) push(`${q.id} 的标准结论不合法`);
    if (!q.actionOptions.some((o) => o.id === q.correctActionId))
      push(`${q.id} 的 correctActionId 不在行动选项中`);
    if (!q.actionOptions.some((o => o.points === 10)))
      push(`${q.id} 没有 10 分行动选项`, "warn");
    const ids = q.actionOptions.map((o) => o.id);
    if (new Set(ids).size !== ids.length) push(`${q.id} 的行动选项 ID 重复`);
  });
  return issues;
}
