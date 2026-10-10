/**
 * 明鉴 · 进度环与进度条（原生 SVG）
 */

import { IconCheck } from "./Icons";

/** 进度环 */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const ratio = max === 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label ?? "进度"}：${value} / ${max}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E7EFEC"
        strokeWidth="9"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#246B63"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 - 1}
        textAnchor="middle"
        fontSize={size * 0.26}
        fontWeight="700"
        fill="#182C2A"
        fontFamily="var(--font-mono)"
      >
        {label ?? `${Math.round(ratio * 100)}%`}
      </text>
      {sublabel ? (
        <text
          x={size / 2}
          y={size / 2 + size * 0.2}
          textAnchor="middle"
          fontSize={size * 0.13}
          fill="#687875"
        >
          {sublabel}
        </text>
      ) : null}
    </svg>
  );
}

/** 水平进度条 */
export function ProgressBar({
  value,
  max = 100,
  ariaLabel,
}: {
  value: number;
  max?: number;
  ariaLabel: string;
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: "var(--color-surface-sunken)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "var(--color-primary)",
          borderRadius: 999,
          transition: "width var(--motion-slow) var(--ease-out)",
        }}
      />
    </div>
  );
}

/** 步骤指示：已完成 / 当前 / 未完成（不只靠颜色，带对勾图标） */
export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: "var(--font-size-xs)" }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            className={`mj-tag ${done ? "mj-tag--success" : active ? "mj-tag--primary" : ""}`}
            aria-current={active ? "step" : undefined}
          >
            {done ? <IconCheck size={12} /> : null}
            {s}
          </li>
        );
      })}
    </ol>
  );
}
