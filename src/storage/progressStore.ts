/**
 * 明鉴 · 本地存档
 * 文档 8.4 / 8.5：localStorage 单一主键 mingjian.progress.v1，带 schema 版本号；
 * 读写失败、JSON 损坏、字段缺失时降级为默认状态并给出提示，绝不白屏。
 */

import type {
  CaseRecord,
  CaseScoreBreakdown,
  QuizRecord,
  StoredProgress,
  Verdict,
} from "../types";

export const STORAGE_KEY = "mingjian.progress.v1";
export const SCHEMA_VERSION = 1;

export type StorageHealth = "ok" | "unavailable" | "corrupted" | "migrated";

export interface LoadResult {
  progress: StoredProgress;
  health: StorageHealth;
  message?: string;
}

export function createDefaultProgress(): StoredProgress {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    currentRoute: "/",
    demoMode: false,
    cases: {},
    preferences: {
      motionReduced: false,
      textScale: "normal",
    },
  };
}

/** localStorage 是否可用（隐私模式 / 禁用 cookie 等场景可能抛错） */
export function isStorageAvailable(): boolean {
  try {
    const probe = "__mingjian_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** 对任意解析结果做结构收敛，缺失字段填默认值 */
function normalize(raw: unknown): StoredProgress {
  const base = createDefaultProgress();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Partial<StoredProgress> & Record<string, unknown>;

  const cases: Record<string, CaseRecord> = {};
  if (obj.cases && typeof obj.cases === "object") {
    Object.entries(obj.cases as Record<string, unknown>).forEach(([key, value]) => {
      if (!value || typeof value !== "object") return;
      const c = value as Partial<CaseRecord>;
      const status = c.status;
      cases[key] = {
        status:
          status === "completed" ||
          status === "inProgress" ||
          status === "available" ||
          status === "locked"
            ? status
            : "available",
        attemptCount: typeof c.attemptCount === "number" ? c.attemptCount : 0,
        selectedEvidenceIds: Array.isArray(c.selectedEvidenceIds)
          ? c.selectedEvidenceIds.filter((x): x is string => typeof x === "string")
          : [],
        openedEvidenceIds: Array.isArray(c.openedEvidenceIds)
          ? c.openedEvidenceIds.filter((x): x is string => typeof x === "string")
          : [],
        completedChecks: Array.isArray(c.completedChecks)
          ? c.completedChecks.filter((x): x is string => typeof x === "string")
          : [],
        verdict: (c.verdict as Verdict) ?? undefined,
        confidence: typeof c.confidence === "number" ? c.confidence : undefined,
        actionId: typeof c.actionId === "string" ? c.actionId : undefined,
        score: normalizeScore(c.score),
        bestScore: typeof c.bestScore === "number" ? c.bestScore : undefined,
        lastCompletedAt: typeof c.lastCompletedAt === "string" ? c.lastCompletedAt : undefined,
        guideDismissed: c.guideDismissed === true,
        history: Array.isArray(c.history)
          ? c.history.filter(
              (h): h is NonNullable<CaseRecord["history"]>[number] =>
                Boolean(h) && typeof h === "object" && typeof (h as { completedAt?: unknown }).completedAt === "string"
            )
          : undefined,
      };
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : base.updatedAt,
    currentRoute: typeof obj.currentRoute === "string" ? obj.currentRoute : "/",
    demoMode: obj.demoMode === true,
    pretest: normalizeQuiz(obj.pretest, "A"),
    posttest: normalizeQuiz(obj.posttest, "B"),
    cases,
    preferences: {
      motionReduced: obj.preferences?.motionReduced === true,
      textScale: obj.preferences?.textScale === "large" ? "large" : "normal",
      onboardingSeen: obj.preferences?.onboardingSeen === true,
      guideCollapsed: obj.preferences?.guideCollapsed === true,
      tutorialCompleted: obj.preferences?.tutorialCompleted === true,
    },
  };
}

function normalizeScore(score: unknown): CaseScoreBreakdown | undefined {
  if (!score || typeof score !== "object") return undefined;
  const s = score as Partial<CaseScoreBreakdown>;
  const num = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : 0);
  return {
    verdict: num(s.verdict),
    evidence: num(s.evidence),
    reasoning: num(s.reasoning),
    action: num(s.action),
    total: num(s.total),
  };
}

function normalizeQuiz(raw: unknown, formId: "A" | "B"): QuizRecord | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const q = raw as Partial<QuizRecord>;
  if (typeof q.score !== "number" || !q.answers || typeof q.answers !== "object") return undefined;
  const answers: QuizRecord["answers"] = {};
  Object.entries(q.answers).forEach(([key, value]) => {
    const v = value as { verdict?: Verdict; actionId?: string } | undefined;
    if (v && typeof v.verdict === "string" && typeof v.actionId === "string") {
      answers[key] = { verdict: v.verdict, actionId: v.actionId };
    }
  });
  return {
    formId,
    answers,
    score: q.score,
    completedAt: typeof q.completedAt === "string" ? q.completedAt : new Date().toISOString(),
  };
}

/** 读取存档 */
export function loadProgress(): LoadResult {
  if (typeof window === "undefined" || !isStorageAvailable()) {
    return {
      progress: createDefaultProgress(),
      health: "unavailable",
      message: "当前浏览器无法使用本地存档，本次进度只保留在这次会话中。",
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: createDefaultProgress(), health: "ok" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        progress: createDefaultProgress(),
        health: "corrupted",
        message: "本地存档内容损坏，已重置为初始状态，之前的进度无法恢复。",
      };
    }

    const version = (parsed as { schemaVersion?: unknown } | null)?.schemaVersion;
    const normalized = normalize(parsed);
    if (version !== SCHEMA_VERSION) {
      return {
        progress: normalized,
        health: "migrated",
        message: "本地存档版本不一致，已按当前版本兼容读取。",
      };
    }
    return { progress: normalized, health: "ok" };
  } catch {
    return {
      progress: createDefaultProgress(),
      health: "unavailable",
      message: "读取本地存档时出错，已使用初始状态继续运行。",
    };
  }
}

export type SaveResult = { ok: true } | { ok: false; message: string };

/** 写入存档（失败时不影响当前会话运行） */
export function saveProgress(progress: StoredProgress): SaveResult {
  const payload: StoredProgress = {
    ...progress,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    const isQuota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.code === 22);
    return {
      ok: false,
      message: isQuota
        ? "本地存储空间不足，本次进度可能无法保存。"
        : "写入本地存档失败，本次进度可能无法保存。",
    };
  }
}

/**
 * 清空本应用的存档：只删除本项目自身的主键，不触碰其他网站数据。
 */
export function clearProgress(): SaveResult {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, message: "清除失败，请检查浏览器站点数据设置。" };
  }
}
