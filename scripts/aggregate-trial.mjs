#!/usr/bin/env node
/**
 * 明鉴 · 试用数据汇总脚本（纯 Node，无第三方依赖）
 *
 * 用法：
 *   node scripts/aggregate-trial.mjs                 # 读取 trial-data/*.json
 *   node scripts/aggregate-trial.mjs a.json b.json   # 指定文件
 *
 * 说明：
 * - 只统计真实导出的文件；目录为空时明确输出「尚无试用数据」，绝不生成占位数字。
 * - 不做显著性检验，不把前后测变化表述为因果效果；样本不足时明确标注。
 * - 输出：控制台摘要 + trial-data/summary.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DIR = path.join(ROOT, "trial-data");
const SNAPSHOT_KIND = "mingjian-trial-snapshot";

const args = process.argv.slice(2);
const files = args.length
  ? args.map((f) => path.resolve(process.cwd(), f))
  : fs.existsSync(DEFAULT_DIR)
  ? fs
      .readdirSync(DEFAULT_DIR)
      .filter((f) => f.endsWith(".json") && f !== "summary.md")
      .map((f) => path.join(DEFAULT_DIR, f))
  : [];

const round1 = (n) => Math.round(n * 10) / 10;
const median = (arr) => {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : round1((s[m - 1] + s[m]) / 2);
};
const stats = (arr) => {
  if (arr.length === 0) return null;
  return {
    n: arr.length,
    mean: round1(arr.reduce((a, b) => a + b, 0) / arr.length),
    median: median(arr),
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
};

const snapshots = [];
const invalid = [];

for (const file of files) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    invalid.push({ file: path.basename(file), reason: `JSON 解析失败：${e.message}` });
    continue;
  }
  if (raw?.kind !== SNAPSHOT_KIND) {
    invalid.push({ file: path.basename(file), reason: "不是明鉴试用快照文件" });
    continue;
  }
  if (raw?.snapshotVersion !== 1) {
    invalid.push({ file: path.basename(file), reason: `快照版本 ${raw?.snapshotVersion} 不受支持` });
    continue;
  }
  snapshots.push({ file: path.basename(file), data: raw });
}

const lines = [];
const say = (s = "") => {
  lines.push(s);
  console.log(s);
};

say("# 明鉴 · 试用数据汇总");
say();
say(`生成时间：${new Date().toISOString()}`);
say(`读取到快照文件：${files.length} 个，其中有效 ${snapshots.length} 个`);
if (invalid.length) {
  say();
  say("## 未计入的文件");
  invalid.forEach((i) => say(`- ${i.file}：${i.reason}`));
}

if (snapshots.length === 0) {
  say();
  say("## 结论");
  say("尚无用户测试数据。");
  say("本应用不会生成任何模拟或占位统计数据；请在真实试用者完成并导出后重新运行本脚本。");
} else {
  const list = snapshots.map((s) => s.data);
  const demoCount = list.filter((s) => s.demoMode).length;
  const totalCases = list[0]?.totalCases ?? 8;

  say();
  say("## 一、样本与完成情况");
  say(`- 有效样本：${list.length} 份（其中演示模式 ${demoCount} 份，正式试用 ${list.length - demoCount} 份）`);
  const completedCounts = list.map((s) => s.completedCases ?? 0);
  const cc = stats(completedCounts);
  say(`- 完成案例数：平均 ${cc.mean} / ${totalCases}，中位数 ${cc.median}，范围 ${cc.min}—${cc.max}`);
  const full = list.filter((s) => (s.completedCases ?? 0) >= totalCases).length;
  say(`- 完成全部 ${totalCases} 个案例：${full} 人（${round1((full / list.length) * 100)}%）`);
  const zero = list.filter((s) => (s.completedCases ?? 0) === 0).length;
  say(`- 未开始任何案例：${zero} 人（${round1((zero / list.length) * 100)}%）`);

  say();
  say("## 二、案例得分");
  const avgBest = list.map((s) => s.averageBest).filter((v) => typeof v === "number");
  if (avgBest.length === 0) {
    say("- 尚无人完成案例，无法统计得分。");
  } else {
    const st = stats(avgBest);
    say(`- 样本：${st.n} 人（按每人已完成案例的最佳成绩平均）`);
    say(`- 平均分：均值 ${st.mean}，中位数 ${st.median}，范围 ${st.min}—${st.max}（满分 100）`);
  }

  say();
  say("## 三、四项维度（已完成案例的平均得分）");
  const dimMap = new Map();
  list.forEach((s) => {
    (s.dimensions ?? []).forEach((d) => {
      if (!dimMap.has(d.key)) dimMap.set(d.key, { label: d.label, max: d.max, values: [] });
      dimMap.get(d.key).values.push(d.earned);
    });
  });
  if (dimMap.size === 0) {
    say("- 暂无维度数据。");
  } else {
    say("| 维度 | 样本 | 平均得分 | 满分 | 得分率 |");
    say("| --- | --- | --- | --- | --- |");
    dimMap.forEach((v) => {
      const st = stats(v.values);
      const ratio = v.max ? round1((st.mean / v.max) * 100) : 0;
      say(`| ${v.label} | ${st.n} | ${st.mean} | ${v.max} | ${ratio}% |`);
    });
  }

  say();
  say("## 四、前后测");
  const preScores = list.map((s) => s.pretest?.score).filter((v) => typeof v === "number");
  const postScores = list.map((s) => s.posttest?.score).filter((v) => typeof v === "number");
  const paired = list.filter(
    (s) => typeof s.pretest?.score === "number" && typeof s.posttest?.score === "number"
  );
  say(`- 完成前测：${preScores.length} 人；完成后测：${postScores.length} 人；两者均完成：${paired.length} 人`);
  if (preScores.length) {
    const st = stats(preScores);
    say(`- 前测分数（满分 100）：均值 ${st.mean}，中位数 ${st.median}，范围 ${st.min}—${st.max}`);
  } else {
    say("- 前测分数：尚无数据。");
  }
  if (postScores.length) {
    const st = stats(postScores);
    say(`- 后测分数（满分 100）：均值 ${st.mean}，中位数 ${st.median}，范围 ${st.min}—${st.max}`);
  } else {
    say("- 后测分数：尚无数据。");
  }
  if (paired.length === 0) {
    say("- 前后测变化：尚无同时完成两份测验的样本，不计算变化值。");
  } else {
    const deltas = paired.map((s) => s.posttest.score - s.pretest.score);
    const st = stats(deltas);
    const up = deltas.filter((d) => d > 0).length;
    const flat = deltas.filter((d) => d === 0).length;
    const down = deltas.filter((d) => d < 0).length;
    say(`- 前后测变化（后测 − 前测）：均值 ${st.mean > 0 ? "+" : ""}${st.mean}，范围 ${st.min > 0 ? "+" : ""}${st.min} — ${st.max > 0 ? "+" : ""}${st.max}`);
    say(`- 变化分布：上升 ${up} 人（${round1((up / paired.length) * 100)}%），持平 ${flat} 人，下降 ${down} 人`);
    say(
      paired.length < 10
        ? `- ⚠️ 配对样本仅 ${paired.length} 人，只能作为观察性描述，不足以支持因果或显著性结论。`
        : `- 配对样本 ${paired.length} 人；仍为观察性数据，未做显著性检验，不应表述为严格的因果效果。`
    );
  }

  say();
  say("## 五、前后测各技能维度（结论题正确率）");
  const skillAgg = new Map();
  list.forEach((s) => {
    Object.entries(s.pretest?.skills ?? {}).forEach(([skill, v]) => {
      if (!skillAgg.has(skill)) skillAgg.set(skill, { pre: { c: 0, t: 0 }, post: { c: 0, t: 0 } });
      skillAgg.get(skill).pre.c += v.correct;
      skillAgg.get(skill).pre.t += v.total;
    });
    Object.entries(s.posttest?.skills ?? {}).forEach(([skill, v]) => {
      if (!skillAgg.has(skill)) skillAgg.set(skill, { pre: { c: 0, t: 0 }, post: { c: 0, t: 0 } });
      skillAgg.get(skill).post.c += v.correct;
      skillAgg.get(skill).post.t += v.total;
    });
  });
  if (skillAgg.size === 0) {
    say("- 暂无前后测作答数据。");
  } else {
    say("| 技能维度 | 前测正确率 | 后测正确率 |");
    say("| --- | --- | --- |");
    skillAgg.forEach((v, skill) => {
      const pre = v.pre.t ? `${round1((v.pre.c / v.pre.t) * 100)}%（${v.pre.c}/${v.pre.t}）` : "—";
      const post = v.post.t ? `${round1((v.post.c / v.post.t) * 100)}%（${v.post.c}/${v.post.t}）` : "—";
      say(`| ${skill} | ${pre} | ${post} |`);
    });
  }

  say();
  say("## 六、案例难度观察（按各案例平均最佳分升序）");
  const caseAgg = new Map();
  list.forEach((s) => {
    (s.cases ?? []).forEach((c) => {
      if (typeof c.best !== "number") return;
      if (!caseAgg.has(c.caseId)) caseAgg.set(c.caseId, { title: c.title, values: [] });
      caseAgg.get(c.caseId).values.push(c.best);
    });
  });
  if (caseAgg.size === 0) {
    say("- 暂无案例得分数据。");
  } else {
    say("| 案例 | 样本 | 平均最佳分 |");
    say("| --- | --- | --- |");
    [...caseAgg.entries()]
      .sort((a, b) => stats(a[1].values).mean - stats(b[1].values).mean)
      .forEach(([id, v]) => {
        const st = stats(v.values);
        say(`| ${id} | ${st.n} | ${st.mean} |`);
      });
  }

  say();
  say("## 结论与限制");
  say(
    `- 以上全部数字来自 ${snapshots.length} 份真实导出的试用快照，未使用任何模拟数据；未统计到的项目均标注为「尚无数据」。`
  );
  say("- 本工具不做显著性检验，前后测变化只能描述为观察性结果，不得表述为训练导致的因果效果。");
  say("- 试用者为自愿参与，样本不构成随机抽样，不能推广到更大人群。");
}

// 写入 summary.md
if (fs.existsSync(DEFAULT_DIR) || args.length === 0) {
  try {
    fs.mkdirSync(DEFAULT_DIR, { recursive: true });
    fs.writeFileSync(path.join(DEFAULT_DIR, "summary.md"), lines.join("\n") + "\n", "utf8");
    console.log(`\n已写入 ${path.join(DEFAULT_DIR, "summary.md")}`);
  } catch (e) {
    console.log(`\n写入 summary.md 失败：${e.message}`);
  }
}
