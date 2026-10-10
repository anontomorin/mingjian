/**
 * 明鉴 · 报告图表（原生 SVG / CSS，不引入图表库）
 */

import type { SkillSummary } from "../engine/report";
import { IconAlert } from "./Icons";

/** 技能维度横向条形图 */
export function SkillBars({ skills }: { skills: SkillSummary[] }) {
  return (
    <div role="list">
      {skills.map((s) => (
        <div className="mj-skill-row" role="listitem" key={s.skill}>
          <span style={{ fontSize: "var(--font-size-sm)" }}>{s.label}</span>
          <span className="mj-skill-row__track">
            <span
              className="mj-skill-row__fill"
              style={{
                width: `${s.score ?? 0}%`,
                background:
                  s.score === null
                    ? "var(--color-border)"
                    : s.score >= 80
                    ? "var(--color-success)"
                    : s.score >= 60
                    ? "var(--color-primary)"
                    : "var(--color-warning)",
              }}
            />
          </span>
          <span className="mj-skill-row__value">
            {s.score === null ? "—" : Math.round(s.score)}
          </span>
        </div>
      ))}
      <p className="mj-tiny" style={{ marginTop: 8 }}>
        技能得分为「已完成且携带该标签的案例」的平均分（满分 100）。
        样本少于 2 个案例时给出数值但标注样本不足，不会出现虚构分数。
      </p>
      <ul style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {skills
          .filter((s) => s.sample > 0 && !s.sufficient)
          .map((s) => (
            <li key={s.skill} className="mj-tiny" style={{ color: "var(--color-warning)" }}>
              <IconAlert size={11} /> {s.label}：仅 {s.sample} 个案例样本，还需要完成更多案例才能稳定判断。
            </li>
          ))}
      </ul>
    </div>
  );
}

/** 前后测对比图 */
export function PrePostChart({
  preScore,
  postScore,
}: {
  preScore: number;
  postScore: number;
}) {
  const width = 320;
  const height = 150;
  const pad = 26;
  const barW = 52;
  const maxV = 100;
  const y = (v: number) => height - pad - (v / maxV) * (height - pad * 2);

  return (
    <div className="mj-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img"
        aria-label={`前测 ${preScore} 分，后测 ${postScore} 分`}>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#BCCBC7" />
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad} y1={y(v)} x2={width - pad} y2={y(v)} stroke="#EEF4F2" />
            <text x={pad - 6} y={y(v) + 4} fontSize="9" textAnchor="end" fill="#687875">
              {v}
            </text>
          </g>
        ))}
        {[
          { label: "前测", value: preScore, x: pad + 40, color: "#3569A8" },
          { label: "后测", value: postScore, x: pad + 150, color: "#246B63" },
        ].map((b) => (
          <g key={b.label}>
            <rect
              x={b.x}
              y={y(b.value)}
              width={barW}
              height={height - pad - y(b.value)}
              rx="5"
              fill={b.color}
            />
            <text
              x={b.x + barW / 2}
              y={y(b.value) - 6}
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
              fill="#182C2A"
            >
              {b.value}
            </text>
            <text x={b.x + barW / 2} y={height - pad + 14} fontSize="11" textAnchor="middle" fill="#687875">
              {b.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** 案例得分条形列表 */
export function CaseScoreBars({
  rows,
}: {
  rows: Array<{ caseId: string; title: string; value: number | null }>;
}) {
  return (
    <div>
      {rows.map((r) => (
        <div key={r.caseId} style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--font-size-xs)",
              marginBottom: 3,
              gap: 8,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.caseId} · {r.title}
            </span>
            <span className="mj-mono" style={{ fontWeight: 700, flex: "none" }}>
              {r.value === null ? "未完成" : `${r.value} 分`}
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "var(--color-surface-sunken)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.value ?? 0}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  r.value === null
                    ? "transparent"
                    : r.value >= 80
                    ? "var(--color-success)"
                    : r.value >= 60
                    ? "var(--color-primary)"
                    : "var(--color-warning)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
