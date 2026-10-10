/**
 * 明鉴 · 全局进度状态
 * 所有写入都会同步到 localStorage；写入失败时给出提示但不影响当前会话运行。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CaseDefinition,
  CaseRecord,
  StoredProgress,
  Verdict,
} from "../types";
import {
  clearProgress,
  createDefaultProgress,
  loadProgress,
  saveProgress,
  type StorageHealth,
} from "../storage/progressStore";
import { scoreCase } from "../engine/scoring";
import { validateCases, validateQuiz } from "../engine/validation";
import { CASES } from "../data/cases";
import { PRETEST } from "../data/pretest";
import { POSTTEST } from "../data/posttest";

export interface ProgressContextValue {
  progress: StoredProgress;
  health: StorageHealth;
  storageMessage: string | null;
  dismissStorageMessage: () => void;
  saveWarning: string | null;

  /** 案例相关操作 */
  ensureCaseRecord: (caseId: string) => CaseRecord;
  markEvidenceOpened: (caseId: string, evidenceId: string) => void;
  toggleEvidence: (caseId: string, evidenceId: string) => void;
  toggleCheck: (caseId: string, checkId: string) => void;
  /** 收起案例内的分步提示 */
  dismissCaseGuide: (caseId: string) => void;
  setVerdict: (caseId: string, verdict: Verdict) => void;
  setConfidence: (caseId: string, confidence: number) => void;
  setAction: (caseId: string, actionId: string) => void;
  submitCase: (caseDef: CaseDefinition) => CaseRecord | null;
  retryCase: (caseId: string) => void;

  /** 测评 */
  saveQuiz: (
    formId: "A" | "B",
    answers: Record<string, { verdict: Verdict; actionId: string }>,
    score: number
  ) => void;
  clearQuiz: (formId: "A" | "B") => void;

  /** 全局 */
  setCurrentRoute: (route: string) => void;
  setDemoMode: (on: boolean) => void;
  setPreference: (patch: Partial<StoredProgress["preferences"]>) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress 必须在 ProgressProvider 内使用");
  return ctx;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadProgress(), []);
  const [progress, setProgress] = useState<StoredProgress>(initial.progress);
  const [health] = useState<StorageHealth>(initial.health);
  const [storageMessage, setStorageMessage] = useState<string | null>(
    initial.message ?? null
  );
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const skipFirstSave = useRef(true);

  // 开发期校验案例与测评数据（只在控制台输出）
  useEffect(() => {
    validateCases(CASES);
    const quizIssues = [...validateQuiz(PRETEST), ...validateQuiz(POSTTEST)];
    if (quizIssues.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("[明鉴] 测评数据校验发现问题：", quizIssues);
    }
  }, []);

  // 持久化
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (health === "unavailable") return; // 无法写入时不反复报错
    const result = saveProgress(progress);
    if (!result.ok) {
      setSaveWarning(result.message);
    } else {
      setSaveWarning(null);
    }
  }, [progress, health]);

  // 应用偏好（减少动效 / 大字号）同步到 <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-text-scale", progress.preferences.textScale);
    root.setAttribute(
      "data-motion-reduced",
      progress.preferences.motionReduced ? "true" : "false"
    );
  }, [progress.preferences]);

  const updateCase = useCallback((caseId: string, patch: Partial<CaseRecord>) => {
    setProgress((prev) => {
      const current = prev.cases[caseId] ?? {
        status: "available" as const,
        attemptCount: 0,
        selectedEvidenceIds: [],
        openedEvidenceIds: [],
        completedChecks: [],
      };
      return {
        ...prev,
        cases: { ...prev.cases, [caseId]: { ...current, ...patch } },
      };
    });
  }, []);

  const ensureCaseRecord = useCallback(
    (caseId: string): CaseRecord => {
      const existing = progress.cases[caseId];
      if (existing) return existing;
      const fresh: CaseRecord = {
        status: "available",
        attemptCount: 0,
        selectedEvidenceIds: [],
        openedEvidenceIds: [],
        completedChecks: [],
      };
      setProgress((prev) => ({
        ...prev,
        cases: { ...prev.cases, [caseId]: fresh },
      }));
      return fresh;
    },
    [progress.cases]
  );

  const markEvidenceOpened = useCallback(
    (caseId: string, evidenceId: string) => {
      setProgress((prev) => {
        const current = prev.cases[caseId] ?? {
          status: "available" as const,
          attemptCount: 0,
          selectedEvidenceIds: [],
          openedEvidenceIds: [],
          completedChecks: [],
        };
        if (current.openedEvidenceIds.includes(evidenceId)) return prev;
        return {
          ...prev,
          cases: {
            ...prev.cases,
            [caseId]: {
              ...current,
              status: current.status === "completed" ? "completed" : "inProgress",
              openedEvidenceIds: [...current.openedEvidenceIds, evidenceId],
            },
          },
        };
      });
    },
    []
  );

  const toggleEvidence = useCallback(
    (caseId: string, evidenceId: string) => {
      setProgress((prev) => {
        const current = prev.cases[caseId] ?? {
          status: "available" as const,
          attemptCount: 0,
          selectedEvidenceIds: [],
          openedEvidenceIds: [],
          completedChecks: [],
        };
        const has = current.selectedEvidenceIds.includes(evidenceId);
        const nextSelected = has
          ? current.selectedEvidenceIds.filter((id) => id !== evidenceId)
          : [...current.selectedEvidenceIds, evidenceId];
        return {
          ...prev,
          cases: {
            ...prev.cases,
            [caseId]: {
              ...current,
              status: current.status === "completed" ? "completed" : "inProgress",
              selectedEvidenceIds: nextSelected,
            },
          },
        };
      });
    },
    []
  );

  const toggleCheck = useCallback(
    (caseId: string, checkId: string) => {
      setProgress((prev) => {
        const current = prev.cases[caseId] ?? {
          status: "available" as const,
          attemptCount: 0,
          selectedEvidenceIds: [],
          openedEvidenceIds: [],
          completedChecks: [],
        };
        const has = current.completedChecks.includes(checkId);
        const nextChecks = has
          ? current.completedChecks.filter((id) => id !== checkId)
          : [...current.completedChecks, checkId];
        return {
          ...prev,
          cases: {
            ...prev.cases,
            [caseId]: {
              ...current,
              status: current.status === "completed" ? "completed" : "inProgress",
              completedChecks: nextChecks,
            },
          },
        };
      });
    },
    []
  );

  const setVerdict = useCallback((caseId: string, verdict: Verdict) => {
    updateCase(caseId, { verdict });
  }, [updateCase]);

  const setConfidence = useCallback((caseId: string, confidence: number) => {
    updateCase(caseId, { confidence });
  }, [updateCase]);

  const setAction = useCallback((caseId: string, actionId: string) => {
    updateCase(caseId, { actionId });
  }, [updateCase]);

  /** 提交一次案例作答：计分、写入历史、更新最佳成绩 */
  const submitCase = useCallback(
    (caseDef: CaseDefinition): CaseRecord | null => {
      const record = progress.cases[caseDef.id];
      if (!record) return null;
      if (!record.verdict || !record.actionId) return null; // 缺少必填项时不得提交

      const score = scoreCase(caseDef, {
        selectedEvidenceIds: record.selectedEvidenceIds,
        completedChecks: record.completedChecks,
        verdict: record.verdict,
        confidence: record.confidence ?? 50,
        actionId: record.actionId,
      });

      const now = new Date().toISOString();
      const attemptCount = record.attemptCount + 1;
      const bestScore = Math.max(record.bestScore ?? 0, score.total);
      const history = [
        ...(record.history ?? []),
        {
          completedAt: now,
          total: score.total,
          verdict: record.verdict,
          confidence: record.confidence ?? 50,
        },
      ];

      const next: CaseRecord = {
        ...record,
        status: "completed",
        attemptCount,
        score,
        bestScore,
        confidence: record.confidence ?? 50,
        lastCompletedAt: now,
        history,
      };

      setProgress((prev) => ({
        ...prev,
        cases: { ...prev.cases, [caseDef.id]: next },
      }));
      return next;
    },
    [progress.cases]
  );

  /** 重做本案：清空本次作答，但保留历史与最佳成绩 */
  const retryCase = useCallback((caseId: string) => {
    setProgress((prev) => {
      const current = prev.cases[caseId];
      if (!current) return prev;
      return {
        ...prev,
        cases: {
          ...prev.cases,
          [caseId]: {
            ...current,
            status: "inProgress",
            selectedEvidenceIds: [],
            openedEvidenceIds: [],
            completedChecks: [],
            verdict: undefined,
            confidence: 50,
            actionId: undefined,
            // 不清除 history / bestScore / attemptCount
          },
        },
      };
    });
  }, []);

  const saveQuiz = useCallback(
    (
      formId: "A" | "B",
      answers: Record<string, { verdict: Verdict; actionId: string }>,
      score: number
    ) => {
      const record = { formId, answers, score, completedAt: new Date().toISOString() };
      setProgress((prev) => ({
        ...prev,
        [formId === "A" ? "pretest" : "posttest"]: record,
      }));
    },
    []
  );

  const clearQuiz = useCallback((formId: "A" | "B") => {
    setProgress((prev) => {
      const next = { ...prev };
      if (formId === "A") next.pretest = undefined;
      else next.posttest = undefined;
      return next;
    });
  }, []);

  const dismissCaseGuide = useCallback(
    (caseId: string) => {
      updateCase(caseId, { guideDismissed: true });
    },
    [updateCase]
  );

  const setCurrentRoute = useCallback((route: string) => {
    setProgress((prev) => ({ ...prev, currentRoute: route }));
  }, []);

  const setDemoMode = useCallback((on: boolean) => {
    setProgress((prev) => ({ ...prev, demoMode: on }));
  }, []);

  const setPreference = useCallback((patch: Partial<StoredProgress["preferences"]>) => {
    setProgress((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  }, []);

  const resetAll = useCallback(() => {
    const result = clearProgress();
    setProgress(createDefaultProgress());
    if (!result.ok) {
      setStorageMessage(result.message ?? "清除失败。");
    } else {
      setStorageMessage(null);
      setSaveWarning(null);
    }
  }, []);

  const value: ProgressContextValue = {
    progress,
    health,
    storageMessage,
    dismissStorageMessage: () => setStorageMessage(null),
    saveWarning,
    ensureCaseRecord,
    markEvidenceOpened,
    toggleEvidence,
    toggleCheck,
    dismissCaseGuide,
    setVerdict,
    setConfidence,
    setAction,
    submitCase,
    retryCase,
    saveQuiz,
    clearQuiz,
    setCurrentRoute,
    setDemoMode,
    setPreference,
    resetAll,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
