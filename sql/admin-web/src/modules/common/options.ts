export const statusOptions = [
  { label: '上线', value: 'online' },
  { label: '下线', value: 'offline' },
];

export const taskTypeOptions = [
  { label: '计时', value: 'timer' },
  { label: '步骤', value: 'steps' },
  { label: '自由', value: 'free' },
];

export const nightProgramTypeOptions = [
  { label: '计时', value: 'timer' },
  { label: '问答', value: 'questions' },
  { label: '音频', value: 'audio' },
  { label: '文本', value: 'text' },
];

export const copyTemplateTypeOptions = [
  { label: '任务完成反馈', value: 'task_complete' },
  { label: '夜间收尾', value: 'night_closing' },
  { label: '空状态', value: 'empty_state' },
  { label: '错误提示', value: 'error' },
  { label: '回顾句式', value: 'review' },
];

export const ticketTypeOptions = [
  { label: '缺陷', value: 'bug' },
  { label: '建议', value: 'suggestion' },
  { label: '其他', value: 'other' },
];

export const ticketStatusOptions = [
  { label: '新建', value: 'new' },
  { label: '处理中', value: 'in_progress' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
];

export const moodOptions = [
  { label: '空落', value: 'empty' },
  { label: '疲惫', value: 'tired' },
  { label: '焦虑', value: 'anxious' },
  { label: '平静', value: 'calm' },
  { label: '有活力', value: 'energized' },
];

export const directionOptions = [
  { label: '情绪', value: 'emotion' },
  { label: '身体', value: 'body' },
  { label: '睡眠', value: 'sleep' },
  { label: '习惯', value: 'habit' },
];

export const traceOptions = [
  { label: '自我关怀', value: 'self_care' },
  { label: '观察', value: 'observe' },
  { label: '感恩', value: 'gratitude' },
  { label: '计划', value: 'plan' },
];

export const difficultyOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
];

type OptionItem<T extends string | number = string> = {
  label: string;
  value: T;
};

export const getOptionLabel = <T extends string | number>(
  options: OptionItem<T>[],
  value: T,
) => options.find((option) => option.value === value)?.label ?? String(value);

export const mapOptionLabels = <T extends string | number>(
  options: OptionItem<T>[],
  values: T[],
) => values.map((value) => getOptionLabel(options, value));
