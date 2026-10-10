/**
 * 明鉴 · 新手引导
 *
 * 首次进入时自动弹出；之后可从页眉「玩法说明」随时重看（/?guide=1）。
 * 只讲玩法与计分口径，不剧透任何案例答案。
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { IconArrowRight, IconCheck } from "./Icons";

interface GuidePage {
  label: string;
  title: string;
  body: string[];
}

const PAGES: GuidePage[] = [
  {
    label: "这是什么",
    title: "你是核查者，不是答题机器",
    body: [
      "这里有 8 个虚构情境：停课通知、事故照片、统计图表、缴费语音……每个都像你在群里、朋友圈里会刷到的那种内容。",
      "我们不替你判断真假，也不会在页面上标出「这是假的」。你要做的是自己找证据、自己下结论。",
      "四个结论可用：有证据支持、与证据冲突、呈现方式误导、证据不足。查不到证据时，「证据不足」就是正确的谨慎答案。",
    ],
  },
  {
    label: "怎么玩",
    title: "六步走完一个案例",
    body: [
      "① 读主张：看清是谁、在什么时间、对谁说了什么。",
      "② 查证据：点开每份材料的「查看详情」，看它的来源、时间和覆盖了主张的哪一部分；有用的加入证据链。「能支持什么 / 不能证明什么」会在你提交后揭晓，不会提前告诉你。",
      "③ 做核查：完成核查步骤清单里的动作，并手动勾选——系统不会替你自动完成。",
      "④ 下结论：选择四类中你认为最合适的一个，并拖动滑块报告你的把握程度。",
      "⑤ 选行动：选择你接下来真正会做的事（转发、核实、还是别的）。",
      "⑥ 看反馈：提交后逐项看到分数来源、关键证据、遗漏证据与建议核查路径。",
    ],
  },
  {
    label: "怎么算分",
    title: "100 分的四个来源",
    body: [
      "结论 30 分 · 证据选择 35 分 · 核查步骤 25 分 · 下一步行动 10 分。",
      "选了干扰材料会扣分；漏掉关键证据、没完成核查步骤都会少分。",
      "把握程度不计入总分，只用于对照你的信心与证据是否匹配。",
      "重做案例不会覆盖首次成绩，报告里默认采用你的最佳成绩。",
    ],
  },
];

export function Onboarding() {
  const { progress, setPreference } = useProgress();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const forced = params.get("guide") === "1";

  const [open, setOpen] = useState(() => !progress.preferences.onboardingSeen);
  const [page, setPage] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forced) {
      setOpen(true);
      setPage(0);
    }
  }, [forced]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setPreference({ onboardingSeen: true });
    if (forced) {
      navigate(location.pathname, { replace: true });
    }
  };

  /** 看完说明后直接进入引导关：把「读过的说明」变成「亲手做过一遍」 */
  const goTutorial = () => {
    setPreference({ onboardingSeen: true });
    setOpen(false);
    navigate("/tutorial");
  };

  if (!open) return null;

  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <div className="mj-dialog__overlay">
      <div
        className="mj-dialog mj-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mj-guide-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="mj-guide__head">
          <span className="mj-guide__step">
            玩法说明 {String(page + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
          </span>
          <span className="mj-guide__label">{current.label}</span>
        </div>

        <h2 className="mj-h2" id="mj-guide-title" style={{ border: 0, paddingBottom: 0 }}>
          {current.title}
        </h2>

        <ul className="mj-guide__list">
          {current.body.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <div className="mj-guide__nav" aria-hidden="true">
          {PAGES.map((p, i) => (
            <span key={p.label} className={`mj-guide__dot${i === page ? " is-active" : ""}`} />
          ))}
        </div>

        <div className="mj-dialog__actions">
          <button type="button" className="mj-btn mj-btn--ghost" onClick={close}>
            跳过
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {page > 0 ? (
              <button
                type="button"
                className="mj-btn mj-btn--secondary"
                onClick={() => setPage(page - 1)}
              >
                上一步
              </button>
            ) : null}
            {isLast ? (
              <button type="button" className="mj-btn mj-btn--primary" onClick={goTutorial}>
                <IconCheck size={16} /> 进入 3 分钟引导关
              </button>
            ) : (
              <button
                type="button"
                className="mj-btn mj-btn--primary"
                onClick={() => setPage(page + 1)}
              >
                下一步 <IconArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
