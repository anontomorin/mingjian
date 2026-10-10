/**
 * 明鉴 · 顶部导航
 * 文档 3.1：Logo、任务进度、帮助 / 项目说明入口。
 */

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { IconMenu, IconClose, IconSearch } from "./Icons";
import { useProgress } from "../app/ProgressProvider";
import { CASES } from "../data/cases";
import { countCompleted } from "../engine/progression";

const NAV_ITEMS = [
  { to: "/", label: "调查室", end: true },
  { to: "/tutorial", label: "引导关", end: false },
  { to: "/missions", label: "任务地图", end: false },
  { to: "/report", label: "学习报告", end: false },
  { to: "/about", label: "项目说明", end: false },
];

export function AppHeader() {
  const { progress } = useProgress();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const completed = countCompleted(progress.cases);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="mj-header">
      <div className="mj-header__inner">
        <NavLink to="/" className="mj-brand">
          <span className="mj-brand__mark" aria-hidden="true">
            <IconSearch size={17} />
          </span>
          <span>
            明鉴
            <span className="mj-brand__tagline"> · 信息核查训练场</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="mj-nav__toggle"
          aria-expanded={open}
          aria-controls="mj-main-nav"
          aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose size={20} /> : <IconMenu size={20} />}
        </button>

        <nav
          id="mj-main-nav"
          className={`mj-nav${open ? " mj-nav--open" : ""}`}
          aria-label="主导航"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="mj-nav__link"
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/?guide=1" className="mj-nav__link" style={{ marginLeft: 8 }}>
            玩法说明
          </Link>
          <span
            className="mj-tag mj-tag--primary"
            style={{ marginLeft: 8 }}
            aria-label={`已完成 ${completed} 个案例，共 ${CASES.length} 个`}
          >
            {completed}/{CASES.length}
          </span>
        </nav>
      </div>
    </header>
  );
}
