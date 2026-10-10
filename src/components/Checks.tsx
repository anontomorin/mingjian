/**
 * 明鉴 · 核查清单 / 结论选择 / 信心滑块 / 行动选择
 */

import type { ActionOption, RequiredCheck, Verdict } from "../types";
import { VERDICT_DESCRIPTIONS, VERDICT_LABELS } from "../engine/scoring";
import { seededShuffle } from "../engine/shuffle";
import { IconCheck } from "./Icons";

/* ---------------- 核查清单 ---------------- */

export function CheckList({
  checks,
  completedChecks,
  openedEvidenceIds,
  onToggle,
}: {
  checks: RequiredCheck[];
  completedChecks: string[];
  openedEvidenceIds: string[];
  onToggle: (checkId: string) => void;
}) {
  return (
    <div role="group" aria-label="核查步骤清单">
      {checks.map((check) => {
        const done = completedChecks.includes(check.id);
        const needsEvidence =
          check.unlockOnEvidenceOpened &&
          !openedEvidenceIds.includes(check.unlockOnEvidenceOpened);
        return (
          <div key={check.id} className={`mj-check${done ? " mj-check--done" : ""}`}>
            <span className="mj-check__box" aria-hidden="true">
              <IconCheck size={14} />
            </span>
            <button
              type="button"
              className="mj-check__label"
              aria-pressed={done}
              onClick={() => onToggle(check.id)}
            >
              {check.label}
              <span className="mj-check__lock">
                {done ? (
                  <>✓ 已完成：{check.feedback}</>
                ) : needsEvidence ? (
                  <>提示：先查看对应证据材料的详情，再回来勾选。</>
                ) : (
                  <>未勾选。完成核查动作后请手动勾选。</>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- 结论选择 ---------------- */

const VERDICT_ORDER: Verdict[] = ["supported", "contradicted", "misleading", "insufficient"];

export function VerdictSelector({
  value,
  onChange,
  disabled,
  errorId,
  seed = "verdict",
}: {
  value?: Verdict;
  onChange: (v: Verdict) => void;
  disabled?: boolean;
  errorId?: string;
  /** 打乱选项顺序用的种子：同一案例/题目顺序固定，避免「正确项总在同一位置」 */
  seed?: string;
}) {
  const ordered = seededShuffle(VERDICT_ORDER, seed);
  return (
    <div
      className="mj-option-list"
      role="radiogroup"
      aria-label="选择结论"
      aria-describedby={errorId}
    >
      {ordered.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          className="mj-option"
          disabled={disabled}
          onClick={() => onChange(v)}
        >
          <span className="mj-option__radio" aria-hidden="true" />
          <span className="mj-option__text">
            <span className="mj-option__title">{VERDICT_LABELS[v]}</span>
            <span className="mj-option__desc" style={{ display: "block" }}>
              {VERDICT_DESCRIPTIONS[v]}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- 信心滑块 ---------------- */

export function ConfidenceSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mj-slider__row">
        <label htmlFor="mj-confidence" className="mj-small mj-muted">
          我对当前结论的把握
        </label>
        <span className="mj-slider__value" aria-live="polite">
          {value}%
        </span>
      </div>
      <input
        id="mj-confidence"
        className="mj-slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--slider-pct" as string]: `${value}%` }}
        aria-valuetext={`${value}%`}
      />
      <div className="mj-slider__scale" aria-hidden="true">
        <span>0% 完全没有把握</span>
        <span>50%</span>
        <span>100% 完全确定</span>
      </div>
    </div>
  );
}

/* ---------------- 行动选择 ---------------- */

export function ActionSelector({
  options,
  value,
  onChange,
  disabled,
  errorId,
  seed = "action",
}: {
  options: ActionOption[];
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  errorId?: string;
  /** 打乱选项顺序用的种子：同一案例/题目顺序固定 */
  seed?: string;
}) {
  // 打乱顺序：不给「最后一个总是最稳妥」这类位置线索
  const ordered = seededShuffle(options, seed);
  return (
    <div
      className="mj-option-list"
      role="radiogroup"
      aria-label="选择下一步行动"
      aria-describedby={errorId}
    >
      {ordered.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          className="mj-option"
          disabled={disabled}
          onClick={() => onChange(opt.id)}
        >
          <span className="mj-option__radio" aria-hidden="true" />
          <span className="mj-option__text">
            <span className="mj-option__title">{opt.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
