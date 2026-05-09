import { useState, useEffect } from "react";

const pad = n => String(n).padStart(2, "0");
const msToT = ms => {
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    sc: s % 60
  };
};

function sGet(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}
function sSet(key, val) {
  try { localStorage.setItem(key, val); }
  catch(e) { console.warn("storage failed", e); }
}

export default function App() {
  const [startMs, setStartMs] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showInput, setShowInput] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sGet("fp_start");
    if (saved) setStartMs(parseInt(saved, 10));
    else setShowInput(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function saveDate() {
    if (!dateInput) return;
    const ms = new Date(dateInput).getTime();
    setStartMs(ms);
    setShowInput(false);
    sSet("fp_start", String(ms));
  }

  function reset() {
    setShowInput(true);
    setStartMs(null);
    sSet("fp_start", "");
  }

  const elapsed = startMs ? now - startMs : 0;
  const timer = msToT(elapsed);
  const days = Math.floor(elapsed / 86400000);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#000510",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8",fontFamily:"Georgia,serif",fontSize:14}}>
      Loading realm...
    </div>
  );

  if (showInput) return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 25%,#021d3a,#000510)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:24}}>
      <div style={{fontSize:42,marginBottom:12}}>⚜️</div>
      <div style={{fontSize:22,fontWeight:700,color:"#e0f2fe",marginBottom:6}}>FREEDOMPATH</div>
      <div style={{fontSize:12,color:"#38bdf8",marginBottom:8,textAlign:"center"}}>When was your last relapse?</div>
      <div style={{fontSize:11,color:"#475569",marginBottom:24,textAlign:"center"}}>Your real streak will be calculated from this date</div>
      <input
        type="datetime-local"
        value={dateInput}
        onChange={e => setDateInput(e.target.value)}
        style={{padding:"12px 16px",borderRadius:10,border:"1px solid rgba(14,165,233,0.3)",background:"rgba(0,0,0,0.5)",color:"#e0f2fe",fontSize:14,marginBottom:16,width:"100%",maxWidth:320,fontFamily:"Georgia,serif"}}
      />
      <button onClick={saveDate} style={{padding:"13px 32px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%",maxWidth:320,marginBottom:12}}>
        ⚔️ Begin My Quest
      </button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#021d3a,#000510)",fontFamily:"Georgia,serif",color:"#e0f2fe",maxWidth:430,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#38bdf8,#f59e0b,#38bdf8,transparent)"}} />
      
      <div style={{textAlign:"center",marginBottom:24,paddingTop:16}}>
        <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.2em",marginBottom:4}}>THE ORDER OF</div>
        <div style={{fontSize:24,fontWeight:700}}>FREEDOM<span style={{color:"#38bdf8"}}>PATH</span></div>
      </div>

      <div style={{textAlign:"center",padding:"24px 16px",borderRadius:16,background:"linear-gradient(160deg,#021d3a,#010b1a)",border:"1px solid rgba(14,165,233,0.2)",marginBottom:16,boxShadow:"0 0 28px rgba(14,165,233,0.1)"}}>
        <div style={{fontSize:9,letterSpacing:"0.2em",color:"#475569",marginBottom:16}}>⚔️ QUEST TIME ELAPSED ⚔️</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
          {[["DAYS",pad(timer.d)],["HRS",pad(timer.h)],["MIN",pad(timer.m)],["SEC",pad(timer.sc)]].map(([lbl,val]) => (
            <div key={lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:30,fontWeight:900,background:"linear-gradient(180deg,#011428,#021d3a)",border:"1px solid rgba(56,189,248,0.3)",borderRadius:10,padding:"6px 10px",minWidth:52,color:"#e0f2fe",textShadow:"0 0 16px #38bdf8"}}>{val}</div>
              <div style={{fontSize:7,color:"#475569",marginTop:4,letterSpacing:"0.1em"}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:13,color:"#7dd3fc",marginTop:8}}>Day {days} — Keep going, warrior ⚔️</div>
      </div>

      <div style={{padding:"14px",borderRadius:12,background:"rgba(14,165,233,0.04)",border:"1px solid rgba(14,165,233,0.12)",fontSize:12,color:"#7dd3fc",lineHeight:1.6,fontStyle:"italic",textAlign:"center",marginBottom:16}}>
        "An urge lasts 90 seconds if you don't feed it. Sit with it. Let it pass."
      </div>

      <button onClick={reset} style={{width:"100%",padding:"13px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:10}}>
        💀 Fell in Battle — Reset & Set New Date
      </button>

      <button onClick={() => setShowInput(true)} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(14,165,233,0.06)",border:"1px solid rgba(14,165,233,0.15)",color:"#38bdf8",fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer"}}>
        + Change Start Date
      </button>
    </div>
  );
}
