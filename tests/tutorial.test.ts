/**
 * 明鉴 · 独立引导关的单元测试
 * 覆盖：引导关数据完整性、步骤推进逻辑、提交门槛。
 */

import { describe, it, expect } from "vitest";
import { TUTORIAL_CASE } from "../src/data/tutorial";
import { CASES } from "../src/data/cases";
import { validateCase } from "../src/engine/validation";
import { scoreCase } from "../src/engine/scoring";
import {
  createTutorialState,
  tutorialStepIndex,
  isTutorialStepUnlocked,
  canSubmitTutorial,
  TUTORIAL_STEPS,
  TUTORIAL_MIN_OPENED,
  type TutorialState,
  type TutorialContext,
} from "../src/engine/tutorial";

const ctx: TutorialContext = {
  totalEvidence: TUTORIAL_CASE.evidence.length,
  totalChecks: TUTORIAL_CASE.requiredChecks.length,
};

describe("引导关数据", () => {
  it("通过案例数据校验（不产生 error 级问题）", () => {
    const issues = validateCase(TUTORIAL_CASE);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("与正式案例完全隔离：不在 CASES 中，也不占用 C01—C08 的编号", () => {
    expect(CASES.some((c) => c.id === TUTORIAL_CASE.id)).toBe(false);
    expect(TUTORIAL_CASE.id).toBe("T00");
    TUTORIAL_CASE.evidence.forEach((e) => expect(e.id.startsWith("T-")).toBe(true));
  });

  it("存在 10 分行动选项且干扰/关键证据划分清晰", () => {
    expect(TUTORIAL_CASE.actionOptions.some((a) => a.points === 10)).toBe(true);
    const overlap = TUTORIAL_CASE.requiredEvidenceIds.filter((id) =>
      TUTORIAL_CASE.distractorEvidenceIds.includes(id)
    );
    expect(overlap).toEqual([]);
    expect(TUTORIAL_CASE.distractorEvidenceIds.length).toBeGreaterThan(0);
  });

  it("满分路径可得 100 分，漏掉关键证据会失分", () => {
    const full = scoreCase(TUTORIAL_CASE, {
      selectedEvidenceIds: TUTORIAL_CASE.requiredEvidenceIds,
      completedChecks: TUTORIAL_CASE.requiredChecks.map((c) => c.id),
      verdict: TUTORIAL_CASE.verdict,
      confidence: 70,
      actionId: TUTORIAL_CASE.actionOptions.find((a) => a.points === 10)?.id,
    });
    expect(full.total).toBe(100);

    const withDistractor = scoreCase(TUTORIAL_CASE, {
      selectedEvidenceIds: [
        ...TUTORIAL_CASE.requiredEvidenceIds,
        ...TUTORIAL_CASE.distractorEvidenceIds,
      ],
      completedChecks: TUTORIAL_CASE.requiredChecks.map((c) => c.id),
      verdict: TUTORIAL_CASE.verdict,
      confidence: 70,
      actionId: TUTORIAL_CASE.actionOptions.find((a) => a.points === 10)?.id,
    });
    expect(withDistractor.evidence).toBeLessThan(full.evidence);
  });
});

describe("引导关步骤引擎", () => {
  it("初始状态停在第 1 步，后续步骤均未解锁", () => {
    const s = createTutorialState();
    expect(tutorialStepIndex(s, ctx)).toBe(0);
    expect(isTutorialStepUnlocked(0, s, ctx)).toBe(true);
    expect(isTutorialStepUnlocked(1, s, ctx)).toBe(false);
    expect(canSubmitTutorial(s, ctx)).toBe(false);
  });

  it("确认阅读主张后才解锁第 2 步", () => {
    const s: TutorialState = { ...createTutorialState(), readClaim: true };
    expect(tutorialStepIndex(s, ctx)).toBe(1);
    expect(isTutorialStepUnlocked(1, s, ctx)).toBe(true);
    expect(isTutorialStepUnlocked(2, s, ctx)).toBe(false);
  });

  it(`查看 ${TUTORIAL_MIN_OPENED} 份材料后第 2 步才算完成`, () => {
    const one: TutorialState = {
      ...createTutorialState(),
      readClaim: true,
      openedEvidenceIds: [TUTORIAL_CASE.evidence[0].id],
    };
    expect(tutorialStepIndex(one, ctx)).toBe(1);

    const two: TutorialState = {
      ...one,
      openedEvidenceIds: TUTORIAL_CASE.evidence.slice(0, TUTORIAL_MIN_OPENED).map((e) => e.id),
    };
    expect(tutorialStepIndex(two, ctx)).toBe(2);
  });

  it("加入证据链、勾选全部步骤、选结论与行动后可提交", () => {
    let s: TutorialState = {
      ...createTutorialState(),
      readClaim: true,
      openedEvidenceIds: TUTORIAL_CASE.evidence.map((e) => e.id),
      selectedEvidenceIds: [TUTORIAL_CASE.requiredEvidenceIds[0]],
      completedChecks: TUTORIAL_CASE.requiredChecks.map((c) => c.id),
      verdict: TUTORIAL_CASE.verdict,
      confidence: 65,
      actionId: TUTORIAL_CASE.actionOptions.find((a) => a.points === 10)?.id,
    };
    expect(tutorialStepIndex(s, ctx)).toBe(TUTORIAL_STEPS.length);
    expect(canSubmitTutorial(s, ctx)).toBe(true);

    // 缺少行动则不可提交
    s = { ...s, actionId: undefined };
    expect(canSubmitTutorial(s, ctx)).toBe(false);
    expect(tutorialStepIndex(s, ctx)).toBe(TUTORIAL_STEPS.length - 1);
  });

  it("步骤定义连续、序号为 1—6，且每步都有完成条件文案", () => {
    expect(TUTORIAL_STEPS).toHaveLength(6);
    TUTORIAL_STEPS.forEach((s, i) => {
      expect(s.no).toBe(i + 1);
      expect(s.hint.length).toBeGreaterThan(10);
      expect(s.requirement.length).toBeGreaterThan(2);
      expect(s.intro.length).toBeGreaterThan(5);
    });
  });
});
