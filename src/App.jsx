import { useState, useEffect } from "react";

const pad = n => String(n).padStart(2, "0");
const msToT = ms => {
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), sc: s % 60 };
};
const sGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const sSet = (key, val) => { try { localStorage.setItem(key, val); } catch(e) { console.warn(e); } };
const sParse = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const sSave = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn(e); } };
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayStr = () => fmtDate(new Date());

const RANKS = [
  { days:0,   name:"Serf",           icon:"🪨", color:"#94a3b8", xpBonus:0    },
  { days:1,   name:"Peasant Warrior",icon:"🗡️", color:"#84cc16", xpBonus:10   },
  { days:3,   name:"Foot Soldier",   icon:"🛡️", color:"#22d3ee", xpBonus:20   },
  { days:7,   name:"Squire",         icon:"⚔️", color:"#3b82f6", xpBonus:30   },
  { days:14,  name:"Knight",         icon:"🏇", color:"#8b5cf6", xpBonus:50   },
  { days:21,  name:"Knight Captain", icon:"🎖️", color:"#a855f7", xpBonus:75   },
  { days:30,  name:"Lord",           icon:"👑", color:"#f59e0b", xpBonus:100  },
  { days:60,  name:"Baron",          icon:"🏰", color:"#f97316", xpBonus:200  },
  { days:90,  name:"Duke",           icon:"⚜️", color:"#ef4444", xpBonus:300  },
  { days:180, name:"Archduke",       icon:"🔱", color:"#ec4899", xpBonus:500  },
  { days:365, name:"High King",      icon:"✨", color:"#fbbf24", xpBonus:1000 },
];
const getRank = days => { let r = RANKS[0]; for (const k of RANKS) if (days >= k.days) r = k; return r; };
const getNextRank = days => RANKS.find(r => r.days > days) || null;
const calcXP = days => { let x = days * 10; for (const r of RANKS) if (days >= r.days) x += r.xpBonus; return x; };

const MILESTONES = [
  { days:1,   icon:"🗡️", title:"First Blood Denied",   reward:"The first battle is won. Your willpower stirs from slumber. The enemy did not expect this.", bonus:10  },
  { days:3,   icon:"🛡️", title:"Shield Raised",         reward:"Three days of iron resolve. Your shield grows stronger with every hour. The realm notices.", bonus:20 },
  { days:7,   icon:"⚔️", title:"Baptism of Steel",      reward:"A full week of sovereignty. The sword is yours to wield. Few ever reach this moment.", bonus:30 },
  { days:14,  icon:"🏇", title:"Knight's Oath Taken",   reward:"Fourteen days. You have sworn the ancient oath before the realm. The title is earned.", bonus:50 },
  { days:21,  icon:"🎖️", title:"Battle-Hardened",       reward:"Three weeks forged in discipline. The enemy knows your name and fears to meet you.", bonus:75 },
  { days:30,  icon:"👑", title:"Lord of the Realm",     reward:"One moon cycle conquered. Your domain is secured. The people rally to your banner.", bonus:100 },
  { days:60,  icon:"🏰", title:"Citadel Built",         reward:"Sixty days. Your citadel stands against any siege. Stone by stone, you built this.", bonus:200 },
  { days:90,  icon:"⚜️", title:"Duke's Sovereignty",   reward:"Ninety days. The three-month sovereign. Your walls are unbreachable. The war is turning.", bonus:300 },
  { days:180, icon:"🔱", title:"Archduke Ascending",    reward:"Six months of freedom. Half a year reborn. The crown is close. The realm trembles.", bonus:500 },
  { days:365, icon:"✨", title:"High King Reigns",      reward:"One full year. You have become the legend. Songs will be written. The realm is forever free.", bonus:1000 },
];

const TECHNIQUES = [
  {
    name:"Tactical Breathing", icon:"💨", color:"#0ea5e9",
    desc:"Box breathing shuts down the stress response in under 2 minutes.",
    steps:[
      "Sit upright. Close your eyes. Place both hands on your knees.",
      "Inhale slowly through your nose for 4 counts...  1... 2... 3... 4...",
      "Hold your breath for 4 counts... 1... 2... 3... 4...",
      "Exhale through your mouth for 4 counts... 1... 2... 3... 4...",
      "Hold empty lungs for 4 counts... 1... 2... 3... 4...",
      "Repeat 3 more full cycles. Each cycle weakens the urge.",
      "The storm has passed. Return to your quest. ⚔️",
    ]
  },
  {
    name:"Urge Siege Breaker", icon:"🏹", color:"#f59e0b",
    desc:"Urge surfing — ride the wave without acting. Urges peak at 90 seconds.",
    steps:[
      "Notice the urge. Don't fight it. Simply observe it.",
      "Where do you feel it? Chest? Gut? Throat? Name the sensation.",
      "Watch it like a knight watching an enemy charge from a tower.",
      "The urge is peaking now. It CANNOT last more than 90 seconds.",
      "Feel it cresting. It is already weakening. You have not moved.",
      "The charge failed. The gates held. The enemy retreats.",
      "Victory. The siege is broken. You are unbroken. ⚔️",
    ]
  },
  {
    name:"Realm Grounding", icon:"🌿", color:"#22c55e",
    desc:"5-4-3-2-1 sensory grounding pulls you out of the trance instantly.",
    steps:[
      "Name 5 things you can SEE right now. Look around the room slowly.",
      "Name 4 things you can TOUCH right now. Feel each texture fully.",
      "Name 3 things you can HEAR right now. Listen for quiet sounds too.",
      "Name 2 things you can SMELL right now. Even faint scents count.",
      "Name 1 thing you can TASTE right now. Notice it completely.",
      "You are HERE. You are PRESENT. The urge needed your absence.",
      "You have returned to the realm. Nothing can touch you here. ⚔️",
    ]
  },
  {
    name:"Cold Forge", icon:"❄️", color:"#7dd3fc",
    desc:"Cold visualization resets the dopamine circuit within minutes.",
    steps:[
      "Close your eyes. Picture a mountain waterfall, glacial and pure.",
      "You step under it. The cold hits your neck and shoulders hard.",
      "Breathe INTO the cold. Let it shock you fully awake.",
      "Feel the water rushing down your spine. Every nerve fires.",
      "The heat of the urge is extinguished by the cold current.",
      "Breathe out slowly. The water clears every trace of fog.",
      "You emerge forged. Tempered steel. Harder than before. ⚔️",
    ]
  },
  {
    name:"King's Vision", icon:"👁️", color:"#a855f7",
    desc:"See your 90-day self. Make the urge feel small by comparison.",
    steps:[
      "Close your eyes. Travel exactly 90 days forward in time.",
      "See yourself in a mirror. How do you look? How do you feel?",
      "Sense the energy you carry — clear eyes, strong posture, calm mind.",
      "Who respects you now? What have you built in these 90 days?",
      "Look back at this moment from there. The urge is a tiny flicker.",
      "The King does not bow to a flicker.",
      "Open your eyes. Act from your future self. The crown is real. ⚔️",
    ]
  },
];

const SEED_POSTS = [
  { id:"s1", user:"IronVow_Marcus",  rank:"Lord",     days:31,  text:"30 days hit last night. Cried a little. Worth every second. Stay the path brothers.", likes:24, ts:Date.now()-86400000*2 },
  { id:"s2", user:"NightWatch_77",   rank:"Knight",   days:16,  text:"Urge came hard at 2am. Used the box breathing for 4 full cycles. It passed. The tools work.", likes:18, ts:Date.now()-86400000*4 },
  { id:"s3", user:"SquireOfDawn",    rank:"Squire",   days:8,   text:"First week done. Didn't think I'd make it past day 3. Told myself just one more hour every time.", likes:31, ts:Date.now()-86400000*6 },
  { id:"s4", user:"KingReborn_X",    rank:"High King",days:371, text:"Year one complete. This app was open every single day. You all kept me going. The realm is real.", likes:87, ts:Date.now()-86400000*1 },
  { id:"s5", user:"Castellan_Rook",  rank:"Baron",    days:63,  text:"Relapsed at day 58. Logged it, read my own note, got back up. The chronicle doesn't lie. Use it.", likes:42, ts:Date.now()-86400000*3 },
];

const AVATARS = ["⚔️","🛡️","👑","🏹","🗡️","🔱","⚜️","🏰","🦁","🐉","🦅","🌟","🔥","💎","🌙","☀️","🌊","⛰️","🎯","🏆"];

const glass = (extra={}) => ({
  borderRadius:14,
  background:"linear-gradient(160deg,rgba(2,29,58,0.92),rgba(1,11,26,0.97))",
  border:"1px solid rgba(14,165,233,0.18)",
  ...extra
});
const modalOverlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:300 };
const modalSheet = { background:"linear-gradient(160deg,#021d3a,#010b1a)", border:"1px solid rgba(14,165,233,0.25)", borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto" };
const inputStyle = { padding:"12px 14px", borderRadius:10, border:"1px solid rgba(14,165,233,0.25)", background:"rgba(0,5,16,0.9)", color:"#e0f2fe", fontSize:14, fontFamily:"Georgia,serif", width:"100%", boxSizing:"border-box", outline:"none" };

export default function App() {
  const [startMs, setStartMs] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showInput, setShowInput] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinState, setPinState] = useState("locked");
  const [pinDigits, setPinDigits] = useState("");
  const [storedPin, setStoredPin] = useState(null);
  const [pinError, setPinError] = useState("");
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [techStep, setTechStep] = useState(0);
  const [relapseNote, setRelapseNote] = useState("");
  const [relapses, setRelapses] = useState([]);
  const [profile, setProfile] = useState({ name:"Warrior", motto:"I rise every time I fall.", avatar:"⚔️" });
  const [editProfile, setEditProfile] = useState(null);
  const [journal, setJournal] = useState({});
  const [journalDay, setJournalDay] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());
  const [forumPosts, setForumPosts] = useState([]);
  const [forumLikes, setForumLikes] = useState([]);
  const [forumDraft, setForumDraft] = useState("");
  const [newPin, setNewPin] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  useEffect(() => {
    const pin = sGet("fp_pin");
    setStoredPin(pin);
    setPinState(pin ? "locked" : "setting");
    const saved = sGet("fp_start");
    if (saved) setStartMs(parseInt(saved, 10));
    else setShowInput(true);
    setRelapses(sParse("fp_relapses", []));
    setJournal(sParse("fp_journal", {}));
    const prof = sParse("fp_profile", null);
    if (prof) setProfile(prof);
    setForumPosts(sParse("fp_forum", null) || SEED_POSTS);
    setForumLikes(sParse("fp_likes", []));
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = startMs ? now - startMs : 0;
  const timer = msToT(elapsed);
  const days = Math.floor(elapsed / 86400000);
  const rank = getRank(days);
  const nextRank = getNextRank(days);
  const xp = calcXP(days);
  const lastRelapse = relapses.length ? relapses[relapses.length - 1] : null;

  const xpProgress = () => {
    if (!nextRank) return 1;
    const curXP = calcXP(rank.days);
    const nxtXP = calcXP(nextRank.days);
    if (nxtXP === curXP) return 1;
    return Math.min(1, (xp - curXP) / (nxtXP - curXP));
  };

  function saveDate() {
    if (!dateInput) return;
    const ms = new Date(dateInput).getTime();
    setStartMs(ms); setShowInput(false);
    sSet("fp_start", String(ms));
  }

  function handlePinInput(d) {
    if (pinDigits.length >= 4) return;
    const next = pinDigits + d;
    setPinDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinState === "setting") {
          sSet("fp_pin", next); setStoredPin(next); setPinState("unlocked");
        } else {
          if (next === storedPin) { setPinState("unlocked"); setPinError(""); }
          else { setPinError("Wrong PIN — try again"); }
        }
        setPinDigits("");
      }, 150);
    }
  }

  function logRelapse() {
    const entry = { timestamp: Date.now(), note: relapseNote };
    const updated = [...relapses, entry];
    setRelapses(updated); sSave("fp_relapses", updated);
    const ms = Date.now();
    setStartMs(ms); sSet("fp_start", String(ms));
    setRelapseNote(""); setModal(null);
  }

  function saveJournal() {
    if (!journalDay) return;
    const updated = { ...journal, [journalDay]: journalText };
    setJournal(updated); sSave("fp_journal", updated);
    setJournalDay(null);
  }

  function postForum() {
    if (!forumDraft.trim()) return;
    const post = { id:`u${Date.now()}`, user:profile.name, rank:rank.name, days, text:forumDraft.trim(), likes:0, ts:Date.now() };
    const updated = [post, ...forumPosts];
    setForumPosts(updated); sSave("fp_forum", updated); setForumDraft("");
  }

  function toggleLike(id) {
    const liked = forumLikes.includes(id);
    const updated = liked ? forumLikes.filter(x=>x!==id) : [...forumLikes, id];
    setForumLikes(updated); sSave("fp_likes", updated);
    setForumPosts(posts => posts.map(p => p.id===id ? {...p, likes:p.likes+(liked?-1:1)} : p));
  }

  function saveProfile() {
    if (!editProfile) return;
    setProfile(editProfile); sSave("fp_profile", editProfile);
    setEditProfile(null); setModal(null);
  }

  function doChangePin() {
    if (newPin.length !== 4) return;
    sSet("fp_pin", newPin); setStoredPin(newPin); setNewPin(""); setModal(null);
  }

  if (loading) return <div style={{minHeight:"100vh",background:"#000510",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8",fontFamily:"Georgia,serif"}}>Loading realm...</div>;

  if (pinState !== "unlocked") return <PinScreen state={pinState} digits={pinDigits} error={pinError} onDigit={handlePinInput} onDel={()=>setPinDigits(p=>p.slice(0,-1))} />;

  if (showInput) return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 25%,#021d3a,#000510)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:24}}>
      <div style={{fontSize:42,marginBottom:12}}>⚜️</div>
      <div style={{fontSize:22,fontWeight:700,color:"#e0f2fe",marginBottom:6}}>FREEDOMPATH</div>
      <div style={{fontSize:12,color:"#38bdf8",marginBottom:8,textAlign:"center"}}>When was your last relapse?</div>
      <div style={{fontSize:11,color:"#475569",marginBottom:24,textAlign:"center"}}>Your real streak will be calculated from this date</div>
      <input type="datetime-local" value={dateInput} onChange={e=>setDateInput(e.target.value)}
        style={{padding:"12px 16px",borderRadius:10,border:"1px solid rgba(14,165,233,0.3)",background:"rgba(0,0,0,0.5)",color:"#e0f2fe",fontSize:14,marginBottom:16,width:"100%",maxWidth:320,fontFamily:"Georgia,serif"}} />
      <button onClick={saveDate} style={{padding:"13px 32px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%",maxWidth:320}}>
        ⚔️ Begin My Quest
      </button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#021d3a,#000510)",fontFamily:"Georgia,serif",color:"#e0f2fe",maxWidth:430,margin:"0 auto",paddingBottom:72}}>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:3,background:"linear-gradient(90deg,transparent,#38bdf8 30%,#f59e0b 50%,#38bdf8 70%,transparent)",zIndex:100}} />

      <div style={{padding:"20px 16px 8px",textAlign:"center",position:"relative"}}>
        <button onClick={()=>{setEditProfile({...profile});setModal("settings");}}
          style={{position:"absolute",right:16,top:22,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:20,padding:4}}>⚙️</button>
        <div style={{fontSize:9,color:"#38bdf8",letterSpacing:"0.25em",marginBottom:2}}>THE ORDER OF</div>
        <div style={{fontSize:24,fontWeight:700}}>FREEDOM<span style={{color:"#38bdf8"}}>PATH</span></div>
        <div style={{fontSize:14,marginTop:6}}><span style={{fontSize:18}}>{rank.icon}</span> <span style={{color:rank.color,fontWeight:700}}>{rank.name}</span></div>
        {profile.motto && <div style={{fontSize:10,color:"#475569",fontStyle:"italic",marginTop:2}}>"{profile.motto}"</div>}
      </div>

      {tab==="home"      && <HomeTab timer={timer} days={days} rank={rank} nextRank={nextRank} xp={xp} xpProg={xpProgress()} lastRelapse={lastRelapse} onUrge={()=>setModal("urge")} onRelapse={()=>setModal("relapse")} onChangeDate={()=>setShowInput(true)} />}
      {tab==="ranks"     && <RanksTab days={days} onSelect={m=>{setSelectedMilestone(m);setModal("milestone");}} />}
      {tab==="chronicle" && <ChronicleTab startMs={startMs} relapses={relapses} journal={journal} calMonth={calMonth} setCalMonth={setCalMonth} onSelectDay={d=>{setJournalDay(d);setJournalText(journal[d]||"");}} journalDay={journalDay} journalText={journalText} setJournalText={setJournalText} onSaveJournal={saveJournal} onCancelJournal={()=>setJournalDay(null)} />}
      {tab==="order"     && <OrderTab posts={forumPosts} likes={forumLikes} draft={forumDraft} setDraft={setForumDraft} onPost={postForum} onLike={toggleLike} myRank={rank.name} myDays={days} myAvatar={profile.avatar} />}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"linear-gradient(180deg,rgba(1,11,26,0.98),#000510)",borderTop:"1px solid rgba(14,165,233,0.15)",display:"flex",zIndex:99}}>
        {[["home","🏠","Home"],["ranks","🏅","Ranks"],["chronicle","📅","Chronicle"],["order","⚔️","Order"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px 14px",background:"none",border:"none",color:tab===id?"#f59e0b":"#475569",fontSize:9,fontFamily:"Georgia,serif",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{letterSpacing:"0.05em"}}>{label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {modal==="urge"      && <UrgeModal onClose={()=>setModal(null)} onSelect={t=>{setActiveTech(t);setTechStep(0);setModal("technique");}} />}
      {modal==="technique" && activeTech && <TechniqueModal tech={activeTech} step={techStep} setStep={setTechStep} onBack={()=>setModal("urge")} onComplete={()=>setModal(null)} />}
      {modal==="relapse"   && <RelapseModal note={relapseNote} setNote={setRelapseNote} onLog={logRelapse} onClose={()=>setModal(null)} lastRelapse={lastRelapse} />}
      {modal==="milestone" && selectedMilestone && <MilestoneModal m={selectedMilestone} days={days} onClose={()=>setModal(null)} />}
      {modal==="settings"  && editProfile && <SettingsModal profile={editProfile} setProfile={setEditProfile} days={days} xp={xp} relapses={relapses} rank={rank} onSave={saveProfile} onClose={()=>setModal(null)} onChangePin={()=>setModal("changePin")} />}
      {modal==="changePin" && <ChangePinModal newPin={newPin} setNewPin={setNewPin} onSave={doChangePin} onClose={()=>setModal("settings")} />}
    </div>
  );
}

function PinScreen({ state, digits, error, onDigit, onDel }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 25%,#021d3a,#000510)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:24}}>
      <div style={{fontSize:36,marginBottom:8}}>⚜️</div>
      <div style={{fontSize:22,fontWeight:700,color:"#e0f2fe",marginBottom:4}}>FREEDOMPATH</div>
      <div style={{fontSize:13,color:"#38bdf8",marginBottom:32}}>{state==="setting"?"Set your 4-digit PIN":"Enter your PIN"}</div>
      <div style={{display:"flex",gap:16,marginBottom:8}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:18,height:18,borderRadius:"50%",border:"2px solid rgba(14,165,233,0.5)",background:digits.length>i?"#0ea5e9":"transparent",transition:"background 0.15s"}} />
        ))}
      </div>
      <div style={{minHeight:26,display:"flex",alignItems:"center",marginBottom:4}}>
        {error && <div style={{fontSize:12,color:"#f87171"}}>{error}</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12,marginTop:4}}>
        {keys.map((k,i)=>(
          <button key={i} onClick={k==="⌫"?onDel:k?()=>onDigit(k):undefined}
            style={{height:60,borderRadius:12,border:"1px solid rgba(14,165,233,0.2)",background:k?"rgba(2,29,58,0.8)":"transparent",color:"#e0f2fe",fontSize:k==="⌫"?20:22,fontFamily:"Georgia,serif",cursor:k?"pointer":"default",fontWeight:700}}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeTab({ timer, days, rank, nextRank, xp, xpProg, lastRelapse, onUrge, onRelapse, onChangeDate }) {
  return (
    <div style={{padding:"8px 16px 16px"}}>
      <div style={{...glass(),padding:"20px 16px",marginBottom:12,textAlign:"center",boxShadow:"0 0 30px rgba(14,165,233,0.08)"}}>
        <div style={{fontSize:9,letterSpacing:"0.2em",color:"#475569",marginBottom:14}}>⚔️ QUEST TIME ELAPSED ⚔️</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10}}>
          {[["DAYS",pad(timer.d)],["HRS",pad(timer.h)],["MIN",pad(timer.m)],["SEC",pad(timer.sc)]].map(([lbl,val])=>(
            <div key={lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:30,fontWeight:900,background:"linear-gradient(180deg,#011428,#021d3a)",border:"1px solid rgba(56,189,248,0.3)",borderRadius:10,padding:"6px 10px",minWidth:52,color:"#e0f2fe",textShadow:"0 0 16px rgba(56,189,248,0.6)"}}>{val}</div>
              <div style={{fontSize:7,color:"#475569",marginTop:4,letterSpacing:"0.1em"}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:13,color:"#7dd3fc"}}>Day {days} — Keep going, warrior ⚔️</div>
      </div>

      <div style={{...glass(),padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><span style={{fontSize:16,color:rank.color}}>{rank.icon} </span><span style={{fontSize:13,fontWeight:700,color:rank.color}}>{rank.name}</span></div>
          <div style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>{xp} XP</div>
        </div>
        <div style={{height:6,borderRadius:3,background:"rgba(14,165,233,0.12)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${xpProg*100}%`,background:`linear-gradient(90deg,${rank.color},#f59e0b)`,borderRadius:3,transition:"width 1s ease"}} />
        </div>
        {nextRank
          ? <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <div style={{fontSize:9,color:"#475569"}}>{rank.name}</div>
              <div style={{fontSize:9,color:"#475569"}}>{nextRank.days-days}d to <span style={{color:nextRank.color}}>{nextRank.name}</span></div>
            </div>
          : <div style={{fontSize:10,color:"#f59e0b",textAlign:"center",marginTop:6}}>✨ Maximum Rank Achieved ✨</div>
        }
      </div>

      <button onClick={onUrge} style={{width:"100%",padding:"16px",borderRadius:14,background:"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(245,158,11,0.08))",border:"2px solid rgba(239,68,68,0.4)",color:"#fca5a5",fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:12,letterSpacing:"0.05em"}}>
        🚨 URGE ALERT — Deploy Protocol
      </button>

      <div style={{padding:"12px 14px",borderRadius:12,background:"rgba(14,165,233,0.04)",border:"1px solid rgba(14,165,233,0.1)",fontSize:12,color:"#7dd3fc",lineHeight:1.6,fontStyle:"italic",textAlign:"center",marginBottom:12}}>
        "An urge lasts 90 seconds if you don't feed it. Sit with it. Let it pass."
      </div>

      {lastRelapse && (
        <div style={{...glass(),padding:"12px 14px",marginBottom:12,borderColor:"rgba(239,68,68,0.15)"}}>
          <div style={{fontSize:9,color:"#ef4444",letterSpacing:"0.15em",marginBottom:4}}>LAST DEFEAT — DATA, NOT SHAME</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>{new Date(lastRelapse.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
          {lastRelapse.note && <div style={{fontSize:11,color:"#7dd3fc",marginTop:4,fontStyle:"italic"}}>"{lastRelapse.note}"</div>}
        </div>
      )}

      <button onClick={onRelapse} style={{width:"100%",padding:"13px",borderRadius:12,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:10}}>
        💀 Fell in Battle — Log &amp; Rise
      </button>
      <button onClick={onChangeDate} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(14,165,233,0.05)",border:"1px solid rgba(14,165,233,0.12)",color:"#38bdf8",fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer"}}>
        + Change Start Date
      </button>
    </div>
  );
}

function RanksTab({ days, onSelect }) {
  return (
    <div style={{padding:"8px 16px 16px"}}>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:9,color:"#38bdf8",letterSpacing:"0.2em",marginBottom:2}}>MILESTONES OF THE REALM</div>
        <div style={{fontSize:12,color:"#475569"}}>Tap an unlocked card to claim your reward</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {MILESTONES.map(m=>{
          const unlocked = days >= m.days;
          return (
            <button key={m.days} onClick={()=>unlocked&&onSelect(m)}
              style={{padding:"16px 12px",borderRadius:14,background:unlocked?"linear-gradient(160deg,rgba(2,29,58,0.95),rgba(1,11,26,1))":"rgba(1,11,26,0.4)",border:`1px solid ${unlocked?"rgba(245,158,11,0.35)":"rgba(71,85,105,0.15)"}`,color:unlocked?"#e0f2fe":"#334155",cursor:unlocked?"pointer":"default",textAlign:"center",opacity:unlocked?1:0.5,boxShadow:unlocked?"0 0 16px rgba(245,158,11,0.07)":"none"}}>
              <div style={{fontSize:26,marginBottom:8,filter:unlocked?"none":"grayscale(1) opacity(0.3)"}}>{m.icon}</div>
              <div style={{fontSize:10,fontWeight:700,marginBottom:4,color:unlocked?"#f59e0b":"#475569"}}>{m.title}</div>
              <div style={{fontSize:9,color:unlocked?"#38bdf8":"#334155"}}>Day {m.days}</div>
              {unlocked
                ? <div style={{fontSize:8,color:"#f59e0b",marginTop:4}}>+{m.bonus} XP ✓</div>
                : <div style={{fontSize:8,color:"#334155",marginTop:4}}>{m.days-days}d away</div>
              }
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChronicleTab({ startMs, relapses, journal, calMonth, setCalMonth, onSelectDay, journalDay, journalText, setJournalText, onSaveJournal, onCancelJournal }) {
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const relapseDates = new Set(relapses.map(r=>fmtDate(new Date(r.timestamp))));
  const today = todayStr();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (journalDay) return (
    <div style={{padding:"8px 16px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onCancelJournal} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:22,padding:4,lineHeight:1}}>←</button>
        <div style={{fontSize:14,fontWeight:700,color:"#f59e0b"}}>Chronicle — {journalDay}</div>
      </div>
      <textarea value={journalText} onChange={e=>setJournalText(e.target.value)} placeholder="Write your entry for this day..."
        style={{...inputStyle,height:220,resize:"vertical",lineHeight:1.7,marginBottom:12}} />
      <button onClick={onSaveJournal} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
        Save Entry ⚔️
      </button>
    </div>
  );

  return (
    <div style={{padding:"8px 16px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"10px 14px",borderRadius:12,background:"rgba(14,165,233,0.04)",border:"1px solid rgba(14,165,233,0.1)"}}>
        <button onClick={()=>setCalMonth(new Date(year,month-1,1))} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:22,padding:"0 8px",lineHeight:1}}>‹</button>
        <div style={{fontSize:14,fontWeight:700}}>{MONTHS[month]} {year}</div>
        <button onClick={()=>setCalMonth(new Date(year,month+1,1))} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontSize:22,padding:"0 8px",lineHeight:1}}>›</button>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:10,justifyContent:"center"}}>
        {[["#7e22ce","Clean"],["#ef4444","Relapse"],["#f59e0b","Journal"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#94a3b8"}}>
            <div style={{width:10,height:10,borderRadius:2,background:c}} />{l}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:9,color:"#475569",padding:"4px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const d = i+1;
          const dateStr = `${year}-${pad(month+1)}-${pad(d)}`;
          const isRelapse = relapseDates.has(dateStr);
          const hasJournal = !!journal[dateStr];
          const isToday = dateStr === today;
          const startDate = startMs ? fmtDate(new Date(startMs)) : null;
          const isClean = startDate && dateStr >= startDate && !isRelapse && dateStr <= today;
          let bg = "rgba(14,165,233,0.04)";
          let borderC = "rgba(14,165,233,0.08)";
          if (isRelapse) { bg="rgba(239,68,68,0.25)"; borderC="rgba(239,68,68,0.4)"; }
          else if (isClean) { bg="rgba(126,34,206,0.25)"; borderC="rgba(126,34,206,0.3)"; }
          if (isToday) borderC="#38bdf8";
          return (
            <button key={d} onClick={()=>onSelectDay(dateStr)}
              style={{aspectRatio:"1",borderRadius:8,background:bg,border:`1px solid ${borderC}`,color:isToday?"#38bdf8":"#94a3b8",fontSize:10,cursor:"pointer",position:"relative",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {d}
              {hasJournal && <div style={{position:"absolute",bottom:2,right:2,width:4,height:4,borderRadius:"50%",background:"#f59e0b"}} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderTab({ posts, likes, draft, setDraft, onPost, onLike, myRank, myDays, myAvatar }) {
  return (
    <div style={{padding:"8px 16px 16px"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:9,color:"#38bdf8",letterSpacing:"0.2em"}}>THE ORDER HALL</div>
        <div style={{fontSize:11,color:"#475569",marginTop:2}}>Warriors helping warriors</div>
      </div>
      <div style={{...glass(),padding:"14px",marginBottom:14}}>
        <div style={{fontSize:10,color:"#f59e0b",marginBottom:8}}>{myAvatar} {myRank} · Day {myDays}</div>
        <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Share your victory, struggle, or wisdom..."
          style={{...inputStyle,height:72,resize:"none",marginBottom:10,fontSize:12}} />
        <button onClick={onPost} style={{width:"100%",padding:"11px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
          Post to Order Hall ⚔️
        </button>
      </div>
      {posts.map(p=>(
        <div key={p.id} style={{...glass(),padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div>
              <span style={{fontSize:12,fontWeight:700,color:"#e0f2fe"}}>{p.user}</span>
              <span style={{fontSize:9,color:"#38bdf8",marginLeft:8}}>{p.rank}</span>
              <span style={{fontSize:9,color:"#475569",marginLeft:6}}>Day {p.days}</span>
            </div>
            <div style={{fontSize:9,color:"#334155"}}>{new Date(p.ts).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6,marginBottom:10}}>{p.text}</div>
          <button onClick={()=>onLike(p.id)}
            style={{background:"none",border:`1px solid ${likes.includes(p.id)?"rgba(245,158,11,0.5)":"rgba(14,165,233,0.15)"}`,borderRadius:8,padding:"5px 12px",color:likes.includes(p.id)?"#f59e0b":"#475569",fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer"}}>
            {likes.includes(p.id)?"❤️":"🤍"} {p.likes}
          </button>
        </div>
      ))}
    </div>
  );
}

function UrgeModal({ onClose, onSelect }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:28,marginBottom:6}}>🚨</div>
          <div style={{fontSize:18,fontWeight:700,color:"#fca5a5",marginBottom:4}}>URGE PROTOCOL</div>
          <div style={{fontSize:12,color:"#475569"}}>Choose your weapon. Deploy immediately.</div>
        </div>
        {TECHNIQUES.map(t=>(
          <button key={t.name} onClick={()=>onSelect(t)}
            style={{width:"100%",padding:"14px 16px",borderRadius:12,background:"linear-gradient(135deg,rgba(2,29,58,0.9),rgba(1,11,26,0.9))",border:`1px solid ${t.color}44`,color:"#e0f2fe",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:10,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24,minWidth:32}}>{t.icon}</span>
            <div>
              <div style={{fontWeight:700,color:t.color,marginBottom:2}}>{t.name}</div>
              <div style={{fontSize:10,color:"#475569"}}>{t.desc}</div>
            </div>
          </button>
        ))}
        <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:12,background:"rgba(71,85,105,0.15)",border:"1px solid rgba(71,85,105,0.25)",color:"#94a3b8",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",marginTop:4}}>
          I can handle this myself
        </button>
      </div>
    </div>
  );
}

function TechniqueModal({ tech, step, setStep, onBack, onComplete }) {
  const total = tech.steps.length;
  const isLast = step === total - 1;
  return (
    <div style={modalOverlay}>
      <div style={modalSheet}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>{tech.icon}</div>
          <div style={{fontSize:16,fontWeight:700,color:tech.color,marginBottom:4}}>{tech.name}</div>
          <div style={{fontSize:10,color:"#475569"}}>Step {step+1} of {total}</div>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
          {tech.steps.map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<=step?tech.color:"rgba(14,165,233,0.15)",transition:"background 0.3s"}} />
          ))}
        </div>
        <div style={{...glass(),padding:"22px 18px",marginBottom:24,textAlign:"center",minHeight:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:15,lineHeight:1.9,color:"#e0f2fe"}}>{tech.steps[step]}</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onBack} style={{flex:1,padding:"12px",borderRadius:12,background:"rgba(71,85,105,0.15)",border:"1px solid rgba(71,85,105,0.25)",color:"#94a3b8",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer"}}>
            ← Back
          </button>
          <button onClick={isLast?onComplete:()=>setStep(s=>s+1)}
            style={{flex:2,padding:"12px",borderRadius:12,background:`linear-gradient(135deg,${tech.color}bb,${tech.color})`,border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
            {isLast?"✓ Complete":"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RelapseModal({ note, setNote, onLog, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:28,marginBottom:6}}>💀</div>
          <div style={{fontSize:16,fontWeight:700,color:"#fca5a5",marginBottom:6}}>Fell in Battle</div>
          <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>This is data, not shame. Every warrior falls.<br/>What matters is rising. Log it and move forward.</div>
        </div>
        <div style={{fontSize:11,color:"#38bdf8",marginBottom:8}}>What triggered it? (optional)</div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Be honest with yourself. This note is for your eyes only."
          style={{...inputStyle,height:100,resize:"none",marginBottom:16,lineHeight:1.6}} />
        <button onClick={onLog} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,rgba(239,68,68,0.3),rgba(239,68,68,0.12))",border:"1px solid rgba(239,68,68,0.4)",color:"#fca5a5",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:10}}>
          Log Defeat &amp; Rise Again ⚔️
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(71,85,105,0.1)",border:"1px solid rgba(71,85,105,0.2)",color:"#64748b",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function MilestoneModal({ m, days, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:52,marginBottom:12}}>{m.icon}</div>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.2em",marginBottom:6}}>DAY {m.days} MILESTONE</div>
          <div style={{fontSize:18,fontWeight:700,color:"#f59e0b",marginBottom:14}}>{m.title}</div>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.9,fontStyle:"italic",padding:"0 8px",marginBottom:20}}>{m.reward}</div>
          <div style={{display:"inline-block",padding:"6px 20px",borderRadius:20,background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontSize:12}}>
            +{m.bonus} XP Bonus ✓
          </div>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginTop:8}}>
          Claim Your Honor ⚔️
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ profile, setProfile, days, xp, relapses, rank, onSave, onClose, onChangePin }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:20,textAlign:"center"}}>⚙️ Settings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[["Streak","⚔️",`${days} days`],["Rank",rank.icon,rank.name],["XP","⭐",`${xp} XP`],["Defeats","💀",`${relapses.length}`]].map(([label,icon,val])=>(
            <div key={label} style={{...glass(),padding:"12px 10px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:2}}>{val}</div>
              <div style={{fontSize:9,color:"#475569"}}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:6}}>WARRIOR NAME</div>
          <input value={profile?.name||""} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} style={inputStyle} placeholder="Your warrior name" />
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:6}}>PERSONAL MOTTO</div>
          <input value={profile?.motto||""} onChange={e=>setProfile(p=>({...p,motto:e.target.value}))} style={inputStyle} placeholder="Your guiding motto" />
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:8}}>AVATAR</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setProfile(p=>({...p,avatar:a}))}
                style={{fontSize:22,padding:8,borderRadius:10,border:`2px solid ${profile?.avatar===a?"#f59e0b":"rgba(14,165,233,0.12)"}`,background:profile?.avatar===a?"rgba(245,158,11,0.1)":"transparent",cursor:"pointer"}}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onSave} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:10}}>
          Save Profile ⚔️
        </button>
        <button onClick={onChangePin} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(14,165,233,0.06)",border:"1px solid rgba(14,165,233,0.15)",color:"#38bdf8",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:10}}>
          🔐 Change PIN
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(71,85,105,0.08)",border:"1px solid rgba(71,85,105,0.18)",color:"#64748b",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ChangePinModal({ newPin, setNewPin, onSave, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:24,marginBottom:8}}>🔐</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Change PIN</div>
          <div style={{fontSize:12,color:"#475569"}}>Enter your new 4-digit PIN</div>
        </div>
        <input value={newPin} onChange={e=>{if(/^\d{0,4}$/.test(e.target.value))setNewPin(e.target.value);}}
          type="tel" maxLength={4} placeholder="••••"
          style={{...inputStyle,textAlign:"center",fontSize:28,letterSpacing:"0.6em",marginBottom:16}} />
        <button onClick={onSave} disabled={newPin.length!==4}
          style={{width:"100%",padding:"13px",borderRadius:12,background:newPin.length===4?"linear-gradient(135deg,#0369a1,#0ea5e9)":"rgba(14,165,233,0.08)",border:"none",color:newPin.length===4?"#fff":"#475569",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:newPin.length===4?"pointer":"default",marginBottom:10}}>
          Set New PIN
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(71,85,105,0.08)",border:"1px solid rgba(71,85,105,0.18)",color:"#64748b",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
}
