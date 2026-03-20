import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase.js";
import { collection, doc, setDoc, deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// NO SEED TOPICS — blank slate, build as you go
// ═══════════════════════════════════════════════════════════════
const SEED_TOPICS = [];

const CAT_COLORS = {
  "Creative Projects": { bg: "#fce4ec", text: "#c62828", accent: "#e74c5e" },
  "Web Dev":           { bg: "#e8f5e9", text: "#1b5e20", accent: "#43a047" },
  "Content & Media":   { bg: "#e8eaf6", text: "#283593", accent: "#5c6bc0" },
  "Writing":           { bg: "#fff3e0", text: "#e65100", accent: "#fb8c00" },
  "Personal Universe": { bg: "#f3e5f5", text: "#6a1b9a", accent: "#ab47bc" },
  "Travel":            { bg: "#e0f2f1", text: "#004d40", accent: "#26a69a" },
  "Crafting":          { bg: "#fce4ec", text: "#880e4f", accent: "#ec407a" },
  "Entertainment":     { bg: "#e3f2fd", text: "#1565c0", accent: "#42a5f5" },
  "Personal":          { bg: "#fff8e1", text: "#f57f17", accent: "#ffca28" },
  "Wellness":          { bg: "#e8f5e9", text: "#2e7d32", accent: "#66bb6a" },
  "History":           { bg: "#efebe9", text: "#4e342e", accent: "#8d6e63" },
  "Core Identity":     { bg: "#fff3e0", text: "#bf360c", accent: "#ff7043" },
  "Work":              { bg: "#e3f2fd", text: "#0d47a1", accent: "#1e88e5" },
  "Productivity":      { bg: "#f1f8e9", text: "#33691e", accent: "#7cb342" },
  "Science & Curiosity": { bg: "#e0f7fa", text: "#006064", accent: "#00acc1" },
  "Gaming":            { bg: "#e8f5e9", text: "#1b5e20", accent: "#4caf50" },
  "Personal Growth":   { bg: "#fff8e1", text: "#ff6f00", accent: "#ffa726" },
  "Random Curiosity":  { bg: "#ede7f6", text: "#4527a0", accent: "#7e57c2" },
  "Food & Drink":      { bg: "#fce4ec", text: "#bf360c", accent: "#ff8a65" },
  "Technology":        { bg: "#e8eaf6", text: "#1a237e", accent: "#5c6bc0" },
  "Design":            { bg: "#fce4ec", text: "#880e4f", accent: "#ec407a" },
  "Money & Finance":   { bg: "#e8f5e9", text: "#1b5e20", accent: "#66bb6a" },
  "Relationships":     { bg: "#f3e5f5", text: "#6a1b9a", accent: "#ab47bc" },
  "Nature & Animals":  { bg: "#e0f2f1", text: "#004d40", accent: "#26a69a" },
};

// ═══════════════════════════════════════════════════════════════
// AI TOPIC GENERATOR
// ═══════════════════════════════════════════════════════════════
async function generateTopic(userInput) {
  const res = await fetch("/.netlify/functions/generate-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: userInput })
  });
  if (!res.ok) throw new Error("Function call failed");
  return await res.json();
}


// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════
function StatBar({ topics }) {
  if (topics.length === 0) return null;
  const catCounts = {};
  topics.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ display: "flex", gap: 3, height: 6, borderRadius: 3, overflow: "hidden", maxWidth: 400, margin: "14px auto 0" }}>
      {sorted.map(([cat, count]) => (
        <div key={cat} title={`${cat}: ${count}`} style={{ flex: count, background: (CAT_COLORS[cat] || {}).accent || "#999", borderRadius: 3 }} />
      ))}
    </div>
  );
}

function AddTopicPanel({ onAdd, onClose }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setError(null);
    try {
      const topic = await generateTopic(input.trim());
      topic.id = "custom-" + Date.now();
      onAdd(topic);
      setInput("");
    } catch (e) {
      setError("Couldn't generate that one. Try again or rephrase it!");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,10,20,0.55)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, maxWidth: 560, width: "100%",
        animation: "slideUp 0.3s ease", boxShadow: "0 25px 80px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #c0956c, #8b6914)",
          padding: "28px 28px 24px", color: "#fff"
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)",
            border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer",
            color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🧠</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", margin: 0 }}>Add to the Encyclopedia</h2>
          <p style={{ fontSize: 13, opacity: 0.85, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>Ask a question or describe a topic. AI will generate a full encyclopedia entry.</p>
        </div>
        <div style={{ padding: "24px 28px 28px" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 'What is dopamine and why does it matter?' or 'The history of crossbody bags' or 'How does sourdough starter work?'"
            rows={4}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            style={{
              width: "100%", padding: 14, border: "2px solid #eee", borderRadius: 14,
              fontSize: 14, outline: "none", resize: "vertical", fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.6, color: "#333"
            }}
          />
          {error && <p style={{ color: "#e74c5e", fontSize: 13, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: 11, color: "#ccc", fontFamily: "'DM Sans', sans-serif" }}>⌘Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              style={{
                padding: "10px 24px", borderRadius: 12, border: "none",
                background: loading ? "#ddd" : "#1a1a2e", color: loading ? "#999" : "#fff",
                fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
              }}
            >{loading ? "Generating..." : "Add Topic"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandedCard({ topic, onClose, onDelete }) {
  const colors = CAT_COLORS[topic.category] || { bg: "#f5f5f5", text: "#333", accent: "#999" };
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handler); };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,10,20,0.55)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 24, maxWidth: 720, width: "100%",
        maxHeight: "88vh", overflow: "auto",
        animation: "slideUp 0.3s ease", boxShadow: "0 25px 80px rgba(0,0,0,0.3)"
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})`,
          padding: "32px 32px 28px", borderRadius: "24px 24px 0 0", color: "#fff",
          position: "sticky", top: 0, zIndex: 2
        }}>
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            <button onClick={() => { if (window.confirm("Remove this topic?")) onDelete(topic.id); }} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>🗑</button>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>✕</button>
          </div>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{topic.icon}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "'Fraunces', serif" }}>{topic.title}</h2>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>{topic.category}</div>
        </div>
        <div style={{ padding: "28px 32px 36px" }}>
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.accent, margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>The Full Story</h4>
            {(topic.fullContent || []).map((p, i) => (
              <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, color: "#555", margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif" }}>{p}</p>
            ))}
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${colors.accent}30, transparent)`, margin: "8px 0 24px" }} />
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.accent, margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Key Takeaways</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(topic.takeaways || []).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: colors.bg, borderRadius: 12, padding: "10px 14px" }}>
                  <span style={{ color: colors.accent, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: 13.5, color: "#444", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.accent, margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(topic.details || []).map((d, i) => (
                <div key={i} style={{ fontSize: 13.5, color: "#555", paddingLeft: 16, borderLeft: `3px solid ${colors.accent}30`, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{d}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(topic.tags || []).map(tag => (
              <span key={tag} style={{ fontSize: 12, background: colors.bg, color: colors.text, padding: "5px 12px", borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicCard({ topic, onClick, index }) {
  const colors = CAT_COLORS[topic.category] || { bg: "#f5f5f5", text: "#333", accent: "#999" };
  const [hovered, setHovered] = useState(false);
  return (
    <article onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 20, cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 16px 40px ${colors.accent}25, 0 0 0 2px ${colors.accent}40` : "0 2px 12px rgba(0,0,0,0.06)",
        overflow: "hidden", animation: `cardIn 0.4s ease ${index * 0.03}s both`,
      }}>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${colors.accent}, ${colors.text})` }} />
      <div style={{ padding: "20px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 30, width: 50, height: 50, borderRadius: 14, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s ease", transform: hovered ? "scale(1.1) rotate(-3deg)" : "scale(1)" }}>{topic.icon}</div>
          <span style={{ fontSize: 11, color: colors.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", background: colors.bg, padding: "4px 10px", borderRadius: 8 }}>{topic.category}</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: "#1a1a2e", fontFamily: "'Fraunces', serif", lineHeight: 1.25 }}>{topic.title}</h3>
        <p style={{ fontSize: 13.5, color: "#777", margin: "0 0 16px", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{topic.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(topic.tags || []).slice(0, 3).map(tag => (
            <span key={tag} style={{ fontSize: 11, background: "#f8f8fa", color: "#888", padding: "3px 10px", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: colors.accent, marginTop: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(4px)", transition: "all 0.2s ease" }}>Click to read more →</div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [wrong, setWrong] = useState(false);
  const handleSubmit = () => {
    const hash = Array.from(pw).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    if (hash === -1028445882) {
      sessionStorage.setItem("brain-unlocked", "true");
      onUnlock();
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 1500);
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Fraunces', serif", color: "#1a1a2e", marginBottom: 8 }}>Ally's Brain Index</h1>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 28 }}>This encyclopedia is private. Enter the password to continue.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Password"
            autoFocus
            style={{
              flex: 1, padding: "12px 16px", border: wrong ? "2px solid #e74c5e" : "2px solid #eee",
              borderRadius: 12, fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.2s"
            }}
          />
          <button onClick={handleSubmit} style={{
            padding: "12px 20px", borderRadius: 12, border: "none", background: "#1a1a2e",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
          }}>Enter</button>
        </div>
        {wrong && <p style={{ color: "#e74c5e", fontSize: 13, marginTop: 12 }}>Wrong password. Try again!</p>}
      </div>
    </div>
  );
}

export default function PersonalEncyclopediaSite() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("brain-unlocked") === "true");
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  const [customTopics, setCustomTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const searchRef = useRef(null);

  // Real-time sync with Firebase
  useEffect(() => {
    const q = query(collection(db, "topics"));
    const unsub = onSnapshot(q, (snapshot) => {
      const topics = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      topics.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCustomTopics(topics);
      setLoaded(true);
    }, (err) => {
      console.error("Firebase error:", err);
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  const handleAddTopic = useCallback(async (topic) => {
    try {
      topic.createdAt = Date.now();
      await setDoc(doc(db, "topics", topic.id), topic);
    } catch (e) { console.error("Save error:", e); }
    setShowAddPanel(false);
  }, []);

  const handleDeleteTopic = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "topics", id));
    } catch (e) { console.error("Delete error:", e); }
    setExpandedTopic(null);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setShowAddPanel(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allTopics = useMemo(() => [...customTopics, ...SEED_TOPICS], [customTopics]);
  const categories = useMemo(() => [...new Set(allTopics.map(t => t.category))], [allTopics]);
  const allTags = useMemo(() => [...new Set(allTopics.flatMap(t => t.tags || []))].sort(), [allTopics]);

  const filtered = useMemo(() => {
    return allTopics.filter(topic => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        topic.title.toLowerCase().includes(q) ||
        (topic.description || "").toLowerCase().includes(q) ||
        (topic.fullContent || []).some(p => p.toLowerCase().includes(q)) ||
        (topic.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (topic.takeaways || []).some(t => t.toLowerCase().includes(q)) ||
        (topic.details || []).some(d => d.toLowerCase().includes(q)) ||
        (topic.category || "").toLowerCase().includes(q);
      const matchesCat = !activeCategory || topic.category === activeCategory;
      const matchesTags = activeTags.length === 0 || activeTags.some(tag => (topic.tags || []).includes(tag));
      return matchesSearch && matchesCat && matchesTags;
    });
  }, [search, activeCategory, activeTags, allTopics]);

  const toggleTag = (tag) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const clearAll = () => { setSearch(""); setActiveCategory(null); setActiveTags([]); };
  const hasFilters = search || activeCategory || activeTags.length > 0;

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#ccc" }}>Loading encyclopedia...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;0,9..144,800;1,9..144,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-8px) rotate(3deg) } }
        @keyframes heroIn { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 0.12 } 50% { opacity: 0.22 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #bbb; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        @media (max-width: 768px) { .grid-cards { grid-template-columns: 1fr !important; } .hero-title { font-size: 34px !important; } .cat-scroll { flex-wrap: wrap !important; } .stat-row { flex-wrap: wrap !important; } }
      `}</style>

      <header style={{ textAlign: "center", padding: "52px 24px 16px", animation: "heroIn 0.6s ease", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 18, left: "8%", fontSize: 26, opacity: 0.12, animation: "float 4s ease infinite" }}>✦</div>
        <div style={{ position: "absolute", top: 50, right: "10%", fontSize: 20, opacity: 0.1, animation: "float 5s ease infinite 1s" }}>◯</div>
        <div style={{ position: "absolute", top: 80, left: "20%", fontSize: 15, opacity: 0.08, animation: "float 3.5s ease infinite 0.5s" }}>✧</div>

        <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#c0956c", marginBottom: 12, background: "#c0956c15", padding: "6px 18px", borderRadius: 20 }}>Personal Encyclopedia</div>
        <h1 className="hero-title" style={{ fontSize: 50, fontWeight: 800, fontFamily: "'Fraunces', serif", color: "#1a1a2e", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 10 }}>Ally's Brain Index</h1>
        <p style={{ fontSize: 16, color: "#999", maxWidth: 520, margin: "0 auto 6px", lineHeight: 1.6 }}>
          A curated collection of rabbit holes, deep dives, and random knowledge. Organized by chaos, sorted by curiosity, fueled by Diet Coke.
        </p>

        {allTopics.length > 0 && (
          <>
            <div className="stat-row" style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16, fontSize: 13, color: "#bbb" }}>
              <span><strong style={{ color: "#c0956c" }}>{allTopics.length}</strong> {allTopics.length === 1 ? "topic" : "topics"}</span>
              <span><strong style={{ color: "#c0956c" }}>{categories.length}</strong> {categories.length === 1 ? "category" : "categories"}</span>
              <span><strong style={{ color: "#c0956c" }}>{allTags.length}</strong> tags</span>
            </div>
            <StatBar topics={allTopics} />
          </>
        )}
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* Search + Add */}
        <div style={{ maxWidth: 560, margin: "0 auto 24px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#ccc", pointerEvents: "none" }}>⌕</span>
            <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={allTopics.length > 0 ? "Search topics, tags, ideas..." : "Add your first topic with the + button →"}
              style={{ width: "100%", padding: "14px 80px 14px 48px", border: "2px solid #eee", borderRadius: 16, fontSize: 15, outline: "none", background: "#fff", color: "#333", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = "#c0956c"; e.target.style.boxShadow = "0 4px 20px rgba(192,149,108,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
            />
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#ccc", background: "#f5f5f5", padding: "4px 8px", borderRadius: 6, fontWeight: 600, pointerEvents: "none" }}>⌘K</span>
          </div>
          <button onClick={() => setShowAddPanel(true)} title="Add topic (⌘N)" style={{
            width: 48, height: 48, borderRadius: 14, border: "none", background: "#1a1a2e",
            color: "#fff", fontSize: 22, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s, background 0.2s"
          }} onMouseEnter={e => e.target.style.background = "#c0956c"} onMouseLeave={e => e.target.style.background = "#1a1a2e"}>+</button>
        </div>

        {/* Category filters -- only show if there are topics */}
        {categories.length > 0 && (
          <>
            <div className="cat-scroll" style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 12, flexWrap: "wrap", padding: "0 8px" }}>
              <button onClick={() => setActiveCategory(null)} style={{ padding: "7px 15px", borderRadius: 11, border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: !activeCategory ? "#1a1a2e" : "#f0efed", color: !activeCategory ? "#fff" : "#888" }}>All</button>
              {categories.map(cat => {
                const c = CAT_COLORS[cat] || {};
                const active = activeCategory === cat;
                return <button key={cat} onClick={() => setActiveCategory(active ? null : cat)} style={{ padding: "7px 15px", borderRadius: 11, border: "none", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: active ? (c.accent || "#666") : "#f0efed", color: active ? "#fff" : "#888" }}>{cat}</button>;
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: showFilters ? 12 : 24 }}>
              <button onClick={() => setShowFilters(!showFilters)} style={{ background: "none", border: "none", fontSize: 12, color: "#bbb", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{showFilters ? "Hide tags ▴" : "Filter by tags ▾"}</button>
              <div style={{ width: 1, height: 14, background: "#e0e0e0" }} />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? "#1a1a2e" : "#f0efed", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13, color: viewMode === "grid" ? "#fff" : "#aaa" }}>⊞</button>
                <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? "#1a1a2e" : "#f0efed", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13, color: viewMode === "list" ? "#fff" : "#aaa" }}>☰</button>
              </div>
            </div>

            {showFilters && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 24, maxWidth: 720, margin: "0 auto 24px", animation: "fadeIn 0.2s ease" }}>
                {allTags.map(tag => {
                  const active = activeTags.includes(tag);
                  return <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: "5px 12px", borderRadius: 10, fontSize: 12, border: active ? "1.5px solid #c0956c" : "1.5px solid #e8e6e3", background: active ? "#c0956c15" : "transparent", color: active ? "#c0956c" : "#aaa", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{tag}</button>;
                })}
              </div>
            )}

            {hasFilters && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20, animation: "fadeIn 0.2s ease" }}>
                <span style={{ fontSize: 13, color: "#999" }}>{filtered.length} {filtered.length === 1 ? "topic" : "topics"} found</span>
                <button onClick={clearAll} style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#999", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Clear all</button>
              </div>
            )}
          </>
        )}

        {/* Content */}
        {filtered.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
              {filtered.map((topic, i) => (
                <TopicCard key={topic.id || topic.title} topic={topic} index={i} onClick={() => setExpandedTopic(topic)} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800, margin: "0 auto" }}>
              {filtered.map((topic, i) => {
                const colors = CAT_COLORS[topic.category] || { bg: "#f5f5f5", text: "#333", accent: "#999" };
                return (
                  <div key={topic.id || topic.title} onClick={() => setExpandedTopic(topic)}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", background: "#fff", borderRadius: 14, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", borderLeft: `4px solid ${colors.accent}`, transition: "transform 0.2s, box-shadow 0.2s", animation: `cardIn 0.3s ease ${i * 0.03}s both` }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)"; }}>
                    <div style={{ fontSize: 28, width: 44, height: 44, borderRadius: 12, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{topic.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Fraunces', serif", color: "#1a1a2e", margin: 0 }}>{topic.title}</h3>
                        <span style={{ fontSize: 11, color: colors.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{topic.category}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topic.description}</p>
                    </div>
                    <span style={{ color: "#ddd", fontSize: 16, flexShrink: 0 }}>→</span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty state */
          <div style={{ textAlign: "center", padding: "80px 20px", animation: "fadeIn 0.4s ease" }}>
            {allTopics.length === 0 ? (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fraunces', serif", color: "#1a1a2e", marginBottom: 8 }}>Your encyclopedia is empty</h2>
                <p style={{ fontSize: 15, color: "#999", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  This is your blank slate. Ask a question, explore a topic, start a rabbit hole. Hit the + button to add your first entry.
                </p>
                <button onClick={() => setShowAddPanel(true)} style={{
                  padding: "14px 28px", borderRadius: 14, border: "none", background: "#1a1a2e",
                  color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s"
                }} onMouseEnter={e => e.target.style.background = "#c0956c"} onMouseLeave={e => e.target.style.background = "#1a1a2e"}>
                  + Add Your First Topic
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#aaa", marginBottom: 6 }}>No topics found</p>
                <p style={{ fontSize: 13, color: "#ccc" }}>Try a different search or clear your filters</p>
              </>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "32px 24px 40px", borderTop: "1px solid #eee" }}>
        <p style={{ fontSize: 12, color: "#ccc", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>Curated by curiosity · Powered by chaos · Fueled by Diet Coke</p>
        <p style={{ fontSize: 11, color: "#ddd", marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>Born in Des Moines · Built one rabbit hole at a time</p>
      </footer>

      {expandedTopic && <ExpandedCard topic={expandedTopic} onClose={() => setExpandedTopic(null)} onDelete={handleDeleteTopic} />}
      {showAddPanel && <AddTopicPanel onAdd={handleAddTopic} onClose={() => setShowAddPanel(false)} />}
    </div>
  );
}
