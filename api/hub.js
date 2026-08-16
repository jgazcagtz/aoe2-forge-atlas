const OFFICIAL_FEED = "https://www.ageofempires.com/news/feed/";
const LIQUIPEDIA_PAGES = [
  "https://liquipedia.net/ageofempires/api.php?action=parse&page=Age_of_Empires_II%2FTournaments%2F2026-27&prop=text&format=json",
  "https://liquipedia.net/ageofempires/api.php?action=parse&page=Age_of_Empires_II%2FTournaments%2F2027-28&prop=text&format=json"
];
const ALLOWED_LOCALES = new Set(["en", "es", "pt-BR"]);
const AOE2_TERMS = /age of empires ii|age ii|aoe ?2|definitive edition|victors and vanquished|chronicles|return of rome|emperors|age of empires/i;
const LANGUAGES = {
  en: "English",
  es: "Spanish",
  "pt-BR": "Brazilian Portuguese"
};
const SAFE_MODELS = new Set(["deepseek-chat", "deepseek-reasoner", "deepseek-v4-flash", "deepseek-v4-pro"]);

const SOURCE_TIMEOUT_MS = safeInt(process.env.AOE2_SOURCE_TIMEOUT_MS, 13000, 3000, 24000);
const DEEPSEEK_TIMEOUT_MS = safeInt(process.env.DEEPSEEK_TIMEOUT_MS, 19000, 5000, 28000);
const DEEPSEEK_MAX_TOKENS = safeInt(process.env.DEEPSEEK_MAX_TOKENS, 420, 120, 1200);
const DEEPSEEK_TEMPERATURE = clamp(Number(process.env.DEEPSEEK_TEMPERATURE), 0, 1, 0.25);
const WEEKLY_CACHE_TTL_MS = safeInt(process.env.HUB_CACHE_TTL_MS, 10800000, 900000, 86400000);
const MAX_VIDEO_PER_CHANNEL = safeInt(process.env.AOE2_VIDEO_PER_CHANNEL, 5, 1, 8);
const MAX_REDDIT_PER_CHANNEL = safeInt(process.env.AOE2_REDDIT_PER_CHANNEL, 10, 4, 16);
const MAX_WEBSITE_RECORDS = safeInt(process.env.AOE2_WEB_RECORD_LIMIT, 8, 4, 12);
const MAX_SOURCE_ERROR_TEXT = 120;
const MAX_SOURCE_RESULTS = safeInt(process.env.AOE2_SOURCE_COUNT_LIMIT, 12, 6, 20);

const LOCALE_PROFILES = {
  en: {
    youtube: [
      { name: "Age of Empires", id: "UCidjrp1fZd8TehYD2eYYPvg", tone: "Official", channelUrl: "https://www.youtube.com/channel/UCidjrp1fZd8TehYD2eYYPvg" },
      { name: "T90Official", id: "UCZUT79WUUpZlZ-XMF7l4CFg", tone: "creator", channelUrl: "https://www.youtube.com/channel/UCZUT79WUUpZlZ-XMF7l4CFg" },
      { name: "Hera", id: "UCeqc9aYVAZcRQq9Ey0x26AQ", tone: "creator", channelUrl: "https://www.youtube.com/channel/UCeqc9aYVAZcRQq9Ey0x26AQ" },
      { name: "Spirit of the Law", id: "UChzLZJo-SxuPHz-oYKAIC_g", tone: "creator", channelUrl: "https://www.youtube.com/channel/UChzLZJo-SxuPHz-oYKAIC_g" },
      { name: "MembTV", id: "UCZWm0WjyGzP6CEtm22zVvCQ", tone: "creator", channelUrl: "https://www.youtube.com/channel/UCZWm0WjyGzP6CEtm22zVvCQ" },
      { name: "Mario Ovalle", id: "UCFcYXw_MXaalvq9KbdpV3SA", tone: "creator", channelUrl: "https://www.youtube.com/channel/UCFcYXw_MXaalvq9KbdpV3SA" },
      { name: "Nacho AoE", channelUrl: "https://www.youtube.com/@NachoAoE", tone: "creator", user: "NachoAoE" }
    ],
    reddit: [
      { name: "r/ageofempires", url: "https://www.reddit.com/r/ageofempires.rss" },
      { name: "AoE2 Reddit", url: "https://www.reddit.com/r/aoe2.rss" },
      { name: "AOE2TV Reddit", url: "https://www.reddit.com/r/aoe2tv.rss" }
    ]
  },
  es: {
    youtube: [
      { name: "Age of Empires", id: "UCidjrp1fZd8TehYD2eYYPvg", tone: "Canal base", channelUrl: "https://www.youtube.com/channel/UCidjrp1fZd8TehYD2eYYPvg" },
      { name: "Mario Ovalle", id: "UCFcYXw_MXaalvq9KbdpV3SA", tone: "Creador", channelUrl: "https://www.youtube.com/channel/UCFcYXw_MXaalvq9KbdpV3SA" },
      { name: "MembTV", id: "UCZWm0WjyGzP6CEtm22zVvCQ", tone: "Creador", channelUrl: "https://www.youtube.com/channel/UCZWm0WjyGzP6CEtm22zVvCQ" },
      { name: "Nacho AoE", channelUrl: "https://www.youtube.com/@NachoAoE", tone: "Creador comunitario", user: "NachoAoE" }
    ],
    reddit: [
      { name: "r/ageofempires", url: "https://www.reddit.com/r/ageofempires.rss" },
      { name: "r/aoe2", url: "https://www.reddit.com/r/aoe2.rss" }
    ]
  },
  "pt-BR": {
    youtube: [
      { name: "Age of Empires", id: "UCidjrp1fZd8TehYD2eYYPvg", tone: "Canal base", channelUrl: "https://www.youtube.com/channel/UCidjrp1fZd8TehYD2eYYPvg" },
      { name: "MembTV", id: "UCZWm0WjyGzP6CEtm22zVvCQ", tone: "Criador PT", channelUrl: "https://www.youtube.com/channel/UCZWm0WjyGzP6CEtm22zVvCQ" },
      { name: "Mario Ovalle", id: "UCFcYXw_MXaalvq9KbdpV3SA", tone: "Criador", channelUrl: "https://www.youtube.com/channel/UCFcYXw_MXaalvq9KbdpV3SA" },
      { name: "Nacho AoE", channelUrl: "https://www.youtube.com/@NachoAoE", tone: "Criador", user: "NachoAoE" }
    ],
    reddit: [
      { name: "r/ageofempires", url: "https://www.reddit.com/r/ageofempires.rss" },
      { name: "r/aoe2", url: "https://www.reddit.com/r/aoe2.rss" }
    ]
  }
};

const HUB_CACHE = new Map();

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ code: "method_not_allowed", message: "Use GET for the weekly hub signal." });
  }

  const locale = sanitizeLocale(req.query.locale);
  const week = sanitizeWeek(req.query.week) || isoWeek(new Date());
  const force = String(req.query.refresh) === "1" || String(req.query.refresh).toLowerCase() === "true";
  const cacheKey = locale + "::" + week;
  const cached = !force ? getCachedPayload(cacheKey) : null;
  const profile = LOCALE_PROFILES[locale] || LOCALE_PROFILES.en;

  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=172800");
  if (cached) {
    return res.status(200).json(Object.assign({}, cached, { cached: true }));
  }

  const [newsPayload, tournamentPayload, videoPayload, redditPayload] = await Promise.all([
    collectSource({
      name: "Age of Empires Official News",
      type: "official",
      url: OFFICIAL_FEED,
      fetcher: getOfficialNews
    }),
    collectSource({
      name: "Liquipedia Tournaments",
      type: "official",
      url: "https://liquipedia.net/ageofempires/Age_of_Empires_II/Tournaments",
      fetcher: getTournaments
    }),
    collectVideos(profile.youtube),
    collectReddit(profile.reddit)
  ]);

  const news = newsPayload.records || [];
  const tournaments = tournamentPayload.records || [];
  const videos = videoPayload.records || [];
  const reddit = redditPayload.records || [];
  const sourcePayloads = dedupeSources([
    newsPayload.source,
    tournamentPayload.source,
    videoPayload.source,
    redditPayload.source,
    ...(videoPayload.sources || []),
    ...(redditPayload.sources || [])
  ]).slice(0, MAX_SOURCE_RESULTS);
  const sourceCount = sourcePayloads.filter(function (source) { return source.status === "ok"; }).length;

  let brief = "";
  let aiPowered = false;
  try {
    brief = await createWeeklyBrief({
      locale,
      week,
      tournaments: tournaments.slice(0, 6),
      news: news.slice(0, 6),
      videos: videos.slice(0, 8),
      reddit: reddit.slice(0, 6),
      sources: sourcePayloads
    });
    aiPowered = brief.length > 0;
  } catch (error) {
    brief = "";
  }

  if (!brief) {
    brief = fallbackBrief(locale, tournaments.length, news.length, videos.length, reddit.length);
  }

  const payload = {
    locale,
    week,
    weekLabel: weekLabelFromIsoWeek(week),
    generatedAt: new Date().toISOString(),
    brief: brief,
    aiPowered,
    sourceCount,
    sourceCountTotal: sourcePayloads.length,
    sources: sourcePayloads,
    tournaments,
    news,
    videos,
    reddit
  };
  setCachedPayload(cacheKey, payload);
  return res.status(200).json(payload);
};

async function collectSource(entry) {
  try {
    const records = await entry.fetcher();
    return {
      source: {
        name: entry.name,
        type: entry.type,
        url: entry.url,
        status: "ok",
        count: records.length,
        locale: entry.locale || "global"
      },
      records
    };
  } catch (error) {
    return {
      source: {
        name: entry.name,
        type: entry.type,
        url: entry.url,
        status: "degraded",
        count: 0,
        locale: entry.locale || "global",
        error: truncate(String(error && error.message || "source unavailable"), MAX_SOURCE_ERROR_TEXT)
      },
      records: []
    };
  }
}

async function getOfficialNews() {
  const xml = await fetchText(OFFICIAL_FEED, {
    Accept: "application/rss+xml, application/xml",
    "User-Agent": "Forge Atlas Weekly Hub"
  });
  const recent = Date.now() - (120 * 86400000);
  return (xml.match(/<item[\s\S]*?<\/item>/gi) || [])
    .map(function (item) {
      return {
        title: xmlValue(item, "title"),
        url: safeUrl(xmlValue(item, "link"), ""),
        publishedAt: toIso(xmlValue(item, "pubDate")),
        excerpt: truncate(stripHtml(xmlValue(item, "description")), 210),
        source: "Age of Empires News",
        sourceUrl: OFFICIAL_FEED
      };
    })
    .filter(function (item) { return item.title && item.url && AOE2_TERMS.test(item.title + " " + item.excerpt); })
    .filter(function (item) { return !item.publishedAt || Date.parse(item.publishedAt) >= recent; })
    .slice(0, 6);
}

async function getTournaments() {
  const now = Date.now();
  const earliest = now - (7 * 86400000);
  const latest = now + (365 * 86400000);
  let parsed = [];

  for (let i = 0; i < LIQUIPEDIA_PAGES.length; i += 1) {
    try {
      const payload = JSON.parse(await fetchText(LIQUIPEDIA_PAGES[i], {
        Accept: "application/json",
        "User-Agent": "Forge Atlas Weekly Hub"
      }));
      const html = payload && payload.parse && payload.parse.text && payload.parse.text["*"];
      if (!html) {
        continue;
      }

      const rows = html.match(/<tr[^>]*class="[^"]*table2-row--body[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || [];
      const mapped = rows.map(parseTournamentRow).filter(Boolean)
        .filter(function (item) {
          return isTournamentInRange(item, earliest, latest);
        })
        .map(function (item) {
          return Object.assign({}, item, {
            source: "Liquipedia Tournaments",
            sourceUrl: "https://liquipedia.net/ageofempires/Age_of_Empires_II/Tournaments"
          });
        });
      if (mapped.length) {
        parsed = mapped;
        break;
      }
    } catch (error) {
      // try next page
    }
  }

  parsed = parsed
    .sort(function (a, b) { return Date.parse(a.startDate) - Date.parse(b.startDate); })
    .slice(0, 10);

  if (!parsed.length) throw new Error("No tournament data");
  return parsed;
}

function isTournamentInRange(item, earliest, latest) {
  const startTime = Date.parse(item.startDate);
  const endTime = Date.parse(item.endDate);
  if (!Number.isFinite(startTime) && !Number.isFinite(endTime)) {
    return true;
  }
  const visibleStart = Number.isFinite(startTime) ? startTime : endTime;
  const visibleEnd = Number.isFinite(endTime) ? endTime : startTime;
  return visibleEnd >= earliest && visibleStart <= latest;
}

async function collectVideos(channels) {
  const results = await Promise.all(channels.map(collectChannelVideos));
  const sourceStates = [];
  const videos = dedupeByUrl(results.flatMap(function (result) { return result.videos || []; }));

  results.forEach(function (result, index) {
    const channel = channels[index] || {};
    sourceStates.push({
      name: channel.name || "YouTube channel",
      type: "youtube",
      url: channel.channelUrl || youtubeChannelUrl(channel),
      status: result.status,
      count: result.count || 0,
      error: result.error || "",
      tone: channel.tone || ""
    });
  });

  return {
    source: {
      name: "YouTube creators",
      type: "youtube",
      url: "https://www.youtube.com/",
      status: videos.length ? "ok" : "degraded",
      count: videos.length,
      locale: "global"
    },
    records: videos.slice(0, MAX_WEBSITE_RECORDS),
    sources: sourceStates
  };
}

async function collectChannelVideos(channel) {
  const url = youtubeChannelUrl(channel);
  try {
    const xml = await fetchText(url, {
      Accept: "application/atom+xml, application/xml",
      "User-Agent": "Forge Atlas Weekly Hub"
    });
    const items = parseYouTubeEntries(xml, channel).slice(0, MAX_VIDEO_PER_CHANNEL);
    return { status: "ok", count: items.length, videos: items };
  } catch (error) {
    return { status: "degraded", count: 0, videos: [], error: truncate(String(error && error.message || "source unavailable"), MAX_SOURCE_ERROR_TEXT) };
  }
}

function parseYouTubeEntries(xml, channel) {
  return (xml.match(/<entry[\s\S]*?<\/entry>/gi) || []).map(function (entry) {
    const videoId = xmlValue(entry, "yt:videoId") || "";
    const rawTitle = xmlValue(entry, "title");
    const parsedTitle = stripHtml(rawTitle);
    const url = safeUrl(videoId ? "https://www.youtube.com/watch?v=" + videoId : "", "");
    return {
      title: parsedTitle,
      url: url,
      thumbnail: videoId ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : "",
      channel: channel && (channel.name || "YouTube"),
      source: channel && (channel.name || "YouTube"),
      sourceUrl: youtubeChannelUrl(channel),
      publishedAt: toIso(xmlValue(entry, "published"))
    };
  }).filter(function (item) {
    return item.title && item.url && (item.channel === "Age of Empires" || AOE2_TERMS.test(item.title));
  });
}

async function collectReddit(feeds) {
  const results = await Promise.all(feeds.map(collectRedditFeed));
  const sourceStates = [];
  const redditEntries = dedupeByUrl(results.flatMap(function (result) { return result.items || []; }));

  results.forEach(function (result, index) {
    const feed = feeds[index] || {};
    sourceStates.push({
      name: feed.name || "Reddit",
      type: "reddit",
      url: feed.url || "https://www.reddit.com/r/ageofempires/",
      status: result.status,
      count: result.count || 0,
      error: result.error || ""
    });
  });

  return {
    source: {
      name: "Reddit community",
      type: "reddit",
      url: "https://www.reddit.com/r/ageofempires/",
      status: redditEntries.length ? "ok" : "degraded",
      count: redditEntries.length,
      locale: "global"
    },
    records: redditEntries.slice(0, MAX_WEBSITE_RECORDS),
    sources: sourceStates
  };
}

async function collectRedditFeed(feed) {
  try {
    const xml = await fetchText(feed.url, {
      Accept: "application/atom+xml, application/xml",
      "User-Agent": "Mozilla/5.0 (compatible; Forge-Atlas/1.0; +https://aoe2-forge-atlas.vercel.app)"
    });
    const items = parseRedditEntries(xml, feed.name).slice(0, MAX_REDDIT_PER_CHANNEL);
    return { status: "ok", count: items.length, items: items };
  } catch (error) {
    return { status: "degraded", count: 0, items: [], error: truncate(String(error && error.message || "source unavailable"), MAX_SOURCE_ERROR_TEXT) };
  }
}

function parseRedditEntries(xml, sourceName) {
  return (xml.match(/<entry[\s\S]*?<\/entry>/gi) || []).map(function (entry) {
    return {
      title: stripHtml(xmlValue(entry, "title")),
      url: safeUrl(xmlAttribute(entry, "link", "href"), ""),
      publishedAt: toIso(xmlValue(entry, "published") || xmlValue(entry, "updated")),
      excerpt: truncate(stripHtml(xmlValue(entry, "summary")), 170),
      channel: sourceName || "Reddit",
      source: sourceName || "Reddit",
      sourceUrl: "https://www.reddit.com/r/ageofempires/"
    };
  }).filter(function (item) {
    return item.title && item.url && AOE2_TERMS.test(item.title + " " + item.excerpt);
  });
}

async function createWeeklyBrief(data) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return "";

  const requestedModel = process.env.DEEPSEEK_MODEL;
  const model = SAFE_MODELS.has(requestedModel) ? requestedModel : "deepseek-v4-flash";
  const language = LANGUAGES[data.locale] || "English";
  const payloadSources = (data.sources || [])
    .filter(function (source) { return source.status === "ok" && source.count > 0; })
    .map(function (source) { return source.name + " (" + source.count + ")"; })
    .slice(0, 10);
  const body = JSON.stringify({
    week: data.week,
    sources: payloadSources,
    tournaments: compactRecords(data.tournaments),
    officialNews: compactRecords(data.news),
    videos: compactRecords(data.videos),
    reddit: compactRecords(data.reddit)
  });

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    body: JSON.stringify({
      model: model,
      temperature: DEEPSEEK_TEMPERATURE,
      max_tokens: DEEPSEEK_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content:
            "You are the editor of a weekly competitive-week newsletter for Age of Empires II. " +
            "Use ONLY the supplied source payload. " +
            "If a statement is not present in source payload, say 'No confirmed source here'. " +
            "Never claim patch certainty unless it is in supplied source payload. " +
            "Write in " + language + ". " +
            "Keep it to 130-180 words with one actionable recommendation and one tactical takeaway. " +
            "No markdown headings. Use concise bullets when helpful."
        },
        {
          role: "user",
          content: body
        }
      ]
    })
  });

  if (!response.ok) throw new Error("DeepSeek weekly brief failed");
  const payload = await response.json();
  return String((payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content) || "").trim();
}

async function fetchText(url, headers) {
  const response = await fetch(url, {
    headers: headers || {},
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error("Source failed with " + response.status);
  }
  return response.text();
}

function parseTournamentRow(row) {
  const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
  if (cells.length < 3) return null;
  const plain = cells.map(stripHtml);
  const dateIndex = plain.findIndex(function (value) { return /\b20(?:[2-9][0-9]{2})\b/.test(value); });
  if (dateIndex < 1) return null;

  const tournamentCell = cells[dateIndex - 1];
  const link = tournamentCell.match(/href="(\/ageofempires\/[^"#?]+)"/i);
  const title = stripHtml(tournamentCell);
  const dates = parseDateRange(plain[dateIndex]);
  if (!title || !dates) return null;

  const prize = plain.slice(dateIndex + 1).find(function (value) { return /[$€£]|USD|EUR/i.test(value); }) || "";
  const location = plain.slice(dateIndex + 1).find(function (value) {
    return value && value !== prize && value.length < 48 && !/^\d+$/.test(value);
  }) || "";
  const tier = plain.slice(0, Math.max(1, dateIndex - 1)).find(function (value) {
    return /^(S|A|B|C)(?:-Tier)?$/i.test(value);
  }) || "AOE2";

  const details = {
    title: truncate(title, 115),
    url: link ? "https://liquipedia.net" + decodeEntities(link[1]) : "https://liquipedia.net/ageofempires/Age_of_Empires_II/Tournaments",
    tier,
    dateLabel: plain[dateIndex],
    startDate: dates.start,
    endDate: dates.end,
    prize,
    location
  };
  return details;
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

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter(function (item) {
    if (!item || !item.url) return false;
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function dedupeSources(sources) {
  const seen = new Set();
  return (sources || []).filter(Boolean).filter(function (source) {
    const key = (source.name || "") + "::" + (source.url || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactRecords(records) {
  return (records || []).slice(0, 6).map(function (record) {
    return {
      title: record.title || "",
      source: record.source || record.channel || "",
      date: record.publishedAt || record.startDate || "",
      excerpt: record.excerpt || record.dateLabel || ""
    };
  });
}

function weekLabelFromIsoWeek(week) {
  if (!week || !/^\d{4}-W\d{2}$/.test(week)) {
    return "";
  }
  const parts = week.split("-W");
  return "Week " + week;
}

function sanitizeLocale(value) {
  return ALLOWED_LOCALES.has(value) ? value : "en";
}

function sanitizeWeek(value) {
  return value && /^\d{4}-W\d{2}$/.test(String(value)) ? String(value) : "";
}

function fallbackBrief(locale, tournamentCount, newsCount, videoCount, redditCount) {
  if (locale === "es") {
    return "El radar semanal reunió " + tournamentCount + " torneos, " + newsCount +
      " noticias oficiales, " + videoCount + " videos y " + redditCount + " hilos comunitarios. Abre cada tarjeta para verificar fechas y detalles en su fuente original. La IA vuelve cuando DeepSeek esté disponible.";
  }
  if (locale === "pt-BR") {
    return "O radar semanal reuniu " + tournamentCount + " torneios, " + newsCount +
      " notícias oficiais, " + videoCount + " vídeos e " + redditCount + " tópicos da comunidade. Abra cada card para conferir datas e detalhes diretamente na fonte. O resumo de IA volta quando o DeepSeek estiver disponível.";
  }
  return "The weekly radar collected " + tournamentCount + " active tournaments, " + newsCount +
    " official stories, " + videoCount + " fresh videos, and " + redditCount +
    " Reddit community threads. Open each card to confirm dates and details directly from each source. The AI weekly summary returns when DeepSeek is available.";
}

function youtubeChannelUrl(channel) {
  if (!channel) return "https://www.youtube.com/";
  if (channel.channelId) return "https://www.youtube.com/feeds/videos.xml?channel_id=" + encodeURIComponent(channel.channelId);
  if (channel.id) return "https://www.youtube.com/feeds/videos.xml?channel_id=" + encodeURIComponent(channel.id);
  if (channel.user) return "https://www.youtube.com/feeds/videos.xml?user=" + encodeURIComponent(channel.user);
  return "https://www.youtube.com/feeds/videos.xml?channel_id=";
}

function getCachedPayload(key) {
  const cached = HUB_CACHE.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    HUB_CACHE.delete(key);
    return null;
  }
  return cached.payload;
}

function setCachedPayload(key, payload) {
  if (HUB_CACHE.size > 80) {
    HUB_CACHE.clear();
  }
  HUB_CACHE.set(key, {
    payload: payload,
    expiresAt: Date.now() + WEEKLY_CACHE_TTL_MS
  });
}

function xmlValue(block, tag) {
  const escaped = tag.replace(":", "\\:");
  const match = block.match(new RegExp("<" + escaped + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + escaped + ">", "i"));
  return match ? decodeEntities(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()) : "";
}

function xmlAttribute(block, tag, attribute) {
  const escaped = tag.replace(":", "\\:");
  const match = block.match(new RegExp("<" + escaped + "[^>]*\\b" + attribute + '="([^"]+)"[^>]*>', "i"));
  return match ? match[1] : "";
}

function stripHtml(value) {
  return decodeEntities(String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return String(value || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (_, entity) {
    if (entity[0] === "#") {
      const isHex = entity[1].toLowerCase() === "x";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    return Object.prototype.hasOwnProperty.call(named, entity.toLowerCase()) ? named[entity.toLowerCase()] : _;
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

function safeUrl(value, fallback) {
  try {
    const parsed = new URL(String(value || ""));
    if (!/^https?:$/.test(parsed.protocol)) {
      return fallback || "";
    }
    return parsed.toString();
  } catch (error) {
    return fallback || "";
  }
}

function truncate(value, max) {
  const clean = String(value || "").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function safeInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return clamp(parsed, min, max, fallback);
}

function isoWeek(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - start) / 86400000) + 1) / 7);
  return target.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}
