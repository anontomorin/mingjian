/**
 * 明鉴 · 证据卡
 * 展示编号、标题、来源标签、证据类型与摘要；支持查看详情与加入/移出证据链。
 * 该组件不计算分数（文档 10.1）。
 */

import type { EvidenceItem } from "../types";
import { IconEye, IconPlus, IconMinus, IconCheck } from "./Icons";

export function EvidenceCard({
  item,
  index,
  selected,
  selectedOrder,
  opened,
  revealed = false,
  revealedRole = "neutral",
  readOnly = false,
  onOpen,
  onToggle,
}: {
  item: EvidenceItem;
  index: number;
  selected: boolean;
  /** 在证据链中的顺序编号（从 1 开始） */
  selectedOrder: number | null;
  opened: boolean;
  /**
   * 是否已提交本案。未提交时不显示「易误用材料 / 关键证据」等角色标记，
   * 也不在详情页展开「能支持什么 / 不能证明什么」，避免把答案写在材料上。
   */
  revealed?: boolean;
  /** 提交后该材料在本案中的角色 */
  revealedRole?: "key" | "distractor" | "neutral";
  /** 回看模式：只可查看，不能修改证据链（此时不渲染加入/移除按钮） */
  readOnly?: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const seq = `E${index + 1}`;

  return (
    <article
      className={`mj-evidence${selected ? " mj-evidence--selected" : ""}`}
      aria-labelledby={`ev-${item.id}-title`}
    >
      <div className="mj-evidence__head">
        <span className="mj-evidence__seq" aria-hidden="true">
          {seq}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="mj-evidence__title" id={`ev-${item.id}-title`}>
            {item.title}
          </h3>
          <p className="mj-evidence__source">
            {item.sourceLabel}
            {item.dateLabel ? ` · ${item.dateLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="mj-evidence__meta">
        <span className="mj-tag mj-tag--blue">{item.sourceType}</span>
        {/* 角色标记只在提交后揭晓：提交前显示会直接告诉玩家哪份材料不该选 */}
        {revealed && revealedRole === "key" ? (
          <span className="mj-tag mj-tag--success">关键证据</span>
        ) : null}
        {revealed && revealedRole === "distractor" ? (
          <span className="mj-tag mj-tag--warning">易误用材料</span>
        ) : null}
        {selected && selectedOrder !== null ? (
          <span className="mj-tag mj-tag--primary">证据链第 {selectedOrder} 项</span>
        ) : null}
        {opened ? (
          <span className="mj-evidence__opened">
            <IconCheck size={12} /> 已查看
          </span>
        ) : null}
      </div>

      <p className="mj-evidence__summary">{item.summary}</p>

      <div className="mj-evidence__actions">
        <button type="button" className="mj-btn mj-btn--ghost mj-btn--sm" onClick={onOpen}>
          <IconEye size={14} />
          查看详情
        </button>
        {readOnly ? null : (
          <button
            type="button"
            className={`mj-btn mj-btn--sm ${selected ? "mj-btn--danger" : "mj-btn--secondary"}`}
            onClick={onToggle}
            aria-pressed={selected}
          >
            {selected ? <IconMinus size={14} /> : <IconPlus size={14} />}
            {selected ? "从证据链移除" : "加入证据链"}
          </button>
        )}
      </div>
    </article>
  );
}
