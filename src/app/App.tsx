/**
 * 明鉴 · 应用外壳
 */

import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { StorageNotice } from "../components/EmptyState";
import { ProgressProvider, useProgress } from "./ProgressProvider";
import { Onboarding } from "../components/Onboarding";
import { HomePage } from "../pages/HomePage";
import { TutorialPage } from "../pages/TutorialPage";
import { MissionMapPage } from "../pages/MissionMapPage";
import { CaseWorkspacePage } from "../pages/CaseWorkspacePage";
import { AssessmentPage } from "../pages/AssessmentPage";
import { ReportPage } from "../pages/ReportPage";
import { AboutPage } from "../pages/AboutPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function Shell() {
  const { progress, storageMessage, dismissStorageMessage, saveWarning, setCurrentRoute } =
    useProgress();
  const location = useLocation();

  // 记录当前路由，便于刷新后回到原位置
  useEffect(() => {
    setCurrentRoute(location.pathname);
  }, [location.pathname, setCurrentRoute]);

  // 路由切换时回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="mj-app">
      <a
        href="#main"
        className="mj-sr-only"
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          zIndex: 100,
          background: "#fff",
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
        }}
      >
        跳到主要内容
      </a>
      <AppHeader />

      <main className="mj-main" id="main">
        {/* 存档异常 / 写入失败提示 */}
        <div style={{ padding: "var(--space-3) var(--space-6) 0", maxWidth: "var(--layout-max)", margin: "0 auto" }}>
          <StorageNotice message={storageMessage ?? ""} onDismiss={dismissStorageMessage} />
          {saveWarning ? (
            <div style={{ marginTop: 8 }}>
              <StorageNotice message={saveWarning} tone="danger" />
            </div>
          ) : null}
          {progress.demoMode ? (
            <div style={{ marginTop: 8 }}>
              <StorageNotice
                message="演示模式已开启：全部案例开放，此模式下的作答不计入正式前后测数据。可在项目说明页清空记录后重新开始正式流程。"
                tone="info"
              />
            </div>
          ) : null}
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/assessment/pre" element={<AssessmentPage form="pre" />} />
          <Route path="/assessment/post" element={<AssessmentPage form="post" />} />
          <Route path="/missions" element={<MissionMapPage />} />
          <Route path="/case/:caseId" element={<CaseWorkspacePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="mj-footer">
        <div className="mj-footer__inner">
          <span>明鉴 · AI 时代的信息核查训练场</span>
          <span>不是替你判断真假，而是训练你找到证据。</span>
          <span>全部案例为虚构教学模拟 · 数据仅保存在本机浏览器</span>
          <span style={{ marginLeft: "auto" }}>
            本应用不提供实时 AI 鉴伪，也不输出真实世界的自动事实核查结论。
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
      <Onboarding />
    </ProgressProvider>
  );
}
