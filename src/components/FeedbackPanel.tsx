/**
 * 明鉴 · 提交后的逐项反馈面板
 * 文档 4.6：分数与维度、标准结论、关键证据、遗漏证据、干扰项解释、
 * 建议核查路径、信心反馈、可迁移原则。
 */

import { useState } from "react";
import type { CaseDefinition, CaseRecord, EvidenceItem } from "../types";
import {
  VERDICT_LABELS,
  analyzeEvidence,
  confidenceFeedback,
  evidenceRole,
  MAX_ACTION,
  MAX_EVIDENCE,
  MAX_REASONING,
  MAX_VERDICT,
} from "../engine/scoring";
import { ProgressRing } from "./ProgressBar";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { IconCheck, IconAlert, IconArrowRight, IconRefresh, IconInfo, IconEye } from "./Icons";

export function FeedbackPanel({
  caseDef,
  record,
  nextCaseId,
  onRetry,
  onGoNext,
  onGoMap,
}: {
  caseDef: CaseDefinition;
  record: CaseRecord;
  nextCaseId?: string;
  onRetry: () => void;
  onGoNext: () => void;
  onGoMap: () => void;
}) {
  // 提交后开放「回看全部材料」：此时才显示材料角色与分析，提交前一律隐藏
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const score = record.score;
  const total = score?.total ?? 0;
  const analysis = analyzeEvidence(caseDef, record.selectedEvidenceIds);
  const conf = confidenceFeedback(
    record.confidence ?? 50,
    analysis.recall >= 1 && analysis.hitDistractor.length === 0,
    record.verdict === caseDef.verdict
  );

  const evidenceById = new Map<string, EvidenceItem>(caseDef.evidence.map((e) => [e.id, e]));
  const dims = [
    { key: "verdict", label: "结论判断", value: score?.verdict ?? 0, max: MAX_VERDICT },
    { key: "evidence", label: "证据选择", value: score?.evidence ?? 0, max: MAX_EVIDENCE },
    { key: "reasoning", label: "核查步骤", value: score?.reasoning ?? 0, max: MAX_REASONING },
    { key: "action", label: "下一步行动", value: score?.action ?? 0, max: MAX_ACTION },
  ];

  const verdictCorrect = record.verdict === caseDef.verdict;
  const selectedAction = caseDef.actionOptions.find((a) => a.id === record.actionId);
  const reviewItem = openEvidenceId
    ? caseDef.evidence.find((e) => e.id === openEvidenceId)
    : undefined;

  return (
    <div className="mj-feedback">
      {/* 1. 分数 */}
      <section className="mj-card">
        <div className="mj-card__body">
          <div className="mj-score-ring">
            <ProgressRing value={total} max={100} size={104} label={`${total}`} sublabel="总分 / 100" />
            <div className="mj-score-bars">
              {dims.map((d) => (
                <div className="mj-score-bar" key={d.key}>
                  <span>{d.label}</span>
                  <span className="mj-score-bar__track">
                    <span
                      className="mj-score-bar__fill"
                      style={{ width: `${(d.value / d.max) * 100}%` }}
                    />
                  </span>
                  <span className="mj-score-bar__value">
                    {d.value}/{d.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mj-tiny" style={{ marginTop: "var(--space-3)" }}>
            计分方式：结论 30 + 证据 35 + 核查步骤 25 + 行动 10 = 100 分。
            证据选择按「关键证据命中率 × 35」计分，每选中一个易误用材料扣 8 分，最低 0 分。
            信心程度单独记录，不计入这 100 分。
          </p>
        </div>
      </section>

      {/* 2. 标准结论 */}
      <section className="mj-card">
        <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
              标准结论
            </h3>
            <span className={`mj-tag ${verdictCorrect ? "mj-tag--success" : "mj-tag--danger"}`}>
              {verdictCorrect ? <IconCheck size={12} /> : <IconAlert size={12} />}
              {verdictCorrect ? "与你的选择一致" : "与你的选择不同"}
            </span>
          </div>
          <p className="mj-callout mj-callout--primary">
            <span className="mj-callout__title">本案标准结论：{VERDICT_LABELS[caseDef.verdict]}</span>
            你的选择：{record.verdict ? VERDICT_LABELS[record.verdict] : "未选择"}
          </p>
          <p style={{ lineHeight: 1.75 }}>{caseDef.answerExplanation}</p>
        </div>
      </section>

      {/* 3. 关键证据与遗漏 */}
      <section className="mj-card">
        <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
            证据选择回顾
          </h3>

          <div>
            <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
              你选中的关键证据（{analysis.hitRequired.length}/{analysis.requiredTotal}）
            </p>
            {analysis.hitRequired.length > 0 ? (
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.hitRequired.map((id) => (
                  <li key={id} className="mj-callout mj-callout--success">
                    <IconCheck size={14} style={{ flex: "none" }} />
                    <span>
                      <strong>{evidenceById.get(id)?.title ?? id}</strong>
                      ：{evidenceById.get(id)?.canSupport[0] ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mj-callout mj-callout--warning">没有选中任何关键证据。</p>
            )}
          </div>

          <div>
            <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
              遗漏的关键证据
            </p>
            {analysis.missedRequired.length > 0 ? (
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.missedRequired.map((id) => (
                  <li key={id} className="mj-callout mj-callout--warning">
                    <IconAlert size={14} style={{ flex: "none" }} />
                    <span>
                      <strong>{evidenceById.get(id)?.title ?? id}</strong>
                      ：{evidenceById.get(id)?.canSupport[0] ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mj-callout mj-callout--success">关键证据已全部找到。</p>
            )}
          </div>

          {analysis.hitDistractor.length > 0 ? (
            <div>
              <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
                你选中的易误用材料
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.hitDistractor.map((id) => (
                  <li key={id} className="mj-callout mj-callout--danger">
                    <IconAlert size={14} style={{ flex: "none" }} />
                    <span>
                      <strong>{evidenceById.get(id)?.title ?? id}</strong>
                      ：{evidenceById.get(id)?.cannotProve[0] ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* 3.5 回看全部材料（提交后解锁） */}
      <section className="mj-card">
        <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
              回看全部材料
            </h3>
            <span className="mj-tag mj-tag--primary">提交后解锁</span>
          </div>
          <p className="mj-tiny">
            现在每份材料的角色（关键证据 / 易误用材料）已经显示，点开详情还能看到
            「能支持什么」「不能单独证明什么」。作答过程中这些内容始终是隐藏的。
          </p>
          <div className="mj-evidence-list">
            {caseDef.evidence.map((item, i) => (
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
                revealed
                revealedRole={evidenceRole(caseDef, item.id)}
                readOnly
                onOpen={() => setOpenEvidenceId(item.id)}
                onToggle={() => undefined}
              />
            ))}
          </div>
          <p className="mj-tiny">
            <IconEye size={12} /> 回看模式下不能修改证据链，如需重新作答请使用下方「重做本案」。
          </p>
        </div>
      </section>

      {/* 4. 核查步骤 */}
      <section className="mj-card">
        <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)" }}>
            核查步骤完成情况
          </h3>
          {caseDef.requiredChecks.map((c) => {
            const done = record.completedChecks.includes(c.id);
            return (
              <p key={c.id} className={`mj-callout ${done ? "mj-callout--success" : "mj-callout--warning"}`}>
                <span className="mj-callout__title">
                  {done ? <IconCheck size={14} /> : <IconAlert size={14} />}
                  {c.label}
                </span>
                {c.feedback}
              </p>
            );
          })}
        </div>
      </section>

      {/* 5. 行动反馈 */}
      <section className="mj-card">
        <div className="mj-card__body">
          <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
            下一步行动
          </h3>
          {selectedAction ? (
            <p className="mj-callout">
              <span className="mj-callout__title">你选择：{selectedAction.label}</span>
              {selectedAction.feedback}
              <span className="mj-tiny" style={{ display: "block", marginTop: 6 }}>
                本项得分：{selectedAction.points} / 10
              </span>
            </p>
          ) : (
            <p className="mj-callout mj-callout--warning">未选择行动。</p>
          )}
        </div>
      </section>

      {/* 6. 信心反馈 */}
      <section className="mj-card">
        <div className="mj-card__body">
          <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
            关于你的把握程度（{record.confidence ?? 50}%）
          </h3>
          <p className={`mj-callout ${conf.tone === "good" ? "mj-callout--success" : conf.tone === "overconfident" ? "mj-callout--warning" : "mj-callout--primary"}`}>
            {conf.text}
          </p>
          <p className="mj-tiny" style={{ marginTop: 8 }}>
            把握程度不计入总分，这里只用于帮助你对照「信心」与「证据」是否匹配，不做任何人格或能力评价。
          </p>
        </div>
      </section>

      {/* 7. 建议核查路径 */}
      <section className="mj-card">
        <div className="mj-card__body">
          <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 8 }}>
            建议的核查路径
          </h3>
          <div className="mj-steps">
            {caseDef.reasoningPath.slice(0, 4).map((s, i) => (
              <p className="mj-steps__item" key={i}>
                {s}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 8. 带走的原则 */}
      <section className="mj-card">
        <div className="mj-card__body">
          <p className="mj-callout mj-callout--primary">
            <span className="mj-callout__title">
              <IconInfo size={15} /> 可以迁移到真实生活的原则
            </span>
            {caseDef.takeaway}
          </p>
          <div style={{ marginTop: "var(--space-3)" }}>
            <p className="mj-eyebrow" style={{ marginBottom: 6 }}>
             本案材料说明
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {caseDef.sourceNotes.map((n, i) => (
                <li className="mj-tiny" key={i}>
                  · {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 操作按钮 */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        {nextCaseId ? (
          <button type="button" className="mj-btn mj-btn--primary" onClick={onGoNext}>
            继续下一案 <IconArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="mj-btn mj-btn--primary" onClick={onGoMap}>
            回任务地图
          </button>
        )}
        <button type="button" className="mj-btn mj-btn--ghost" onClick={onRetry}>
          <IconRefresh size={16} /> 重做本案
        </button>
        <button type="button" className="mj-btn mj-btn--ghost" onClick={onGoMap}>
          回任务地图
        </button>
      </div>

      {record.history && record.history.length > 1 ? (
        <p className="mj-tiny">
          本案作答历史（保留可追溯记录，重做不会覆盖首次成绩）：
          {record.history.map((h, i) => (
            <span key={i}>
              {" "}
              第 {i + 1} 次 {h.total} 分
              {i < record.history!.length - 1 ? "；" : "。"}
            </span>
          ))}
          <br />
          报告默认采用<strong>最佳成绩</strong>（当前 {record.bestScore} 分），并同时显示最近一次成绩。
        </p>
      ) : null}

      {reviewItem ? (
        <EvidenceDrawer
          item={reviewItem}
          index={caseDef.evidence.findIndex((e) => e.id === reviewItem.id)}
          selected={record.selectedEvidenceIds.includes(reviewItem.id)}
          revealed
          readOnly
          onClose={() => setOpenEvidenceId(null)}
          onToggle={() => undefined}
        />
      ) : null}
    </div>
  );
}
