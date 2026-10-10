/**
 * 明鉴 · 证据详情抽屉
 * 打开即记录 openedEvidenceIds；展示完整内容、模拟界面与“能支持/不能证明”。
 * Modal/Drawer 打开后可关闭、焦点不丢失（文档 9.5）。
 */

import { useEffect, useRef } from "react";
import type { EvidenceItem } from "../types";
import { IconClose, IconCheck, IconAlert, IconPlus, IconMinus, IconInfo } from "./Icons";
import { EvidenceMockView } from "./EvidenceMockView";

export function EvidenceDrawer({
  item,
  index,
  selected,
  revealed = false,
  readOnly = false,
  onClose,
  onToggle,
}: {
  item: EvidenceItem;
  index: number;
  selected: boolean;
  /**
   * 是否已提交本案。未提交时只展示材料本身（模拟界面 + 全文），
   * 不展开「能支持什么 / 不能单独证明什么」——那等于替玩家做了判断。
   */
  revealed?: boolean;
  /** 回看模式：不渲染加入/移除证据链按钮 */
  readOnly?: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panelRef.current) {
        // 焦点锁在抽屉内
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="mj-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mj-drawer mj-anim-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mj-drawer-title"
        ref={panelRef}
      >
        <div className="mj-drawer__head">
          <div style={{ minWidth: 0 }}>
            <p className="mj-eyebrow">
              证据 E{index + 1} · {item.sourceType}
            </p>
            <h2 className="mj-drawer__title" id="mj-drawer-title">
              {item.title}
            </h2>
            <p className="mj-tiny" style={{ marginTop: 4 }}>
              {item.sourceLabel}
              {item.dateLabel ? ` · ${item.dateLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="mj-drawer__close"
            onClick={onClose}
            aria-label="关闭证据详情"
            ref={closeRef}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="mj-drawer__body">
          <span className="mj-badge">教学模拟材料 · 不对应真实来源</span>

          {item.mock ? <EvidenceMockView mock={item.mock} /> : null}

          <section>
            <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 6 }}>
              材料全文
            </h3>
            {item.fullContent.split("\n").map((line, i) => (
              <p key={i} style={{ lineHeight: 1.75, minHeight: line ? undefined : 8 }}>
                {line}
              </p>
            ))}
          </section>

          {revealed ? (
            <>
              <section>
                <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 6 }}>
                  这条材料能支持什么
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.canSupport.map((s, i) => (
                    <li key={i} className="mj-callout mj-callout--success" style={{ padding: "8px 12px" }}>
                      <IconCheck size={14} style={{ flex: "none" }} />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mj-h3" style={{ fontSize: "var(--font-size-md)", marginBottom: 6 }}>
                  它不能单独证明什么
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {item.cannotProve.map((s, i) => (
                    <li key={i} className="mj-callout mj-callout--warning" style={{ padding: "8px 12px" }}>
                      <IconAlert size={14} style={{ flex: "none" }} />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <section className="mj-locked" aria-live="polite">
              <span className="mj-locked__title">
                <IconInfo size={14} /> 提交后揭晓
              </span>
              <p>
                这份材料的分析——它能支撑主张的哪一部分、又覆盖不到哪里——会在你提交结论之后解锁。
                现在就给出分析，等于替你做了判断；而判断本身正是这一关要你练的部分。
              </p>
              <p className="mj-tiny">
                你可以先自己写下判断依据：它的来源是谁、发布在什么时间、能覆盖主张中的哪一部分。
              </p>
            </section>
          )}
        </div>

        <div className="mj-drawer__foot">
          {readOnly ? null : (
            <button
              type="button"
              className={`mj-btn ${selected ? "mj-btn--ghost" : "mj-btn--primary"}`}
              onClick={onToggle}
              aria-pressed={selected}
            >
              {selected ? <IconMinus size={15} /> : <IconPlus size={15} />}
              {selected ? "从证据链移除" : "加入证据链"}
            </button>
          )}
          <button type="button" className="mj-btn mj-btn--ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
