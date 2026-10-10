/**
 * 引导测试：确认分步提示随真实作答状态推进，且不包含任何答案线索。
 */

import { describe, expect, it } from "vitest";
import { TOTAL_GUIDE_STEPS, guideStep, isReadyToSubmit } from "../src/engine/guide";
import { CASES } from "../src/data/cases";
import type { CaseRecord } from "../src/types";

const CASE = CASES[0];

function record(patch: Partial<CaseRecord> = {}): CaseRecord {
  return {
    status: "inProgress",
    attemptCount: 0,
    selectedEvidenceIds: [],
    openedEvidenceIds: [],
    completedChecks: [],
    ...patch,
  };
}

describe("案例内分步引导", () => {
  it("从第一步开始：先看材料", () => {
    expect(guideStep(CASE, record()).index).toBe(1);
  });

  it("看过材料但没加入证据链 → 提示建证据链", () => {
    const step = guideStep(CASE, record({ openedEvidenceIds: [CASE.evidence[0].id] }));
    expect(step.index).toBe(2);
  });

  it("有证据链但步骤未完成 → 提示做核查", () => {
    const step = guideStep(
      CASE,
      record({
        openedEvidenceIds: [CASE.evidence[0].id],
        selectedEvidenceIds: [CASE.evidence[0].id],
      })
    );
    expect(step.index).toBe(3);
  });

  it("步骤完成后依次提示结论、行动、提交", () => {
    const allChecks = CASE.requiredChecks.map((c) => c.id);
    const base = {
      openedEvidenceIds: [CASE.evidence[0].id],
      selectedEvidenceIds: [CASE.evidence[0].id],
      completedChecks: allChecks,
    };
    expect(guideStep(CASE, record(base)).index).toBe(4);
    expect(guideStep(CASE, record({ ...base, verdict: "insufficient" })).index).toBe(5);
    expect(
      guideStep(CASE, record({ ...base, verdict: "insufficient", actionId: "a1" })).index
    ).toBe(6);
  });

  it("步骤总数与最大序号一致", () => {
    const allChecks = CASE.requiredChecks.map((c) => c.id);
    const step = guideStep(
      CASE,
      record({
        openedEvidenceIds: [CASE.evidence[0].id],
        selectedEvidenceIds: [CASE.evidence[0].id],
        completedChecks: allChecks,
        verdict: "insufficient",
        actionId: "a1",
      })
    );
    expect(step.index).toBe(TOTAL_GUIDE_STEPS);
  });

  it("提示文案不出现结论或证据答案", () => {
    const text = guideStep(CASE, record()).text;
    expect(text).not.toMatch(/正确|错误|关键证据|干扰|应该选/);
  });

  it("提交可用性只取决于结论与行动都已选择", () => {
    expect(isReadyToSubmit(record())).toBe(false);
    expect(isReadyToSubmit(record({ verdict: "insufficient" }))).toBe(false);
    expect(isReadyToSubmit(record({ verdict: "insufficient", actionId: "a3" }))).toBe(true);
  });
});
