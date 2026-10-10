/**
 * 明鉴 · 解锁、报告聚合与存档校验的单元测试
 */

import { describe, it, expect } from "vitest";
import { resolveCaseStatus, countCompleted, nextStep } from "../src/engine/progression";
import { buildReport } from "../src/engine/report";
import { validateCases, validateQuiz } from "../src/engine/validation";
import { createDefaultProgress, loadProgress, saveProgress } from "../src/storage/progressStore";
import { CASES } from "../src/data/cases";
import { PRETEST } from "../src/data/pretest";
import { POSTTEST } from "../src/data/posttest";
import type { CaseRecord, StoredProgress } from "../src/types";

function progressWith(completedIds: string[]): StoredProgress {
  const cases: Record<string, CaseRecord> = {};
  completedIds.forEach((id) => {
    cases[id] = {
      status: "completed",
      attemptCount: 1,
      selectedEvidenceIds: [],
      openedEvidenceIds: [],
      completedChecks: [],
      verdict: "supported",
      confidence: 60,
      actionId: "a1",
      score: { verdict: 30, evidence: 35, reasoning: 25, action: 10, total: 100 },
      bestScore: 100,
    };
  });
  return { ...createDefaultProgress(), cases };
}

describe("任务解锁（文档 3.2）", () => {
  it("新用户：C01 可进入，其余锁定", () => {
    const p = createDefaultProgress();
    expect(resolveCaseStatus(0, "C01", p).status).toBe("available");
    expect(resolveCaseStatus(1, "C02", p).status).toBe("locked");
    expect(resolveCaseStatus(2, "C03", p).status).toBe("locked");
  });

  it("完成 1 个案例：C02 解锁，C03 仍锁定", () => {
    const p = progressWith(["C01"]);
    expect(resolveCaseStatus(1, "C02", p).status).toBe("available");
    expect(resolveCaseStatus(2, "C03", p).status).toBe("locked");
  });

  it("完成 2 个案例：其余全部解锁（不会被永久卡住）", () => {
    const p = progressWith(["C01", "C02"]);
    CASES.forEach((c, i) => {
      if (i === 0 || i === 1) return;
      expect(resolveCaseStatus(i, c.id, p).status, c.id).not.toBe("locked");
    });
  });

  it("演示模式开放全部案例", () => {
    const p = { ...createDefaultProgress(), demoMode: true };
    CASES.forEach((c, i) => {
      expect(resolveCaseStatus(i, c.id, p).status, c.id).not.toBe("locked");
    });
  });

  it("已完成的案例不会因为解锁规则回退状态", () => {
    const p = progressWith(["C05"]);
    expect(resolveCaseStatus(4, "C05", p).status).toBe("completed");
  });

  it("锁定原因文案可读", () => {
    const p = createDefaultProgress();
    const r = resolveCaseStatus(3, "C04", p);
    expect(r.status).toBe("locked");
    expect(r.reason).toBeTruthy();
  });

  it("统计完成数与下一步建议", () => {
    expect(countCompleted(progressWith(["C01", "C02"]).cases)).toBe(2);

    // 新用户：先做前测
    expect(nextStep(createDefaultProgress()).route).toBe("/assessment/pre");

    // 已做前测、未完成全部案例：继续任务地图
    const p = progressWith(["C01"]);
    p.pretest = { formId: "A", answers: {}, score: 50, completedAt: new Date().toISOString() };
    expect(nextStep(p).route).toBe("/missions");

    // 8 个案例全部完成但未做后测：去完成后测
    const all = progressWith(CASES.map((c) => c.id));
    all.pretest = { formId: "A", answers: {}, score: 50, completedAt: new Date().toISOString() };
    expect(nextStep(all).route).toBe("/assessment/post");

    // 全部完成：查看报告
    all.posttest = { formId: "B", answers: {}, score: 70, completedAt: new Date().toISOString() };
    expect(nextStep(all).route).toBe("/report");
  });
});

describe("报告聚合（文档 7.5）", () => {
  it("无数据时显示为空，不伪造分数", () => {
    const r = buildReport(createDefaultProgress(), CASES);
    expect(r.hasData).toBe(false);
    expect(r.completedCount).toBe(0);
    expect(r.averageBest).toBeNull();
    expect(r.prepost.available).toBe(false);
    expect(r.prepost.preScore).toBeNull();
    expect(r.prepost.postScore).toBeNull();
    expect(r.prepost.delta).toBeNull();
  });

  it("只完成前测时，不显示错误的对比结果", () => {
    const p = createDefaultProgress();
    p.pretest = { formId: "A", answers: {}, score: 60, completedAt: new Date().toISOString() };
    const r = buildReport(p, CASES);
    expect(r.prepost.available).toBe(false);
    expect(r.prepost.preScore).toBe(60);
    expect(r.prepost.postScore).toBeNull();
    expect(r.prepost.delta).toBeNull();
    expect(r.prepost.note).toContain("后测尚未完成");
  });

  it("两次测评都完成时给出真实差值", () => {
    const p = createDefaultProgress();
    p.pretest = { formId: "A", answers: {}, score: 60, completedAt: new Date().toISOString() };
    p.posttest = { formId: "B", answers: {}, score: 80, completedAt: new Date().toISOString() };
    const r = buildReport(p, CASES);
    expect(r.prepost.available).toBe(true);
    expect(r.prepost.delta).toBe(20);
    expect(r.prepost.note).toContain("不构成严格实验结论");
  });

  it("案例平均分为已完成案例最佳成绩的平均值", () => {
    const p = progressWith(["C01", "C02"]);
    p.cases["C02"].bestScore = 80;
    p.cases["C02"].score = { verdict: 30, evidence: 27, reasoning: 13, action: 10, total: 80 };
    const r = buildReport(p, CASES);
    expect(r.averageBest).toBe(90);
  });

  it("技能样本不足时给出提示，且不返回虚构分数", () => {
    const p = progressWith(["C01"]);
    const r = buildReport(p, CASES);
    const source = r.skills.find((s) => s.skill === "source")!;
    expect(source.sample).toBe(1);
    expect(source.sufficient).toBe(false);
    const data = r.skills.find((s) => s.skill === "data")!;
    expect(data.sample).toBe(0);
    expect(data.score).toBeNull();
  });

  it("优势与建议基于真实数据生成，且各不超过 2 条", () => {
    const p = progressWith(["C01", "C02"]);
    const r = buildReport(p, CASES);
    expect(r.strengths.length).toBeLessThanOrEqual(2);
    expect(r.suggestions.length).toBeLessThanOrEqual(2);
    expect(r.strengths.length).toBeGreaterThan(0);
  });
});

describe("案例与测评数据完整性（文档 12.2）", () => {
  it("8 个案例均无校验错误", () => {
    const issues = validateCases(CASES).filter((i) => i.level === "error");
    expect(issues).toEqual([]);
  });

  it("每个案例都有 4 条证据、3—5 个步骤、3 个行动选项", () => {
    CASES.forEach((c) => {
      expect(c.evidence.length, c.id).toBe(4);
      expect(c.requiredChecks.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.requiredChecks.length, c.id).toBeLessThanOrEqual(5);
      expect(c.actionOptions.length, c.id).toBe(3);
    });
  });

  it("每个案例都有标准答案、解释、建议路径、带走的原则与来源说明", () => {
    CASES.forEach((c) => {
      expect(c.verdict, c.id).toBeTruthy();
      expect(c.answerExplanation.length, c.id).toBeGreaterThan(20);
      expect(c.reasoningPath.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.takeaway.length, c.id).toBeGreaterThan(10);
      expect(c.sourceNotes.length, c.id).toBeGreaterThan(0);
      expect(c.isSimulation, c.id).toBe(true);
    });
  });

  it("每条证据都说明了能支持什么与不能证明什么", () => {
    CASES.forEach((c) =>
      c.evidence.forEach((e) => {
        expect(e.canSupport.length, `${c.id}/${e.id}`).toBeGreaterThan(0);
        expect(e.cannotProve.length, `${c.id}/${e.id}`).toBeGreaterThan(0);
      })
    );
  });

  it("案例 ID 与顺序完整", () => {
    expect(CASES.map((c) => c.id)).toEqual([
      "C01",
      "C02",
      "C03",
      "C04",
      "C05",
      "C06",
      "C07",
      "C08",
    ]);
  });

  it("前后测各 5 题且无校验错误", () => {
    expect(validateQuiz(PRETEST)).toEqual([]);
    expect(validateQuiz(POSTTEST)).toEqual([]);
    expect(PRETEST.questions.length).toBe(5);
    expect(POSTTEST.questions.length).toBe(5);
  });
});

describe("本地存档（文档 8.4 / 8.5）", () => {
  it("无 window 环境下加载返回默认状态且标记为不可用", () => {
    const r = loadProgress();
    expect(r.health).toBe("unavailable");
    expect(r.progress.schemaVersion).toBe(1);
    expect(r.progress.cases).toEqual({});
  });

  it("写入失败时返回明确提示，不抛错", () => {
    const r = saveProgress(createDefaultProgress());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBeTruthy();
  });
});
