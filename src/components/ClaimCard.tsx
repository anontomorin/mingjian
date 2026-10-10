/**
 * 明鉴 · 待核查主张卡
 * 只展示主张文本、发布者、时间与模拟标识（文档 10.1）。
 */

import type { CaseDefinition } from "../types";
import { IconAlert } from "./Icons";

export function ClaimCard({ caseDef }: { caseDef: CaseDefinition }) {
  return (
    <section className="mj-card mj-claim-card" aria-labelledby="mj-claim-title">
      <div className="mj-card__head">
        <h2 className="mj-h3" id="mj-claim-title" style={{ fontSize: "var(--font-size-md)" }}>
          待核查主张
        </h2>
        <span className="mj-badge" style={{ marginLeft: "auto" }}>
          虚构教学模拟
        </span>
      </div>
      <div className="mj-card__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p className="mj-claim__quote">「{caseDef.claim.text}」</p>

        <div className="mj-kv">
          <span className="mj-kv__key">发布账号</span>
          <span className="mj-kv__value">{caseDef.claim.publisher}</span>
          <span className="mj-kv__key">时间</span>
          <span className="mj-kv__value">{caseDef.claim.timeLabel}</span>
        </div>

        <div>
          <p className="mj-eyebrow" style={{ marginBottom: 4 }}>
            传播语境
          </p>
          <p className="mj-small mj-muted" style={{ lineHeight: 1.7 }}>
            {caseDef.claim.context}
          </p>
        </div>

        <p
          className="mj-banner mj-banner--warning"
          style={{ padding: "var(--space-2) var(--space-3)" }}
        >
          <IconAlert size={16} style={{ flex: "none", marginTop: 2 }} />
          <span>
            本案例的学校、机构、人物、时间、数值与截图均为虚构教学模拟，界面材料由 CSS/SVG 自绘，不对应任何真实事件。
          </span>
        </p>
      </div>
    </section>
  );
}
