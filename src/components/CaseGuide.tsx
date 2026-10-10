/**
 * 明鉴 · 案例内分步提示条
 *
 * 显示「下一步该做什么」，随作答进度自动推进；可收起，收起后不再自动展开。
 * 只提示操作顺序，不提示答案。
 */

import type { CaseDefinition, CaseRecord } from "../types";
import { TOTAL_GUIDE_STEPS, guideStep } from "../engine/guide";
import { IconArrowRight } from "./Icons";

export function CaseGuide({
  caseDef,
  record,
  onDismiss,
}: {
  caseDef: CaseDefinition;
  record: CaseRecord;
  onDismiss: () => void;
}) {
  const step = guideStep(caseDef, record);

  return (
    <div className="mj-guidebar" role="note">
      <span className="mj-guidebar__step">
        第 {step.index} / {TOTAL_GUIDE_STEPS} 步
      </span>
      <span className="mj-guidebar__title">
        <IconArrowRight size={14} /> {step.title}
      </span>
      <span className="mj-guidebar__text">{step.text}</span>
      <button
        type="button"
        className="mj-guidebar__close"
        onClick={onDismiss}
        aria-label="收起操作提示"
      >
        收起
      </button>
    </div>
  );
}
