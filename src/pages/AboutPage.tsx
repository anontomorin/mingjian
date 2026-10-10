/**
 * 明鉴 · 项目说明
 * 文档 3.1 / 2.3 / 8.5：教育目标、核查方法、案例模拟声明、数据与隐私、功能边界、参考资料。
 */

import { useState } from "react";
import { useProgress } from "../app/ProgressProvider";
import { CASES } from "../data/cases";
import { ClearProgressDialog } from "../components/EmptyState";
import { IconAlert, IconInfo, IconSearch, SkillIcon } from "../components/Icons";
import { SKILL_LABELS } from "../engine/scoring";
import { STORAGE_KEY } from "../storage/progressStore";

const SIFT_STEPS = [
  {
    key: "S",
    title: "暂停 Stop",
    desc: "看到情绪强烈的标题、截图或转发量时，先停下来，不要在未核实前点赞、转发或付款。",
  },
  {
    key: "I",
    title: "调查来源 Investigate the source",
    desc: "这个账号是谁？有没有认证信息？原始发布在哪里？版式正式不等于官方发布。",
  },
  {
    key: "F",
    title: "寻找更好的报道 Find better coverage",
    desc: "去找更可靠、更完整的报道；多个账号重复同一来源，不等于多个独立来源。",
  },
  {
    key: "T",
    title: "追溯原始语境 Trace to original context",
    desc: "追溯图片、引述、视频、数据到它们最初出现的地方，确认时间与语境是否被改写。",
  },
];

export function AboutPage() {
  const { progress, resetAll, setPreference } = useProgress();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="mj-page mj-anim-page">
      <header>
        <p className="mj-eyebrow">项目说明</p>
        <h1 className="mj-h1" style={{ fontSize: "var(--font-size-2xl)" }}>
          明鉴在做什么，不做什么
        </h1>
        <p className="mj-lede" style={{ marginTop: 6 }}>
          《明鉴：AI 时代的信息核查训练场》是一套面向大学生及普通网络信息使用者的交互式信息素养训练工具。
          作品主张：<strong>不是替你判断真假，而是训练你找到证据。</strong>
        </p>
      </header>

      <div className="mj-prose mj-section">
        <h3>教育目标</h3>
        <p>
          完成全部案例后，使用者应能够：识别发布主体与原始来源；追溯图片、引述与数据的原始语境；
          寻找相互独立、可追溯的证据；检查样本量、指标、基数与图表坐标轴；
          在证据不足时保持谨慎；在转发、付款、扫码或提交个人信息之前采取负责任的核查行动。
        </p>
        <p className="mj-small mj-muted">
          本项目不以「是否记住某题的固定答案」「是否认为网上信息都是假的」「是否相信肉眼能检测 AI 生成内容」
          作为成功标准——后面两点恰恰是本作品要纠正的误区。
        </p>

        <h3 id="method">训练使用的核查方法</h3>
        <p>
          案例流程参考媒体与信息素养教育、在线信息评估以及 SIFT 方法的公开教学资源进行设计，
          但本项目的案例、文本、界面与评分规则均由开发者自行编写，不照搬现成题库。
        </p>
        <div className="mj-steps" style={{ marginTop: "var(--space-3)" }}>
          {SIFT_STEPS.map((s) => (
            <p className="mj-steps__item" key={s.key}>
              <span>
                <strong>{s.title}：</strong>
                {s.desc}
              </span>
            </p>
          ))}
        </div>

        <h3>八个案例与技能覆盖</h3>
        <ul>
          {CASES.map((c) => (
            <li key={c.id}>
              <strong>
                {c.id} · {c.title}
              </strong>
              （{c.level}，标准结论：{verdictText(c.verdict)}）—
              {c.skillTags.map((t) => SKILL_LABELS[t]).join("、")}
            </li>
          ))}
        </ul>
        <p className="mj-small mj-muted">
          技能图标：
          <SkillIcon skill="source" size={12} /> 来源 ·
          <SkillIcon skill="context" size={12} /> 语境 ·
          <SkillIcon skill="crossCheck" size={12} /> 交叉验证 ·
          <SkillIcon skill="data" size={12} /> 数据 ·
          <SkillIcon skill="aiMedia" size={12} /> AI 内容 ·
          <SkillIcon skill="responsibleAction" size={12} /> 负责任行动
        </p>

        <h3>案例的虚构性质</h3>
        <p className="mj-banner mj-banner--warning">
          <IconAlert size={16} style={{ flex: "none", marginTop: 3 }} />
          <span>
            全部 {CASES.length} 个案例中的学校、机构、人物、事件、时间、样本与数值
            <strong>均为虚构教学模拟</strong>，不对应任何真实事件、真实机构或真实个人。
            案例页面与证据详情中持续标注「教学模拟」；界面中的截图、照片、图表、音频均由 CSS 与原生 SVG 自绘，
            不使用真实肖像、真实录音或未经授权的素材。虚构页面统一标注为「教学模拟站点」，不会跳转到任何真实网站。
          </span>
        </p>

        <h3>功能边界（本产品不做的事）</h3>
        <ul>
          <li>不接入实时 AI 图片 / 音频 / 视频鉴伪接口，不宣称能够自动鉴定现实内容的真假。</li>
          <li>不接入后端、数据库、用户账号、云端同步、排行榜或在线新闻爬取。</li>
          <li>不使用大模型自由对话，不生成无限题目，不做必须联网才能工作的功能。</li>
          <li>不把「图片看起来奇怪」「疑似 AI 痕迹」单独作为判断内容真假的充分证据。</li>
          <li>不把「没有查到证据」自动等同于「是假的」；也不把「有 AI 生成痕迹」当作结论依据。</li>
          <li>不仿冒真实学校、政府或机构的官方页面。</li>
        </ul>

        <h3>数据与隐私</h3>
        <ul>
          <li>
            所有进度保存在你本机浏览器的 localStorage 中，主键为 <code>{STORAGE_KEY}</code>，
            不上传任何答题记录，不采集姓名、学号、手机号、精确位置或其他个人信息。
          </li>
          <li>没有服务器、没有账号、没有云端同步；断网后核心案例流程仍可正常使用。</li>
          <li>
            你可以在报告页或本页点击「清空本机记录」删除全部本地数据，操作只会清除明鉴自己的存档键，
            不会影响其他网站的数据。
          </li>
          <li>存档读取失败或内容损坏时，应用会重置为初始状态并给出提示，不会白屏。</li>
        </ul>

        <h3>可访问性与显示设置</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "var(--space-2)" }}>
          <button
            type="button"
            className={`mj-btn mj-btn--sm ${
              progress.preferences.motionReduced ? "mj-btn--secondary" : "mj-btn--ghost"
            }`}
            aria-pressed={progress.preferences.motionReduced}
            onClick={() => setPreference({ motionReduced: !progress.preferences.motionReduced })}
          >
            {progress.preferences.motionReduced ? "已减少动效" : "减少动效"}
          </button>
          <button
            type="button"
            className={`mj-btn mj-btn--sm ${
              progress.preferences.textScale === "large" ? "mj-btn--secondary" : "mj-btn--ghost"
            }`}
            aria-pressed={progress.preferences.textScale === "large"}
            onClick={() =>
              setPreference({
                textScale: progress.preferences.textScale === "large" ? "normal" : "large",
              })
            }
          >
            {progress.preferences.textScale === "large" ? "已使用大字号" : "大字号"}
          </button>
          <span className="mj-tiny" style={{ alignSelf: "center" }}>
            同时自动尊重系统的 <code>prefers-reduced-motion</code> 设置。
          </span>
        </div>

        <h3>技术实现</h3>
        <ul>
          <li>React + Vite + TypeScript，纯前端静态应用，可离线运行。</li>
          <li>路由：React Router；样式：设计 token + 普通 CSS（无 UI 框架依赖）。</li>
          <li>图表与图标：原生 SVG 与 CSS 自绘；不依赖外部图片服务或图标库。</li>
          <li>案例、前后测题目位于独立数据文件；评分、解锁、报告聚合均为可单独测试的纯函数。</li>
          <li>存档：localStorage 单键存储，带 schema 版本号与异常兜底。</li>
        </ul>

        <h3>参考资料</h3>
        <p className="mj-small">
          以下资源用于指导教学目标与核查流程的设计，不代表本项目已获得相关机构认可或与其存在合作关系。
        </p>
        <ul className="mj-small">
          <li>
            UNESCO, “Introduction: Media and Information Literacy Curriculum”.
            https://www.unesco.org/mil4teachers/en/introduction
          </li>
          <li>
            Los Angeles Valley College Library, “What is the SIFT Method?”.
            https://lib.lavc.edu/information-evaluation/siftmethod
          </li>
          <li>
            Stanford Graduate School of Education, “Civic Online Reasoning curriculum”.
            https://ed.stanford.edu/node/21844
          </li>
          <li>
            全国大学生数字媒体科技作品及创意竞赛组委会：2026 年第十四届竞赛参赛指南（自主选题类 · 智慧教育与科普创作类赛项）。
            官网：https://www.cmit.cn/ （提交前请以官网最新通知为准。）
          </li>
        </ul>
      </div>

      <hr className="mj-divider" />

      <section>
        <h2 className="mj-h2">存档管理</h2>
        <p className="mj-small mj-muted" style={{ marginTop: 6 }}>
          当前存档更新时间：
          {progress.updatedAt ? new Date(progress.updatedAt).toLocaleString("zh-CN") : "—"}
          ；已完成案例 {Object.values(progress.cases).filter((c) => c.status === "completed").length} /{" "}
          {CASES.length}；前测{progress.pretest ? "已完成" : "未完成"}；后测
          {progress.posttest ? "已完成" : "未完成"}。
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "var(--space-3)" }}>
          <button type="button" className="mj-btn mj-btn--danger" onClick={() => setClearOpen(true)}>
            清空本机记录
          </button>
        </div>
        <p className="mj-tiny" style={{ marginTop: 8 }}>
          <IconInfo size={12} /> 清空需要二次确认，且无法撤销。
        </p>
      </section>

      <p className="mj-banner mj-banner--info" style={{ marginTop: "var(--space-6)" }}>
        <IconSearch size={16} style={{ flex: "none", marginTop: 3 }} />
        <span>
          如果你发现案例内容、评分规则或无障碍体验上的问题，欢迎在提交材料时一并反馈。
          本作品的目标不是给出标准答案，而是让使用者获得可迁移的核查方法。
        </span>
      </p>

      <ClearProgressDialog
        open={clearOpen}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          resetAll();
          setClearOpen(false);
        }}
      />
    </div>
  );
}

function verdictText(v: string): string {
  switch (v) {
    case "supported":
      return "有证据支持";
    case "contradicted":
      return "与证据冲突";
    case "misleading":
      return "呈现方式存在误导";
    case "insufficient":
      return "证据不足";
    default:
      return v;
  }
}
