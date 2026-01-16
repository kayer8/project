export const YEAR_THEMES = [
  {
    theme_id: 'self_care',
    title: '更照顾自己的一年',
    desc: '慢一点，给自己多一点空间。',
  },
  {
    theme_id: 'slow_down',
    title: '慢下来的一年',
    desc: '把节奏放缓，和生活重新对齐。',
  },
  {
    theme_id: 'steady',
    title: '更稳一点的一年',
    desc: '每天一点点，把心安放好。',
  },
];

export const DIRECTION_DEFS = [
  { direction_id: 'emotion', title: '情绪觉察', sort_order: 1, is_enabled: true },
  { direction_id: 'body', title: '身体照顾', sort_order: 2, is_enabled: true },
  { direction_id: 'order', title: '生活秩序', sort_order: 3, is_enabled: true },
  { direction_id: 'mind', title: '内心安放', sort_order: 4, is_enabled: true },
  { direction_id: 'connection', title: '温柔连接', sort_order: 5, is_enabled: true },
];

export const TRACE_TAG_LABELS: Record<string, string> = {
  self_care: '为自己停下来',
  slow_down: '放慢一点',
  observe: '安静观察',
  reset: '重新整理',
  kind: '温柔对待',
};

export const TRACE_TAG_FEEDBACK: Record<
  string,
  { title: string; subtitle: string }
> = {
  self_care: { title: '今天，被你温柔地度过了。', subtitle: '记为：一次自我照顾' },
  slow_down: { title: '慢一点，你做到了。', subtitle: '记为：一次放慢' },
  observe: { title: '你在好好看见自己。', subtitle: '记为：一次观察' },
  reset: { title: '重新整理，也很重要。', subtitle: '记为：一次整理' },
  kind: { title: '你对自己很温柔。', subtitle: '记为：一次善待' },
  default: { title: '今天也很好。', subtitle: '记为：一次完成' },
};

export const NIGHT_PROGRAMS = [
  {
    program_id: 'np1',
    title: '1 分钟安静',
    type: 'timer',
    duration_sec: 60,
    trace_tags: ['slow_down'],
    direction_id: 'emotion',
  },
  {
    program_id: 'np2',
    title: '三个温柔问题',
    type: 'questions',
    trace_tags: ['self_care', 'observe'],
    direction_id: 'emotion',
    questions: [
      { qid: 'q1', text: '今天有没有一个小瞬间，值得被记住？' },
      { qid: 'q2', text: '有没有一件事，你愿意放过自己？' },
      { qid: 'q3', text: '明天想对自己说一句什么？' },
    ],
  },
];

export const REVIEW_IDENTITY_LABELS: Record<string, string> = {
  self_care: '会为自己留空间的人',
  slow_down: '懂得放慢的人',
  observe: '愿意细看生活的人',
  reset: '愿意整理内心的人',
  kind: '对自己温柔的人',
};

export const REFRESH_LIMIT = 2;
