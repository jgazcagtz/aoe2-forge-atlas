(function () {
  "use strict";

  var locale = window.ForgeI18n ? window.ForgeI18n.locale : "en";
  var languageTag = locale === "pt-BR" ? "pt-BR" : locale;
  var loaded = false;
  var loading = false;

  var copy = {
    en: {
      loading: "Collecting this week's AOE2 signals...",
      error: "The live sources are taking a break. Try again in a moment.",
      emptyTournaments: "No current tournaments were returned by the source.",
      emptyNews: "No recent official AOE2 stories were returned.",
      emptyVideos: "No recent videos were returned.",
      source: "Open source",
      watch: "Watch video",
      refresh: "Refresh",
      refreshed: "Updated {date}",
      sources: "{count} live sources",
      prize: "Prize",
      location: "Location"
    },
    es: {
      loading: "Reuniendo las señales de AOE2 de esta semana...",
      error: "Las fuentes en vivo están tardando. Inténtalo de nuevo en un momento.",
      emptyTournaments: "La fuente no devolvió torneos actuales.",
      emptyNews: "No se encontraron noticias oficiales recientes de AOE2.",
      emptyVideos: "No se encontraron videos recientes.",
      source: "Abrir fuente",
      watch: "Ver video",
      refresh: "Actualizar",
      refreshed: "Actualizado {date}",
      sources: "{count} fuentes en vivo",
      prize: "Premio",
      location: "Sede"
    },
    "pt-BR": {
      loading: "Reunindo os sinais de AOE2 desta semana...",
      error: "As fontes ao vivo estão demorando. Tente novamente em instantes.",
      emptyTournaments: "A fonte não retornou torneios atuais.",
      emptyNews: "Nenhuma notícia oficial recente de AOE2 foi encontrada.",
      emptyVideos: "Nenhum vídeo recente foi encontrado.",
      source: "Abrir fonte",
      watch: "Ver vídeo",
      refresh: "Atualizar",
      refreshed: "Atualizado em {date}",
      sources: "{count} fontes ao vivo",
      prize: "Premiação",
      location: "Local"
    }
  }[locale] || null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    var refresh = document.querySelector("[data-hub-refresh], #hub-refresh, #refresh-hub, .hub-actions button");
    if (refresh) {
      refresh.addEventListener("click", function () { loadHub(true); });
      if (!refresh.textContent.trim()) refresh.textContent = copy.refresh;
    }

    document.addEventListener("click", function (event) {
      var target = event.target.closest('[data-view-target="hub"]');
      if (target) window.setTimeout(function () { loadHub(false); }, 40);
    });

    if (window.location.hash === "#hub") loadHub(false);
    else window.setTimeout(function () { loadHub(false); }, 250);
  }

  async function loadHub(force) {
    if (loading || (loaded && !force)) return;
    loading = true;
    setStatus(copy.loading, true);

    try {
      var week = getIsoWeek(new Date());
      var response = await fetch("/api/hub?locale=" + encodeURIComponent(locale) + "&week=" + encodeURIComponent(week) + (force ? "&refresh=1" : ""));
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(payload.error || "Hub unavailable");
      renderHub(payload);
      loaded = true;
    } catch (error) {
      setStatus(copy.error, false);
      renderEmpty(".tournament-grid", copy.emptyTournaments);
      renderEmpty(".news-grid", copy.emptyNews);
      renderEmpty(".video-grid", copy.emptyVideos);
    } finally {
      loading = false;
    }
  }

  function renderHub(payload) {
    var date = formatDate(payload.generatedAt || new Date().toISOString(), true);
    setStatus(format(copy.refreshed, { date: date }), false);
    setText("[data-hub-week], #hub-week-label", payload.weekLabel || getIsoWeek(new Date()));
    setText("[data-hub-source-count], #hub-source-count", format(copy.sources, { count: payload.sourceCount || 0 }));

    var brief = document.querySelector("[data-weekly-brief], #weekly-brief, .weekly-brief-card p");
    if (brief) brief.textContent = payload.brief || "";

    renderTournaments(payload.tournaments || []);
    renderNews(payload.news || []);
    renderVideos(payload.videos || []);
  }

  function renderTournaments(items) {
    var grid = document.querySelector(".tournament-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items.length) return appendEmpty(grid, copy.emptyTournaments);

    items.forEach(function (item) {
      var card = el("article", "hub-card tournament-card");
      var top = el("div", "hub-card-top");
      top.appendChild(el("span", "hub-chip", item.tier || item.status || "AOE2"));
      top.appendChild(el("time", "hub-card-date", item.dateLabel || formatDate(item.startDate)));
      card.appendChild(top);
      card.appendChild(el("h3", "", item.title));

      var details = el("div", "hub-facts");
      if (item.prize) details.appendChild(fact(copy.prize, item.prize));
      if (item.location) details.appendChild(fact(copy.location, item.location));
      card.appendChild(details);
      card.appendChild(sourceLink(item.url, copy.source));
      grid.appendChild(card);
    });
  }

  function renderNews(items) {
    var grid = document.querySelector(".news-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items.length) return appendEmpty(grid, copy.emptyNews);

    items.forEach(function (item) {
      var card = el("article", "hub-card news-card");
      card.appendChild(el("time", "hub-card-date", formatDate(item.publishedAt)));
      card.appendChild(el("h3", "", item.title));
      if (item.excerpt) card.appendChild(el("p", "", item.excerpt));
      card.appendChild(sourceLink(item.url, copy.source));
      grid.appendChild(card);
    });
  }

  function renderVideos(items) {
    var grid = document.querySelector(".video-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items.length) return appendEmpty(grid, copy.emptyVideos);

    items.forEach(function (item) {
      var card = el("article", "hub-card video-card");
      var imageLink = sourceLink(item.url, "");
      imageLink.className = "video-thumb";
      var image = document.createElement("img");
      image.src = item.thumbnail;
      image.alt = "";
      image.loading = "lazy";
      image.width = 480;
      image.height = 270;
      imageLink.appendChild(image);
      imageLink.appendChild(el("span", "play-mark", "Play"));
      card.appendChild(imageLink);
      card.appendChild(el("span", "video-channel", item.channel));
      card.appendChild(el("h3", "", item.title));
      card.appendChild(el("time", "hub-card-date", formatDate(item.publishedAt)));
      card.appendChild(sourceLink(item.url, copy.watch));
      grid.appendChild(card);
    });
  }

  function fact(label, value) {
    var node = el("span", "hub-fact");
    node.appendChild(el("small", "", label));
    node.appendChild(el("strong", "", value));
    return node;
  }

  function sourceLink(url, label) {
    var link = el("a", "hub-source-link", label);
    link.href = url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function setStatus(message, busy) {
    var node = document.querySelector("[data-hub-status], #hub-status, .hub-status");
    if (!node) return;
    node.textContent = message;
    node.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function renderEmpty(selector, message) {
    var node = document.querySelector(selector);
    if (!node) return;
    node.innerHTML = "";
    appendEmpty(node, message);
  }

  function appendEmpty(node, message) {
    node.appendChild(el("p", "hub-empty", message));
  }

  function setText(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function formatDate(value, includeTime) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return new Intl.DateTimeFormat(languageTag, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: includeTime ? "numeric" : undefined,
      minute: includeTime ? "2-digit" : undefined
    }).format(date);
  }

  function getIsoWeek(date) {
    var target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    var week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    return target.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function format(template, values) {
    return Object.keys(values).reduce(function (result, key) {
      return result.replace(new RegExp("\\{" + key + "\\}", "g"), String(values[key]));
    }, template);
  }
})();
