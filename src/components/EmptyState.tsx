/**
 * 明鉴 · 空状态 / 清除确认对话框 / 模拟标识
 */

import { useEffect, useRef } from "react";
import { IconAlert, IconInfo, IconSearch } from "./Icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mj-empty">
      <div className="mj-empty__icon" aria-hidden="true">
        <IconSearch size={20} />
      </div>
      <p style={{ fontWeight: 650, color: "var(--color-text)" }}>{title}</p>
      {description ? (
        <p className="mj-small" style={{ marginTop: 6 }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "var(--space-4)" }}>{action}</div> : null}
    </div>
  );
}

export function SimulationBadge({ text = "虚构教学模拟" }: { text?: string }) {
  return (
    <span className="mj-badge">
      <IconInfo size={12} />
      {text}
    </span>
  );
}

/** 存档异常提示条 */
export function StorageNotice({
  message,
  onDismiss,
  tone = "warning",
}: {
  message: string;
  onDismiss?: () => void;
  tone?: "warning" | "danger" | "info";
}) {
  if (!message) return null;
  return (
    <div className={`mj-banner mj-banner--${tone}`} role="status">
      <IconAlert size={16} style={{ flex: "none", marginTop: 2 }} />
      <span>{message}</span>
      {onDismiss ? (
        <button
          type="button"
          className="mj-btn mj-btn--sm mj-btn--ghost mj-banner__action"
          onClick={onDismiss}
        >
          知道了
        </button>
      ) : null}
    </div>
  );
}

/** 清空数据二次确认 */
export function ClearProgressDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="mj-dialog__overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mj-dialog" role="dialog" aria-modal="true" aria-labelledby="mj-clear-title">
        <h2 className="mj-h3" id="mj-clear-title">
          确认清空本机记录？
        </h2>
        <p className="mj-small mj-muted">
          将删除本应用保存在你浏览器中的全部进度：前测与后测记录、8 个案例的作答与历史、学习报告数据。
          此操作无法撤销。
        </p>
        <p className="mj-callout mj-callout--warning mj-small">
          只会清除明鉴自身的存档键 <code>mingjian.progress.v1</code>，不会删除其他网站的数据。
        </p>
        <div className="mj-dialog__actions">
          <button type="button" className="mj-btn mj-btn--ghost" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="mj-btn mj-btn--danger"
            onClick={onConfirm}
            ref={confirmRef}
          >
            确认清空
          </button>
        </div>
      </div>
    </div>
  );
}
