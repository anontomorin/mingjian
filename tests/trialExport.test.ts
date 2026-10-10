/**
 * 试用导出测试：验证脱敏边界（不导出作答文本/身份信息）与统计口径。
 */

import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_KIND,
  SNAPSHOT_VERSION,
  buildTrialSnapshot,
  serializeTrialSnapshot,
  snapshotFileName,
} from "../src/engine/trialExport";
import { createDefaultProgress } from "../src/storage/progressStore";
import { CASES } from "../src/data/cases";
import { PRETEST } from "../src/data/pretest";
import { POSTTEST } from "../src/data/posttest";
import type { StoredProgress } from "../src/types";

const FORMS = { pre: PRETEST, post: POSTTEST };

function progressWithCompleted(): StoredProgress {
  const base = createDefaultProgress();
  base.pretest = {
    formId: "A",
    answers: Object.fromEntries(
      PRETEST.questions.map((q) => [q.id, { verdict: q.verdict, actionId: q.correctActionId }])
    ),
    score: 100,
    completedAt: "2026-01-01T00:00:00.000Z",
  };
  base.posttest = {
    formId: "B",
    answers: Object.fromEntries(
      POSTTEST.questions.map((q) => [q.id, { verdict: q.verdict, actionId: q.correctActionId }])
    ),
    score: 90,
    completedAt: "2026-01-02T00:00:00.000Z",
  };
  base.cases = {
    C01: {
      status: "completed",
      attemptCount: 1,
      selectedEvidenceIds: [],
      openedEvidenceIds: [],
      completedChecks: [],
      score: { verdict: 30, evidence: 35, reasoning: 25, action: 10, total: 100 },
      bestScore: 100,
    },
  };
  return base;
}

describe("试用快照", () => {
  it("新用户导出：分数为 null，不记作 0 分", () => {
    const snap = buildTrialSnapshot(createDefaultProgress(), CASES, FORMS);
    expect(snap.kind).toBe(SNAPSHOT_KIND);
    expect(snap.snapshotVersion).toBe(SNAPSHOT_VERSION);
    expect(snap.completedCases).toBe(0);
    expect(snap.averageBest).toBeNull();
    expect(snap.pretest.completed).toBe(false);
    expect(snap.pretest.score).toBeNull();
    expect(snap.posttest.score).toBeNull();
    expect(snap.delta).toBeNull();
  });

  it("已完成样本：总分、维度与前后测变化均来自真实记录", () => {
    const snap = buildTrialSnapshot(progressWithCompleted(), CASES, FORMS);
    expect(snap.completedCases).toBe(1);
    expect(snap.averageBest).toBe(100);
    expect(snap.pretest.score).toBe(100);
    expect(snap.posttest.score).toBe(90);
    expect(snap.delta).toBe(-10);
    const verdictDim = snap.dimensions.find((d) => d.key === "verdict");
    expect(verdictDim?.earned).toBe(30);
  });

  it("只有前测、没有后测时，变化值为 null 而非负分", () => {
    const p = progressWithCompleted();
    p.posttest = undefined;
    const snap = buildTrialSnapshot(p, CASES, FORMS);
    expect(snap.pretest.score).toBe(100);
    expect(snap.posttest.completed).toBe(false);
    expect(snap.delta).toBeNull();
  });

  it("导出内容不含任何作答文本或个人身份信息", () => {
    const snap = buildTrialSnapshot(progressWithCompleted(), CASES, FORMS);
    const text = serializeTrialSnapshot(snap);
    expect(() => JSON.parse(text)).not.toThrow();
    // 不应出现题干、案例主张、证据内容等自由文本，也不含身份字段
    expect(text).not.toContain(PRETEST.questions[0].scenario.slice(0, 10));
    expect(text).not.toContain(CASES[0].claim.text.slice(0, 10));
    expect(text).not.toContain(CASES[0].evidence[0].summary.slice(0, 10));
    expect(text).not.toMatch(/身份证|姓名|手机|邮箱|微信号|nickname|userId|deviceId/);
    const keys = Object.keys(JSON.parse(text) as Record<string, unknown>);
    expect(keys).toEqual(
      expect.arrayContaining([
        "kind",
        "snapshotVersion",
        "exportedAt",
        "demoMode",
        "completedCases",
        "pretest",
        "posttest",
        "delta",
      ])
    );
  });

  it("演示模式被标记，便于汇总时区分", () => {
    const p = createDefaultProgress();
    p.demoMode = true;
    const snap = buildTrialSnapshot(p, CASES, FORMS);
    expect(snap.demoMode).toBe(true);
  });

  it("文件名带时间戳且为合法 json 文件名", () => {
    const name = snapshotFileName(new Date("2026-03-05T09:08:00"));
    expect(name).toBe("mingjian-trial-20260305-0908.json");
  });
});
