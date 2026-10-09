(function() {
var NS = "__BW_PROTO_ANNOTATOR__";
if (window[NS]) {
  window[NS].toggle();
  return;
}

var STORE_KEY = "bw-proto-annotations::" + location.origin + location.pathname;
var STYLE_ID = "__bw_proto_annotator_style__";
var UI_ATTR = "data-bw-pa-ui";
var annos = loadAnnos();
var seq = annos.reduce(function(max, item) { return Math.max(max, item.id || 0); }, 0);
var enabled = false;
var pickChord = false;
var hoverTarget = null;
var dialog = null;
var activeCancel = null;
var toastTimer = null;
var taffyNode = null;
var previewing = false;
var previewBar = null;
var specViewer = null;
var IS_MAC = /Mac|iPhone|iPad|iPod/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "");
var PICK_LABEL = IS_MAC ? "Command Shift" : "Ctrl Alt";

var PROPS = [
  { key: "fontSize", css: "font-size", label: "字号" },
  { key: "fontWeight", css: "font-weight", label: "字重" },
  { key: "color", css: "color", label: "文字色" },
  { key: "backgroundColor", css: "background-color", label: "背景色" },
  { key: "borderRadius", css: "border-radius", label: "圆角" },
  { key: "width", css: "width", label: "宽度" },
  { key: "height", css: "height", label: "高度" }
];

var css = ""
  + ".bw-pa-root,.bw-pa-panel,.bw-pa-dialog,.bw-pa-toast,.bw-pa-badge,.bw-pa-box,.bw-pa-preview-bar,.bw-pa-spec-viewer{--ink:#171717;--paper:#fff;--soft:#f2f2ef;--muted:#6b6b6b;--line:#d8d8d3;--accent:#5368ff;--acid:#c8ff48;--mono:ui-monospace,'SF Mono','Cascadia Code',Consolas,monospace;--sans:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;box-sizing:border-box;font-family:var(--sans);letter-spacing:0;}"
  + ".bw-pa-root *,.bw-pa-dialog *,.bw-pa-preview-bar *,.bw-pa-spec-viewer *{box-sizing:border-box;letter-spacing:0;}"
  + ".bw-pa-pick *{cursor:crosshair !important;}"
  + ".bw-pa-hover{outline:2px solid var(--accent) !important;outline-offset:3px !important;}"
  + ".bw-pa-box{position:absolute;z-index:2147483639;pointer-events:none;border:2px solid var(--accent);border-radius:2px;background:rgba(83,104,255,.07);}"
  + ".bw-pa-box.hot{background:rgba(200,255,72,.2);}"
  + ".bw-pa-box.flash{animation:bwPaBoxFlash .85s ease;}"
  + "@keyframes bwPaBoxFlash{0%{box-shadow:0 0 0 8px rgba(83,104,255,.24);}100%{box-shadow:none;}}"
  + ".bw-pa-badge{position:absolute;z-index:2147483641;min-width:24px;height:24px;padding:0 6px;display:grid;place-items:center;transform:translate(-50%,-50%);border:1px solid var(--ink);border-radius:50%;background:var(--paper);color:var(--ink);font:750 10px/1 var(--mono);cursor:pointer;pointer-events:auto;box-shadow:0 5px 14px rgba(0,0,0,.16);transition:transform .35s cubic-bezier(.16,1.45,.32,1),background .16s,color .16s;}"
  + ".bw-pa-badge:hover,.bw-pa-badge.hot{background:var(--ink);color:var(--paper);transform:translate(-50%,-50%) scale(1.12);}"
  + ".bw-pa-spec-badge{min-width:31px;border-radius:6px;background:var(--ink);color:var(--paper);font-size:11px;box-shadow:0 6px 18px rgba(0,0,0,.24);}"
  + ".bw-pa-spec-badge:hover{background:var(--accent);border-color:var(--accent);}"
  + ".bw-pa-root{position:fixed;z-index:2147483645;top:48px;right:18px;width:390px;max-width:calc(100vw - 24px);color:var(--ink);filter:none;}"
  + ".bw-pa-bar{display:flex;align-items:center;gap:9px;min-height:50px;border:1px solid rgba(23,23,23,.16);border-radius:8px;background:rgba(255,255,255,.96);box-shadow:0 15px 42px rgba(0,0,0,.16);padding:8px 9px 8px 12px;user-select:none;cursor:grab;backdrop-filter:blur(16px);transition:transform .5s cubic-bezier(.16,1.45,.32,1),background .2s,color .2s,box-shadow .2s;}"
  + ".bw-pa-bar:active{cursor:grabbing;}"
  + ".bw-pa-logo{font:700 10px/1.25 var(--mono);white-space:nowrap;}"
  + ".bw-pa-count{display:grid;place-items:center;min-width:23px;height:23px;border:1px solid var(--line);border-radius:50%;background:var(--paper);color:var(--ink);font:700 10px/1 var(--mono);}"
  + ".bw-pa-spacer{flex:1;}"
  + ".bw-pa-state{min-width:24px;text-align:center;color:var(--muted);font:700 9px/1 var(--mono);}"
  + ".bw-pa-switch{position:relative;flex:0 0 auto;width:40px;height:24px;border:1px solid var(--line);border-radius:999px;background:var(--soft);transition:background .2s,border-color .2s;}"
  + ".bw-pa-switch:after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--paper);box-shadow:0 1px 4px rgba(0,0,0,.2);transition:transform .42s cubic-bezier(.16,1.45,.32,1),background .2s;}"
  + ".bw-pa-bar.on{background:var(--ink);color:var(--paper);}"
  + ".bw-pa-bar.on .bw-pa-count{border-color:#494949;background:#292929;color:var(--paper);}"
  + ".bw-pa-bar.on .bw-pa-state{color:var(--acid);}"
  + ".bw-pa-bar.on .bw-pa-switch{border-color:var(--accent);background:var(--accent);}"
  + ".bw-pa-bar.on .bw-pa-switch:after{transform:translateX(16px);background:var(--paper);}"
  + ".bw-pa-panel{display:none;margin-top:8px;border:1px solid rgba(23,23,23,.14);border-radius:8px;background:rgba(255,255,255,.98);box-shadow:0 18px 50px rgba(0,0,0,.16);max-height:min(66vh,560px);overflow:hidden;backdrop-filter:blur(16px);transform-origin:top right;}"
  + ".bw-pa-panel.show{display:flex;flex-direction:column;animation:bwPaPanelIn .5s cubic-bezier(.16,1.34,.32,1);}"
  + "@keyframes bwPaPanelIn{0%{opacity:0;transform:translateY(-8px) scale(.96,.82);}60%{opacity:1;transform:translateY(1px) scale(1.01,1.02);}100%{transform:none;}}"
  + ".bw-pa-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-bottom:1px solid var(--line);background:var(--paper);font:700 11px/1 var(--mono);cursor:move;}"
  + ".bw-pa-mini-hint{color:var(--muted);font-weight:500;}"
  + ".bw-pa-list{overflow:auto;min-height:44px;}"
  + ".bw-pa-empty{padding:28px 14px;color:var(--muted);font-size:13px;line-height:1.65;}"
  + ".bw-pa-item{display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:start;padding:13px 14px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .16s;}"
  + ".bw-pa-item:hover{background:var(--soft);}"
  + ".bw-pa-no{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--ink);color:var(--paper);font:700 10px/1 var(--mono);}"
  + ".bw-pa-copy{font-size:12px;font-weight:650;line-height:1.5;word-break:break-word;}"
  + ".bw-pa-meta{display:block;margin-top:5px;color:var(--muted);font:10px/1.45 var(--mono);}"
  + ".bw-pa-actions{display:flex;gap:4px;}"
  + ".bw-pa-icon{display:grid;place-items:center;width:27px;height:27px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);font:700 13px/1 var(--mono);cursor:pointer;}"
  + ".bw-pa-icon:hover{border-color:var(--ink);background:var(--ink);color:var(--paper);}"
  + ".bw-pa-foot{display:flex;gap:8px;padding:11px 14px;border-top:1px solid var(--line);background:var(--soft);}"
  + ".bw-pa-btn{min-height:38px;border:1px solid var(--ink);border-radius:7px;background:var(--ink);color:var(--paper);padding:0 13px;font:650 12px/1 var(--sans);cursor:pointer;}"
  + ".bw-pa-btn.light{border-color:var(--line);background:var(--paper);color:var(--ink);}"
  + ".bw-pa-export-review{flex:0 0 38px;width:38px;padding:0;font-size:18px;}"
  + ".bw-pa-btn:disabled{opacity:.45;cursor:not-allowed;}"
  + ".bw-pa-dialog{position:fixed;z-index:2147483646;width:380px;max-width:calc(100vw - 18px);border:1px solid rgba(23,23,23,.18);border-radius:8px;background:var(--paper);box-shadow:0 22px 70px rgba(0,0,0,.22);color:var(--ink);overflow:hidden;animation:bwPaDialogIn .5s cubic-bezier(.16,1.34,.32,1);}"
  + "@keyframes bwPaDialogIn{0%{opacity:0;transform:translateY(8px) scale(.94,.88);}65%{opacity:1;transform:translateY(-1px) scale(1.01,1.015);}100%{transform:none;}}"
  + ".bw-pa-dhead{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);background:var(--paper);cursor:move;user-select:none;}"
  + ".bw-pa-dnum{display:grid;place-items:center;min-width:27px;height:27px;border-radius:50%;background:var(--ink);color:var(--paper);font:700 10px/1 var(--mono);}"
  + ".bw-pa-dtitle{font:700 13px/1.2 var(--sans);flex:1;}"
  + ".bw-pa-close{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);cursor:pointer;font:700 14px/1 var(--mono);}"
  + ".bw-pa-close:hover{background:var(--ink);color:var(--paper);}"
  + ".bw-pa-dbody{padding:14px;max-height:min(74vh,610px);overflow:auto;}"
  + ".bw-pa-target{border-left:3px solid var(--accent);padding-left:10px;color:var(--muted);font-size:12px;line-height:1.6;word-break:break-word;}"
  + ".bw-pa-mode{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:14px 0;padding:3px;border-radius:8px;background:var(--soft);}"
  + ".bw-pa-mode button{min-height:36px;border:0;border-radius:6px;background:transparent;color:var(--ink);font:650 12px/1 var(--sans);cursor:pointer;}"
  + ".bw-pa-mode button.act{background:var(--paper);color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.1);}"
  + ".bw-pa-sec{border:1px solid var(--line);border-radius:8px;margin-top:10px;overflow:hidden;}"
  + ".bw-pa-sec h4{margin:0;padding:10px;border-bottom:1px solid var(--line);background:var(--soft);font:700 10px/1 var(--mono);}"
  + ".bw-pa-field{display:grid;grid-template-columns:86px 1fr;gap:10px;align-items:center;padding:9px 10px;border-bottom:1px solid var(--line);}"
  + ".bw-pa-field:last-child{border-bottom:0;}"
  + ".bw-pa-field label{font:650 12px/1 var(--sans);}"
  + ".bw-pa-field input,.bw-pa-field select,.bw-pa-field textarea{width:100%;border:1px solid var(--line);border-radius:5px;background:var(--paper);color:var(--ink);min-height:34px;padding:6px 8px;font:12px/1.4 var(--mono);box-sizing:border-box;outline:none;}"
  + ".bw-pa-field input:focus,.bw-pa-field select:focus,.bw-pa-field textarea:focus,.bw-pa-note:focus,.bw-pa-rich-editor:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(83,104,255,.13);}"
  + ".bw-pa-field textarea{min-height:62px;resize:vertical;font-family:var(--sans);}"
  + ".bw-pa-two{display:grid;grid-template-columns:74px 1fr;gap:6px;align-items:center;}"
  + ".bw-pa-color{display:grid;grid-template-columns:42px 1fr 38px;gap:6px;align-items:center;}"
  + ".bw-pa-none{display:grid;place-items:center;height:34px;border:1px solid var(--line);border-radius:5px;font:650 11px/1 var(--sans);cursor:pointer;}"
  + ".bw-pa-none.act{background:var(--ink);color:var(--paper);}"
  + ".bw-pa-preview{margin-top:10px;padding:11px;border:1px solid var(--line);border-radius:7px;background:var(--soft);font-size:12px;line-height:1.6;}"
  + ".bw-pa-preview b{display:block;margin-bottom:5px;font:700 10px/1 var(--mono);}"
  + ".bw-pa-note{width:100%;min-height:104px;border:1px solid var(--line);border-radius:7px;padding:10px;font:13px/1.6 var(--sans);resize:vertical;box-sizing:border-box;outline:none;}"
  + ".bw-pa-spec-wrap .bw-pa-field{grid-template-columns:72px 1fr;align-items:start;}"
  + ".bw-pa-spec-wrap .bw-pa-field-rich{display:block;padding:0;}"
  + ".bw-pa-rich-toolbar{display:flex;align-items:center;gap:3px;padding:6px;border-bottom:1px solid var(--line);background:var(--soft);overflow-x:auto;}"
  + ".bw-pa-rich-format{flex:0 0 72px;width:72px;min-height:30px;border:1px solid var(--line);border-radius:5px;background:var(--paper);color:var(--ink);padding:0 6px;font:11px/1 var(--sans);outline:none;}"
  + ".bw-pa-rich-sep{flex:0 0 1px;width:1px;height:20px;margin:0 2px;background:var(--line);}"
  + ".bw-pa-rich-btn{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--ink);padding:0;font:700 12px/1 var(--mono);cursor:pointer;}"
  + ".bw-pa-rich-btn:hover,.bw-pa-rich-btn:focus{border-color:var(--line);background:var(--paper);outline:none;}"
  + ".bw-pa-rich-editor{min-height:146px;max-height:280px;overflow:auto;padding:11px 12px;border:0;background:var(--paper);color:var(--ink);font:13px/1.7 var(--sans);outline:none;word-break:break-word;}"
  + ".bw-pa-rich-editor:empty:before{content:attr(data-placeholder);color:var(--muted);pointer-events:none;}"
  + ".bw-pa-rich-editor p{margin:0 0 8px;}.bw-pa-rich-editor p:last-child{margin-bottom:0;}"
  + ".bw-pa-rich-editor h2,.bw-pa-rich-editor h3{margin:10px 0 6px;line-height:1.4;}.bw-pa-rich-editor h2{font-size:18px;}.bw-pa-rich-editor h3{font-size:15px;}"
  + ".bw-pa-rich-editor ul,.bw-pa-rich-editor ol{margin:6px 0;padding-left:22px;}.bw-pa-rich-editor ol[type='a']{list-style-type:lower-alpha;}.bw-pa-rich-editor ol[type='i']{list-style-type:lower-roman;}"
  + ".bw-pa-rich-editor blockquote{margin:8px 0;padding-left:10px;border-left:3px solid var(--line);color:var(--muted);}"
  + ".bw-pa-rich-editor code{border-radius:3px;background:var(--soft);padding:1px 4px;font-family:var(--mono);}"
  + ".bw-pa-hint{margin:10px 0 0;color:var(--muted);font:11px/1.5 var(--mono);}"
  + ".bw-pa-dfoot{display:flex;gap:8px;margin-top:12px;}"
  + ".bw-pa-dfoot .bw-pa-btn{flex:1;}"
  + ".bw-pa-toast{position:fixed;z-index:2147483647;left:50%;bottom:22px;transform:translate(-50%,16px) scale(.96);opacity:0;transition:opacity .2s,transform .5s cubic-bezier(.16,1.45,.32,1);border:1px solid rgba(255,255,255,.18);border-radius:8px;background:var(--ink);box-shadow:0 14px 40px rgba(0,0,0,.22);padding:11px 14px;max-width:min(440px,calc(100vw - 24px));color:var(--paper);font:650 13px/1.4 var(--sans);pointer-events:none;}"
  + ".bw-pa-toast.show{opacity:1;transform:translate(-50%,0);}"
  + ".bw-pa-preview-bar{position:fixed;z-index:2147483645;top:18px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;min-height:46px;padding:6px 7px 6px 14px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:var(--ink);color:var(--paper);box-shadow:0 14px 42px rgba(0,0,0,.24);font:700 11px/1.2 var(--mono);white-space:nowrap;}"
  + ".bw-pa-preview-bar .bw-pa-btn{min-height:32px;border-color:rgba(255,255,255,.28);background:var(--paper);color:var(--ink);padding:0 11px;}"
  + ".bw-pa-spec-viewer{position:fixed;z-index:2147483646;top:76px;right:18px;width:360px;max-width:calc(100vw - 24px);border:1px solid rgba(23,23,23,.18);border-radius:8px;background:var(--paper);color:var(--ink);box-shadow:0 22px 70px rgba(0,0,0,.22);overflow:hidden;animation:bwPaDialogIn .42s cubic-bezier(.16,1.34,.32,1);}"
  + ".bw-pa-spec-viewer .bw-pa-dhead{cursor:default;}"
  + ".bw-pa-spec-body{padding:16px;}"
  + ".bw-pa-spec-title{margin:0 0 10px;font:750 17px/1.35 var(--sans);word-break:break-word;}"
  + ".bw-pa-spec-copy{margin:0;color:var(--ink);font:13px/1.75 var(--sans);word-break:break-word;}"
  + ".bw-pa-spec-copy p{margin:0 0 8px;}.bw-pa-spec-copy p:last-child{margin-bottom:0;}"
  + ".bw-pa-spec-copy h2,.bw-pa-spec-copy h3{margin:12px 0 6px;line-height:1.4;}.bw-pa-spec-copy h2{font-size:18px;}.bw-pa-spec-copy h3{font-size:15px;}"
  + ".bw-pa-spec-copy ul,.bw-pa-spec-copy ol{margin:7px 0;padding-left:22px;}.bw-pa-spec-copy ol[type='a']{list-style-type:lower-alpha;}.bw-pa-spec-copy ol[type='i']{list-style-type:lower-roman;}"
  + ".bw-pa-spec-copy blockquote{margin:8px 0;padding-left:10px;border-left:3px solid var(--line);color:var(--muted);}"
  + ".bw-pa-spec-copy code{border-radius:3px;background:var(--soft);padding:1px 4px;font-family:var(--mono);}"
  + ".bw-pa-spec-target{margin-top:15px;padding-top:12px;border-top:1px solid var(--line);color:var(--muted);font:10px/1.55 var(--mono);word-break:break-word;}"
  + ".bw-pa-taffy{--tail-x:0px;--tail-y:0px;transition:transform .52s cubic-bezier(.16,1.45,.32,1),box-shadow .2s;will-change:transform;}"
  + ".bw-pa-taffy.bw-pa-pulling{transition:transform .08s linear;box-shadow:var(--tail-x) var(--tail-y) 0 -9px var(--accent);}"
  + ".bw-pa-taffy.bw-pa-release{animation:bwPaSplat .56s cubic-bezier(.16,1.45,.32,1);}"
  + "@keyframes bwPaSplat{0%{transform:scale(.94,1.06);}48%{transform:scale(1.045,.965);}100%{transform:none;}}"
  + "@media(max-width:520px){.bw-pa-root{top:12px;right:12px;width:calc(100vw - 24px);}.bw-pa-logo{font-size:9px;max-width:48vw;overflow:hidden;text-overflow:ellipsis;}.bw-pa-dialog{left:9px !important;width:calc(100vw - 18px);}.bw-pa-field,.bw-pa-spec-wrap .bw-pa-field{grid-template-columns:1fr;gap:6px;}.bw-pa-mode button{font-size:11px;}.bw-pa-preview-bar{top:10px;max-width:calc(100vw - 20px);}.bw-pa-spec-viewer{top:auto;right:10px;bottom:10px;width:calc(100vw - 20px);max-height:calc(100vh - 76px);overflow:auto;}}"
  + "@media(prefers-reduced-motion:reduce){.bw-pa-root *,.bw-pa-dialog *,.bw-pa-toast,.bw-pa-preview-bar *,.bw-pa-spec-viewer *{animation-duration:.01ms !important;transition-duration:.01ms !important;}}";

injectStyle();

var root = mark(document.createElement("div"));
root.className = "bw-pa-root";
root.innerHTML = ""
  + "<div class=\"bw-pa-bar\"><span class=\"bw-pa-logo\">Dsign</span><span class=\"bw-pa-count\">0</span><span class=\"bw-pa-spacer\"></span><span class=\"bw-pa-state\">OFF</span><span class=\"bw-pa-switch\"></span></div>"
  + "<div class=\"bw-pa-panel\"><div class=\"bw-pa-panel-head\"><span>标注清单</span><span class=\"bw-pa-mini-hint\">" + PICK_LABEL + " 点选</span></div><div class=\"bw-pa-list\"></div><div class=\"bw-pa-foot\"><button class=\"bw-pa-btn bw-pa-copy\">复制给 AI</button><button class=\"bw-pa-btn light bw-pa-preview-mode\">预览</button><button class=\"bw-pa-btn light bw-pa-export-review\" title=\"导出评审版 HTML\" aria-label=\"导出评审版 HTML\">↓</button><button class=\"bw-pa-btn light bw-pa-clear\">清空</button></div></div>";
document.body.appendChild(root);
document.addEventListener("pointerdown", liquidDown, true);
document.addEventListener("pointermove", liquidMove, true);
document.addEventListener("pointerup", liquidRelease, true);
document.addEventListener("pointercancel", liquidRelease, true);
document.addEventListener("click", liquidClickGuard, true);

var bar = root.querySelector(".bw-pa-bar");
var panel = root.querySelector(".bw-pa-panel");
var list = root.querySelector(".bw-pa-list");
drag(bar, root);
drag(root.querySelector(".bw-pa-panel-head"), root);

bar.addEventListener("click", function() {
  if (root._dragging) return;
  toggle();
});

root.querySelector(".bw-pa-copy").addEventListener("click", function(event) {
  event.stopPropagation();
  copyOut();
});

root.querySelector(".bw-pa-preview-mode").addEventListener("click", function(event) {
  event.stopPropagation();
  enterPreview();
});

root.querySelector(".bw-pa-export-review").addEventListener("click", function(event) {
  event.stopPropagation();
  exportReviewHtml();
});

root.querySelector(".bw-pa-clear").addEventListener("click", function(event) {
  event.stopPropagation();
  if (!annos.length) return;
  if (confirm("清空当前页面的全部标注？")) {
    annos.forEach(restoreStored);
    annos = [];
    seq = 0;
    persist();
    applyAll();
    renderAll();
  }
});

list.addEventListener("click", function(event) {
  var action = event.target.closest("[data-action]");
  var item = event.target.closest("[data-id]");
  if (!item) return;
  var id = Number(item.getAttribute("data-id"));
  if (action) {
    event.stopPropagation();
    var name = action.getAttribute("data-action");
    if (name === "edit") editAnno(id);
    if (name === "delete") deleteAnno(id);
    return;
  }
  focusAnno(id);
});

list.addEventListener("mouseover", function(event) {
  var item = event.target.closest("[data-id]");
  if (item) hotAnno(Number(item.getAttribute("data-id")), true);
});

list.addEventListener("mouseout", function(event) {
  var item = event.target.closest("[data-id]");
  if (item) hotAnno(Number(item.getAttribute("data-id")), false);
});

document.addEventListener("click", function(event) {
  if (!enabled || previewing || dialog || !isPickEvent(event)) return;
  var target = findPickTarget(event);
  if (!target) return;
  block(event);
  clearHover();
  openPicker(target, event.clientX + 14, event.clientY + 14);
}, true);

document.addEventListener("mousemove", function(event) {
  hoverTarget = findPickTarget(event);
  if (!enabled || previewing || dialog || !pickChord) return;
  clearHover();
  if (hoverTarget) hoverTarget.classList.add("bw-pa-hover");
}, true);

window.addEventListener("keydown", function(event) {
  if (previewing) {
    if (event.key === "Escape") {
      block(event);
      if (specViewer) closeSpecViewer();
      else exitPreview();
    }
    return;
  }
  if (!enabled || dialog) return;
  if (isPickEvent(event)) {
    pickChord = true;
    document.body.classList.add("bw-pa-pick");
    if (hoverTarget) hoverTarget.classList.add("bw-pa-hover");
  }
}, true);

window.addEventListener("keyup", function(event) {
  if (isPickModifier(event.key)) {
    pickChord = false;
    document.body.classList.remove("bw-pa-pick");
    clearHover();
  }
}, true);

window.addEventListener("blur", function() {
  pickChord = false;
  clearHover();
});

window.addEventListener("scroll", renderMarks, true);
window.addEventListener("resize", function() {
  renderMarks();
  clamp(root);
  if (dialog) clamp(dialog);
});

function toggle() {
  setEnabled(!enabled);
}

function setEnabled(value) {
  if (!value && previewing) exitPreview();
  enabled = value;
  bar.classList.toggle("on", enabled);
  root.querySelector(".bw-pa-state").textContent = enabled ? "ON" : "OFF";
  panel.classList.toggle("show", enabled);
  document.body.classList.toggle("bw-pa-pick", enabled && pickChord);
  if (!enabled) {
    closeDialog(true);
    clearHover();
  }
  renderAll();
  toast(enabled ? "标注模式已开启：" + PICK_LABEL + " 点击元素" : "标注模式已关闭");
}

function enterPreview() {
  if (previewing) return;
  closeDialog(true);
  previewing = true;
  pickChord = false;
  clearHover();
  document.body.classList.remove("bw-pa-pick");
  root.style.display = "none";
  previewBar = mark(document.createElement("div"));
  previewBar.className = "bw-pa-preview-bar";
  var specCount = annos.filter(function(anno) { return anno.mode === "spec"; }).length;
  previewBar.innerHTML = "<span>Dsign 预览 · " + specCount + " 条设计说明</span><button type=\"button\" class=\"bw-pa-btn\">退出预览</button>";
  previewBar.querySelector("button").addEventListener("click", function(event) {
    block(event);
    exitPreview();
  });
  document.body.appendChild(previewBar);
  renderMarks();
}

function exitPreview() {
  if (!previewing) return;
  previewing = false;
  closeSpecViewer();
  if (previewBar) previewBar.remove();
  previewBar = null;
  root.style.display = "";
  panel.classList.toggle("show", enabled);
  renderAll();
}

function openSpecViewer(anno, displayIndex) {
  closeSpecViewer();
  specViewer = mark(document.createElement("div"));
  specViewer.className = "bw-pa-spec-viewer";
  specViewer.innerHTML = ""
    + "<div class=\"bw-pa-dhead\"><span class=\"bw-pa-dnum\">D" + displayIndex + "</span><span class=\"bw-pa-dtitle\">设计说明</span><button type=\"button\" class=\"bw-pa-close\" title=\"关闭\">×</button></div>"
    + "<div class=\"bw-pa-spec-body\"><h3 class=\"bw-pa-spec-title\">" + esc(anno.specTitle || "未命名说明") + "</h3><div class=\"bw-pa-spec-copy\">" + specHtmlOf(anno) + "</div><div class=\"bw-pa-spec-target\">" + esc((anno.type ? anno.type.label + " <" + anno.type.tag + ">" : "元素") + " · “" + (anno.summary || "") + "”") + "</div></div>";
  specViewer.querySelector(".bw-pa-close").addEventListener("click", function(event) {
    block(event);
    closeSpecViewer();
  });
  document.body.appendChild(specViewer);
}

function closeSpecViewer() {
  if (specViewer) specViewer.remove();
  specViewer = null;
}

function openPicker(el, left, top) {
  openEditor({
    el: el,
    id: seq + 1,
    title: "新增标注",
    left: left,
    top: top,
    onSave: function(data) {
      var hasValue = data.mode === "note" ? !!data.note : data.mode === "spec" ? !!data.specTitle && !!data.specBody : hasChanged(data.base, data.now);
      if (!hasValue) {
        if (data.mode === "tweak") restoreElement(el, data.inlineBase, data.base);
        return;
      }
      seq += 1;
      annos.push({
        id: seq,
        selector: selectorOf(el),
        context: contextOf(el),
        summary: summaryOf(el),
        type: typeOf(el),
        mode: data.mode,
        note: data.note,
        specTitle: data.specTitle,
        specBody: data.specBody,
        specBodyHtml: data.specBodyHtml,
        base: data.base,
        now: data.now,
        inlineBase: data.inlineBase
      });
      persist();
      applyAll();
      renderAll();
    }
  });
}

function editAnno(id) {
  var anno = findAnno(id);
  if (!anno) return;
  var el = resolveAnno(anno);
  openEditor({
    el: el,
    anno: anno,
    id: anno.id,
    title: "编辑标注",
    left: Math.max(8, window.innerWidth / 2 - 180),
    top: Math.max(8, window.innerHeight / 2 - 260),
    onSave: function(data) {
      var hasValue = data.mode === "note" ? !!data.note : data.mode === "spec" ? !!data.specTitle && !!data.specBody : hasChanged(data.base, data.now);
      if (!hasValue) {
        restoreStored(anno);
        annos = annos.filter(function(item) { return item.id !== id; });
      } else {
        anno.mode = data.mode;
        anno.note = data.note;
        anno.specTitle = data.specTitle;
        anno.specBody = data.specBody;
        anno.specBodyHtml = data.specBodyHtml;
        anno.base = data.base;
        anno.now = data.now;
        anno.inlineBase = data.inlineBase;
        anno.type = el ? typeOf(el) : anno.type;
        anno.summary = el ? summaryOf(el) : anno.summary;
        anno.context = el ? contextOf(el) : anno.context;
      }
      persist();
      applyAll();
      renderAll();
    }
  });
}

function richToolbarHtml() {
  return "<select class=\"bw-pa-rich-format\" title=\"段落格式\" aria-label=\"段落格式\"><option value=\"p\">正文</option><option value=\"h2\">标题 2</option><option value=\"h3\">标题 3</option></select>"
    + "<span class=\"bw-pa-rich-sep\"></span>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"bold\" title=\"粗体 (Command/Ctrl+B)\"><strong>B</strong></button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"italic\" title=\"斜体 (Command/Ctrl+I)\"><em>I</em></button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"strikeThrough\" title=\"删除线 (Command/Ctrl+Shift+X)\"><s>S</s></button>"
    + "<span class=\"bw-pa-rich-sep\"></span>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"insertUnorderedList\" title=\"无序列表 (Command/Ctrl+Shift+8)\">•</button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"insertOrderedList\" title=\"数字列表 (Command/Ctrl+Shift+7)\">1.</button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"alphaList\" title=\"字母列表\">a.</button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"blockquote\" title=\"引用\">›</button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"createLink\" title=\"链接\">↗</button>"
    + "<span class=\"bw-pa-rich-sep\"></span>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"undo\" title=\"撤销 (Command/Ctrl+Z)\">↶</button>"
    + "<button type=\"button\" class=\"bw-pa-rich-btn\" data-rich-command=\"redo\" title=\"重做 (Command/Ctrl+Shift+Z)\">↷</button>";
}

function selectionElement(editor) {
  var selection = window.getSelection();
  var node = selection && selection.anchorNode;
  if (!node || !editor.contains(node)) return null;
  return node.nodeType === 3 ? node.parentNode : node;
}

function activeListItem(editor) {
  var node = selectionElement(editor);
  var item = node && node.closest ? node.closest("li") : null;
  return item && editor.contains(item) ? item : null;
}

function orderedRoot(list, editor) {
  var rootList = list;
  var parent = list && list.parentElement;
  while (parent && parent !== editor) {
    if (parent.tagName === "OL") rootList = parent;
    parent = parent.parentElement;
  }
  return rootList;
}

function orderedDepth(list, editor) {
  var depth = 0;
  var parent = list && list.parentElement;
  while (parent && parent !== editor) {
    if (parent.tagName === "OL") depth += 1;
    parent = parent.parentElement;
  }
  return depth;
}

function orderedStyle(list) {
  var style = String(list && (list.getAttribute("data-ak47-list-root") || list.getAttribute("type")) || "").toLowerCase();
  return style === "a" || style === "alpha" ? "alpha" : style === "i" || style === "roman" ? "roman" : "decimal";
}

function applyOrderedType(list, style) {
  if (style === "alpha") list.setAttribute("type", "a");
  else if (style === "roman") list.setAttribute("type", "i");
  else list.removeAttribute("type");
}

function normalizeListStyles(editor) {
  Array.prototype.forEach.call(editor.querySelectorAll("ol"), function(list) {
    var rootList = orderedRoot(list, editor);
    var base = orderedStyle(rootList);
    var styles = ["decimal", "alpha", "roman"];
    var baseIndex = styles.indexOf(base);
    var style = styles[(baseIndex + orderedDepth(list, editor)) % styles.length];
    if (list === rootList) list.setAttribute("data-ak47-list-root", base);
    else list.removeAttribute("data-ak47-list-root");
    applyOrderedType(list, style);
  });
}

function setOrderedRootStyle(list, editor, style) {
  if (!list) return;
  var rootList = orderedRoot(list, editor);
  rootList.setAttribute("data-ak47-list-root", style);
  normalizeListStyles(editor);
}

function placeCaret(node) {
  var selection = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function indentListItem(editor, item, outdent) {
  var list = item && item.parentElement;
  if (!list || !/^(UL|OL)$/.test(list.tagName)) return false;
  if (!outdent) {
    var previous = item.previousElementSibling;
    if (!previous || previous.tagName !== "LI") return true;
    var nested = previous.lastElementChild;
    if (!nested || nested.tagName !== list.tagName) {
      nested = document.createElement(list.tagName.toLowerCase());
      previous.appendChild(nested);
    }
    nested.appendChild(item);
  } else {
    var parentItem = list.parentElement;
    if (!parentItem || parentItem.tagName !== "LI") return true;
    var parentList = parentItem.parentElement;
    parentList.insertBefore(item, parentItem.nextSibling);
    if (!list.children.length) list.remove();
  }
  normalizeListStyles(editor);
  editor.focus();
  return true;
}

function exitEmptyListItem(editor, item) {
  if (!item || (item.textContent || "").replace(/\u00a0/g, " ").trim()) return false;
  var list = item.parentElement;
  var parentItem = list && list.parentElement;
  if (parentItem && parentItem.tagName === "LI") {
    var parentList = parentItem.parentElement;
    parentList.insertBefore(item, parentItem.nextSibling);
    if (!list.children.length) list.remove();
    item.innerHTML = "<br>";
    normalizeListStyles(editor);
    placeCaret(item);
    return true;
  }
  var paragraph = document.createElement("p");
  paragraph.appendChild(document.createElement("br"));
  list.parentNode.insertBefore(paragraph, list.nextSibling);
  item.remove();
  if (!list.children.length) list.remove();
  placeCaret(paragraph);
  return true;
}

function setupRichEditor(editor, toolbar) {
  var savedRange = null;

  function rememberRange() {
    var selection = window.getSelection();
    if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange();
  }

  function restoreRange() {
    if (!savedRange) return;
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function selectedList() {
    var selection = window.getSelection();
    var node = selection && selection.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    return node && node.closest ? node.closest("ol") : null;
  }

  function run(command) {
    restoreRange();
    editor.focus();
    if (command === "blockquote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else if (command === "alphaList") {
      document.execCommand("insertOrderedList", false, null);
      var list = selectedList();
      setOrderedRootStyle(list, editor, "alpha");
    } else if (command === "insertOrderedList") {
      document.execCommand("insertOrderedList", false, null);
      setOrderedRootStyle(selectedList(), editor, "decimal");
    } else if (command === "createLink") {
      var url = prompt("请输入链接地址");
      if (!url) return;
      if (!/^(https?:|mailto:|#)/i.test(url)) url = "https://" + url;
      restoreRange();
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand(command, false, null);
    }
    normalizeListStyles(editor);
    rememberRange();
  }

  editor.addEventListener("keyup", function() {
    normalizeListStyles(editor);
    rememberRange();
  });
  editor.addEventListener("mouseup", rememberRange);
  editor.addEventListener("focus", rememberRange);
  editor.addEventListener("paste", function(event) {
    var data = event.clipboardData;
    if (!data) return;
    event.preventDefault();
    var html = data.getData("text/html");
    if (html) document.execCommand("insertHTML", false, sanitizeRichHtml(html));
    else document.execCommand("insertText", false, data.getData("text/plain"));
    setTimeout(function() { normalizeListStyles(editor); }, 0);
  });
  editor.addEventListener("keydown", function(event) {
    var key = String(event.key || "").toLowerCase();
    var code = String(event.code || "");
    var mod = event.metaKey || event.ctrlKey;
    var item = activeListItem(editor);
    if (mod && event.shiftKey && (code === "Digit7" || key === "7" || key === "&")) {
      event.preventDefault();
      run("insertOrderedList");
    } else if (mod && event.shiftKey && (code === "Digit8" || key === "8" || key === "*")) {
      event.preventDefault();
      run("insertUnorderedList");
    } else if (event.key === "Tab" && item) {
      if (indentListItem(editor, item, event.shiftKey)) {
        event.preventDefault();
        rememberRange();
      }
    } else if (event.key === "Enter" && item && exitEmptyListItem(editor, item)) {
      event.preventDefault();
      rememberRange();
    } else if (mod && key === "b") {
      event.preventDefault();
      run("bold");
    } else if (mod && key === "i") {
      event.preventDefault();
      run("italic");
    } else if (mod && event.shiftKey && key === "x") {
      event.preventDefault();
      run("strikeThrough");
    } else if (event.key === " " && !mod && !event.altKey && applyMarkdownShortcut(editor)) {
      event.preventDefault();
      normalizeListStyles(editor);
      rememberRange();
    }
  });

  toolbar.querySelectorAll("[data-rich-command]").forEach(function(button) {
    button.addEventListener("mousedown", function(event) {
      event.preventDefault();
      run(button.getAttribute("data-rich-command"));
    });
  });

  var format = toolbar.querySelector(".bw-pa-rich-format");
  format.addEventListener("mousedown", rememberRange);
  format.addEventListener("change", function() {
    restoreRange();
    editor.focus();
    document.execCommand("formatBlock", false, format.value);
    format.value = "p";
    rememberRange();
  });
  normalizeListStyles(editor);
}

function applyMarkdownShortcut(editor) {
  var selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selection.isCollapsed || !editor.contains(selection.anchorNode)) return false;
  var node = selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentNode : selection.anchorNode;
  var block = node === editor ? editor : (node.closest ? node.closest("p,div,h2,h3,blockquote,li") : null);
  if (!block || !editor.contains(block)) return false;
  var token = (block.textContent || "").trim();
  var command = {"#":"h2","##":"h3",">":"blockquote","-":"ul","*":"ul","1.":"ol","1、":"ol","a.":"alpha","A.":"alpha","a、":"alpha","A、":"alpha"}[token];
  if (!command) return false;

  var currentList = block.closest && block.closest("ul,ol");
  if (currentList && block.tagName === "LI" && /^(ul|ol|alpha)$/.test(command)) {
    var currentStyle = currentList.tagName === "UL" ? "ul" : String(currentList.getAttribute("type") || "").toLowerCase() === "a" ? "alpha" : "ol";
    if (currentStyle !== command) {
      var nextList = document.createElement(command === "ul" ? "ul" : "ol");
      if (command === "alpha") nextList.setAttribute("data-ak47-list-root", "alpha");
      if (command === "ol") nextList.setAttribute("data-ak47-list-root", "decimal");
      currentList.parentNode.insertBefore(nextList, currentList.nextSibling);
      nextList.appendChild(block);
      if (!currentList.children.length) currentList.remove();
    }
    block.innerHTML = "<br>";
    var listRange = document.createRange();
    listRange.setStart(block, 0);
    listRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(listRange);
    normalizeListStyles(editor);
    return true;
  }
  if (block === editor) {
    block.innerHTML = "";
    var paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    block.appendChild(paragraph);
    block = paragraph;
  } else {
    block.innerHTML = "<br>";
  }
  var range = document.createRange();
  range.selectNodeContents(block);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  if (command === "h2" || command === "h3" || command === "blockquote") {
    document.execCommand("formatBlock", false, command);
  } else {
    document.execCommand(command === "ul" ? "insertUnorderedList" : "insertOrderedList", false, null);
    var anchor = selection.anchorNode && (selection.anchorNode.nodeType === 3 ? selection.anchorNode.parentNode : selection.anchorNode);
    var list = anchor && anchor.closest ? anchor.closest("ol") : null;
    if (command === "alpha") setOrderedRootStyle(list, editor, "alpha");
    if (command === "ol") setOrderedRootStyle(list, editor, "decimal");
  }
  normalizeListStyles(editor);
  return true;
}

function openEditor(opts) {
  closeDialog(true);
  var el = opts.el || null;
  var existing = opts.anno || null;
  var editableText = !!el && isTextEditable(el);
  var base = existing && existing.base ? clone(existing.base) : readStyle(el);
  var now = existing && existing.now ? clone(existing.now) : clone(base);
  var inlineBase = existing && existing.inlineBase ? clone(existing.inlineBase) : readInlineStyle(el);
  var mode = existing ? existing.mode : (el ? "tweak" : "note");
  var type = el ? typeOf(el) : (existing && existing.type ? existing.type : { label: "元素", tag: "?" });

  dialog = mark(document.createElement("div"));
  dialog.className = "bw-pa-dialog";
  dialog.innerHTML = ""
    + "<div class=\"bw-pa-dhead\"><span class=\"bw-pa-dnum\">#" + opts.id + "</span><span class=\"bw-pa-dtitle\">" + esc(opts.title) + "</span><span class=\"bw-pa-close\" title=\"取消\">×</span></div>"
    + "<div class=\"bw-pa-dbody\">"
    + "<div class=\"bw-pa-target\"><strong>" + esc(type.label) + " &lt;" + esc(type.tag) + "&gt;</strong><br>" + esc(el ? contextOf(el) : (existing.context || "元素不存在")) + "<br>“" + esc(el ? summaryOf(el) : (existing.summary || "未找到元素")) + "”</div>"
    + (el ? "<div class=\"bw-pa-mode\"><button type=\"button\" class=\"bw-pa-mode-tweak\">直接微调</button><button type=\"button\" class=\"bw-pa-mode-note\">文字说明</button><button type=\"button\" class=\"bw-pa-mode-spec\">设计说明</button></div>" : "")
    + "<div class=\"bw-pa-tweak\">"
    + (editableText ? "<div class=\"bw-pa-sec\"><h4>文案</h4><div class=\"bw-pa-field\"><label>文本</label><textarea class=\"bw-pa-text\"></textarea></div></div>" : "")
    + "<div class=\"bw-pa-sec\"><h4>样式</h4>"
    + fieldNumber("字号", "fontSize", pxNumber(now.fontSize))
    + fieldWeight(now.fontWeight)
    + fieldColor("文字色", "color", now.color, false)
    + fieldColor("背景色", "backgroundColor", now.backgroundColor, true)
    + fieldNumber("圆角", "borderRadius", pxNumber(now.borderRadius))
    + fieldNumber("宽度", "width", pxNumber(now.width))
    + fieldNumber("高度", "height", pxNumber(now.height))
    + "</div><div class=\"bw-pa-preview\"><b>自动生成的修改意见</b><span class=\"bw-pa-preview-text\"></span></div></div>"
    + "<div class=\"bw-pa-note-wrap\"><textarea class=\"bw-pa-note\" placeholder=\"用一句话描述这里要怎么改\"></textarea></div>"
    + "<div class=\"bw-pa-spec-wrap\"><div class=\"bw-pa-sec\"><h4>设计说明</h4><div class=\"bw-pa-field\"><label>标题 *</label><input class=\"bw-pa-spec-title-input\" maxlength=\"100\" placeholder=\"请输入标题\" required></div><div class=\"bw-pa-field bw-pa-field-rich\"><div class=\"bw-pa-rich-toolbar\">" + richToolbarHtml() + "</div><div class=\"bw-pa-rich-editor bw-pa-spec-body-input\" contenteditable=\"true\" role=\"textbox\" aria-label=\"需求说明\" aria-multiline=\"true\" data-placeholder=\"需求说明 *\" spellcheck=\"true\"></div></div></div></div>"
    + "<p class=\"bw-pa-hint\">Ctrl / ⌘ + Enter 保存，Esc 取消；标题栏可拖动。</p>"
    + "<div class=\"bw-pa-dfoot\"><button class=\"bw-pa-btn bw-pa-save\">保存标注</button><button class=\"bw-pa-btn light bw-pa-cancel\">取消</button></div>"
    + "</div>";

  document.body.appendChild(dialog);
  dialog.style.left = opts.left + "px";
  dialog.style.top = opts.top + "px";
  clamp(dialog);
  drag(dialog.querySelector(".bw-pa-dhead"), dialog);

  var textInput = dialog.querySelector(".bw-pa-text");
  var noteInput = dialog.querySelector(".bw-pa-note");
  var specTitleInput = dialog.querySelector(".bw-pa-spec-title-input");
  var specBodyInput = dialog.querySelector(".bw-pa-spec-body-input");
  var preview = dialog.querySelector(".bw-pa-preview-text");
  if (textInput) textInput.value = now.text || "";
  noteInput.value = existing ? (existing.note || "") : "";
  specTitleInput.value = existing ? (existing.specTitle || "") : "";
  specBodyInput.innerHTML = existing ? specHtmlOf(existing) : "";
  setupRichEditor(specBodyInput, dialog.querySelector(".bw-pa-rich-toolbar"));

  function refreshPreview() {
    var summary = changeSummary(base, now);
    preview.textContent = summary || "还没有改动。";
  }

  function applyNow() {
    if (!el) return;
    restoreElement(el, inlineBase, base);
    PROPS.forEach(function(prop) {
      if (String(now[prop.key]) !== String(base[prop.key])) {
        if (now[prop.key] == null && prop.key === "backgroundColor") el.style.backgroundColor = "transparent";
        else el.style[prop.key] = now[prop.key];
      }
    });
    if (editableText && now.text !== base.text) el.textContent = now.text || "";
    renderMarks();
  }

  function setMode(nextMode) {
    mode = nextMode;
    var tweakBody = dialog.querySelector(".bw-pa-tweak");
    var noteBody = dialog.querySelector(".bw-pa-note-wrap");
    var specBody = dialog.querySelector(".bw-pa-spec-wrap");
    var tweakBtn = dialog.querySelector(".bw-pa-mode-tweak");
    var noteBtn = dialog.querySelector(".bw-pa-mode-note");
    var specBtn = dialog.querySelector(".bw-pa-mode-spec");
    if (tweakBtn) tweakBtn.classList.toggle("act", mode === "tweak");
    if (noteBtn) noteBtn.classList.toggle("act", mode === "note");
    if (specBtn) specBtn.classList.toggle("act", mode === "spec");
    tweakBody.style.display = mode === "tweak" ? "block" : "none";
    noteBody.style.display = mode === "note" ? "block" : "none";
    specBody.style.display = mode === "spec" ? "block" : "none";
    if (mode === "tweak") {
      applyNow();
      refreshPreview();
    } else if (el) {
      restoreElement(el, inlineBase, base);
      renderMarks();
    }
  }

  if (textInput) {
    textInput.addEventListener("input", function() {
      now.text = textInput.value;
      applyNow();
      refreshPreview();
    });
  }

  ["fontSize", "borderRadius", "width", "height"].forEach(function(key) {
    var input = dialog.querySelector("[data-pa-input=\"" + key + "\"]");
    if (!input) return;
    input.addEventListener("input", function() {
      now[key] = Math.max(0, Number(input.value) || 0) + "px";
      applyNow();
      refreshPreview();
    });
  });

  var weight = dialog.querySelector("[data-pa-input=\"fontWeight\"]");
  if (weight) {
    weight.addEventListener("change", function() {
      now.fontWeight = weight.value;
      applyNow();
      refreshPreview();
    });
  }

  ["color", "backgroundColor"].forEach(function(key) {
    var color = dialog.querySelector("[data-pa-color=\"" + key + "\"]");
    var hex = dialog.querySelector("[data-pa-hex=\"" + key + "\"]");
    var none = dialog.querySelector("[data-pa-none=\"" + key + "\"]");
    if (!color || !hex) return;
    function setColor(value) {
      now[key] = value;
      if (value) {
        color.value = value;
        hex.value = value;
      } else {
        hex.value = "";
      }
      if (none) none.classList.toggle("act", !value);
      applyNow();
      refreshPreview();
    }
    color.addEventListener("input", function() { setColor(color.value); });
    hex.addEventListener("change", function() {
      var value = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(value)) setColor(value);
      else if (!value && key === "backgroundColor") setColor(null);
    });
    if (none) none.addEventListener("click", function() { setColor(null); });
  });

  var modeTweak = dialog.querySelector(".bw-pa-mode-tweak");
  var modeNote = dialog.querySelector(".bw-pa-mode-note");
  var modeSpec = dialog.querySelector(".bw-pa-mode-spec");
  if (modeTweak) modeTweak.addEventListener("click", function() { setMode("tweak"); });
  if (modeNote) modeNote.addEventListener("click", function() { setMode("note"); });
  if (modeSpec) modeSpec.addEventListener("click", function() { setMode("spec"); });

  function finish() {
    var data;
    if (mode === "note") {
      data = { mode: "note", note: noteInput.value.trim(), specTitle: "", specBody: "", specBodyHtml: "", base: base, now: clone(base), inlineBase: inlineBase };
    } else if (mode === "spec") {
      var specTitle = specTitleInput.value.trim();
      var specBodyHtml = sanitizeRichHtml(specBodyInput.innerHTML);
      var specBody = richHtmlToMarkdown(specBodyHtml).trim();
      if (!specTitle || !richText(specBodyHtml)) {
        toast("请填写标题和需求说明");
        (!specTitle ? specTitleInput : specBodyInput).focus();
        return;
      }
      data = { mode: "spec", note: "", specTitle: specTitle, specBody: specBody, specBodyHtml: specBodyHtml, base: base, now: clone(base), inlineBase: inlineBase };
    } else {
      data = { mode: "tweak", note: "", specTitle: "", specBody: "", specBodyHtml: "", base: base, now: now, inlineBase: inlineBase };
    }
    closeDialog(false);
    opts.onSave(data);
  }

  function cancel() {
    if (el) {
      restoreElement(el, inlineBase, base);
      if (existing) applyStored(existing);
      renderMarks();
    }
    closeDialog(false);
  }

  activeCancel = cancel;
  dialog.querySelector(".bw-pa-save").addEventListener("click", finish);
  dialog.querySelector(".bw-pa-cancel").addEventListener("click", cancel);
  dialog.querySelector(".bw-pa-close").addEventListener("click", cancel);
  dialog.addEventListener("keydown", function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      block(event);
      finish();
    }
    if (event.key === "Escape") {
      block(event);
      cancel();
    }
  });

  setMode(mode);
  if (mode === "note") noteInput.focus();
  else if (mode === "spec") specTitleInput.focus();
  else if (textInput) textInput.focus();
}

function renderAll() {
  root.querySelector(".bw-pa-count").textContent = annos.length;
  renderPanel();
  renderMarks();
}

function renderPanel() {
  if (!annos.length) {
    list.innerHTML = "<div class=\"bw-pa-empty\">还没有标注。开启后按住 " + PICK_LABEL + "，再点击页面元素。</div>";
    return;
  }
  list.innerHTML = annos.map(function(anno) {
    var text = anno.mode === "note" ? (anno.note || "(空)") : anno.mode === "spec" ? ("设计说明：" + (anno.specTitle || "(无标题)")) : ("微调：" + (changeSummary(anno.base, anno.now) || "(无变化)"));
    var meta = (anno.context || "页面") + " · " + (anno.type ? anno.type.label : "元素");
    return "<div class=\"bw-pa-item\" data-id=\"" + anno.id + "\"><span class=\"bw-pa-no\">" + anno.id + "</span><span class=\"bw-pa-copy\">" + esc(text) + "<span class=\"bw-pa-meta\">" + esc(meta) + "</span></span><span class=\"bw-pa-actions\"><span class=\"bw-pa-icon\" data-action=\"edit\" title=\"编辑\">✎</span><span class=\"bw-pa-icon\" data-action=\"delete\" title=\"删除\">×</span></span></div>";
  }).join("");
}

function renderMarks() {
  document.querySelectorAll(".bw-pa-box,.bw-pa-badge").forEach(function(node) { node.remove(); });
  if (!enabled) return;
  var specIndex = 0;
  annos.forEach(function(anno) {
    if (anno.mode === "spec") specIndex += 1;
    if (previewing && anno.mode !== "spec") return;
    var el = resolveAnno(anno);
    if (!el) return;
    var rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    if (!previewing) {
      var box = mark(document.createElement("div"));
      box.className = "bw-pa-box";
      box.setAttribute("data-mark-id", anno.id);
      box.style.left = Math.round(rect.left + window.scrollX) + "px";
      box.style.top = Math.round(rect.top + window.scrollY) + "px";
      box.style.width = Math.round(rect.width) + "px";
      box.style.height = Math.round(rect.height) + "px";
      document.body.appendChild(box);
    }
    var badge = mark(document.createElement("div"));
    badge.className = "bw-pa-badge" + (previewing ? " bw-pa-spec-badge" : "");
    badge.setAttribute("data-mark-id", anno.id);
    badge.textContent = previewing ? "D" + specIndex : anno.id;
    badge.style.left = Math.round(rect.left + window.scrollX) + "px";
    badge.style.top = Math.round(rect.top + window.scrollY) + "px";
    badge.addEventListener("click", function(event) {
      block(event);
      if (previewing) openSpecViewer(anno, Number(badge.textContent.slice(1)));
      else editAnno(anno.id);
    });
    if (!previewing) {
      badge.addEventListener("mouseover", function() { hotAnno(anno.id, true); });
      badge.addEventListener("mouseout", function() { hotAnno(anno.id, false); });
    }
    document.body.appendChild(badge);
  });
}

function hotAnno(id, value) {
  document.querySelectorAll("[data-mark-id=\"" + id + "\"]").forEach(function(node) {
    node.classList.toggle("hot", value);
  });
}

function focusAnno(id) {
  var anno = findAnno(id);
  var el = anno && resolveAnno(anno);
  if (!el) return toast("没有找到对应元素，页面结构可能已变化");
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  setTimeout(function() {
    renderMarks();
    document.querySelectorAll("[data-mark-id=\"" + id + "\"]").forEach(function(node) {
      node.classList.add("flash");
      setTimeout(function() { node.classList.remove("flash"); }, 900);
    });
  }, 360);
}

function deleteAnno(id) {
  var anno = findAnno(id);
  restoreStored(anno);
  annos = annos.filter(function(anno) { return anno.id !== id; });
  persist();
  applyAll();
  renderAll();
}

function applyAll() {
  annos.forEach(applyStored);
}

function applyStored(anno) {
  if (!anno || anno.mode !== "tweak") return;
  var el = resolveAnno(anno);
  if (!el) return;
  restoreElement(el, anno.inlineBase || {}, anno.base || {});
  PROPS.forEach(function(prop) {
    if (!anno.now || !anno.base) return;
    if (String(anno.now[prop.key]) !== String(anno.base[prop.key])) {
      if (anno.now[prop.key] == null && prop.key === "backgroundColor") el.style.backgroundColor = "transparent";
      else el.style[prop.key] = anno.now[prop.key];
    }
  });
  if (anno.now && anno.base && anno.now.text != null && String(anno.now.text) !== String(anno.base.text) && isTextEditable(el)) {
    el.textContent = anno.now.text;
  }
}

function restoreStored(anno) {
  if (!anno || anno.mode !== "tweak") return;
  var el = resolveAnno(anno);
  if (!el) return;
  restoreElement(el, anno.inlineBase || {}, anno.base || {});
}

function exportMarkdown() {
  if (!annos.length) return "（无标注）";
  var lines = ["【原型标注清单】共 " + annos.length + " 条"];
  annos.forEach(function(anno) {
    var type = anno.type ? anno.type.label + " <" + anno.type.tag + ">" : "元素";
    lines.push("");
    if (anno.mode === "spec") lines.push("- [" + anno.id + "] 【设计说明】" + (anno.specTitle || "(无标题)"));
    else lines.push("- [" + anno.id + "] " + (anno.mode === "note" ? (anno.note || "(空)") : "【微调】 " + (changeSummary(anno.base, anno.now) || "(无变化)")));
    lines.push("  · 元素：" + type + " · “" + (anno.summary || "") + "”");
    lines.push("  · 区域：" + (anno.context || "页面"));
    lines.push("  · 选择器：" + (anno.selector || ""));
    if (anno.mode === "spec") {
      var specMarkdown = specMarkdownOf(anno);
      if (specMarkdown.indexOf("\n") === -1) {
        lines.push("  · 需求说明：" + specMarkdown);
      } else {
        lines.push("  · 需求说明：");
        specMarkdown.split("\n").forEach(function(line) { lines.push("    " + line); });
      }
    } else if (anno.mode === "tweak") {
      if (anno.now && anno.base && anno.now.text != null && String(anno.now.text) !== String(anno.base.text)) {
        lines.push("  · 文案：“" + anno.base.text + "” → “" + anno.now.text + "”");
      }
      var styleChanges = [];
      PROPS.forEach(function(prop) {
        if (anno.now && anno.base && String(anno.now[prop.key]) !== String(anno.base[prop.key])) {
          styleChanges.push(prop.css + " " + displayValue(anno.base[prop.key]) + " → " + displayValue(anno.now[prop.key]));
        }
      });
      if (styleChanges.length) lines.push("  · 样式：" + styleChanges.join("；"));
    }
  });
  return lines.join("\n");
}

function copyOut() {
  if (!annos.length) return toast("还没有标注");
  copyText(exportMarkdown(), function() {
    toast("已复制 " + annos.length + " 条标注");
  }, function() {
    toast("复制失败，请手动复制");
  });
}

function reviewCss() {
  return "[data-ak47-review-ui],[data-ak47-review-ui] *{box-sizing:border-box;letter-spacing:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;}"
    + ".ak47-review-bar{position:fixed;z-index:2147483645;top:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;min-height:46px;padding:6px 7px 6px 14px;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:#171717;color:#fff;box-shadow:0 14px 42px rgba(0,0,0,.24);font:700 11px/1.2 ui-monospace,'SF Mono',Consolas,monospace;white-space:nowrap;}"
    + ".ak47-review-bar button,.ak47-review-close{min-height:32px;border:1px solid #d8d8d3;border-radius:7px;background:#fff;color:#171717;padding:0 11px;font:650 12px/1 Inter,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;cursor:pointer;}"
    + ".ak47-review-badge{position:absolute;z-index:2147483643;display:grid;place-items:center;min-width:31px;height:24px;padding:0 6px;transform:translate(-50%,-50%);border:1px solid #171717;border-radius:6px;background:#171717;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.24);font:750 11px/1 ui-monospace,'SF Mono',Consolas,monospace;cursor:pointer;}"
    + ".ak47-review-badge:hover,.ak47-review-badge:focus{background:#5368ff;border-color:#5368ff;outline:none;}"
    + ".ak47-review-viewer{position:fixed;z-index:2147483646;top:76px;right:18px;width:360px;max-width:calc(100vw - 24px);max-height:calc(100vh - 94px);overflow:auto;border:1px solid rgba(23,23,23,.18);border-radius:8px;background:#fff;color:#171717;box-shadow:0 22px 70px rgba(0,0,0,.22);}"
    + ".ak47-review-head{position:sticky;top:0;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #d8d8d3;background:#fff;}"
    + ".ak47-review-no{display:grid;place-items:center;min-width:29px;height:27px;border-radius:6px;background:#171717;color:#fff;font:700 10px/1 ui-monospace,'SF Mono',Consolas,monospace;}"
    + ".ak47-review-head strong{flex:1;font-size:13px;}.ak47-review-close{width:30px;padding:0;font-size:16px;}"
    + ".ak47-review-body{padding:16px;}.ak47-review-title{margin:0 0 10px;font-size:17px;line-height:1.4;word-break:break-word;}"
    + ".ak47-review-copy{font-size:13px;line-height:1.75;word-break:break-word;}.ak47-review-copy p{margin:0 0 8px;}.ak47-review-copy h2,.ak47-review-copy h3{margin:12px 0 6px;line-height:1.4;}.ak47-review-copy h2{font-size:18px;}.ak47-review-copy h3{font-size:15px;}"
    + ".ak47-review-copy ul,.ak47-review-copy ol{margin:7px 0;padding-left:22px;}.ak47-review-copy ol[type='a']{list-style-type:lower-alpha;}.ak47-review-copy ol[type='i']{list-style-type:lower-roman;}"
    + ".ak47-review-copy blockquote{margin:8px 0;padding-left:10px;border-left:3px solid #d8d8d3;color:#6b6b6b;}.ak47-review-copy code{border-radius:3px;background:#f2f2ef;padding:1px 4px;font-family:ui-monospace,'SF Mono',Consolas,monospace;}"
    + ".ak47-review-target{margin-top:15px;padding-top:12px;border-top:1px solid #d8d8d3;color:#6b6b6b;font:10px/1.55 ui-monospace,'SF Mono',Consolas,monospace;word-break:break-word;}"
    + "@media(max-width:520px){.ak47-review-bar{top:10px;max-width:calc(100vw - 20px);}.ak47-review-viewer{top:auto;right:10px;bottom:10px;width:calc(100vw - 20px);max-height:calc(100vh - 74px);}}";
}

function reviewRuntime() {
  var dataNode = document.getElementById("__ak47_review_data__");
  if (!dataNode) return;
  var data;
  try { data = JSON.parse(dataNode.textContent || "{}"); } catch (err) { return; }
  var notes = Array.isArray(data.notes) ? data.notes : [];
  var root = document.createElement("div");
  root.setAttribute("data-ak47-review-ui", "1");
  var bar = document.createElement("div");
  bar.className = "ak47-review-bar";
  var label = document.createElement("span");
  label.textContent = "Dsign 评审 · " + notes.length + " 条设计说明";
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "隐藏标注";
  bar.appendChild(label);
  bar.appendChild(toggle);
  root.appendChild(bar);
  document.body.appendChild(root);
  var badges = [];
  var viewer = null;
  var visible = true;
  var scheduled = false;

  function targetOf(note) {
    try { return document.querySelector("[data-ak47-anchor~=\"" + note.anchor + "\"]"); } catch (err) { return null; }
  }

  function closeViewer() {
    if (viewer) viewer.remove();
    viewer = null;
  }

  function openNote(note, scrollToTarget) {
    closeViewer();
    var target = targetOf(note);
    if (scrollToTarget && target) target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    viewer = document.createElement("aside");
    viewer.className = "ak47-review-viewer";
    viewer.setAttribute("data-ak47-review-ui", "1");
    viewer.innerHTML = "<div class=\"ak47-review-head\"><span class=\"ak47-review-no\"></span><strong>设计说明</strong><button type=\"button\" class=\"ak47-review-close\" title=\"关闭\" aria-label=\"关闭\">×</button></div><div class=\"ak47-review-body\"><h3 class=\"ak47-review-title\"></h3><div class=\"ak47-review-copy\"></div><div class=\"ak47-review-target\"></div></div>";
    viewer.querySelector(".ak47-review-no").textContent = note.id;
    viewer.querySelector(".ak47-review-title").textContent = note.title || "未命名说明";
    viewer.querySelector(".ak47-review-copy").innerHTML = note.bodyHtml || "";
    viewer.querySelector(".ak47-review-target").textContent = note.target || "";
    viewer.querySelector(".ak47-review-close").addEventListener("click", closeViewer);
    document.body.appendChild(viewer);
    try { history.replaceState(null, "", location.href.split("#")[0] + "#" + note.id); } catch (err) {}
  }

  notes.forEach(function(note) {
    var badge = document.createElement("button");
    badge.type = "button";
    badge.className = "ak47-review-badge";
    badge.setAttribute("data-ak47-review-ui", "1");
    badge.textContent = note.id;
    badge.title = note.title || "设计说明";
    badge.addEventListener("click", function() { openNote(note, false); });
    root.appendChild(badge);
    badges.push({ node: badge, note: note });
  });

  function render() {
    scheduled = false;
    badges.forEach(function(entry) {
      var target = targetOf(entry.note);
      if (!visible || !target) {
        entry.node.style.display = "none";
        return;
      }
      var rect = target.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        entry.node.style.display = "none";
        return;
      }
      entry.node.style.display = "grid";
      entry.node.style.left = Math.round(rect.left + window.scrollX) + "px";
      entry.node.style.top = Math.round(rect.top + window.scrollY) + "px";
    });
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  toggle.addEventListener("click", function() {
    visible = !visible;
    toggle.textContent = visible ? "隐藏标注" : "显示标注";
    if (!visible) closeViewer();
    render();
  });
  window.addEventListener("scroll", scheduleRender, true);
  window.addEventListener("resize", scheduleRender);
  render();
  var hash = String(location.hash || "").replace(/^#/, "").toUpperCase();
  var initial = notes.filter(function(note) { return note.id === hash; })[0];
  if (initial) setTimeout(function() { openNote(initial, true); }, 80);
}

function syncSnapshotState(clonedRoot) {
  var selector = "input,textarea,select,details";
  var originals = document.querySelectorAll(selector);
  var copies = clonedRoot.querySelectorAll(selector);
  for (var i = 0; i < Math.min(originals.length, copies.length); i += 1) {
    var source = originals[i];
    var copy = copies[i];
    if (source.tagName === "INPUT") {
      copy.setAttribute("value", source.value);
      if (source.checked) copy.setAttribute("checked", "checked");
      else copy.removeAttribute("checked");
    } else if (source.tagName === "TEXTAREA") {
      copy.textContent = source.value;
    } else if (source.tagName === "SELECT") {
      Array.prototype.forEach.call(copy.options, function(option, index) {
        option.selected = !!(source.options[index] && source.options[index].selected);
      });
    } else if (source.tagName === "DETAILS") {
      if (source.open) copy.setAttribute("open", "open");
      else copy.removeAttribute("open");
    }
  }
}

function reviewFileName() {
  var name = location.pathname.split("/").pop() || "prototype.html";
  try { name = decodeURIComponent(name); } catch (err) {}
  name = name.replace(/[\\/:*?\"<>|]/g, "-").replace(/\.html?$/i, "") || "prototype";
  return name + "-Dsign评审版.html";
}

function exportReviewHtml() {
  var specs = annos.filter(function(anno) { return anno.mode === "spec"; });
  if (!specs.length) return toast("还没有设计说明可导出");
  var clonedRoot = document.documentElement.cloneNode(true);
  syncSnapshotState(clonedRoot);
  Array.prototype.forEach.call(clonedRoot.querySelectorAll("[data-ak47-anchor]"), function(node) { node.removeAttribute("data-ak47-anchor"); });
  Array.prototype.forEach.call(clonedRoot.querySelectorAll("[" + UI_ATTR + "],[data-ak47-review-ui]"), function(node) { node.remove(); });
  [STYLE_ID, "__ak47_review_data__", "__ak47_review_style__", "__ak47_review_runtime__"].forEach(function(id) {
    var node = clonedRoot.querySelector("#" + cssEscape(id));
    if (node) node.remove();
  });
  var clonedBody = clonedRoot.querySelector("body");
  if (clonedBody) clonedBody.classList.remove("bw-pa-pick");
  Array.prototype.forEach.call(clonedRoot.querySelectorAll("meta[http-equiv]"), function(meta) {
    if (String(meta.getAttribute("http-equiv") || "").toLowerCase() === "content-security-policy") meta.remove();
  });

  var notes = [];
  specs.forEach(function(anno, index) {
    var id = "D" + (index + 1);
    var target = null;
    try { target = clonedRoot.querySelector(anno.selector); } catch (err) {}
    if (target) {
      var anchors = String(target.getAttribute("data-ak47-anchor") || "").split(/\s+/).filter(Boolean);
      anchors.push(id);
      target.setAttribute("data-ak47-anchor", anchors.join(" "));
    }
    notes.push({
      id: id,
      anchor: id,
      title: anno.specTitle || "未命名说明",
      bodyHtml: specHtmlOf(anno),
      target: (anno.type ? anno.type.label + " <" + anno.type.tag + ">" : "元素") + " · “" + (anno.summary || "") + "”"
    });
  });

  var head = clonedRoot.querySelector("head");
  var body = clonedRoot.querySelector("body");
  if (!head || !body) return toast("当前页面无法生成评审版");
  var base = head.querySelector("base");
  if (!base) {
    base = document.createElement("base");
    head.insertBefore(base, head.firstChild);
  }
  base.setAttribute("href", document.baseURI || location.href);
  var title = head.querySelector("title");
  if (title && title.textContent.indexOf("Dsign评审") === -1) title.textContent += " · Dsign评审";
  var style = document.createElement("style");
  style.id = "__ak47_review_style__";
  style.textContent = reviewCss();
  head.appendChild(style);
  var data = document.createElement("script");
  data.id = "__ak47_review_data__";
  data.type = "application/json";
  data.textContent = JSON.stringify({ version: 1, notes: notes }).replace(/</g, "\\u003c");
  body.appendChild(data);
  var runtime = document.createElement("script");
  runtime.id = "__ak47_review_runtime__";
  runtime.textContent = "(" + reviewRuntime.toString() + ")();";
  body.appendChild(runtime);

  var blob = new Blob(["<!doctype html>\n" + clonedRoot.outerHTML], { type: "text/html;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = reviewFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  toast("已导出 " + notes.length + " 条设计说明");
}

function fieldNumber(label, key, value) {
  return "<div class=\"bw-pa-field\"><label>" + label + "</label><div class=\"bw-pa-two\"><input type=\"number\" min=\"0\" max=\"4000\" data-pa-input=\"" + key + "\" value=\"" + value + "\"><span>px</span></div></div>";
}

function fieldWeight(value) {
  var weights = ["300", "400", "500", "600", "700", "800", "900"];
  return "<div class=\"bw-pa-field\"><label>字重</label><select data-pa-input=\"fontWeight\">" + weights.map(function(weight) {
    return "<option value=\"" + weight + "\"" + (String(value) === weight ? " selected" : "") + ">" + weight + "</option>";
  }).join("") + "</select></div>";
}

function fieldColor(label, key, value, allowNone) {
  var color = value || "#ffffff";
  return "<div class=\"bw-pa-field\"><label>" + label + "</label><div class=\"bw-pa-color\"><input type=\"color\" data-pa-color=\"" + key + "\" value=\"" + color + "\"><input data-pa-hex=\"" + key + "\" value=\"" + (value || "") + "\">" + (allowNone ? "<span class=\"bw-pa-none" + (!value ? " act" : "") + "\" data-pa-none=\"" + key + "\">无</span>" : "<span></span>") + "</div></div>";
}

function readStyle(el) {
  if (!el) return {};
  var style = getComputedStyle(el);
  return {
    text: isTextEditable(el) ? el.textContent : null,
    fontSize: style.fontSize,
    fontWeight: normalizeWeight(style.fontWeight),
    color: colorToHex(style.color) || "#111111",
    backgroundColor: colorToHex(style.backgroundColor),
    borderRadius: style.borderRadius.split(" ")[0],
    width: Math.round(el.getBoundingClientRect().width) + "px",
    height: Math.round(el.getBoundingClientRect().height) + "px"
  };
}

function readInlineStyle(el) {
  if (!el) return {};
  var out = {};
  PROPS.forEach(function(prop) { out[prop.key] = el.style[prop.key] || ""; });
  out.text = isTextEditable(el) ? el.textContent : null;
  return out;
}

function restoreElement(el, inlineBase, base) {
  if (!el) return;
  PROPS.forEach(function(prop) {
    el.style[prop.key] = inlineBase && inlineBase[prop.key] ? inlineBase[prop.key] : "";
  });
  if (inlineBase && inlineBase.text != null && isTextEditable(el)) {
    el.textContent = inlineBase.text;
  } else if (base && base.text != null && isTextEditable(el)) {
    el.textContent = base.text;
  }
}

function changeSummary(base, now) {
  if (!base || !now) return "";
  var parts = [];
  if (now.text != null && String(now.text) !== String(base.text)) parts.push("文案 “" + short(base.text, 22) + "” → “" + short(now.text, 22) + "”");
  PROPS.forEach(function(prop) {
    if (String(now[prop.key]) !== String(base[prop.key])) {
      parts.push(prop.label + " " + displayValue(base[prop.key]) + " → " + displayValue(now[prop.key]));
    }
  });
  return parts.join("；");
}

function hasChanged(base, now) {
  if (!base || !now) return false;
  if (now.text != null && String(now.text) !== String(base.text)) return true;
  return PROPS.some(function(prop) { return String(now[prop.key]) !== String(base[prop.key]); });
}

function selectorOf(el) {
  if (!el || !el.tagName) return "";
  if (el.id) return "#" + cssEscape(el.id);
  var parts = [];
  while (el && el.nodeType === 1 && el !== document.body) {
    var tag = el.tagName.toLowerCase();
    var parent = el.parentElement;
    if (!parent) break;
    var same = Array.prototype.filter.call(parent.children, function(child) {
      return child.tagName === el.tagName;
    });
    if (same.length > 1) tag += ":nth-of-type(" + (same.indexOf(el) + 1) + ")";
    parts.unshift(tag);
    el = parent;
  }
  return "body > " + parts.join(" > ");
}

function resolveAnno(anno) {
  if (!anno || !anno.selector) return null;
  try { return document.querySelector(anno.selector); } catch (err) { return null; }
}

function contextOf(el) {
  var node = el;
  while (node && node !== document.body) {
    if (/^(SECTION|ARTICLE|MAIN|HEADER|FOOTER|NAV|ASIDE)$/i.test(node.tagName)) return node.tagName.toLowerCase();
    var label = node.getAttribute && (node.getAttribute("aria-label") || node.getAttribute("data-section") || node.getAttribute("data-name"));
    if (label) return label;
    node = node.parentElement;
  }
  return document.title || location.pathname || "当前页面";
}

function summaryOf(el) {
  if (!el) return "";
  var text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  if (!text && el.getAttribute) text = el.getAttribute("alt") || el.getAttribute("title") || el.getAttribute("aria-label") || "";
  if (!text && el.tagName === "IMG") text = el.getAttribute("src") || "图片";
  return short(text || el.tagName.toLowerCase(), 76);
}

function typeOf(el) {
  var tag = (el && el.tagName ? el.tagName.toLowerCase() : "?");
  var label = "元素";
  if (/^h[1-6]$/.test(tag)) label = "标题";
  else if (tag === "p" || tag === "span" || tag === "strong" || tag === "em") label = "文本";
  else if (tag === "a") label = "链接";
  else if (tag === "button") label = "按钮";
  else if (tag === "img" || tag === "picture" || tag === "video") label = "媒体";
  else if (tag === "input" || tag === "textarea" || tag === "select") label = "表单";
  else if (tag === "section" || tag === "article" || tag === "div") label = "容器";
  return { tag: tag, label: label };
}

function isTextEditable(el) {
  if (!el) return false;
  var tag = el.tagName ? el.tagName.toLowerCase() : "";
  if (/^(script|style|svg|canvas|img|video|input|textarea|select)$/.test(tag)) return false;
  return el.children.length === 0 && (el.textContent || "").trim().length > 0;
}

function findPickTarget(event) {
  var path = event.composedPath ? event.composedPath() : [];
  for (var i = 0; i < path.length; i += 1) {
    if (isPickable(path[i])) return path[i];
  }
  return isPickable(event.target) ? event.target : null;
}

function isPickable(node) {
  return !!(node && node.nodeType === 1 && node !== document.body && node !== document.documentElement && !node.closest("[" + UI_ATTR + "]"));
}

function isPickEvent(event) {
  return !!(event && (IS_MAC ? event.metaKey && event.shiftKey : event.ctrlKey && event.altKey));
}

function isPickModifier(key) {
  return IS_MAC ? key === "Meta" || key === "Shift" : key === "Control" || key === "Alt";
}

function clearHover() {
  document.querySelectorAll(".bw-pa-hover").forEach(function(node) { node.classList.remove("bw-pa-hover"); });
}

function mark(node) {
  node.setAttribute(UI_ATTR, "1");
  return node;
}

function injectStyle() {
  var style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function closeDialog(runCancel) {
  if (runCancel && activeCancel) {
    var cancel = activeCancel;
    activeCancel = null;
    cancel();
    return;
  }
  if (dialog) dialog.remove();
  dialog = null;
  activeCancel = null;
}

function liquidDown(event) {
  if (event.button !== 0 || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var node = event.target.closest(".bw-pa-btn,.bw-pa-icon,.bw-pa-close,.bw-pa-mode button,.bw-pa-none");
  if (!node || !node.closest("[" + UI_ATTR + "]")) return;
  liquidRelease();
  taffyNode = node;
  node._bwPaTaffy = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  node.classList.remove("bw-pa-release");
  node.classList.add("bw-pa-taffy", "bw-pa-pulling");
  try { node.setPointerCapture(event.pointerId); } catch (err) {}
}

function liquidMove(event) {
  var node = taffyNode;
  var state = node && node._bwPaTaffy;
  if (!state || state.pointerId !== event.pointerId) return;
  var dx = event.clientX - state.x;
  var dy = event.clientY - state.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 5) state.moved = true;
  var pull = Math.min(44, dist);
  var ux = dist ? dx / dist : 0;
  var uy = dist ? dy / dist : 0;
  var tension = pull / 44;
  var angle = Math.atan2(dy, dx) * 180 / Math.PI;
  node.style.transform = "translate(" + (ux * pull * .14).toFixed(2) + "px," + (uy * pull * .14).toFixed(2) + "px) rotate(" + (angle * .025).toFixed(2) + "deg) scale(" + (1 + tension * .055).toFixed(3) + "," + (1 - tension * .035).toFixed(3) + ")";
  node.style.setProperty("--tail-x", (-ux * Math.min(11, pull * .24)).toFixed(2) + "px");
  node.style.setProperty("--tail-y", (-uy * Math.min(11, pull * .24)).toFixed(2) + "px");
}

function liquidRelease(event) {
  var node = taffyNode;
  var state = node && node._bwPaTaffy;
  if (!node || !state || (event && state.pointerId !== event.pointerId)) return;
  node._bwPaSuppressClick = state.moved;
  node._bwPaTaffy = null;
  node.classList.remove("bw-pa-pulling");
  node.style.transform = "";
  node.style.removeProperty("--tail-x");
  node.style.removeProperty("--tail-y");
  node.classList.add("bw-pa-release");
  setTimeout(function() { node.classList.remove("bw-pa-release"); }, 620);
  taffyNode = null;
}

function liquidClickGuard(event) {
  var node = event.target.closest(".bw-pa-taffy");
  if (!node || !node._bwPaSuppressClick) return;
  node._bwPaSuppressClick = false;
  block(event);
}

function drag(handle, target) {
  handle.addEventListener("mousedown", function(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    var startX = event.clientX;
    var startY = event.clientY;
    var rect = target.getBoundingClientRect();
    var originX = rect.left;
    var originY = rect.top;
    var moved = false;
    function move(e) {
      if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 3) {
        moved = true;
        target._dragging = true;
      }
      if (!moved) return;
      target.style.left = originX + e.clientX - startX + "px";
      target.style.top = originY + e.clientY - startY + "px";
      target.style.right = "auto";
      target.style.bottom = "auto";
      clamp(target);
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      setTimeout(function() { target._dragging = false; }, 0);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

function clamp(node) {
  if (!node) return;
  var rect = node.getBoundingClientRect();
  var left = rect.left;
  var top = rect.top;
  if (left + rect.width > window.innerWidth - 6) left = window.innerWidth - rect.width - 6;
  if (top + rect.height > window.innerHeight - 6) top = window.innerHeight - rect.height - 6;
  left = Math.max(6, left);
  top = Math.max(6, top);
  node.style.left = left + "px";
  node.style.top = top + "px";
  node.style.right = "auto";
}

function toast(message) {
  var node = document.querySelector(".bw-pa-toast");
  if (!node) {
    node = mark(document.createElement("div"));
    node.className = "bw-pa-toast";
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { node.classList.remove("show"); }, 2200);
}

function copyText(text, ok, fail) {
  function fallback() {
    var input = document.createElement("textarea");
    input.value = text;
    input.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(input);
    input.focus();
    input.select();
    var done = false;
    try { done = document.execCommand("copy"); } catch (err) {}
    input.remove();
    return done;
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(ok, function() {
      fallback() ? ok() : fail();
    });
  } else {
    fallback() ? ok() : fail();
  }
}

function loadAnnos() {
  try {
    var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(function(item) { return item && item.id && item.selector; }) : [];
  } catch (err) {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(annos));
}

function findAnno(id) {
  return annos.filter(function(anno) { return anno.id === id; })[0] || null;
}

function block(event) {
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
}

function colorToHex(value) {
  if (!value || value === "transparent") return null;
  var rgba = value.match(/rgba?\(([^)]+)\)/);
  if (!rgba) return /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
  var parts = rgba[1].split(",").map(function(part) { return part.trim(); });
  if (parts.length === 4 && Number(parts[3]) === 0) return null;
  return "#" + [0, 1, 2].map(function(index) {
    var hex = Math.max(0, Math.min(255, parseInt(parts[index], 10) || 0)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function normalizeWeight(value) {
  if (value === "normal") return "400";
  if (value === "bold") return "700";
  return String(parseInt(value, 10) || 400);
}

function pxNumber(value) {
  return Math.max(0, Math.round(parseFloat(value) || 0));
}

function displayValue(value) {
  return value == null || value === "" ? "transparent" : String(value);
}

function short(value, length) {
  value = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  return value.length > length ? value.slice(0, length - 1) + "…" : value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
  });
}

function plainSpecHtml(value) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").split("\n").map(function(line) {
    return "<p>" + (line ? esc(line) : "<br>") + "</p>";
  }).join("");
}

function sanitizeRichHtml(html) {
  var source = document.createElement("div");
  var output = document.createElement("div");
  var allowed = {P:"p",BR:"br",STRONG:"strong",B:"strong",EM:"em",I:"em",S:"s",STRIKE:"s",CODE:"code",BLOCKQUOTE:"blockquote",UL:"ul",OL:"ol",LI:"li",H2:"h2",H3:"h3",A:"a",DIV:"div"};
  var drop = {SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1,SVG:1,MATH:1};
  source.innerHTML = String(html || "");

  function appendClean(node, parent) {
    if (node.nodeType === 3) {
      parent.appendChild(document.createTextNode(node.nodeValue || ""));
      return;
    }
    if (node.nodeType !== 1 || drop[node.tagName]) return;
    var cleanTag = allowed[node.tagName];
    if (!cleanTag) {
      Array.prototype.forEach.call(node.childNodes, function(child) { appendClean(child, parent); });
      return;
    }
    var clean = document.createElement(cleanTag);
    if (node.tagName === "OL") {
      var listType = String(node.getAttribute("type") || "").toLowerCase();
      var rootStyle = String(node.getAttribute("data-ak47-list-root") || "").toLowerCase();
      if (listType === "a" || listType === "i") clean.setAttribute("type", listType);
      if (/^(decimal|alpha|roman)$/.test(rootStyle)) clean.setAttribute("data-ak47-list-root", rootStyle);
    }
    if (node.tagName === "A") {
      var href = String(node.getAttribute("href") || "").trim();
      if (/^(https?:|mailto:|#)/i.test(href)) clean.setAttribute("href", href);
    }
    Array.prototype.forEach.call(node.childNodes, function(child) { appendClean(child, clean); });
    parent.appendChild(clean);
  }

  Array.prototype.forEach.call(source.childNodes, function(node) { appendClean(node, output); });
  return output.innerHTML;
}

function specHtmlOf(anno) {
  if (anno && anno.specBodyHtml) return sanitizeRichHtml(anno.specBodyHtml);
  return plainSpecHtml(anno && anno.specBody ? anno.specBody : "");
}

function richText(html) {
  var node = document.createElement("div");
  node.innerHTML = sanitizeRichHtml(html);
  return (node.textContent || "").replace(/\u00a0/g, " ").trim();
}

function alphaMarker(number) {
  var value = "";
  while (number > 0) {
    number -= 1;
    value = String.fromCharCode(97 + number % 26) + value;
    number = Math.floor(number / 26);
  }
  return value || "a";
}

function romanMarker(number) {
  var pairs = [[1000,"m"],[900,"cm"],[500,"d"],[400,"cd"],[100,"c"],[90,"xc"],[50,"l"],[40,"xl"],[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]];
  var value = "";
  pairs.forEach(function(pair) {
    while (number >= pair[0]) {
      value += pair[1];
      number -= pair[0];
    }
  });
  return value || "i";
}

function richHtmlToMarkdown(html) {
  var rootNode = document.createElement("div");
  rootNode.innerHTML = sanitizeRichHtml(html);

  function children(node) {
    return Array.prototype.map.call(node.childNodes, walk).join("");
  }

  function block(value) {
    return "\n\n" + value.trim() + "\n\n";
  }

  function listItem(node) {
    var parts = [];
    Array.prototype.forEach.call(node.childNodes, function(child) {
      var value = walk(child);
      if (child.nodeType === 1 && /^(UL|OL)$/.test(child.tagName)) value = "\n" + value.trim().split("\n").map(function(line) { return line ? "    " + line : line; }).join("\n");
      parts.push(value);
    });
    return parts.join("").trim();
  }

  function walk(node) {
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.nodeType !== 1) return "";
    var tag = node.tagName;
    var value = children(node);
    if (tag === "BR") return "\n";
    if (tag === "STRONG" || tag === "B") return "**" + value + "**";
    if (tag === "EM" || tag === "I") return "*" + value + "*";
    if (tag === "S" || tag === "STRIKE") return "~~" + value + "~~";
    if (tag === "CODE") return "`" + value.replace(/`/g, "\\`") + "`";
    if (tag === "A") return node.getAttribute("href") ? "[" + value + "](" + node.getAttribute("href") + ")" : value;
    if (tag === "H2") return block("## " + value.trim());
    if (tag === "H3") return block("### " + value.trim());
    if (tag === "P" || tag === "DIV") return block(value);
    if (tag === "BLOCKQUOTE") return block(value.trim().split("\n").map(function(line) { return "> " + line; }).join("\n"));
    if (tag === "UL" || tag === "OL") {
      var listType = tag === "OL" ? String(node.getAttribute("type") || "").toLowerCase() : "";
      var rows = [];
      Array.prototype.forEach.call(node.children, function(item, index) {
        if (item.tagName !== "LI") return;
        var marker = tag === "UL" ? "- " : listType === "a" ? alphaMarker(index + 1) + ". " : listType === "i" ? romanMarker(index + 1) + ". " : index + 1 + ". ";
        rows.push(marker + listItem(item));
      });
      return block(rows.join("\n"));
    }
    if (tag === "LI") return listItem(node);
    return value;
  }

  return children(rootNode).replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function specMarkdownOf(anno) {
  return anno && anno.specBodyHtml ? richHtmlToMarkdown(anno.specBodyHtml) : String(anno && anno.specBody ? anno.specBody : "").trim();
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, function(char) {
    return "\\" + char.charCodeAt(0).toString(16) + " ";
  });
}

window[NS] = {
  toggle: toggle,
  preview: enterPreview,
  exitPreview: exitPreview,
  exportMarkdown: exportMarkdown,
  exportReview: exportReviewHtml,
  clear: function() {
    annos.forEach(restoreStored);
    annos = [];
    seq = 0;
    persist();
    renderAll();
  }
};

applyAll();
setEnabled(true);
})();
