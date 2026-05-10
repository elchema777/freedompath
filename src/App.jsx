import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

// ─── STORAGE HELPERS (keep all original keys) ─────────────────────────────
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

// ─── EXISTING RANKS (unchanged) ────────────────────────────────────────────
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

// ─── EXISTING MILESTONES (unchanged) ──────────────────────────────────────
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

// ─── EXISTING TECHNIQUES (unchanged) ──────────────────────────────────────
const TECHNIQUES = [
  { name:"Tactical Breathing", icon:"💨", color:"#0ea5e9", desc:"Box breathing shuts down the stress response in under 2 minutes.", steps:["Sit upright. Close your eyes. Place both hands on your knees.","Inhale slowly through your nose for 4 counts...  1... 2... 3... 4...","Hold your breath for 4 counts... 1... 2... 3... 4...","Exhale through your mouth for 4 counts... 1... 2... 3... 4...","Hold empty lungs for 4 counts... 1... 2... 3... 4...","Repeat 3 more full cycles. Each cycle weakens the urge.","The storm has passed. Return to your quest. ⚔️"] },
  { name:"Urge Siege Breaker", icon:"🏹", color:"#f59e0b", desc:"Urge surfing — ride the wave without acting. Urges peak at 90 seconds.", steps:["Notice the urge. Don't fight it. Simply observe it.","Where do you feel it? Chest? Gut? Throat? Name the sensation.","Watch it like a knight watching an enemy charge from a tower.","The urge is peaking now. It CANNOT last more than 90 seconds.","Feel it cresting. It is already weakening. You have not moved.","The charge failed. The gates held. The enemy retreats.","Victory. The siege is broken. You are unbroken. ⚔️"] },
  { name:"Realm Grounding",    icon:"🌿", color:"#22c55e", desc:"5-4-3-2-1 sensory grounding pulls you out of the trance instantly.", steps:["Name 5 things you can SEE right now. Look around the room slowly.","Name 4 things you can TOUCH right now. Feel each texture fully.","Name 3 things you can HEAR right now. Listen for quiet sounds too.","Name 2 things you can SMELL right now. Even faint scents count.","Name 1 thing you can TASTE right now. Notice it completely.","You are HERE. You are PRESENT. The urge needed your absence.","You have returned to the realm. Nothing can touch you here. ⚔️"] },
  { name:"Cold Forge",         icon:"❄️", color:"#7dd3fc", desc:"Cold visualization resets the dopamine circuit within minutes.", steps:["Close your eyes. Picture a mountain waterfall, glacial and pure.","You step under it. The cold hits your neck and shoulders hard.","Breathe INTO the cold. Let it shock you fully awake.","Feel the water rushing down your spine. Every nerve fires.","The heat of the urge is extinguished by the cold current.","Breathe out slowly. The water clears every trace of fog.","You emerge forged. Tempered steel. Harder than before. ⚔️"] },
  { name:"King's Vision",      icon:"👁️", color:"#a855f7", desc:"See your 90-day self. Make the urge feel small by comparison.", steps:["Close your eyes. Travel exactly 90 days forward in time.","See yourself in a mirror. How do you look? How do you feel?","Sense the energy you carry — clear eyes, strong posture, calm mind.","Who respects you now? What have you built in these 90 days?","Look back at this moment from there. The urge is a tiny flicker.","The King does not bow to a flicker.","Open your eyes. Act from your future self. The crown is real. ⚔️"] },
];

// ─── EXISTING FORUM DATA (unchanged) ──────────────────────────────────────
const SEED_POSTS = [
  { id:"s1", user:"IronVow_Marcus",  rank:"Lord",     days:31,  text:"30 days hit last night. Cried a little. Worth every second. Stay the path brothers.", likes:24, ts:Date.now()-86400000*2 },
  { id:"s2", user:"NightWatch_77",   rank:"Knight",   days:16,  text:"Urge came hard at 2am. Used the box breathing for 4 full cycles. It passed. The tools work.", likes:18, ts:Date.now()-86400000*4 },
  { id:"s3", user:"SquireOfDawn",    rank:"Squire",   days:8,   text:"First week done. Didn't think I'd make it past day 3. Told myself just one more hour every time.", likes:31, ts:Date.now()-86400000*6 },
  { id:"s4", user:"KingReborn_X",    rank:"High King",days:371, text:"Year one complete. This app was open every single day. You all kept me going. The realm is real.", likes:87, ts:Date.now()-86400000*1 },
  { id:"s5", user:"Castellan_Rook",  rank:"Baron",    days:63,  text:"Relapsed at day 58. Logged it, read my own note, got back up. The chronicle doesn't lie. Use it.", likes:42, ts:Date.now()-86400000*3 },
];

const AVATARS = ["⚔️","🛡️","👑","🏹","🗡️","🔱","⚜️","🏰","🦁","🐉","🦅","🌟","🔥","💎","🌙","☀️","🌊","⛰️","🎯","🏆"];

// ─── DESIGN TOKENS (unchanged) ────────────────────────────────────────────
const glass = (extra={}) => ({ borderRadius:14, background:"linear-gradient(160deg,rgba(2,29,58,0.92),rgba(1,11,26,0.97))", border:"1px solid rgba(14,165,233,0.18)", ...extra });
const modalOverlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:300 };
const modalSheet = { background:"linear-gradient(160deg,#021d3a,#010b1a)", border:"1px solid rgba(14,165,233,0.25)", borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto" };
const inputStyle = { padding:"12px 14px", borderRadius:10, border:"1px solid rgba(14,165,233,0.25)", background:"rgba(0,5,16,0.9)", color:"#e0f2fe", fontSize:14, fontFamily:"Georgia,serif", width:"100%", boxSizing:"border-box", outline:"none" };

// ─── ADDITION 1: WARRIOR LEVEL SYSTEM ─────────────────────────────────────
const LEVELS = [
  { level:1,  xp:0,     title:"Initiate"  },
  { level:2,  xp:500,   title:"Apprentice"},
  { level:3,  xp:1200,  title:"Footman"   },
  { level:4,  xp:2100,  title:"Sentinel"  },
  { level:5,  xp:3500,  title:"Vanguard"  },
  { level:6,  xp:5500,  title:"Champion"  },
  { level:7,  xp:8000,  title:"Warlord"   },
  { level:8,  xp:11500, title:"Overlord"  },
  { level:9,  xp:16000, title:"Sovereign" },
  { level:10, xp:22000, title:"Ascendant" },
];
function getLevel(totalXp) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (totalXp >= l.xp) cur = l;
  if (totalXp >= 22000) {
    const n = Math.floor((totalXp - 22000) / 7000);
    return { level:11+n, xp:22000+n*7000, title:`Legend`, next:22000+(n+1)*7000 };
  }
  const idx = LEVELS.indexOf(cur);
  return { ...cur, next: idx < LEVELS.length-1 ? LEVELS[idx+1].xp : null };
}

// ─── ADDITION 2: DAILY TASKS ───────────────────────────────────────────────
const TASK_DEFS = [
  { id:"cold_shower",   cat:"BODY", icon:"🚿", label:"Cold shower",                    xp:50 },
  { id:"workout",       cat:"BODY", icon:"💪", label:"Worked out",                     xp:75 },
  { id:"walk",          cat:"BODY", icon:"🚶", label:"Walked outside 20+ min",          xp:40 },
  { id:"sleep_ok",      cat:"BODY", icon:"😴", label:"Slept 6-9 hours",                xp:30 },
  { id:"water",         cat:"BODY", icon:"💧", label:"Drank 8+ glasses of water",      xp:25 },
  { id:"no_junk",       cat:"BODY", icon:"🥗", label:"No junk food today",             xp:30 },
  { id:"journaled",     cat:"MIND", icon:"📓", label:"Journaled today",                xp:50 },
  { id:"meditated",     cat:"MIND", icon:"🧘", label:"Meditated / breathed",           xp:40 },
  { id:"read",          cat:"MIND", icon:"📖", label:"Read 20+ minutes",               xp:40 },
  { id:"no_social",     cat:"MIND", icon:"📵", label:"No social media first 2h awake", xp:35 },
  { id:"full_check",    cat:"MIND", icon:"✅", label:"Completed full daily checklist", xp:60 },
  { id:"posted",        cat:"HALL", icon:"⚔️", label:"Posted in Order Hall",           xp:30 },
  { id:"responded",     cat:"HALL", icon:"🤝", label:"Responded to another warrior",   xp:25 },
  { id:"urge_defeated", cat:"HALL", icon:"🛡️", label:"Defeated an urge — logged",      xp:80 },
];
const TASK_COUNT = TASK_DEFS.length;

// ─── ADDITION 4: MISSIONS ─────────────────────────────────────────────────
const MISSION_POOL = [
  { id:"m_urge3",    title:"Defeat 3 urges this week",         xp:500,  target:3, key:"urge_defeated"  },
  { id:"m_journal7", title:"Journal every day for 7 days",     xp:1000, target:7, key:"journaled"      },
  { id:"m_body5",    title:"Complete all body tasks 5 days",   xp:750,  target:5, key:"body_full"      },
  { id:"m_hall3",    title:"Post in Order Hall 3 times",       xp:400,  target:3, key:"posted"         },
  { id:"m_check7",   title:"Complete morning checklist 7 days",xp:800,  target:7, key:"full_check"     },
  { id:"m_clean7",   title:"No relapses this week",            xp:2000, target:7, key:"no_relapse"     },
  { id:"m_sleep7",   title:"Log sleep 7 days in a row",        xp:600,  target:7, key:"sleep_ok"       },
  { id:"m_cold5",    title:"Cold shower 5 days",               xp:600,  target:5, key:"cold_shower"    },
  { id:"m_workout4", title:"Work out 4 times this week",       xp:700,  target:4, key:"workout"        },
  { id:"m_read5",    title:"Read 5 days this week",            xp:500,  target:5, key:"read"           },
];
function getWeekMissions(weekNum) {
  const a = weekNum % MISSION_POOL.length;
  const b = (weekNum + 3) % MISSION_POOL.length;
  const c = (weekNum + 7) % MISSION_POOL.length;
  return [MISSION_POOL[a], MISSION_POOL[b !== a ? b : (b+1)%MISSION_POOL.length], MISSION_POOL[c !== a && c !== b ? c : (c+2)%MISSION_POOL.length]];
}

// ─── ADDITION 8: DAILY WISDOM ─────────────────────────────────────────────
const WISDOM = [
  "You have power over your mind, not outside events. Realize this, and you will find strength. — Marcus Aurelius",
  "He who is brave is free. — Seneca",
  "The impediment to action advances action. What stands in the way becomes the way. — Marcus Aurelius",
  "Make the best use of what is in your power, and take the rest as it happens. — Epictetus",
  "Waste no more time arguing about what a good man should be. Be one. — Marcus Aurelius",
  "If it is not right, do not do it; if it is not true, do not say it. — Marcus Aurelius",
  "Difficulties strengthen the mind, as labor does the body. — Seneca",
  "We suffer more often in imagination than in reality. — Seneca",
  "The best revenge is not to be like your enemy. — Marcus Aurelius",
  "It is not death that a man should fear, but he should fear never beginning to live. — Marcus Aurelius",
  "He suffers more than necessary, who suffers before it is necessary. — Seneca",
  "Begin at once to live, and count each separate day as a separate life. — Seneca",
  "You are a warrior. Warriors do not negotiate with weakness — they conquer it.",
  "Every urge defeated is a brick in your fortress. Build it daily.",
  "The enemy is loudest before your greatest victory. Stand firm.",
  "Discipline is not a cage. It is the key that unlocks everything you want.",
  "A man who controls himself controls his destiny.",
  "Sleep, hydration, and discipline — these are your armor. Wear them daily.",
  "No great warrior was built in comfort. The forge is where you become real.",
  "Your future self is watching this moment. Do not disappoint him.",
  "The streak is not the goal. The man you become is the goal.",
  "Forty seconds of courage. That is all it takes to choose different.",
  "The body obeys the mind. Train your mind first, always.",
  "One more hour. Just one. Stack enough hours and you become unstoppable.",
  "Brotherhood is not weakness — it is your multiplier. Use it.",
  "Perfection is not the standard. Relentless return is the standard.",
  "Your worst enemy cannot harm you as much as your own unchecked thoughts. — Dhammapada",
  "Appear weak when you are strong, and strong when you are weak. — Sun Tzu",
  "The successful warrior is the average man with laser-like focus. — Bruce Lee",
  "Do not pray for an easy life. Pray for the strength to endure a difficult one. — Bruce Lee",
];

// ─── APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // ── Existing state ────────────────────────────────────────────────────
  const [startMs, setStartMs] = useState(null);
  const [now, setNow]         = useState(Date.now());
  const [showInput, setShowInput] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [loading, setLoading]   = useState(true);
  const [pinState, setPinState] = useState("locked");
  const [pinDigits, setPinDigits] = useState("");
  const [storedPin, setStoredPin] = useState(null);
  const [pinError, setPinError]   = useState("");
  const [tab, setTab]             = useState("home");
  const [modal, setModal]         = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [techStep, setTechStep]     = useState(0);
  const [relapseNote, setRelapseNote] = useState("");
  const [relapses, setRelapses]   = useState([]);
  const [profile, setProfile]     = useState({ name:"Warrior", motto:"I rise every time I fall.", avatar:"⚔️" });
  const [editProfile, setEditProfile] = useState(null);
  const [journal, setJournal]     = useState({});
  const [journalDay, setJournalDay] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [calMonth, setCalMonth]   = useState(new Date());
  const [forumPosts, setForumPosts] = useState([]);
  const [forumLikes, setForumLikes] = useState([]);
  const [forumDraft, setForumDraft] = useState("");
  const [newPin, setNewPin]       = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // ── New state ─────────────────────────────────────────────────────────
  const [taskXp, setTaskXp]         = useState(0);           // fp_xp — total task XP
  const [todayTasks, setTodayTasks] = useState({});          // fp_tasks:DATE
  const [forgeDate, setForgeDate]   = useState("");           // which date forge is for
  const [loginStreak, setLoginStreak] = useState(0);
  const [wakeTime, setWakeTime]     = useState(null);         // fp_wake_time
  const [sleepHours, setSleepHours] = useState(null);         // fp_sleep_hours
  const [shield, setShield]         = useState({ available:false, cooldown_until:null, earned_date:null });
  const [partner, setPartner]       = useState(null);         // fp_partner
  const [records, setRecords]       = useState({});           // fp_records
  const [newRecord, setNewRecord]   = useState(null);         // for new record modal
  const [xpFlash, setXpFlash]       = useState(null);         // "+80 XP" animation text
  const [forgeTab, setForgeTab]     = useState("tasks");      // tasks | missions | analytics
  const [weekMissData, setWeekMissData] = useState({});       // fp_missions:week_N

  // ── Init ──────────────────────────────────────────────────────────────
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

    // New storage keys
    const xp = parseInt(sGet("fp_xp") || "0");
    setTaskXp(xp);

    const wake = sGet("fp_wake_time");
    if (wake) setWakeTime(parseInt(wake));
    const sl = sGet("fp_sleep_hours");
    if (sl) setSleepHours(parseFloat(sl));

    // Load today's tasks
    const td = todayStr();
    setForgeDate(td);
    const tasks = sParse(`fp_tasks:${td}`, {});
    setTodayTasks(tasks);

    // Login streak
    const lastLogin = parseInt(sGet("fp_last_login") || "0");
    const streak = parseInt(sGet("fp_login_streak") || "0");
    const dayDiff = Math.floor((Date.now() - lastLogin) / 86400000);
    let newStreak = dayDiff === 0 ? streak : dayDiff === 1 ? streak + 1 : 1;
    setLoginStreak(newStreak);
    sSet("fp_last_login", String(Date.now()));
    sSet("fp_login_streak", String(newStreak));
    // Daily login XP (once per day)
    if (dayDiff >= 1) {
      const bonus = 10 + (newStreak >= 7 ? 200 : 0);
      addXpDirect(xp, bonus);
    }

    // Shield
    setShield(sParse("fp_shield", { available:false, cooldown_until:null }));

    // Partner
    setPartner(sParse("fp_partner", null));

    // Records
    setRecords(sParse("fp_records", {}));

    // Weekly missions
    const weekNum = Math.floor(Date.now() / (7*86400000));
    const mKey = `fp_missions:week_${weekNum}`;
    const saved_missions = sParse(mKey, null);
    if (!saved_missions) {
      const fresh = { missions: getWeekMissions(weekNum), progress:{}, claimed:{} };
      sSave(mKey, fresh);
      setWeekMissData(fresh);
    } else {
      setWeekMissData(saved_missions);
    }

    setLoading(false);
  }, []);

  function addXpDirect(base, amount) {
    const next = base + amount;
    setTaskXp(next);
    sSet("fp_xp", String(next));
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────
  const elapsed = startMs ? now - startMs : 0;
  const timer   = msToT(elapsed);
  const days    = Math.floor(elapsed / 86400000);
  const rank    = getRank(days);
  const nextRank = getNextRank(days);
  const xp      = calcXP(days);  // streak-based XP (unchanged)
  const lastRelapse = relapses.length ? relapses[relapses.length-1] : null;

  const xpProgress = () => {
    if (!nextRank) return 1;
    const curXP = calcXP(rank.days);
    const nxtXP = calcXP(nextRank.days);
    if (nxtXP === curXP) return 1;
    return Math.min(1, (xp - curXP) / (nxtXP - curXP));
  };

  // Level system (task XP)
  const levelInfo = getLevel(taskXp);
  const levelProg = levelInfo.next ? Math.min(1, (taskXp - levelInfo.xp) / (levelInfo.next - levelInfo.xp)) : 1;

  // Awake hours (night-shift aware)
  const awakeHours = wakeTime ? (now - wakeTime) / 3600000 : 0;

  // Tasks earned today
  const todayXp = Object.entries(todayTasks).filter(([,v])=>v).reduce((s,[id])=>{
    const def = TASK_DEFS.find(t=>t.id===id); return s + (def?.xp||0);
  }, 0);
  const todayCount = Object.values(todayTasks).filter(Boolean).length;
  const allDone = todayCount >= TASK_COUNT;

  // ── Handlers ──────────────────────────────────────────────────────────
  function saveDate() {
    if (!dateInput) return;
    const ms = new Date(dateInput).getTime();
    setStartMs(ms); setShowInput(false); sSet("fp_start", String(ms));
  }

  function handlePinInput(d) {
    if (pinDigits.length >= 4) return;
    const next = pinDigits + d;
    setPinDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (pinState === "setting") { sSet("fp_pin", next); setStoredPin(next); setPinState("unlocked"); }
        else if (next === storedPin) { setPinState("unlocked"); setPinError(""); }
        else setPinError("Wrong PIN — try again");
        setPinDigits("");
      }, 150);
    }
  }

  function addTaskXp(amount, label) {
    const next = taskXp + amount;
    setTaskXp(next);
    sSet("fp_xp", String(next));
    setXpFlash(`+${amount} XP`);
    setTimeout(() => setXpFlash(null), 1800);
    // Check for level up — handled by levelInfo changing
    // Check records
    const todayTotal = todayXp + amount;
    checkRecord("most_xp_day", todayTotal, "Most XP in one day", next);
  }

  function checkRecord(key, newVal, label, curXp) {
    const prev = records[key] || 0;
    if (newVal > prev) {
      const updated = { ...records, [key]: newVal };
      setRecords(updated);
      sSave("fp_records", updated);
      setNewRecord({ label, value: newVal, prev });
      setModal("newrecord");
      addXpDirect(curXp, 150);
    }
  }

  function toggleTask(id) {
    const already = !!todayTasks[id];
    if (already) return; // no un-checking
    const def = TASK_DEFS.find(t=>t.id===id);
    if (!def) return;
    const updated = { ...todayTasks, [id]: true };
    setTodayTasks(updated);
    sSave(`fp_tasks:${forgeDate}`, updated);
    addTaskXp(def.xp, def.label);
    // Check tasks record
    const newCount = Object.values(updated).filter(Boolean).length;
    const prev = records.most_tasks_day || 0;
    if (newCount > prev) {
      const updRec = { ...records, most_tasks_day: newCount };
      setRecords(updRec); sSave("fp_records", updRec);
    }
    // All-done bonus
    if (newCount >= TASK_COUNT && !todayTasks._bonus_all) {
      const withBonus = { ...updated, _bonus_all: true };
      setTodayTasks(withBonus);
      sSave(`fp_tasks:${forgeDate}`, withBonus);
      setTimeout(() => addTaskXp(100, "All tasks complete!"), 400);
    }
    updateMissionProgress(id);
  }

  function updateMissionProgress(taskId) {
    const weekNum = Math.floor(Date.now() / (7*86400000));
    const mKey = `fp_missions:week_${weekNum}`;
    const md = { ...weekMissData };
    if (!md.progress) md.progress = {};
    for (const m of (md.missions || [])) {
      if (m.key === taskId || (m.key === "body_full" && taskId.match(/cold_shower|workout|walk|sleep_ok|water|no_junk/))) {
        md.progress[m.id] = (md.progress[m.id] || 0) + 1;
      }
    }
    setWeekMissData(md);
    sSave(mKey, md);
  }

  function claimMission(missionId) {
    const m = weekMissData.missions?.find(x=>x.id===missionId);
    if (!m) return;
    const next = taskXp + m.xp;
    setTaskXp(next); sSet("fp_xp", String(next));
    const md = { ...weekMissData, claimed: { ...weekMissData.claimed, [missionId]: true } };
    setWeekMissData(md);
    const weekNum = Math.floor(Date.now() / (7*86400000));
    sSave(`fp_missions:week_${weekNum}`, md);
    setXpFlash(`+${m.xp} XP`);
    setTimeout(() => setXpFlash(null), 2000);
  }

  function logRelapse() {
    // Shield check is handled in RelapseModal — if used, don't reset
    const entry = { timestamp: Date.now(), note: relapseNote, day: days };
    const updated = [...relapses, entry];
    setRelapses(updated); sSave("fp_relapses", updated);
    const ms = Date.now();
    setStartMs(ms); sSet("fp_start", String(ms));
    setRelapseNote(""); setModal(null);
    // Streak record
    if (days > (records.longest_streak || 0)) {
      const updRec = { ...records, longest_streak: days };
      setRecords(updRec); sSave("fp_records", updRec);
    }
  }

  function useShield() {
    // Use shield: streak continues, log event
    const entry = { timestamp: Date.now(), note: `[SHIELD USED] ${relapseNote}`, day: days, shielded: true };
    const updated = [...relapses, entry];
    setRelapses(updated); sSave("fp_relapses", updated);
    const newShield = { available:false, cooldown_until: Date.now() + 14*86400000, used_date: Date.now() };
    setShield(newShield); sSave("fp_shield", newShield);
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

  function logWake() {
    const ts = Date.now();
    setWakeTime(ts); sSet("fp_wake_time", String(ts));
  }

  function logSleep(hrs) {
    setSleepHours(hrs); sSet("fp_sleep_hours", String(hrs));
    if (hrs >= 6 && hrs <= 9 && !todayTasks["sleep_ok"]) toggleTask("sleep_ok");
  }

  function savePartner(p) {
    setPartner(p); sSave("fp_partner", p);
  }

  // Shield earn check: 7 consecutive days all tasks
  useEffect(() => {
    if (!shield.available && !shield.cooldown_until) {
      // Check last 7 days
      let streak = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() - i*86400000);
        const k = fmtDate(d);
        const t = sParse(`fp_tasks:${k}`, {});
        const done = Object.values(t).filter(Boolean).length;
        if (done >= TASK_COUNT) streak++; else break;
      }
      if (streak >= 7) {
        const s = { available:true, earned_date: Date.now(), cooldown_until:null };
        setShield(s); sSave("fp_shield", s);
      }
    }
    if (shield.cooldown_until && Date.now() > shield.cooldown_until) {
      const s = { ...shield, cooldown_until:null };
      setShield(s); sSave("fp_shield", s);
    }
  }, [todayTasks]);

  // Longest streak record
  useEffect(() => {
    if (days > 0 && days > (records.longest_streak || 0)) {
      const updRec = { ...records, longest_streak: days };
      setRecords(updRec); sSave("fp_records", updRec);
    }
  }, [days]);

  // ── Render guards ─────────────────────────────────────────────────────
  if (loading) return <div style={{minHeight:"100vh",background:"#000510",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8",fontFamily:"Georgia,serif"}}>Loading realm...</div>;
  if (pinState !== "unlocked") return <PinScreen state={pinState} digits={pinDigits} error={pinError} onDigit={handlePinInput} onDel={()=>setPinDigits(p=>p.slice(0,-1))} />;
  if (showInput) return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 25%,#021d3a,#000510)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:24}}>
      <div style={{fontSize:42,marginBottom:12}}>⚜️</div>
      <div style={{fontSize:22,fontWeight:700,color:"#e0f2fe",marginBottom:6}}>FREEDOMPATH</div>
      <div style={{fontSize:12,color:"#38bdf8",marginBottom:8,textAlign:"center"}}>When was your last relapse?</div>
      <div style={{fontSize:11,color:"#475569",marginBottom:24,textAlign:"center"}}>Your real streak will be calculated from this date</div>
      <input type="datetime-local" value={dateInput} onChange={e=>setDateInput(e.target.value)} style={{padding:"12px 16px",borderRadius:10,border:"1px solid rgba(14,165,233,0.3)",background:"rgba(0,0,0,0.5)",color:"#e0f2fe",fontSize:14,marginBottom:16,width:"100%",maxWidth:320,fontFamily:"Georgia,serif"}} />
      <button onClick={saveDate} style={{padding:"13px 32px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%",maxWidth:320}}>⚔️ Begin My Quest</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#021d3a,#000510)",fontFamily:"Georgia,serif",color:"#e0f2fe",maxWidth:430,margin:"0 auto",paddingBottom:72}}>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:3,background:"linear-gradient(90deg,transparent,#38bdf8 30%,#f59e0b 50%,#38bdf8 70%,transparent)",zIndex:100}} />

      {/* XP flash animation */}
      {xpFlash && (
        <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",color:"#f59e0b",fontSize:22,fontWeight:700,fontFamily:"Georgia,serif",textShadow:"0 0 20px #f59e0b",zIndex:400,pointerEvents:"none",animation:"xpFloat 1.8s ease-out forwards"}}>
          {xpFlash}
          <style>{`@keyframes xpFloat{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-60px)}}`}</style>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{padding:"20px 16px 8px",textAlign:"center",position:"relative"}}>
        <button onClick={()=>{setEditProfile({...profile});setModal("settings");}}
          style={{position:"absolute",right:16,top:22,background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:20,padding:4}}>⚙️</button>
        {shield.available && (
          <div style={{position:"absolute",left:16,top:22,fontSize:20}} title="Streak Shield available">🛡️</div>
        )}
        <div style={{fontSize:9,color:"#38bdf8",letterSpacing:"0.25em",marginBottom:2}}>THE ORDER OF</div>
        <div style={{fontSize:24,fontWeight:700}}>FREEDOM<span style={{color:"#38bdf8"}}>PATH</span></div>

        {/* Rank row */}
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:6,marginBottom:4}}>
          <div style={{fontSize:13}}><span style={{fontSize:16}}>{rank.icon}</span> <span style={{color:rank.color,fontWeight:700}}>{rank.name}</span></div>
          <div style={{width:1,background:"rgba(255,255,255,0.1)"}} />
          <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>⚡ {levelInfo.title} Lv.{levelInfo.level}</div>
        </div>
        {profile.motto && <div style={{fontSize:10,color:"#475569",fontStyle:"italic",marginTop:2}}>"{profile.motto}"</div>}

        {/* Two progress bars */}
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:8,color:"#38bdf8",width:36,textAlign:"right",letterSpacing:"0.05em"}}>RANK</div>
            <div style={{flex:1,height:5,borderRadius:3,background:"rgba(14,165,233,0.12)",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${xpProgress()*100}%`,background:`linear-gradient(90deg,#38bdf8,${rank.color})`,borderRadius:3,transition:"width 1s ease"}} />
            </div>
            {nextRank && <div style={{fontSize:8,color:"#475569",width:28}}>{nextRank.days-days}d</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:8,color:"#f59e0b",width:36,textAlign:"right",letterSpacing:"0.05em"}}>LEVEL</div>
            <div style={{flex:1,height:5,borderRadius:3,background:"rgba(245,158,11,0.12)",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${levelProg*100}%`,background:"linear-gradient(90deg,#f59e0b,#fbbf24)",borderRadius:3,transition:"width 1s ease"}} />
            </div>
            <div style={{fontSize:8,color:"#475569",width:28}}>{taskXp}xp</div>
          </div>
        </div>
      </div>

      {/* Night-shift awake warnings */}
      {awakeHours >= 18 && (
        <div style={{margin:"0 16px 8px",padding:"10px 14px",borderRadius:10,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",fontSize:12,color:"#fca5a5",textAlign:"center"}}>
          🔴 HIGH RISK — {Math.floor(awakeHours)}h awake. Rest is your shield. Sleep now.
        </div>
      )}
      {awakeHours >= 14 && awakeHours < 18 && (
        <div style={{margin:"0 16px 8px",padding:"10px 14px",borderRadius:10,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",fontSize:12,color:"#fbbf24",textAlign:"center"}}>
          ⚠️ Urge risk rising — {Math.floor(awakeHours)}h awake. Consider resting soon.
        </div>
      )}

      {/* Tab content */}
      {tab==="home"      && <HomeTab timer={timer} days={days} rank={rank} nextRank={nextRank} xp={xp} xpProg={xpProgress()} lastRelapse={lastRelapse} relapses={relapses} wakeTime={wakeTime} sleepHours={sleepHours} partner={partner} awakeHours={awakeHours} onUrge={()=>setModal("urge")} onRelapse={()=>setModal("relapse")} onChangeDate={()=>setShowInput(true)} onWake={logWake} onSleep={logSleep} wisdomIdx={Math.floor(Date.now()/86400000) % WISDOM.length} wisdom={WISDOM} todayXp={todayXp} todayCount={todayCount} allDone={allDone} />}
      {tab==="forge"     && <ForgeTab tasks={todayTasks} onToggle={toggleTask} todayXp={todayXp} todayCount={todayCount} allDone={allDone} forgeTab={forgeTab} setForgeTab={setForgeTab} weekMissData={weekMissData} onClaimMission={claimMission} relapses={relapses} startMs={startMs} />}
      {tab==="ranks"     && <RanksTab days={days} onSelect={m=>{setSelectedMilestone(m);setModal("milestone");}} />}
      {tab==="chronicle" && <ChronicleTab startMs={startMs} relapses={relapses} journal={journal} calMonth={calMonth} setCalMonth={setCalMonth} onSelectDay={d=>{setJournalDay(d);setJournalText(journal[d]||"");}} journalDay={journalDay} journalText={journalText} setJournalText={setJournalText} onSaveJournal={saveJournal} onCancelJournal={()=>setJournalDay(null)} />}
      {tab==="order"     && <OrderTab posts={forumPosts} likes={forumLikes} draft={forumDraft} setDraft={setForumDraft} onPost={postForum} onLike={toggleLike} myRank={rank.name} myDays={days} myAvatar={profile.avatar} />}

      {/* Bottom nav — Home | Forge | Ranks | Chronicle | Hall */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"linear-gradient(180deg,rgba(1,11,26,0.98),#000510)",borderTop:"1px solid rgba(14,165,233,0.15)",display:"flex",zIndex:99}}>
        {[["home","🏠","Home"],["forge","⚒️","Forge"],["ranks","🏅","Ranks"],["chronicle","📅","Chronicle"],["order","⚔️","Hall"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px 14px",background:"none",border:"none",color:tab===id?"#f59e0b":"#475569",fontSize:9,fontFamily:"Georgia,serif",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{letterSpacing:"0.05em"}}>{label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Modals (all existing + new) */}
      {modal==="urge"      && <UrgeModal onClose={()=>setModal(null)} onSelect={t=>{setActiveTech(t);setTechStep(0);setModal("technique");}} />}
      {modal==="technique" && activeTech && <TechniqueModal tech={activeTech} step={techStep} setStep={setTechStep} onBack={()=>setModal("urge")} onComplete={()=>setModal(null)} />}
      {modal==="relapse"   && <RelapseModal note={relapseNote} setNote={setRelapseNote} onLog={logRelapse} onClose={()=>setModal(null)} lastRelapse={lastRelapse} shield={shield} onUseShield={useShield} />}
      {modal==="milestone" && selectedMilestone && <MilestoneModal m={selectedMilestone} days={days} onClose={()=>setModal(null)} />}
      {modal==="settings"  && editProfile && <SettingsModal profile={editProfile} setProfile={setEditProfile} days={days} xp={xp} taskXp={taskXp} relapses={relapses} rank={rank} levelInfo={levelInfo} records={records} partner={partner} onSavePartner={savePartner} onSave={saveProfile} onClose={()=>setModal(null)} onChangePin={()=>setModal("changePin")} />}
      {modal==="changePin" && <ChangePinModal newPin={newPin} setNewPin={setNewPin} onSave={doChangePin} onClose={()=>setModal("settings")} />}
      {modal==="newrecord" && newRecord && <NewRecordModal record={newRecord} onClose={()=>setModal(null)} />}
    </div>
  );
}

// ─── EXISTING SCREENS ─────────────────────────────────────────────────────

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

// ─── HOME TAB (updated with new additions) ────────────────────────────────
function HomeTab({ timer, days, rank, nextRank, xp, xpProg, lastRelapse, relapses, wakeTime, sleepHours, partner, awakeHours, onUrge, onRelapse, onChangeDate, onWake, onSleep, wisdomIdx, wisdom, todayXp, todayCount, allDone }) {
  const [sleepSlider, setSleepSlider] = useState(7);
  const [showSleepLog, setShowSleepLog] = useState(false);
  const sleepStatus = sleepHours >= 6 && sleepHours <= 9 ? { label:"Well Rested +30 XP", color:"#22c55e" }
    : sleepHours >= 4 ? { label:"Low Energy — half size recommended", color:"#f59e0b" }
    : sleepHours ? { label:"Danger: High relapse risk today", color:"#ef4444" }
    : null;

  // Pattern detector
  const pattern = detectPattern(relapses);

  // Danger zone warning
  const dangerZoneWarning = pattern && days >= pattern.dangerStart - 2 && days <= pattern.dangerStart + 2;

  return (
    <div style={{padding:"8px 16px 16px"}}>

      {/* Danger zone warning */}
      {dangerZoneWarning && (
        <div style={{padding:"12px 14px",borderRadius:12,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:12,color:"#fca5a5",fontWeight:700}}>⚠️ Approaching your historic danger zone (Day {pattern.dangerStart})</div>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Extra vigilance needed this week. You know what to do.</div>
        </div>
      )}

      {/* Timer */}
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
        {allDone && <div style={{fontSize:11,color:"#f59e0b",marginTop:6}}>✨ All tasks complete! +100 XP bonus earned</div>}
      </div>

      {/* Today's forge snapshot */}
      {todayCount > 0 && (
        <div style={{...glass(),padding:"12px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.1em",marginBottom:2}}>TODAY'S FORGE</div>
            <div style={{fontSize:13,color:"#e0f2fe"}}>{todayCount}/{TASK_COUNT} tasks · +{todayXp} XP earned</div>
          </div>
          <div style={{fontSize:24}}>{allDone ? "🏆" : "⚒️"}</div>
        </div>
      )}

      {/* Sleep / Wake tracking */}
      <div style={{...glass(),padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:10}}>NIGHT SHIFT WELLNESS</div>
        {!wakeTime ? (
          <button onClick={onWake} style={{width:"100%",padding:"12px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
            ☀️ I Am Awake — Start Day
          </button>
        ) : (
          <div style={{fontSize:12,color:"#7dd3fc",marginBottom:8}}>Awake for {Math.floor(awakeHours)}h {Math.floor((awakeHours%1)*60)}m</div>
        )}
        {sleepHours ? (
          <div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:`${sleepStatus?.color}18`,border:`1px solid ${sleepStatus?.color}44`,fontSize:11,color:sleepStatus?.color,textAlign:"center"}}>
            😴 {sleepHours}h logged — {sleepStatus?.label}
          </div>
        ) : (
          <div style={{marginTop:8}}>
            {!showSleepLog ? (
              <button onClick={()=>setShowSleepLog(true)} style={{background:"none",border:"1px solid rgba(14,165,233,0.2)",borderRadius:8,padding:"7px 14px",color:"#38bdf8",fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer"}}>
                + Log Sleep Hours
              </button>
            ) : (
              <div>
                <div style={{fontSize:10,color:"#475569",marginBottom:6}}>Hours slept: {sleepSlider}h</div>
                <input type="range" min={1} max={12} value={sleepSlider} onChange={e=>setSleepSlider(+e.target.value)} style={{width:"100%",accentColor:"#38bdf8",marginBottom:8}} />
                <div style={{display:"flex",justifyContent:"space-between",color:"#475569",fontSize:9,marginBottom:10}}>
                  <span>1h</span><span style={{color:"#22c55e"}}>6-9h optimal</span><span>12h</span>
                </div>
                <button onClick={()=>{onSleep(sleepSlider);setShowSleepLog(false);}} style={{width:"100%",padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
                  Log {sleepSlider} Hours
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brotherhood card */}
      {partner && (
        <div style={{...glass(),padding:"14px 16px",marginBottom:12,border:"1px solid rgba(245,158,11,0.2)"}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.1em",marginBottom:10}}>YOUR BROTHERHOOD</div>
          {[{name:profile.name||"You",days,rank:rank.name,isYou:true},{name:partner.name,days:partner.days,rank:partner.rank,isYou:false}].map((w,i)=>{
            const ahead = i===0 ? days >= partner.days : partner.days > days;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i===0?8:0}}>
                {ahead && <span style={{fontSize:14}}>👑</span>}
                <div style={{flex:1}}>
                  <span style={{fontWeight:700,color:w.isYou?"#38bdf8":"#e0f2fe",fontSize:13}}>{w.name}</span>
                  <span style={{fontSize:10,color:"#475569",marginLeft:8}}>{w.rank}</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>Day {w.days}</div>
              </div>
            );
          })}
          <div style={{fontSize:10,color:"#475569",marginTop:8,textAlign:"center",fontStyle:"italic"}}>"Don't let your brother down."</div>
        </div>
      )}

      {/* Urge button */}
      <button onClick={onUrge} style={{width:"100%",padding:"16px",borderRadius:14,background:"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(245,158,11,0.08))",border:"2px solid rgba(239,68,68,0.4)",color:"#fca5a5",fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:12,letterSpacing:"0.05em"}}>
        🚨 URGE ALERT — Deploy Protocol
      </button>

      {/* Daily wisdom */}
      <div style={{padding:"14px 16px",borderRadius:12,background:"rgba(14,165,233,0.04)",border:"1px solid rgba(14,165,233,0.1)",fontSize:12,color:"#7dd3fc",lineHeight:1.7,fontStyle:"italic",textAlign:"center",marginBottom:12}}>
        "{wisdom[wisdomIdx]}"
      </div>

      {/* Pattern card */}
      {pattern && (
        <div style={{...glass(),padding:"14px 16px",marginBottom:12,border:"1px solid rgba(245,158,11,0.15)"}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.1em",marginBottom:8}}>PATTERN DETECTED</div>
          <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.8}}>
            {pattern.dangerStart > 0 && <div>📍 Your danger zone: Day {pattern.dangerStart}–{pattern.dangerEnd} of streak</div>}
            {pattern.topTrigger && <div>⚡ Your #1 trigger: <span style={{color:"#fca5a5"}}>{pattern.topTrigger}</span></div>}
          </div>
        </div>
      )}

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

// ─── FORGE TAB (Daily Tasks + Missions + Analytics) ───────────────────────
function ForgeTab({ tasks, onToggle, todayXp, todayCount, allDone, forgeTab, setForgeTab, weekMissData, onClaimMission, relapses, startMs }) {
  const CATS = ["BODY","MIND","HALL"];
  const CAT_LABELS = { BODY:"⚔️ BODY", MIND:"🧠 MIND", HALL:"🤝 BROTHERHOOD" };

  return (
    <div style={{padding:"8px 16px 16px"}}>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["tasks","⚒️ Tasks"],["missions","🎯 Missions"],["analytics","📊 Analytics"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setForgeTab(id)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`1px solid ${forgeTab===id?"rgba(245,158,11,0.5)":"rgba(14,165,233,0.15)"}`,background:forgeTab===id?"rgba(245,158,11,0.1)":"rgba(14,165,233,0.04)",color:forgeTab===id?"#f59e0b":"#475569",fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer"}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* TASKS */}
      {forgeTab==="tasks" && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:12,color:"#e0f2fe"}}>{todayCount}/{TASK_COUNT} tasks · <span style={{color:"#f59e0b"}}>+{todayXp} XP</span></div>
            {allDone && <div style={{fontSize:12,color:"#22c55e"}}>🏆 All complete!</div>}
          </div>
          {CATS.map(cat=>(
            <div key={cat} style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.15em",marginBottom:8}}>{CAT_LABELS[cat]}</div>
              {TASK_DEFS.filter(t=>t.cat===cat).map(t=>{
                const done = !!tasks[t.id];
                return (
                  <button key={t.id} onClick={()=>!done&&onToggle(t.id)}
                    style={{width:"100%",marginBottom:6,padding:"12px 14px",borderRadius:10,background:done?"rgba(34,197,94,0.08)":"rgba(14,165,233,0.03)",border:`1px solid ${done?"rgba(34,197,94,0.3)":"rgba(14,165,233,0.1)"}`,color:done?"#86efac":"#94a3b8",fontSize:13,fontFamily:"Georgia,serif",cursor:done?"default":"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done?"#22c55e":"rgba(14,165,233,0.3)"}`,background:done?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,transition:"all 0.2s"}}>
                      {done && "✓"}
                    </div>
                    <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{textDecoration:done?"line-through":"none"}}>{t.label}</div>
                    </div>
                    <div style={{fontSize:10,color:done?"#4ade80":"#f59e0b",fontWeight:700,flexShrink:0}}>+{t.xp}</div>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.12)",fontSize:11,color:"#475569",textAlign:"center",marginTop:4}}>
            Complete all {TASK_COUNT} tasks for 7 days → earn Streak Shield 🛡️
          </div>
        </>
      )}

      {/* MISSIONS */}
      {forgeTab==="missions" && (
        <>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.15em",marginBottom:14}}>WEEKLY MISSIONS</div>
          {(weekMissData.missions||[]).map(m=>{
            const progress = weekMissData.progress?.[m.id] || 0;
            const pct = Math.min(1, progress / m.target);
            const complete = pct >= 1;
            const claimed = weekMissData.claimed?.[m.id];
            return (
              <div key={m.id} style={{...glass(),padding:"14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{flex:1,fontSize:13,color:claimed?"#475569":complete?"#f59e0b":"#e0f2fe",textDecoration:claimed?"line-through":"none"}}>{m.title}</div>
                  <div style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginLeft:8,flexShrink:0}}>+{m.xp} XP</div>
                </div>
                <div style={{height:5,borderRadius:3,background:"rgba(14,165,233,0.1)",overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",width:`${pct*100}%`,background:complete?"#f59e0b":"#0ea5e9",borderRadius:3,transition:"width 0.5s"}} />
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:10,color:"#475569"}}>{progress}/{m.target}</div>
                  {complete && !claimed ? (
                    <button onClick={()=>onClaimMission(m.id)} style={{padding:"6px 14px",borderRadius:8,background:"linear-gradient(135deg,#d97706,#f59e0b)",border:"none",color:"#000",fontSize:11,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
                      CLAIM ⚡
                    </button>
                  ) : claimed ? (
                    <div style={{fontSize:10,color:"#4ade80"}}>✓ Claimed</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ANALYTICS */}
      {forgeTab==="analytics" && <AnalyticsPanel relapses={relapses} startMs={startMs} />}
    </div>
  );
}

function AnalyticsPanel({ relapses, startMs }) {
  const hasData = relapses.length >= 3;
  const startDate = startMs ? new Date(startMs) : new Date();

  // Chart 1: Urge pattern by day of week
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dayCount = Object.fromEntries(dayNames.map(d=>[d,0]));
  relapses.forEach(r=>{ const d = dayNames[new Date(r.timestamp).getDay()]; dayCount[d]++; });
  const dayData = dayNames.map(d=>({name:d,count:dayCount[d]}));
  const dangerDay = dayNames.reduce((a,b)=>dayCount[a]>=dayCount[b]?a:b);

  // Chart 3: Streak history
  const streakData = [];
  let prevMs = null;
  const sortedR = [...relapses].sort((a,b)=>a.timestamp-b.timestamp);
  sortedR.forEach((r,i)=>{
    const dur = prevMs ? Math.floor((r.timestamp - prevMs)/86400000) : Math.floor((r.timestamp - (startMs||r.timestamp-1))/86400000);
    if (dur > 0) streakData.push({n:`#${i+1}`,days:dur});
    prevMs = r.timestamp;
  });
  const curStreak = prevMs ? Math.floor((Date.now()-prevMs)/86400000) : Math.floor((Date.now()-(startMs||Date.now()))/86400000);
  streakData.push({n:"Now",days:curStreak,current:true});

  const avgStreak = streakData.length > 1 ? Math.round(streakData.slice(0,-1).reduce((s,x)=>s+x.days,0) / (streakData.length-1)) : 0;
  const bestStreak = Math.max(...streakData.map(x=>x.days));

  // Chart 5: Trigger analysis
  const triggerMap = { Stress:0, Boredom:0, Loneliness:0, "Late Night":0, "Phone Use":0 };
  relapses.forEach(r=>{
    const n = (r.note||"").toLowerCase();
    if (/stress|work|pressure|anxious/.test(n)) triggerMap.Stress++;
    if (/bored|nothing|lazy|empty/.test(n)) triggerMap.Boredom++;
    if (/lonely|alone|isolat/.test(n)) triggerMap.Loneliness++;
    if (/night|late|sleep|tired/.test(n)) triggerMap["Late Night"]++;
    if (/phone|scroll|social|insta|tiktok/.test(n)) triggerMap["Phone Use"]++;
  });
  const triggerData = Object.entries(triggerMap).filter(([,v])=>v>0).map(([k,v])=>({name:k,value:v}));
  const topTrigger = triggerData.sort((a,b)=>b.value-a.value)[0]?.name;
  const PIE_COLORS = ["#ef4444","#f59e0b","#8b5cf6","#0ea5e9","#22c55e"];

  const ttStyle = { background:"#010b1a", border:"1px solid rgba(14,165,233,0.2)", color:"#e0f2fe", fontFamily:"Georgia,serif", fontSize:11, borderRadius:6 };

  if (!hasData) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:40,marginBottom:12}}>📊</div>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.8}}>Analytics unlock after 3+ relapses with notes.<br/>Keep fighting — data builds over time.</div>
    </div>
  );

  return (
    <div>
      {/* Chart 1: Danger days */}
      <div style={{...glass(),padding:"14px",marginBottom:14}}>
        <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:12}}>YOUR DANGER DAYS</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={dayData} barSize={26}>
            <XAxis dataKey="name" tick={{fill:"#475569",fontSize:10,fontFamily:"Georgia,serif"}} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]}>
              {dayData.map((d,i)=><Cell key={i} fill={d.name===dangerDay?"#ef4444":"rgba(239,68,68,0.35)"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>⚠️ Highest risk day: <span style={{color:"#fca5a5",fontWeight:700}}>{dangerDay}</span></div>
      </div>

      {/* Chart 3: Streak history */}
      {streakData.length > 0 && (
        <div style={{...glass(),padding:"14px",marginBottom:14}}>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:12}}>YOUR STREAK JOURNEY</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={streakData} barSize={22}>
              <XAxis dataKey="n" tick={{fill:"#475569",fontSize:9,fontFamily:"Georgia,serif"}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="days" radius={[4,4,0,0]}>
                {streakData.map((d,i)=><Cell key={i} fill={d.current?"#f59e0b":"#38bdf8"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>Avg: <span style={{color:"#38bdf8"}}>{avgStreak}d</span> &nbsp;|&nbsp; Best: <span style={{color:"#f59e0b"}}>{bestStreak}d</span></div>
        </div>
      )}

      {/* Chart 5: Trigger analysis */}
      {triggerData.length > 0 && (
        <div style={{...glass(),padding:"14px",marginBottom:14}}>
          <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:12}}>YOUR TRIGGERS</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={triggerData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {triggerData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} />
            </PieChart>
          </ResponsiveContainer>
          {topTrigger && <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>⚡ Your #1 enemy: <span style={{color:"#fca5a5",fontWeight:700}}>{topTrigger}</span></div>}
        </div>
      )}
    </div>
  );
}

// ─── EXISTING TABS (unchanged logic) ─────────────────────────────────────
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
                : <div style={{fontSize:8,color:"#334155",marginTop:4}}>{m.days-days}d away</div>}
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
          let bg = "rgba(14,165,233,0.04)"; let borderC = "rgba(14,165,233,0.08)";
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

// ─── MODALS (existing unchanged + new) ────────────────────────────────────
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
          <button onClick={onBack} style={{flex:1,padding:"12px",borderRadius:12,background:"rgba(71,85,105,0.15)",border:"1px solid rgba(71,85,105,0.25)",color:"#94a3b8",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer"}}>← Back</button>
          <button onClick={isLast?onComplete:()=>setStep(s=>s+1)}
            style={{flex:2,padding:"12px",borderRadius:12,background:`linear-gradient(135deg,${tech.color}bb,${tech.color})`,border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
            {isLast?"✓ Complete":"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RelapseModal({ note, setNote, onLog, onClose, lastRelapse, shield, onUseShield }) {
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
          style={{...inputStyle,height:90,resize:"none",marginBottom:16,lineHeight:1.6}} />

        {/* Shield option */}
        {shield?.available && (
          <div style={{padding:"14px",borderRadius:12,background:"rgba(56,189,248,0.06)",border:"2px solid rgba(56,189,248,0.3)",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",marginBottom:6}}>🛡️ USE STREAK SHIELD?</div>
            <div style={{fontSize:11,color:"#7dd3fc",lineHeight:1.6,marginBottom:10}}>Absorbs this relapse. Streak continues. Event still logged for data. 14-day cooldown applies.</div>
            <button onClick={onUseShield} style={{width:"100%",padding:"11px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#38bdf8)",border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
              USE SHIELD — Keep My Streak
            </button>
          </div>
        )}

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
          <div style={{display:"inline-block",padding:"6px 20px",borderRadius:20,background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontSize:12}}>+{m.bonus} XP Bonus ✓</div>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginTop:8}}>
          Claim Your Honor ⚔️
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ profile, setProfile, days, xp, taskXp, relapses, rank, levelInfo, records, partner, onSavePartner, onSave, onClose, onChangePin }) {
  const [editPartner, setEditPartner] = useState(partner || { name:"", days:0, rank:"Squire" });
  const [showPartner, setShowPartner] = useState(false);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:20,textAlign:"center"}}>⚙️ Settings</div>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[["Streak","⚔️",`${days} days`],["Rank",rank.icon,rank.name],["Level","⚡",`Lv.${levelInfo.level} ${levelInfo.title}`],["Task XP","⭐",`${taskXp} XP`],["Defeats","💀",`${relapses.length}`],["Shield","🛡️",records.longest_streak||0]].map(([label,icon,val])=>(
            <div key={label} style={{...glass(),padding:"12px 10px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:2}}>{val}</div>
              <div style={{fontSize:9,color:"#475569"}}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Personal Records */}
        {Object.keys(records).length > 0 && (
          <div style={{...glass(),padding:"14px",marginBottom:16}}>
            <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.1em",marginBottom:10}}>🏆 PERSONAL RECORDS</div>
            {[["Longest Streak","longest_streak","days"],["Most XP / Day","most_xp_day","XP"],["Most Tasks / Day","most_tasks_day","tasks"]].map(([lbl,key,unit])=>records[key]!=null&&(
              <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(14,165,233,0.08)"}}>
                <span style={{fontSize:11,color:"#94a3b8"}}>{lbl}</span>
                <span style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>{records[key]} {unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
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

        {/* Accountability Partner */}
        <button onClick={()=>setShowPartner(!showPartner)}
          style={{width:"100%",padding:"11px",borderRadius:12,background:"rgba(14,165,233,0.05)",border:"1px solid rgba(14,165,233,0.15)",color:"#38bdf8",fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:showPartner?10:16}}>
          🤝 {partner ? "Edit" : "Add"} Accountability Partner
        </button>
        {showPartner && (
          <div style={{...glass(),padding:"14px",marginBottom:16}}>
            <div style={{fontSize:10,color:"#38bdf8",letterSpacing:"0.1em",marginBottom:10}}>ACCOUNTABILITY PARTNER</div>
            {[{label:"Name",key:"name",type:"text"},{label:"Days (their streak)",key:"days",type:"number"}].map(f=>(
              <div key={f.key} style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:4}}>{f.label}</div>
                <input type={f.type} value={editPartner[f.key]||""} onChange={e=>setEditPartner(p=>({...p,[f.key]:f.type==="number"?+e.target.value:e.target.value}))}
                  style={{...inputStyle,fontSize:13}} />
              </div>
            ))}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Their Rank</div>
              <select value={editPartner.rank||"Squire"} onChange={e=>setEditPartner(p=>({...p,rank:e.target.value}))}
                style={{...inputStyle,fontSize:13}}>
                {RANKS.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <button onClick={()=>{onSavePartner(editPartner);setShowPartner(false);}}
              style={{width:"100%",padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0ea5e9)",border:"none",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
              Save Partner
            </button>
          </div>
        )}

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

// ─── NEW MODALS ────────────────────────────────────────────────────────────
function NewRecordModal({ record, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{...modalSheet,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:52,marginBottom:8}}>🏆</div>
        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:"0.25em",marginBottom:8}}>NEW RECORD</div>
        <div style={{fontSize:18,fontWeight:700,color:"#fbbf24",marginBottom:12}}>{record.label}</div>
        <div style={{fontSize:32,fontWeight:900,color:"#f59e0b",textShadow:"0 0 30px #f59e0b",marginBottom:8}}>{record.value}</div>
        {record.prev > 0 && <div style={{fontSize:11,color:"#475569",marginBottom:20}}>Previous: {record.prev}</div>}
        <div style={{padding:"8px 16px",borderRadius:20,background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b",fontSize:12,display:"inline-block",marginBottom:20}}>
          +150 XP Bonus ✓
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#d97706,#f59e0b)",border:"none",color:"#000",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer"}}>
          Claim Record ⚔️
        </button>
      </div>
    </div>
  );
}

// ─── ADDITION 10: RELAPSE PATTERN DETECTOR (helper) ───────────────────────
function detectPattern(relapses) {
  if (relapses.length < 3) return null;
  // Find danger zone: most common streak day range at relapse
  const streakDays = relapses.filter(r=>r.day!=null).map(r=>r.day);
  if (!streakDays.length) return null;
  const avg = Math.round(streakDays.reduce((s,d)=>s+d,0)/streakDays.length);
  const dangerStart = Math.max(0, avg - 3);
  const dangerEnd   = avg + 3;

  // Find top trigger keyword
  const keyMap = { Stress:/stress|work|pressure/, Boredom:/bored|nothing|lazy/, Loneliness:/lonely|alone/, "Late Night":/night|late|tired/, "Phone Use":/phone|scroll|social/ };
  const counts = {};
  relapses.forEach(r=>{
    const n=(r.note||"").toLowerCase();
    for (const [k,rx] of Object.entries(keyMap)) if (rx.test(n)) counts[k]=(counts[k]||0)+1;
  });
  const topTrigger = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];

  return { dangerStart, dangerEnd, topTrigger };
}
