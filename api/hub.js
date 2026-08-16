const OFFICIAL_FEED = "https://www.ageofempires.com/news/feed/";
const LIQUIPEDIA_API = "https://liquipedia.net/ageofempires/api.php?action=parse&page=Age_of_Empires_II%2FTournaments%2F2026-27&prop=text&format=json";
const YOUTUBE_CHANNELS = [
  { name: "Age of Empires", id: "UCidjrp1fZd8TehYD2eYYPvg" },
  { name: "T90Official", id: "UCZUT79WUUpZlZ-XMF7l4CFg" },
  { name: "Hera", id: "UCeqc9aYVAZcRQq9Ey0x26AQ" },
  { name: "Spirit of the Law", id: "UChzLZJo-SxuPHz-oYKAIC_g" }
];
const AOE2_TERMS = /age of empires ii|age ii|aoe ?2|definitive edition|victors and vanquished|chronicles|return of rome/i;
const LOCALES = new Set(["en", "es", "pt-BR"]);

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const locale = LOCALES.has(req.query.locale) ? req.query.locale : "en";
  const week = /^\d{4}-W\d{2}$/.test(String(req.query.week || "")) ? String(req.query.week) : isoWeek(new Date());
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=604800");

  const [newsResult, tournamentResult, videoResult] = await Promise.allSettled([
    getOfficialNews(),
    getTournaments(),
    getVideos()
  ]);

  const news = fulfilled(newsResult, []);
  const tournaments = fulfilled(tournamentResult, []);
  const videos = fulfilled(videoResult, []);
  const availableSources = [newsResult, tournamentResult, videoResult].filter((result) => result.status === "fulfilled").length;
  const sourceCount = availableSources + YOUTUBE_CHANNELS.length - (videoResult.status === "fulfilled" ? 0 : YOUTUBE_CHANNELS.length);

  let brief;
  let aiPowered = false;
  try {
    brief = await createWeeklyBrief({ locale, week, tournaments, news, videos });
    aiPowered = Boolean(brief);
  } catch (error) {
    brief = "";
  }
  if (!brief) brief = fallbackBrief(locale, tournaments.length, news.length, videos.length);

  return res.status(200).json({
    locale,
    week,
    weekLabel: week,
    generatedAt: new Date().toISOString(),
    aiPowered,
    sourceCount,
    brief,
    tournaments,
    news,
    videos,
    sources: [
      { name: "Age of Empires", url: "https://www.ageofempires.com/news/" },
      { name: "Liquipedia AOE2", url: "https://liquipedia.net/ageofempires/Age_of_Empires_II/Tournaments/2026-27" },
      { name: "YouTube", url: "https://www.youtube.com/" }
    ]
  });
};

async function getOfficialNews() {
  const xml = await fetchText(OFFICIAL_FEED, { Accept: "application/rss+xml, application/xml" });
  return (xml.match(/<item[\s\S]*?<\/item>/gi) || [])
    .map((item) => ({
      title: xmlValue(item, "title"),
      url: xmlValue(item, "link"),
      publishedAt: toIso(xmlValue(item, "pubDate")),
      excerpt: truncate(stripHtml(xmlValue(item, "description")), 180)
    }))
    .filter((item) => item.title && item.url && AOE2_TERMS.test(item.title + " " + item.excerpt))
    .slice(0, 6);
}

async function getVideos() {
  const results = await Promise.allSettled(YOUTUBE_CHANNELS.map(async (channel) => {
    const xml = await fetchText("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel.id, { Accept: "application/atom+xml, application/xml" });
    return (xml.match(/<entry[\s\S]*?<\/entry>/gi) || []).map((entry) => {
      const videoId = xmlValue(entry, "yt:videoId");
      return {
        title: xmlValue(entry, "title"),
        url: videoId ? "https://www.youtube.com/watch?v=" + videoId : "",
        thumbnail: videoId ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : "",
        channel: channel.name,
        publishedAt: toIso(xmlValue(entry, "published"))
      };
    }).filter((item) => item.title && item.url).slice(0, 3);
  }));

  return results.flatMap((result) => fulfilled(result, []))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 9);
}

async function getTournaments() {
  const raw = await fetchText(LIQUIPEDIA_API, {
    Accept: "application/json",
    "User-Agent": "ForgeAtlas/1.0 (https://aoe2-forge-atlas.vercel.app; public AOE2 companion)"
  });
  const payload = JSON.parse(raw);
  const html = payload && payload.parse && payload.parse.text && payload.parse.text["*"];
  if (!html) throw new Error("Tournament source returned no table");

  const now = Date.now();
  const earliest = now - (7 * 86400000);
  const latest = now + (365 * 86400000);

  return (html.match(/<tr[^>]*class="[^"]*table2-row--body[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || [])
    .map(parseTournamentRow)
    .filter(Boolean)
    .filter((item) => Date.parse(item.endDate || item.startDate) >= earliest && Date.parse(item.startDate) <= latest)
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
    .slice(0, 10);
}

function parseTournamentRow(row) {
  const cells = (row.match(/<td[\s\S]*?<\/td>/gi) || []);
  if (cells.length < 3) return null;
  const plain = cells.map(stripHtml);
  const dateIndex = plain.findIndex((value) => /\b20(?:26|27)\b/.test(value));
  if (dateIndex < 1) return null;

  const tournamentCell = cells[dateIndex - 1];
  const link = tournamentCell.match(/href="(\/ageofempires\/[^"#?]+)"/i);
  const title = stripHtml(tournamentCell);
  const dates = parseDateRange(plain[dateIndex]);
  if (!title || !dates) return null;

  const prize = plain.slice(dateIndex + 1).find((value) => /[$€£]|USD|EUR/i.test(value)) || "";
  const location = plain.slice(dateIndex + 1).find((value) => value && value !== prize && value.length < 48 && !/^\d+$/.test(value)) || "";
  const tier = plain.slice(0, Math.max(1, dateIndex - 1)).find((value) => /^(S|A|B|C)(?:-Tier)?$/i.test(value)) || "AOE2";

  return {
    title: truncate(title, 100),
    url: link ? "https://liquipedia.net" + decodeEntities(link[1]) : "https://liquipedia.net/ageofempires/Age_of_Empires_II/Tournaments/2026-27",
    tier,
    dateLabel: plain[dateIndex],
    startDate: dates.start,
    endDate: dates.end,
    prize,
    location
  };
}

function parseDateRange(value) {
  const text = String(value || "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const range = text.match(/([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*(?:([A-Za-z]{3,9})\s+)?(\d{1,2}),?\s+(20\d{2})/);
  if (range) {
    const endMonth = range[3] || range[1];
    return {
      start: safeDate(range[1] + " " + range[2] + ", " + range[5]),
      end: safeDate(endMonth + " " + range[4] + ", " + range[5], true)
    };
  }
  const single = text.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(20\d{2})/);
  if (!single) return null;
  const date = safeDate(single[1] + " " + single[2] + ", " + single[3]);
  return { start: date, end: date };
}

async function createWeeklyBrief(data) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return "";
  const requestedModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const allowedModels = new Set(["deepseek-chat", "deepseek-reasoner", "deepseek-v4-flash", "deepseek-v4-pro"]);
  const model = allowedModels.has(requestedModel) ? requestedModel : "deepseek-chat";
  const language = data.locale === "es" ? "Spanish" : data.locale === "pt-BR" ? "Brazilian Portuguese" : "English";

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 260,
      messages: [
        {
          role: "system",
          content: "You are the editor of an Age of Empires II weekly briefing. Write in " + language + ". Use only the supplied source records. Never invent a date, result, prize, event, or recommendation. Write one energetic paragraph of 90-140 words. Mention the most relevant current tournament, one official story when present, and two creator videos by title or channel. Do not use markdown headings."
        },
        {
          role: "user",
          content: JSON.stringify({
            week: data.week,
            tournaments: data.tournaments.slice(0, 5),
            officialNews: data.news.slice(0, 4),
            videos: data.videos.slice(0, 6)
          })
        }
      ]
    }),
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error("DeepSeek weekly brief failed");
  const payload = await response.json();
  return String(payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content || "").trim();
}

async function fetchText(url, headers) {
  const response = await fetch(url, { headers: headers || {}, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Source failed with " + response.status);
  return response.text();
}

function xmlValue(block, tag) {
  const escaped = tag.replace(":", "\\:");
  const match = block.match(new RegExp("<" + escaped + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + escaped + ">", "i"));
  return match ? decodeEntities(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()) : "";
}

function stripHtml(value) {
  return decodeEntities(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return String(value || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1].toLowerCase() === "x";
      const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return Object.prototype.hasOwnProperty.call(named, entity.toLowerCase()) ? named[entity.toLowerCase()] : match;
  });
}

function safeDate(value, endOfDay) {
  const date = new Date(value + " UTC");
  if (Number.isNaN(date.getTime())) return "";
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function truncate(value, max) {
  const clean = String(value || "").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

function fulfilled(result, fallback) {
  return result && result.status === "fulfilled" ? result.value : fallback;
}

function fallbackBrief(locale, tournamentCount, newsCount, videoCount) {
  if (locale === "es") return "El radar semanal reunió " + tournamentCount + " torneos vigentes, " + newsCount + " noticias oficiales y " + videoCount + " videos recientes. Abre cada tarjeta para confirmar fechas y detalles directamente en la fuente. El resumen editorial con IA volverá cuando DeepSeek esté disponible; mientras tanto, los enlaces verificados siguen listos para explorar.";
  if (locale === "pt-BR") return "O radar semanal reuniu " + tournamentCount + " torneios em andamento, " + newsCount + " notícias oficiais e " + videoCount + " vídeos recentes. Abra cada card para confirmar datas e detalhes diretamente na fonte. O resumo editorial com IA voltará quando o DeepSeek estiver disponível; enquanto isso, os links verificados continuam prontos para explorar.";
  return "The weekly radar collected " + tournamentCount + " active tournaments, " + newsCount + " official stories, and " + videoCount + " recent videos. Open any card to confirm dates and details at the original source. The AI editorial brief will return when DeepSeek is available; the verified links remain ready to explore.";
}

function isoWeek(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - start) / 86400000) + 1) / 7);
  return target.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}
