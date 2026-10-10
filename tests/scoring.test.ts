/**
 * 明鉴 · 评分引擎单元测试
 * 覆盖文档 7.1—7.4 的公式与第 12.1 节的边界检查。
 */

import { describe, it, expect } from "vitest";
import {
  scoreAction,
  scoreCase,
  scoreEvidence,
  scoreReasoning,
  scoreVerdict,
  validateSubmission,
  scoreQuiz,
  analyzeEvidence,
  confidenceFeedback,
  MAX_EVIDENCE,
  MAX_REASONING,
} from "../src/engine/scoring";
import { CASES, getCaseById } from "../src/data/cases";
import { PRETEST } from "../src/data/pretest";
import { POSTTEST } from "../src/data/posttest";
import type { ActionOption, CaseSubmissionInput } from "../src/types";

const options: ActionOption[] = [
  { id: "bad", label: "继续传播", points: 0, feedback: "" },
  { id: "mid", label: "标注存疑后转发", points: 5, feedback: "" },
  { id: "good", label: "暂停并独立核实", points: 10, feedback: "" },
];

function input(partial: Partial<CaseSubmissionInput>): CaseSubmissionInput {
  return {
    selectedEvidenceIds: [],
    completedChecks: [],
    confidence: 50,
    ...partial,
  };
}

describe("结论计分（30 分）", () => {
  it("与标准结论一致得 30 分", () => {
    expect(scoreVerdict("insufficient", "insufficient")).toBe(30);
  });

  it("结论不同得 0 分", () => {
    expect(scoreVerdict("contradicted", "insufficient")).toBe(0);
  });

  it("未选择结论得 0 分", () => {
    expect(scoreVerdict(undefined, "insufficient")).toBe(0);
  });

  it("acceptableLabels 中的标签同样得满分，其余不得分", () => {
    expect(scoreVerdict("supported", "insufficient", ["supported"])).toBe(30);
    expect(scoreVerdict("misleading", "insufficient", ["supported"])).toBe(0);
  });
});

describe("证据选择计分（35 分，干扰项每个 -8）", () => {
  it("全部关键证据选中且无干扰项 → 35 分", () => {
    expect(scoreEvidence(["E2", "E3"], ["E2", "E3"], ["E4"])).toBe(35);
  });

  it("命中一半关键证据 → round(35 * 0.5) = 18 分", () => {
    expect(scoreEvidence(["E2"], ["E2", "E3"], ["E4"])).toBe(18);
  });

  it("选中 1 个干扰项 → 扣 8 分", () => {
    expect(scoreEvidence(["E2", "E3", "E4"], ["E2", "E3"], ["E4"])).toBe(27);
  });

  it("分数不会低于 0", () => {
    expect(scoreEvidence(["E4"], ["E2", "E3"], ["E4"])).toBe(0);
    expect(scoreEvidence(["E4", "E5"], ["E2", "E3"], ["E4", "E5"])).toBe(0);
  });

  it("分数不会超过 35", () => {
    expect(scoreEvidence(["E2", "E3"], ["E2", "E3"], [])).toBeLessThanOrEqual(MAX_EVIDENCE);
  });

  it("同一证据重复出现不会重复计分", () => {
    expect(scoreEvidence(["E2", "E2", "E3"], ["E2", "E3"], ["E4"])).toBe(35);
  });

  it("关键证据为空时返回 0，不产生 NaN", () => {
    expect(scoreEvidence(["E1"], [], ["E4"])).toBe(0);
  });
});

describe("核查步骤计分（25 分）", () => {
  it("全部完成 → 25 分", () => {
    expect(scoreReasoning(["a", "b", "c", "d"], ["a", "b", "c", "d"])).toBe(25);
  });

  it("完成 2/4 → round(25 * 0.5) = 13 分", () => {
    expect(scoreReasoning(["a", "b"], ["a", "b", "c", "d"])).toBe(13);
  });

  it("未做任何步骤 → 0 分", () => {
    expect(scoreReasoning([], ["a", "b", "c"])).toBe(0);
  });

  it("不会超过 25 分", () => {
    expect(scoreReasoning(["a", "b", "c", "x"], ["a", "b", "c"])).toBeLessThanOrEqual(
      MAX_REASONING
    );
  });
});

describe("行动计分（10 分）", () => {
  it("选择 10 分行动 → 10 分", () => {
    expect(scoreAction("good", options)).toBe(10);
  });

  it("选择 5 分行动 → 5 分", () => {
    expect(scoreAction("mid", options)).toBe(5);
  });

  it("高风险行动 → 0 分", () => {
    expect(scoreAction("bad", options)).toBe(0);
  });

  it("未选择或无效 id → 0 分", () => {
    expect(scoreAction(undefined, options)).toBe(0);
    expect(scoreAction("nope", options)).toBe(0);
  });
});

describe("案例总分与边界", () => {
  const c01 = getCaseById("C01")!;

  it("全部正确：30 + 35 + 25 + 10 = 100", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: c01.requiredEvidenceIds,
        completedChecks: c01.requiredChecks.map((c) => c.id),
        verdict: c01.verdict,
        actionId: c01.actionOptions.find((a) => a.points === 10)!.id,
      })
    );
    expect(s).toEqual({ verdict: 30, evidence: 35, reasoning: 25, action: 10, total: 100 });
  });

  it("漏选关键证据：证据分下降，总分仍为四项之和", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: ["E2"],
        completedChecks: c01.requiredChecks.map((c) => c.id),
        verdict: c01.verdict,
        actionId: c01.actionOptions.find((a) => a.points === 10)!.id,
      })
    );
    expect(s.evidence).toBe(18);
    expect(s.total).toBe(30 + 18 + 25 + 10);
  });

  it("选择干扰证据：扣 8 分", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: [...c01.requiredEvidenceIds, "E4"],
        completedChecks: c01.requiredChecks.map((c) => c.id),
        verdict: c01.verdict,
        actionId: c01.actionOptions.find((a) => a.points === 10)!.id,
      })
    );
    expect(s.evidence).toBe(27);
    expect(s.total).toBe(92);
  });

  it("结论错误：结论 0 分", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: c01.requiredEvidenceIds,
        completedChecks: c01.requiredChecks.map((c) => c.id),
        verdict: "contradicted",
        actionId: c01.actionOptions.find((a) => a.points === 10)!.id,
      })
    );
    expect(s.verdict).toBe(0);
    expect(s.total).toBe(70);
  });

  it("行动不当（高风险）：行动 0 分", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: c01.requiredEvidenceIds,
        completedChecks: c01.requiredChecks.map((c) => c.id),
        verdict: c01.verdict,
        actionId: c01.actionOptions.find((a) => a.points === 0)!.id,
      })
    );
    expect(s.action).toBe(0);
    expect(s.total).toBe(90);
  });

  it("没有完成任何步骤：步骤 0 分", () => {
    const s = scoreCase(
      c01,
      input({
        selectedEvidenceIds: c01.requiredEvidenceIds,
        completedChecks: [],
        verdict: c01.verdict,
        actionId: c01.actionOptions.find((a) => a.points === 10)!.id,
      })
    );
    expect(s.reasoning).toBe(0);
    expect(s.total).toBe(75);
  });

  it("全空提交：总分为 0，不出现负分或 NaN", () => {
    const s = scoreCase(c01, input({}));
    expect(s.total).toBe(0);
    expect(Object.values(s).every((v) => v >= 0 && !Number.isNaN(v))).toBe(true);
  });

  it("所有案例在满分输入下都得 100 分", () => {
    CASES.forEach((c) => {
      const s = scoreCase(
        c,
        input({
          selectedEvidenceIds: c.requiredEvidenceIds,
          completedChecks: c.requiredChecks.map((x) => x.id),
          verdict: c.verdict,
          actionId: c.actionOptions.find((a) => a.points === 10)!.id,
        })
      );
      expect(s.total, `${c.id} 满分路径`).toBe(100);
    });
  });

  it("所有案例在极端输入下分数都在 0—100 之间", () => {
    CASES.forEach((c) => {
      const worst = scoreCase(
        c,
        input({
          selectedEvidenceIds: c.distractorEvidenceIds,
          completedChecks: [],
          verdict: undefined,
          actionId: c.actionOptions.find((a) => a.points === 0)!.id,
        })
      );
      expect(worst.total, `${c.id} 最低路径`).toBeGreaterThanOrEqual(0);
      expect(worst.total).toBeLessThanOrEqual(100);
      expect(worst.verdict + worst.evidence + worst.reasoning + worst.action).toBe(worst.total);
    });
  });
});

describe("提交校验（文档 4.5）", () => {
  it("缺少结论与行动时不允许提交", () => {
    const r = validateSubmission(input({}));
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["verdict", "action"]);
  });

  it("只缺行动时不允许提交", () => {
    const r = validateSubmission(input({ verdict: "supported" }));
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["action"]);
  });

  it("结论与行动齐备时允许提交（信心默认 50）", () => {
    const r = validateSubmission(input({ verdict: "supported", actionId: "good", confidence: 50 }));
    expect(r.ok).toBe(true);
  });
});

describe("证据分析（反馈用）", () => {
  const c01 = getCaseById("C01")!;

  it("正确区分命中、遗漏与干扰", () => {
    const a = analyzeEvidence(c01, ["E2", "E4"]);
    expect(a.hitRequired).toEqual(["E2"]);
    expect(a.missedRequired).toEqual(["E3"]);
    expect(a.hitDistractor).toEqual(["E4"]);
    expect(a.recall).toBeCloseTo(0.5);
  });
});

describe("信心反馈不做人格判断", () => {
  it("高信心但证据不足 → overconfident", () => {
    const f = confidenceFeedback(85, false, false);
    expect(f.tone).toBe("overconfident");
    expect(f.text).not.toMatch(/能力差|你不行|愚蠢/);
  });

  it("低信心但完全正确 → underconfident", () => {
    expect(confidenceFeedback(20, true, true).tone).toBe("underconfident");
  });

  it("高信心且正确 → good", () => {
    expect(confidenceFeedback(80, true, true).tone).toBe("good");
  });
});

describe("测评计分与百分比正确性", () => {
  it("全对 → 100 分", () => {
    const answers = Object.fromEntries(
      PRETEST.questions.map((q) => [q.id, { verdict: q.verdict, actionId: q.correctActionId }])
    );
    expect(scoreQuiz(PRETEST.questions, answers)).toBe(100);
  });

  it("只答结论不答行动 → 每题 10 分", () => {
    const answers = Object.fromEntries(
      PRETEST.questions.map((q) => [q.id, { verdict: q.verdict, actionId: "none" }])
    );
    expect(scoreQuiz(PRETEST.questions, answers)).toBe(50);
  });

  it("未作答 → 0 分，不会伪造分数", () => {
    expect(scoreQuiz(PRETEST.questions, {})).toBe(0);
  });

  it("C03：100 → 88 的实际变化为 -12%", () => {
    const pct = ((88 - 100) / 100) * 100;
    expect(Math.round(pct)).toBe(-12);
  });

  it("前测 P3：200 → 180 的实际变化为 -10%", () => {
    const pct = ((180 - 200) / 200) * 100;
    expect(Math.round(pct)).toBe(-10);
  });

  it("后测 Q3：50 → 45 的实际变化为 -10%", () => {
    const pct = ((45 - 50) / 50) * 100;
    expect(Math.round(pct)).toBe(-10);
  });

  it("前测与后测题面不同，但技能维度构成一致", () => {
    const preSkills = PRETEST.questions.map((q) => q.skill).sort();
    const postSkills = POSTTEST.questions.map((q) => q.skill).sort();
    expect(preSkills).toEqual(postSkills);

    const preText = PRETEST.questions.map((q) => q.scenario).join("|");
    const postText = POSTTEST.questions.map((q) => q.scenario).join("|");
    expect(preText).not.toBe(postText);
  });
});
