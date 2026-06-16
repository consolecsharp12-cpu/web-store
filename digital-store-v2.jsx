import { useState, useEffect, useRef } from "react";

const SHARED = true;
const STORE_KEY = "digital-store-items";
const ADMIN_PASSWORD = "console store 2006";

const C = {
  bg:           "#0f0f0f",
  surface:      "#1a1a1a",
  surfaceHover: "#222222",
  surfaceBorder:"#2a2a2a",
  panel:        "#141414",
  titleBar:     "#111111",
  tabBar:       "#161616",
  tabActive:    "#0f0f0f",
  activity:     "#0d0d0d",
  sidebar:      "#141414",
  statusBar:    "#0066b8",
  inputBg:      "#252525",
  inputBorder:  "#333333",
  inputFocus:   "#0078d4",
  accent:       "#0078d4",
  accentHover:  "#1a8fe6",
  accentGlow:   "#0078d420",
  white:        "#e0e0e0",
  dim:          "#777777",
  dimmer:       "#444444",
  border:       "#2a2a2a",
  danger:       "#e05252",
  dangerBg:     "#1a0a0a",
  success:      "#3dc9a0",
  warn:         "#d4a017",
  comment:      "#4d9b5e",
  keyword:      "#4a9cd6",
  string:       "#c28060",
  func:         "#d4c87a",
  type:         "#3dc9a0",
  number:       "#9acd80",
};

const TYPE_COLORS = {
  video:  "#b06ad4",
  pdf:    "#e05252",
  note:   "#3dc9a0",
  image:  "#4a9cd6",
  audio:  "#d4c87a",
  other:  "#666666",
};
const TYPE_ICONS = {
  video:  "▶",
  pdf:    "⬡",
  note:   "✦",
  image:  "◈",
  audio:  "♪",
  other:  "◉",
};
const FILE_EXT = {
  video: ".mp4", pdf: ".pdf", note: ".txt",
  image: ".png", audio: ".mp3", other: "",
};

function getFileType(f) {
  const m = f.type || "";
  if (m.startsWith("video/")) return "video";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("text/")) return "note";
  return "other";
}
function fmtSize(b) {
  if (!b) return "0 B";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function getExt(name) {
  const parts = name.split(".");
  return parts.length > 1 ? "." + parts[parts.length - 1].toLowerCase() : "";
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body {
  background: ${C.bg};
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13px;
  color: ${C.white};
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }

@keyframes fadeIn   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeUp   { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
@keyframes spin     { to { transform:rotate(360deg); } }
@keyframes glow     { 0%,100% { box-shadow:0 0 0 0 ${C.accentGlow}; } 50% { box-shadow:0 0 16px 4px ${C.accentGlow}; } }
@keyframes shimmer  { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
@keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

/* Layout */
.vsc-root   { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
.vsc-titlebar { height:28px; background:${C.titleBar}; display:flex; align-items:center; padding:0 14px; user-select:none; flex-shrink:0; border-bottom:1px solid ${C.border}; }
.vsc-main   { display:flex; flex:1; overflow:hidden; }
.vsc-activity { width:44px; background:${C.activity}; display:flex; flex-direction:column; align-items:center; padding:6px 0; gap:2px; flex-shrink:0; border-right:1px solid ${C.border}; }
.vsc-sidebar { width:230px; background:${C.sidebar}; border-right:1px solid ${C.border}; display:flex; flex-direction:column; flex-shrink:0; overflow:hidden; }
.vsc-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.vsc-tabbar  { height:36px; background:${C.tabBar}; display:flex; align-items:stretch; border-bottom:1px solid ${C.border}; flex-shrink:0; overflow-x:auto; overflow-y:hidden; }
.vsc-tabbar::-webkit-scrollbar { height:2px; }
.vsc-editor  { flex:1; overflow-y:auto; background:${C.bg}; padding:28px 32px; }
.vsc-statusbar { height:22px; background:${C.statusBar}; display:flex; align-items:center; padding:0 12px; gap:16px; flex-shrink:0; }

/* Activity icons */
.act-icon {
  width:44px; height:42px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:${C.dimmer}; font-size:15px; transition:all .15s;
  border-left:2px solid transparent; font-family:'JetBrains Mono', monospace;
}
.act-icon:hover  { color:${C.dim}; background:${C.surfaceHover}; }
.act-icon.active { color:${C.white}; border-left-color:${C.accent}; background:${C.surface}; }
.act-icon .act-label { font-size:8px; color:inherit; letter-spacing:.5px; text-transform:uppercase; margin-top:2px; display:none; }

/* Sidebar */
.sidebar-header { padding:12px 12px 6px; font-size:10px; font-weight:700; letter-spacing:1.5px; color:${C.dimmer}; text-transform:uppercase; user-select:none; }
.sidebar-section { padding:2px 0 8px; }
.sidebar-section-title { padding:5px 12px; font-size:11px; font-weight:600; color:${C.dim}; letter-spacing:.5px; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:6px; user-select:none; transition:color .1s; }
.sidebar-section-title:hover { color:${C.white}; }
.file-item { display:flex; align-items:center; gap:8px; padding:4px 10px 4px 22px; cursor:pointer; color:${C.dim}; font-size:12px; transition:all .1s; white-space:nowrap; overflow:hidden; border-left:2px solid transparent; }
.file-item:hover  { background:${C.surfaceHover}; color:${C.white}; }
.file-item.active { background:#0078d415; color:${C.white}; border-left-color:${C.accent}; }
.file-item .name  { overflow:hidden; text-overflow:ellipsis; flex:1; }
.file-item .ext   { color:${C.dimmer}; font-size:11px; font-family:'JetBrains Mono', monospace; }

/* Tabs */
.vsc-tab { display:flex; align-items:center; gap:6px; padding:0 14px; border-right:1px solid ${C.border}; cursor:pointer; font-size:12px; color:#666; white-space:nowrap; transition:all .1s; min-width:110px; max-width:180px; position:relative; flex-shrink:0; }
.vsc-tab:hover  { background:${C.surfaceHover}; color:${C.white}; }
.vsc-tab.active { background:${C.tabActive}; color:${C.white}; border-top:1px solid ${C.accent}; }
.tab-close { width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:2px; color:#555; font-size:13px; transition:all .1s; margin-left:auto; flex-shrink:0; line-height:1; }
.tab-close:hover { background:#3a3a3a; color:${C.white}; }

/* Breadcrumb */
.breadcrumb { padding:5px 32px; background:${C.panel}; border-bottom:1px solid ${C.border}; font-size:11px; color:${C.dim}; display:flex; align-items:center; gap:5px; flex-shrink:0; font-family:'JetBrains Mono', monospace; }
.breadcrumb .cur { color:${C.white}; }

/* FILE CARDS — Signature element: slim horizontal card with type accent bar */
.file-card {
  background:${C.surface};
  border:1px solid ${C.surfaceBorder};
  border-radius:6px;
  padding:0;
  transition:all .18s cubic-bezier(.25,.46,.45,.94);
  animation:fadeIn .2s ease both;
  cursor:default;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.file-card:hover {
  border-color:${C.accent}55;
  box-shadow:0 4px 20px #00000040, 0 0 0 1px ${C.accent}22;
  transform:translateY(-1px);
}
.file-card-accent { height:2px; width:100%; }
.file-card-body   { padding:14px 16px; flex:1; display:flex; flex-direction:column; }
.file-card-icon   { font-size:18px; font-family:'JetBrains Mono', monospace; margin-bottom:10px; }
.file-card-name   { font-weight:600; font-size:13px; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:${C.white}; }
.file-card-desc   { color:${C.dim}; font-size:11px; margin-bottom:10px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; flex:1; line-height:1.5; }
.file-card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; border-top:1px solid ${C.border}; }
.type-badge { font-size:9px; padding:2px 7px; border-radius:3px; font-weight:700; letter-spacing:.8px; font-family:'JetBrains Mono', monospace; }

/* Input */
.vsc-input { background:${C.inputBg}; border:1px solid ${C.inputBorder}; color:${C.white}; border-radius:4px; padding:7px 10px; font-size:12px; outline:none; width:100%; font-family:inherit; transition:border-color .15s; }
.vsc-input:focus { border-color:${C.accent}; box-shadow:0 0 0 2px ${C.accentGlow}; }
.vsc-input::placeholder { color:${C.dimmer}; }

/* Buttons */
.btn-primary { background:${C.accent}; color:#fff; border:none; border-radius:4px; padding:7px 16px; font-size:12px; font-family:inherit; font-weight:600; cursor:pointer; transition:all .15s; letter-spacing:.2px; }
.btn-primary:hover { background:${C.accentHover}; box-shadow:0 2px 10px ${C.accentGlow}; }
.btn-secondary { background:transparent; color:${C.white}; border:1px solid #3a3a3a; border-radius:4px; padding:7px 14px; font-size:12px; font-family:inherit; cursor:pointer; transition:all .15s; }
.btn-secondary:hover { background:${C.surfaceHover}; border-color:#4a4a4a; }
.btn-icon-sm { background:transparent; border:none; color:${C.dim}; cursor:pointer; padding:4px 7px; border-radius:4px; font-size:12px; transition:all .12s; }
.btn-icon-sm:hover { background:${C.surfaceHover}; color:${C.white}; }
.btn-icon-sm.danger:hover { background:${C.dangerBg}; color:${C.danger}; }

/* Upload zone — improved */
.upload-zone {
  border:1.5px dashed #333;
  border-radius:8px;
  padding:44px 24px;
  text-align:center;
  cursor:pointer;
  transition:all .25s;
  background:${C.panel};
  position:relative;
  overflow:hidden;
}
.upload-zone::before {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(135deg, ${C.accent}06 0%, transparent 60%);
  opacity:0;
  transition:opacity .25s;
}
.upload-zone:hover, .upload-zone.drag {
  border-color:${C.accent};
  background:${C.surface};
  box-shadow:0 0 30px ${C.accentGlow};
}
.upload-zone:hover::before, .upload-zone.drag::before { opacity:1; }
.upload-zone.drag { animation:glow 1s infinite; }
.upload-icon { font-size:36px; margin-bottom:12px; color:${C.dim}; transition:all .2s; font-family:'JetBrains Mono', monospace; }
.upload-zone:hover .upload-icon, .upload-zone.drag .upload-icon { color:${C.accent}; transform:translateY(-3px); }

/* Progress bar */
.prog-track { background:#1e1e1e; border-radius:3px; height:4px; overflow:hidden; margin-top:10px; border:1px solid ${C.border}; }
.prog-fill { height:4px; background:linear-gradient(90deg, ${C.accent}, #00c4ff); border-radius:3px; transition:width .3s ease; }

/* Admin row */
.admin-row { display:grid; align-items:center; gap:10px; padding:8px 12px; border-radius:0; transition:background .1s; animation:fadeIn .15s ease both; }
.admin-row:hover { background:${C.surfaceHover}; }

/* File detail panel */
.file-detail {
  margin-bottom:24px;
  background:${C.surface};
  border:1px solid ${C.surfaceBorder};
  border-radius:8px;
  overflow:hidden;
  animation:fadeIn .2s ease;
}
.file-detail-bar { height:3px; }
.file-detail-body { padding:20px 22px; }

/* Notification */
.notif {
  position:fixed; bottom:28px; right:20px; z-index:9999;
  background:${C.surface}; border:1px solid ${C.surfaceBorder};
  border-left:3px solid ${C.accent}; color:${C.white};
  padding:11px 18px; font-size:12px; border-radius:6px;
  box-shadow:0 8px 30px #00000060; animation:fadeUp .2s ease; min-width:240px;
  display:flex; align-items:center; gap:10px;
}
.notif.err  { border-left-color:${C.danger}; }
.notif.warn { border-left-color:${C.warn}; }
.notif.ok   { border-left-color:${C.success}; }

/* Password screen */
.pw-screen { max-width:340px; margin:80px auto; background:${C.surface}; border:1px solid ${C.surfaceBorder}; border-radius:8px; padding:32px; animation:fadeIn .2s ease; box-shadow:0 20px 60px #00000060; }

/* How-to guide */
.guide-step { display:flex; gap:14px; margin-bottom:22px; }
.step-num { width:22px; height:22px; border-radius:50%; background:${C.accent}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; margin-top:2px; }
.code-block { background:#080808; border:1px solid ${C.surfaceBorder}; border-radius:4px; padding:12px 14px; font-family:'JetBrains Mono', monospace; font-size:11px; color:${C.string}; margin:8px 0; }

/* Syntax */
.kw { color:${C.keyword}; } .fn { color:${C.func}; } .st { color:${C.string}; } .cm { color:${C.comment}; } .tp { color:${C.type}; } .nm { color:${C.number}; }

/* Status bar */
.status-item { font-size:11px; color:#ffffffcc; display:flex; align-items:center; gap:4px; cursor:pointer; padding:0 5px; transition:background .1s; font-family:'JetBrains Mono', monospace; }
.status-item:hover { background:#005599; }

/* Stats cards */
.stat-card { background:${C.surface}; border:1px solid ${C.surfaceBorder}; border-radius:6px; padding:14px 18px; flex:1; min-width:90px; }
.stat-val { font-family:'JetBrains Mono', monospace; font-size:22px; font-weight:700; margin-bottom:2px; }
.stat-label { font-size:10px; color:${C.dim}; text-transform:uppercase; letter-spacing:.6px; }

/* Filter chips */
.chip { font-size:10px; padding:3px 8px; border-radius:3px; cursor:pointer; font-family:'JetBrains Mono', monospace; font-weight:500; transition:all .1s; border:1px solid transparent; letter-spacing:.3px; }
.chip.active { background:${C.accent}; color:#fff; }
.chip.inactive { background:${C.surface}; color:${C.dim}; border-color:${C.border}; }
.chip.inactive:hover { background:${C.surfaceHover}; color:${C.white}; border-color:#3a3a3a; }

/* Toggle arrow */
.arrow { transition:transform .15s; display:inline-block; font-size:9px; }
.arrow.open { transform:rotate(90deg); }

/* Divider */
.divider { height:1px; background:${C.border}; margin:0; }

/* Search wrapper */
.search-wrap { position:relative; }
.search-wrap .search-icon { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:${C.dimmer}; font-size:11px; pointer-events:none; }
.search-wrap input { padding-left:28px; }

/* Upload progress shimmer */
.uploading-name { color:${C.accent}; font-size:13px; font-weight:600; margin-bottom:6px; font-family:'JetBrains Mono', monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px; }
.uploading-sub { font-size:11px; color:${C.dim}; margin-bottom:10px; }

/* Section title */
.section-title { font-size:15px; font-weight:700; color:${C.white}; margin-bottom:14px; padding-bottom:9px; border-bottom:1px solid ${C.border}; }

/* Meta block */
.meta-label { font-size:9px; color:${C.dim}; text-transform:uppercase; letter-spacing:.8px; margin-bottom:3px; }
.meta-val { font-size:12px; font-family:'JetBrains Mono', monospace; color:${C.white}; }

/* Modal overlay */
.modal-overlay { position:fixed; inset:0; background:#00000090; z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(2px); }
.modal-box { background:${C.surface}; border:1px solid #3a3a3a; border-radius:8px; padding:24px; width:100%; max-width:400px; animation:fadeIn .15s ease; box-shadow:0 20px 60px #00000080; }
`;

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("store");
  const [openTabs, setOpenTabs] = useState(["store", "guide"]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [notif, setNotif] = useState(null);
  const [drag, setDrag] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [clock, setClock] = useState("");
  const fileRef = useRef();

  useEffect(() => { loadItems(); }, []);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toTimeString().slice(0, 8)), 1000);
    return () => clearInterval(t);
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const r = await window.storage.get(STORE_KEY, SHARED);
      if (r?.value) setItems(JSON.parse(r.value));
    } catch (_) {}
    setLoading(false);
  }

  async function persist(next) {
    setItems(next);
    await window.storage.set(STORE_KEY, JSON.stringify(next), SHARED);
  }

  function notify(msg, type = "ok") {
    const icons = { ok: "✓", err: "✕", warn: "!" };
    setNotif({ msg, type, icon: icons[type] || "✓" });
    setTimeout(() => setNotif(null), 3500);
  }

  function openTab(id) {
    if (!openTabs.includes(id)) setOpenTabs([...openTabs, id]);
    setActiveTab(id);
  }

  function closeTab(id, e) {
    e.stopPropagation();
    const next = openTabs.filter(t => t !== id);
    setOpenTabs(next);
    if (activeTab === id) setActiveTab(next[next.length - 1] || "store");
  }

  function tryPw() {
    if (pwInput === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setPwError(false);
      setPwInput("");
      notify("Admin access granted");
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 900);
    }
  }

  async function handleUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setUploadCount({ done: 0, total: files.length });
    let cur = [...items];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setUploadName(f.name);
      setUploadPct(Math.round((i / files.length) * 80));
      setUploadCount({ done: i, total: files.length });
      await new Promise(res => {
        const r = new FileReader();
        r.onload = async ev => {
          cur = [...cur, {
            id: `f_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: f.name, description: "", type: getFileType(f),
            size: f.size, mimeType: f.type,
            uploadedAt: new Date().toISOString(),
            dataUrl: ev.target.result, downloads: 0,
          }];
          setUploadPct(Math.round(((i + 1) / files.length) * 100));
          await persist(cur);
          res();
        };
        r.readAsDataURL(f);
      });
    }
    setUploading(false);
    setUploadPct(0);
    setUploadCount({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = "";
    notify(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
  }

  async function deleteItem(id) {
    if (!confirm("Delete this file?")) return;
    await persist(items.filter(i => i.id !== id));
    if (selectedFile === id) setSelectedFile(null);
    notify("File deleted", "warn");
  }

  async function saveEdit() {
    await persist(items.map(i => i.id === editItem.id ? editItem : i));
    setEditItem(null);
    notify("Changes saved");
  }

  function download(item) {
    const a = document.createElement("a");
    a.href = item.dataUrl; a.download = item.name; a.click();
    persist(items.map(i => i.id === item.id ? { ...i, downloads: (i.downloads || 0) + 1 } : i));
    notify(`Downloading "${item.name}"`);
  }

  const filtered = items.filter(it => {
    const tOk = filter === "all" || it.type === filter;
    const sOk = it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.description || "").toLowerCase().includes(search.toLowerCase());
    return tOk && sOk;
  });

  const counts = items.reduce((a, i) => { a[i.type] = (a[i.type] || 0) + 1; return a; }, {});

  const TAB_LABELS = { store: "store.json", admin: "admin.ts", guide: "README.md" };
  const TAB_ICONS_CHAR = { store: "◉", admin: "⚙", guide: "✦" };

  return (
    <div className="vsc-root">
      <style>{css}</style>

      {/* Notification */}
      {notif && (
        <div className={`notif ${notif.type}`}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{notif.icon}</span>
          {notif.msg}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.white }}>Edit File</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 20, fontFamily: "JetBrains Mono, monospace" }}>{editItem.name}</div>
            <label style={{ display: "block", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".6px" }}>Display Name</div>
              <input className="vsc-input" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} />
            </label>
            <label style={{ display: "block", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".6px" }}>Description</div>
              <textarea className="vsc-input" value={editItem.description || ""} rows={3}
                onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                placeholder="What's in this file…" style={{ resize: "vertical" }} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className="vsc-titlebar">
        <div style={{ fontSize: 11, color: C.dimmer, fontFamily: "JetBrains Mono, monospace", letterSpacing: ".5px" }}>
          DATASTORE
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#555", letterSpacing: ".3px" }}>
          visual file manager
        </div>
        <div style={{ fontSize: 11, color: C.dimmer, fontFamily: "JetBrains Mono, monospace" }}>v2</div>
      </div>

      <div className="vsc-main">

        {/* Activity Bar */}
        <div className="vsc-activity">
          <div className={`act-icon${sidebarOpen ? " active" : ""}`}
            title="Explorer" onClick={() => setSidebarOpen(v => !v)}
            style={{ fontSize: 18 }}>
            ⬚
          </div>
          <div style={{ height: 1, width: 24, background: C.border, margin: "4px auto" }} />
          {[
            { id: "store", icon: "◉", title: "Store" },
            { id: "admin", icon: "⚙", title: "Admin" },
            { id: "guide", icon: "✦", title: "Guide" },
          ].map(({ id, icon, title }) => (
            <div key={id} className={`act-icon${activeTab === id ? " active" : ""}`}
              title={title} onClick={() => openTab(id)}
              style={{ fontSize: 16, fontFamily: "JetBrains Mono, monospace" }}>
              {icon}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="vsc-sidebar">
            <div className="sidebar-header">Explorer</div>

            <div style={{ padding: "0 8px 8px" }}>
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input className="vsc-input" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search files…" style={{ fontSize: 12, padding: "5px 8px 5px 26px" }} />
              </div>
            </div>

            <div className="sidebar-section" style={{ flex: 1, overflowY: "auto" }}>
              <div className="sidebar-section-title" onClick={() => setExplorerOpen(v => !v)}>
                <span className={`arrow${explorerOpen ? " open" : ""}`}>▶</span>
                Store <span style={{ color: C.dimmer, marginLeft: 2 }}>({items.length})</span>
              </div>
              {explorerOpen && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 10px 8px" }}>
                    {["all", "video", "pdf", "note", "image", "audio", "other"].map(t => (
                      <span key={t} className={`chip ${filter === t ? "active" : "inactive"}`}
                        onClick={() => setFilter(t)}>
                        {t === "all" ? `all·${items.length}` : `${t}·${counts[t] || 0}`}
                      </span>
                    ))}
                  </div>
                  {loading ? (
                    <div style={{ padding: "8px 22px", color: C.dim, fontSize: 11, fontStyle: "italic" }}>Loading…</div>
                  ) : filtered.length === 0 ? (
                    <div style={{ padding: "8px 22px", color: C.dimmer, fontSize: 11 }}>No files</div>
                  ) : (
                    filtered.map(item => (
                      <div key={item.id}
                        className={`file-item${selectedFile === item.id ? " active" : ""}`}
                        onClick={() => { setSelectedFile(item.id); openTab("store"); }}>
                        <span style={{ fontSize: 12, color: TYPE_COLORS[item.type], fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
                          {TYPE_ICONS[item.type]}
                        </span>
                        <span className="name" style={{ color: selectedFile === item.id ? C.white : C.dim }}>
                          {item.name.replace(/\.[^.]+$/, "")}
                        </span>
                        <span className="ext">{getExt(item.name) || FILE_EXT[item.type]}</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: C.dimmer, fontFamily: "JetBrains Mono, monospace" }}>
                {items.length} files · {fmtSize(items.reduce((a, i) => a + (i.size || 0), 0))}
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="vsc-content">
          <div className="vsc-tabbar">
            {openTabs.map(t => (
              <div key={t} className={`vsc-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: activeTab === t ? TYPE_COLORS[t === "store" ? "image" : t === "admin" ? "video" : "note"] : C.dimmer }}>
                  {TAB_ICONS_CHAR[t]}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{TAB_LABELS[t]}</span>
                <span className="tab-close" onClick={e => closeTab(t, e)}>×</span>
              </div>
            ))}
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>datastore</span>
            <span style={{ color: C.dimmer }}>›</span>
            <span className="cur">{TAB_LABELS[activeTab] || activeTab}</span>
            {activeTab === "store" && selectedFile && (() => {
              const it = items.find(i => i.id === selectedFile);
              return it ? (
                <><span style={{ color: C.dimmer }}>›</span><span className="cur" style={{ color: TYPE_COLORS[it.type] }}>{it.name}</span></>
              ) : null;
            })()}
          </div>

          {/* ── STORE TAB ── */}
          {activeTab === "store" && (
            <div className="vsc-editor">
              {/* Selected file detail */}
              {selectedFile && (() => {
                const it = items.find(i => i.id === selectedFile);
                if (!it) return null;
                return (
                  <div className="file-detail">
                    <div className="file-detail-bar" style={{ background: TYPE_COLORS[it.type] }} />
                    <div className="file-detail-body">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ fontSize: 32, color: TYPE_COLORS[it.type], fontFamily: "JetBrains Mono, monospace", lineHeight: 1, paddingTop: 2 }}>
                          {TYPE_ICONS[it.type]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: C.white }}>{it.name}</div>
                          {it.description && <div style={{ color: C.dim, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{it.description}</div>}
                          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                            {[
                              { label: "Type", val: it.type.toUpperCase(), color: TYPE_COLORS[it.type] },
                              { label: "Size", val: fmtSize(it.size) },
                              { label: "Uploaded", val: fmtDate(it.uploadedAt) },
                              { label: "Downloads", val: it.downloads || 0 },
                            ].map(m => (
                              <div key={m.label}>
                                <div className="meta-label">{m.label}</div>
                                <div className="meta-val" style={{ color: m.color || C.white }}>{m.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => setSelectedFile(null)}>✕</button>
                          <button className="btn-primary" onClick={() => download(it)}>↓ Download</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.comment, marginBottom: 4 }}>
                    // {items.length} files · {filtered.length} shown
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>File Repository</div>
                </div>
                {items.length > 0 && (
                  <div style={{ fontSize: 11, color: C.dim }}>
                    {fmtSize(items.reduce((a, i) => a + (i.size || 0), 0))} total
                  </div>
                )}
              </div>

              {loading ? <Spinner /> : filtered.length === 0 ? (
                <Empty title="No files found"
                  sub={items.length === 0 ? "Open Admin tab to upload files." : "Try a different search or filter."} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
                  {filtered.map((item, idx) => (
                    <div key={item.id} className="file-card" style={{ animationDelay: `${idx * 0.03}s` }}
                      onClick={() => setSelectedFile(item.id)}>
                      <div className="file-card-accent" style={{ background: TYPE_COLORS[item.type] }} />
                      <div className="file-card-body">
                        <div className="file-card-icon" style={{ color: TYPE_COLORS[item.type] }}>
                          {TYPE_ICONS[item.type]}
                        </div>
                        <div className="file-card-name">{item.name}</div>
                        {item.description
                          ? <div className="file-card-desc">{item.description}</div>
                          : <div className="file-card-desc" style={{ color: C.dimmer, fontStyle: "italic" }}>No description</div>
                        }
                        <div className="file-card-footer">
                          <div>
                            <span className="type-badge"
                              style={{ background: `${TYPE_COLORS[item.type]}18`, color: TYPE_COLORS[item.type] }}>
                              {item.type.toUpperCase()}
                            </span>
                            <div style={{ fontSize: 10, color: C.dimmer, marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
                              {fmtSize(item.size)}
                            </div>
                          </div>
                          <button className="btn-primary" style={{ fontSize: 11, padding: "5px 12px" }}
                            onClick={e => { e.stopPropagation(); download(item); }}>
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADMIN — Auth ── */}
          {activeTab === "admin" && !adminUnlocked && (
            <div className="vsc-editor">
              <div className="pw-screen">
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 10, fontFamily: "JetBrains Mono, monospace", color: C.accent }}>⚙</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Admin Access</div>
                  <div style={{ color: C.dim, fontSize: 11 }}>Enter password to continue</div>
                </div>
                <input className="vsc-input" type="password" placeholder="Password…" value={pwInput}
                  onChange={e => setPwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && tryPw()}
                  style={{ marginBottom: 8, borderColor: pwError ? C.danger : undefined,
                    boxShadow: pwError ? `0 0 0 2px ${C.danger}30` : undefined }} />
                {pwError && (
                  <div style={{ color: C.danger, fontSize: 11, marginBottom: 10, textAlign: "center" }}>
                    Incorrect password
                  </div>
                )}
                <button className="btn-primary" style={{ width: "100%", padding: "9px" }} onClick={tryPw}>
                  Unlock
                </button>
              </div>
            </div>
          )}

          {/* ── ADMIN — Unlocked ── */}
          {activeTab === "admin" && adminUnlocked && (
            <div className="vsc-editor">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                <div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.comment, marginBottom: 4 }}>// admin access granted</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>File Management</div>
                </div>
                <button className="btn-secondary" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => { setAdminUnlocked(false); setActiveTab("store"); }}>
                  ⚙ Lock
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
                {[
                  { l: "Files", v: items.length, c: C.keyword },
                  { l: "Downloads", v: items.reduce((a, i) => a + (i.downloads || 0), 0), c: C.type },
                  { l: "Storage Used", v: fmtSize(items.reduce((a, i) => a + (i.size || 0), 0)), c: C.string },
                ].map(s => (
                  <div key={s.l} className="stat-card">
                    <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
                    <div className="stat-label">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Upload zone */}
              <div className={`upload-zone${drag ? " drag" : ""}`} style={{ marginBottom: 22 }}
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); }}
                onDrop={e => { e.preventDefault(); setDrag(false); if (!uploading) handleUpload(Array.from(e.dataTransfer.files)); }}>
                <input ref={fileRef} type="file" multiple style={{ display: "none" }}
                  onChange={e => handleUpload(Array.from(e.target.files))} />
                {uploading ? (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 28, marginBottom: 10, animation: "pulse 1s infinite", fontFamily: "JetBrains Mono, monospace", color: C.accent }}>↑</div>
                    <div className="uploading-name">{uploadName}</div>
                    <div className="uploading-sub">
                      {uploadCount.done + 1} of {uploadCount.total} file{uploadCount.total > 1 ? "s" : ""}
                    </div>
                    <div className="prog-track" style={{ maxWidth: 280, margin: "0 auto" }}>
                      <div className="prog-fill" style={{ width: uploadPct + "%" }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 6, fontFamily: "JetBrains Mono, monospace" }}>
                      {uploadPct}%
                    </div>
                  </div>
                ) : (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div className="upload-icon">↑</div>
                    <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Drop files here</div>
                    <div style={{ color: C.dim, fontSize: 12, marginBottom: 16 }}>
                      or click to browse · supports any file type
                    </div>
                    <button className="btn-primary" style={{ fontSize: 12 }}
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                      Select Files
                    </button>
                  </div>
                )}
              </div>

              {/* File list */}
              {items.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: ".6px" }}>
                    {items.length} files in store
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 100px auto", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.dimmer, textTransform: "uppercase", letterSpacing: ".5px" }}>
                      <span></span><span>Name</span><span>Size</span><span>Date</span><span style={{ textAlign: "right" }}>Actions</span>
                    </div>
                    {items.map((item, idx) => (
                      <div key={item.id} className="admin-row"
                        style={{ gridTemplateColumns: "28px 1fr 80px 100px auto", gap: 10, padding: "7px 14px", borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : "none", animationDelay: `${idx * 0.02}s` }}>
                        <span style={{ fontSize: 14, color: TYPE_COLORS[item.type], fontFamily: "JetBrains Mono, monospace" }}>
                          {TYPE_ICONS[item.type]}
                        </span>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.white, fontWeight: 500 }}>{item.name}</div>
                          {item.description && <div style={{ fontSize: 10, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{item.description}</div>}
                        </div>
                        <span style={{ fontSize: 11, color: C.dim, alignSelf: "center", fontFamily: "JetBrains Mono, monospace" }}>{fmtSize(item.size)}</span>
                        <span style={{ fontSize: 11, color: C.dim, alignSelf: "center" }}>{fmtDate(item.uploadedAt)}</span>
                        <div style={{ display: "flex", gap: 3, justifyContent: "flex-end", alignSelf: "center" }}>
                          <button className="btn-icon-sm" title="Edit" onClick={() => setEditItem({ ...item })}>✎</button>
                          <button className="btn-icon-sm" title="Download" onClick={() => download(item)}>↓</button>
                          <button className="btn-icon-sm danger" title="Delete" onClick={() => deleteItem(item.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GUIDE TAB ── */}
          {activeTab === "guide" && (
            <div className="vsc-editor" style={{ maxWidth: 660 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: C.comment, marginBottom: 14 }}># README.md</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>How to Use DataStore</div>
              <div style={{ color: C.dim, fontSize: 12, marginBottom: 32, lineHeight: 1.5 }}>
                A guide for visitors and the store owner.
              </div>

              <GuideSection title="For Visitors — Download Files">
                {[
                  { n: 1, title: "Open the Store tab", body: <>Click the <Chip>◉ Store</Chip> icon in the activity bar or the <Chip>store.json</Chip> tab.</> },
                  { n: 2, title: "Browse or search", body: "Use the sidebar to browse files by type. The search box filters by name or description." },
                  { n: 3, title: "Click a file → Download", body: <>Select any card to preview its details, then hit <Chip accent>↓ Download</Chip> to save.</> },
                ].map(s => <GuideStep key={s.n} n={s.n} title={s.title}>{s.body}</GuideStep>)}
              </GuideSection>

              <GuideSection title="For Owner — Upload Files">
                {[
                  { n: 1, title: "Open Admin tab", body: <>Click <Chip>⚙ Admin</Chip> in the activity bar. A password screen will appear.</> },
                  { n: 2, title: "Enter your password", body: <><div style={{ marginBottom: 6 }}>Type the password and press Enter or click Unlock.</div><div className="code-block"><span className="kw">password</span>: <span className="st">"console store 2006"</span></div></> },
                  { n: 3, title: "Upload files", body: <><b style={{ color: C.white }}>Drag & drop</b> files onto the upload zone, or click it to open a file picker. Multiple files supported.</> },
                  { n: 4, title: "Edit or delete", body: <>Use <Chip>✎</Chip> to rename or add a description, <Chip>↓</Chip> to re-download, and <Chip danger>✕</Chip> to delete.</> },
                  { n: 5, title: "Lock when done", body: "Click the Lock button in the top right of Admin panel. Visitors will never see the upload area." },
                ].map(s => <GuideStep key={s.n} n={s.n} title={s.title}>{s.body}</GuideStep>)}
              </GuideSection>

              <GuideSection title="Supported File Types">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {[
                    { type: "video", exts: "mp4, mov, avi…" },
                    { type: "pdf",   exts: "pdf" },
                    { type: "image", exts: "png, jpg, gif…" },
                    { type: "audio", exts: "mp3, wav, ogg…" },
                    { type: "note",  exts: "txt, md, csv…" },
                    { type: "other", exts: "zip, exe, psd…" },
                  ].map(f => (
                    <div key={f.type} style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: 6, padding: "12px 14px", borderTop: `2px solid ${TYPE_COLORS[f.type]}` }}>
                      <div style={{ fontSize: 16, fontFamily: "JetBrains Mono, monospace", color: TYPE_COLORS[f.type], marginBottom: 6 }}>{TYPE_ICONS[f.type]}</div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: C.white, marginBottom: 2 }}>{f.type}</div>
                      <div style={{ fontSize: 10, color: C.dim }}>{f.exts}</div>
                    </div>
                  ))}
                </div>
              </GuideSection>

              <GuideSection title="Tips">
                {[
                  ["◉", "Files are stored in shared storage — visible to anyone with the link."],
                  ["◈", "Best for files under 5 MB. Large videos may exceed storage limits."],
                  ["✦", "Add descriptions so visitors know what they're downloading."],
                  ["⚙", "Always click Lock when done in Admin mode."],
                ].map(([icon, tip], i) => (
                  <div key={i} style={{ display: "flex", gap: 12, fontSize: 12, color: C.dim, marginBottom: 10, lineHeight: 1.5 }}>
                    <span style={{ color: C.accent, fontFamily: "JetBrains Mono, monospace", flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </GuideSection>
            </div>
          )}

          {/* Status Bar */}
          <div className="vsc-statusbar">
            <div className="status-item">⎇ main</div>
            <div className="status-item">◉ {items.length} files</div>
            <div className="status-item" style={{ marginLeft: "auto" }}>{clock}</div>
            <div className="status-item">UTF-8</div>
            <div className="status-item">DataStore v2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideSection({ title, children }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}
function GuideStep({ n, title, children }) {
  return (
    <div className="guide-step">
      <div className="step-num">{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 5, color: "#d0d0d0", fontSize: 13 }}>{title}</div>
        <div style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}
function Chip({ children, accent, danger }) {
  return (
    <span style={{
      display: "inline-block", padding: "1px 7px", borderRadius: 3,
      background: accent ? "#0078d422" : danger ? "#e0525222" : "#2a2a2a",
      color: accent ? "#4a9cd6" : danger ? "#e05252" : "#c0c0c0",
      border: `1px solid ${accent ? "#0078d440" : danger ? "#e0525240" : "#3a3a3a"}`,
      fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 500,
    }}>
      {children}
    </span>
  );
}
function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ width: 20, height: 20, border: "2px solid #2a2a2a", borderTopColor: "#0078d4", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 10px" }} />
      <div style={{ fontSize: 11, color: "#555" }}>Loading…</div>
    </div>
  );
}
function Empty({ title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", color: "#555" }}>
      <div style={{ fontSize: 32, marginBottom: 14, fontFamily: "JetBrains Mono, monospace", color: "#333" }}>◈</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#888", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}
