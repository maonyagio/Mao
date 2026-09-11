// gitstream.js — GitStream API SDK
const GITSTREAM_CONFIG = {
  apiKey:  "gsa_38a96517a81e496b8830e995558f32de4364bf14",   // ← Ganti ini
  baseUrl: "https://wpfaemvyizplkcxxwpfa.backend.onspace.ai/functions/v1/anime-api",
};

class GitStreamAPI {
  constructor(config) { this.apiKey = config.apiKey; this.baseUrl = config.baseUrl; }

  async _get(action, params = {}) {
    const qs  = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${this.baseUrl}?${qs}`, { headers: { "x-api-key": this.apiKey } });
    const json = await res.json();
    if (!json.success) throw new Error(`[${json.code}] ${json.error}`);
    return json;
  }

  async getLatest(page = 1)            { return this._get("latest",   { page }); }
  async getBulk(page = 1, limit = 20)  { return this._get("bulk",     { page, limit }); }
  async search(query, page = 1)        { return this._get("search",   { q: query, page }); }
  async getByGenre(genre, page = 1)    { return this._get("genre",    { genre, page }); }
  async getDetail(slug)                { return this._get("detail",   { slug }); }
  async getEpisodes(slug)              { return this._get("episodes", { slug }); }
  async getVideoUrl(episodeUrl)        { return this._get("video",    { episodeUrl }); }

  // Helper: cari → ambil episode → dapat stream URL langsung
  async playAnime(query, episodeNumber = 1) {
    const { data: results }  = await this.search(query);
    if (!results.length) throw new Error("Anime tidak ditemukan");
    const { data: episodes } = await this.getEpisodes(results[0].slug);
    const episode = episodes.find(e => e.number === episodeNumber) || episodes[0];
    const { data: video }    = await this.getVideoUrl(episode.url);
    return { episode, streamUrl: video.iframeUrl || video.videoUrl, type: video.iframeUrl ? "iframe" : "direct" };
  }
}

export const gitstream = new GitStreamAPI(GITSTREAM_CONFIG);

// ── Contoh penggunaan ────────────────────────────────────────
// const { data }  = await gitstream.getLatest();
// const { data }  = await gitstream.search("one piece");
// const { streamUrl, type } = await gitstream.playAnime("naruto", 1);
// if (type === "iframe") iframeEl.src = streamUrl;
// else videoEl.src = streamUrl;
