import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Grading Scales
// ─────────────────────────────────────────────────────────────────────────────
const SCALES = {
  "4.0 Standard": {
    max: 4.0,
    grades: ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"],
    points: {"A+":4.0,"A":4.0,"A-":3.7,"B+":3.3,"B":3.0,"B-":2.7,"C+":2.3,"C":2.0,"C-":1.7,"D+":1.3,"D":1.0,"D-":0.7,"F":0.0},
  },
  "5.0 Scale": {
    max: 5.0,
    grades: ["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"],
    points: {"A+":5.0,"A":5.0,"A-":4.7,"B+":4.3,"B":4.0,"B-":3.7,"C+":3.3,"C":3.0,"C-":2.7,"D+":2.3,"D":2.0,"D-":1.7,"F":0.0},
  },
  "Percentage": {
    max: 100,
    grades: ["100-90","89-80","79-70","69-60","59-50","Below 50"],
    points: {"100-90":95,"89-80":85,"79-70":75,"69-60":65,"59-50":55,"Below 50":40},
    labels: {"100-90":"A (90-100)","89-80":"B (80-89)","79-70":"C (70-79)","69-60":"D (60-69)","59-50":"E (50-59)","Below 50":"F (<50)"},
  },
  "Letter (No +/-)": {
    max: 4.0,
    grades: ["A","B","C","D","F"],
    points: {"A":4.0,"B":3.0,"C":2.0,"D":1.0,"F":0.0},
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Degree Templates
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATES = {
  "Computer Science": [
    { name: "Data Structures", credits: 4 },
    { name: "Algorithms", credits: 3 },
    { name: "Operating Systems", credits: 3 },
    { name: "Databases", credits: 3 },
    { name: "Computer Networks", credits: 3 },
    { name: "Software Engineering", credits: 3 },
  ],
  "Business Administration": [
    { name: "Principles of Management", credits: 3 },
    { name: "Financial Accounting", credits: 3 },
    { name: "Business Statistics", credits: 3 },
    { name: "Marketing Fundamentals", credits: 3 },
    { name: "Business Law", credits: 3 },
    { name: "Economics", credits: 3 },
  ],
  "Engineering": [
    { name: "Calculus I", credits: 4 },
    { name: "Physics I", credits: 4 },
    { name: "Engineering Drawing", credits: 3 },
    { name: "Materials Science", credits: 3 },
    { name: "Thermodynamics", credits: 3 },
    { name: "Circuit Theory", credits: 3 },
  ],
  "Medicine / Pre-Med": [
    { name: "General Chemistry", credits: 4 },
    { name: "Organic Chemistry", credits: 4 },
    { name: "Biology I", credits: 4 },
    { name: "Physics (Bio-med)", credits: 3 },
    { name: "Biochemistry", credits: 3 },
    { name: "Anatomy & Physiology", credits: 3 },
  ],
  "Arts & Humanities": [
    { name: "Introduction to Literature", credits: 3 },
    { name: "Art History", credits: 3 },
    { name: "Philosophy", credits: 3 },
    { name: "World History", credits: 3 },
    { name: "Creative Writing", credits: 3 },
    { name: "Cultural Studies", credits: 3 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 9);
const fmt  = g  => g != null ? g.toFixed(2) : "—";
const gColDyn = (g, max) => {
  if (g === null) return "#6b7280";
  const r = g / max;
  return r >= 0.875 ? "#34d399" : r >= 0.675 ? "#fbbf24" : r >= 0.5 ? "#fb923c" : "#f87171";
};
const calcGPA = (courses, scale) => {
  const pts   = scale.points;
  const valid = courses.filter(c => c.grade in pts && Number(c.credits) > 0);
  if (!valid.length) return null;
  const tp = valid.reduce((s, c) => s + pts[c.grade] * Number(c.credits), 0);
  const tc = valid.reduce((s, c) => s + Number(c.credits), 0);
  return tc > 0 ? tp / tc : null;
};
const semCreds = (sem, pts) =>
  sem.courses.filter(c => c.grade in pts && Number(c.credits) > 0).reduce((a, c) => a + Number(c.credits), 0);

// ─────────────────────────────────────────────────────────────────────────────
// SemesterCard
// ─────────────────────────────────────────────────────────────────────────────
function SemesterCard({ sem, T, scale, onUpdate, onDelete, addCourse, updateCourse, deleteCourse }) {
  const [open,    setOpen]    = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(sem.name);
  const gpa = calcGPA(sem.courses, scale);
  const cr  = semCreds(sem, scale.points);
  const col = gColDyn(gpa, scale.max);
  const iS  = { background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit" };
  const commitName = () => { onUpdate({ name: nameVal }); setEditing(false); };
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", cursor: "pointer", gap: 12 }} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {editing ? (
            <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={commitName} onKeyDown={e => e.key==="Enter" && commitName()}
              onClick={e => e.stopPropagation()}
              style={{ ...iS, fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0 }}/>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); setNameVal(sem.name); }}>{sem.name}</span>
          )}
          <span style={{ fontSize: 11, color: T.sub, background: "rgba(128,128,128,0.12)", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{cr} cr</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: col, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{fmt(gpa)}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>GPA</div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.sub, fontSize: 15, padding: "4px 6px", borderRadius: 6, opacity: 0.6 }}>🗑</button>
          <span style={{ color: T.sub, fontSize: 13, transform: open?"rotate(180deg)":"rotate(0deg)", transition: "transform 0.2s", display: "block" }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 8, padding: "10px 0 6px", fontSize: 11, color: T.sub, fontWeight: 500 }}>
            <span style={{ flex: 2 }}>COURSE NAME</span>
            <span style={{ width: 68 }}>CREDITS</span>
            <span style={{ width: 96 }}>GRADE</span>
            <span style={{ width: 40, textAlign: "center" }}>PTS</span>
            <span style={{ width: 28 }}/>
          </div>
          {sem.courses.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", color: T.sub, fontSize: 13 }}>No courses yet.</div>}
          {sem.courses.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
              <input placeholder="Course name" value={c.name} onChange={e => updateCourse(c.id,{name:e.target.value})} style={{ ...iS, flex: 2, minWidth: 0 }}/>
              <input type="number" value={c.credits} min={0.5} max={6} step={0.5} onChange={e => updateCourse(c.id,{credits:e.target.value})} style={{ ...iS, width: 68 }}/>
              <select value={c.grade} onChange={e => updateCourse(c.id,{grade:e.target.value})} style={{ ...iS, width: 96, cursor: "pointer" }}>
                {scale.grades.map(g => <option key={g} value={g}>{scale.labels?.[g]??g} ({scale.points[g]?.toFixed(scale.max>=10?0:1)})</option>)}
              </select>
              <div style={{ width: 40, textAlign: "center", fontSize: 13, fontWeight: 600, color: gColDyn(scale.points[c.grade]??null,scale.max) }}>
                {scale.points[c.grade]?.toFixed(scale.max>=10?0:1)??"—"}
              </div>
              <button onClick={() => deleteCourse(c.id)} style={{ width: 28, background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: 18, borderRadius: 6, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <button onClick={addCourse} style={{ marginTop: 10, padding: "7px 14px", background: T.accentBg, border: `1px solid rgba(232,184,75,0.25)`, borderRadius: 8, color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>+ Add Course</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GPA Ring
// ─────────────────────────────────────────────────────────────────────────────
function GpaRing({ gpa, max, col, T }) {
  const r = 44, cx = 56, cy = 56, circ = 2 * Math.PI * r;
  const dash = gpa !== null ? Math.min(gpa / max, 1) * circ : 0;
  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.grid} strokeWidth={9}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={9}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.6s ease" }}/>
      <text x={cx} y={cy-6} textAnchor="middle" fill={col} fontSize={18} fontWeight={700} fontFamily="'Playfair Display',serif">{fmt(gpa)}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={T.sub} fontSize={10} fontFamily="'DM Sans',sans-serif">/ {max}</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function GPAVault() {
  const [semesters,    setSemesters]    = useState([]);
  const [dark,         setDark]         = useState(true);
  const [ready,        setReady]        = useState(false);
  const [view,         setView]         = useState("dashboard");
  const [scaleName,    setScaleName]    = useState("4.0 Standard");
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [priorGPA,     setPriorGPA]     = useState("");
  const [priorCreds,   setPriorCreds]   = useState("");
  const [whatIf,       setWhatIf]       = useState([{ id: uid(), name: "", credits: 3, grade: "A" }]);
  const [targetGPA,    setTargetGPA]    = useState("");
  const [targetCr,     setTargetCr]     = useState(15);

  const scale = SCALES[scaleName];

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("gpavault-v4");
        if (r) {
          const d = JSON.parse(r.value);
          setSemesters(d.semesters || []);
          setDark(d.dark ?? true);
          setScaleName(SCALES[d.scaleName] ? d.scaleName : "4.0 Standard");
          setPriorGPA(d.priorGPA || "");
          setPriorCreds(d.priorCreds || "");
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.storage.set("gpavault-v4", JSON.stringify({ semesters, dark, scaleName, priorGPA, priorCreds })).catch(() => {});
  }, [semesters, dark, scaleName, priorGPA, priorCreds, ready]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const allCourses = useMemo(() => semesters.flatMap(s => s.courses), [semesters]);

  const calcGPAEff = useCallback((courses) => {
    const regular = courses.filter(c => c.grade in scale.points && Number(c.credits) > 0);
    let tp = regular.reduce((s, c) => s + scale.points[c.grade] * Number(c.credits), 0);
    let tc = regular.reduce((s, c) => s + Number(c.credits), 0);
    const pg = parseFloat(priorGPA), pc = parseFloat(priorCreds);
    if (pg > 0 && pc > 0) { tp += pg * (scale.max / 4.0) * pc; tc += pc; }
    return tc > 0 ? tp / tc : null;
  }, [scale, priorGPA, priorCreds]);

  const cgpa       = useMemo(() => calcGPAEff(allCourses), [allCourses, calcGPAEff]);
  const cgpaOwn    = useMemo(() => calcGPA(allCourses, scale), [allCourses, scale]);
  const totalCreds = useMemo(() => allCourses.filter(c => c.grade in scale.points && Number(c.credits) > 0).reduce((s,c)=>s+Number(c.credits),0), [allCourses, scale]);

  const chartData = useMemo(() =>
    semesters.map(s => {
      const g = calcGPA(s.courses, scale);
      return g !== null ? { name: s.name, gpa: parseFloat(g.toFixed(2)), credits: semCreds(s, scale.points) } : null;
    }).filter(Boolean),
  [semesters, scale]);

  const gradeDistData = useMemo(() => {
    const counts = {};
    scale.grades.forEach(g => { counts[g] = 0; });
    allCourses.forEach(c => { if (c.grade in counts) counts[c.grade]++; });
    return scale.grades.filter(g => counts[g] > 0).map(g => ({ name: scale.labels?.[g] ?? g, value: counts[g] }));
  }, [allCourses, scale]);

  const DIST_COLORS = ["#34d399","#6ee7b7","#fbbf24","#fb923c","#f87171","#ef4444"];

  const projGPA = useMemo(() => {
    const hypo = whatIf.filter(c => c.grade in scale.points && Number(c.credits) > 0);
    return calcGPAEff([...allCourses, ...hypo]);
  }, [allCourses, whatIf, scale, calcGPAEff]);

  const targetResult = useMemo(() => {
    if (!targetGPA) return null;
    const tg = parseFloat(targetGPA);
    if (isNaN(tg) || tg <= 0 || tg > scale.max) return null;
    const existPts   = allCourses.filter(c => c.grade in scale.points && Number(c.credits)>0).reduce((s,c)=>s+scale.points[c.grade]*Number(c.credits),0);
    let   existCreds = totalCreds;
    const pg = parseFloat(priorGPA), pc = parseFloat(priorCreds);
    let   adjPts = existPts;
    if (pg > 0 && pc > 0) { adjPts += pg*(scale.max/4.0)*pc; existCreds += pc; }
    const futCreds  = Number(targetCr);
    const neededAvg = futCreds > 0 ? (tg * (existCreds + futCreds) - adjPts) / futCreds : null;
    if (neededAvg === null) return null;
    const entries = Object.entries(scale.points).sort((a,b) => Math.abs(a[1]-neededAvg)-Math.abs(b[1]-neededAvg));
    return { neededAvg: parseFloat(neededAvg.toFixed(2)), closest: entries[0]?.[0], feasible: neededAvg <= scale.max && neededAvg >= 0 };
  }, [targetGPA, targetCr, allCourses, totalCreds, scale, priorGPA, priorCreds]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addSem       = ()        => setSemesters(p => [...p, { id: uid(), name: `Semester ${p.length+1}`, courses: [] }]);
  const updateSem    = (id,p)    => setSemesters(prev => prev.map(s => s.id===id?{...s,...p}:s));
  const delSem       = id        => setSemesters(p => p.filter(s => s.id!==id));
  const addCourse    = sid       => setSemesters(p => p.map(s => s.id===sid?{...s,courses:[...s.courses,{id:uid(),name:"",credits:3,grade:scale.grades[0]}]}:s));
  const updateCourse = (sid,cid,patch) => setSemesters(p => p.map(s => s.id===sid?{...s,courses:s.courses.map(c=>c.id===cid?{...c,...patch}:c)}:s));
  const delCourse    = (sid,cid) => setSemesters(p => p.map(s => s.id===sid?{...s,courses:s.courses.filter(c=>c.id!==cid)}:s));

  const applyTemplate = tplName => {
    const tpl = TEMPLATES[tplName];
    if (!tpl || !semesters.length) return;
    const last = semesters[semesters.length - 1];
    setSemesters(p => p.map(s => s.id===last.id ? { ...s, courses: tpl.map(t => ({ id: uid(), name: t.name, credits: t.credits, grade: scale.grades[0] })) } : s));
    setShowTemplate(false); setView("semesters");
  };

  const exportCSV = () => {
    const rows = [["Semester","Course","Credits","Grade","Grade Points"],
      ...semesters.flatMap(s => s.courses.map(c => [s.name,`"${c.name}"`,c.credits,c.grade,scale.points[c.grade]??""]))];
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));
    a.download = "gpa_data.csv"; a.click();
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const T = {
    bg: dark?"#0d1117":"#f5f3ef", card: dark?"#161b27":"#ffffff",
    border: dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)",
    text: dark?"#e8e0d0":"#1f2937", sub: dark?"#8896b0":"#6b7280",
    accent: "#e8b84b", accentBg: dark?"rgba(232,184,75,0.1)":"rgba(232,184,75,0.15)",
    input: dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",
    grid: dark?"#2a3145":"#e5e7eb", ttBg: dark?"#1e2535":"#ffffff",
    green: "#34d399", red: "#f87171", blue: "#60a5fa",
  };

  const col    = gColDyn(cgpa, scale.max);
  const colOwn = gColDyn(cgpaOwn, scale.max);
  const bestEntry = chartData.length ? chartData.reduce((b,d)=>d.gpa>b.gpa?d:b,chartData[0]) : null;
  const ttStyle = { background: T.ttBg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13 };
  const iS = { background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 11px", color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit" };
  const btnS = { padding: "8px 16px", background: T.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" };
  const navBtn = v => ({ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: view===v?T.accentBg:"transparent", color: view===v?T.accent:T.sub, transition: "all 0.15s", fontFamily: "inherit" });

  if (!ready) return <div style={{ background: "#0d1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8b84b", fontFamily: "sans-serif" }}>Loading…</div>;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>

      {/* Navbar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", height: 56, position: "sticky", top: 0, zIndex: 50, gap: 6 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.accent, marginRight: 14, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>GPA<span style={{ color: T.text }}>Vault</span></span>
        <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" }}>
          {[["dashboard","Dashboard"],["semesters","Semesters"],["analytics","Analytics"],["whatif","What-If"]].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={navBtn(v)}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={exportCSV} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>↓ CSV</button>
          <button onClick={() => setShowSettings(s=>!s)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${showSettings?T.accent:T.border}`, background: showSettings?T.accentBg:"transparent", color: showSettings?T.accent:T.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>⚙ Settings</button>
          <button onClick={() => setDark(d=>!d)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, cursor: "pointer", fontSize: 14 }}>{dark?"☀":"🌙"}</button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Grading Scale</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.keys(SCALES).map(s => (
                <button key={s} onClick={() => setScaleName(s)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${scaleName===s?T.accent:T.border}`, background: scaleName===s?T.accentBg:"transparent", color: scaleName===s?T.accent:T.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: scaleName===s?600:400 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Prior Record <span style={{ color: T.accent }}>(optional)</span></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>Previous GPA</div>
                <input type="number" placeholder={`0–${scale.max}`} value={priorGPA} onChange={e=>setPriorGPA(e.target.value)} style={{ ...iS, width: 90 }}/>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>Total Credits</div>
                <input type="number" placeholder="e.g. 60" value={priorCreds} onChange={e=>setPriorCreds(e.target.value)} style={{ ...iS, width: 90 }}/>
              </div>
              {priorGPA && priorCreds && <div style={{ paddingTop: 16, fontSize: 12, color: T.accent }}>✓ included</div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Degree Templates</div>
            <button onClick={() => setShowTemplate(t=>!t)} style={btnS}>📋 Apply Template</button>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplate && (
        <div onClick={() => setShowTemplate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 340, maxWidth: "90vw" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>Choose a Template</div>
            <p style={{ color: T.sub, fontSize: 13, margin: "0 0 16px" }}>Fills the latest semester with common courses.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.keys(TEMPLATES).map(t => (
                <button key={t} onClick={() => applyTemplate(t)}
                  style={{ padding: "10px 14px", background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, cursor: "pointer", fontSize: 14, textAlign: "left", fontFamily: "inherit", fontWeight: 500 }}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplate(false)} style={{ marginTop: 14, width: "100%", padding: "8px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 10, color: T.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 16px" }}>

        {/* ══════════════ DASHBOARD ══════════════ */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Academic Dashboard</h1>
              <p style={{ color: T.sub, fontSize: 14, margin: 0 }}>
                Scale: <strong style={{ color: T.accent }}>{scaleName}</strong>
                {priorGPA && priorCreds ? ` · Prior: ${parseFloat(priorGPA).toFixed(2)} GPA / ${priorCreds} cr included` : ""}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Cumulative GPA", val: fmt(cgpa),    col,      sub: priorGPA&&priorCreds?"incl. prior record":cgpa?(cgpa>=scale.max*0.875?"First Class":cgpa>=scale.max*0.75?"Good Standing":"Passing"):"No data" },
                { label: "Own GPA",        val: fmt(cgpaOwn), col: colOwn, sub: "current semesters only" },
                { label: "Total Credits",  val: totalCreds||0, col: T.accent, sub: `${semesters.length} semester${semesters.length!==1?"s":""}` },
                { label: "Best Semester",  val: bestEntry?fmt(bestEntry.gpa):"—", col: bestEntry?gColDyn(bestEntry.gpa,scale.max):T.sub, sub: bestEntry?.name??"—" },
              ].map(({label,val,col:c,sub:s}) => (
                <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: c, fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>{val}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <GpaRing gpa={cgpa} max={scale.max} col={col} T={T}/>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 6, textAlign: "center" }}>CGPA / {scale.max}</div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Semesters</div>
                {semesters.length === 0 ? (
                  <div style={{ color: T.sub, fontSize: 13, marginBottom: 10 }}>No semesters yet.</div>
                ) : semesters.map(s => {
                  const g = calcGPA(s.courses, scale), cr = semCreds(s, scale.points);
                  return (
                    <div key={s.id} style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => setView("semesters")}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{s.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: gColDyn(g,scale.max) }}>{fmt(g)} <span style={{ fontSize: 11, color: T.sub, fontWeight: 400 }}>({cr} cr)</span></span>
                      </div>
                      <div style={{ height: 6, background: T.grid, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${g!==null?(g/scale.max)*100:0}%`, background: gColDyn(g,scale.max), borderRadius: 4, transition: "width 0.5s ease" }}/>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { addSem(); setView("semesters"); }} style={{ padding: "6px 14px", background: T.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>+ Add Semester</button>
              </div>
            </div>

            {chartData.length >= 2 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>GPA trend</div>
                <ResponsiveContainer width="100%" height={110}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                    <defs><linearGradient id="miniG" x1="0" y1="0" x2="0" y2="1"><stop offset="10%" stopColor="#e8b84b" stopOpacity={0.3}/><stop offset="95%" stopColor="#e8b84b" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.grid}/>
                    <XAxis dataKey="name" tick={{ fill: T.sub, fontSize: 11 }}/>
                    <YAxis domain={[0,scale.max]} tick={{ fill: T.sub, fontSize: 11 }} tickCount={5}/>
                    <Tooltip contentStyle={ttStyle}/>
                    <Area type="monotone" dataKey="gpa" stroke="#e8b84b" fill="url(#miniG)" strokeWidth={2} dot={{ fill: "#e8b84b", r: 4 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ SEMESTERS ══════════════ */}
        {view === "semesters" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Semesters</h1>
                <p style={{ color: T.sub, fontSize: 14, margin: 0 }}>Scale: <strong style={{ color: T.accent }}>{scaleName}</strong> · Double-click name to rename</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setShowTemplate(true)} style={{ ...btnS, fontSize: 12 }}>📋 Template</button>
                <button onClick={addSem} style={{ padding: "9px 18px", background: T.accent, border: "none", borderRadius: 10, color: "#0d1117", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>+ Semester</button>
              </div>
            </div>
            {semesters.length === 0
              ? <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.sub, fontSize: 14 }}>No semesters yet.</div>
              : semesters.map(s => (
                <SemesterCard key={s.id} sem={s} T={T} scale={scale}
                  onUpdate={p => updateSem(s.id,p)} onDelete={() => delSem(s.id)}
                  addCourse={() => addCourse(s.id)}
                  updateCourse={(cid,p) => updateCourse(s.id,cid,p)}
                  deleteCourse={cid => delCourse(s.id,cid)}/>
              ))}
          </div>
        )}

        {/* ══════════════ ANALYTICS ══════════════ */}
        {view === "analytics" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Analytics</h1>
              <p style={{ color: T.sub, fontSize: 14, margin: 0 }}>Performance breakdown across your academic career.</p>
            </div>
            {chartData.length < 1
              ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 48, textAlign: "center", color: T.sub, fontSize: 14 }}>Add at least one graded semester to unlock analytics.</div>
              : (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 14 }}>
                  {[
                    { label: "Cumulative GPA", val: fmt(cgpa),                                              col },
                    { label: "Best semester",  val: fmt(Math.max(...chartData.map(d=>d.gpa))),              col: T.green },
                    { label: "Worst semester", val: fmt(Math.min(...chartData.map(d=>d.gpa))),              col: gColDyn(Math.min(...chartData.map(d=>d.gpa)),scale.max) },
                    { label: "Avg credits",    val: parseFloat((chartData.reduce((s,d)=>s+d.credits,0)/chartData.length).toFixed(1)), col: T.accent },
                    { label: "Total courses",  val: allCourses.length,                                      col: T.blue },
                    { label: "Graded entries", val: allCourses.filter(c=>c.grade in scale.points).length,   col: T.sub },
                  ].map(({label,val,col:c}) => (
                    <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: T.sub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: "'Playfair Display',serif" }}>{val}</div>
                    </div>
                  ))}
                </div>

                {chartData.length >= 2 && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px 10px", marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>GPA over time</div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>Semester GPA across all terms</div>
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                        <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e8b84b" stopOpacity={0.4}/><stop offset="95%" stopColor="#e8b84b" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.grid}/>
                        <XAxis dataKey="name" tick={{ fill: T.sub, fontSize: 12 }}/>
                        <YAxis domain={[0,scale.max]} tick={{ fill: T.sub, fontSize: 12 }} tickCount={5}/>
                        <Tooltip contentStyle={ttStyle} formatter={v=>[v,"GPA"]}/>
                        <Area type="monotone" dataKey="gpa" stroke="#e8b84b" fill="url(#areaG)" strokeWidth={2.5} dot={{ fill: "#e8b84b", r: 5 }} activeDot={{ r: 7 }}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 16px 10px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>Credits per semester</div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Credit load by term</div>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -26 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.grid}/>
                        <XAxis dataKey="name" tick={{ fill: T.sub, fontSize: 11 }}/>
                        <YAxis tick={{ fill: T.sub, fontSize: 11 }}/>
                        <Tooltip contentStyle={ttStyle} formatter={v=>[v,"Credits"]}/>
                        <Bar dataKey="credits" fill="#60a5fa" radius={[5,5,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 16px 10px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>Grade distribution</div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Frequency of each grade</div>
                    {gradeDistData.length === 0
                      ? <div style={{ color: T.sub, fontSize: 13, padding: "20px 0" }}>No graded courses yet.</div>
                      : <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie data={gradeDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={58} innerRadius={28} paddingAngle={3}>
                              {gradeDistData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i%DIST_COLORS.length]}/>)}
                            </Pie>
                            <Tooltip contentStyle={ttStyle} formatter={(v,n)=>[`${v} course${v!==1?"s":""}`,n]}/>
                            <Legend wrapperStyle={{ fontSize: 11, color: T.sub }}/>
                          </PieChart>
                        </ResponsiveContainer>
                    }
                  </div>
                </div>
              </>)
            }
          </div>
        )}

        {/* ══════════════ WHAT-IF ══════════════ */}
        {view === "whatif" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>What-If Planner</h1>
              <p style={{ color: T.sub, fontSize: 14, margin: 0 }}>Forecast your GPA and find the grades you need to hit a target.</p>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Current CGPA",   val: fmt(cgpa),    c: col,                       note: priorGPA&&priorCreds?"incl. prior record":"from logged data",                                       bdr: T.border },
                { label: "Projected CGPA", val: fmt(projGPA), c: gColDyn(projGPA,scale.max), note: cgpa&&projGPA?((projGPA-cgpa)>0.005?`↑ +${(projGPA-cgpa).toFixed(2)}`:(projGPA-cgpa)<-0.005?`↓ ${(projGPA-cgpa).toFixed(2)}`:"no change"):"add courses below", bdr: "rgba(232,184,75,0.4)" },
              ].map(({label,val,c,note,bdr}) => (
                <div key={label} style={{ flex: 1, minWidth: 140, background: T.card, border: `2px solid ${bdr}`, borderRadius: 14, padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 42, fontWeight: 700, color: c, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 13, color: T.sub, marginTop: 6 }}>{note}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Hypothetical Courses</div>
              <p style={{ color: T.sub, fontSize: 13, margin: "0 0 14px" }}>Projected CGPA updates live as you add courses.</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11, color: T.sub, fontWeight: 500 }}>
                <span style={{ flex: 2 }}>COURSE NAME</span><span style={{ width: 72 }}>CREDITS</span><span style={{ width: 96 }}>GRADE</span><span style={{ width: 28 }}/>
              </div>
              {whatIf.map((row,i) => (
                <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input placeholder={`Course ${i+1}`} value={row.name} onChange={e=>setWhatIf(p=>p.map(r=>r.id===row.id?{...r,name:e.target.value}:r))} style={{ ...iS, flex: 2, minWidth: 0 }}/>
                  <input type="number" value={row.credits} min={0.5} max={6} step={0.5} onChange={e=>setWhatIf(p=>p.map(r=>r.id===row.id?{...r,credits:e.target.value}:r))} style={{ ...iS, width: 72 }}/>
                  <select value={row.grade} onChange={e=>setWhatIf(p=>p.map(r=>r.id===row.id?{...r,grade:e.target.value}:r))} style={{ ...iS, width: 96, cursor: "pointer" }}>
                    {scale.grades.map(g=><option key={g} value={g}>{scale.labels?.[g]??g} ({scale.points[g]?.toFixed(scale.max>=10?0:1)})</option>)}
                  </select>
                  <button onClick={()=>setWhatIf(p=>p.filter(r=>r.id!==row.id))} style={{ width: 28, height: 32, background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              ))}
              <button onClick={()=>setWhatIf(p=>[...p,{id:uid(),name:"",credits:3,grade:scale.grades[0]}])} style={btnS}>+ Add Course</button>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Target GPA Calculator</div>
              <p style={{ color: T.sub, fontSize: 13, margin: "0 0 16px" }}>What average grade do you need in upcoming credits to reach a target?</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>TARGET CGPA</div>
                  <input type="number" placeholder={`e.g. ${(scale.max*0.875).toFixed(1)}`} value={targetGPA} onChange={e=>setTargetGPA(e.target.value)} min={0} max={scale.max} step={0.1} style={{ ...iS, width: 110 }}/>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>REMAINING CREDITS</div>
                  <input type="number" value={targetCr} min={1} max={200} onChange={e=>setTargetCr(e.target.value)} style={{ ...iS, width: 110 }}/>
                </div>
              </div>
              {targetResult && (
                <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: targetResult.feasible?T.accentBg:"rgba(248,113,113,0.1)", border: `1px solid ${targetResult.feasible?"rgba(232,184,75,0.3)":"rgba(248,113,113,0.3)"}` }}>
                  {targetResult.feasible ? (<>
                    <div style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>You need an average grade of:</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: T.accent, fontFamily: "'Playfair Display',serif", lineHeight: 1, marginBottom: 6 }}>{targetResult.neededAvg.toFixed(2)} pts</div>
                    <div style={{ fontSize: 13, color: T.sub }}>That's closest to <strong style={{ color: T.text }}>{targetResult.closest}</strong> ({scale.points[targetResult.closest]?.toFixed(scale.max>=10?0:1)} pts) on the {scaleName} scale.</div>
                  </>) : (
                    <div style={{ fontSize: 14, color: "#f87171" }}>This target isn't achievable with {targetCr} credits — it would require {targetResult.neededAvg > scale.max ? "above the maximum possible" : "negative"} grade points. Try adjusting the target or adding more credits.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
