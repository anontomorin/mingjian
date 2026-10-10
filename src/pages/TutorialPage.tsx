/**
 * 明鉴 · 独立引导关（T00）
 *
 * 与正式案例分离的图形化教学关：首页六步卡片总览 → 逐步实操（每步都要真实完成才能进入下一步）
 * → 提交后展示逐项反馈。不写入案例进度、不参与解锁、不进入学习报告。
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { TUTORIAL_CASE } from "../data/tutorial";
import { seededShuffle } from "../engine/shuffle";
import {
  analyzeEvidence,
  confidenceFeedback,
  evidenceRole,
  scoreCase,
  VERDICT_LABELS,
  MAX_ACTION,
  MAX_EVIDENCE,
  MAX_REASONING,
  MAX_VERDICT,
} from "../engine/scoring";
import {
  createTutorialState,
  isTutorialStepUnlocked,
  canSubmitTutorial,
  TUTORIAL_STEPS,
  type TutorialState,
} from "../engine/tutorial";
import type { Verdict } from "../types";
import { ClaimCard } from "../components/ClaimCard";
import { EvidenceCard } from "../components/EvidenceCard";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { CheckList, VerdictSelector, ConfidenceSlider, ActionSelector } from "../components/Checks";
import { ProgressRing } from "../components/ProgressBar";
import {
  IconCheck,
  IconAlert,
  IconInfo,
  IconArrowRight,
  IconArrowLeft,
  IconRefresh,
  IconEye,
  IconSource,
  IconData,
  IconPlus,
} from "../components/Icons";
import { SimulationBadge } from "../components/EmptyState";

/** 六步卡片上的自绘图标（不引入图标库） */
const STEP_ICONS = [
  <IconEye size={20} />,
  <IconSource size={20} />,
  <IconPlus size={20} />,
  <IconCheck size={20} />,
  <IconData size={20} />,
  <IconArrowRight size={20} />,
];

export function TutorialPage() {
  const { setPreference } = useProgress();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"intro" | "play" | "feedback">("intro");
  const [state, setState] = useState<TutorialState>(() => createTutorialState());
  const [step, setStep] = useState(0);
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const [blockedHint, setBlockedHint] = useState<string | null>(null);

  const ctx = useMemo(
    () => ({
      totalEvidence: TUTORIAL_CASE.evidence.length,
      totalChecks: TUTORIAL_CASE.requiredChecks.length,
    }),
    []
  );

  const orderedEvidence = useMemo(
    () => seededShuffle(TUTORIAL_CASE.evidence, "T00:evidence"),
    []
  );

  const openItem = openEvidenceId
    ? TUTORIAL_CASE.evidence.find((e) => e.id === openEvidenceId)
    : undefined;

  /* ---------------- 交互 ---------------- */

  const markOpen = (id: string) => {
    setState((prev) =>
      prev.openedEvidenceIds.includes(id)
        ? prev
        : { ...prev, openedEvidenceIds: [...prev.openedEvidenceIds, id] }
    );
    setOpenEvidenceId(id);
  };

  const toggleEvidence = (id: string) => {
    setState((prev) => ({
      ...prev,
      selectedEvidenceIds: prev.selectedEvidenceIds.includes(id)
        ? prev.selectedEvidenceIds.filter((x) => x !== id)
        : [...prev.selectedEvidenceIds, id],
    }));
  };

  const toggleCheck = (id: string) => {
    setState((prev) => ({
      ...prev,
      completedChecks: prev.completedChecks.includes(id)
        ? prev.completedChecks.filter((x) => x !== id)
        : [...prev.completedChecks, id],
    }));
  };

  const goNext = () => {
    const current = TUTORIAL_STEPS[step];
    if (!current.isDone(state, ctx)) {
      setBlockedHint(`先完成这一步：${current.requirement}`);
      return;
    }
    setBlockedHint(null);
    if (step < TUTORIAL_STEPS.length - 1) setStep(step + 1);
  };

  const goPrev = () => {
    setBlockedHint(null);
    if (step > 0) setStep(step - 1);
    else setPhase("intro");
  };

  const handleSubmit = () => {
    if (!canSubmitTutorial(state, ctx)) {
      setBlockedHint("还有步骤没有完成，提交按钮会在六步全部完成后开放。");
      return;
    }
    setBlockedHint(null);
    setState((prev) => ({ ...prev, submitted: true }));
    setPhase("feedback");
    setPreference({ tutorialCompleted: true });
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setState(createTutorialState());
    setStep(0);
    setOpenEvidenceId(null);
    setBlockedHint(null);
    setPhase("intro");
  };

  /* ---------------- 引导关首页 ---------------- */

  if (phase === "intro") {
    return (
      <div className="mj-page mj-page--narrow mj-anim-page">
        <section className="mj-card">
          <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="mj-tag mj-tag--primary">引导关 · 约 3 分钟</span>
              <SimulationBadge />
            </div>
            <h1 className="mj-h1" style={{ fontSize: "var(--font-size-3xl)" }}>
              先把玩法走一遍
            </h1>
            <p className="mj-lede">
              这一关用一个虚构的小情境，带你亲手做完核查的六个动作。
              每一步都要你自己操作才能继续——所以走完这一遍，正式案例就不用再猜怎么玩了。
            </p>
            <p className="mj-banner mj-banner--info">
              <IconInfo size={16} style={{ flex: "none", marginTop: 2 }} />
              <span>
                引导关不计入任何成绩：不进入任务解锁、不写入学习报告、不影响前测与后测。
              </span>
            </p>
          </div>
        </section>

        <section className="mj-section">
          <h2 className="mj-h2">六步，每一步都要你自己做完</h2>
          <div className="mj-tut-cards" style={{ marginTop: "var(--space-4)" }}>
            {TUTORIAL_STEPS.map((s, i) => (
              <article className="mj-tut-card" key={s.id}>
                <span className="mj-tut-card__icon" aria-hidden="true">
                  {STEP_ICONS[i]}
                </span>
                <span className="mj-tut-card__no" aria-hidden="true">
                  {String(s.no).padStart(2, "0")}
                </span>
                <h3 className="mj-tut-card__title">{s.title}</h3>
                <p className="mj-small mj-tut-card__desc">{s.intro}</p>
              </article>
            ))}
          </div>
        </section>

        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button
            type="button"
            className="mj-btn mj-btn--primary mj-btn--lg"
            onClick={() => setPhase("play")}
          >
            开始引导关 <IconArrowRight size={18} />
          </button>
          <Link className="mj-btn mj-btn--ghost mj-btn--lg" to="/assessment/pre">
            我已经会了，直接做前测
          </Link>
          <Link className="mj-btn mj-btn--ghost mj-btn--lg" to="/missions">
            跳过，去任务地图
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------- 教学反馈 ---------------- */

  if (phase === "feedback") {
    const score = scoreCase(TUTORIAL_CASE, {
      selectedEvidenceIds: state.selectedEvidenceIds,
      completedChecks: state.completedChecks,
      verdict: state.verdict,
      confidence: state.confidence,
      actionId: state.actionId,
    });
    const analysis = analyzeEvidence(TUTORIAL_CASE, state.selectedEvidenceIds);
    const conf = confidenceFeedback(
      state.confidence,
      analysis.recall >= 1 && analysis.hitDistractor.length === 0,
      state.verdict === TUTORIAL_CASE.verdict
    );
    const action = TUTORIAL_CASE.actionOptions.find((a) => a.id === state.actionId);
    const dims = [
      { label: "结论判断", value: score.verdict, max: MAX_VERDICT },
      { label: "证据选择", value: score.evidence, max: MAX_EVIDENCE },
      { label: "核查步骤", value: score.reasoning, max: MAX_REASONING },
      { label: "下一步行动", value: score.action, max: MAX_ACTION },
    ];
    const verdictCorrect = state.verdict === TUTORIAL_CASE.verdict;

    return (
      <div className="mj-page mj-page--narrow mj-anim-page">
        <section className="mj-card">
          <div className="mj-card__body">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 className="mj-h2" style={{ border: 0, paddingBottom: 0 }}>
                引导关反馈
              </h1>
              <span className="mj-tag">不计入正式成绩</span>
            </div>
            <div className="mj-score-ring" style={{ marginTop: "var(--space-4)" }}>
              <ProgressRing value={score.total} max={100} size={104} label={`${score.total}`} sublabel="总分 / 100" />
              <div className="mj-score-bars">
                {dims.map((d) => (
                  <div className="mj-score-bar" key={d.label}>
                    <span>{d.label}</span>
                    <span className="mj-score-bar__track">
                      <span className="mj-score-bar__fill" style={{ width: `${(d.value / d.max) * 100}%` }} />
                    </span>
                    <span className="mj-score-bar__value">
                      {d.value}/{d.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
              计分口径与正式案例完全一致：结论 30 + 证据 35 + 核查步骤 25 + 行动 10 = 100 分。
              引导关的分数只用于让你熟悉反馈结构，不会写进学习报告。
            </p>
          </div>
        </section>

        <section className="mj-card">
          <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                标准结论
              </h2>
              <span className={`mj-tag ${verdictCorrect ? "mj-tag--success" : "mj-tag--danger"}`}>
                {verdictCorrect ? <IconCheck size={12} /> : <IconAlert size={12} />}
                {verdictCorrect ? "与你的选择一致" : "与你的选择不同"}
              </span>
            </div>
            <p className="mj-callout mj-callout--primary">
              <span className="mj-callout__title">
                本关标准结论：{VERDICT_LABELS[TUTORIAL_CASE.verdict]}
              </span>
              你的选择：{state.verdict ? VERDICT_LABELS[state.verdict] : "未选择"}
            </p>
            <p style={{ lineHeight: 1.75 }}>{TUTORIAL_CASE.answerExplanation}</p>
          </div>
        </section>

        <section className="mj-card">
          <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                回看全部材料
              </h2>
              <span className="mj-tag mj-tag--primary">提交后解锁</span>
            </div>
            <p className="mj-tiny">
              现在你可以看到每份材料的角色，点开详情还能看到它的「能支持什么 / 不能单独证明什么」。
              在你作答的过程中，这些内容一直是隐藏的。
            </p>
            <div className="mj-evidence-list">
              {TUTORIAL_CASE.evidence.map((item, i) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  index={i}
                  selected={state.selectedEvidenceIds.includes(item.id)}
                  selectedOrder={
                    state.selectedEvidenceIds.indexOf(item.id) >= 0
                      ? state.selectedEvidenceIds.indexOf(item.id) + 1
                      : null
                  }
                  opened={state.openedEvidenceIds.includes(item.id)}
                  revealed
                  revealedRole={evidenceRole(TUTORIAL_CASE, item.id)}
                  readOnly
                  onOpen={() => setOpenEvidenceId(item.id)}
                  onToggle={() => undefined}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mj-card">
          <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
              你选的下一步行动
            </h2>
            {action ? (
              <p className="mj-callout">
                <span className="mj-callout__title">你选择：{action.label}</span>
                {action.feedback}
                <span className="mj-tiny" style={{ display: "block", marginTop: 6 }}>
                  本项得分：{action.points} / 10
                </span>
              </p>
            ) : (
              <p className="mj-callout mj-callout--warning">未选择行动。</p>
            )}
            <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
              关于你的把握程度（{state.confidence}%）
            </h2>
            <p
              className={`mj-callout ${
                conf.tone === "good"
                  ? "mj-callout--success"
                  : conf.tone === "overconfident"
                  ? "mj-callout--warning"
                  : "mj-callout--primary"
              }`}
            >
              {conf.text}
            </p>
          </div>
        </section>

        <section className="mj-card">
          <div className="mj-card__body">
            <p className="mj-callout mj-callout--primary">
              <span className="mj-callout__title">
                <IconInfo size={15} /> 带走这条原则
              </span>
              {TUTORIAL_CASE.takeaway}
            </p>
            <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
              {TUTORIAL_CASE.sourceNotes.join(" ")}
            </p>
          </div>
        </section>

        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button
            type="button"
            className="mj-btn mj-btn--primary"
            onClick={() => navigate("/assessment/pre")}
          >
            去做前测（5 题） <IconArrowRight size={16} />
          </button>
          <button type="button" className="mj-btn mj-btn--ghost" onClick={() => navigate("/missions")}>
            回任务地图
          </button>
          <button type="button" className="mj-btn mj-btn--ghost" onClick={restart}>
            <IconRefresh size={16} /> 重玩引导关
          </button>
        </div>

        {openItem ? (
          <EvidenceDrawer
            item={openItem}
            index={TUTORIAL_CASE.evidence.findIndex((e) => e.id === openItem.id)}
            selected={state.selectedEvidenceIds.includes(openItem.id)}
            revealed
            readOnly
            onClose={() => setOpenEvidenceId(null)}
            onToggle={() => undefined}
          />
        ) : null}
      </div>
    );
  }

  /* ---------------- 分步实操 ---------------- */

  const current = TUTORIAL_STEPS[step];
  const done = current.isDone(state, ctx);

  return (
    <div className="mj-page mj-page--narrow mj-anim-page">
      {/* 图形化步骤轨 */}
      <nav className="mj-tut-rail" aria-label="引导关步骤">
        <span className="mj-tut-rail__title">引导关进度</span>
        <ol className="mj-tut-rail__list">
          {TUTORIAL_STEPS.map((s, i) => {
            const isDone = s.isDone(state, ctx);
            const unlocked = isTutorialStepUnlocked(i, state, ctx);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`mj-tut-rail__node${i === step ? " is-current" : ""}${
                    isDone ? " is-done" : ""
                  }`}
                  disabled={!unlocked}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => {
                    setStep(i);
                    setBlockedHint(null);
                  }}
                >
                  <span className="mj-tut-rail__no" aria-hidden="true">
                    {isDone ? <IconCheck size={12} /> : s.no}
                  </span>
                  <span className="mj-tut-rail__label">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 指令气泡 */}
      <div className={`mj-tut-bubble${done ? " is-done" : ""}`} role="status">
        <span className="mj-tut-bubble__no">第 {current.no} / {TUTORIAL_STEPS.length} 步</span>
        <div className="mj-tut-bubble__main">
          <h1 className="mj-tut-bubble__title">{current.title}</h1>
          <p className="mj-small">{current.hint}</p>
        </div>
        <span className="mj-tut-bubble__req">
          {current.requirement} · {current.progressText(state, ctx)}
          {done ? " ✓" : ""}
        </span>
      </div>

      {/* 当前步骤的操作区 */}
      <div className="mj-tut-stage">
        {current.target === "claim" ? (
          <>
            <ClaimCard caseDef={TUTORIAL_CASE} />
            <div className="mj-tut-confirm">
              <button
                type="button"
                className="mj-btn mj-btn--primary"
                onClick={() => setState((prev) => ({ ...prev, readClaim: true }))}
                disabled={state.readClaim}
              >
                <IconCheck size={16} /> {state.readClaim ? "已确认阅读" : "我看清楚了"}
              </button>
              <span className="mj-tiny">
                {state.readClaim ? "可以进入下一步。" : "确认后才能进入下一步。"}
              </span>
            </div>
          </>
        ) : null}

        {current.target === "evidence" || current.target === "chain" ? (
          <section className="mj-card">
            <div className="mj-card__head">
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                可检查的证据材料
              </h2>
              <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                {current.target === "evidence" ? "先点开详情" : "把有用的加入证据链"}
              </span>
            </div>
            <div className="mj-card__body">
              <div className="mj-evidence-list">
                {orderedEvidence.map((item, i) => (
                  <EvidenceCard
                    key={item.id}
                    item={item}
                    index={i}
                    selected={state.selectedEvidenceIds.includes(item.id)}
                    selectedOrder={
                      state.selectedEvidenceIds.indexOf(item.id) >= 0
                        ? state.selectedEvidenceIds.indexOf(item.id) + 1
                        : null
                    }
                    opened={state.openedEvidenceIds.includes(item.id)}
                    onOpen={() => markOpen(item.id)}
                    onToggle={() => toggleEvidence(item.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {current.target === "chain" ? (
          <section className="mj-card">
            <div className="mj-card__head">
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                已选证据链
              </h2>
              <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                {state.selectedEvidenceIds.length} 份
              </span>
            </div>
            <div className="mj-card__body">
              {state.selectedEvidenceIds.length > 0 ? (
                <div className="mj-chain">
                  {state.selectedEvidenceIds.map((id, i) => {
                    const item = TUTORIAL_CASE.evidence.find((e) => e.id === id);
                    return (
                      <span className="mj-chain__item" key={id}>
                        <span>
                          {i + 1}. {item?.title ?? id}
                        </span>
                        <button
                          type="button"
                          className="mj-chain__remove"
                          onClick={() => toggleEvidence(id)}
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
                  还没有加入任何材料。只有加入证据链的材料才计入「证据选择」分数。
                </p>
              )}
            </div>
          </section>
        ) : null}

        {current.target === "checks" ? (
          <section className="mj-card">
            <div className="mj-card__head">
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                核查步骤清单
              </h2>
              <span className="mj-tiny" style={{ marginLeft: "auto" }}>
                {state.completedChecks.length}/{ctx.totalChecks} 已完成
              </span>
            </div>
            <div className="mj-card__body">
              <p className="mj-tiny" style={{ marginBottom: "var(--space-3)" }}>
                这些步骤必须由你亲自操作后勾选，系统不会替你自动完成。
              </p>
              <CheckList
                checks={TUTORIAL_CASE.requiredChecks}
                completedChecks={state.completedChecks}
                openedEvidenceIds={state.openedEvidenceIds}
                onToggle={toggleCheck}
              />
            </div>
          </section>
        ) : null}

        {current.target === "verdict" ? (
          <>
            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  选择结论
                </h2>
              </div>
              <div className="mj-card__body">
                <VerdictSelector
                  value={state.verdict}
                  seed="T00:verdict"
                  onChange={(v: Verdict) => setState((prev) => ({ ...prev, verdict: v }))}
                />
              </div>
            </section>
            <section className="mj-card">
              <div className="mj-card__head">
                <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                  报告把握程度
                </h2>
              </div>
              <div className="mj-card__body">
                <ConfidenceSlider
                  value={state.confidence}
                  onChange={(v) => setState((prev) => ({ ...prev, confidence: v }))}
                />
                <p className="mj-tiny" style={{ marginTop: "var(--space-2)" }}>
                  把握程度不计入 100 分总分，只用于帮助你对照信心与证据是否匹配。
                </p>
              </div>
            </section>
          </>
        ) : null}

        {current.target === "action" ? (
          <section className="mj-card">
            <div className="mj-card__head">
              <h2 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
                选择下一步行动
              </h2>
            </div>
            <div className="mj-card__body">
              <ActionSelector
                options={TUTORIAL_CASE.actionOptions}
                seed="T00:action"
                value={state.actionId}
                onChange={(id) => setState((prev) => ({ ...prev, actionId: id }))}
              />
            </div>
          </section>
        ) : null}
      </div>

      {/* 步骤控制 */}
      <div className="mj-tut-nav">
        <button type="button" className="mj-btn mj-btn--ghost" onClick={goPrev}>
          <IconArrowLeft size={16} /> {step === 0 ? "返回引导关首页" : "上一步"}
        </button>
        <span className="mj-tiny" aria-live="polite">
          {blockedHint ?? (done ? "这一步已完成。" : `待完成：${current.requirement}`)}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {step === TUTORIAL_STEPS.length - 1 ? (
            <button
              type="button"
              className="mj-btn mj-btn--primary"
              onClick={handleSubmit}
              disabled={!canSubmitTutorial(state, ctx)}
            >
              提交并查看反馈 <IconArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="mj-btn mj-btn--primary"
              onClick={goNext}
              disabled={!done}
            >
              下一步 <IconArrowRight size={16} />
            </button>
          )}
        </span>
      </div>

      <p className="mj-tiny" style={{ textAlign: "center" }}>
        引导关不计入成绩，随时可以
        <Link to="/missions" style={{ margin: "0 4px" }}>
          离开去任务地图
        </Link>
        或
        <Link to="/assessment/pre" style={{ margin: "0 4px" }}>
          直接做前测
        </Link>
        。
      </p>

      {openItem ? (
        <EvidenceDrawer
          item={openItem}
          index={TUTORIAL_CASE.evidence.findIndex((e) => e.id === openItem.id)}
          selected={state.selectedEvidenceIds.includes(openItem.id)}
          onClose={() => setOpenEvidenceId(null)}
          onToggle={() => toggleEvidence(openItem.id)}
        />
      ) : null}
    </div>
  );
}
