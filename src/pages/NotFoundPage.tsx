/**
 * 明鉴 · 未知路由（文档 11.1）
 */

import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { IconArrowRight } from "../components/Icons";

export function NotFoundPage() {
  return (
    <div className="mj-page mj-page--narrow mj-anim-page">
      <EmptyState
        title="这个页面不存在"
        description="请检查地址是否正确。若你是从旧链接进入，可以直接回到调查室或任务地图继续。"
        action={
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="mj-btn mj-btn--primary" to="/">
              回到调查室 <IconArrowRight size={16} />
            </Link>
            <Link className="mj-btn mj-btn--ghost" to="/missions">
              任务地图
            </Link>
            <Link className="mj-btn mj-btn--ghost" to="/about">
              项目说明
            </Link>
          </div>
        }
      />
    </div>
  );
}
