/**
 * 明鉴 · 训练后测（B 卷）
 * 文档 6.1 / 6.3：与前测考查相同能力，但题面全部更换（不同人物、组织、数字与材料）。
 */

import type { QuizForm } from "../types";

export const POSTTEST: QuizForm = {
  formId: "B",
  title: "训练后测",
  intro:
    "5 道题，考查的能力与前测一致，但情境与数字全部更换。完成后，报告页会显示你两次作答的真实分数与变化。",
  questions: [
    {
      id: "Q1",
      scenario:
        "一个社交账号称「城市地铁全线停运」，没有给出任何来源。官方实时页面暂未出现对应公告，但页面顶部提醒「信息可能延迟，请以车站广播为准」。",
      verdict: "insufficient",
      skill: "source",
      actionOptions: [
        {
          id: "q1a1",
          label: "转发提醒所有人改乘其他交通",
          points: 0,
          feedback: "没有来源、官方页面也无对应公告时转发，容易引发不必要的恐慌。",
        },
        {
          id: "q1a2",
          label: "转发时注明「待确认」，先不核实",
          points: 5,
          feedback: "标注待确认有帮助，但仍是传播未经核实的说法。",
        },
        {
          id: "q1a3",
          label: "查官方最新更新或联系客服，必要时到车站确认",
          points: 10,
          feedback: "正确：官方渠道暂无对应公告且提示可能延迟，应判为证据不足并继续核实。",
        },
      ],
      correctActionId: "q1a3",
      explanation:
        "来源缺失、官方页面暂无对应公告且提示信息可能延迟，属于「证据不足」，不应直接判定为假消息。",
    },
    {
      id: "Q2",
      scenario:
        "一篇报道把调查结果写成「所有用户效率翻倍」。原始报告写的是「部分受访者觉得整理资料更方便」，报告中没有提供任何客观效率指标。",
      // 与前测 P4 平行：结论的限定条件与适用范围被改写（语境追溯）
      verdict: "misleading",
      skill: "context",
      actionOptions: [
        {
          id: "q2a1",
          label: "引用「效率翻倍」作为结论",
          points: 0,
          feedback: "报道把主观感受改写成了客观效率结论，且扩大了适用范围。",
        },
        {
          id: "q2a2",
          label: "说「可能有一定帮助」，不提报告本身",
          points: 5,
          feedback: "措辞更保守，但没有指出样本、指标与结论范围被改写的问题。",
        },
        {
          id: "q2a3",
          label: "核对样本构成、测量指标与结论适用范围后再决定",
          points: 10,
          feedback: "正确：主观感受不能替代客观效率指标，「部分」也不能扩大为「所有」。",
        },
      ],
      correctActionId: "q2a3",
      explanation:
        "结论的适用范围与测量指标都被改写，「部分受访者的主观感受」不能推出「所有用户效率翻倍」，属于「呈现方式存在误导」。",
    },
    {
      id: "Q3",
      scenario:
        "某图表显示数值从 50 变为 45，标题称「减少 90%」。图表的纵轴从 44 开始。",
      verdict: "misleading",
      skill: "data",
      actionOptions: [
        {
          id: "q3a1",
          label: "按标题的「减少 90%」传播",
          points: 0,
          feedback: "实际变化为 (45−50)/50 = −10%，标题的 90% 没有依据。",
        },
        {
          id: "q3a2",
          label: "只说「明显减少」，不核对数值",
          points: 5,
          feedback: "比复述 90% 好，但仍未用原始基数计算并检查坐标轴。",
        },
        {
          id: "q3a3",
          label: "用原始基数重算，并检查纵轴与统计口径",
          points: 10,
          feedback: "正确：实际减少 10%，纵轴从 44 开始夸大了视觉差异。",
        },
      ],
      correctActionId: "q3a3",
      explanation:
        "真实变化为 (45−50)/50×100% = −10%。标题的 90% 不成立，纵轴截断放大了视觉差异，属于「呈现方式存在误导」。",
    },
    {
      id: "Q4",
      scenario:
        "一段视频把一位研究者的发言剪成极端观点。完整视频里，同一句话前后都有明确限定条件：「在样本很小的初步阶段，只能说……」。",
      verdict: "misleading",
      skill: "context",
      actionOptions: [
        {
          id: "q4a1",
          label: "按剪裁后的短句转发，当作研究者原意",
          points: 0,
          feedback: "被剪掉的是限定条件，转发会让观点完全变形。",
        },
        {
          id: "q4a2",
          label: "注明「视频可能有剪辑」，但不给完整视频",
          points: 5,
          feedback: "提示有帮助，但读者无法自行核对完整上下文。",
        },
        {
          id: "q4a3",
          label: "找完整视频或原文，引用时保留限定条件",
          points: 10,
          feedback: "正确：找到完整素材，保留限定语，并给出可复核的出处。",
        },
      ],
      correctActionId: "q4a3",
      explanation:
        "去掉限定条件后句子含义改变，属于「呈现方式存在误导」。逐字引用几个词不等于忠实表达原意。",
    },
    {
      id: "Q5",
      scenario:
        "一段音频要求你扫私人二维码领取「退款」，并索要短信验证码。模拟官方平台明确说明退款仅通过原支付路径处理；你用自己查到的官方客服确认没有这项通知。",
      verdict: "contradicted",
      skill: "responsibleAction",
      actionOptions: [
        {
          id: "q5a1",
          label: "扫码并填写验证码，尽快拿到退款",
          points: 0,
          feedback: "提供验证码可能导致账户被盗；官方明确退款不走私人二维码。",
        },
        {
          id: "q5a2",
          label: "先扫码看看页面，但不填验证码",
          points: 5,
          feedback: "扫码本身也可能带来风险；应完全停止并通过官方渠道办理。",
        },
        {
          id: "q5a3",
          label: "按官方说明，走原支付路径办理退款",
          points: 10,
          feedback: "正确：官方规则与独立客服确认都与该要求冲突，应走官方路径。",
        },
      ],
      correctActionId: "q5a3",
      explanation:
        "官方退款规则与独立客服确认都与音频要求冲突，属于「与证据冲突」的高风险情境。验证码与私人二维码都不应提供。",
    },
  ],
};
