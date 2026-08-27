import React, { useState, useEffect, useMemo } from "react";
import logoImg from "./assets/logoCC.png";
import {
  Users, UserPlus, FileText, Wallet, CalendarDays, Settings as SettingsIcon,
  LogOut, Plus, Printer, X, Trash2, Pencil, Ban, Landmark, ClipboardList,
  LayoutDashboard, Search, Check, AlertTriangle, ChevronLeft, ChevronRight,
  Image as ImageIcon, CalendarRange, Paperclip, ShieldAlert, QrCode, IdCard
} from "lucide-react";

/* ============================== helpers ============================== */

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const THAI_MONTHS_FULL = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function isThaiId13(id) { return /^[0-9]{13}$/.test((id || "").trim()); }

function compressImage(file, maxWidth = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toThaiDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function genId(prefix) { return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; }
function padNo(n, len = 4) { return String(n).padStart(len, "0"); }

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, true);
    return res ? JSON.parse(res.value) : fallback;
  } catch (e) { return fallback; }
}
async function saveKey(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), true); }
  catch (e) { console.error("save failed", key, e); }
}

const STATUS_LABEL = { active: "ใช้งาน", resigned: "ลาออก", deceased: "เสียชีวิต" };
const STATUS_COLOR = { active: "bg-emerald-100 text-emerald-800", resigned: "bg-amber-100 text-amber-800", deceased: "bg-slate-200 text-slate-700" };

/* ============================== small UI atoms ============================== */

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center p-4 overflow-y-auto z-50">
      <div className={`bg-white rounded-lg shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} mt-10 mb-10`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600 font-medium mt-1">{error}</span>}
    </label>
  );
}
const inputCls = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
const inputInvalidCls = "border-red-400 focus:ring-red-500 focus:border-red-500";
function TextInput({ invalid, className, ...props }) {
  return <input {...props} className={`${inputCls} ${invalid ? inputInvalidCls : ""} ${className || ""}`} />;
}
function Select({ invalid, className, ...props }) {
  return <select {...props} className={`${inputCls} ${invalid ? inputInvalidCls : ""} ${className || ""}`} />;
}
function Btn({ children, variant = "primary", className = "", ...rest }) {
  const styles = {
    primary: "bg-emerald-700 hover:bg-emerald-800 text-white",
    ghost: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    subtle: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  };
  return (
    <button {...rest} className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md transition ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
function Badge({ status }) { return <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>; }
function EmptyRow({ colSpan, text }) { return <tr><td colSpan={colSpan} className="text-center text-slate-400 py-8 text-sm">{text}</td></tr>; }
function ConfirmModal({ title, message, onCancel, onConfirm, danger }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>ยกเลิก</Btn>
        <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}><Check size={15}/> ยืนยัน</Btn>
      </div>
    </Modal>
  );
}
function ImageLightbox({ src, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-6 z-50 print:hidden" onClick={onClose}>
      <img src={src} alt="สลิปการโอนเงิน" className="max-w-full max-h-full rounded-md shadow-2xl" onClick={e=>e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-5 right-5 text-white"><X size={26}/></button>
    </div>
  );
}

/* ============================== app ============================== */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");

  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [deathCalcs, setDeathCalcs] = useState([]);
  const [settings, setSettings] = useState({ associationName: "สมาคมฌาปนกิจสงเคราะห์", monthlyRate: 20, bankAccounts: [] });

  useEffect(() => {
    (async () => {
      const [u, m, c, v, d, s] = await Promise.all([
        loadKey("users", []),
        loadKey("members", []),
        loadKey("coordinators", []),
        loadKey("vouchers", []),
        loadKey("death-calcs", []),
        loadKey("settings", { associationName: "สมาคมฌาปนกิจสงเคราะห์", monthlyRate: 20, bankAccounts: [] }),
      ]);
      setUsers(u); setMembers(m); setCoordinators(c); setVouchers(v); setDeathCalcs(d); setSettings(s);
      setLoading(false);
    })();
  }, []);

  async function persistUsers(next) { setUsers(next); await saveKey("users", next); }
  async function persistMembers(next) { setMembers(next); await saveKey("members", next); }
  async function persistCoordinators(next) { setCoordinators(next); await saveKey("coordinators", next); }
  async function persistVouchers(next) { setVouchers(next); await saveKey("vouchers", next); }
  async function persistDeathCalcs(next) { setDeathCalcs(next); await saveKey("death-calcs", next); }
  async function persistSettings(next) { setSettings(next); await saveKey("settings", next); }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-slate-500 text-sm">กำลังโหลดข้อมูล…</div>;
  }

  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onCreateFirstAdmin={async (u) => { await persistUsers([u]); setCurrentUser(u); }}
        onLogin={setCurrentUser}
        assocName={settings.associationName}
      />
    );
  }

  const nav = [
    { id: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { id: "members", label: "งานสมาชิก", icon: Users },
    { id: "registration", label: "งานทะเบียน", icon: ClipboardList },
    { id: "financial", label: "งานการเงิน", icon: Wallet },
    { id: "reports", label: "รายงานประจำวัน", icon: CalendarDays },
  ];
  if (currentUser.role === "admin") nav.push({ id: "settings", label: "ตั้งค่า/ผู้ใช้งาน", icon: SettingsIcon });

  return (
    <div className="min-h-screen bg-stone-50 flex text-slate-800">
      {/* sidebar */}
      <aside className="w-56 bg-slate-900 text-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="px-5 py-5 border-b border-slate-700/60 flex items-center gap-3">
          <img src={logoImg} alt="โลโก้" className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div>
            <div className="text-emerald-400 text-xs tracking-widest font-semibold">ฌาปนกิจสงเคราะห์</div>
            <div className="text-sm font-medium mt-1 leading-snug">{settings.associationName}</div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {nav.map(n => {
            const Icon = n.icon;
            const activeCls = view === n.id ? "bg-slate-800 text-white border-l-2 border-emerald-400" : "text-slate-300 hover:bg-slate-800/60 border-l-2 border-transparent";
            return (
              <button key={n.id} onClick={() => setView(n.id)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm ${activeCls}`}>
                <Icon size={16} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-700/60 text-xs">
          <div className="text-slate-400">ผู้ใช้งาน</div>
          <div className="font-medium text-slate-100">{currentUser.name} <span className="text-slate-400">({currentUser.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"})</span></div>
          <button onClick={() => setCurrentUser(null)} className="mt-3 flex items-center gap-1.5 text-rose-300 hover:text-rose-200"><LogOut size={13} /> ออกจากระบบ</button>
        </div>
      </aside>

      {/* content */}
      <main className="flex-1 min-w-0">
        {view === "dashboard" && <Dashboard members={members} vouchers={vouchers} settings={settings} />}
        {view === "members" && (
          <MembersView
            members={members} setMembers={persistMembers}
            coordinators={coordinators} setCoordinators={persistCoordinators}
            settings={settings} currentUser={currentUser}
          />
        )}
        {view === "registration" && (
          <RegistrationView
            members={members} setMembers={persistMembers}
            coordinators={coordinators}
            deathCalcs={deathCalcs} setDeathCalcs={persistDeathCalcs}
            vouchers={vouchers} setVouchers={persistVouchers}
            settings={settings} currentUser={currentUser}
          />
        )}
        {view === "financial" && (
          <FinancialView
            vouchers={vouchers} setVouchers={persistVouchers}
            members={members} settings={settings} currentUser={currentUser}
          />
        )}
        {view === "reports" && <ReportsView vouchers={vouchers} settings={settings} />}
        {view === "settings" && currentUser.role === "admin" && (
          <SettingsView settings={settings} setSettings={persistSettings} users={users} setUsers={persistUsers} currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}

/* ============================== login ============================== */

function LoginScreen({ users, onCreateFirstAdmin, onLogin, assocName }) {
  const firstRun = users.length === 0;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");
    if (firstRun) {
      if (!username.trim() || !password) { setError("กรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบ"); return; }
      onCreateFirstAdmin({ id: genId("USR"), name: username.trim(), username: username.trim(), password, role: "admin", active: true });
      return;
    }
    const u = users.find(u => u.username === username.trim() && u.password === password && u.active !== false);
    if (!u) { setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); return; }
    onLogin(u);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-7">
        <div className="text-center mb-6">
          <img src={logoImg} alt="โลโก้สมาคม" className="w-20 h-20 mx-auto mb-3 object-contain rounded-full" />
          <h1 className="font-semibold text-lg text-slate-900">{assocName}</h1>
          <p className="text-sm text-slate-500 mt-1">ระบบบริหารงานฌาปนกิจสงเคราะห์</p>
        </div>
        {firstRun && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-3 mb-4 flex gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>ยังไม่มีผู้ใช้งานในระบบ — ตั้งชื่อผู้ใช้งานและรหัสผ่านด้านล่างเพื่อสร้างบัญชี "ผู้ดูแลระบบ" คนแรก</span>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="ชื่อผู้ใช้งาน"><TextInput value={username} onChange={e => setUsername(e.target.value)} autoFocus /></Field>
          <Field label="รหัสผ่าน"><TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
          {error && <p className="text-rose-600 text-sm font-medium mb-3">{error}</p>}
          <Btn className="w-full justify-center" >{firstRun ? "สร้างบัญชีและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</Btn>
        </form>
        <p className="text-xs text-slate-500 mt-5 text-center leading-relaxed">
          ระบบนี้ใช้สำหรับควบคุมการเข้าถึงภายในสมาคมเบื้องต้นเท่านั้น<br />ไม่ใช่ระบบยืนยันตัวตนระดับองค์กร
        </p>
      </div>
    </div>
  );
}

/* ============================== dashboard ============================== */

function Dashboard({ members, vouchers, settings }) {
  const active = members.filter(m => m.status === "active").length;
  const resigned = members.filter(m => m.status === "resigned").length;
  const deceased = members.filter(m => m.status === "deceased").length;
  const today = todayISO();
  const todays = vouchers.filter(v => v.date === today && !v.cancelled);
  const receiptToday = todays.filter(v => v.type === "receipt").reduce((s, v) => s + Number(v.amount), 0);
  const paymentToday = todays.filter(v => v.type === "payment").reduce((s, v) => s + Number(v.amount), 0);
  const cashBalance = vouchers.filter(v => !v.cancelled && v.method === "cash")
    .reduce((s, v) => s + (v.type === "receipt" ? Number(v.amount) : -Number(v.amount)), 0);
  const bankBalance = vouchers.filter(v => !v.cancelled && v.method === "bank")
    .reduce((s, v) => s + (v.type === "receipt" ? Number(v.amount) : -Number(v.amount)), 0);

  const cards = [
    { label: "สมาชิกที่ใช้งาน", value: active, sub: `ลาออก ${resigned} · เสียชีวิต ${deceased}`, color: "text-emerald-700" },
    { label: "รับเงินวันนี้", value: `฿${money(receiptToday)}`, sub: `${todays.filter(v=>v.type==='receipt').length} รายการ`, color: "text-emerald-700" },
    { label: "จ่ายเงินวันนี้", value: `฿${money(paymentToday)}`, sub: `${todays.filter(v=>v.type==='payment').length} รายการ`, color: "text-rose-700" },
    { label: "เงินสดคงเหลือ", value: `฿${money(cashBalance)}`, sub: `เงินฝากธนาคาร ฿${money(bankBalance)}`, color: "text-slate-800" },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">แดชบอร์ด</h1>
      <p className="text-sm text-slate-500 mb-6">{settings.associationName} · {toThaiDate(today)}</p>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="text-xs text-slate-500 mb-2">{c.label}</div>
            <div className={`text-2xl font-semibold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-400 mt-2">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">รายการล่าสุด</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="pb-2 font-medium">วันที่</th><th className="pb-2 font-medium">ประเภท</th><th className="pb-2 font-medium">รายการ</th><th className="pb-2 font-medium text-right">จำนวนเงิน</th>
          </tr></thead>
          <tbody>
            {vouchers.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,8).map(v => (
              <tr key={v.id} className="border-b border-slate-50">
                <td className="py-2">{toThaiDate(v.date)}</td>
                <td className="py-2">{v.type === "receipt" ? <span className="text-emerald-700">รับเงิน</span> : <span className="text-rose-700">จ่ายเงิน</span>}{v.cancelled && <span className="text-slate-400"> (ยกเลิก)</span>}</td>
                <td className="py-2">{v.category} — {v.partyName || "-"}</td>
                <td className="py-2 text-right">฿{money(v.amount)}</td>
              </tr>
            ))}
            {vouchers.length === 0 && <EmptyRow colSpan={4} text="ยังไม่มีรายการ" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== members ============================== */

function MembersView({ members, setMembers, coordinators, setCoordinators, settings, currentUser }) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null); // member obj or "new" or null
  const [coordEditing, setCoordEditing] = useState(null);
  const [printMode, setPrintMode] = useState(false);

  const filtered = members.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search && !(`${m.name} ${m.memberNo} ${m.village}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  function saveMember(data) {
    if (data.id) {
      setMembers(members.map(m => m.id === data.id ? data : m));
    } else {
      const memberNo = "ท-" + padNo(members.length + 1);
      setMembers([...members, { ...data, id: genId("MEM"), memberNo, history: [{ at: Date.now(), by: currentUser.name, note: "สมัครสมาชิกใหม่" }] }]);
    }
    setEditing(null);
  }
  function saveCoordinator(data) {
    if (data.id) setCoordinators(coordinators.map(c => c.id === data.id ? data : c));
    else setCoordinators([...coordinators, { ...data, id: genId("COORD") }]);
    setCoordEditing(null);
  }
  function removeCoordinator(id) { setCoordinators(coordinators.filter(c => c.id !== id)); }

  if (printMode) return <MemberListPrint members={filtered} settings={settings} onClose={() => setPrintMode(false)} />;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-800">งานสมาชิก</h1>
        <div className="flex gap-2">
          {tab === "list" && <Btn variant="ghost" onClick={() => setPrintMode(true)}><Printer size={15}/> พิมพ์รายชื่อสมาชิก</Btn>}
          {tab === "list" && <Btn onClick={() => setEditing("new")}><Plus size={15}/> เพิ่มสมาชิก</Btn>}
          {tab === "coordinators" && <Btn onClick={() => setCoordEditing("new")}><Plus size={15}/> เพิ่มผู้ประสานงาน</Btn>}
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        <button onClick={()=>setTab("list")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab==="list"?"border-emerald-600 text-emerald-700":"border-transparent text-slate-500"}`}>ทะเบียนสมาชิก</button>
        <button onClick={()=>setTab("coordinators")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab==="coordinators"?"border-emerald-600 text-emerald-700":"border-transparent text-slate-500"}`}>ผู้ประสานงาน</button>
      </div>

      {tab === "list" && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input className={inputCls + " pl-8"} placeholder="ค้นหาชื่อ / เลขทะเบียน / หมู่บ้าน" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-44">
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งาน</option>
              <option value="resigned">ลาออก</option>
              <option value="deceased">เสียชีวิต</option>
            </Select>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">เลขทะเบียน</th>
                  <th className="text-left px-4 py-3 font-medium">ชื่อ-สกุล</th>
                  <th className="text-left px-4 py-3 font-medium">หมู่บ้าน</th>
                  <th className="text-left px-4 py-3 font-medium">ผู้ประสานงาน</th>
                  <th className="text-left px-4 py-3 font-medium">วันที่สมัคร</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{m.memberNo}</td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">{m.village || "-"}</td>
                    <td className="px-4 py-3">{coordinators.find(c=>c.id===m.coordinatorId)?.name || "-"}</td>
                    <td className="px-4 py-3">{toThaiDate(m.joinDate)}</td>
                    <td className="px-4 py-3"><Badge status={m.status} /></td>
                    <td className="px-4 py-3 text-right"><button onClick={()=>setEditing(m)} className="text-slate-400 hover:text-emerald-700"><Pencil size={15}/></button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={7} text="ไม่พบข้อมูลสมาชิก" />}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "coordinators" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>
              <th className="text-left px-4 py-3 font-medium">ชื่อผู้ประสานงาน</th>
              <th className="text-left px-4 py-3 font-medium">หมู่บ้าน / กองทุน</th>
              <th className="text-left px-4 py-3 font-medium">เบอร์โทร</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {coordinators.map(c => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.village}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3 text-right flex gap-3 justify-end">
                    <button onClick={()=>setCoordEditing(c)} className="text-slate-400 hover:text-emerald-700"><Pencil size={15}/></button>
                    <button onClick={()=>removeCoordinator(c.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={15}/></button>
                  </td>
                </tr>
              ))}
              {coordinators.length === 0 && <EmptyRow colSpan={4} text="ยังไม่มีผู้ประสานงาน" />}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <MemberFormModal member={editing === "new" ? null : editing} coordinators={coordinators} settings={settings}
          onClose={()=>setEditing(null)} onSave={saveMember} />
      )}
      {coordEditing && (
        <CoordinatorFormModal coordinator={coordEditing === "new" ? null : coordEditing} onClose={()=>setCoordEditing(null)} onSave={saveCoordinator} />
      )}
    </div>
  );
}

function MemberFormModal({ member, coordinators, settings, onClose, onSave }) {
  const [f, setF] = useState(member || {
    name: "", idCard: "", address: "", village: "", phone: "",
    coordinatorId: "", joinDate: todayISO(), status: "active",
    monthlyRate: settings.monthlyRate,
    beneficiaryName: "", beneficiaryRelation: "", beneficiaryPhone: "",
    notes: ""
  });
  const [errors, setErrors] = useState({});
  function set(k,v){ setF(prev=>({...prev,[k]:v})); }

  function validate() {
    const e = {};
    if (!f.name?.trim()) e.name = "กรุณากรอกชื่อ-สกุล";
    if (!f.idCard?.trim()) e.idCard = "กรุณากรอกเลขบัตรประชาชน";
    else if (!isThaiId13(f.idCard)) e.idCard = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
    if (!f.village?.trim()) e.village = "กรุณากรอกหมู่บ้าน / กองทุน";
    if (!f.phone?.trim()) e.phone = "กรุณากรอกเบอร์โทร";
    if (!f.joinDate) e.joinDate = "กรุณาเลือกวันที่สมัคร";
    return e;
  }
  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(f);
  }

  return (
    <Modal title={member ? `แก้ไขสมาชิก · ${member.memberNo}` : "เพิ่มสมาชิกใหม่"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="ชื่อ-สกุล" error={errors.name}><TextInput invalid={!!errors.name} value={f.name} onChange={e=>set("name",e.target.value)} /></Field>
        <Field label="เลขบัตรประชาชน (13 หลัก)" error={errors.idCard}>
          <TextInput invalid={!!errors.idCard} value={f.idCard} maxLength={13} inputMode="numeric"
            onChange={e=>set("idCard", e.target.value.replace(/\D/g,"").slice(0,13))} placeholder="เลข 13 หลัก ไม่ต้องมีขีด" />
        </Field>
        <Field label="ที่อยู่"><TextInput value={f.address} onChange={e=>set("address",e.target.value)} /></Field>
        <Field label="หมู่บ้าน / กองทุน" error={errors.village}><TextInput invalid={!!errors.village} value={f.village} onChange={e=>set("village",e.target.value)} /></Field>
        <Field label="เบอร์โทร" error={errors.phone}><TextInput invalid={!!errors.phone} value={f.phone} onChange={e=>set("phone",e.target.value)} /></Field>
        <Field label="ผู้ประสานงาน">
          <Select value={f.coordinatorId} onChange={e=>set("coordinatorId",e.target.value)}>
            <option value="">— ไม่ระบุ —</option>
            {coordinators.map(c => <option key={c.id} value={c.id}>{c.name} ({c.village})</option>)}
          </Select>
        </Field>
        <Field label="วันที่สมัคร" error={errors.joinDate}><TextInput invalid={!!errors.joinDate} type="date" value={f.joinDate} onChange={e=>set("joinDate",e.target.value)} /></Field>
        <Field label="อัตราเงินสงเคราะห์รายเดือน (บาท)"><TextInput type="number" value={f.monthlyRate} onChange={e=>set("monthlyRate",e.target.value)} /></Field>
        <Field label="สถานะสมาชิก">
          <Select value={f.status} onChange={e=>set("status",e.target.value)}>
            <option value="active">ใช้งาน</option>
            <option value="resigned">ลาออก</option>
            <option value="deceased">เสียชีวิต</option>
          </Select>
        </Field>
        <div />
        <Field label="ผู้รับผลประโยชน์ — ชื่อ"><TextInput value={f.beneficiaryName} onChange={e=>set("beneficiaryName",e.target.value)} /></Field>
        <Field label="ความสัมพันธ์"><TextInput value={f.beneficiaryRelation} onChange={e=>set("beneficiaryRelation",e.target.value)} /></Field>
        <Field label="เบอร์โทรผู้รับผลประโยชน์"><TextInput value={f.beneficiaryPhone} onChange={e=>set("beneficiaryPhone",e.target.value)} /></Field>
        <div />
      </div>
      <Field label="หมายเหตุ"><TextInput value={f.notes} onChange={e=>set("notes",e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={handleSave}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}

function CoordinatorFormModal({ coordinator, onClose, onSave }) {
  const [f, setF] = useState(coordinator || { name: "", village: "", phone: "" });
  const [errors, setErrors] = useState({});
  function validate() {
    const e = {};
    if (!f.name?.trim()) e.name = "กรุณากรอกชื่อ-สกุล";
    if (!f.village?.trim()) e.village = "กรุณากรอกหมู่บ้าน / กองทุน";
    if (!f.phone?.trim()) e.phone = "กรุณากรอกเบอร์โทร";
    return e;
  }
  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(f);
  }
  return (
    <Modal title={coordinator ? "แก้ไขผู้ประสานงาน" : "เพิ่มผู้ประสานงาน"} onClose={onClose}>
      <Field label="ชื่อ-สกุล" error={errors.name}><TextInput invalid={!!errors.name} value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></Field>
      <Field label="หมู่บ้าน / กองทุนหมู่บ้าน" error={errors.village}><TextInput invalid={!!errors.village} value={f.village} onChange={e=>setF({...f,village:e.target.value})} /></Field>
      <Field label="เบอร์โทร" error={errors.phone}><TextInput invalid={!!errors.phone} value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={handleSave}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}

function MemberListPrint({ members, settings, onClose }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Btn variant="ghost" onClick={onClose}><X size={15}/> ปิด</Btn>
        <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์</Btn>
      </div>
      <div className="bg-white border border-slate-200 p-8 print:border-0">
        <h1 className="text-center font-semibold text-lg">{settings.associationName}</h1>
        <h2 className="text-center text-sm text-slate-500 mb-6">รายงานรายชื่อสมาชิก ณ วันที่ {toThaiDate(todayISO())}</h2>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b-2 border-slate-800 text-left">
            <th className="py-2 pr-2">เลขทะเบียน</th><th className="py-2 pr-2">ชื่อ-สกุล</th><th className="py-2 pr-2">หมู่บ้าน</th><th className="py-2 pr-2">วันที่สมัคร</th><th className="py-2">สถานะ</th>
          </tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-slate-200">
                <td className="py-1.5 pr-2 font-mono text-xs">{m.memberNo}</td>
                <td className="py-1.5 pr-2">{m.name}</td>
                <td className="py-1.5 pr-2">{m.village}</td>
                <td className="py-1.5 pr-2">{toThaiDate(m.joinDate)}</td>
                <td className="py-1.5">{STATUS_LABEL[m.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-500 mt-6">รวมทั้งสิ้น {members.length} ราย</p>
      </div>
    </div>
  );
}

/* ============================== registration ============================== */

function RegistrationView({ members, setMembers, coordinators, deathCalcs, setDeathCalcs, vouchers, setVouchers, settings, currentUser }) {
  const [action, setAction] = useState(null);
  const [printApp, setPrintApp] = useState(null);
  const [printCalc, setPrintCalc] = useState(null);

  const actions = [
    { id: "new", title: "บันทึกสมาชิกเข้าใหม่", desc: "เพิ่มทะเบียนสมาชิกใหม่เข้าสู่ระบบ", icon: UserPlus },
    { id: "print-app", title: "พิมพ์ใบสมัครสมาชิก", desc: "เลือกสมาชิกเพื่อพิมพ์ใบสมัคร", icon: Printer },
    { id: "change-beneficiary", title: "เปลี่ยนผู้รับผลประโยชน์", desc: "แก้ไขข้อมูลผู้รับผลประโยชน์ของสมาชิก", icon: Pencil },
    { id: "change-coordinator", title: "เปลี่ยนผู้ประสานงาน", desc: "ย้ายสมาชิกไปยังผู้ประสานงานคนอื่น", icon: Pencil },
    { id: "death-calc", title: "คำนวณเงินสงเคราะห์ (กรณีเสียชีวิต)", desc: "คำนวณและพิมพ์ใบคำนวณเงินสงเคราะห์", icon: FileText },
  ];

  if (printApp) return <ApplicationPrint member={printApp} settings={settings} onClose={()=>setPrintApp(null)} />;
  if (printCalc) return <DeathCalcPrint calc={printCalc} settings={settings} onClose={()=>setPrintCalc(null)} />;

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">งานทะเบียน</h1>
      <p className="text-sm text-slate-500 mb-6">จัดการงานทะเบียนสมาชิก การเปลี่ยนแปลงข้อมูลสำคัญ และการคำนวณเงินสงเคราะห์</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={()=>setAction(a.id)} className="text-left bg-white border border-slate-200 rounded-lg p-5 hover:border-emerald-400 hover:shadow-sm transition">
              <Icon size={20} className="text-emerald-700 mb-3" />
              <div className="font-medium text-sm text-slate-800">{a.title}</div>
              <div className="text-xs text-slate-500 mt-1">{a.desc}</div>
            </button>
          );
        })}
      </div>

      {action === "new" && (
        <MemberFormModal coordinators={coordinators} settings={settings} onClose={()=>setAction(null)}
          onSave={(data)=>{
            const memberNo = "ท-" + padNo(members.length + 1);
            setMembers([...members, { ...data, id: genId("MEM"), memberNo, history: [{at:Date.now(), by: currentUser.name, note:"สมัครสมาชิกใหม่ (งานทะเบียน)"}] }]);
            setAction(null);
          }} />
      )}

      {action === "print-app" && (
        <PickMemberModal members={members} title="เลือกสมาชิกเพื่อพิมพ์ใบสมัคร" onClose={()=>setAction(null)}
          onPick={(m)=>{ setAction(null); setPrintApp(m); }} />
      )}

      {action === "change-beneficiary" && (
        <PickMemberModal members={members.filter(m=>m.status!=="deceased")} title="เลือกสมาชิกเพื่อเปลี่ยนผู้รับผลประโยชน์" onClose={()=>setAction(null)}
          onPick={(m)=>setAction({type:"beneficiary-form", member:m})} />
      )}
      {action?.type === "beneficiary-form" && (
        <BeneficiaryFormModal member={action.member} onClose={()=>setAction(null)}
          onSave={(m2)=>{
            setMembers(members.map(m=>m.id===m2.id?m2:m));
            setAction(null);
          }} currentUser={currentUser} />
      )}

      {action === "change-coordinator" && (
        <PickMemberModal members={members.filter(m=>m.status!=="deceased")} title="เลือกสมาชิกเพื่อเปลี่ยนผู้ประสานงาน" onClose={()=>setAction(null)}
          onPick={(m)=>setAction({type:"coordinator-form", member:m})} />
      )}
      {action?.type === "coordinator-form" && (
        <CoordinatorChangeModal member={action.member} coordinators={coordinators} onClose={()=>setAction(null)}
          onSave={(m2)=>{ setMembers(members.map(m=>m.id===m2.id?m2:m)); setAction(null); }} currentUser={currentUser} />
      )}

      {action === "death-calc" && (
        <PickMemberModal members={members.filter(m=>m.status==="active")} title="เลือกสมาชิกที่เสียชีวิตเพื่อคำนวณเงินสงเคราะห์" onClose={()=>setAction(null)}
          onPick={(m)=>setAction({type:"death-calc-form", member:m})} />
      )}
      {action?.type === "death-calc-form" && (
        <DeathCalcFormModal member={action.member} members={members} settings={settings} onClose={()=>setAction(null)}
          onSave={({updatedMember, calc, payment})=>{
            setMembers(members.map(m=>m.id===updatedMember.id?updatedMember:m));
            setDeathCalcs([...deathCalcs, calc]);
            const seq = vouchers.filter(v=>v.type==="payment").length + 1;
            const voucherNo = `PV-${todayISO().replace(/-/g,"")}-${padNo(seq,3)}`;
            const voucher = {
              id: genId("PV"), type: "payment", voucherNo,
              date: calc.calcDate, category: "เงินสงเคราะห์ศพ",
              partyName: calc.beneficiaryName || calc.memberName,
              amount: calc.netAmount, method: payment.method, bankAccount: payment.bankAccount || "",
              note: `เงินสงเคราะห์กรณีเสียชีวิต — ${calc.memberName} (${calc.memberNo}) อ้างอิงใบคำนวณ ${calc.id}`,
              slipImage: "", cancelled: false, createdAt: Date.now(), createdBy: currentUser.name,
              linkedDeathCalcId: calc.id,
            };
            setVouchers([...vouchers, voucher]);
            setAction(null);
            setPrintCalc({ ...calc, voucherNo });
          }} />
      )}
    </div>
  );
}

function PickMemberModal({ members, title, onClose, onPick }) {
  const [q, setQ] = useState("");
  const filtered = members.filter(m => `${m.name} ${m.memberNo}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title={title} onClose={onClose}>
      <TextInput placeholder="ค้นหาชื่อสมาชิก…" value={q} onChange={e=>setQ(e.target.value)} className="mb-3" />
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
        {filtered.map(m => (
          <button key={m.id} onClick={()=>onPick(m)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm flex justify-between">
            <span>{m.name}</span><span className="text-xs text-slate-400 font-mono">{m.memberNo}</span>
          </button>
        ))}
        {filtered.length===0 && <div className="text-center text-sm text-slate-400 py-6">ไม่พบสมาชิก</div>}
      </div>
    </Modal>
  );
}

function BeneficiaryFormModal({ member, onClose, onSave, currentUser }) {
  const [f, setF] = useState({ beneficiaryName: member.beneficiaryName||"", beneficiaryRelation: member.beneficiaryRelation||"", beneficiaryPhone: member.beneficiaryPhone||"" });
  return (
    <Modal title={`เปลี่ยนผู้รับผลประโยชน์ · ${member.name}`} onClose={onClose}>
      <Field label="ชื่อผู้รับผลประโยชน์คนใหม่"><TextInput value={f.beneficiaryName} onChange={e=>setF({...f,beneficiaryName:e.target.value})} /></Field>
      <Field label="ความสัมพันธ์"><TextInput value={f.beneficiaryRelation} onChange={e=>setF({...f,beneficiaryRelation:e.target.value})} /></Field>
      <Field label="เบอร์โทร"><TextInput value={f.beneficiaryPhone} onChange={e=>setF({...f,beneficiaryPhone:e.target.value})} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={()=>onSave({...member, ...f, history:[...(member.history||[]), {at:Date.now(), by:currentUser.name, note:`เปลี่ยนผู้รับผลประโยชน์เป็น ${f.beneficiaryName}`}]})}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}

function CoordinatorChangeModal({ member, coordinators, onClose, onSave, currentUser }) {
  const [coordinatorId, setCoordinatorId] = useState(member.coordinatorId || "");
  return (
    <Modal title={`เปลี่ยนผู้ประสานงาน · ${member.name}`} onClose={onClose}>
      <Field label="ผู้ประสานงานคนใหม่">
        <Select value={coordinatorId} onChange={e=>setCoordinatorId(e.target.value)}>
          <option value="">— ไม่ระบุ —</option>
          {coordinators.map(c => <option key={c.id} value={c.id}>{c.name} ({c.village})</option>)}
        </Select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={()=>{
          const newName = coordinators.find(c=>c.id===coordinatorId)?.name || "ไม่ระบุ";
          onSave({...member, coordinatorId, history:[...(member.history||[]), {at:Date.now(), by:currentUser.name, note:`เปลี่ยนผู้ประสานงานเป็น ${newName}`}]});
        }}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}

function DeathCalcFormModal({ member, members, settings, onClose, onSave }) {
  const activeCount = members.filter(m => m.status === "active" && m.id !== member.id).length;
  const [deathDate, setDeathDate] = useState(todayISO());
  const [ratePerMember, setRatePerMember] = useState(settings.monthlyRate);
  const [deductions, setDeductions] = useState(0);
  const [method, setMethod] = useState("cash");
  const [bankAccount, setBankAccount] = useState("");
  const [errors, setErrors] = useState({});
  const totalAmount = activeCount * Number(ratePerMember || 0);
  const netAmount = totalAmount - Number(deductions || 0);

  function submit() {
    const e = {};
    if (!deathDate) e.deathDate = "กรุณาเลือกวันที่เสียชีวิต";
    if (!ratePerMember || Number(ratePerMember) <= 0) e.ratePerMember = "กรุณากรอกอัตราให้ถูกต้อง";
    if (method === "bank" && !bankAccount) e.bankAccount = "กรุณาเลือกบัญชีธนาคารที่จ่าย";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const calc = {
      id: genId("DC"), memberId: member.id, memberName: member.name, memberNo: member.memberNo,
      deathDate, calcDate: todayISO(), activeCount, ratePerMember: Number(ratePerMember), totalAmount, deductions: Number(deductions), netAmount,
      beneficiaryName: member.beneficiaryName, beneficiaryRelation: member.beneficiaryRelation,
    };
    const payment = { method, bankAccount };
    onSave({ updatedMember: { ...member, status: "deceased", history:[...(member.history||[]), {at:Date.now(), note:"คำนวณเงินสงเคราะห์ / ปรับสถานะเป็นเสียชีวิต"}] }, calc, payment });
  }

  return (
    <Modal title={`คำนวณเงินสงเคราะห์ · ${member.name}`} onClose={onClose}>
      <Field label="วันที่เสียชีวิต" error={errors.deathDate}><TextInput invalid={!!errors.deathDate} type="date" value={deathDate} onChange={e=>setDeathDate(e.target.value)} /></Field>
      <Field label="จำนวนสมาชิกที่ใช้งานอยู่ (ไม่รวมผู้เสียชีวิต)"><TextInput disabled value={activeCount} /></Field>
      <Field label="อัตราเงินสงเคราะห์ต่อสมาชิก 1 คน (บาท)" error={errors.ratePerMember}><TextInput invalid={!!errors.ratePerMember} type="number" value={ratePerMember} onChange={e=>setRatePerMember(e.target.value)} /></Field>
      <Field label="หักค่าใช้จ่าย (ถ้ามี)"><TextInput type="number" value={deductions} onChange={e=>setDeductions(e.target.value)} /></Field>
      <div className="bg-slate-50 rounded-md p-3 text-sm space-y-1 mb-3">
        <div className="flex justify-between"><span className="text-slate-500">ยอดรวม ({activeCount} × ฿{money(ratePerMember)})</span><span>฿{money(totalAmount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">หักค่าใช้จ่าย</span><span>- ฿{money(deductions)}</span></div>
        <div className="flex justify-between font-semibold border-t border-slate-200 pt-1"><span>ยอดจ่ายสุทธิ</span><span>฿{money(netAmount)}</span></div>
      </div>
      <Field label="วิธีจ่ายเงินสงเคราะห์">
        <Select value={method} onChange={e=>{ setMethod(e.target.value); if (e.target.value==="cash") setBankAccount(""); }}>
          <option value="cash">เงินสด</option>
          <option value="bank">โอนผ่านธนาคาร</option>
        </Select>
      </Field>
      {method === "bank" && (
        <Field label="บัญชีธนาคารที่จ่าย" error={errors.bankAccount}>
          <Select invalid={!!errors.bankAccount} value={bankAccount} onChange={e=>setBankAccount(e.target.value)}>
            <option value="">— เลือกบัญชี —</option>
            {(settings.bankAccounts||[]).map((b,i)=><option key={i} value={`${b.bankName} ${b.accountNo}`}>{b.bankName} · {b.accountNo}</option>)}
          </Select>
        </Field>
      )}
      <p className="text-[11px] text-slate-400 mb-2">เมื่อบันทึก ระบบจะสร้างใบสำคัญจ่ายเงินในหมวดงานการเงินให้อัตโนมัติ</p>
      <div className="flex justify-end gap-2 mt-2">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={submit}><Check size={15}/> บันทึกและพิมพ์ใบคำนวณ</Btn>
      </div>
    </Modal>
  );
}

function ApplicationPrint({ member, settings, onClose }) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Btn variant="ghost" onClick={onClose}><X size={15}/> ปิด</Btn>
        <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์</Btn>
      </div>
      <div className="bg-white border border-slate-200 p-10 print:border-0 text-sm leading-loose">
        <h1 className="text-center font-semibold text-base">{settings.associationName}</h1>
        <h2 className="text-center text-slate-500 mb-8">ใบสมัครสมาชิก เลขทะเบียน {member.memberNo}</h2>
        <p>ข้าพเจ้า <b>{member.name}</b> เลขบัตรประชาชน {member.idCard || "…………………"}</p>
        <p>ที่อยู่ {member.address || "…………………………………………………"}</p>
        <p>หมู่บ้าน/กองทุน {member.village || "…………"} เบอร์โทร {member.phone || "…………"}</p>
        <p>มีความประสงค์สมัครเป็นสมาชิกฌาปนกิจสงเคราะห์ ตั้งแต่วันที่ {toThaiDate(member.joinDate)}</p>
        <p className="mt-4">ผู้รับผลประโยชน์: <b>{member.beneficiaryName || "…………………"}</b> ความสัมพันธ์ {member.beneficiaryRelation || "…………"} เบอร์โทร {member.beneficiaryPhone || "…………"}</p>
        <div className="grid grid-cols-2 gap-8 mt-16 text-center">
          <div>ลงชื่อ ……………………………… ผู้สมัคร<br/>({member.name})</div>
          <div>ลงชื่อ ……………………………… เจ้าหน้าที่รับสมัคร<br/>(……………………………)</div>
        </div>
      </div>
    </div>
  );
}

function DeathCalcPrint({ calc, settings, onClose }) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Btn variant="ghost" onClick={onClose}><X size={15}/> ปิด</Btn>
        <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์</Btn>
      </div>
      <div className="bg-white border border-slate-200 p-10 print:border-0 text-sm leading-loose">
        <h1 className="text-center font-semibold text-base">{settings.associationName}</h1>
        <h2 className="text-center text-slate-500 mb-8">ใบคำนวณเงินสงเคราะห์กรณีสมาชิกเสียชีวิต</h2>
        <p>ชื่อสมาชิกผู้เสียชีวิต: <b>{calc.memberName}</b> (เลขทะเบียน {calc.memberNo})</p>
        <p>วันที่เสียชีวิต: {toThaiDate(calc.deathDate)} &nbsp; วันที่คำนวณ: {toThaiDate(calc.calcDate)}</p>
        <p>ผู้รับผลประโยชน์: {calc.beneficiaryName || "-"} ({calc.beneficiaryRelation || "-"})</p>
        <table className="w-full mt-6 border-collapse">
          <tbody>
            <tr className="border-b border-slate-200"><td className="py-2">จำนวนสมาชิกที่ใช้งานอยู่</td><td className="py-2 text-right">{calc.activeCount} คน</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">อัตราต่อสมาชิก 1 คน</td><td className="py-2 text-right">฿{money(calc.ratePerMember)}</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">ยอดรวม</td><td className="py-2 text-right">฿{money(calc.totalAmount)}</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">หักค่าใช้จ่าย</td><td className="py-2 text-right">- ฿{money(calc.deductions)}</td></tr>
            <tr><td className="py-2 font-semibold">ยอดจ่ายสุทธิ</td><td className="py-2 text-right font-semibold">฿{money(calc.netAmount)}</td></tr>
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-8 mt-16 text-center">
          <div>ลงชื่อ ……………………………… ผู้คำนวณ</div>
          <div>ลงชื่อ ……………………………… ผู้อนุมัติจ่าย</div>
        </div>
      </div>
    </div>
  );
}

/* ============================== financial ============================== */

const RECEIPT_CATEGORIES = ["ค่าสมัครสมาชิก", "เงินสงเคราะห์รายเดือน", "เงินบริจาค", "อื่นๆ"];
const PAYMENT_CATEGORIES = ["เงินสงเคราะห์ศพ", "ค่าใช้จ่ายดำเนินงาน", "ค่าธรรมเนียมธนาคาร", "อื่นๆ"];

function FinancialView({ vouchers, setVouchers, members, settings, currentUser }) {
  const [tab, setTab] = useState("receipt");
  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [printing, setPrinting] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);

  const list = vouchers.filter(v => v.type === tab).sort((a,b)=>b.createdAt-a.createdAt);

  function addVoucher(data) {
    const prefix = tab === "receipt" ? "RV" : "PV";
    const seq = vouchers.filter(v=>v.type===tab).length + 1;
    const voucherNo = `${prefix}-${todayISO().replace(/-/g,"")}-${padNo(seq,3)}`;
    setVouchers([...vouchers, { ...data, id: genId(prefix), type: tab, voucherNo, cancelled: false, createdAt: Date.now(), createdBy: currentUser.name }]);
    setShowForm(false);
  }
  function cancelVoucher(id, reason) {
    setVouchers(vouchers.map(v => v.id === id ? { ...v, cancelled: true, cancelReason: reason, cancelledBy: currentUser.name, cancelledAt: Date.now() } : v));
    setCancelling(null);
  }

  if (printing) return <VoucherPrint voucher={printing} settings={settings} onClose={()=>setPrinting(null)} />;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-800">งานการเงิน</h1>
        <Btn onClick={()=>setShowForm(true)}><Plus size={15}/> {tab==="receipt" ? "บันทึกใบสำคัญรับเงิน" : "บันทึกใบสำคัญจ่ายเงิน"}</Btn>
      </div>
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        <button onClick={()=>setTab("receipt")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab==="receipt"?"border-emerald-600 text-emerald-700":"border-transparent text-slate-500"}`}>ใบสำคัญรับเงิน</button>
        <button onClick={()=>setTab("payment")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab==="payment"?"border-emerald-600 text-emerald-700":"border-transparent text-slate-500"}`}>ใบสำคัญจ่ายเงิน</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr>
            <th className="text-left px-4 py-3 font-medium">เลขที่</th>
            <th className="text-left px-4 py-3 font-medium">วันที่</th>
            <th className="text-left px-4 py-3 font-medium">รายการ</th>
            <th className="text-left px-4 py-3 font-medium">วิธีชำระ</th>
            <th className="text-right px-4 py-3 font-medium">จำนวนเงิน</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {list.map(v => (
              <tr key={v.id} className={`border-t border-slate-100 ${v.cancelled ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs">{v.voucherNo}</td>
                <td className="px-4 py-3">{toThaiDate(v.date)}</td>
                <td className="px-4 py-3">{v.category}{v.partyName ? ` — ${v.partyName}` : ""}{v.cancelled && <span className="text-rose-500 text-xs ml-2">(ยกเลิกแล้ว)</span>}</td>
                <td className="px-4 py-3">{v.method === "cash" ? "เงินสด" : `ธนาคาร (${v.bankAccount || "-"})`}</td>
                <td className="px-4 py-3 text-right">฿{money(v.amount)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {v.slipImage && <button onClick={()=>setViewingSlip(v.slipImage)} className="text-slate-400 hover:text-emerald-700 mr-3" title="ดูภาพสลิป"><ImageIcon size={15}/></button>}
                  <button onClick={()=>setPrinting(v)} className="text-slate-400 hover:text-emerald-700 mr-3" title="พิมพ์"><Printer size={15}/></button>
                  {!v.cancelled && <button onClick={()=>setCancelling(v)} className="text-slate-400 hover:text-rose-600" title="ยกเลิก"><Ban size={15}/></button>}
                </td>
              </tr>
            ))}
            {list.length===0 && <EmptyRow colSpan={6} text="ยังไม่มีรายการ" />}
          </tbody>
        </table>
      </div>

      {showForm && (
        <VoucherFormModal type={tab} members={members} settings={settings} onClose={()=>setShowForm(false)} onSave={addVoucher}
          categories={tab==="receipt"?RECEIPT_CATEGORIES:PAYMENT_CATEGORIES} />
      )}
      {cancelling && <CancelModal voucher={cancelling} onClose={()=>setCancelling(null)} onConfirm={(reason)=>cancelVoucher(cancelling.id, reason)} />}
      {viewingSlip && <ImageLightbox src={viewingSlip} onClose={()=>setViewingSlip(null)} />}
    </div>
  );
}

function VoucherFormModal({ type, members, settings, categories, onClose, onSave }) {
  const [f, setF] = useState({ date: todayISO(), category: categories[0], partyName: "", amount: "", method: "cash", bankAccount: "", note: "", slipImage: "" });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  function validate() {
    const e = {};
    if (!f.date) e.date = "กรุณาเลือกวันที่";
    if (!f.amount || Number(f.amount) <= 0) e.amount = "กรุณากรอกจำนวนเงินให้ถูกต้อง";
    if (f.method === "bank" && !f.bankAccount) e.bankAccount = "กรุณาเลือกบัญชีธนาคาร";
    return e;
  }
  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(f);
  }
  async function handleFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setF(prev => ({ ...prev, slipImage: dataUrl }));
    } catch (err) { console.error(err); }
    setUploading(false);
  }

  return (
    <Modal title={type === "receipt" ? "บันทึกใบสำคัญรับเงิน" : "บันทึกใบสำคัญจ่ายเงิน"} onClose={onClose}>
      <Field label="วันที่" error={errors.date}><TextInput invalid={!!errors.date} type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} /></Field>
      <Field label="ประเภทรายการ">
        <Select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label={type==="receipt" ? "รับเงินจาก (สมาชิก/บุคคล)" : "จ่ายเงินให้ (สมาชิก/บุคคล)"}>
        <TextInput list="member-names" value={f.partyName} onChange={e=>setF({...f,partyName:e.target.value})} placeholder="พิมพ์ชื่อ" />
        <datalist id="member-names">{members.map(m=><option key={m.id} value={m.name} />)}</datalist>
      </Field>
      <Field label="จำนวนเงิน (บาท)" error={errors.amount}><TextInput invalid={!!errors.amount} type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} /></Field>
      <Field label="วิธีชำระ">
        <Select value={f.method} onChange={e=>setF({...f,method:e.target.value, ...(e.target.value==="cash" ? {bankAccount:""} : {})})}>
          <option value="cash">เงินสด</option>
          <option value="bank">ธนาคาร / โอนเงิน</option>
        </Select>
      </Field>
      {f.method === "bank" && (
        <>
          <Field label="บัญชีธนาคาร" error={errors.bankAccount}>
            <Select invalid={!!errors.bankAccount} value={f.bankAccount} onChange={e=>setF({...f,bankAccount:e.target.value})}>
              <option value="">— เลือกบัญชี —</option>
              {(settings.bankAccounts||[]).map((b,i)=><option key={i} value={`${b.bankName} ${b.accountNo}`}>{b.bankName} · {b.accountNo}</option>)}
            </Select>
          </Field>
          <Field label="แนบภาพสลิปการโอนเงิน (ถ้ามี)">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-slate-700">
                <Paperclip size={14}/> {f.slipImage ? "เปลี่ยนภาพสลิป" : "เลือกภาพสลิป"}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {uploading && <span className="text-xs text-slate-400">กำลังบีบอัดภาพ…</span>}
              {f.slipImage && !uploading && (
                <div className="flex items-center gap-2">
                  <img src={f.slipImage} alt="ตัวอย่างสลิป" className="h-12 w-12 object-cover rounded border border-slate-200" />
                  <button type="button" onClick={()=>setF({...f, slipImage:""})} className="text-xs text-rose-600 hover:underline">ลบภาพ</button>
                </div>
              )}
            </div>
            <span className="block text-[11px] text-slate-400 mt-1">ระบบจะบีบอัดภาพให้มีขนาดเล็กลงอัตโนมัติเพื่อประหยัดพื้นที่จัดเก็บ</span>
          </Field>
        </>
      )}
      <Field label="หมายเหตุ"><TextInput value={f.note} onChange={e=>setF({...f,note:e.target.value})} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={handleSave}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}

function CancelModal({ voucher, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`ยกเลิกใบสำคัญ ${voucher.voucherNo}`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-3">รายการนี้จะถูกทำเครื่องหมายว่ายกเลิก แต่ยังคงเก็บประวัติไว้เพื่อการตรวจสอบ</p>
      <Field label="เหตุผลที่ยกเลิก"><TextInput value={reason} onChange={e=>setReason(e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ไม่ยกเลิก</Btn>
        <Btn variant="danger" onClick={()=>onConfirm(reason)}><Ban size={15}/> ยืนยันยกเลิก</Btn>
      </div>
    </Modal>
  );
}

function VoucherPrint({ voucher, settings, onClose }) {
  const isReceipt = voucher.type === "receipt";
  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Btn variant="ghost" onClick={onClose}><X size={15}/> ปิด</Btn>
        <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์</Btn>
      </div>
      <div className="bg-white border border-slate-200 p-8 print:border-0 text-sm">
        <h1 className="text-center font-semibold">{settings.associationName}</h1>
        <h2 className="text-center text-slate-500 mb-6">{isReceipt ? "ใบสำคัญรับเงิน" : "ใบสำคัญจ่ายเงิน"}</h2>
        <div className="flex justify-between mb-4"><span>เลขที่: {voucher.voucherNo}</span><span>วันที่: {toThaiDate(voucher.date)}</span></div>
        <table className="w-full border-collapse mb-4">
          <tbody>
            <tr className="border-b border-slate-200"><td className="py-2">{isReceipt?"รับเงินจาก":"จ่ายเงินให้"}</td><td className="py-2 text-right">{voucher.partyName || "-"}</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">รายการ</td><td className="py-2 text-right">{voucher.category}</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">วิธีชำระ</td><td className="py-2 text-right">{voucher.method==="cash"?"เงินสด":`ธนาคาร (${voucher.bankAccount})`}</td></tr>
            <tr><td className="py-2 font-semibold">จำนวนเงิน</td><td className="py-2 text-right font-semibold">฿{money(voucher.amount)}</td></tr>
          </tbody>
        </table>
        {voucher.cancelled && <p className="text-rose-600 text-xs mb-3">** ใบสำคัญนี้ถูกยกเลิก: {voucher.cancelReason} **</p>}
        {voucher.slipImage && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">ภาพสลิปการโอนเงินที่แนบ</p>
            <img src={voucher.slipImage} alt="สลิปการโอนเงิน" className="max-h-64 border border-slate-200 rounded" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-8 mt-14 text-center">
          <div>ลงชื่อ ……………………………… ผู้{isReceipt?"รับเงิน":"จ่ายเงิน"}</div>
          <div>ลงชื่อ ……………………………… เจ้าหน้าที่การเงิน<br/>({voucher.createdBy})</div>
        </div>
      </div>
    </div>
  );
}

/* ============================== reports ============================== */

function MiniCalendar({ vouchers, value, onChange }) {
  const initial = new Date(value + "T00:00:00");
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    const d = new Date(value + "T00:00:00");
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  }, [value]);

  const txDates = useMemo(() => {
    const s = new Set();
    vouchers.forEach(v => { if (!v.cancelled) s.add(v.date); });
    return s;
  }, [vouchers]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const weekDays = ["อา","จ","อ","พ","พฤ","ศ","ส"];
  const isoOf = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  function changeMonth(delta) {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    setViewMonth(m); setViewYear(y);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 w-72 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <button onClick={()=>changeMonth(-1)} className="text-slate-400 hover:text-slate-700 p-1"><ChevronLeft size={16}/></button>
        <div className="text-sm font-medium text-slate-700">{THAI_MONTHS_FULL[viewMonth]} {viewYear + 543}</div>
        <button onClick={()=>changeMonth(1)} className="text-slate-400 hover:text-slate-700 p-1"><ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 mb-1">
        {weekDays.map(w => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = isoOf(d);
          const hasTx = txDates.has(iso);
          const isSelected = iso === value;
          const isToday = iso === todayISO();
          return (
            <button key={i} onClick={()=>onChange(iso)}
              className={`relative h-8 w-8 mx-auto rounded-full text-xs flex items-center justify-center transition
                ${isSelected ? "bg-emerald-700 text-white font-semibold" : isToday ? "border border-emerald-500 text-emerald-700 font-medium" : "text-slate-700 hover:bg-slate-100"}`}>
              {d}
              {hasTx && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`}></span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> วันที่มีธุรกรรม
      </div>
    </div>
  );
}

function RangeModal({ onClose, onConfirm }) {
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(todayISO());
  const [error, setError] = useState("");
  return (
    <Modal title="พิมพ์รายงานตามช่วงวันที่" onClose={onClose}>
      <Field label="วันที่เริ่มต้น"><TextInput type="date" value={start} onChange={e=>setStart(e.target.value)} /></Field>
      <Field label="วันที่สิ้นสุด"><TextInput type="date" value={end} onChange={e=>setEnd(e.target.value)} /></Field>
      {error && <p className="text-red-600 text-xs font-medium mb-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={()=>{ if (start > end) { setError("วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด"); return; } onConfirm(start, end); }}>
          <CalendarRange size={15}/> สร้างรายงาน
        </Btn>
      </div>
    </Modal>
  );
}

function RangeReportPrint({ vouchers, settings, start, end, onClose }) {
  const inRange = vouchers.filter(v => v.date >= start && v.date <= end);
  const receipts = inRange.filter(v => v.type === "receipt" && !v.cancelled);
  const payments = inRange.filter(v => v.type === "payment" && !v.cancelled);
  const sumBy = (arr, method) => arr.filter(v=>v.method===method).reduce((s,v)=>s+Number(v.amount),0);
  const upToEnd = vouchers.filter(v => !v.cancelled && v.date <= end);
  const cashBalance = upToEnd.filter(v=>v.method==="cash").reduce((s,v)=>s+(v.type==="receipt"?Number(v.amount):-Number(v.amount)),0);
  const bankBalance = upToEnd.filter(v=>v.method==="bank").reduce((s,v)=>s+(v.type==="receipt"?Number(v.amount):-Number(v.amount)),0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="print:hidden flex justify-end gap-2 mb-4">
        <Btn variant="ghost" onClick={onClose}><X size={15}/> ปิด</Btn>
        <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์</Btn>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-6 print:border-0">
        <h2 className="text-center font-semibold">{settings.associationName}</h2>
        <p className="text-center text-sm text-slate-500 mb-4">รายงานสรุปช่วงวันที่ {toThaiDate(start)} — {toThaiDate(end)}</p>

        <h3 className="text-sm font-semibold text-emerald-700 mt-4 mb-2">รายการรับเงิน</h3>
        <ReportTable rows={receipts} />

        <h3 className="text-sm font-semibold text-rose-700 mt-6 mb-2">รายการจ่ายเงิน</h3>
        <ReportTable rows={payments} />

        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">สรุปยอดรวมในช่วง แยกตามเงินสด/ธนาคาร</h3>
        <table className="w-full text-sm border-collapse mb-2">
          <thead><tr className="border-b border-slate-300 text-left text-xs text-slate-500">
            <th className="py-2">รายการ</th><th className="py-2 text-right">เงินสด</th><th className="py-2 text-right">ธนาคาร</th><th className="py-2 text-right">รวม</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="py-2">รับเงิน</td><td className="py-2 text-right">฿{money(sumBy(receipts,"cash"))}</td><td className="py-2 text-right">฿{money(sumBy(receipts,"bank"))}</td><td className="py-2 text-right font-medium">฿{money(sumBy(receipts,"cash")+sumBy(receipts,"bank"))}</td></tr>
            <tr><td className="py-2">จ่ายเงิน</td><td className="py-2 text-right">฿{money(sumBy(payments,"cash"))}</td><td className="py-2 text-right">฿{money(sumBy(payments,"bank"))}</td><td className="py-2 text-right font-medium">฿{money(sumBy(payments,"cash")+sumBy(payments,"bank"))}</td></tr>
          </tbody>
        </table>

        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">ยอดคงเหลือสะสม ณ วันสิ้นสุดช่วง</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-md p-4"><div className="text-xs text-slate-500">เงินสดคงเหลือ</div><div className="text-lg font-semibold">฿{money(cashBalance)}</div></div>
          <div className="bg-slate-50 rounded-md p-4"><div className="text-xs text-slate-500">เงินฝากธนาคารคงเหลือ</div><div className="text-lg font-semibold">฿{money(bankBalance)}</div></div>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ vouchers, settings }) {
  const [date, setDate] = useState(todayISO());
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [rangePrint, setRangePrint] = useState(null);

  const dayReceipts = vouchers.filter(v => v.date === date && v.type === "receipt" && !v.cancelled);
  const dayPayments = vouchers.filter(v => v.date === date && v.type === "payment" && !v.cancelled);
  const sumBy = (arr, method) => arr.filter(v=>v.method===method).reduce((s,v)=>s+Number(v.amount),0);

  const upToDate = vouchers.filter(v => !v.cancelled && v.date <= date);
  const cashBalance = upToDate.filter(v=>v.method==="cash").reduce((s,v)=>s+(v.type==="receipt"?Number(v.amount):-Number(v.amount)),0);
  const bankBalance = upToDate.filter(v=>v.method==="bank").reduce((s,v)=>s+(v.type==="receipt"?Number(v.amount):-Number(v.amount)),0);

  if (rangePrint) return <RangeReportPrint vouchers={vouchers} settings={settings} start={rangePrint.start} end={rangePrint.end} onClose={()=>setRangePrint(null)} />;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <h1 className="text-xl font-semibold text-slate-800">รายงานประจำวัน</h1>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={()=>setRangeModalOpen(true)}><CalendarRange size={15}/> พิมพ์รายงานตามช่วงวันที่</Btn>
          <Btn onClick={()=>window.print()}><Printer size={15}/> พิมพ์รายงานวันนี้</Btn>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        <div className="print:hidden">
          <MiniCalendar vouchers={vouchers} value={date} onChange={setDate} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-5 flex-1">
          <h2 className="text-center font-semibold">{settings.associationName}</h2>
          <p className="text-center text-sm text-slate-500 mb-4">รายงานประจำวันที่ {toThaiDate(date)}</p>

          <h3 className="text-sm font-semibold text-emerald-700 mt-4 mb-2">1. รายงานใบสำคัญรับเงิน</h3>
          <ReportTable rows={dayReceipts} />

          <h3 className="text-sm font-semibold text-rose-700 mt-6 mb-2">2. รายงานใบสำคัญจ่ายเงิน</h3>
          <ReportTable rows={dayPayments} />

          <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">3. สรุปรายรับ-รายจ่ายประจำวัน แยกตามเงินสด/ธนาคาร</h3>
          <table className="w-full text-sm border-collapse mb-2">
            <thead><tr className="border-b border-slate-300 text-left text-xs text-slate-500">
              <th className="py-2">รายการ</th><th className="py-2 text-right">เงินสด</th><th className="py-2 text-right">ธนาคาร</th><th className="py-2 text-right">รวม</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-slate-100"><td className="py-2">รับเงิน</td><td className="py-2 text-right">฿{money(sumBy(dayReceipts,"cash"))}</td><td className="py-2 text-right">฿{money(sumBy(dayReceipts,"bank"))}</td><td className="py-2 text-right font-medium">฿{money(sumBy(dayReceipts,"cash")+sumBy(dayReceipts,"bank"))}</td></tr>
              <tr><td className="py-2">จ่ายเงิน</td><td className="py-2 text-right">฿{money(sumBy(dayPayments,"cash"))}</td><td className="py-2 text-right">฿{money(sumBy(dayPayments,"bank"))}</td><td className="py-2 text-right font-medium">฿{money(sumBy(dayPayments,"cash")+sumBy(dayPayments,"bank"))}</td></tr>
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-2">4. ยอดเงินสด / เงินฝากธนาคารสะสม ณ วันที่รายงาน</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-md p-4"><div className="text-xs text-slate-500">เงินสดคงเหลือ</div><div className="text-lg font-semibold">฿{money(cashBalance)}</div></div>
            <div className="bg-slate-50 rounded-md p-4"><div className="text-xs text-slate-500">เงินฝากธนาคารคงเหลือ</div><div className="text-lg font-semibold">฿{money(bankBalance)}</div></div>
          </div>
        </div>
      </div>

      {rangeModalOpen && (
        <RangeModal onClose={()=>setRangeModalOpen(false)} onConfirm={(start,end)=>{ setRangeModalOpen(false); setRangePrint({start,end}); }} />
      )}
    </div>
  );
}
function ReportTable({ rows }) {
  return (
    <table className="w-full text-sm border-collapse mb-2">
      <thead><tr className="border-b border-slate-300 text-left text-xs text-slate-500">
        <th className="py-2">เลขที่</th><th className="py-2">รายการ</th><th className="py-2">วิธีชำระ</th><th className="py-2 text-right">จำนวนเงิน</th>
      </tr></thead>
      <tbody>
        {rows.map(v => (
          <tr key={v.id} className="border-b border-slate-100">
            <td className="py-1.5 font-mono text-xs">{v.voucherNo}</td>
            <td className="py-1.5">{v.category}{v.partyName?` — ${v.partyName}`:""}</td>
            <td className="py-1.5">{v.method==="cash"?"เงินสด":"ธนาคาร"}</td>
            <td className="py-1.5 text-right">฿{money(v.amount)}</td>
          </tr>
        ))}
        {rows.length===0 && <tr><td colSpan={4} className="text-center text-slate-400 py-4 text-xs">ไม่มีรายการ</td></tr>}
      </tbody>
    </table>
  );
}

/* ============================== settings ============================== */

function SettingsView({ settings, setSettings, users, setUsers, currentUser }) {
  const [f, setF] = useState(settings);
  const [newBank, setNewBank] = useState({ bankName: "", accountNo: "", accountName: "" });
  const [userForm, setUserForm] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function saveGeneral() { setSettings(f); }
  function addBank() {
    if (!newBank.bankName || !newBank.accountNo) return;
    const next = { ...f, bankAccounts: [...(f.bankAccounts||[]), newBank] };
    setF(next); setSettings(next); setNewBank({ bankName: "", accountNo: "", accountName: "" });
  }
  function removeBank(i) {
    const next = { ...f, bankAccounts: f.bankAccounts.filter((_,idx)=>idx!==i) };
    setF(next); setSettings(next);
  }
  function saveUser(u) {
    if (u.id) setUsers(users.map(x=>x.id===u.id?u:x));
    else setUsers([...users, { ...u, id: genId("USR") }]);
    setUserForm(null);
  }
  function toggleActive(u) { setUsers(users.map(x=>x.id===u.id?{...x, active: x.active===false}:x)); }
  function confirmDelete(u) {
    if (u.id === currentUser.id) { setDeleteError("ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้"); return; }
    const remainingAdmins = users.filter(x=>x.role==="admin" && x.id!==u.id).length;
    if (u.role === "admin" && remainingAdmins === 0) { setDeleteError("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน"); return; }
    setDeleteError("");
    setDeletingUser(u);
  }
  function doDelete() {
    setUsers(users.filter(x=>x.id!==deletingUser.id));
    setDeletingUser(null);
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">ตั้งค่าระบบและผู้ใช้งาน</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">ข้อมูลทั่วไป</h2>
        <Field label="ชื่อสมาคม"><TextInput value={f.associationName} onChange={e=>setF({...f,associationName:e.target.value})} /></Field>
        <Field label="อัตราเงินสงเคราะห์ตั้งต้น (บาท/เดือน)"><TextInput type="number" value={f.monthlyRate} onChange={e=>setF({...f,monthlyRate:e.target.value})} /></Field>
        <Btn onClick={saveGeneral}><Check size={15}/> บันทึก</Btn>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">บัญชีธนาคารที่ใช้งาน</h2>
        <table className="w-full text-sm mb-4">
          <tbody>
            {(f.bankAccounts||[]).map((b,i)=>(
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2">{b.bankName}</td><td className="py-2">{b.accountNo}</td><td className="py-2">{b.accountName}</td>
                <td className="py-2 text-right"><button onClick={()=>removeBank(i)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {(!f.bankAccounts || f.bankAccounts.length===0) && <EmptyRow colSpan={4} text="ยังไม่มีบัญชีธนาคาร" />}
          </tbody>
        </table>
        <div className="flex gap-2 items-end">
          <TextInput placeholder="ชื่อธนาคาร" value={newBank.bankName} onChange={e=>setNewBank({...newBank,bankName:e.target.value})} />
          <TextInput placeholder="เลขบัญชี" value={newBank.accountNo} onChange={e=>setNewBank({...newBank,accountNo:e.target.value})} />
          <TextInput placeholder="ชื่อบัญชี" value={newBank.accountName} onChange={e=>setNewBank({...newBank,accountName:e.target.value})} />
          <Btn variant="ghost" onClick={addBank}><Plus size={15}/></Btn>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-700">ผู้ใช้งานระบบ</h2>
          <Btn variant="ghost" onClick={()=>setUserForm("new")}><Plus size={15}/> เพิ่มผู้ใช้งาน</Btn>
        </div>
        {deleteError && <p className="text-red-600 text-sm font-medium mb-3">{deleteError}</p>}
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="text-left pb-2">ชื่อ</th><th className="text-left pb-2">ชื่อผู้ใช้งาน</th><th className="text-left pb-2">สิทธิ์</th><th className="text-left pb-2">สถานะ</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2">{u.name}</td>
                <td className="py-2 font-mono text-xs">{u.username}</td>
                <td className="py-2">{u.role==="admin"?"ผู้ดูแลระบบ":"เจ้าหน้าที่"}</td>
                <td className="py-2">{u.active===false ? <span className="text-slate-400">ปิดใช้งาน</span> : <span className="text-emerald-700">ใช้งาน</span>}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  {u.id !== currentUser.id && (
                    <>
                      <button onClick={()=>toggleActive(u)} className="text-xs text-slate-500 hover:text-slate-700 underline mr-3">
                        {u.active===false?"เปิดใช้งาน":"ปิดใช้งาน"}
                      </button>
                      <button onClick={()=>confirmDelete(u)} className="text-slate-400 hover:text-rose-600 align-middle"><Trash2 size={14}/></button>
                    </>
                  )}
                  {u.id === currentUser.id && <span className="text-xs text-slate-300">(บัญชีของคุณ)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userForm && <UserFormModal onClose={()=>setUserForm(null)} onSave={saveUser} existingUsernames={users.map(u=>u.username)} />}
      {deletingUser && (
        <ConfirmModal
          title="ลบผู้ใช้งาน"
          message={`ยืนยันลบผู้ใช้งาน "${deletingUser.name}" (${deletingUser.username})? การลบนี้ไม่สามารถย้อนกลับได้`}
          onCancel={()=>setDeletingUser(null)}
          onConfirm={doDelete}
          danger
        />
      )}
    </div>
  );
}

function UserFormModal({ onClose, onSave, existingUsernames = [] }) {
  const [f, setF] = useState({ name: "", username: "", password: "", role: "staff", active: true });
  const [errors, setErrors] = useState({});
  function validate() {
    const e = {};
    if (!f.name.trim()) e.name = "กรุณากรอกชื่อ-สกุล";
    if (!f.username.trim()) e.username = "กรุณากรอกชื่อผู้ใช้งาน";
    else if (existingUsernames.includes(f.username.trim())) e.username = "ชื่อผู้ใช้งานนี้มีอยู่แล้ว";
    if (!f.password) e.password = "กรุณากรอกรหัสผ่าน";
    return e;
  }
  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(f);
  }
  return (
    <Modal title="เพิ่มผู้ใช้งาน" onClose={onClose}>
      <Field label="ชื่อ-สกุล" error={errors.name}><TextInput invalid={!!errors.name} value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></Field>
      <Field label="ชื่อผู้ใช้งาน" error={errors.username}><TextInput invalid={!!errors.username} value={f.username} onChange={e=>setF({...f,username:e.target.value})} /></Field>
      <Field label="รหัสผ่าน" error={errors.password}><TextInput invalid={!!errors.password} type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} /></Field>
      <Field label="สิทธิ์การใช้งาน">
        <Select value={f.role} onChange={e=>setF({...f,role:e.target.value})}>
          <option value="staff">เจ้าหน้าที่</option>
          <option value="admin">ผู้ดูแลระบบ</option>
        </Select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn onClick={handleSave}><Check size={15}/> บันทึก</Btn>
      </div>
    </Modal>
  );
}