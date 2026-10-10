/**
 * 明鉴：全局类型定义
 * 所有结构与《明鉴 详细开发文档》8.3 / 8.4 节保持一致。
 */

/** 四类结论标签（文档 2.1） */
export type Verdict = "supported" | "contradicted" | "misleading" | "insufficient";

/** 技能维度标签（文档 7.5） */
export type SkillTag =
  | "source"
  | "context"
  | "crossCheck"
  | "data"
  | "aiMedia"
  | "responsibleAction";

/** 案例难度 */
export type CaseLevel = "入门" | "进阶" | "挑战";

/** 证据条目（文档 8.3） */
export interface EvidenceItem {
  id: string;
  title: string;
  /** 模拟来源名称 */
  sourceLabel: string;
  /** 证据类型标签：原始来源 / 转发截图 / 数据表 / 完整上下文 / 官方说明 ... */
  sourceType: string;
  dateLabel?: string;
  /** 卡片摘要 */
  summary: string;
  /** 详情正文（可含多段，用 \n 分隔） */
  fullContent: string;
  /** 这条材料能支持什么 */
  canSupport: string[];
  /** 它不能单独证明什么 */
  cannotProve: string[];
  /** 是否为干扰 / 易误用材料 */
  isDistractor?: boolean;
  /**
   * 模拟界面的可视化呈现：用纯 CSS/SVG 自绘，不使用真实图片。
   * kind 决定渲染哪种模拟界面。
   */
  mock?: EvidenceMock;
}

/** 自绘模拟界面描述（不依赖任何外部图片服务） */
export type EvidenceMock =
  | { kind: "noticeScreenshot"; headline: string; body: string[]; badge?: string }
  | { kind: "webList"; siteName: string; siteNote: string; rows: string[] }
  | { kind: "systemPanel"; panelName: string; rows: string[]; footnote: string }
  | { kind: "commentList"; comments: string[] }
  | { kind: "photoCard"; caption: string; note: string; tone: "flood" | "creature" }
  | { kind: "archivePage"; archiveName: string; dateLabel: string; title: string; note: string }
  | {
      kind: "barChart";
      axisLabel: string;
      axisStart: number;
      bars: { label: string; value: number; color: string }[];
      caption: string;
    }
  | { kind: "dataTable"; caption: string; headers: string[]; rows: string[][] }
  | { kind: "formulaCard"; formula: string; steps: string[]; result: string }
  | { kind: "articleHead"; outlet: string; headline: string; dateLabel: string; body: string }
  | { kind: "reportPanel"; title: string; lines: string[] }
  | { kind: "quoteCard"; quote: string; attribution: string; note: string }
  | { kind: "subtitleStrip"; fragments: { text: string; cut?: boolean }[]; note: string }
  | { kind: "transcriptPage"; source: string; lines: string[]; highlight: string }
  | { kind: "timelineNote"; source: string; lines: string[] }
  | { kind: "audioCard"; label: string; transcript: string; note: string }
  | { kind: "officialNotice"; siteName: string; title: string; lines: string[] }
  | { kind: "contactCheck"; channel: string; lines: string[] }
  | { kind: "formPage"; siteName: string; title: string; lines: string[] }
  | { kind: "posterCard"; title: string; lines: string[]; warn: string };

/** 行动选项（文档 7.4：points 为 0/5/10） */
export interface ActionOption {
  id: string;
  label: string;
  points: 0 | 5 | 10;
  feedback: string;
}

/** 核查步骤 */
export interface RequiredCheck {
  id: string;
  label: string;
  /** 该步骤的反馈说明 */
  feedback: string;
  /**
   * 可选的自动完成条件：查看了某条证据详情后，该步骤变为“可勾选”。
   * 注意：只是变为可勾选/可确认，仍需用户主动操作后才记为完成（文档 4.4）。
   */
  unlockOnEvidenceOpened?: string;
}

/** 案例定义（文档 8.3） */
export interface CaseDefinition {
  id: string;
  title: string;
  level: CaseLevel;
  estimatedMinutes: number;
  skillTags: SkillTag[];
  isSimulation: true;
  claim: {
    text: string;
    publisher: string;
    timeLabel: string;
    context: string;
  };
  evidence: EvidenceItem[];
  requiredEvidenceIds: string[];
  distractorEvidenceIds: string[];
  requiredChecks: RequiredCheck[];
  verdict: Verdict;
  acceptableLabels?: Verdict[];
  actionOptions: ActionOption[];
  answerExplanation: string;
  reasoningPath: string[];
  takeaway: string;
  sourceNotes: string[];
}

/** 测评题（前测/后测共用结构，文档 6.1） */
export interface QuizQuestion {
  id: string;
  scenario: string;
  /** 结论正确标签（10 分） */
  verdict: Verdict;
  /** 行动选项，points 0/5/10 */
  actionOptions: ActionOption[];
  /** 正确行动 id（用于计算 10 分行动分） */
  correctActionId: string;
  /** 该题考查的技能维度 */
  skill: SkillTag;
  explanation: string;
}

export interface QuizForm {
  formId: "A" | "B";
  title: string;
  intro: string;
  questions: QuizQuestion[];
}

/** 单案例四项得分 */
export interface CaseScoreBreakdown {
  verdict: number;
  evidence: number;
  reasoning: number;
  action: number;
  total: number;
}

/** 一次案例提交的输入 */
export interface CaseSubmissionInput {
  selectedEvidenceIds: string[];
  completedChecks: string[];
  verdict?: Verdict;
  confidence: number;
  actionId?: string;
}

/** 案例记录（文档 8.4） */
export interface CaseRecord {
  status: "locked" | "available" | "inProgress" | "completed";
  attemptCount: number;
  selectedEvidenceIds: string[];
  openedEvidenceIds: string[];
  completedChecks: string[];
  verdict?: Verdict;
  confidence?: number;
  actionId?: string;
  score?: CaseScoreBreakdown;
  bestScore?: number;
  lastCompletedAt?: string;
  /** 用户是否收起了案例内的分步提示（收起后不再自动展开） */
  guideDismissed?: boolean;
  history?: Array<{
    completedAt: string;
    total: number;
    verdict: Verdict;
    confidence: number;
  }>;
}

/** 测评记录 */
export interface QuizRecord {
  formId: "A" | "B";
  answers: Record<string, { verdict: Verdict; actionId: string }>;
  score: number;
  completedAt: string;
}

/** 本地存档（文档 8.4） */
export interface StoredProgress {
  schemaVersion: 1;
  updatedAt: string;
  currentRoute: string;
  /** 是否处于演示模式（跳过前测直接体验），演示数据不会混入正式前后测 */
  demoMode?: boolean;
  pretest?: QuizRecord;
  posttest?: QuizRecord;
  cases: Record<string, CaseRecord>;
  preferences: {
    motionReduced: boolean;
    textScale: "normal" | "large";
    /** 是否已看过新手引导 */
    onboardingSeen?: boolean;
    /** 是否收起了案例内分步提示（全局开关） */
    guideCollapsed?: boolean;
    /** 是否已完成独立引导关（T00，不计入正式成绩） */
    tutorialCompleted?: boolean;
  };
}
