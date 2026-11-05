window.__ModuleLoader__.load({
  id: 'dsh-agent-cockpit',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'agent-cockpit';
    const VIEW_ID = 'cockpit';
    const BADGE_ID = 'agent-cockpit-badge';

    const CSS = `
.acp_root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.acp_head{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;padding:16px 20px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.acp_headMain{min-width:0;flex:1 1 220px}
.acp_title{font-size:15px;font-weight:600;letter-spacing:.01em}
.acp_sub{margin-top:2px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.acp_stats{display:flex;gap:8px;flex-wrap:wrap}
.acp_stat{display:flex;align-items:baseline;gap:6px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px}
.acp_stat b{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.acp_refresh{flex:none;min-height:28px;padding:3px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:0 0;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer}
.acp_refresh:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.acp_body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:16px 20px 24px;display:flex;flex-direction:column;gap:20px}
.acp_section{margin:0}
.acp_sectionHead{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;font-weight:600}
.acp_sectionHead .acp_count{color:var(--dsw-alias-label-caption);font-size:12px;font-weight:400;font-variant-numeric:tabular-nums}
.acp_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}
.acp_card{display:flex;flex-direction:column;gap:6px;min-width:0;padding:11px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;font:inherit}
.acp_card:hover:not(:disabled){border-color:var(--dsw-alias-label-caption)}
.acp_card:disabled{opacity:.72;cursor:default}
.acp_cardTop{display:flex;align-items:center;gap:7px;min-width:0}
.acp_name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600}
.acp_role{flex:none;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:99px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.acp_roleLead{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-label-caption)}
.acp_cardMeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.acp_dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-label-caption);display:inline-block}
.acp_dotRun{background:var(--dsw-alias-state-success-primary,#10b981);animation:acp_pulse 1.6s ease-in-out infinite}
.acp_dotWait{background:var(--dsw-alias-state-warn-primary,#f59e0b);animation:acp_pulse 1.6s ease-in-out infinite}
.acp_dotError{background:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_dotIdle{background:0 0;border:1.5px solid var(--dsw-alias-label-caption)}
.acp_duty{font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.acp_task{display:flex;flex-direction:column;gap:5px;min-width:0;padding:10px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.acp_taskHead{display:flex;align-items:flex-start;gap:8px}
.acp_taskSubject{min-width:0;flex:1 1 auto;font-size:12.5px;font-weight:600;overflow-wrap:anywhere}
.acp_taskState{flex:none;display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}
.acp_taskDesc{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.acp_meta{display:flex;gap:4px 10px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-caption)}
.acp_metaItem{min-width:0;overflow-wrap:anywhere}
.acp_warn{color:var(--dsw-alias-state-warn-primary,#f59e0b)}
.acp_ok{color:var(--dsw-alias-state-success-primary,#10b981)}
.acp_taskId{font-variant-numeric:tabular-nums;opacity:.72}
.acp_board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}
.acp_col{display:flex;flex-direction:column;gap:8px;min-width:0;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 55%,transparent)}
.acp_colHead{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.acp_colHead .acp_count{color:var(--dsw-alias-label-caption);font-size:12px;font-weight:400;font-variant-numeric:tabular-nums}
.acp_colEmpty{padding:6px 2px;font-size:12px;color:var(--dsw-alias-label-caption)}
.acp_notice{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2);font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.acp_noticeError{border-color:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_onboard{display:flex;flex-direction:column;gap:8px;padding:16px 18px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2)}
.acp_onboardTitle{font-size:13.5px;font-weight:600}
.acp_onboardBody{margin:0;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.acp_onboardList{margin:4px 0 0;padding-left:18px;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.acp_onboardList li{margin:2px 0}
.acp_code{padding:1px 5px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:var(--dsw-alias-bg-layer-1,transparent);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-label-primary)}
.acp_foot{display:flex;gap:12px;flex-wrap:wrap;padding:10px 20px;border-top:1px solid var(--dsw-alias-border-l1);font-size:11.5px;color:var(--dsw-alias-label-caption)}
.acp_costSummary{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_costSummary b{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.acp_tableWrap{overflow-x:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:10px}
.acp_table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.acp_table th,.acp_table td{padding:7px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--dsw-alias-border-l1)}
.acp_table th{font-weight:500;color:var(--dsw-alias-label-caption);font-size:11.5px}
.acp_table th:first-child,.acp_table td:first-child{text-align:left}
.acp_table tbody tr:last-child td{border-bottom:0}
.acp_table tr.acp_totalRow td{font-weight:600;background:var(--dsw-alias-bg-layer-2)}
.acp_hint{margin:8px 0 0;font-size:11.5px;color:var(--dsw-alias-label-caption)}
.acp_agentChips{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--dsw-alias-label-caption)}
.acp_chip{padding:1px 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;white-space:nowrap}
.acp_agentNums{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.acp_agentNums b{color:var(--dsw-alias-label-primary);font-weight:600}
.acp_badgeWrap{display:flex;align-items:center;min-width:0}
.acp_badge{display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:3px 9px;border:1px solid transparent;border-radius:7px;background:0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;cursor:pointer;max-width:100%}
.acp_badge:hover,.acp_badge:focus-visible{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.acp_badgeLabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acp_badgeCount{color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
.acp_kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:10px;margin:0 0 14px}
.acp_kpi{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px}
.acp_kpiLabel{margin:0 0 4px;font-size:11px;color:var(--dsw-alias-label-caption)}
.acp_kpiValue{font-size:17px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.acp_kpiSub{margin-top:2px;font-size:11px;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
.acp_bar{height:8px;margin:6px 0 0;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.acp_bar i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary,#10b981)}
.acp_bar.acp_barWarn i{background:var(--dsw-alias-state-warn-primary,#f59e0b)}
.acp_bar.acp_barMute i{background:var(--dsw-alias-label-secondary,#8b8f97)}
.acp_compose{display:flex;flex-direction:column;gap:9px}
.acp_composeRow{display:grid;grid-template-columns:96px minmax(0,1fr) 92px;gap:10px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_composeNum{text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.acp_spark{display:flex;align-items:flex-end;gap:3px;height:64px;padding:4px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.acp_sparkBar{flex:1 1 0;min-width:2px;border-radius:3px 3px 0 0;background:var(--dsw-alias-state-success-primary,#10b981);opacity:.72}
.acp_sparkBar:hover{opacity:1}
.acp_insightGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.acp_insight{display:flex;flex-direction:column;gap:6px;text-align:left;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:0 0;color:inherit;cursor:pointer}
.acp_insight:hover,.acp_insight:focus-visible{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.acp_insightTitle{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acp_insightMeta{display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11px;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
@keyframes acp_pulse{0%,100%{opacity:1}50%{opacity:.38}}
@media (max-width:1000px){.acp_board{grid-template-columns:minmax(0,1fr)}}
.acp_statusLabel{font-size:11.5px;color:var(--dsw-alias-label-tertiary)}
.acp_cardOver{border-color:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_idleGroup{margin-top:10px}
.acp_disclosure{display:flex;align-items:center;gap:7px;flex:1 1 auto;padding:6px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:0 0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.acp_disclosureRow{display:flex;align-items:center;gap:6px;min-width:0}
.acp_disclosureActions{display:flex;align-items:center;gap:6px;flex:none}
.acp_miniAction{padding:3px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:0 0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer;white-space:nowrap}
.acp_miniAction:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-caption)}
.acp_disclosure:hover{background:var(--dsw-alias-bg-layer-2)}
.acp_disclosureCaret{flex:none;font-size:10px;color:var(--dsw-alias-label-caption)}
.acp_budgetRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 20px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_input{width:92px;min-height:26px;padding:2px 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1,transparent);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;font-variant-numeric:tabular-nums}
.acp_bar.acp_barOver i{background:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_plan{display:flex;flex-direction:column;gap:8px}
.acp_planRow{display:grid;grid-template-columns:minmax(96px,150px) minmax(0,1fr);gap:10px;align-items:start;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.acp_planName{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acp_planRole{margin-top:1px;font-size:11px;color:var(--dsw-alias-label-caption)}
.acp_planTasks{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_planTask{display:flex;align-items:baseline;gap:6px;min-width:0}
.acp_planTaskSubject{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acp_planState{flex:none;font-size:11px;color:var(--dsw-alias-label-caption)}
.acp_planWarn{display:flex;flex-direction:column;gap:4px;margin-top:9px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.acp_planWarnLine{display:flex;gap:6px;align-items:flex-start;min-width:0}
.acp_critical{flex:none;display:inline-flex;align-items:center;padding:0 6px;border:1px solid var(--dsw-alias-state-warn-primary,#f59e0b);border-radius:999px;color:var(--dsw-alias-state-warn-primary,#f59e0b);font-size:10.5px;line-height:16px}
.acp_task.acp_taskCritical{border-color:var(--dsw-alias-state-warn-primary,#f59e0b)}
.acp_over{color:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_noticeWarn{border-color:var(--dsw-alias-state-warn-primary,#f59e0b)}
/* GK 品牌头部 */
.acp_head{align-items:center;gap:14px;padding:16px 22px 14px;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-2) 62%,transparent),transparent)}
.acp_brand{display:flex;align-items:center;gap:11px;min-width:0;flex:1 1 240px}
.acp_logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#8b5cf6);color:#fff;font-size:13px;font-weight:700;letter-spacing:.04em;box-shadow:0 3px 12px rgba(79,124,255,.28)}
.acp_titleRow{display:flex;align-items:center;gap:9px;min-width:0;flex-wrap:wrap}
.acp_headRight{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}
.acp_actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.acp_action{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:4px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.acp_action:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-caption)}
.acp_actionDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#10b981)}
.acp_modeDot{flex:none;width:7px;height:7px;border-radius:50%}
.acp_modeDotAuto{background:var(--dsw-alias-state-success-primary,#10b981)}
.acp_modeDotOff{background:var(--dsw-alias-label-caption)}
.acp_modeDotAsk{background:var(--dsw-alias-state-warn-primary,#f59e0b)}
.acp_modeDotCouncil{background:#8b5cf6}
.acp_livePill{display:inline-flex;align-items:center;gap:5px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2)}
.acp_livePillRun{color:var(--dsw-alias-state-success-primary,#10b981);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 45%,transparent)}
.acp_liveDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption)}
.acp_liveDotRun{background:var(--dsw-alias-state-success-primary,#10b981);animation:acp_pulse 1.6s ease-in-out infinite}
.acp_stat{padding:5px 11px;border-radius:10px}
.acp_statActive{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 38%,transparent)}
.acp_statActive b{color:var(--dsw-alias-state-success-primary,#10b981)}
.acp_statIdle b{color:var(--dsw-alias-label-tertiary)}
/* 卡片与区块打磨 */
.acp_card{padding:12px 13px;gap:7px;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease}
.acp_card:hover:not(:disabled){border-color:var(--dsw-alias-label-caption);box-shadow:0 5px 16px rgba(0,0,0,.08);transform:translateY(-1px)}
.acp_cardRun{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 42%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 16%,transparent),0 3px 12px rgba(16,185,129,.10)}
.acp_cardRun .acp_statusLabel{color:var(--dsw-alias-state-success-primary,#10b981)}
.acp_cardTop{flex-wrap:wrap}
.acp_task{transition:border-color .15s ease}
.acp_task:hover{border-color:var(--dsw-alias-border-l1)}
.acp_sectionHead{font-size:13.5px;margin:0 0 11px}
.acp_sectionHead .acp_count{padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;line-height:18px}
.acp_board{gap:14px}
.acp_col{padding:12px;border-radius:12px}
.acp_colEmpty{padding:12px 6px;text-align:center;border:1px dashed var(--dsw-alias-border-l1);border-radius:9px}
.acp_planRow{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 72%,transparent);transition:border-color .15s ease}
.acp_planRow:hover{border-color:var(--dsw-alias-border-l2)}
.acp_kpis{grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:9px}
.acp_kpi{background:var(--dsw-alias-bg-layer-2)}
.acp_foot{justify-content:space-between;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 45%,transparent)}
.acp_onboard{padding:20px 22px;border-radius:14px}
.acp_onboardIntro{display:flex;flex-direction:column;gap:3px}
.acp_steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:6px}
.acp_step{display:flex;gap:10px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-2)}
.acp_stepNum{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.acp_stepText{display:flex;flex-direction:column;gap:2px;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_stepCode{width:fit-content}
.acp_statStrip{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0 0;font-size:11.5px;color:var(--dsw-alias-label-caption)}
.acp_miniStat{display:inline-flex;align-items:baseline;gap:5px;padding:2px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-2)}
.acp_miniStat b{color:var(--dsw-alias-label-secondary);font-weight:600;font-variant-numeric:tabular-nums}
.acp_featureRow{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px;margin-top:2px}
.acp_feature{padding:10px 12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 60%,transparent)}
.acp_featureTitle{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary)}
.acp_featureDesc{margin-top:2px;font-size:11.5px;color:var(--dsw-alias-label-tertiary)}
.acp_doctorMask{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.46)}
.acp_doctorCard{width:min(620px,100%);max-height:82vh;overflow:auto;padding:20px 22px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-2);box-shadow:0 24px 70px rgba(0,0,0,.4)}
.acp_doctorHead{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.acp_doctorTitle{font-size:15px;font-weight:700}
.acp_doctorIntro{margin:0 0 12px;font-size:12.5px;color:var(--dsw-alias-label-secondary);line-height:1.6}
.acp_doctorItem{display:flex;flex-direction:column;gap:3px;padding:10px 12px;margin-bottom:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.acp_doctorItemHead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.acp_doctorItemTitle{font-size:12.5px;font-weight:600}
.acp_doctorItemDetail{font-size:11.5px;color:var(--dsw-alias-label-tertiary);line-height:1.55}
.acp_sev{flex:none;padding:0 6px;border-radius:999px;font-size:10.5px;line-height:16px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary)}
.acp_sevHigh{color:var(--dsw-alias-state-error-primary,#ef4444);border-color:var(--dsw-alias-state-error-primary,#ef4444)}
.acp_sevMedium{color:var(--dsw-alias-state-warn-primary,#f59e0b);border-color:var(--dsw-alias-state-warn-primary,#f59e0b)}
.acp_doctorActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.acp_doctorDanger{border-color:var(--dsw-alias-state-error-primary,#ef4444)!important;color:var(--dsw-alias-state-error-primary,#ef4444)!important}
.acp_doctorResult{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.acp_avatar{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9px;background:linear-gradient(135deg,#4f7cff,#8b5cf6);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.02em;box-shadow:0 2px 8px rgba(79,124,255,.25)}
.acp_avatarRun{box-shadow:0 0 0 2px rgba(16,185,129,.28),0 2px 10px rgba(16,185,129,.22)}
.acp_cardV2{padding:12px 13px;gap:8px;border-radius:12px;background:linear-gradient(180deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1))}
.acp_graph{margin:12px 0 6px;padding:12px 14px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;overflow-x:auto;overflow-y:hidden;background:radial-gradient(circle at 12% 0%,rgba(79,124,255,.10),transparent 55%),radial-gradient(circle at 92% 100%,rgba(139,92,246,.10),transparent 55%),var(--dsw-alias-bg-layer-1)}
.acp_graphHead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.acp_graphCanvas{position:relative;margin:10px auto 2px;min-width:100%;overflow:visible}
.acp_graphSvg{position:absolute;left:0;top:0;pointer-events:none}
.acp_edge{fill:none;stroke:var(--dsw-alias-border-l2);stroke-width:1.6;opacity:.75}
.acp_edgeRun{stroke:color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 55%,transparent);stroke-width:2;opacity:.9}
.acp_graphNode{position:absolute;display:flex;flex-direction:column;gap:4px;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);text-align:left;font:inherit;cursor:pointer;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.acp_graphNode:hover{transform:translateY(-2px);border-color:var(--dsw-alias-label-caption);box-shadow:0 8px 22px rgba(0,0,0,.10)}
.acp_graphNodeRun{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 45%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-success-primary,#10b981) 14%,transparent),0 4px 16px rgba(16,185,129,.12)}
.acp_graphNodeCurrent{outline:1px dashed color-mix(in srgb,var(--dsw-alias-label-caption) 60%,transparent);outline-offset:2px}
.acp_graphHeadRow{display:flex;align-items:center;gap:6px;min-width:0}
.acp_graphDot{flex:none;width:6px;height:6px;border-radius:999px;background:var(--dsw-alias-label-tertiary)}
.acp_graphName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:650}
.acp_graphRole{flex:none;padding:0 5px;border-radius:999px;font-size:9px;line-height:14px;letter-spacing:.06em;color:#4f7cff;border:1px solid rgba(79,124,255,.35);background:rgba(79,124,255,.08)}
.acp_graphTask{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.acp_graphStats{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.acp_graphBar{display:block;height:3px;border-radius:999px;background:var(--dsw-alias-border-l2);overflow:hidden}
.acp_graphBar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#4f7cff,#8b5cf6)}
.acp_graphNodeRun .acp_graphBar i{background:linear-gradient(90deg,#10b981,#4f7cff)}
.acp_pulse{margin:12px 0 6px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:linear-gradient(135deg,rgba(79,124,255,.06),rgba(139,92,246,.06)),var(--dsw-alias-bg-layer-1)}
.acp_pulseHead{display:flex;align-items:center;justify-content:space-between;gap:10px}
.acp_pulseTitle{font-size:12.5px;font-weight:650}
.acp_pulseBadge{padding:1px 8px;border-radius:999px;font-size:10.5px;color:#8b5cf6;border:1px solid rgba(139,92,246,.30);background:rgba(139,92,246,.08)}
.acp_pulseList{display:grid;gap:7px;margin-top:8px}
.acp_pulseRow{display:grid;grid-template-columns:92px minmax(0,1fr) 66px;align-items:center;gap:8px}
.acp_pulseName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.acp_pulseTrack{display:flex;height:8px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-border-l1)}
.acp_pulseOut{display:block;height:100%;background:linear-gradient(90deg,#4f7cff,#6d8dff)}
.acp_pulseRead{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#a78bfa)}
.acp_pulseVal{text-align:right;font-size:10.5px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.acp_terrain{margin:12px 0 6px;padding:14px 16px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:radial-gradient(circle at 85% 0%,rgba(139,92,246,.10),transparent 50%),var(--dsw-alias-bg-layer-1)}
.acp_terrainHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.acp_terrainTitle{font-size:13px;font-weight:650}
.acp_terrainBadges{display:flex;gap:6px;flex-wrap:wrap}
.acp_terrainBadge{padding:1px 8px;border-radius:999px;font-size:10.5px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.acp_terrainBadgeRead{color:#8b5cf6;border-color:rgba(139,92,246,.30);background:rgba(139,92,246,.08)}
.acp_terrainLegend{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 2px;font-size:10.5px;color:var(--dsw-alias-label-tertiary)}
.acp_terrainLegendItem{display:inline-flex;align-items:center;gap:5px}
.acp_terrainDot{display:inline-block;width:7px;height:7px;border-radius:2px}
.acp_terrainChart{display:flex;align-items:flex-end;gap:10px;height:190px;padding:12px 2px 0;border-bottom:1px solid var(--dsw-alias-border-l2);overflow-x:auto}
.acp_terrainCol{flex:1 1 0;min-width:46px;height:100%;display:flex;flex-direction:column;align-items:center;gap:4px}
.acp_terrainVal{font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.acp_terrainBarWrap{flex:1;display:flex;align-items:flex-end;width:26px;min-height:0}
.acp_terrainBar{display:flex;flex-direction:column-reverse;width:100%;border-radius:6px 6px 0 0;overflow:hidden;background:var(--dsw-alias-bg-layer-2);box-shadow:0 0 0 1px var(--dsw-alias-border-l2) inset}
.acp_terrainBar i{display:block;width:100%}
.acp_terrainName{max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
`;

    const zh = {
      trigger: 'GK协助',
      viewLabel: 'GK协助工作台',
      title: 'GK协助工作台',
      subtitle: '多智能体协助 · 会话级驾驶舱',
      loading: '正在读取团队状态…',
      unavailable: '当前会话没有可用的团队投影：Agent Teams 未启用，或投影仍在加载。',
      failure: '团队记录异常',
      statMembers: '成员',
      statTasks: '任务',
      statActive: '进行中',
      statDone: '已完成',
      roster: '部门',
      agents: '编队',
      agentsHint: '主控、队友与它们派出的一次性子 Agent 都在这里；步数与 token 取自各自会话日志，不发起任何 LLM 调用。',
      agentsError: '编队读取失败，已回退到团队投影',
      roleLead: '主控',
      roleTeammate: '队友',
      roleSubagent: '子 Agent',
      agentOneShot: '一次性',
      fromMember: '来自',
      board: '共享任务板',
      lead: '组长',
      teammate: '成员',
      model: '模型',
      duty: '职责',
      currentTask: '当前任务',
      noTask: '暂无认领任务',
      noDesc: '未填写职责说明',
      open: '打开该成员的会话',
      refresh: '刷新',
      current: '当前会话',
      emptyTitle: '这是一块空驾驶舱',
      emptyBody: '团队与任务都来自当前会话的团队投影。让智能体派出队友、创建共享任务之后，这里会自动出现部门卡片与任务板。',
      emptyHowSpawn: '派出一个队友',
      emptyHowTask: '创建共享任务',
      emptyHowList: '查看成员状态',
      emptyRule: '普通对话保持单 agent；只有你明确要求多 agent 协作时才组队。',
      featCards: '编队卡片',
      featCardsDesc: '主控、队友与子 Agent 的实时状态、职责、当前任务与 token 用量',
      featPlan: '分工计划',
      featPlanDesc: '按成员看任务、关键路径依赖链与写范围冲突',
      featCost: '成本效率',
      featCostDesc: '步数、上下文重读、每步输出、重读倍数与预算提醒',
      emptyBoard: '暂无任务',
      pending: '待办',
      in_progress: '进行中',
      completed: '已完成',
      statusPending: '待处理',
      statusInProgress: '进行中',
      statusCompleted: '已完成',
      statusRunning: '运行中',
      statusInactive: '未运行',
      statusProvisioning: '准备中',
      statusFailed: '失败',
      owner: '负责',
      unowned: '未分配',
      blockedBy: '依赖',
      writeScopes: '写入范围',
      ready: '可开始',
      blocked: '被依赖阻塞',
      footer: '只读驾驶舱 · 部门与任务取自会话投影，成本取自会话日志；不发起任何 LLM 调用',
      next: '下一版：部门角色卡、分工计划、预算熔断、协调模式开关',
      openCockpit: '打开GK协助工作台',
      cost: 'Token 成本（只读统计）',
      costHint: '步数与上下文重读（cache read）才是成本大头，输出只占一小部分；重读倍数越高说明同一段上下文被反复送进模型。',
      costLoading: '正在统计各会话用量…',
      costError: '统计失败',
      costLead: 'Lead',
      costTeam: '全队合计',
      colName: '成员',
      colSteps: '步数',
      colTools: '工具',
      colOutput: '输出',
      colRead: '上下文重读',
      colSum: '合计',
      tabContext: '上下文',
      tabFleet: '编队',
      graphTitle: '协作星图',
      graphHint: '点击节点打开该成员会话',
      pulseTitle: '上下文脉搏',
      pulseHint: '只统计上下文重读与产出：紫色是重读，蓝色是输出；条越长越吃上下文。',
      pulsePressure: '重读占比',
      terrainTitle: '上下文地形',
      terrainHint: '每根柱子是一个 Agent 的上下文构成，按总量从高到低；柱顶数字是计量 token。',
      terrainLegendRead: '重读',
      terrainLegendInput: '输入',
      terrainLegendWrite: '写入',
      terrainLegendOutput: '输出',
      terrainEmpty: '还没有上下文数据',
      contextTitle: '上下文',
      contextSubtitle: '本会话的上下文压力、构成与逐次调用',
      contextPressure: '上下文压力',
      contextProjected: '预计下次请求',
      contextLastPrompt: '上次请求',
      contextWindow: '窗口',
      contextUsage: '累计用量（本会话日志）',
      usageInput: '未缓存输入',
      usageOutput: '输出',
      usageRead: '缓存读',
      usageWrite: '缓存写',
      contextCompose: '上下文构成（近似）',
      composeSystem: '系统提示',
      composeTools: '工具定义',
      composeMessages: '消息',
      composeNote: '构成来自 token-meter 的启发式估算，看比例可以，不是计费数据。',
      contextTrend: '最近调用',
      contextTrendHint: '柱高按本页最大输出归一；悬停可看单次数字。',
      contextEmpty: '这个会话还没有可用的上下文数据：投影未加载，或还没有发生模型调用。',
      contextLoading: '正在读取上下文…',
      contextError: '上下文读取失败',
      insightsTitle: '上下文洞察',
      insightsSubtitle: '最近会话的上下文与花费总览 · 只读',
      insightsSessions: '会话',
      insightsOutput: '输出',
      insightsRead: '重读',
      insightsAvg: '平均输出',
      insightsHint: '点卡片打开会话；数据来自本机会话日志，不发起任何 LLM 调用。',
      insightsEmpty: '还没有会话日志。',
      insightsLoading: '正在汇总会话…',
      insightsError: '会话汇总失败',
      insightsOpen: '打开会话',
      noTitle: '未命名会话',
      statusIdleGroup: '空闲成员',
      lastActive: '最后活动',
      allIdle: '团队当前全部空闲，没有 agent 正在运行（这不是新启动的协作）',
      budget: '预算',
      budgetSet: '设置预算',
      budgetSteps: '步数上限',
      budgetOutput: '输出上限',
      budgetSave: '保存',
      budgetClear: '清除',
      budgetCancel: '取消',
      budgetHint: '预算只做提醒，不会中断 agent。',
      budgetOver: '个成员超出预算',
      overBudget: '超预算',
      colEff: '每步输出',
      costPerStep: '每步输出',
      costRatio: '重读倍数',
      costEff: '效率体检',
      plan: '分工计划',
      planHint: '按成员看分工；关键路径是依赖链最长的一条，先切短它通常比加人更快。',
      planCritical: '关键路径',
      planCriticalChain: '环',
      planUnowned: '未分配任务',
      planBlocked: '阻塞任务',
      planConflict: '写范围冲突',
      planEmpty: '还没有任务，无法生成分工计划。',
      criticalBadge: '关键路径',
      agoNow: '刚刚',
      agoMinutes: '分钟前',
      agoHours: '小时前',
      agoDays: '天前',
      taskCost: '本次任务成本',
      taskCostHint: '自最近一条用户消息起统计，和「效率体检」的会话累计口径不同；换会话或发新消息后重新计数。',
      taskSince: '起点',
      taskCostLoading: '正在统计本次任务…',
      modeAuto: '协作：自动',
      modeAsk: '协作：询问',
      modeCouncil: '协作：商讨',
      modeOff: '协作：关闭',
      modeHint: '询问 = 模型觉得需要协作时先问你（默认）；自动 = 模型自己决定；商讨 = 先派多个子 agent 讨论出方案，你确认后一次做到验收、不再中途询问；关闭 = 拒绝全部协作类工具。',
      councilBanner: '计划商讨模式：AI 会先派 council 子 agent 讨论方案，展示《实施计划》等你确认；确认后从第一步做到验收，不再中途询问。建议开启完全权限。',
      interruptedMembers: '个成员已被中断',
      budgetHostHint: '预算由宿主保存并执行：超预算会真的中断成员，不只是提示。',
      close: '关闭',
      doctorTitle: '插件冲突检查',
      doctorIntro: '插件首次加载时扫描了已安装的插件，发现以下冲突。请选择处理方式：',
      doctorBanner: '检测到插件冲突，点击查看',
      doctorFix: '自主修复',
      doctorOptout: '不使用我们的插件',
      doctorDismiss: '暂不处理',
      doctorRescan: '重新扫描',
      doctorNoFix: '没有可自动修复的项',
      doctorRestart: '修改已写入 profile，重启 DSH 后生效。',
      doctorOpenConversation: '打开说明对话',
      doctorFixable: '可自动修复',
      doctorManual: '需手动处理',
      doctorClean: '未发现冲突',
      doctorResultFix: '已移除：',
      doctorResultOptout: '已从 profile 移除 GK协助工作台，重启后不再加载。',
      archiveIdle: '归档空闲成员',
      archivedGroup: '已归档',
      restoreArchived: '恢复归档',
      archivedHint: '归档只影响工作台展示（历史团队不再占编队卡片），不删除会话。',
      versionNote: 'GK协助工作台 v1.6.0 · 协作星图 / 上下文地形 / 计划商讨 / 预算熔断',
    };

    const en = {
      trigger: 'GK',
      viewLabel: 'GK Workbench',
      title: 'GK Workbench',
      subtitle: 'Multi-agent assistance · session cockpit',
      loading: 'Reading team state…',
      unavailable: 'No team projection is available for this session: Agent Teams is disabled, or the projection is still loading.',
      failure: 'Invalid Team record',
      statMembers: 'Members',
      statTasks: 'Tasks',
      statActive: 'In progress',
      statDone: 'Completed',
      roster: 'Departments',
      agents: 'Fleet',
      agentsHint: 'The lead, its teammates, and every one-shot subagent they spawned appear here; steps and tokens come from each session log, with no LLM call.',
      agentsError: 'Fleet lookup failed, fell back to the team projection',
      roleLead: 'Lead',
      roleTeammate: 'Teammate',
      roleSubagent: 'Subagent',
      agentOneShot: 'One-shot',
      fromMember: 'from',
      board: 'Shared task board',
      lead: 'Lead',
      teammate: 'Member',
      model: 'Model',
      duty: 'Duty',
      currentTask: 'Current task',
      noTask: 'No claimed task',
      noDesc: 'No duty described',
      open: 'Open this member conversation',
      refresh: 'Refresh',
      current: 'Current chat',
      emptyTitle: 'An empty cockpit',
      emptyBody: 'Both the team and its tasks come from this session\u2019s team projection. Once an agent spawns teammates and creates shared tasks, department cards and the task board appear here automatically.',
      emptyHowSpawn: 'spawn a teammate',
      emptyHowTask: 'create a shared task',
      emptyHowList: 'inspect member status',
      emptyRule: 'Normal chats stay single-agent; a team is only spun up when you explicitly ask for multi-agent collaboration.',
      featCards: 'Fleet cards',
      featCardsDesc: 'Live state, duty, current task and token usage for the lead, teammates and subagents',
      featPlan: 'Division plan',
      featPlanDesc: 'Tasks per member, the critical dependency chain and write-scope conflicts',
      featCost: 'Cost & efficiency',
      featCostDesc: 'Steps, cache re-reads, output per step, re-read ratio and budget hints',
      emptyBoard: 'No tasks',
      pending: 'Pending',
      in_progress: 'In progress',
      completed: 'Completed',
      statusPending: 'Pending',
      statusInProgress: 'In progress',
      statusCompleted: 'Completed',
      statusRunning: 'Running',
      statusInactive: 'Inactive',
      statusProvisioning: 'Provisioning',
      statusFailed: 'Failed',
      owner: 'Owner',
      unowned: 'Unowned',
      blockedBy: 'Blocked by',
      writeScopes: 'Write scopes',
      ready: 'Ready',
      blocked: 'Blocked by dependencies',
      footer: 'Read-only cockpit · departments and tasks come from Session projections, cost comes from session logs; no LLM call is made',
      next: 'Next: department role cards, division plan, budget cutoff, coordination switch',
      openCockpit: 'Open GK Workbench',
      cost: 'Token cost (read-only)',
      costHint: 'Steps and context re-reads (cache reads) dominate the cost; output is only a small slice. A high re-read ratio means the same context is resent over and over.',
      costLoading: 'Reading per-session usage…',
      costError: 'Usage lookup failed',
      costLead: 'Lead',
      costTeam: 'Team total',
      colName: 'Member',
      colSteps: 'Steps',
      colTools: 'Tools',
      colOutput: 'Output',
      colRead: 'Cache read',
      colSum: 'Total',
      tabContext: 'Context',
      tabFleet: 'Fleet',
      graphTitle: 'Collaboration map',
      graphHint: 'Click a node to open that member',
      pulseTitle: 'Context pulse',
      pulseHint: 'Cache reread vs output: purple is reread, blue is output. Longer bars burn more context.',
      pulsePressure: 'reread share',
      terrainTitle: 'Context terrain',
      terrainHint: 'One column per agent, sorted by total context tokens.',
      terrainLegendRead: 'reread',
      terrainLegendInput: 'input',
      terrainLegendWrite: 'write',
      terrainLegendOutput: 'output',
      terrainEmpty: 'No context data yet',
      contextTitle: 'Context',
      contextSubtitle: 'Context pressure, composition, and recent calls for this session',
      contextPressure: 'Context pressure',
      contextProjected: 'Next request',
      contextLastPrompt: 'Last prompt',
      contextWindow: 'Window',
      contextUsage: 'Cumulative usage (this session log)',
      usageInput: 'Uncached input',
      usageOutput: 'Output',
      usageRead: 'Cache read',
      usageWrite: 'Cache write',
      contextCompose: 'Context composition (approx.)',
      composeSystem: 'System',
      composeTools: 'Tool schemas',
      composeMessages: 'Messages',
      composeNote: 'Composition is the token-meter heuristic estimate: useful for proportions, not billing.',
      contextTrend: 'Recent calls',
      contextTrendHint: 'Bars are normalized to the largest output on this page; hover for per-call numbers.',
      contextEmpty: 'No context data yet: the projection has not loaded, or no model call has happened.',
      contextLoading: 'Reading context…',
      contextError: 'Context lookup failed',
      insightsTitle: 'Context insights',
      insightsSubtitle: 'Recent sessions: context and spend overview · read-only',
      insightsSessions: 'Sessions',
      insightsOutput: 'Output',
      insightsRead: 'Cache read',
      insightsAvg: 'Avg output',
      insightsHint: 'Click a card to open that session; data comes from local session logs, with no LLM call.',
      insightsEmpty: 'No session logs yet.',
      insightsLoading: 'Summarizing sessions…',
      insightsError: 'Session summary failed',
      insightsOpen: 'Open session',
      noTitle: 'Untitled session',
      statusIdleGroup: 'Idle members',
      lastActive: 'Last active',
      allIdle: 'The whole team is idle: no agent is running (this is not a newly started collaboration)',
      budget: 'Budget',
      budgetSet: 'Set budget',
      budgetSteps: 'Step limit',
      budgetOutput: 'Output limit',
      budgetSave: 'Save',
      budgetClear: 'Clear',
      budgetCancel: 'Cancel',
      budgetHint: 'The budget only warns; it never interrupts an agent.',
      budgetOver: 'members over budget',
      overBudget: 'Over budget',
      colEff: 'Output / step',
      costPerStep: 'Output / step',
      costRatio: 'Cache-read ratio',
      costEff: 'Efficiency check',
      plan: 'Division plan',
      planHint: 'Work per member; the critical path is the longest dependency chain — shortening it usually beats adding people.',
      planCritical: 'Critical path',
      planCriticalChain: 'tasks',
      planUnowned: 'unowned tasks',
      planBlocked: 'blocked tasks',
      planConflict: 'Write-scope conflict',
      planEmpty: 'No tasks yet, so there is no division plan to draw.',
      criticalBadge: 'Critical path',
      agoNow: 'just now',
      agoMinutes: 'min ago',
      agoHours: 'h ago',
      agoDays: 'd ago',
      taskCost: 'Current task cost',
      taskCostHint: 'Counted since the latest user message; different from the cumulative "Efficiency check"; resets on a new message or session.',
      taskSince: 'Since',
      taskCostLoading: 'Measuring the current task…',
      modeAuto: 'Sync: auto',
      modeAsk: 'Sync: ask',
      modeCouncil: 'Sync: council',
      modeOff: 'Sync: off',
      modeHint: 'Ask = the model proposes and waits for your OK (default); Auto = the model decides; Council = sub-agents debate a plan, then execute end-to-end after your approval; Off = all collaboration tools rejected.',
      councilBanner: 'Council mode: sub-agents debate a plan first; after you approve, the agent executes end-to-end without asking again. Full permissions recommended.',
      interruptedMembers: 'members interrupted',
      budgetHostHint: 'The budget is stored and enforced host-side: over-budget members are actually interrupted, not just warned.',
      close: 'Close',
      doctorTitle: 'Plugin conflict check',
      doctorIntro: 'On first load the workbench scanned installed plugins and found these conflicts. Choose how to proceed:',
      doctorBanner: 'Plugin conflicts detected — click to review',
      doctorFix: 'Auto-fix',
      doctorOptout: 'Stop using this plugin',
      doctorDismiss: 'Not now',
      doctorRescan: 'Rescan',
      doctorNoFix: 'Nothing can be auto-fixed',
      doctorRestart: 'The change was written to your profile; restart DSH to apply.',
      doctorOpenConversation: 'Open explanation chat',
      doctorFixable: 'auto-fixable',
      doctorManual: 'manual',
      doctorClean: 'No conflicts found',
      doctorResultFix: 'Removed: ',
      doctorResultOptout: 'GK Workbench was removed from the profile; it will stop loading after a restart.',
      archiveIdle: 'Archive idle',
      archivedGroup: 'Archived',
      restoreArchived: 'Restore',
      archivedHint: 'Archiving only hides cards here (old teams stop occupying the fleet); sessions are not deleted.',
      versionNote: 'GK Workbench v1.6.0 · collaboration map / context terrain / council preset',
    };

    /* ── small shared helpers ───────────────────────────────────────────── */

    function useNoopSelector(selector) {
      React.useState(0);
      return selector(undefined);
    }

    function phaseOf(member) {
      const raw = member.phase !== undefined ? member.phase : member.status;
      if (raw === 'running' || raw === 'active') return 'active';
      return raw !== undefined ? raw : 'inactive';
    }

    function statusOfMember(member, running, summaryRunning) {
      const phase = phaseOf(member);
      if (phase !== 'active') return phase;
      const live = running === undefined ? summaryRunning : running;
      return live === true ? 'running' : 'inactive';
    }

    function statusKey(status) {
      switch (status) {
        case 'running': return 'statusRunning';
        case 'inactive': return 'statusInactive';
        case 'provisioning': return 'statusProvisioning';
        case 'failed': return 'statusFailed';
        default: return 'statusInactive';
      }
    }

    function dotClass(status) {
      switch (status) {
        case 'running': return 'acp_dot acp_dotRun';
        case 'provisioning': return 'acp_dot acp_dotWait';
        case 'failed': return 'acp_dot acp_dotError';
        default: return 'acp_dot acp_dotIdle';
      }
    }

    function taskDotClass(task) {
      if (task.status === 'completed') return 'acp_dot acp_dotRun';
      if (task.status === 'in_progress') return 'acp_dot acp_dotWait';
      return task.ready === false ? 'acp_dot acp_dotError' : 'acp_dot acp_dotIdle';
    }

    function taskStatusKey(status) {
      switch (status) {
        case 'pending': return 'statusPending';
        case 'in_progress': return 'statusInProgress';
        case 'completed': return 'statusCompleted';
        default: return 'statusPending';
      }
    }

    function sortPending(tasks) {
      return tasks.slice().sort((left, right) => {
        const leftReady = left.ready === false ? 1 : 0;
        const rightReady = right.ready === false ? 1 : 0;
        if (leftReady !== rightReady) return leftReady - rightReady;
        return String(left.id).localeCompare(String(right.id));
      });
    }

    function memberTaskOf(tasks, member) {
      const mine = tasks.filter((task) => task.ownerName === member.name);
      const running = mine.filter((task) => task.status === 'in_progress');
      if (running.length > 0) return running[0];
      const pending = mine.filter((task) => task.status === 'pending');
      if (pending.length > 0) return pending[0];
      return undefined;
    }

    /* ── v0.7：协作模式 / 预算（宿主持久化） / 本次任务成本 ─────────────── */

    function useCockpitState(sessionId) {
      const stateRef = React.useState({ phase: 'loading', mode: 'auto', budget: null, status: null, archived: [] });
      const snap = stateRef[0];
      const setSnap = stateRef[1];
      const key = String(sessionId || '');
      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        if (!key) {
          setSnap({ phase: 'idle', mode: 'auto', budget: null, status: null, archived: [] });
          return undefined;
        }
        const url = '/agent-cockpit/state?session=' + encodeURIComponent(key);
        const load = () => {
          fetch(url, { headers: { accept: 'application/json' } })
            .then((response) => response.json())
            .then((data) => {
              if (cancelled || !data || data.error) return;
              setSnap({
                phase: 'ready',
                mode: data.mode === 'off' ? 'off' : data.mode === 'ask' ? 'ask' : 'auto',
                budget: data.budget && (data.budget.steps > 0 || data.budget.output > 0) ? data.budget : null,
                status: data.status || null,
                archived: Array.isArray(data.archived) ? data.archived : [],
              });
            })
            .catch(() => {});
        };
        load();
        timer = setInterval(load, 15000);
        return () => {
          cancelled = true;
          if (timer !== null) clearInterval(timer);
        };
      }, [key]);

      // 乐观更新 + 用宿主返回值校准（宿主会顺带做一次熔断检查）
      const update = (patch) => {
        setSnap((prev) => ({
          phase: 'ready',
          mode: patch.mode !== undefined ? (patch.mode === 'off' ? 'off' : patch.mode === 'ask' ? 'ask' : 'auto') : prev.mode,
          budget: patch.budget !== undefined ? patch.budget : prev.budget,
          status: prev.status,
          archived: patch.archived !== undefined ? patch.archived : prev.archived,
        }));
        fetch('/agent-cockpit/state', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(Object.assign({ session: key }, patch)),
        })
          .then((response) => response.json())
          .then((data) => {
            if (!data || data.error) return;
            setSnap({
              phase: 'ready',
              mode: data.mode === 'off' ? 'off' : data.mode === 'ask' ? 'ask' : 'auto',
              budget: data.budget || null,
              status: data.status || null,
              archived: Array.isArray(data.archived) ? data.archived : [],
            });
          })
          .catch(() => {});
      };

      return Object.assign({}, snap, { update });
    }

    function useTaskCost(leadSessionId) {
      const stateRef = React.useState({ phase: 'loading', data: null });
      const snap = stateRef[0];
      const setSnap = stateRef[1];
      const key = String(leadSessionId || '');
      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        if (!key) {
          setSnap({ phase: 'idle', data: null });
          return undefined;
        }
        const url = '/agent-cockpit/taskcost?lead=' + encodeURIComponent(key);
        const load = () => {
          fetch(url, { headers: { accept: 'application/json' } })
            .then((response) => response.json())
            .then((data) => {
              if (cancelled || !data || data.error) return;
              setSnap({ phase: 'ready', data });
            })
            .catch(() => {});
        };
        load();
        timer = setInterval(load, 20000);
        return () => {
          cancelled = true;
          if (timer !== null) clearInterval(timer);
        };
      }, [key]);
      return snap;
    }

    function useDoctor() {
      const stateRef = React.useState({ phase: 'loading', doctor: null, result: null, busy: false });
      const snap = stateRef[0];
      const setSnap = stateRef[1];
      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        const load = () => {
          fetch('/agent-cockpit/doctor', { headers: { accept: 'application/json' } })
            .then((response) => response.json())
            .then((data) => {
              if (cancelled || !data) return;
              setSnap((prev) => ({ phase: 'ready', doctor: data.doctor || prev.doctor, result: prev.result, busy: false }));
            })
            .catch(() => {});
        };
        load();
        timer = setInterval(load, 30000);
        return () => {
          cancelled = true;
          if (timer !== null) clearInterval(timer);
        };
      }, []);
      const act = (action) => {
        setSnap((prev) => Object.assign({}, prev, { busy: true }));
        fetch('/agent-cockpit/doctor', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ action }),
        })
          .then((response) => response.json())
          .then((data) => {
            setSnap((prev) => ({
              phase: 'ready',
              doctor: data && data.doctor ? data.doctor : prev.doctor,
              result: data || null,
              busy: false,
            }));
          })
          .catch(() => setSnap((prev) => Object.assign({}, prev, { busy: false })));
      };
      return Object.assign({}, snap, { act });
    }

    /** 统一家族行 / 投影成员的状态词：running / provisioning / failed / inactive。 */
    function rowStatus(row) {
      const raw = row && row.status !== undefined && row.status !== null ? String(row.status) : 'inactive';
      if (raw === 'running' || raw === 'active') return 'running';
      if (raw === 'provisioning') return 'provisioning';
      if (raw === 'failed') return 'failed';
      return 'inactive';
    }

    function isRunningRow(row) {
      const status = rowStatus(row);
      return status === 'running' || status === 'provisioning';
    }

    /** 超预算判定：步数或输出任一超线即算超。 */
    function overBudgetOf(row, budget) {
      if (!budget) return false;
      const usage = row && row.usage ? row.usage : {};
      const steps = Number(usage.steps) || 0;
      const output = Number(usage.output) || 0;
      return (budget.steps > 0 && steps > budget.steps) || (budget.output > 0 && output > budget.output);
    }

    function taskByIdOf(tasks) {
      const map = new Map();
      for (const task of tasks) if (task && task.id !== undefined) map.set(String(task.id), task);
      return map;
    }

    /** 依赖链最深的一条 = 关键路径；返回链上的任务和 id 集合。 */
    function criticalPathOf(tasks) {
      const byId = taskByIdOf(tasks);
      const depth = new Map();
      const previous = new Map();
      const visiting = new Set();
      const visit = (task) => {
        const id = String(task.id);
        const cached = depth.get(id);
        if (cached !== undefined) return cached;
        if (visiting.has(id)) return 1;
        visiting.add(id);
        let best = 0;
        let bestParent;
        for (const blocked of Array.isArray(task.blockedBy) ? task.blockedBy : []) {
          const parent = byId.get(String(blocked));
          if (!parent) continue;
          const value = visit(parent);
          if (value > best) {
            best = value;
            bestParent = parent;
          }
        }
        visiting.delete(id);
        const result = best + 1;
        depth.set(id, result);
        if (bestParent !== undefined) previous.set(id, bestParent);
        return result;
      };
      let head;
      let max = 0;
      for (const task of tasks) {
        if (!task || task.id === undefined) continue;
        const value = visit(task);
        if (value > max) {
          max = value;
          head = task;
        }
      }
      const chain = [];
      const ids = new Set();
      let cursor = head;
      while (cursor !== undefined && !ids.has(String(cursor.id))) {
        ids.add(String(cursor.id));
        chain.unshift(cursor);
        cursor = previous.get(String(cursor.id));
      }
      return { chain, ids, length: chain.length };
    }

    /** 未完成任务之间重叠的写范围；不同 owner 才算冲突。 */
    function scopeConflictsOf(tasks) {
      const open = tasks.filter((task) => task && (task.status === 'pending' || task.status === 'in_progress'));
      const first = new Map();
      const conflicts = [];
      for (const task of open) {
        if (conflicts.length >= 6) break;
        const owner = task.ownerName !== undefined ? String(task.ownerName) : '';
        const scopes = Array.isArray(task.writeScopes) ? task.writeScopes : [];
        for (const scope of scopes) {
          if (conflicts.length >= 6) break;
          const key = String(scope);
          const seen = first.get(key);
          if (seen === undefined) {
            first.set(key, { owner, task });
            continue;
          }
          if (seen.owner === owner) continue;
          conflicts.push({ scope: key, left: seen.task, right: task });
        }
      }
      return conflicts;
    }

    function planStatsOf(tasks) {
      let unowned = 0;
      let blocked = 0;
      let completed = 0;
      for (const task of tasks) {
        if (!task) continue;
        if (task.status === 'completed') {
          completed += 1;
          continue;
        }
        if (task.ownerName === undefined || task.ownerName === '') unowned += 1;
        if (task.status === 'pending' && task.ready === false) blocked += 1;
      }
      return { unowned, blocked, completed };
    }

    function tasksOfOwner(tasks, name) {
      const key = String(name);
      return tasks.filter((task) => task && String(task.ownerName) === key);
    }

    function costNameOf(row, t) {
      if (row && row.role === 'lead') return t('costLead');
      if (row && row.name !== undefined && row.name !== '') return String(row.name);
      return row && row.id !== undefined ? String(row.id).slice(0, 12) : '—';
    }

    /* ── token cost ─────────────────────────────────────────────────────── */

    function fmtTokens(value) {
      const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return String(n);
    }

    /* ── 编队卡片：主控 / 队友 / 子 Agent ───────────────────────────────── */

    function AgentCard(props) {
      const row = props.row;
      const t = props.t;
      const usage = row.usage || {};
      const status = rowStatus(row);
      const disabled = row.current === true || status === 'failed' || status === 'provisioning';
      const roleKey = row.role === 'lead' ? 'roleLead' : row.role === 'subagent' ? 'roleSubagent' : 'roleTeammate';
      const budget = props.budget || null;
      const steps = Number(usage.steps) || 0;
      const output = Number(usage.output) || 0;
      const over = overBudgetOf(row, budget);
      const task = memberTaskOf(props.tasks || [], row);
      const lastActive = row.mtime !== undefined && row.mtime !== null ? agoLabel(row.mtime, t) : '';

      const chips = [h('span', { className: 'acp_chip', key: 'role' }, t(roleKey))];
      if (props.parentName !== undefined && props.parentName !== '') {
        chips.push(h('span', { className: 'acp_chip', key: 'parent', title: t('fromMember') + ' ' + props.parentName },
          '↳ ' + props.parentName));
      }
      if (row.mode === 'one-shot') chips.push(h('span', { className: 'acp_chip', key: 'mode' }, t('agentOneShot')));
      if (row.model !== undefined && row.model !== '') chips.push(h('span', { className: 'acp_chip', key: 'model' }, String(row.model)));
      if (row.current === true) chips.push(h('span', { className: 'acp_chip', key: 'current' }, t('current')));
      if (over) chips.push(h('span', { className: 'acp_chip acp_warn', key: 'over' }, t('overBudget')));

      const children = [
        h('div', { className: 'acp_cardTop', key: 'top' }, [
          h('span', { className: 'acp_avatar' + (isRunningRow(row) ? ' acp_avatarRun' : ''), key: 'avatar' }, initialsOf(row.name)),
          h('span', { className: 'acp_name', key: 'name', title: row.name }, String(row.name)),
          h('span', { className: dotClass(status), key: 'dot' }),
          h('span', { className: 'acp_statusLabel', key: 'status' }, t(statusKey(status))),
        ]),
        h('div', { className: 'acp_agentChips', key: 'chips' }, chips),
        h('div', { className: 'acp_agentNums', key: 'nums' }, [
          h('span', { key: 'steps' }, [h('b', { key: 'v' }, String(steps)), ' ' + t('colSteps')]),
          h('span', { key: 'tools' }, [h('b', { key: 'v' }, String(Number(usage.tools) || 0)), ' ' + t('colTools')]),
          h('span', { key: 'out' }, [h('b', { key: 'v' }, fmtTokens(output)), ' ' + t('colOutput')]),
          h('span', { key: 'read' }, [h('b', { key: 'v' }, fmtTokens(Number(usage.cacheRead) || 0)), ' ' + t('colRead')]),
        ]),
      ];

      if (budget && budget.steps > 0) {
        children.push(h('div', {
          className: 'acp_bar' + (steps > budget.steps ? ' acp_barOver' : ''),
          key: 'budget',
          title: t('budgetSteps') + ': ' + String(budget.steps),
        }, [h('i', { key: 'fill', style: { width: pctOf(steps, budget.steps) + '%' } })]));
      }
      if (row.description !== undefined && row.description !== '') {
        children.push(h('div', { className: 'acp_duty', key: 'duty', title: row.description }, String(row.description)));
      }
      children.push(h('div', { className: 'acp_duty', key: 'task' }, [
        h('span', { key: 'label' }, t('currentTask') + ': '),
        h('span', { key: 'text' }, task === undefined ? t('noTask') : String(task.subject)),
        task !== undefined
          ? h('span', { className: 'acp_planState', key: 'state' }, ' · ' + t(taskStatusKey(task.status)))
          : null,
      ]));
      if (lastActive !== '') {
        children.push(h('div', { className: 'acp_hint', key: 'active', style: { margin: 0 } }, t('lastActive') + ' ' + lastActive));
      }

      return h('button', {
        type: 'button',
        className: 'acp_card acp_cardV2' + (over ? ' acp_cardOver' : '') + (isRunningRow(row) ? ' acp_cardRun' : ''),
        disabled,
        title: disabled ? undefined : t('open'),
        'data-agent-id': row.id,
        onClick: () => { if (!disabled) props.openMember(props.sessionId, row.id); },
      }, children);
    }

    function ContextTerrain(props) {
      const t = props.t;
      const rows = Array.isArray(props.rows) ? props.rows : [];
      if (rows.length === 0) return null;
      const partsOf = (row) => {
        const u = row.usage || {};
        return {
          read: Number(u.cacheRead) || 0,
          input: Number(u.input) || 0,
          write: Number(u.cacheWrite) || 0,
          output: Number(u.output) || 0,
        };
      };
      const list = rows.map((row) => {
        const parts = partsOf(row);
        return { row, parts, total: parts.read + parts.input + parts.write + parts.output };
      }).sort((a, b) => b.total - a.total);
      const max = Math.max(1, ...list.map((x) => x.total));
      const sumRead = list.reduce((s, x) => s + x.parts.read, 0);
      const sumAll = list.reduce((s, x) => s + x.total, 0);
      const pressure = sumAll > 0 ? Math.round((sumRead / sumAll) * 100) : 0;
      const legend = [
        ['read', 'terrainLegendRead', '#8b5cf6'],
        ['input', 'terrainLegendInput', '#4f7cff'],
        ['write', 'terrainLegendWrite', '#14b8a6'],
        ['output', 'terrainLegendOutput', '#f59e0b'],
      ];
      return h('div', { className: 'acp_terrain', key: 'terrain', id: 'acp-context-terrain' }, [
        h('div', { className: 'acp_terrainHead', key: 'head' }, [
          h('div', { key: 'left' }, [
            h('div', { className: 'acp_terrainTitle', key: 'title' }, t('terrainTitle')),
            h('p', { className: 'acp_hint', key: 'hint', style: { margin: '2px 0 0' } }, t('terrainHint')),
          ]),
          h('div', { className: 'acp_terrainBadges', key: 'badges' }, [
            h('span', { className: 'acp_terrainBadge', key: 'total' }, fmtTokens(sumAll) + ' ctx'),
            h('span', { className: 'acp_terrainBadge acp_terrainBadgeRead', key: 'read' }, String(pressure) + '% ' + t('pulsePressure')),
          ]),
        ]),
        h('div', { className: 'acp_terrainLegend', key: 'legend' }, legend.map(([key, label, color]) => h('span', { className: 'acp_terrainLegendItem', key }, [
          h('i', { className: 'acp_terrainDot', style: { background: color }, key: 'dot' }),
          h('span', { key: 'label' }, t(label)),
        ]))),
        h('div', { className: 'acp_terrainChart', key: 'chart' }, list.map((x) => {
          const total = Math.max(1, x.total);
          const height = Math.max(6, Math.round((x.total / max) * 100));
          const seg = (key, color) => {
            const value = x.parts[key];
            if (value <= 0) return null;
            return h('i', {
              key,
              title: t(legend.find((item) => item[0] === key)[1]) + ': ' + fmtTokens(value),
              style: { height: Math.round((value / total) * 100) + '%', background: color },
            });
          };
          return h('div', { className: 'acp_terrainCol', key: String(x.row.id), title: String(x.row.name) + ' · ' + fmtTokens(x.total) }, [
            h('span', { className: 'acp_terrainVal', key: 'val' }, fmtTokens(x.total)),
            h('span', { className: 'acp_terrainBarWrap', key: 'wrap' }, [
              h('span', { className: 'acp_terrainBar', key: 'bar', style: { height: height + '%' } }, [
                seg('read', '#8b5cf6'),
                seg('input', '#4f7cff'),
                seg('write', '#14b8a6'),
                seg('output', '#f59e0b'),
              ].filter(Boolean)),
            ]),
            h('span', { className: 'acp_terrainName', key: 'name' }, String(x.row.name)),
          ]);
        })),
      ]);
    }

    function initialsOf(name) {
      const s = String(name || '').trim();
      if (!s) return 'AI';
      const parts = s.split(/[\s_-]+/).filter(Boolean);
      if (parts.length > 1) return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
      return s.slice(0, 2).toUpperCase();
    }

    function AgentGraph(props) {
      const t = props.t;
      const rows = Array.isArray(props.rows) ? props.rows : [];
      if (rows.length === 0) return null;
      const W = 168;
      const H = 84;
      const GX = 18;
      const GY = 62;
      const PAD = 18;
      const byId = new Map(rows.map((r) => [String(r.id), r]));
      const roots = rows.filter((r) => !r.parentId || !byId.has(String(r.parentId)));
      if (roots.length === 0) roots.push(rows[0]);
      const depth = new Map();
      const queue = roots.map((r) => [r, 0]);
      while (queue.length > 0) {
        const item = queue.shift();
        const row = item[0];
        const d = item[1];
        const id = String(row.id);
        if (depth.has(id)) continue;
        depth.set(id, d);
        for (const child of rows) {
          if (String(child.parentId) === id && !depth.has(String(child.id))) queue.push([child, d + 1]);
        }
      }
      rows.forEach((r) => { if (!depth.has(String(r.id))) depth.set(String(r.id), 0); });
      const levels = [];
      rows.forEach((r) => {
        const d = depth.get(String(r.id));
        if (!levels[d]) levels[d] = [];
        levels[d].push(r);
      });
      const counts = levels.map((l) => (l ? l.length : 0));
      const maxCount = Math.max.apply(null, counts.concat([1]));
      const width = Math.max(620, PAD * 2 + maxCount * W + Math.max(0, maxCount - 1) * GX);
      const height = PAD * 2 + levels.length * H + Math.max(0, levels.length - 1) * GY;
      const pos = new Map();
      levels.forEach((list, d) => {
        if (!list) return;
        const lw = list.length * W + Math.max(0, list.length - 1) * GX;
        const start = (width - lw) / 2;
        list.forEach((r, i) => pos.set(String(r.id), { x: start + i * (W + GX), y: PAD + d * (H + GY) }));
      });
      const maxSteps = Math.max(1, ...rows.map((r) => Number(r.usage && r.usage.steps) || 0));
      const edges = [];
      rows.forEach((r) => {
        const parent = r.parentId ? pos.get(String(r.parentId)) : undefined;
        const self = pos.get(String(r.id));
        if (!parent || !self) return;
        const x1 = parent.x + W / 2;
        const y1 = parent.y + H;
        const x2 = self.x + W / 2;
        const y2 = self.y;
        const mid = (y1 + y2) / 2;
        edges.push(h('path', {
          key: 'e:' + r.id,
          d: 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + mid + ', ' + x2 + ' ' + mid + ', ' + x2 + ' ' + y2,
          className: 'acp_edge' + (isRunningRow(r) ? ' acp_edgeRun' : ''),
        }));
      });
      const nodes = rows.map((r) => {
        const p = pos.get(String(r.id));
        const u = r.usage || {};
        const steps = Number(u.steps) || 0;
        const total = (Number(u.input) || 0) + (Number(u.output) || 0) + (Number(u.cacheRead) || 0);
        const task = (props.tasks || []).find((x) => String(x.ownerId) === String(r.id) || String(x.owner) === String(r.id));
        const pct = Math.max(4, Math.round((steps / maxSteps) * 100));
        return h('button', {
          type: 'button',
          key: 'n:' + r.id,
          className: 'acp_graphNode' + (isRunningRow(r) ? ' acp_graphNodeRun' : '') + (r.current ? ' acp_graphNodeCurrent' : ''),
          style: { left: p.x + 'px', top: p.y + 'px', width: W + 'px', height: H + 'px' },
          onClick: () => props.openMember(props.sessionId, r.id),
          title: t('open'),
        }, [
          h('span', { className: 'acp_graphHeadRow', key: 'head' }, [
            h('span', { className: 'acp_graphDot ' + (isRunningRow(r) ? 'acp_dotRun' : 'acp_dotIdle'), key: 'dot' }),
            h('span', { className: 'acp_graphName', key: 'name' }, String(r.name)),
            r.role === 'lead' ? h('span', { className: 'acp_graphRole', key: 'role' }, 'LEAD') : null,
          ]),
          h('span', { className: 'acp_graphTask', key: 'task' }, task ? String(task.subject) : (r.description ? String(r.description) : t('noTask'))),
          h('span', { className: 'acp_graphStats', key: 'stats' }, String(steps) + ' 步 · ' + fmtTokens(total)),
          h('span', { className: 'acp_graphBar', key: 'bar' }, h('i', { style: { width: pct + '%' } })),
        ]);
      });
      return h('div', { className: 'acp_graph', key: 'graph' }, [
        h('div', { className: 'acp_graphHead', key: 'head' }, [
          h('span', { className: 'acp_sectionHead', key: 'title' }, [
            h('span', { key: 't' }, t('graphTitle')),
            h('span', { className: 'acp_count', key: 'c' }, String(rows.length)),
          ]),
          h('span', { className: 'acp_hint', key: 'hint', style: { margin: 0 } }, t('graphHint')),
        ]),
        h('div', { className: 'acp_graphCanvas', key: 'canvas', style: { width: width + 'px', height: height + 'px' } }, [
          h('svg', { key: 'svg', className: 'acp_graphSvg', width: width, height: height, viewBox: '0 0 ' + width + ' ' + height }, edges),
          ...nodes,
        ]),
      ]);
    }

    function ContextPulse(props) {
      const t = props.t;
      const rows = Array.isArray(props.rows) ? props.rows : [];
      if (rows.length === 0) return null;
      const list = rows.map((row) => {
        const u = row.usage || {};
        const read = Number(u.cacheRead) || 0;
        const out = Number(u.output) || 0;
        return { row, read, out, total: read + out };
      }).sort((a, b) => b.total - a.total);
      const max = Math.max(1, ...list.map((x) => x.total));
      const sumRead = list.reduce((s, x) => s + x.read, 0);
      const sumOut = list.reduce((s, x) => s + x.out, 0);
      const pressure = sumRead + sumOut > 0 ? Math.round((sumRead / (sumRead + sumOut)) * 100) : 0;
      return h('div', { className: 'acp_pulse', key: 'pulse' }, [
        h('div', { className: 'acp_pulseHead', key: 'head' }, [
          h('span', { className: 'acp_pulseTitle', key: 't' }, t('pulseTitle')),
          h('span', { className: 'acp_pulseBadge', key: 'p' }, String(pressure) + '% ' + t('pulsePressure')),
        ]),
        h('p', { className: 'acp_hint', key: 'hint' }, t('pulseHint')),
        h('div', { className: 'acp_pulseList', key: 'list' }, list.slice(0, 8).map((x) => h('div', { className: 'acp_pulseRow', key: String(x.row.id) }, [
          h('span', { className: 'acp_pulseName', key: 'n', title: String(x.row.name) }, String(x.row.name)),
          h('span', { className: 'acp_pulseTrack', key: 'track' }, [
            h('i', { className: 'acp_pulseOut', key: 'o', style: { width: Math.round((x.out / max) * 100) + '%' } }),
            h('i', { className: 'acp_pulseRead', key: 'r', style: { width: Math.round((x.read / max) * 100) + '%' } }),
          ]),
          h('span', { className: 'acp_pulseVal', key: 'v' }, fmtTokens(x.total)),
        ]))),
      ]);
    }

    /* 纯渲染部分：不碰 hooks / fetch，便于单独冒烟与回退 */
    function AgentSectionView(props) {
      const t = props.t;
      const snap = props.snap || { phase: 'loading', data: null, error: null };
      const rows = Array.isArray(props.rows) ? props.rows : [];
      const members = Array.isArray(props.members) ? props.members : [];
      const tasks = Array.isArray(props.tasks) ? props.tasks : [];
      const expandedRef = React.useState(true);
      const expanded = expandedRef[0];
      const setExpanded = expandedRef[1];
      const archivedRef = React.useState(false);
      const archivedExpanded = archivedRef[0];
      const setArchivedExpanded = archivedRef[1];
      const archived = Array.isArray(props.archived) ? props.archived.map((id) => String(id)) : [];
      const archivedSet = new Set(archived);
      const visibleRows = rows.filter((row) => !archivedSet.has(String(row.id)));
      const archivedRows = rows.filter((row) => archivedSet.has(String(row.id)));
      const active = visibleRows.filter((row) => isRunningRow(row));
      const idle = visibleRows.filter((row) => !isRunningRow(row));
      const hasFamilyRows = rows.length > 0;
      const count = hasFamilyRows ? visibleRows.length : members.length;
      const canArchive = typeof props.onArchive === 'function' && idle.length > 0;

      const head = h('div', { className: 'acp_sectionHead', key: 'head' }, [
        h('span', { key: 'title' }, t('agents')),
        h('span', { className: 'acp_count', key: 'count' }, String(count)),
        archivedRows.length > 0
          ? h('span', { className: 'acp_count', key: 'archived' }, '· ' + String(archivedRows.length) + ' ' + t('archivedGroup'))
          : null,
      ]);

      const body = [];
      const names = new Map(rows.map((row) => [String(row.id), String(row.name)]));
      const card = (row) => h(AgentCard, {
        key: String(row.id),
        row,
        t,
        tasks,
        budget: props.budget,
        sessionId: props.sessionId,
        parentName: row.parentId !== undefined && row.parentId !== '' ? names.get(String(row.parentId)) : undefined,
        openMember: props.openMember,
      });

      if (hasFamilyRows) {
        const totals = snap.data && snap.data.totals ? snap.data.totals : {};
        body.push(h(AgentGraph, {
          key: 'graph',
          rows: visibleRows,
          tasks,
          t,
          sessionId: props.sessionId,
          openMember: props.openMember,
        }));
        body.push(h(ContextTerrain, { key: 'terrain', rows: visibleRows, t }));
        if (active.length > 0) {
          body.push(h('div', { className: 'acp_grid', key: 'active' }, active.map(card)));
        }
        if (idle.length > 0) {
          body.push(h('div', { className: 'acp_idleGroup', key: 'idle' }, [
            h('div', { className: 'acp_disclosureRow', key: 'row' }, [
              h('button', {
                type: 'button',
                className: 'acp_disclosure',
                key: 'toggle',
                onClick: () => { if (typeof setExpanded === 'function') setExpanded(!expanded); },
              }, [
                h('span', { className: 'acp_disclosureCaret', key: 'caret' }, expanded ? '▾' : '▸'),
                h('span', { key: 'label' }, t('statusIdleGroup') + ' (' + String(idle.length) + ')'),
              ]),
              canArchive ? h('div', { className: 'acp_disclosureActions', key: 'actions' }, [
                h('button', {
                  type: 'button',
                  className: 'acp_miniAction',
                  key: 'archive',
                  onClick: () => props.onArchive(idle.map((row) => String(row.id))),
                }, t('archiveIdle') + ' (' + String(idle.length) + ')'),
              ]) : null,
            ].filter(Boolean)),
            expanded
              ? h('div', { className: 'acp_grid', key: 'grid', style: { marginTop: 8 } }, idle.map(card))
              : null,
          ]));
        }
        const ratio = snap.data && typeof snap.data.ratio === 'number' ? snap.data.ratio : 0;
        body.push(h('div', { className: 'acp_statStrip', key: 'totals' }, [
          h('span', { className: 'acp_miniStat', key: 'active' }, [h('b', { key: 'v' }, String(active.length)), t('statActive')]),
          h('span', { className: 'acp_miniStat', key: 'idle' }, [h('b', { key: 'v' }, String(idle.length)), t('statusIdleGroup')]),
          h('span', { className: 'acp_miniStat', key: 'steps' }, [h('b', { key: 'v' }, String(totals.steps || 0)), t('colSteps')]),
          h('span', { className: 'acp_miniStat', key: 'out' }, [h('b', { key: 'v' }, fmtTokens(totals.output || 0)), t('colOutput')]),
          h('span', { className: 'acp_miniStat', key: 'read' }, [h('b', { key: 'v' }, fmtTokens(totals.cacheRead || 0)), t('colRead')]),
          ratio > 0 ? h('span', { className: 'acp_miniStat', key: 'ratio' }, [h('b', { key: 'v' }, (Math.round(ratio * 10) / 10) + '×'), t('costRatio')]) : null,
        ]));
        if (archivedRows.length > 0) {
          body.push(h('div', { className: 'acp_idleGroup', key: 'archivedGroup' }, [
            h('div', { className: 'acp_disclosureRow', key: 'row' }, [
              h('button', {
                type: 'button',
                className: 'acp_disclosure',
                key: 'toggle',
                onClick: () => { if (typeof setArchivedExpanded === 'function') setArchivedExpanded(!archivedExpanded); },
              }, [
                h('span', { className: 'acp_disclosureCaret', key: 'caret' }, archivedExpanded ? '▾' : '▸'),
                h('span', { key: 'label' }, t('archivedGroup') + ' (' + String(archivedRows.length) + ')'),
              ]),
              typeof props.onRestore === 'function' ? h('div', { className: 'acp_disclosureActions', key: 'actions' }, [
                h('button', {
                  type: 'button',
                  className: 'acp_miniAction',
                  key: 'restore',
                  onClick: () => props.onRestore(),
                }, t('restoreArchived')),
              ]) : null,
            ].filter(Boolean)),
            archivedExpanded
              ? h('div', { className: 'acp_grid', key: 'grid', style: { marginTop: 8 } }, archivedRows.map(card))
              : null,
          ]));
        }
      } else if (members.length > 0) {
        body.push(h('div', { className: 'acp_grid', key: 'grid' }, members.map((member, index) => h(MemberCard, {
          key: String(member.id),
          member,
          isLead: member.role !== undefined ? member.role === 'lead' : index === 0,
          tasks,
          sessionId: props.sessionId,
          useSessions: props.useSessions,
          useSessionStatus: props.useSessionStatus,
          openMember: props.openMember,
          t,
        }))));
        if (snap.phase === 'error') {
          body.push(h('p', { className: 'acp_hint', key: 'error' }, t('agentsError') + ': ' + String(snap.error)));
        }
      }

      return h('section', { className: 'acp_section acp_fleet', 'data-agent-cockpit-fleet': true, key: 'agents' }, [
        head,
        ...body,
        h('p', { className: 'acp_hint', key: 'hint' }, t('agentsHint') + (archivedRows.length > 0 ? ' · ' + t('archivedHint') : '')),
      ]);
    }

    /* ── task card ──────────────────────────────────────────────────────── */

    function TaskCard(props) {
      const task = props.task;
      const t = props.t;
      const critical = props.critical === true;
      const meta = [];
      meta.push(h('span', { className: 'acp_metaItem', key: 'owner' }, t('owner') + ': ' + (task.ownerName !== undefined ? task.ownerName : t('unowned'))));
      if (task.status === 'pending') {
        meta.push(h('span', {
          className: 'acp_metaItem ' + (task.ready === false ? 'acp_warn' : 'acp_ok'),
          key: 'ready',
        }, task.ready === false ? t('blocked') : t('ready')));
      }
      if (Array.isArray(task.blockedBy) && task.blockedBy.length > 0) {
        meta.push(h('span', { className: 'acp_metaItem', key: 'blockedBy' }, t('blockedBy') + ': ' + task.blockedBy.join(', ')));
      }
      if (Array.isArray(task.writeScopes) && task.writeScopes.length > 0) {
        meta.push(h('span', {
          className: 'acp_metaItem',
          key: 'writeScopes',
          title: task.writeScopes.join(', '),
        }, t('writeScopes') + ': ' + task.writeScopes.join(', ')));
      }
      (Array.isArray(task.writeScopeWarnings) ? task.writeScopeWarnings : []).forEach((warning, index) => {
        meta.push(h('span', { className: 'acp_metaItem acp_warn', key: 'warning-' + index }, String(warning)));
      });
      meta.push(h('span', { className: 'acp_metaItem acp_taskId', key: 'id' }, String(task.id)));

      return h('article', { className: 'acp_task' + (critical ? ' acp_taskCritical' : ''), 'data-task-id': task.id }, [
        h('div', { className: 'acp_taskHead', key: 'head' }, [
          h('strong', { className: 'acp_taskSubject', key: 'subject', title: task.subject }, task.subject),
          critical ? h('span', { className: 'acp_critical', key: 'critical' }, t('criticalBadge')) : null,
          h('span', { className: 'acp_taskState', key: 'state' }, [
            h('span', { className: taskDotClass(task), key: 'dot' }),
            h('span', { key: 'label' }, t(taskStatusKey(task.status))),
          ]),
        ]),
        task.description !== undefined && task.description !== ''
          ? h('p', { className: 'acp_taskDesc', key: 'desc', title: task.description }, task.description)
          : null,
        h('div', { className: 'acp_meta', key: 'meta' }, meta),
      ]);
    }

    /* ── member (department) card ───────────────────────────────────────── */

    function MemberCard(props) {
      const member = props.member;
      const t = props.t;
      const useSessions = props.useSessions;
      const useSessionStatus = props.useSessionStatus;
      const model = useSessions((state) => {
        const sessions = state && state.projectionsBySession ? state.projectionsBySession : undefined;
        const entry = sessions ? sessions[member.id] : undefined;
        const value = entry && entry.values ? entry.values.modelSelection : undefined;
        return value && value.next ? value.next.model : undefined;
      });
      const running = useSessionStatus((state) => {
        if (state === undefined || state === null) return undefined;
        if (typeof state.get !== 'function') return undefined;
        const entry = state.get(member.id);
        return entry ? entry.running : undefined;
      });
      const summaryRunning = useSessions((state) => {
        const index = state && state.byId ? state.byId[member.id] : undefined;
        return index ? index.running : undefined;
      });
      const status = statusOfMember(member, running, summaryRunning);
      const isCurrent = member.id === props.sessionId;
      const disabled = isCurrent || status === 'failed' || status === 'provisioning';
      const task = memberTaskOf(props.tasks, member);
      const roleKey = props.isLead ? 'lead' : 'teammate';

      const meta = [
        h('span', { key: 'status', className: 'acp_cardMeta' }, [
          h('span', { className: dotClass(status), key: 'dot' }),
          h('span', { key: 'label' }, t(statusKey(status))),
        ]),
      ];
      if (model !== undefined && model !== null && model !== '') {
        meta.push(h('span', { className: 'acp_cardMeta', key: 'model' }, t('model') + ': ' + model));
      }

      const children = [
        h('div', { className: 'acp_cardTop', key: 'top' }, [
          h('span', { className: 'acp_name', key: 'name', title: member.name }, member.name),
          h('span', { className: props.isLead ? 'acp_role acp_roleLead' : 'acp_role', key: 'role' }, t(roleKey)),
          isCurrent ? h('span', { className: 'acp_role', key: 'current' }, t('current')) : null,
        ]),
        h('div', { className: 'acp_cardMeta', key: 'meta' }, meta),
        h('div', { className: 'acp_duty', key: 'duty', title: member.description }, [
          h('span', { key: 'label' }, t('duty') + ': '),
          h('span', { key: 'text' }, member.description !== undefined && member.description !== '' ? String(member.description) : t('noDesc')),
        ]),
        h('div', { className: 'acp_duty', key: 'task' }, task === undefined
          ? t('noTask')
          : t('currentTask') + ': ' + String(task.subject)),
      ];
      if (member.error !== undefined) {
        children.push(h('div', { className: 'acp_duty acp_warn', key: 'error' }, String(member.error)));
      }

      return h('button', {
        type: 'button',
        className: 'acp_card',
        title: disabled ? undefined : t('open'),
        disabled,
        'data-member-id': member.id,
        onClick: () => { if (!disabled) props.openMember(props.sessionId, member.id); },
      }, children);
    }

    /* ── badge in the composer dock ─────────────────────────────────────── */

    function CockpitBadge(props) {
      const t = props.t;
      const useSessions = typeof props.useSessions === 'function' ? props.useSessions : useNoopSelector;
      const useSession = typeof props.useSession === 'function' ? props.useSession : useNoopSelector;
      const sessionId = props.sessionId !== undefined ? props.sessionId : '';
      const parent = useSession((snapshot) => {
        if (snapshot === undefined || snapshot === null) return undefined;
        const subagent = snapshot.subagent;
        const address = subagent ? subagent.address : undefined;
        return address ? address.parentSessionId : undefined;
      });
      const leadSessionId = parent !== undefined && parent !== null ? parent : sessionId;
      const team = useSessions((state) => {
        if (!state || !state.projectionsBySession || !leadSessionId) return undefined;
        const entry = state.projectionsBySession[leadSessionId];
        return entry && entry.values ? entry.values.agentTeam : undefined;
      });
      const members = team && Array.isArray(team.members) ? team.members : [];
      const tasks = team && Array.isArray(team.tasks) ? team.tasks : [];
      const activeCount = useSessions((state) => {
        if (!team || !state || !state.byId) return 0;
        let count = 0;
        team.members.forEach((member) => {
          const index = state.byId[member.id];
          if (index && index.running === true) count += 1;
        });
        return count;
      });

      // 没有团队就不要在输入框上常驻“工作台”徽章：正常对话保持安静。
      if (members.length <= 1 && tasks.length === 0) return null;

      // 空闲时不再显示成员/任务数字，避免把历史团队误读成“协作正在运行”。
      const label = activeCount > 0
        ? String(activeCount) + ' ' + t('statusRunning') + (tasks.length > 0 ? ' · ' + String(tasks.length) + ' ' + t('statTasks') : '')
        : '';

      return h('div', { className: 'acp_badgeWrap' }, h('button', {
        type: 'button',
        className: 'acp_badge',
        title: t('openCockpit'),
        'aria-label': t('openCockpit'),
        onClick: () => {
          if (typeof props.openView === 'function') {
            props.openView(VIEW_ID, '');
          }
        },
      }, [
        h('span', { className: activeCount > 0 ? 'acp_dot acp_dotRun' : 'acp_dot acp_dotIdle', key: 'dot' }),
        h('span', { className: 'acp_badgeLabel', key: 'label' }, t('trigger')),
        label !== '' ? h('span', { className: 'acp_badgeCount', key: 'count' }, label) : null,
      ]));
    }

    /* ── board column ───────────────────────────────────────────────────── */

    function BoardColumn(props) {
      const t = props.t;
      const tasks = props.tasks;
      return h('section', { className: 'acp_col', 'data-column': props.id }, [
        h('div', { className: 'acp_colHead', key: 'head' }, [
          h('span', { className: props.dotClass, key: 'dot' }),
          h('span', { key: 'title' }, props.title),
          h('span', { className: 'acp_count', key: 'count' }, String(tasks.length)),
        ]),
        tasks.length === 0
          ? h('div', { className: 'acp_colEmpty', key: 'empty' }, t('emptyBoard'))
          : null,
        tasks.map((task) => h(TaskCard, {
          key: String(task.id),
          task,
          t,
          critical: props.criticalIds !== undefined && props.criticalIds !== null
            ? props.criticalIds.has(String(task.id))
            : false,
        })),
      ]);
    }

    /* ── 插件冲突体检弹窗 ── */
    function ConflictModal(props) {
      const t = props.t;
      const doctor = props.doctor || {};
      const conflicts = Array.isArray(doctor.conflicts) ? doctor.conflicts : [];
      const result = props.result || null;
      const fixable = conflicts.some((item) => item.fixable);
      const status = doctor.status;
      const done = status === 'fix-applied' || status === 'opted-out';
      const items = conflicts.map((item, index) => h('div', { className: 'acp_doctorItem', key: String(index) }, [
        h('div', { className: 'acp_doctorItemHead', key: 'head' }, [
          h('span', { className: 'acp_sev ' + (item.severity === 'high' ? 'acp_sevHigh' : 'acp_sevMedium'), key: 'sev' }, String(item.severity || '')),
          h('span', { className: 'acp_doctorItemTitle', key: 'title' }, String(item.title || item.code || '')),
          h('span', { className: 'acp_sev', key: 'fix' }, item.fixable ? t('doctorFixable') : t('doctorManual')),
        ]),
        h('div', { className: 'acp_doctorItemDetail', key: 'detail' }, String(item.detail || '')),
      ]));
      const actions = [];
      if (!done) {
        actions.push(h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'fix',
          disabled: props.busy || !fixable,
          onClick: () => props.onAction('fix'),
        }, t('doctorFix')));
        actions.push(h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'rescan',
          disabled: props.busy,
          onClick: () => props.onAction('rescan'),
        }, t('doctorRescan')));
        actions.push(h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'dismiss',
          disabled: props.busy,
          onClick: () => { props.onAction('dismiss'); props.onClose(); },
        }, t('doctorDismiss')));
        actions.push(h('button', {
          type: 'button',
          className: 'acp_action acp_doctorDanger',
          key: 'optout',
          disabled: props.busy,
          onClick: () => props.onAction('optout'),
        }, t('doctorOptout')));
      } else {
        actions.push(h('button', { type: 'button', className: 'acp_action', key: 'close', onClick: props.onClose }, t('close')));
      }
      if (doctor.conversationId && typeof props.openSession === 'function') {
        actions.push(h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'chat',
          onClick: () => props.openSession(doctor.conversationId),
        }, t('doctorOpenConversation')));
      }
      const resultText = result && result.ok
        ? (result.action === 'optout'
          ? t('doctorResultOptout')
          : result.action === 'fix'
            ? t('doctorResultFix') + (Array.isArray(result.removed) ? result.removed.join(', ') : '')
            : '')
        : '';
      return h('div', { className: 'acp_doctorMask', role: 'dialog', 'aria-modal': 'true' }, [
        h('div', { className: 'acp_doctorCard', key: 'card' }, [
          h('div', { className: 'acp_doctorHead', key: 'head' }, [
            h('span', { className: 'acp_logo', key: 'logo' }, 'GK'),
            h('div', { key: 'titleWrap' }, [
              h('div', { className: 'acp_doctorTitle', key: 'title' }, t('doctorTitle')),
              h('div', { className: 'acp_sub', key: 'sub', style: { marginTop: 0 } }, String(doctor.profile || '')),
            ]),
          ]),
          h('p', { className: 'acp_doctorIntro', key: 'intro' }, conflicts.length > 0 ? t('doctorIntro') : t('doctorClean')),
          ...items,
          resultText ? h('div', { className: 'acp_doctorResult', key: 'result' }, resultText) : null,
          (doctor.restartRequired && done) ? h('div', { className: 'acp_doctorResult', key: 'restart' }, t('doctorRestart')) : null,
          h('div', { className: 'acp_doctorActions', key: 'actions' }, actions),
        ]),
      ]);
    }

    /* ── the cockpit page ───────────────────────────────────────────────── */

    /* ── 家族数据（每 20s 轮询一次；卡片、成本、分工计划共用同一份） ─────── */

    function useFamilySnapshot(leadSessionId, sessionId) {
      const stateRef = React.useState({ phase: leadSessionId ? 'loading' : 'idle', data: null, error: null });
      const snap = stateRef[0];
      const setSnap = stateRef[1];
      const key = String(leadSessionId) + '|' + String(sessionId);

      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        if (!leadSessionId) {
          setSnap({ phase: 'idle', data: null, error: null });
          return undefined;
        }
        const url = '/agent-cockpit/family?lead=' + encodeURIComponent(leadSessionId) + '&session=' + encodeURIComponent(sessionId);
        const load = () => {
          fetch(url, { headers: { accept: 'application/json' } })
            .then((response) => {
              if (!response.ok) throw new Error('HTTP ' + response.status);
              return response.json();
            })
            .then((data) => {
              if (cancelled) return;
              if (data && data.error) throw new Error(String(data.error));
              setSnap({ phase: 'ready', data, error: null });
            })
            .catch((err) => {
              if (cancelled) return;
              // 有旧数据就保留，避免一次轮询失败把页面清空
              setSnap((prev) => (prev.data ? prev : { phase: 'error', data: null, error: String(err && err.message ? err.message : err) }));
            });
        };
        load();
        timer = setInterval(load, 20000);
        return () => {
          cancelled = true;
          if (timer !== null) clearInterval(timer);
        };
      }, [key]);

      return snap;
    }

    /* ── 预算编辑条（只提示，不中断 agent） ─────────────────────────────── */

    function BudgetEditor(props) {
      const t = props.t;
      const current = props.budget || {};
      const stepsRef = React.useState(current.steps > 0 ? String(current.steps) : '');
      const outputRef = React.useState(current.output > 0 ? String(current.output) : '');
      const steps = stepsRef[0];
      const setSteps = stepsRef[1];
      const output = outputRef[0];
      const setOutput = outputRef[1];
      const pick = (value) => {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
      };
      return h('div', { className: 'acp_budgetRow', 'data-agent-cockpit-budget': true }, [
        h('span', { key: 'stepsLabel' }, t('budgetSteps')),
        h('input', {
          key: 'steps',
          className: 'acp_input',
          type: 'number',
          min: 1,
          step: 1,
          value: steps,
          placeholder: '150',
          onChange: (event) => { if (typeof setSteps === 'function') setSteps(event.target.value); },
        }),
        h('span', { key: 'outputLabel' }, t('budgetOutput')),
        h('input', {
          key: 'output',
          className: 'acp_input',
          type: 'number',
          min: 1,
          step: 1000,
          value: output,
          placeholder: '200000',
          onChange: (event) => { if (typeof setOutput === 'function') setOutput(event.target.value); },
        }),
        h('button', {
          type: 'button',
          className: 'acp_refresh',
          key: 'save',
          onClick: () => {
            const next = { steps: pick(steps), output: pick(output) };
            if (typeof props.onSave === 'function') props.onSave(next.steps > 0 || next.output > 0 ? next : null);
          },
        }, t('budgetSave')),
        h('button', {
          type: 'button',
          className: 'acp_refresh',
          key: 'clear',
          onClick: () => { if (typeof props.onClear === 'function') props.onClear(); },
        }, t('budgetClear')),
        h('button', {
          type: 'button',
          className: 'acp_refresh',
          key: 'cancel',
          onClick: () => { if (typeof props.onClose === 'function') props.onClose(); },
        }, t('budgetCancel')),
        h('span', { className: 'acp_hint', key: 'hint', style: { margin: 0 } }, t('budgetHint')),
      ]);
    }

    /* ── 分工计划：按成员列任务 + 关键路径 + 写范围冲突 ─────────────────── */

    function PlanSection(props) {
      const t = props.t;
      const tasks = Array.isArray(props.tasks) ? props.tasks : [];
      const rows = Array.isArray(props.rows) ? props.rows : [];
      const members = Array.isArray(props.members) ? props.members : [];
      const people = rows.length > 0
        ? rows.map((row) => ({ id: row.id, name: String(row.name), role: String(row.role || '') }))
        : members.map((member, index) => ({
          id: member.id,
          name: String(member.name !== undefined ? member.name : member.id),
          role: String(member.role !== undefined ? member.role : index === 0 ? 'lead' : 'teammate'),
        }));
      const hasTasks = tasks.length > 0;
      const critical = criticalPathOf(tasks);
      const conflicts = scopeConflictsOf(tasks);
      const stats = planStatsOf(tasks);
      if (people.length === 0 && !hasTasks) return null;

      const roleLabel = (role) => t(role === 'lead' ? 'roleLead' : role === 'subagent' ? 'roleSubagent' : 'roleTeammate');
      const planRows = people.map((person) => {
        const mine = tasksOfOwner(tasks, person.name)
          .filter((task) => task.status !== 'deleted')
          .sort((left, right) => {
            const rank = { in_progress: 0, pending: 1, completed: 2 };
            return (rank[left.status] || 9) - (rank[right.status] || 9);
          });
        const criticalIds = critical.ids;
        return h('div', { className: 'acp_planRow', key: String(person.id) }, [
          h('div', { key: 'who' }, [
            h('div', { className: 'acp_planName', key: 'name', title: person.name }, person.name),
            h('div', { className: 'acp_planRole', key: 'role' }, roleLabel(person.role)),
          ]),
          h('div', { className: 'acp_planTasks', key: 'tasks' }, mine.length === 0
            ? [h('span', { className: 'acp_planState', key: 'none' }, t('noTask'))]
            : mine.map((task) => h('div', { className: 'acp_planTask', key: String(task.id) }, [
              h('span', { className: 'acp_planTaskSubject', key: 'subject', title: task.subject }, String(task.subject)),
              criticalIds.has(String(task.id))
                ? h('span', { className: 'acp_critical', key: 'critical' }, t('criticalBadge'))
                : null,
              h('span', { className: 'acp_planState', key: 'state' }, t(taskStatusKey(task.status))
                + (task.status === 'pending' && task.ready === false ? ' · ' + t('blocked') : '')),
            ]))),
        ]);
      });

      const warnings = [];
      if (critical.length > 1) {
        warnings.push(h('div', { className: 'acp_planWarnLine', key: 'critical' }, [
          h('span', { className: 'acp_warn', key: 'label' }, t('planCritical') + ': '),
          h('span', { key: 'chain' }, String(critical.length) + ' ' + t('planCriticalChain') + ' · '
            + critical.chain.map((task) => String(task.subject)).join(' → ')),
        ]));
      }
      if (stats.unowned > 0) {
        warnings.push(h('div', { className: 'acp_planWarnLine acp_warn', key: 'unowned' },
          String(stats.unowned) + ' ' + t('planUnowned')));
      }
      if (stats.blocked > 0) {
        warnings.push(h('div', { className: 'acp_planWarnLine acp_warn', key: 'blocked' },
          String(stats.blocked) + ' ' + t('planBlocked')));
      }
      for (const conflict of conflicts) {
        warnings.push(h('div', { className: 'acp_planWarnLine acp_warn', key: 'conflict-' + conflict.scope + '-' + String(conflict.left.id) }, [
          h('span', { key: 'label' }, t('planConflict') + ': '),
          h('span', { key: 'text' }, conflict.scope + ' · ' + String(conflict.left.id) + ' ↔ ' + String(conflict.right.id)),
        ]));
      }

      return h('section', { className: 'acp_section', 'data-agent-cockpit-plan': true, key: 'plan' }, [
        h('div', { className: 'acp_sectionHead', key: 'head' }, [
          h('span', { key: 'title' }, t('plan')),
          h('span', { className: 'acp_count', key: 'count' }, String(tasks.length)),
        ]),
        hasTasks ? h('div', { className: 'acp_plan', key: 'rows' }, planRows) : null,
        hasTasks && warnings.length > 0 ? h('div', { className: 'acp_planWarn', key: 'warn' }, warnings) : null,
        h('p', { className: 'acp_hint', key: 'hint' }, hasTasks ? t('planHint') : t('planEmpty')),
      ]);
    }

    /* ── 本次任务成本（自最近一条用户消息起） ───────────────────────────── */

    function TaskCostSection(props) {
      const t = props.t;
      const snap = props.snap || { phase: 'loading', data: null };
      const data = snap.data || {};
      const totals = data.totals || {};
      const steps = Number(totals.steps) || 0;
      const output = Number(totals.output) || 0;
      const read = Number(totals.cacheRead) || 0;
      const ratio = typeof data.ratio === 'number' ? data.ratio : 0;
      const rows = Array.isArray(data.agents) ? data.agents : [];
      const sinceLabel = typeof data.since === 'number' && data.since > 0 ? agoLabel(data.since, t) : '';

      const body = [];
      if (snap.phase === 'loading') {
        body.push(h('div', { className: 'acp_notice', key: 'loading', role: 'status' }, [
          h('span', { className: 'acp_dot acp_dotWait', key: 'dot' }),
          h('span', { key: 'text' }, t('taskCostLoading')),
        ]));
      } else {
        body.push(h('div', { className: 'acp_kpis', key: 'kpis' }, [
          h('div', { className: 'acp_kpi', key: 'steps' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colSteps')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, String(steps)),
          ]),
          h('div', { className: 'acp_kpi', key: 'output' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colOutput')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, fmtTokens(output)),
          ]),
          h('div', { className: 'acp_kpi', key: 'read' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colRead')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, fmtTokens(read)),
          ]),
          h('div', { className: 'acp_kpi', key: 'ratio' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('costRatio')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, ratio > 0 ? (Math.round(ratio * 10) / 10) + '×' : '—'),
          ]),
        ]));
      }

      return h('section', { className: 'acp_section', 'data-agent-cockpit-taskcost': true, key: 'taskcost' }, [
        h('div', { className: 'acp_sectionHead', key: 'head' }, [
          h('span', { key: 'title' }, t('taskCost')),
          rows.length > 0 ? h('span', { className: 'acp_count', key: 'count' }, String(rows.length)) : null,
        ]),
        ...body,
        h('p', { className: 'acp_hint', key: 'hint' },
          (sinceLabel !== '' ? t('taskSince') + ' ' + sinceLabel + ' · ' : '') + t('taskCostHint')),
      ]);
    }

    /* ── 效率体检：成本表 + 每步输出 + 重读倍数 + 空闲占比 ─────────────── */

    function EfficiencyRow(props) {
      const row = props.row;
      const t = props.t;
      const usage = row && row.usage ? row.usage : {};
      const budget = props.budget || null;
      const steps = Number(usage.steps) || 0;
      const output = Number(usage.output) || 0;
      const read = Number(usage.cacheRead) || 0;
      const total = (Number(usage.input) || 0) + output + read;
      const over = !props.isTotal && overBudgetOf(row, budget);
      const overSteps = !props.isTotal && budget && budget.steps > 0 && steps > budget.steps;
      return h('tr', props.isTotal ? { className: 'acp_totalRow' } : null, [
        h('td', { key: 'name' }, props.isTotal ? t('costTeam') : costNameOf(row, t)),
        h('td', { key: 'steps', className: overSteps ? 'acp_over' : undefined }, String(steps)),
        h('td', { key: 'output' }, fmtTokens(output)),
        h('td', { key: 'read' }, fmtTokens(read)),
        h('td', { key: 'eff', className: over ? 'acp_over' : undefined }, steps > 0 ? fmtTokens(Math.round(output / steps)) : '—'),
        h('td', { key: 'sum' }, fmtTokens(total)),
      ]);
    }

    function EfficiencySection(props) {
      const t = props.t;
      const rows = Array.isArray(props.rows) ? props.rows : [];
      const totals = props.totals || {};
      const ratio = typeof props.ratio === 'number' ? props.ratio : 0;
      const budget = props.budget || null;
      const phase = props.phase;
      const members = Array.isArray(props.members) ? props.members : [];

      if (phase === 'loading' || phase === 'idle') {
        return h('section', { className: 'acp_section', 'data-agent-cockpit-cost': true, key: 'cost' }, [
          h('div', { className: 'acp_sectionHead', key: 'head' }, [h('span', { key: 'title' }, t('cost'))]),
          h('div', { className: 'acp_notice', key: 'loading', role: 'status' }, [
            h('span', { className: 'acp_dot acp_dotWait', key: 'dot' }),
            h('span', { key: 'text' }, t('costLoading')),
          ]),
        ]);
      }
      if (rows.length === 0) return null;

      const steps = Number(totals.steps) || 0;
      const output = Number(totals.output) || 0;
      const perStep = steps > 0 ? Math.round(output / steps) : 0;
      const idleRows = rows.filter((row) => !isRunningRow(row));
      const overRows = budget ? rows.filter((row) => overBudgetOf(row, budget)) : [];
      const note = budget && overRows.length > 0
        ? String(overRows.length) + ' ' + t('budgetOver') + ' · ' + t('budgetHostHint')
        : t('costHint');

      const body = rows.map((row) => h(EfficiencyRow, {
        key: String(row.id),
        row,
        t,
        members,
        budget,
      }));
      body.push(h(EfficiencyRow, {
        key: 'totals',
        row: { name: t('costTeam'), usage: totals, role: 'total' },
        t,
        isTotal: true,
      }));

      return h('section', { className: 'acp_section', 'data-agent-cockpit-cost': true, key: 'cost' }, [
        h('div', { className: 'acp_sectionHead', key: 'head' }, [
          h('span', { key: 'title' }, t('costEff')),
          h('span', { className: 'acp_count', key: 'count' }, String(rows.length)),
        ]),
        h('div', { className: 'acp_kpis', key: 'summary' }, [
          h('div', { className: 'acp_kpi', key: 'steps' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colSteps')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, String(steps)),
          ]),
          h('div', { className: 'acp_kpi', key: 'output' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colOutput')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, fmtTokens(output)),
          ]),
          h('div', { className: 'acp_kpi', key: 'read' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('colRead')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, fmtTokens(Number(totals.cacheRead) || 0)),
          ]),
          h('div', { className: 'acp_kpi', key: 'perStep' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('costPerStep')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, fmtTokens(perStep)),
          ]),
          h('div', { className: 'acp_kpi', key: 'ratio' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('costRatio')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, ratio > 0 ? (Math.round(ratio * 10) / 10) + '×' : '—'),
          ]),
          h('div', { className: 'acp_kpi', key: 'idle' }, [
            h('div', { className: 'acp_kpiLabel', key: 'label' }, t('statusIdleGroup')),
            h('div', { className: 'acp_kpiValue', key: 'value' }, String(idleRows.length)),
            h('div', { className: 'acp_kpiSub', key: 'sub' }, '/' + String(rows.length)),
          ]),
        ]),
        h('div', { className: 'acp_tableWrap', key: 'table' }, h('table', { className: 'acp_table' }, [
          h('thead', { key: 'head' }, h('tr', null, [
            h('th', { key: 'name' }, t('colName')),
            h('th', { key: 'steps' }, t('colSteps')),
            h('th', { key: 'output' }, t('colOutput')),
            h('th', { key: 'read' }, t('colRead')),
            h('th', { key: 'eff' }, t('colEff')),
            h('th', { key: 'sum' }, t('colSum')),
          ])),
          h('tbody', { key: 'body' }, body),
        ])),
        h('p', { className: 'acp_hint', key: 'hint' }, note),
      ]);
    }

    /* ── the cockpit page ───────────────────────────────────────────────── */

    function Cockpit(props) {
      const t = props.t;
      const useSessions = typeof props.useSessions === 'function' ? props.useSessions : useNoopSelector;
      const useSession = typeof props.useSession === 'function' ? props.useSession : useNoopSelector;
      const useSessionStatus = typeof props.useSessionStatus === 'function' ? props.useSessionStatus : useNoopSelector;
      const sessionId = props.sessionId !== undefined ? props.sessionId : '';
      const parent = useSession((snapshot) => {
        if (snapshot === undefined || snapshot === null) return undefined;
        const subagent = snapshot.subagent;
        const address = subagent ? subagent.address : undefined;
        return address ? address.parentSessionId : undefined;
      });
      const leadSessionId = parent !== undefined && parent !== null ? parent : sessionId;
      const team = useSessions((state) => {
        if (!state || !state.projectionsBySession || !leadSessionId) return undefined;
        const entry = state.projectionsBySession[leadSessionId];
        return entry && entry.values ? entry.values.agentTeam : undefined;
      });
      const listing = useSessions((state) => state !== undefined && state !== null && state.phase === 'pending');

      const family = useFamilySnapshot(leadSessionId, sessionId);
      const cockpitState = useCockpitState(leadSessionId);
      const taskCost = useTaskCost(leadSessionId);
      const doctorState = useDoctor();
      const doctorClosedRef = React.useState(0);
      const doctorClosedAt = doctorClosedRef[0];
      const setDoctorClosedAt = doctorClosedRef[1];
      const doctor = doctorState.doctor;
      const doctorShouldShow = !!(doctor
        && doctor.status === 'pending'
        && Array.isArray(doctor.conflicts)
        && doctor.conflicts.length > 0
        && !(Number(doctorClosedAt) >= Number(doctor.scannedAt || 0)));
      const budget = cockpitState.budget;
      const mode = cockpitState.mode;
      const updateState = cockpitState.update;
      const hostStatus = cockpitState.status;
      const archived = Array.isArray(cockpitState.archived) ? cockpitState.archived.map((id) => String(id)) : [];
      const editingRef = React.useState(false);
      const editing = editingRef[0];
      const setEditing = editingRef[1];

      const members = team && Array.isArray(team.members) ? team.members : [];
      const tasks = (team && Array.isArray(team.tasks) ? team.tasks : []).filter((task) => task && task.status !== 'deleted');
      const pendingTasks = sortPending(tasks.filter((task) => task.status === 'pending'));
      const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
      const completedTasks = tasks.filter((task) => task.status === 'completed');
      const hasTeam = team !== undefined && (members.length > 1 || tasks.length > 0);

      const familyRows = family.data && Array.isArray(family.data.agents) ? family.data.agents : [];
      const archivedSet = new Set(archived);
      const visibleFamilyRows = familyRows.filter((row) => !archivedSet.has(String(row.id)));
      const familyReady = family.phase === 'ready' && familyRows.length > 0;
      const activeRows = familyRows.filter((row) => isRunningRow(row));
      const idleRows = familyRows.filter((row) => !isRunningRow(row));
      const lastActive = family.data && typeof family.data.lastActive === 'number' ? family.data.lastActive : 0;
      const budgetOver = familyReady && budget ? familyRows.filter((row) => overBudgetOf(row, budget)) : [];
      const familyTotals = family.data && family.data.totals ? family.data.totals : undefined;
      const familyRatio = family.data && typeof family.data.ratio === 'number' ? family.data.ratio : 0;
      const critical = criticalPathOf(tasks);
      const activeCount = familyReady
        ? activeRows.length
        : members.filter((member) => isRunningRow(member)).length;
      const idleCount = familyReady ? idleRows.length : Math.max(0, members.length - activeCount);

      const sections = [];

      if (mode === 'council') {
        sections.push(h('div', { className: 'acp_notice', key: 'councilBanner', role: 'status' }, [
          h('span', { className: 'acp_dot', key: 'dot' }),
          h('span', { key: 'text' }, t('councilBanner')),
        ]));
      }

      if (doctorState.doctor && doctorState.doctor.status === 'pending' && Array.isArray(doctorState.doctor.conflicts) && doctorState.doctor.conflicts.length > 0) {
        sections.push(h('div', {
          className: 'acp_notice acp_noticeWarn',
          key: 'doctorBanner',
          role: 'alert',
          style: { cursor: 'pointer' },
          onClick: () => { if (typeof setDoctorClosedAt === 'function') setDoctorClosedAt(0); },
        }, [
          h('span', { className: 'acp_dot acp_dotWait', key: 'dot' }),
          h('span', { key: 'text' }, t('doctorBanner') + ' (' + String(doctorState.doctor.conflicts.length) + ')'),
        ]));
      }

      if (team !== undefined && team.failure !== undefined && team.failure !== null) {
        sections.push(h('div', { className: 'acp_notice acp_noticeError', key: 'failure', role: 'alert' }, [
          h('span', { className: 'acp_dot acp_dotError', key: 'dot' }),
          h('span', { key: 'text' }, t('failure') + ': ' + String(team.failure)),
        ]));
      }

      if (team === undefined) {
        sections.push(h('div', { className: 'acp_notice', key: 'loading', role: 'status' }, [
          h('span', { className: listing ? 'acp_dot acp_dotWait' : 'acp_dot acp_dotIdle', key: 'dot' }),
          h('span', { key: 'text' }, listing ? t('loading') : t('unavailable')),
        ]));
      } else if (!hasTeam) {
        sections.push(h('div', { className: 'acp_onboard', key: 'onboard' }, [
          h('div', { className: 'acp_onboardIntro', key: 'intro' }, [
            h('div', { className: 'acp_onboardTitle', key: 'title' }, t('emptyTitle')),
            h('p', { className: 'acp_onboardBody', key: 'body' }, t('emptyBody')),
          ]),
          h('div', { className: 'acp_steps', key: 'steps' }, [
            h('div', { className: 'acp_step', key: 'spawn' }, [
              h('span', { className: 'acp_stepNum', key: 'num' }, '1'),
              h('div', { className: 'acp_stepText', key: 'text' }, [
                h('code', { className: 'acp_code acp_stepCode', key: 'code' }, 'spawn_teammate'),
                h('span', { key: 'body' }, t('emptyHowSpawn')),
              ]),
            ]),
            h('div', { className: 'acp_step', key: 'task' }, [
              h('span', { className: 'acp_stepNum', key: 'num' }, '2'),
              h('div', { className: 'acp_stepText', key: 'text' }, [
                h('code', { className: 'acp_code acp_stepCode', key: 'code' }, 'team_task_create'),
                h('span', { key: 'body' }, t('emptyHowTask')),
              ]),
            ]),
            h('div', { className: 'acp_step', key: 'list' }, [
              h('span', { className: 'acp_stepNum', key: 'num' }, '3'),
              h('div', { className: 'acp_stepText', key: 'text' }, [
                h('code', { className: 'acp_code acp_stepCode', key: 'code' }, 'list_agents'),
                h('span', { key: 'body' }, t('emptyHowList')),
              ]),
            ]),
          ]),
          h('div', { className: 'acp_featureRow', key: 'features' }, [
            h('div', { className: 'acp_feature', key: 'cards' }, [
              h('div', { className: 'acp_featureTitle', key: 'title' }, t('featCards')),
              h('div', { className: 'acp_featureDesc', key: 'desc' }, t('featCardsDesc')),
            ]),
            h('div', { className: 'acp_feature', key: 'plan' }, [
              h('div', { className: 'acp_featureTitle', key: 'title' }, t('featPlan')),
              h('div', { className: 'acp_featureDesc', key: 'desc' }, t('featPlanDesc')),
            ]),
            h('div', { className: 'acp_feature', key: 'cost' }, [
              h('div', { className: 'acp_featureTitle', key: 'title' }, t('featCost')),
              h('div', { className: 'acp_featureDesc', key: 'desc' }, t('featCostDesc')),
            ]),
          ]),
          h('p', { className: 'acp_hint', key: 'rule' }, t('emptyRule')),
        ]));
      }

      if (hasTeam) {
        const teamIdle = members.length > 1 && members.every((member) => !isRunningRow(member));
        const allIdle = familyReady ? activeRows.length === 0 : teamIdle;
        if (allIdle) {
          sections.push(h('div', { className: 'acp_notice', key: 'idleNotice', role: 'status' }, [
            h('span', { className: 'acp_dot acp_dotIdle', key: 'dot' }),
            h('span', { key: 'text' }, t('allIdle') + (lastActive > 0 ? ' · ' + t('lastActive') + ' ' + agoLabel(lastActive, t) : '')),
          ]));
        }
        const interrupted = hostStatus && typeof hostStatus.interruptedCount === 'number' ? hostStatus.interruptedCount : 0;
        if (budgetOver.length > 0) {
          sections.push(h('div', { className: 'acp_notice acp_noticeWarn', key: 'budgetNotice', role: 'alert' }, [
            h('span', { className: 'acp_dot acp_dotWait', key: 'dot' }),
            h('span', { key: 'text' }, interrupted > 0
              ? String(interrupted) + ' ' + t('interruptedMembers') + ' · ' + t('budgetHostHint')
              : String(budgetOver.length) + ' ' + t('budgetOver') + ' · ' + t('budgetHostHint')),
          ]));
        }

        sections.push(h(AgentSectionView, {
          key: 'agents',
          t,
          snap: family,
          rows: familyRows,
          members,
          tasks,
          budget,
          archived,
          onArchive: (ids) => {
            if (typeof updateState !== 'function' || !Array.isArray(ids)) return;
            const next = Array.from(new Set([...archived, ...ids.map((id) => String(id))]));
            updateState({ archived: next });
          },
          onRestore: () => {
            if (typeof updateState === 'function') updateState({ archived: [] });
          },
          sessionId,
          openMember: props.openMember,
          useSessions,
          useSessionStatus,
        }));

        sections.push(h(TaskCostSection, { key: 'taskcost', t, snap: taskCost }));

        sections.push(h(PlanSection, { key: 'plan', t, rows: visibleFamilyRows, members, tasks }));

        sections.push(h(EfficiencySection, {
          key: 'cost',
          t,
          phase: family.phase,
          rows: familyRows,
          totals: familyTotals,
          ratio: familyRatio,
          members,
          budget,
        }));

        sections.push(h('section', { className: 'acp_section', key: 'board' }, [
          h('div', { className: 'acp_sectionHead', key: 'head' }, [
            h('span', { key: 'title' }, t('board')),
            h('span', { className: 'acp_count', key: 'count' }, String(tasks.length)),
            critical.length > 1
              ? h('span', { className: 'acp_critical', key: 'critical' }, t('planCritical') + ' ' + String(critical.length))
              : null,
          ]),
          h('div', { className: 'acp_board', key: 'board' }, [
            h(BoardColumn, { key: 'pending', id: 'pending', title: t('pending'), dotClass: 'acp_dot acp_dotIdle', tasks: pendingTasks, t, criticalIds: critical.ids }),
            h(BoardColumn, { key: 'in_progress', id: 'in_progress', title: t('in_progress'), dotClass: 'acp_dot acp_dotWait', tasks: inProgressTasks, t, criticalIds: critical.ids }),
            h(BoardColumn, { key: 'completed', id: 'completed', title: t('completed'), dotClass: 'acp_dot acp_dotRun', tasks: completedTasks, t, criticalIds: critical.ids }),
          ]),
        ]));
      }

      const stats = [];
      const stat = (key, labelKey, value, className) => h('div', {
        className: 'acp_stat' + (className ? ' ' + className : ''),
        key,
      }, [
        h('b', { key: 'value' }, String(value)),
        h('span', { key: 'label' }, t(labelKey)),
      ]);
      if (hasTeam) {
        stats.push(stat('members', 'statMembers', familyReady ? visibleFamilyRows.length : members.length, ''));
        stats.push(stat('active', 'statActive', activeCount, activeCount > 0 ? 'acp_statActive' : ''));
        stats.push(stat('idle', 'statusIdleGroup', idleCount, idleCount > 0 ? 'acp_statIdle' : ''));
        stats.push(stat('tasks', 'statTasks', tasks.length, ''));
      }

      const budgetLabel = budget
        ? t('budget') + ' ' + (budget.steps > 0 ? String(budget.steps) + ' · ' : '') + (budget.output > 0 ? fmtTokens(budget.output) : '')
        : t('budgetSet');

      const headActions = [
        h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'mode',
          title: t('modeHint'),
          'data-sync-mode': mode,
          onClick: () => {
            if (typeof updateState === 'function') {
              const next = mode === 'ask' ? 'auto' : mode === 'auto' ? 'council' : mode === 'council' ? 'off' : 'ask';
              updateState({ mode: next });
            }
          },
        }, [
          h('span', {
            className: mode === 'off'
              ? 'acp_modeDot acp_modeDotOff'
              : mode === 'ask' ? 'acp_modeDot acp_modeDotAsk'
                : mode === 'council' ? 'acp_modeDot acp_modeDotCouncil' : 'acp_modeDot acp_modeDotAuto',
            key: 'dot',
          }),
          h('span', { key: 'label' }, t(mode === 'off' ? 'modeOff' : mode === 'ask' ? 'modeAsk' : mode === 'council' ? 'modeCouncil' : 'modeAuto')),
        ]),
        h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'context',
          title: t('contextTitle'),
          onClick: () => {
            if (typeof document !== 'undefined' && document.getElementById) {
              const node = document.getElementById('acp-context-terrain');
              if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          },
        }, t('tabContext')),
        hasTeam || budget ? h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'budget',
          title: t('budgetHostHint'),
          onClick: () => { if (typeof setEditing === 'function') setEditing(!editing); },
        }, [
          h('span', { key: 'label' }, budgetLabel),
          budget ? h('span', { className: 'acp_actionDot', key: 'dot' }) : null,
        ].filter(Boolean)) : null,
        h('button', {
          type: 'button',
          className: 'acp_action',
          key: 'refresh',
          title: t('refresh'),
          onClick: () => { if (typeof props.refresh === 'function') props.refresh(sessionId); },
        }, t('refresh')),
      ].filter(Boolean);

      return h('div', { className: 'acp_root', 'data-agent-cockpit': true }, [
        h('header', { className: 'acp_head', key: 'head' }, [
          h('div', { className: 'acp_brand', key: 'brand' }, [
            h('span', { className: 'acp_logo', key: 'logo', 'aria-hidden': true }, 'GK'),
            h('div', { className: 'acp_headMain', key: 'main' }, [
              h('div', { className: 'acp_titleRow', key: 'titleRow' }, [
                h('div', { className: 'acp_title', key: 'title' }, t('title')),
                hasTeam ? h('span', {
                  className: 'acp_livePill' + (activeCount > 0 ? ' acp_livePillRun' : ''),
                  key: 'live',
                }, [
                  h('span', { className: activeCount > 0 ? 'acp_liveDot acp_liveDotRun' : 'acp_liveDot', key: 'dot' }),
                  h('span', { key: 'text' }, activeCount > 0 ? t('statusRunning') : t('statusInactive')),
                ]) : null,
              ]),
              h('div', { className: 'acp_sub', key: 'sub' }, t('subtitle')),
            ]),
          ]),
          h('div', { className: 'acp_headRight', key: 'right' }, [
            h('div', { className: 'acp_stats', key: 'stats' }, stats),
            h('div', { className: 'acp_actions', key: 'actions' }, headActions),
          ]),
        ]),
        editing
          ? h(BudgetEditor, {
            key: 'budgetEditor',
            t,
            budget,
            onSave: (next) => {
              if (typeof updateState === 'function') updateState({ budget: next });
              setEditing(false);
            },
            onClear: () => {
              if (typeof updateState === 'function') updateState({ budget: null });
              setEditing(false);
            },
            onClose: () => { setEditing(false); },
          })
          : null,
        h('div', { className: 'acp_body', key: 'body' }, sections),
        h('div', { className: 'acp_foot', key: 'foot' }, [
          h('span', { key: 'footer' }, t('footer')),
          h('span', { key: 'version' }, t('versionNote')),
        ]),
        doctorShouldShow && doctor
          ? h(ConflictModal, {
            key: 'doctor',
            t,
            doctor,
            result: doctorState.result,
            busy: doctorState.busy,
            onAction: doctorState.act,
            onClose: () => { if (typeof setDoctorClosedAt === 'function') setDoctorClosedAt(Date.now()); },
            openSession: props.openSession,
          })
          : null,
      ]);
    }

    /* ── 共享格式化 helpers（时间与百分比） ─────────────────────────────── */

    function pctOf(part, total) {
      if (!(total > 0)) return 0;
      const ratio = (Number(part) || 0) / total * 100;
      return Math.max(0, Math.min(100, Math.round(ratio * 10) / 10));
    }

    function agoLabel(time, t) {
      if (typeof time !== 'number' || !Number.isFinite(time)) return '';
      const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
      if (minutes < 1) return t('agoNow');
      if (minutes < 60) return minutes + ' ' + t('agoMinutes');
      const hours = Math.round(minutes / 60);
      if (hours < 24) return hours + ' ' + t('agoHours');
      return Math.round(hours / 24) + ' ' + t('agoDays');
    }

    /* ── plugin mount ───────────────────────────────────────────────────── */

    const inject = ['sessions', 'uiWorkspace', 'slots', 'locale'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'agent-cockpit: dictionaries');
      ctx.effect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-plugin', 'dsh-agent-cockpit');
        style.setAttribute('data-plugin-css', 'agent-cockpit');
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => { style.remove(); };
      }, 'agent-cockpit: styles');

      const sessions = ctx.sessions;
      const leadSessionIdOf = (sessionId) => {
        try {
          const binding = sessions.binding(sessionId);
          const handle = binding ? binding.session : undefined;
          const snapshot = handle && typeof handle.getSnapshot === 'function' ? handle.getSnapshot() : undefined;
          const subagent = snapshot ? snapshot.subagent : undefined;
          const address = subagent ? subagent.address : undefined;
          return address && address.parentSessionId ? address.parentSessionId : sessionId;
        } catch (err) {
          return sessionId;
        }
      };

      const actions = {
        openMember(sessionId, memberSessionId) {
          try {
            const parentSessionId = leadSessionIdOf(sessionId);
            if (memberSessionId === parentSessionId) {
              ctx.uiWorkspace.openSession(parentSessionId);
              return;
            }
            ctx.uiWorkspace.openSession({ parentSessionId, childSessionId: memberSessionId, mode: 'continuable' });
          } catch (err) {
            /* Navigation is best-effort: the card stays inert when the target cannot be opened. */
          }
        },
        refresh(sessionId) {
          try {
            sessions.refreshProjections(leadSessionIdOf(sessionId));
          } catch (err) {
            /* Projection refresh is best-effort. */
          }
        },
        openSession(targetSessionId) {
          try {
            if (typeof targetSessionId === 'string' && targetSessionId.length > 0) {
              ctx.uiWorkspace.openSession(targetSessionId);
            }
          } catch (err) {
            /* Navigation is best-effort. */
          }
        },
      };

      const readLabel = (key) => {
        try {
          const bound = ctx.locale.bind(NS);
          if (typeof bound === 'function') return bound(key);
          if (bound !== null && bound !== undefined && typeof bound.t === 'function') return bound.t(key);
        } catch (err) {
          /* Fall through to a locale-independent label. */
        }
        try {
          const active = String(ctx.locale.getLocale() || '').toLowerCase();
          if (active.indexOf('zh') === 0 && typeof zh[key] === 'string') return zh[key];
        } catch (err) {
          /* Fall through to the English label. */
        }
        return typeof en[key] === 'string' ? en[key] : key;
      };

      const readViewLabel = () => readLabel('viewLabel');

      ctx.slots.inject('conversation.view', () => ctx.slots.register({
        name: 'conversation.view',
        id: VIEW_ID,
        order: 26,
        locale: NS,
        inject: () => actions,
        label: readViewLabel,
      }, Cockpit));

      // 上下文 / 编队 / 上下文洞察 三个视图由内置的 dsh-context-core 引擎提供
      // （原 dsh-context v0.79.0，Apache-2.0），这里不再重复注册，避免同 id 抢占。
      ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: BADGE_ID,
        order: 32,
        locale: NS,
        inject: () => actions,
      }, CockpitBadge));

    }

    return {
      inject,
      apply,
    };
  },
});
