// @vitest-environment jsdom
/**
 * 明鉴 · 引导关真实交互测试
 * 在 jsdom 中真实点击走完六步，验证：步骤门槛、抽屉、结论/行动选择、提交后揭晓。
 */

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProgressProvider } from "../src/app/ProgressProvider";
import { TutorialPage } from "../src/pages/TutorialPage";
import { TUTORIAL_CASE } from "../src/data/tutorial";

beforeAll(() => {
  // jsdom 未实现 window.scrollTo，避免控制台噪音
  window.scrollTo = () => {};
});

afterEach(() => cleanup());

function renderTutorial() {
  return render(
    <MemoryRouter initialEntries={["/tutorial"]}>
      <ProgressProvider>
        <TutorialPage />
      </ProgressProvider>
    </MemoryRouter>
  );
}

function clickButton(name: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("引导关交互流程", () => {
  it("六步逐步解锁，未完成不能进入下一步，提交后才揭晓材料角色", () => {
    renderTutorial();

    // 首页：六步卡片 + 开始按钮
    expect(screen.getByText("先把玩法走一遍")).toBeTruthy();
    TUTORIAL_CASE.evidence.forEach(() => undefined);
    ["读主张", "查证据", "建证据链", "做核查", "下结论", "选行动"].forEach((t) => {
      expect(screen.getByText(t)).toBeTruthy();
    });
    clickButton(/开始引导关/);

    // 第 1 步：读主张
    expect(screen.getByText("第 1 / 6 步")).toBeTruthy();
    clickButton(/我看清楚了/);
    clickButton(/下一步/);

    // 第 2 步：查证据 —— 未查看材料前「下一步」应禁用
    expect(screen.getByText("第 2 / 6 步")).toBeTruthy();
    const nextBtn = screen.getByRole("button", { name: /下一步/ });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);

    // 打开两份材料详情并关闭；此时仍不应出现「易误用材料」
    const detailButtons = screen.getAllByRole("button", { name: /查看详情/ });
    expect(detailButtons.length).toBe(TUTORIAL_CASE.evidence.length);
    fireEvent.click(detailButtons[0]);
    expect(document.body.textContent).not.toContain("易误用材料");
    expect(document.body.textContent).toContain("提交后揭晓");
    clickButton(/关闭证据详情/);
    fireEvent.click(screen.getAllByRole("button", { name: /查看详情/ })[1]);
    clickButton(/关闭证据详情/);

    clickButton(/下一步/);

    // 第 3 步：建证据链（多张证据卡各有一个「加入证据链」按钮，取第一张）
    expect(screen.getByText("第 3 / 6 步")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /加入证据链/ })[0]);
    clickButton(/下一步/);

    // 第 4 步：做核查（手动勾选三项）
    expect(screen.getByText("第 4 / 6 步")).toBeTruthy();
    TUTORIAL_CASE.requiredChecks.forEach((c) => {
      clickButton(new RegExp(c.label));
    });
    clickButton(/下一步/);

    // 第 5 步：下结论
    expect(screen.getByText("第 5 / 6 步")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /与证据冲突/ }));
    clickButton(/下一步/);

    // 第 6 步：选行动并提交
    expect(screen.getByText("第 6 / 6 步")).toBeTruthy();
    const best = TUTORIAL_CASE.actionOptions.find((a) => a.points === 10);
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(best!.label) }));
    clickButton(/提交并查看反馈/);

    // 反馈：标准结论、回看全部材料、此时才显示「易误用材料」
    expect(screen.getByText("引导关反馈")).toBeTruthy();
    expect(document.body.textContent).toContain("本关标准结论");
    expect(screen.getByText("回看全部材料")).toBeTruthy();
    expect(document.body.textContent).toContain("易误用材料");
    expect(document.body.textContent).toContain("不计入正式成绩");
  });

  it("步骤轨上未完成的步骤不可点击", () => {
    renderTutorial();
    clickButton(/开始引导关/);
    const railButtons = screen.getAllByRole("button", { name: /做核查|下结论|选行动/ });
    railButtons.forEach((b) => {
      expect((b as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
