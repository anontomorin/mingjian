/**
 * 明鉴 · 页面渲染冒烟测试
 * 用 react-dom/server 真实渲染每个页面，确认组件在无浏览器环境下也不抛错，
 * 并检查关键文案（教学模拟声明、四类结论、计分口径）确实出现在输出中。
 */

import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "../src/app/App";
import { CASES } from "../src/data/cases";
import { TUTORIAL_CASE } from "../src/data/tutorial";

function render(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>
  );
}

describe("页面渲染冒烟", () => {
  it("首页渲染成功并包含核心文案", () => {
    const html = render("/");
    expect(html).toContain("明鉴");
    expect(html).toContain("不是替你判断真假，而是训练你找到证据");
    expect(html).toContain("全部案例为虚构教学模拟");
  });

  it("前测页渲染 5 道题", () => {
    const html = render("/assessment/pre");
    expect(html).toContain("训练前测");
    ["P1", "P2", "P3", "P4", "P5"].forEach((id) => {
      expect(html).toContain(`q-${id}`);
    });
    expect(html).toContain("证据不足");
    expect(html).toContain("与证据冲突");
  });

  it("后测页渲染 5 道题", () => {
    const html = render("/assessment/post");
    expect(html).toContain("训练后测");
    ["Q1", "Q2", "Q3", "Q4", "Q5"].forEach((id) => {
      expect(html).toContain(`q-${id}`);
    });
  });

  it("任务地图渲染 8 个案例", () => {
    const html = render("/missions");
    CASES.forEach((c) => {
      expect(html, c.id).toContain(c.id);
      expect(html, c.id).toContain(c.title);
    });
    expect(html).toContain("虚构教学模拟");
  });

  it("8 个案例工作台均可渲染，且默认不暴露标准答案", () => {
    // 演示模式下全部案例可进入（渲染时不依赖 localStorage）
    CASES.forEach((c) => {
      const html = render(`/case/${c.id}`);
      expect(html, c.id).toContain("待核查主张");
      expect(html, c.id).toContain(c.claim.text);
      // 未提交时不应出现反馈中的“标准结论”文案
      expect(html, c.id).not.toContain("本案标准结论");
      // 未提交时不得泄露证据角色与材料分析（否则等于把答案写在材料上）
      expect(html, c.id).not.toContain("易误用材料");
      expect(html, c.id).not.toContain("关键证据</span>");
      expect(html, c.id).not.toContain("这条材料能支持什么");
      expect(html, c.id).not.toContain("它不能单独证明什么");
      // 四类结论选项始终可见
      expect(html, c.id).toContain("有证据支持");
      expect(html, c.id).toContain("证据不足");
    });
  });

  it("未知案例 ID 与未知路由不会崩溃", () => {
    expect(() => render("/case/NOT_EXIST")).not.toThrow();
    expect(() => render("/no-such-page")).not.toThrow();
    const html = render("/no-such-page");
    expect(html).toContain("这个页面不存在");
  });

  it("报告页在无数据时显示空状态而非伪造分数", () => {
    const html = render("/report");
    expect(html).toContain("我的学习报告");
    expect(html).toContain("还没有任何记录");
  });

  it("独立引导关可渲染，且说明不计入成绩", () => {
    const html = render("/tutorial");
    expect(html).toContain("先把玩法走一遍");
    expect(html).toContain("引导关 · 约 3 分钟");
    expect(html).toContain("不计入任何成绩");
    // 六步卡片标题
    ["读主张", "查证据", "建证据链", "做核查", "下结论", "选行动"].forEach((t) => {
      expect(html).toContain(t);
    });
    // 引导关首页只讲玩法，不提前给出案情与材料分析
    expect(html).not.toContain(TUTORIAL_CASE.claim.text);
    expect(html).not.toContain("易误用材料");
  });

  it("项目说明页包含模拟声明、隐私说明与边界", () => {
    const html = render("/about");
    expect(html).toContain("虚构教学模拟");
    expect(html).toContain("mingjian.progress.v1");
    expect(html).toContain("不接入实时 AI 图片");
    expect(html).toContain("清空本机记录");
  });
});
