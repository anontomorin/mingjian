/**
 * 明鉴 · 模拟界面渲染
 * 所有“截图 / 网页 / 照片 / 图表”都用 CSS 与原生 SVG 自绘，
 * 不使用任何外部图片服务，也不需要联网。
 */

import type { EvidenceMock } from "../types";

export function EvidenceMockView({ mock }: { mock: EvidenceMock }) {
  switch (mock.kind) {
    case "noticeScreenshot":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__dot" />
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">转发截图 · 无原始网址（教学模拟）</span>
          </div>
          <div className="mj-mock__body">
            <div className="mj-mock__seal">校徽样式图案（模拟）</div>
            <div className="mj-mock__notice-headline">{mock.headline}</div>
            {mock.body.map((line, i) => (
              <p className="mj-mock__notice-body" key={i}>
                {line}
              </p>
            ))}
            {mock.badge ? <p className="mj-mock__footnote">⚠ {mock.badge}</p> : null}
          </div>
        </div>
      );

    case "webList":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.siteName}</span>
          </div>
          <div className="mj-mock__body">
            {mock.siteNote ? <p className="mj-mock__footnote">{mock.siteNote}</p> : null}
            {mock.rows.map((row, i) => (
              <div className="mj-mock__row" key={i}>
                <span>{row}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "systemPanel":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.panelName}</span>
          </div>
          <div className="mj-mock__body">
            {mock.rows.map((row, i) => (
              <div className="mj-mock__row" key={i}>
                <span>{row}</span>
              </div>
            ))}
            <p className="mj-mock__footnote">{mock.footnote}</p>
          </div>
        </div>
      );

    case "commentList":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">评论区（教学模拟）</span>
          </div>
          <div className="mj-mock__body">
            {mock.comments.map((c, i) => (
              <div className="mj-mock__comment" key={i}>
                <span className="mj-mock__avatar">{(i % 9) + 1}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "photoCard":
      return (
        <div className="mj-mock">
          <div
            className={`mj-mock__photo mj-mock__photo--${mock.tone}`}
            role="img"
            aria-label={mock.tone === "flood" ? "积水场景示意（CSS 自绘）" : "动物概念图示意（CSS 自绘）"}
          >
            <span className="mj-mock__photo-label">CSS 自绘示意 · 非真实照片</span>
          </div>
          <div className="mj-mock__body">
            <p>{mock.caption}</p>
            <p className="mj-mock__footnote">⚠ {mock.note}</p>
          </div>
        </div>
      );

    case "archivePage":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.archiveName}</span>
          </div>
          <div className="mj-mock__body">
            <div className="mj-mock__row">
              <span className="mj-mock__row-key">档案日期</span>
              <span>{mock.dateLabel}</span>
            </div>
            <div className="mj-mock__row">
              <span className="mj-mock__row-key">原始标题</span>
              <span>{mock.title}</span>
            </div>
            <p className="mj-mock__quote">{mock.note}</p>
          </div>
        </div>
      );

    case "barChart": {
      const max = Math.max(...mock.bars.map((b) => b.value));
      const min = mock.axisStart;
      const span = Math.max(max - min, 1);
      const plotH = 130;
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">柱状图（教学模拟 · 原生 SVG）</span>
          </div>
          <div className="mj-mock__body">
            <div className="mj-chart">
              <svg
                viewBox="0 0 260 180"
                width="100%"
                height="180"
                role="img"
                aria-label={`柱状图：${mock.bars
                  .map((b) => `${b.label} ${b.value}`)
                  .join("，")}；纵轴起点 ${min}`}
              >
                <line x1="38" y1="14" x2="38" y2="150" stroke="#BCCBC7" strokeWidth="1" />
                <line x1="38" y1="150" x2="250" y2="150" stroke="#BCCBC7" strokeWidth="1" />
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const y = 150 - t * plotH;
                  const v = Math.round(min + t * span);
                  return (
                    <g key={t}>
                      <line x1="38" y1={y} x2="250" y2={y} stroke="#EEF4F2" strokeWidth="1" />
                      <text x="32" y={y + 4} fontSize="10" textAnchor="end" fill="#687875">
                        {v}
                      </text>
                    </g>
                  );
                })}
                {mock.bars.map((b, i) => {
                  const h = ((b.value - min) / span) * plotH;
                  const x = 60 + i * 90;
                  return (
                    <g key={b.label}>
                      <rect x={x} y={150 - h} width="52" height={h} rx="4" fill={b.color} />
                      <text
                        x={x + 26}
                        y={150 - h - 6}
                        fontSize="11"
                        textAnchor="middle"
                        fill="#182C2A"
                        fontWeight="700"
                      >
                        {b.value}
                      </text>
                      <text x={x + 26} y="166" fontSize="11" textAnchor="middle" fill="#687875">
                        {b.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="mj-mock__footnote">
              {mock.axisLabel}　⚠ {mock.caption}
            </p>
          </div>
        </div>
      );
    }

    case "dataTable":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.caption}</span>
          </div>
          <div className="mj-mock__body">
            <table className="mj-table">
              <thead>
                <tr>
                  {mock.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mock.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "formulaCard":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">核查方法卡 · 明鉴</span>
          </div>
          <div className="mj-mock__body">
            <p className="mj-mono" style={{ fontWeight: 600 }}>
              {mock.formula}
            </p>
            {mock.steps.map((s, i) => (
              <p className="mj-mono" key={i}>
                {s}
              </p>
            ))}
            <p style={{ fontWeight: 700, color: "var(--color-primary)" }}>{mock.result}</p>
          </div>
        </div>
      );

    case "articleHead":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.outlet}</span>
          </div>
          <div className="mj-mock__body">
            <p style={{ fontSize: "var(--font-size-md)", fontWeight: 700, lineHeight: 1.5 }}>
              {mock.headline}
            </p>
            <p className="mj-mock__footnote">{mock.dateLabel}</p>
            <p>{mock.body}</p>
          </div>
        </div>
      );

    case "reportPanel":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.title}</span>
          </div>
          <div className="mj-mock__body">
            {mock.lines.map((line, i) => (
              <div className="mj-mock__row" key={i}>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "quoteCard":
      return (
        <div className="mj-mock">
          <div className="mj-mock__body">
            <p className="mj-mock__quote">{mock.quote}</p>
            <p className="mj-mock__footnote">
              —— {mock.attribution}
              {mock.note ? `　⚠ ${mock.note}` : ""}
            </p>
          </div>
        </div>
      );

    case "subtitleStrip":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">视频字幕（教学模拟）</span>
          </div>
          <div className="mj-mock__body">
            <div>
              {mock.fragments.map((f, i) => (
                <span
                  className={`mj-mock__fragment${f.cut ? " mj-mock__fragment--cut" : ""}`}
                  key={i}
                >
                  {f.text}
                </span>
              ))}
            </div>
            <p className="mj-mock__footnote">⚠ {mock.note}</p>
          </div>
        </div>
      );

    case "transcriptPage":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.source}</span>
          </div>
          <div className="mj-mock__body">
            {mock.lines.map((line, i) => (
              <p key={i} style={{ lineHeight: 1.7 }}>
                {line.includes(mock.highlight) ? (
                  <>
                    {line.split(mock.highlight)[0]}
                    <mark style={{ background: "var(--color-primary-soft)", padding: "0 2px" }}>
                      {mock.highlight}
                    </mark>
                    {line.split(mock.highlight)[1]}
                  </>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
        </div>
      );

    case "timelineNote":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.source}</span>
          </div>
          <div className="mj-mock__body">
            {mock.lines.map((line, i) => (
              <p className="mj-mono" key={i} style={{ fontSize: "var(--font-size-xs)" }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      );

    case "audioCard":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.label}</span>
          </div>
          <div className="mj-mock__body">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} aria-hidden="true">
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: 8 + ((i * 7) % 22),
                    borderRadius: 2,
                    background: "var(--color-primary-border)",
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
            <p className="mj-mock__quote">{mock.transcript}</p>
            <p className="mj-mock__footnote">⚠ {mock.note}　（音频为界面示意，无真实录音）</p>
          </div>
        </div>
      );

    case "officialNotice":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.siteName}</span>
          </div>
          <div className="mj-mock__body">
            <p style={{ fontWeight: 700, fontSize: "var(--font-size-md)" }}>{mock.title}</p>
            {mock.lines.map((line, i) => (
              <p key={i} style={{ lineHeight: 1.7 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      );

    case "contactCheck":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">独立核验记录（教学模拟）</span>
          </div>
          <div className="mj-mock__body">
            <div className="mj-mock__row">
              <span className="mj-mock__row-key">号码来源</span>
              <span>{mock.channel}</span>
            </div>
            {mock.lines.map((line, i) => (
              <p key={i} style={{ lineHeight: 1.7 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      );

    case "formPage":
      return (
        <div className="mj-mock">
          <div className="mj-mock__bar">
            <span className="mj-mock__dot" />
            <span className="mj-mock__url">{mock.siteName}</span>
          </div>
          <div className="mj-mock__body">
            <p style={{ fontWeight: 700 }}>{mock.title}</p>
            {mock.lines.map((line, i) => (
              <div className="mj-mock__row" key={i}>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "posterCard":
      return (
        <div className="mj-mock">
          <div className="mj-mock__body" style={{ background: "var(--color-warning-soft)" }}>
            <p style={{ fontWeight: 700, fontSize: "var(--font-size-md)" }}>{mock.title}</p>
            {mock.lines.map((line, i) => (
              <p key={i} style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
                {line}
              </p>
            ))}
            <p className="mj-mock__footnote">⚠ {mock.warn}</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
