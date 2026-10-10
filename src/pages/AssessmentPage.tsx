/**
 * 明鉴 · 训练前测 / 后测
 * 文档 6.1：5 题，每题 20 分（结论 10 + 行动 10）。必须作答才计分，未完成时不得伪造分数。
 */

import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { PRETEST } from "../data/pretest";
import { POSTTEST } from "../data/posttest";
import type { QuizForm, Verdict } from "../types";
import { VERDICT_LABELS, SKILL_LABELS, scoreQuiz } from "../engine/scoring";
import { seededShuffle } from "../engine/shuffle";
import { ProgressBar } from "../components/ProgressBar";
import { IconAlert, IconCheck, SkillIcon, IconArrowRight } from "../components/Icons";
import { SimulationBadge } from "../components/EmptyState";

const VERDICT_ORDER: Verdict[] = ["supported", "contradicted", "misleading", "insufficient"];

export function AssessmentPage({ form }: { form: "pre" | "post" }) {
  const { progress, saveQuiz } = useProgress();
  const navigate = useNavigate();
  const quiz: QuizForm = form === "pre" ? PRETEST : POSTTEST;
  const existing = form === "pre" ? progress.pretest : progress.posttest;

  const [answers, setAnswers] = useState<Record<string, { verdict: Verdict; actionId: string }>>(
    existing?.answers ?? {}
  );
  const [submitted, setSubmitted] = useState(Boolean(existing));
  const [result, setResult] = useState<number | null>(existing ? existing.score : null);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const answeredCount = useMemo(() => {
    return quiz.questions.filter(
      (q) => answers[q.id]?.verdict && answers[q.id]?.actionId
    ).length;
  }, [answers, quiz.questions]);

  const setAnswer = (qid: string, patch: { verdict?: Verdict; actionId?: string }) => {
    setAnswers((prev) => {
      const prevAns = prev[qid] ?? { verdict: undefined, actionId: "" };
      return {
        ...prev,
        [qid]: {
          verdict: (patch.verdict ?? prevAns.verdict) as Verdict,
          actionId: patch.actionId ?? prevAns.actionId,
        },
      };
    });
  };

  const handleSubmit = () => {
    const missing = quiz.questions.filter(
      (q) => !answers[q.id]?.verdict || !answers[q.id]?.actionId
    );
    if (missing.length > 0) {
      setError(`还有 ${missing.length} 道题没有完成（每题都要选择结论与行动）。`);
      errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      const firstMissing = document.getElementById(`q-${missing[0].id}`);
      firstMissing?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setError(null);
    const score = scoreQuiz(quiz.questions, answers);
    setResult(score);
    setSubmitted(true);
    saveQuiz(form === "pre" ? "A" : "B", answers, score);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRedo = () => {
    setAnswers({});
    setResult(null);
    setSubmitted(false);
    setShowDetail(false);
  };

  return (
    <div className="mj-page mj-page--narrow mj-anim-page">
      <header>
        <p className="mj-eyebrow">{form === "pre" ? "步骤 1 · 建立基线" : "步骤 4 · 检查变化"}</p>
        <h1 className="mj-h1" style={{ fontSize: "var(--font-size-2xl)" }}>
          {quiz.title}
        </h1>
        <p className="mj-lede" style={{ marginTop: 6 }}>
          {quiz.intro}
        </p>
        <div style={{ marginTop: "var(--space-3)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SimulationBadge text="题目情境为虚构教学模拟" />
          <span className="mj-tag">共 5 题 · 每题 20 分 · 满分 100</span>
        </div>
      </header>

      {submitted && result !== null ? (
        <section className="mj-card" style={{ marginTop: "var(--space-6)" }}>
          <div className="mj-card__body">
            <h2 className="mj-h2">
              {form === "pre" ? "前测" : "后测"}得分：{result} / 100
            </h2>
            <div style={{ marginTop: "var(--space-3)" }}>
              <ProgressBar
                value={result}
                max={100}
                ariaLabel={`${form === "pre" ? "前测" : "后测"}得分 ${result} 分`}
              />
            </div>
            <p className="mj-small mj-muted" style={{ marginTop: "var(--space-3)" }}>
              该分数由你本次的真实作答计算：每题结论 10 分、行动 10 分。
              {form === "pre"
                ? "接下来可以进入任务地图开始案例训练。"
                : "现在可以查看完整学习报告。"}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "var(--space-4)" }}>
              {form === "pre" ? (
                <button
                  type="button"
                  className="mj-btn mj-btn--primary"
                  onClick={() => navigate("/missions")}
                >
                  进入任务地图 <IconArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="mj-btn mj-btn--primary"
                  onClick={() => navigate("/report")}
                >
                  查看学习报告 <IconArrowRight size={16} />
                </button>
              )}
              <button type="button" className="mj-btn mj-btn--ghost" onClick={handleRedo}>
                重新作答（覆盖本次记录）
              </button>
              <button
                type="button"
                className="mj-btn mj-btn--ghost"
                onClick={() => setShowDetail((v) => !v)}
              >
                {showDetail ? "收起逐题解析" : "查看逐题解析"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mj-banner mj-banner--danger" role="alert" ref={errorRef} style={{ marginTop: "var(--space-4)" }}>
          <IconAlert size={16} style={{ flex: "none", marginTop: 2 }} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mj-quiz" style={{ marginTop: "var(--space-5)" }}>
        {quiz.questions.map((q, i) => {
          const ans = answers[q.id];
          const done = Boolean(ans?.verdict && ans?.actionId);
          return (
            <section className="mj-card mj-question" key={q.id} id={`q-${q.id}`}>
              <div className="mj-card__body">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="mj-tag mj-tag--primary">
                    <SkillIcon skill={q.skill} size={11} />
                    {SKILL_LABELS[q.skill]}
                  </span>
                  <span className="mj-tiny">
                    第 {i + 1} / 5 题
                  </span>
                  {done ? (
                    <span className="mj-tag mj-tag--success" style={{ marginLeft: "auto" }}>
                      <IconCheck size={12} /> 已作答
                    </span>
                  ) : (
                    <span className="mj-tag" style={{ marginLeft: "auto" }}>
                      未作答
                    </span>
                  )}
                </div>

                <p className="mj-question__scenario" style={{ marginTop: "var(--space-3)" }}>
                  {q.scenario}
                </p>

                <fieldset className="mj-question__group" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="mj-question__legend">
                    1. 你会给这条信息下哪个结论？
                  </legend>
                  <div className="mj-option-list" role="radiogroup" aria-label={`第 ${i + 1} 题结论`}>
                    {seededShuffle(VERDICT_ORDER, `${quiz.formId}:${q.id}:verdict`).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={ans?.verdict === v}
                        className="mj-option"
                        disabled={submitted}
                        onClick={() => setAnswer(q.id, { verdict: v })}
                      >
                        <span className="mj-option__radio" aria-hidden="true" />
                        <span className="mj-option__title">{VERDICT_LABELS[v]}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mj-question__group" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="mj-question__legend">2. 你会怎么做？</legend>
                  <div className="mj-option-list" role="radiogroup" aria-label={`第 ${i + 1} 题行动`}>
                    {seededShuffle(q.actionOptions, `${quiz.formId}:${q.id}:action`).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={ans?.actionId === opt.id}
                        className="mj-option"
                        disabled={submitted}
                        onClick={() => setAnswer(q.id, { actionId: opt.id })}
                      >
                        <span className="mj-option__radio" aria-hidden="true" />
                        <span className="mj-option__text">
                          <span className="mj-option__title">{opt.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {showDetail && submitted ? (
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <p className="mj-callout mj-callout--primary mj-small">
                      <span className="mj-callout__title">
                        标准结论：{VERDICT_LABELS[q.verdict]}
                      </span>
                      {q.explanation}
                    </p>
                    {ans?.actionId ? (
                      <p className="mj-callout mj-small" style={{ marginTop: 8 }}>
                        <span className="mj-callout__title">你选择的行动</span>
                        {q.actionOptions.find((o) => o.id === ans.actionId)?.feedback}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {!submitted ? (
        <div
          style={{
            marginTop: "var(--space-5)",
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button type="button" className="mj-btn mj-btn--primary mj-btn--lg" onClick={handleSubmit}>
            提交作答（已答 {answeredCount}/5）
          </button>
          <Link className="mj-btn mj-btn--ghost" to="/">
            返回调查室
          </Link>
          <span className="mj-tiny">
            未提交前不会产生任何分数，也不会写入存档。
          </span>
        </div>
      ) : null}
    </div>
  );
}
