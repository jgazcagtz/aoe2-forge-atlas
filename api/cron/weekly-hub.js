module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.CRON_SECRET;
  const fromVercelCron = req.headers["x-vercel-cron"] === "1";
  const hasBearer = req.headers.authorization === "Bearer " + expected;
  if (!expected || (!fromVercelCron && !hasBearer)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const week = isoWeek(new Date());
  const host = req.headers.host;
  const protocol = host && host.includes("localhost") ? "http" : "https";
  const locales = ["en", "es", "pt-BR"];
  const results = await Promise.allSettled(locales.map(async (locale) => {
    const response = await fetch(protocol + "://" + host + "/api/hub?locale=" + encodeURIComponent(locale) + "&week=" + week, {
      headers: { "User-Agent": "Vercel Cron - Forge Atlas weekly prewarm" },
      signal: AbortSignal.timeout(25000)
    });
    return { locale, status: response.status, ok: response.ok };
  }));

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: results.every((result) => result.status === "fulfilled" && result.value.ok),
    week,
    locales: results.map((result, index) => result.status === "fulfilled" ? result.value : { locale: locales[index], ok: false })
  });
};

function isoWeek(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - start) / 86400000) + 1) / 7);
  return target.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}
