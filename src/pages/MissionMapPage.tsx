/**
 * 明鉴 · 任务地图
 * 文档 3.1：展示 8 个案例的标题、难度、技能标签、状态与解锁条件。
 */

import { useNavigate, useSearchParams } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { CASES } from "../data/cases";
import { resolveCaseStatus, countCompleted } from "../engine/progression";
import { SKILL_LABELS } from "../engine/scoring";
import { SkillIcon, IconLock, IconCheck, IconArrowRight } from "../components/Icons";
import { SimulationBadge } from "../components/EmptyState";
import { IconAlert } from "../components/Icons";

const LEVEL_TONE: Record<string, string> = {
  入门: "mj-tag--success",
  进阶: "mj-tag--blue",
  挑战: "mj-tag--warning",
};

export function MissionMapPage() {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const completed = countCompleted(progress.cases);
  const [params, setParams] = useSearchParams();
  const noticeKind = params.get("missing") ? "missing" : params.get("locked") ? "locked" : null;
  const noticeId = params.get("missing") ?? params.get("locked") ?? "";

  return (
    <div className="mj-page mj-anim-page">
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p className="mj-eyebrow">任务地图</p>
          <h1 className="mj-h1" style={{ fontSize: "var(--font-size-2xl)" }}>
            8 个核查情境
          </h1>
          <p className="mj-lede" style={{ marginTop: 6 }}>
            按顺序解锁，但完成任意 2 个案例后其余案例自动开放，不会让你卡住。
            解锁只看完成状态，不看分数高低。
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="mj-tiny">已完成</p>
          <p style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, lineHeight: 1.1 }}>
            {completed} / {CASES.length}
          </p>
          <div style={{ marginTop: 6 }}>
            <SimulationBadge />
          </div>
        </div>
      </header>

      {noticeKind ? (
        <div
          className="mj-banner mj-banner--warning"
          role="status"
          style={{ marginTop: "var(--space-4)" }}
        >
          <IconAlert size={16} style={{ flex: "none", marginTop: 2 }} />
          <span>
            {noticeKind === "missing"
              ? `找不到案例「${noticeId}」，已返回任务地图。`
              : `案例 ${noticeId} 还未解锁。完成任意 2 个案例后，其余案例会自动开放。`}
          </span>
          <button
            type="button"
            className="mj-btn mj-btn--sm mj-btn--ghost mj-banner__action"
            onClick={() => setParams({})}
          >
            知道了
          </button>
        </div>
      ) : null}

      <div className="mj-mission-grid" style={{ marginTop: "var(--space-6)" }}>
        {CASES.map((c, index) => {
          const { status, reason } = resolveCaseStatus(index, c.id, progress);
          const record = progress.cases[c.id];
          const locked = status === "locked";

          return (
            <button
              key={c.id}
              type="button"
              className={`mj-mission${locked ? " mj-mission--locked" : ""}`}
              disabled={locked}
              onClick={() => navigate(`/case/${c.id}`)}
              aria-describedby={locked ? `lock-${c.id}` : undefined}
            >
              <span className="mj-mission__index">{c.id}</span>
              <span className="mj-mission__title">{c.title}</span>

              <span className="mj-mission__meta">
                <span className={`mj-tag ${LEVEL_TONE[c.level] ?? ""}`}>{c.level}</span>
                {c.skillTags.map((t) => (
                  <span className="mj-tag" key={t}>
                    <SkillIcon skill={t} size={11} />
                    {SKILL_LABELS[t]}
                  </span>
                ))}
              </span>

              <span className="mj-mission__foot">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {status === "completed" ? (
                    <>
                      <IconCheck size={13} style={{ color: "var(--color-success)" }} />
                      <span style={{ color: "var(--color-success)", fontWeight: 650 }}>
                        已完成
                        {typeof record?.bestScore === "number" ? ` · 最佳 ${record.bestScore} 分` : ""}
                      </span>
                    </>
                  ) : status === "inProgress" ? (
                    <span style={{ color: "var(--color-warning)", fontWeight: 650 }}>进行中</span>
                  ) : locked ? (
                    <>
                      <IconLock size={13} />
                      <span style={{ color: "var(--color-text-faint)" }}>未解锁</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      可开始 · 约 {c.estimatedMinutes} 分钟
                    </span>
                  )}
                </span>
                {!locked ? <IconArrowRight size={15} /> : null}
              </span>

              {locked && reason ? (
                <span className="mj-tiny" id={`lock-${c.id}`} style={{ color: "var(--color-text-faint)" }}>
                  {reason}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {progress.demoMode ? (
        <p className="mj-banner mj-banner--info" style={{ marginTop: "var(--space-5)" }}>
          演示模式已开启，全部案例可直接进入。可在首页开始正式流程（先做前测）以记录正式数据。
        </p>
      ) : null}
    </div>
  );
}
