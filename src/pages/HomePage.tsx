/**
 * 明鉴 · 首页 / 调查室
 * 文档 3.3：主标题、副标题、说明、主次 CTA、进度摘要、三项能力卡、模拟声明。
 */

import { Link } from "react-router-dom";
import { useProgress } from "../app/ProgressProvider";
import { CASES } from "../data/cases";
import { countCompleted, nextStep } from "../engine/progression";
import { ProgressRing } from "../components/ProgressBar";
import { IconArrowRight, IconAlert } from "../components/Icons";

const ABILITIES = [
  {
    index: "01",
    title: "查来源",
    desc: "在相信一条信息之前，先找到它的发布主体、原始链接与发布时间。正式版式不等于官方发布。",
  },
  {
    index: "02",
    title: "看语境",
    desc: "图片、引述和数据都可能被移出原始语境。追溯原始出处，确认它当初是为了说明什么。",
  },
  {
    index: "03",
    title: "读证据",
    desc: "区分「有证据支持」「与证据冲突」「呈现方式误导」「证据不足」，并据此选择负责任的行动。",
  },
];

export function HomePage() {
  const { progress, setDemoMode } = useProgress();
  const completed = countCompleted(progress.cases);
  const total = CASES.length;
  const step = nextStep(progress);
  const hasProgress = Boolean(progress.pretest) || completed > 0;
  // 新用户先走引导关：未做前测、也没完成过引导关
  const isNew = !progress.pretest && !progress.preferences.tutorialCompleted;

  return (
    <div className="mj-page mj-anim-page">
      <section className="mj-hero">
        <div>
          <p className="mj-eyebrow">信息素养训练 · 教学模拟</p>
          <h1 className="mj-hero__title">明鉴</h1>
          <p className="mj-hero__claim">不是替你判断真假，而是训练你找到证据。</p>
          <p className="mj-hero__desc mj-lede">
            一套关于来源、语境、数据与谨慎决策的信息素养训练工具。
            在 {total} 个虚构情境中，你会亲自查看证据、完成核查步骤、给出结论并选择下一步行动，
            然后看到逐项反馈。
          </p>

          <div className="mj-hero__actions">
            {isNew ? (
              <>
                <Link className="mj-btn mj-btn--primary mj-btn--lg" to="/tutorial">
                  开始：3 分钟引导关 <IconArrowRight size={18} />
                </Link>
                <Link className="mj-btn mj-btn--ghost mj-btn--lg" to="/assessment/pre">
                  我熟悉玩法，直接做前测
                </Link>
              </>
            ) : (
              <>
                <Link className="mj-btn mj-btn--primary mj-btn--lg" to={step.route}>
                  {hasProgress ? step.label : "开始训练"} <IconArrowRight size={18} />
                </Link>
                <Link className="mj-btn mj-btn--ghost mj-btn--lg" to="/tutorial">
                  重玩引导关
                </Link>
              </>
            )}
            <Link className="mj-btn mj-btn--ghost mj-btn--lg" to="/about">
              查看项目说明
            </Link>
          </div>

          <div className="mj-hero__note">
            <span className="mj-badge">
              <IconAlert size={12} /> 全部案例为虚构教学模拟
            </span>
            <span className="mj-tag">
              本应用不会上传你的答题记录，数据只存在本机浏览器
            </span>
          </div>

          {!progress.pretest && !progress.demoMode ? (
            <p className="mj-small mj-muted" style={{ marginTop: "var(--space-4)" }}>
              演示入口（评审可用来快速浏览全部案例，不会写入正式前后测数据）：
              <button
                type="button"
                className="mj-btn mj-btn--sm mj-btn--secondary"
                style={{ marginLeft: 8 }}
                onClick={() => setDemoMode(true)}
              >
                跳过前测，进入演示模式
              </button>
            </p>
          ) : progress.demoMode ? (
            <p className="mj-banner mj-banner--info" style={{ marginTop: "var(--space-4)" }}>
              当前处于<strong>演示模式</strong>：全部案例已开放，此模式下的作答不计入正式前后测数据。
            </p>
          ) : null}
        </div>

        <aside className="mj-card mj-progress-card" aria-labelledby="mj-progress-title">
          <h2 className="mj-h3" id="mj-progress-title" style={{ fontSize: "var(--font-size-md)" }}>
            我的训练进度
          </h2>
          <div className="mj-progress-ring" style={{ marginTop: "var(--space-4)" }}>
            <ProgressRing
              value={completed}
              max={total}
              size={96}
              label={`${completed}/${total}`}
              sublabel="案例"
            />
            <div>
              <p className="mj-small mj-muted">已完成案例</p>
              <p style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
                {completed} / {total}
              </p>
              <p className="mj-tiny" style={{ marginTop: 4 }}>
                {step.hint}
              </p>
            </div>
          </div>

          <div className="mj-stat-grid">
            <div className="mj-stat">
              <div className="mj-stat__value">{progress.pretest ? `${progress.pretest.score}` : "—"}</div>
              <div className="mj-stat__label">前测分数（/100）</div>
            </div>
            <div className="mj-stat">
              <div className="mj-stat__value">
                {progress.posttest ? `${progress.posttest.score}` : "—"}
              </div>
              <div className="mj-stat__label">后测分数（/100）</div>
            </div>
          </div>

          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="mj-btn mj-btn--secondary mj-btn--sm" to="/missions">
              进入任务地图
            </Link>
            <Link className="mj-btn mj-btn--ghost mj-btn--sm" to="/report">
              查看学习报告
            </Link>
          </div>
        </aside>
      </section>

      <section className="mj-section">
        <h2 className="mj-h2">你会练习三种核心能力</h2>
        <div className="mj-ability-grid" style={{ marginTop: "var(--space-4)" }}>
          {ABILITIES.map((a) => (
            <article className="mj-ability" key={a.title}>
              <span className="mj-ability__index" aria-hidden="true">
                {a.index}
              </span>
              <h3 className="mj-ability__title">{a.title}</h3>
              <p className="mj-small mj-ability__desc">{a.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mj-section">
        <h2 className="mj-h2">训练流程</h2>
        <div className="mj-steps" style={{ marginTop: "var(--space-4)" }}>
          <p className="mj-steps__item">
            <strong>引导关（可选）</strong>：3 分钟图形化教学关，带你在虚构情境里亲手走完
            读主张 → 查证据 → 做核查 → 下结论 → 选行动 → 看反馈 的全过程，不计入成绩。
          </p>
          <p className="mj-steps__item">
            <strong>训练前测</strong>：5 道题，建立你自己的基线（每题含结论与行动两部分）。
          </p>
          <p className="mj-steps__item">
            <strong>8 个案例</strong>：查看主张 → 检查证据 → 完成核查步骤 → 选择结论与把握程度 → 选择行动。
          </p>
          <p className="mj-steps__item">
            <strong>逐项反馈</strong>：分数来源、关键证据、遗漏证据、干扰项解释、建议核查路径。
          </p>
          <p className="mj-steps__item">
            <strong>训练后测</strong>：5 道平行题，与前测能力结构相同、题面不同。
          </p>
          <p className="mj-steps__item">
            <strong>学习报告</strong>：案例表现、能力维度、前后测变化与后续建议。
          </p>
        </div>
      </section>
    </div>
  );
}
