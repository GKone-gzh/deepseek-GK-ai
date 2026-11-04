/**
 * 计划商讨预设行（preset-scoped）。
 *
 * 由 `preset-council` 的 plugins 列表挂载；只在选择「计划商讨模式」的会话里生效：
 * - 用同名系统提示段遮盖工作台的默认协作提示，直接注入两阶段协议；
 * - 首次组装提示时把该会话的协作模式写成 council，让全局 guard 拒绝 ask_user_question，
 *   工作台页头也会显示「商讨」。
 */
import { getSessionState, setSessionState } from './host/state.js';

export const name = 'council-preset';
export const inject = ['systemPrompt'];

const SECTION_NAME = 'gk-cockpit:coordination:v2';

const COUNCIL_TEXT = [
  '协作模式=计划商讨（GK协助工作台预设），固定两阶段，不要跳步：',
  '1) 商讨：收到任务后，先派 2-3 个 council 子 agent（spawn_teammate，名字 council-a / council-b / council-c），分别从「最省事的可行方案」「风险、反例与边界」「实现与验收」三个角度独立给出方案；用 send_message 收集后合并成一份《实施计划》：目标、范围、关键决策与默认假设、步骤、验收标准、风险与回退、预算估计。把计划完整展示给用户，明确写「请确认计划；确认后我会一次做到验收，不再中途询问」，然后结束本轮等待用户回复。',
  '2) 执行：用户确认后，按计划从第一步做到验收，不调用 ask_user_question、不中途征求许可；遇到不确定处按计划里的默认假设继续；阶段完成更新任务板；最后跑验收并给出结果与证据。除非用户主动打断，否则不要停。',
  '本模式禁止 ask_user_question（宿主会拒绝）：需要用户决策的内容必须在计划里一次性写清。建议在完全权限（danger-full-access）下使用，避免沙箱拦截导致中断。',
].join('\n');

function sessionIdOf(agent) {
  if (!agent || typeof agent !== 'object') return '';
  if (typeof agent.id === 'string') return agent.id;
  const session = agent.session;
  if (session && typeof session === 'object' && typeof session.id === 'string') return session.id;
  return '';
}

/** 标注该会话进入商讨模式（只在首次或模式不一致时写盘）。 */
function markCouncil(agent) {
  const id = sessionIdOf(agent);
  if (!id) return;
  try {
    if (getSessionState(id).mode !== 'council') setSessionState(id, { mode: 'council' });
  } catch {
    /* 状态文件不可写时保持提示词兜底 */
  }
}

export function apply(ctx) {
  let order = 0;
  try {
    order = ctx.systemPrompt.getSectionOrder('TEAM_POLICY') - 1;
  } catch {
    order = 0;
  }
  ctx.effect(() => ctx.systemPrompt.section({
    name: SECTION_NAME,
    order,
    text: (context) => {
      markCouncil(context && context.agent);
      return COUNCIL_TEXT;
    },
    interpolate: false,
  }), 'council-preset: coordination prompt');
}

export default { name, inject, apply };
