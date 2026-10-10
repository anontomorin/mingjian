/**
 * 明鉴 · 个人学习报告
 * 文档 7.5：案例表现、四项维度、技能汇总、前后测变化、两条优势与两条建议。
 * 所有数字来自真实存档；未完成的测验不显示为 0 分。
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { CASES } from "../data/cases";
import { PRETEST } from "../data/pretest";
import { POSTTEST } from "../data/posttest";
import { downloadTrialSnapshot } from "../storage/trialDownload";
import { buildReport, USER_TESTING_DISCLAIMER } from "../engine/report";
import { SKILL_LABELS } from "../engine/scoring";
import { SkillBars, PrePostChart, CaseScoreBars } from "../components/ReportCharts";
import { ProgressRing } from "../components/ProgressBar";
import { ClearProgressDialog, EmptyState } from "../components/EmptyState";
import {
  IconArrowRight,
  IconRefresh,
  IconAlert,
  IconInfo,
  IconCheck,
  SkillIcon,
} from "../components/Icons";

export function ReportPage() {
  const { progress, resetAll } = useProgress();
  const navigate = useNavigate();
  const report = buildReport(progress, CASES);
  const [clearOpen, setClearOpen] = useState(false);
  const [scoreMode, setScoreMode] = useState<"best" | "last">("best");
  const [exportNote, setExportNote] = useState<{ ok: boolean; text: string } | null>(null);

  const handleExport = () => {
    const result = downloadTrialSnapshot(progress, CASES, { pre: PRETEST, post: POSTTEST });
    setExportNote({ ok: result.ok, text: result.message });
  };

  return (
    <div className="mj-page mj-anim-page">
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p className="mj-eyebrow">步骤 5 · 回顾</p>
          <h1 className="mj-h1" style={{ fontSize: "var(--font-size-2xl)" }}>
            我的学习报告
          </h1>
          <p className="mj-lede" style={{ marginTop: 6 }}>
            报告只包含你在本机浏览器中的真实作答记录。没有完成的测验不会显示为 0 分；
            没有开展过的用户测试不会出现在报告里。
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="mj-btn mj-btn--ghost mj-btn--sm"
            onClick={() => setClearOpen(true)}
          >
            清空本机记录
          </button>
          <Link className="mj-btn mj-btn--secondary mj-btn--sm" to="/missions">
            继续训练
          </Link>
        </div>
      </header>

      {!report.hasData ? (
        <div style={{ marginTop: "var(--space-6)" }}>
          <EmptyState
            title="还没有任何记录"
            description="完成一次前测，或完成第一个案例后，这里就会显示你的真实数据。"
            action={
              <Link className="mj-btn mj-btn--primary" to="/">
                回到调查室开始 <IconArrowRight size={16} />
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* 总览 */}
          <section className="mj-section" style={{ marginTop: "var(--space-6)" }}>
            <div className="mj-report-grid">
              <div className="mj-card">
                <div className="mj-card__body">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                    <ProgressRing
                      value={report.completedCount}
                      max={report.totalCases}
                      size={104}
                      label={`${report.completedCount}/${report.totalCases}`}
                      sublabel="案例"
                    />
                    <div>
                      <p className="mj-tiny">已完成案例平均分（按最佳成绩）</p>
                      <p style={{ fontSize: "var(--font-size-3xl)", fontWeight: 700, lineHeight: 1.1 }}>
                        {report.averageBest === null ? "—" : report.averageBest}
                      </p>
                      <p className="mj-tiny">
                        共 {report.caseRows.filter((r) => r.best !== null).length} 个案例计入平均
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mj-card">
                <div className="mj-card__body">
                  <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                    四项得分维度（已完成案例平均）
                  </h2>
                  <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {report.dimensions.map((d) => (
                      <div className="mj-score-bar" key={d.key}>
                        <span>{d.label}</span>
                        <span className="mj-score-bar__track">
                          <span
                            className="mj-score-bar__fill"
                            style={{ width: `${(d.earned / d.max) * 100}%` }}
                          />
                        </span>
                        <span className="mj-score-bar__value">
                          {d.earned}/{d.max}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 前后测 */}
          <section className="mj-section">
            <h2 className="mj-h2">训练前测与后测</h2>
            <div className="mj-card" style={{ marginTop: "var(--space-4)" }}>
              <div className="mj-card__body">
                {report.prepost.available && report.prepost.preScore !== null && report.prepost.postScore !== null ? (
                  <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", alignItems: "center" }}>
                    <PrePostChart
                      preScore={report.prepost.preScore}
                      postScore={report.prepost.postScore}
                    />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p className="mj-small">
                        前测分数：<strong>{report.prepost.preScore}</strong> / 100
                      </p>
                      <p className="mj-small">
                        后测分数：<strong>{report.prepost.postScore}</strong> / 100
                      </p>
                      <p className="mj-small">
                        分数变化：
                        <span
                          className="mj-delta"
                          style={{
                            color:
                              (report.prepost.delta ?? 0) > 0
                                ? "var(--color-success)"
                                : (report.prepost.delta ?? 0) < 0
                                ? "var(--color-danger)"
                                : "var(--color-text)",
                          }}
                        >
                          {(report.prepost.delta ?? 0) > 0 ? "+" : ""}
                          {report.prepost.delta} 分
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mj-callout mj-callout--warning">
                    <IconAlert size={15} style={{ flex: "none" }} />
                    <span>{report.prepost.note}</span>
                  </p>
                )}
                <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
                  {report.prepost.available
                    ? report.prepost.note
                    : "报告不会把未完成的一次测验记作 0 分，也不会估计缺失的分数。"}
                </p>
              </div>
            </div>
          </section>

          {/* 技能维度 */}
          <section className="mj-section">
            <h2 className="mj-h2">能力维度</h2>
            <div className="mj-card" style={{ marginTop: "var(--space-4)" }}>
              <div className="mj-card__body">
                <SkillBars skills={report.skills} />
                {report.weakSkills.length > 0 ? (
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
                      重新训练薄弱技能
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {report.weakSkills.map((s) => (
                        <span className="mj-tag mj-tag--warning" key={s}>
                          <SkillIcon skill={s} size={11} />
                          {SKILL_LABELS[s]}
                        </span>
                      ))}
                      {report.recommendedCaseIds.map((id) => (
                        <Link
                          key={id}
                          className="mj-btn mj-btn--secondary mj-btn--sm"
                          to={`/case/${id}`}
                        >
                          重做 {id}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* 案例成绩 */}
          <section className="mj-section">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <h2 className="mj-h2">各案例得分</h2>
              <div className="mj-tag" style={{ marginLeft: "auto" }}>
                成绩口径
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={`mj-btn mj-btn--sm ${scoreMode === "best" ? "mj-btn--secondary" : "mj-btn--ghost"}`}
                  aria-pressed={scoreMode === "best"}
                  onClick={() => setScoreMode("best")}
                >
                  最佳成绩
                </button>
                <button
                  type="button"
                  className={`mj-btn mj-btn--sm ${scoreMode === "last" ? "mj-btn--secondary" : "mj-btn--ghost"}`}
                  aria-pressed={scoreMode === "last"}
                  onClick={() => setScoreMode("last")}
                >
                  最近一次
                </button>
              </div>
            </div>

            <div className="mj-card" style={{ marginTop: "var(--space-4)" }}>
              <div className="mj-card__body">
                <CaseScoreBars
                  rows={report.caseRows.map((r) => ({
                    caseId: r.caseId,
                    title: r.title,
                    value: scoreMode === "best" ? r.best : r.last,
                  }))}
                />
                <div className="mj-case-score-list" style={{ marginTop: "var(--space-4)" }}>
                  {report.caseRows.map((r) => (
                    <div className="mj-case-score-row" key={r.caseId}>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.caseId} · {r.title}
                      </span>
                      <span className="mj-tiny">最佳 {r.best ?? "—"}</span>
                      <span className="mj-tiny">最近 {r.last ?? "—"}</span>
                    </div>
                  ))}
                </div>
                <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
                  重做案例会生成新的历史记录，不会覆盖首次成绩；报告默认采用最佳成绩。
                </p>
              </div>
            </div>
          </section>

          {/* 优势与建议 */}
          <section className="mj-section">
            <h2 className="mj-h2">优势与建议</h2>
            <div className="mj-report-grid" style={{ marginTop: "var(--space-4)" }}>
              <div className="mj-card">
                <div className="mj-card__body">
                  <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
                    <IconCheck size={15} /> 两条优势
                  </h3>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {report.strengths.length > 0 ? (
                      report.strengths.map((s, i) => (
                        <li className="mj-callout mj-callout--success mj-small" key={i}>
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="mj-small mj-muted">完成更多案例后，这里会给出基于真实得分的优势分析。</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="mj-card">
                <div className="mj-card__body">
                  <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
                    <IconInfo size={15} /> 两条建议
                  </h3>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {report.suggestions.map((s, i) => (
                      <li className="mj-callout mj-callout--primary mj-small" key={i}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

        </>
      )}

      {/* 用户测试数据声明 + 导出入口（无论有无数据都可用） */}
      <section className="mj-section">
        <div className="mj-card">
          <div className="mj-card__body">
            <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
              关于“用户测试数据”
            </h2>
            <p className="mj-banner mj-banner--warning">
              <IconAlert size={16} style={{ flex: "none", marginTop: 2 }} />
              <span>{USER_TESTING_DISCLAIMER}</span>
            </p>

            <div style={{ marginTop: "var(--space-4)" }}>
              <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
                参与试用后可以导出本机结果
              </p>
              <p className="mj-small">
                导出的 JSON 只包含分数、完成状态与技能维度统计，
                <strong>不含姓名、账号、设备标识，也不含你的具体作答文本</strong>；
                文件不会上传任何服务器，由你本人决定是否交给试用的组织者。
              </p>
              <div style={{ marginTop: "var(--space-3)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="mj-btn mj-btn--secondary mj-btn--sm" onClick={handleExport}>
                  导出本次试用数据（JSON）
                </button>
              </div>
              {exportNote ? (
                <p
                  className={`mj-callout ${exportNote.ok ? "mj-callout--success" : "mj-callout--warning"}`}
                  style={{ marginTop: "var(--space-3)" }}
                  role="status"
                >
                  {exportNote.text}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="mj-btn mj-btn--ghost" onClick={() => navigate("/missions")}>
          <IconRefresh size={16} /> 继续训练
        </button>
        <Link className="mj-btn mj-btn--ghost" to="/about">
          查看项目说明与数据边界
        </Link>
      </div>

      <ClearProgressDialog
        open={clearOpen}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          resetAll();
          setClearOpen(false);
          navigate("/");
        }}
      />
    </div>
  );
}
