/**
 * 明鉴 · 案例核查工作台
 * 文档第 4 章：主张卡 → 证据工作区 → 核查步骤 → 结论 / 信心 / 行动 → 提交 → 反馈。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { CASES, getCaseById } from "../data/cases";
import { resolveCaseStatus } from "../engine/progression";
import { validateSubmission, SKILL_LABELS, evidenceRole } from "../engine/scoring";
import { seededShuffle } from "../engine/shuffle";
import type { Verdict } from "../types";
import { ClaimCard } from "../components/ClaimCard";
import { EvidenceCard } from "../components/EvidenceCard";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { FeedbackPanel } from "../components/FeedbackPanel";
import { CheckList, VerdictSelector, ConfidenceSlider, ActionSelector } from "../components/Checks";
import { StepIndicator } from "../components/ProgressBar";
import { IconArrowLeft, IconAlert, IconCheck, SkillIcon } from "../components/Icons";
import { SimulationBadge } from "../components/EmptyState";
import { CaseGuide } from "../components/CaseGuide";

const FLOW_STEPS = ["阅读主张", "检查证据", "完成步骤", "选择结论", "提交查看反馈"];

export function CaseWorkspacePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const {
    progress,
    ensureCaseRecord,
    markEvidenceOpened,
    toggleEvidence,
    toggleCheck,
    dismissCaseGuide,
    setVerdict,
    setConfidence,
    setAction,
    submitCase,
    retryCase,
  } = useProgress();

  const caseDef = getCaseById(caseId);
  const order = useMemo(() => CASES.findIndex((c) => c.id === caseId), [caseId]);

  // 证据材料按案例 id 确定性打乱呈现：真实核查现场的材料本来就是无序的，
  // 也避免「关键证据总排在最前面」的位置线索。同一案例每次打开顺序一致。
  const orderedEvidence = useMemo(
    () => (caseDef ? seededShuffle(caseDef.evidence, `${caseDef.id}:evidence`) : []),
    [caseDef]
  );

  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<"verdict" | "action">>([]);
  const [submitting, setSubmitting] = useState(false);
  const verdictRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // 未知 caseId → 返回任务地图
  useEffect(() => {
    if (!caseDef) {
      navigate("/missions?missing=" + encodeURIComponent(caseId ?? ""), { replace: true });
    }
  }, [caseDef, caseId, navigate]);

  // 锁定案例也返回任务地图
  useEffect(() => {
    if (!caseDef) return;
    const { status } = resolveCaseStatus(order, caseDef.id, progress);
    if (status === "locked") {
      navigate("/missions?locked=" + encodeURIComponent(caseDef.id), { replace: true });
    }
  }, [caseDef, order, progress, navigate]);

  // 首次进入建立记录（但不计为完成）
  useEffect(() => {
    if (caseDef) ensureCaseRecord(caseDef.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseDef?.id]);

  if (!caseDef) return null;

  const record = progress.cases[caseDef.id] ?? {
    status: "available" as const,
    attemptCount: 0,
    selectedEvidenceIds: [],
    openedEvidenceIds: [],
    completedChecks: [],
  };

  const completed = record.status === "completed";
  const submitted = completed && Boolean(record.score);

  const openItem = openEvidenceId
    ? caseDef.evidence.find((e) => e.id === openEvidenceId)
    : undefined;

  const handleOpen = (evidenceId: string) => {
    markEvidenceOpened(caseDef.id, evidenceId);
    setOpenEvidenceId(evidenceId);
  };

  const handleSubmit = () => {
    if (submitting) return; // 防重复提交
    const check = validateSubmission({
      selectedEvidenceIds: record.selectedEvidenceIds,
      completedChecks: record.completedChecks,
      verdict: record.verdict,
      confidence: record.confidence ?? 50,
      actionId: record.actionId,
    });
    if (!check.ok) {
      setErrors(check.missing);
      if (check.missing.includes("verdict")) {
        verdictRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
        verdictRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      } else {
        actionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
        actionRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
      return;
    }
    setErrors([]);
    setSubmitting(true);
    submitCase(caseDef);
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    retryCase(caseDef.id);
    setErrors([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextCase = (() => {
    const idx = CASES.findIndex((c) => c.id === caseDef.id);
    for (let i = idx + 1; i < CASES.length; i += 1) {
      const st = resolveCaseStatus(i, CASES[i].id, progress);
      if (st.status !== "locked") return CASES[i];
    }
    return undefined;
  })();

  const checksDone = record.completedChecks.length;
  const checksTotal = caseDef.requiredChecks.length;
  const currentStep = record.verdict ? 4 : checksDone > 0 ? 2 : 1;

  return (
    <div className="mj-anim-fade">
      {/* 顶部吸附栏 */}
      <div className="mj-ws-bar">
        <div className="mj-ws-bar__inner">
          <Link to="/missions" className="mj-btn mj-btn--ghost mj-btn--sm">
            <IconArrowLeft size={15} /> 任务地图
          </Link>
          <span className="mj-ws-bar__title">
            {caseDef.id} · {caseDef.title}
          </span>
          <span className={`mj-tag ${caseDef.level === "挑战" ? "mj-tag--warning" : "mj-tag--success"}`}>
            {caseDef.level}
          </span>
          <SimulationBadge />
          <span className="mj-ws-bar__spacer" />
          <span className="mj-tiny" aria-live="polite">
            证据链 {record.selectedEvidenceIds.length} 项 · 步骤 {checksDone}/{checksTotal}
          </span>
          {!submitted ? (
            <button
              type="button"
              className="mj-btn mj-btn--primary mj-btn--sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "提交中…" : "提交结论"}
            </button>
          ) : null}
        </div>
      </div>

      {/* 分步引导：未提交且未收起时显示，随进度自动推进 */}
      {!submitted && !record.guideDismissed ? (
        <div style={{ maxWidth: "var(--layout-max)", margin: "0 auto", padding: "0 var(--space-6)" }}>
          <CaseGuide
            caseDef={caseDef}
            record={record}
            onDismiss={() => dismissCaseGuide(caseDef.id)}
          />
        </div>
      ) : null}

      {submitted ? (
        <div className="mj-page mj-page--narrow">
          <FeedbackPanel
            caseDef={caseDef}
            record={record}
            nextCaseId={nextCase?.id}
            onRetry={handleRetry}
            onGoNext={() => navigate(`/case/${nextCase?.id}`)}
            onGoMap={() => navigate("/missions")}
          />
        </div>
      ) : (
        <div className="mj-workspace">
          {/* 左栏：主张 */}
          <div className="mj-col mj-col--left">
            <ClaimCard caseDef={caseDef} />
            <section className="mj-card">
              <div className="mj-card__body">
                <p className="mj-eyebrow" style={{ marginBottom: 8 }}>
                  本次核查流程
                </p>
                <StepIndicator steps={FLOW_STEPS} current={currentStep} />
                <hr className="mj-divider" style={{ margin: "var(--space-4) 0" }} />
                <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
                  技能标签
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {caseDef.skillTags.map((t) => (
                    <span className="mj-tag mj-tag--primary" key={t}>
                      <SkillIcon skill={t} size={11} />
                      {SKILL_LABELS[t]}
                    </span>
                  ))}
                </div>
                <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
                  预计用时：约 {caseDef.estimatedMinutes} 分钟。
                  未提交的进度会自动保存在本机，刷新后仍可继续。
                </p>
              </div>
            </section>
          </div>

          {/* 中栏：证据工作区 */}
          <div className="mj-col mj-col--center">
            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  可检查的证据材料
                </h2>
                <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                  先看详情，再决定是否加入证据链
                </span>
              </div>
              <div className="mj-card__body">
                <div className="mj-evidence-list">
                  {orderedEvidence.map((item, i) => (
                    <EvidenceCard
                      key={item.id}
                      item={item}
                      index={i}
                      selected={record.selectedEvidenceIds.includes(item.id)}
                      selectedOrder={
                        record.selectedEvidenceIds.indexOf(item.id) >= 0
                          ? record.selectedEvidenceIds.indexOf(item.id) + 1
                          : null
                      }
                      opened={record.openedEvidenceIds.includes(item.id)}
                      revealed={submitted}
                      revealedRole={evidenceRole(caseDef, item.id)}
                      onOpen={() => handleOpen(item.id)}
                      onToggle={() => toggleEvidence(caseDef.id, item.id)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  已选证据链
                </h2>
                <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                  {record.selectedEvidenceIds.length} 项
                </span>
              </div>
              <div className="mj-card__body">
                {record.selectedEvidenceIds.length > 0 ? (
                  <div className="mj-chain">
                    {record.selectedEvidenceIds.map((id, i) => {
                      const item = caseDef.evidence.find((e) => e.id === id);
                      return (
                        <span className="mj-chain__item" key={id}>
                          <span>
                            {i + 1}. {item?.title ?? id}
                          </span>
                          <button
                            type="button"
                            className="mj-chain__remove"
                            onClick={() => toggleEvidence(caseDef.id, id)}
                            aria-label={`从证据链移除 ${item?.title ?? id}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mj-chain__empty">
                    还没有加入任何证据。只有点开详情并加入证据链的材料才计入「证据选择」分数。
                  </p>
                )}
              </div>
            </section>

            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  核查步骤清单
                </h2>
                <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                  {checksDone}/{checksTotal} 已完成
                </span>
              </div>
              <div className="mj-card__body">
                <p className="mj-tiny" style={{ marginBottom: "var(--space-3)" }}>
                  这些步骤必须由你亲自操作后勾选，系统不会替你自动完成。
                </p>
                <CheckList
                  checks={caseDef.requiredChecks}
                  completedChecks={record.completedChecks}
                  openedEvidenceIds={record.openedEvidenceIds}
                  onToggle={(id) => toggleCheck(caseDef.id, id)}
                />
              </div>
            </section>
          </div>

          {/* 右栏：结论 / 信心 / 行动 */}
          <div className="mj-col mj-col--right">
            <section className="mj-card" ref={verdictRef}>
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  1 · 选择结论
                </h2>
              </div>
              <div className="mj-card__body">
                <VerdictSelector
                  value={record.verdict}
                  onChange={(v: Verdict) => {
                    setVerdict(caseDef.id, v);
                    setErrors((prev) => prev.filter((e) => e !== "verdict"));
                  }}
                  errorId={errors.includes("verdict") ? "err-verdict" : undefined}
                  seed={`${caseDef.id}:verdict`}
                />
                {errors.includes("verdict") ? (
                  <p className="mj-inline-error" id="err-verdict" role="alert">
                    <IconAlert size={14} /> 请先选择一个结论，再提交。
                  </p>
                ) : null}
              </div>
            </section>

            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  2 · 报告把握程度
                </h2>
              </div>
              <div className="mj-card__body">
                <ConfidenceSlider
                  value={record.confidence ?? 50}
                  onChange={(v) => setConfidence(caseDef.id, v)}
                />
                <p className="mj-tiny" style={{ marginTop: "var(--space-2)" }}>
                  把握程度不计入 100 分总分，只用于帮助你对照信心与证据是否匹配。
                </p>
              </div>
            </section>

            <section className="mj-card" ref={actionRef}>
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  3 · 选择下一步行动
                </h2>
              </div>
              <div className="mj-card__body">
                <ActionSelector
                  options={caseDef.actionOptions}
                  seed={`${caseDef.id}:action`}
                  value={record.actionId}
                  onChange={(id) => {
                    setAction(caseDef.id, id);
                    setErrors((prev) => prev.filter((e) => e !== "action"));
                  }}
                  errorId={errors.includes("action") ? "err-action" : undefined}
                />
                {errors.includes("action") ? (
                  <p className="mj-inline-error" id="err-action" role="alert">
                    <IconAlert size={14} /> 请先选择下一步行动，再提交。
                  </p>
                ) : null}
              </div>
            </section>

            <section className="mj-card">
              <div className="mj-card__body">
                <p className="mj-tiny" style={{ marginBottom: "var(--space-3)" }}>
                  提交前请确认：已查看证据、已勾选核查步骤、已选择结论与行动。
                </p>
                <button
                  type="button"
                  className="mj-btn mj-btn--primary mj-btn--block mj-btn--lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "提交中…" : "提交结论并查看反馈"}
                </button>
                {record.verdict && record.actionId ? (
                  <p className="mj-tiny" style={{ marginTop: 8, color: "var(--color-success)" }}>
                    <IconCheck size={12} /> 结论与行动已选择，可以提交。
                  </p>
                ) : (
                  <p className="mj-tiny" style={{ marginTop: 8 }}>
                    当前还缺少：
                    {!record.verdict ? " 结论" : ""}
                    {!record.actionId ? " 下一步行动" : ""}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 移动端底部提交栏 */}
      {!submitted ? (
        <div className="mj-ws-bottom">
          <span className="mj-tiny" style={{ flex: 1 }}>
            证据 {record.selectedEvidenceIds.length} · 步骤 {checksDone}/{checksTotal}
          </span>
          <button
            type="button"
            className="mj-btn mj-btn--primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "提交中…" : "提交结论"}
          </button>
        </div>
      ) : null}

      {openItem ? (
        <EvidenceDrawer
          item={openItem}
          index={caseDef.evidence.findIndex((e) => e.id === openItem.id)}
          selected={record.selectedEvidenceIds.includes(openItem.id)}
          revealed={submitted}
          onClose={() => setOpenEvidenceId(null)}
          onToggle={() => toggleEvidence(caseDef.id, openItem.id)}
        />
      ) : null}
    </div>
  );
}
