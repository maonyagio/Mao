// AnimeApp.tsx — Complete React Streaming App
import { useState, useEffect, useCallback } from "react";

const API_KEY  = "gsa_38a96517a81e496b8830e995558f32de4364bf14";   // ← Ganti ini
const BASE_URL = "https://wpfaemvyizplkcxxwpfa.backend.onspace.ai/functions/v1/anime-api";

async function animeApi<T = unknown>(action: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs  = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])) }).toString();
  const res = await fetch(`${BASE_URL}?${qs}`, { headers: { "x-api-key": API_KEY } });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API error");
  return json.data as T;
}

interface Anime   { title: string; slug: string; coverImage?: string; type?: string; status?: string; }
interface Episode { number: number; title?: string; url: string; thumbnail?: string; }
interface Video   { videoUrl?: string; iframeUrl?: string; }

export default function AnimeApp() {
  const [animeList,    setAnimeList]    = useState<Anime[]>([]);
  const [episodes,     setEpisodes]     = useState<Episode[]>([]);
  const [currentEp,    setCurrentEp]    = useState<Episode | null>(null);
  const [video,        setVideo]        = useState<Video | null>(null);
  const [selectedAnime,setSelectedAnime]= useState<Anime | null>(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [page,         setPage]         = useState(1);

  useEffect(() => { loadLatest(1, true); }, []);

  const loadLatest = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    const data = await animeApi<Anime[]>("latest", { page: p });
    setAnimeList(prev => reset ? data : [...prev, ...data]);
    setPage(p); setLoading(false);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { loadLatest(1, true); return; }
    setLoading(true);
    const data = await animeApi<Anime[]>("search", { q, page: 1 });
    setAnimeList(data); setLoading(false);
  }, [loadLatest]);

  const openAnime = useCallback(async (anime: Anime) => {
    setSelectedAnime(anime); setCurrentEp(null); setVideo(null);
    const data = await animeApi<Episode[]>("episodes", { slug: anime.slug });
    setEpisodes(data);
    if (data.length) playEpisode(data[0]);
  }, []);

  const playEpisode = useCallback(async (ep: Episode) => {
    setCurrentEp(ep); setVideoLoading(true); setVideo(null);
    const data = await animeApi<Video>("video", { episodeUrl: ep.url });
    setVideo(data); setVideoLoading(false);
  }, []);

  return (
    <div style={{ background: "#0a0a14", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, background: "linear-gradient(90deg,#a78bfa,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🎬 My Anime</h1>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>GitStream API</span>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch(searchQuery)}
          placeholder="Cari anime... (Enter untuk cari)"
          style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#fff", fontSize: 14, outline: "none" }} />
        <button onClick={() => handleSearch(searchQuery)} style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>Cari</button>
      </div>

      {/* Player */}
      {selectedAnime && (
        <div style={{ background: "rgba(10,10,22,.9)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: "#c4b5fd", marginBottom: 12 }}>{selectedAnime.title}</h2>
          <div style={{ background: "#000", borderRadius: 12, aspectRatio: "16/9", overflow: "hidden", marginBottom: 16 }}>
            {videoLoading && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,.4)" }}>⏳ Memuat video...</div>}
            {/* Prioritaskan iframeUrl — videoplayback Google CDN punya CORS restriction */}
            {!videoLoading && video?.iframeUrl && <iframe src={video.iframeUrl} allowFullScreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="no-referrer-when-downgrade" style={{ width:"100%",height:"100%",border:"none" }} />}
            {!videoLoading && !video?.iframeUrl && video?.videoUrl && <video src={video.videoUrl} controls autoPlay style={{ width:"100%",height:"100%" }} />}
            {!videoLoading && video && !video.iframeUrl && !video.videoUrl && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#f87171" }}>Video tidak tersedia</div>}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
            {[...episodes].reverse().map(ep => (
              <button key={ep.number} onClick={() => playEpisode(ep)} style={{
                padding:"6px 14px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:700,
                borderColor: currentEp?.number===ep.number ? "rgba(139,92,246,.5)" : "rgba(255,255,255,.1)",
                background:  currentEp?.number===ep.number ? "rgba(139,92,246,.2)" : "rgba(255,255,255,.05)",
                color:       currentEp?.number===ep.number ? "#c4b5fd" : "rgba(255,255,255,.6)",
              }}>Ep {ep.number}</button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading && <p style={{ textAlign:"center",color:"rgba(255,255,255,.4)",padding:40 }}>Memuat...</p>}
      {!loading && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))",gap:16,marginBottom:24 }}>
          {animeList.map(anime => (
            <div key={anime.slug} onClick={() => openAnime(anime)} style={{ borderRadius:14,overflow:"hidden",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",cursor:"pointer",transition:"transform .2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform="translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform=""}>
              <img src={anime.coverImage||`https://placehold.co/150x225/1a1a2e/fff?text=${encodeURIComponent(anime.title.slice(0,8))}`} alt={anime.title} style={{ width:"100%",aspectRatio:"2/3",objectFit:"cover" }} loading="lazy" />
              <div style={{ padding:10 }}>
                <p style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.85)",marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{anime.title}</p>
                <p style={{ fontSize:10,color:"rgba(255,255,255,.3)" }}>{anime.type||"TV"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && animeList.length > 0 && !searchQuery && (
        <button onClick={() => loadLatest(page+1,false)} style={{ display:"block",margin:"0 auto",padding:"12px 32px",borderRadius:14,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",fontWeight:700,cursor:"pointer",fontSize:14 }}>
          Muat Lebih Banyak
        </button>
      )}
    </div>
  );
}
