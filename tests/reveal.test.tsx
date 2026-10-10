// @vitest-environment jsdom
/**
 * 明鉴 · 证据分析「提交后揭晓」的交互测试
 * 验证正式案例在未提交时不泄露材料角色与分析。
 */

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProgressProvider } from "../src/app/ProgressProvider";
import { CaseWorkspacePage } from "../src/pages/CaseWorkspacePage";

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => cleanup());

function renderCase(caseId: string) {
  return render(
    <MemoryRouter initialEntries={[`/case/${caseId}`]}>
      <ProgressProvider>
        <Routes>
          <Route path="/case/:caseId" element={<CaseWorkspacePage />} />
        </Routes>
      </ProgressProvider>
    </MemoryRouter>
  );
}

describe("证据角色与分析只在提交后揭晓", () => {
  it("C01 未提交时：卡片无角色标记，详情页只显示「提交后揭晓」", () => {
    renderCase("C01");

    // 卡片层：不出现任何角色标记
    expect(document.body.textContent).not.toContain("易误用材料");
    expect(document.body.textContent).not.toContain("关键证据");

    // 打开第一份材料详情
    fireEvent.click(screen.getAllByRole("button", { name: /查看详情/ })[0]);

    const text = document.body.textContent ?? "";
    expect(text).toContain("提交后揭晓");
    expect(text).not.toContain("这条材料能支持什么");
    expect(text).not.toContain("它不能单独证明什么");

    // 材料本身仍然可见（模拟界面 + 全文），只是分析被锁住
    expect(screen.getByText("材料全文")).toBeTruthy();
  });
});
