/**
 * 洗牌测试：保证「选项顺序被真正打乱」，且同一案例刷新后顺序不变。
 */

import { describe, expect, it } from "vitest";
import { hashSeed, seededShuffle } from "../src/engine/shuffle";
import { CASES } from "../src/data/cases";
import { PRETEST } from "../src/data/pretest";
import { POSTTEST } from "../src/data/posttest";

const VERDICTS = ["supported", "contradicted", "misleading", "insufficient"];

describe("确定性洗牌", () => {
  it("相同种子结果一致，可复现", () => {
    expect(seededShuffle(VERDICTS, "C01:verdict")).toEqual(seededShuffle(VERDICTS, "C01:verdict"));
  });

  it("不同种子会产生不同顺序", () => {
    const a = seededShuffle(VERDICTS, "C01:verdict");
    const b = seededShuffle(VERDICTS, "C02:verdict");
    expect(a).not.toEqual(b);
  });

  it("不修改原数组，且元素不增不减", () => {
    const original = [...VERDICTS];
    const out = seededShuffle(VERDICTS, "seed");
    expect(VERDICTS).toEqual(original);
    expect([...out].sort()).toEqual([...original].sort());
  });

  it("种子哈希稳定", () => {
    expect(hashSeed("C01:verdict")).toBe(hashSeed("C01:verdict"));
    expect(hashSeed("C01:verdict")).not.toBe(hashSeed("C02:verdict"));
  });

  it("空数组与单元素数组安全", () => {
    expect(seededShuffle([], "x")).toEqual([]);
    expect(seededShuffle(["only"], "x")).toEqual(["only"]);
  });
});

describe("选项顺序确实被分散", () => {
  it("8 个案例的结论选项，没有一个结论固定出现在同一位置", () => {
    const positionsByVerdict: Record<string, number[]> = {};
    CASES.forEach((c) => {
      const ordered = seededShuffle(VERDICTS, `${c.id}:verdict`);
      ordered.forEach((v, i) => {
        positionsByVerdict[v] = positionsByVerdict[v] ?? [];
        positionsByVerdict[v].push(i);
      });
    });
    Object.entries(positionsByVerdict).forEach(([, positions]) => {
      // 同一结论在 8 个案例中至少出现在 2 个不同位置
      expect(new Set(positions).size).toBeGreaterThan(1);
    });
  });

  it("正确行动选项不会总是排在最后一位", () => {
    let lastPositionCount = 0;
    CASES.forEach((c) => {
      const ordered = seededShuffle(c.actionOptions, `${c.id}:action`);
      const best = c.actionOptions.reduce((a, b) => (b.points > a.points ? b : a));
      if (ordered[ordered.length - 1].id === best.id) lastPositionCount += 1;
    });
    // 若 8 个案例里有 6 个以上都把最优项放在最后，就等于给了位置线索
    expect(lastPositionCount).toBeLessThan(6);
  });

  it("前测与后测的正确行动选项位置也不固定", () => {
    const all = [...PRETEST.questions, ...POSTTEST.questions];
    let lastPositionCount = 0;
    all.forEach((q) => {
      const ordered = seededShuffle(q.actionOptions, `${q.id}:action`);
      if (ordered[ordered.length - 1].id === q.correctActionId) lastPositionCount += 1;
    });
    expect(lastPositionCount).toBeLessThan(all.length - 2);
  });
});

describe("选项措辞不再自带答案痕迹", () => {
  it("行动选项不含说教式否定词与风险自评", () => {
    const banned = /高风险|暂停转发|不扫码|不付款|不作为当前|不要转发|切勿|谨防/;
    [...CASES.flatMap((c) => c.actionOptions), ...PRETEST.questions.flatMap((q) => q.actionOptions), ...POSTTEST.questions.flatMap((q) => q.actionOptions)].forEach(
      (opt) => {
        expect(opt.label, `选项「${opt.label}」仍带有明显提示`).not.toMatch(banned);
      }
    );
  });

  it("同一题的三个选项长度接近，避免用长度猜答案", () => {
    CASES.forEach((c) => {
      const lens = c.actionOptions.map((o) => o.label.length);
      const spread = Math.max(...lens) - Math.min(...lens);
      expect(spread, `${c.id} 的选项长度差异过大`).toBeLessThanOrEqual(14);
    });
  });
});
