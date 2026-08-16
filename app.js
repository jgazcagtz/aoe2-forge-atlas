(function () {
  "use strict";

  var FREE_DAILY_LIMIT = 6;
  var VISUALS = [
    "./assets/media/medieval-world-map.jpg",
    "./assets/media/illuminated-manuscript.jpg",
    "./assets/media/constantinople-map.png"
  ];
  var TYPE_LABELS = {
    civilizations: "Civilization",
    units: "Unit",
    buildings: "Building",
    technologies: "Technology"
  };
  var COLLECTION_KEYS = {
    civilizations: ["civs", "civilizations"],
    units: ["units"],
    buildings: ["buildings"],
    technologies: ["techs", "technologies"]
  };
  var FACT_LABELS = {
    age: "Available",
    hp: "Hit points",
    attack: "Attack",
    melee_armor: "Melee armor",
    pierce_armor: "Pierce armor",
    range: "Range",
    speed: "Speed",
    reload_time: "Reload",
    line_of_sight: "Line of sight",
    build_time: "Build time",
    train_time: "Train time",
    research_time: "Research time",
    cost: "Cost"
  };

  var state = {
    data: null,
    strings: {},
    entities: {
      civilizations: [],
      units: [],
      buildings: [],
      technologies: []
    },
    view: "discover",
    collection: "units",
    civFavoritesOnly: false,
    databaseFavoritesOnly: false,
    favorites: readSet("forge-atlas-favorites"),
    compare: [],
    activeEntity: null
  };

  var elements = {};
  var toastTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    updateQuota();
    var initialView = window.location.hash.replace("#", "");
    if (document.querySelector('[data-view="' + initialView + '"]')) {
      switchView(initialView, false);
    }
    loadAtlas();
  }

  function cacheElements() {
    elements.civGrid = document.getElementById("civ-grid");
    elements.featuredCivs = document.getElementById("featured-civs");
    elements.databaseGrid = document.getElementById("database-grid");
    elements.civSearch = document.getElementById("civ-search");
    elements.databaseSearch = document.getElementById("database-search");
    elements.civResultCount = document.getElementById("civ-result-count");
    elements.databaseResultCount = document.getElementById("database-result-count");
    elements.searchDialog = document.getElementById("search-dialog");
    elements.detailDialog = document.getElementById("detail-dialog");
    elements.pricingDialog = document.getElementById("pricing-dialog");
    elements.creditsDialog = document.getElementById("credits-dialog");
    elements.globalSearch = document.getElementById("global-search");
    elements.searchResults = document.getElementById("search-results");
    elements.detailContent = document.getElementById("detail-content");
    elements.detailKicker = document.getElementById("detail-kicker");
    elements.compareTray = document.getElementById("compare-tray");
    elements.compareItems = document.getElementById("compare-items");
    elements.compareNow = document.getElementById("compare-now");
    elements.aiForm = document.getElementById("ai-form");
    elements.aiQuestion = document.getElementById("ai-question");
    elements.aiContextLabel = document.getElementById("ai-context-label");
    elements.chatMessages = document.getElementById("chat-messages");
    elements.chatSuggestions = document.getElementById("chat-suggestions");
    elements.quotaText = document.getElementById("quota-text");
    elements.quotaBar = document.getElementById("quota-bar");
    elements.toast = document.getElementById("toast");
  }

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    elements.civSearch.addEventListener("input", renderCivilizations);
    elements.databaseSearch.addEventListener("input", renderDatabase);
    elements.globalSearch.addEventListener("input", function () {
      renderGlobalSearch(elements.globalSearch.value);
    });
    elements.aiForm.addEventListener("submit", handleAiSubmit);
    document.getElementById("search-trigger").addEventListener("click", openSearch);
    document.getElementById("credits-trigger").addEventListener("click", function () {
      openDialog(elements.creditsDialog);
    });
    document.getElementById("clear-compare").addEventListener("click", clearCompare);
    elements.compareNow.addEventListener("click", openComparison);
    document.getElementById("clear-chat").addEventListener("click", resetChat);
    document.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  }

  async function loadAtlas() {
    try {
      var responses = await Promise.all([
        fetch("./data/aoe2-data.json"),
        fetch("./data/aoe2-strings.json")
      ]);
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error("Atlas data could not be loaded.");
      }
      var payloads = await Promise.all([responses[0].json(), responses[1].json()]);
      state.data = payloads[0];
      state.strings = normalizeStrings(payloads[1]);
      buildEntities();
      renderAll();
    } catch (error) {
      var message = "The atlas data is temporarily unavailable. Refresh to try again.";
      elements.featuredCivs.innerHTML = '<p class="empty-state">' + message + "</p>";
      elements.civGrid.innerHTML = '<p class="empty-state">' + message + "</p>";
      elements.databaseGrid.innerHTML = '<p class="empty-state">' + message + "</p>";
      showToast(message);
    }
  }

  function normalizeStrings(raw) {
    if (!raw || typeof raw !== "object") {
      return {};
    }
    if (raw.strings && typeof raw.strings === "object") {
      return raw.strings;
    }
    if (raw.en && typeof raw.en === "object") {
      return raw.en;
    }
    return raw;
  }

  function buildEntities() {
    Object.keys(COLLECTION_KEYS).forEach(function (type) {
      var source = {};
      COLLECTION_KEYS[type].some(function (key) {
        if (state.data && state.data[key]) {
          source = state.data[key];
          return true;
        }
        return false;
      });
      state.entities[type] = normalizeCollection(source, type);
    });
  }

  function normalizeCollection(source, type) {
    if (!source || typeof source !== "object") {
      return [];
    }
    var entries = Array.isArray(source)
      ? source.map(function (item, index) { return [String(index), item]; })
      : Object.entries(source);

    return entries.map(function (entry, index) {
      var key = entry[0];
      var raw = entry[1] || {};
      var nameCandidate = raw.name || raw.Name || raw.internal_name || raw.internalName || key;
      var resolvedName = resolveText(nameCandidate);
      var name = resolvedName && !/^\d+$/.test(resolvedName) ? resolvedName : titleCase(key);
      var description = resolveDescription(raw, type);
      var age = resolveAge(raw.age || raw.Age || raw.age_id);
      var cost = formatCost(raw.cost || raw.Cost);
      var primitiveText = Object.keys(raw).slice(0, 40).map(function (rawKey) {
        var value = raw[rawKey];
        return typeof value === "string" || typeof value === "number" ? resolveText(value) : "";
      }).join(" ");
      return {
        id: String(raw.id || raw.ID || key),
        key: key,
        type: type,
        name: cleanText(name),
        description: description,
        age: age,
        cost: cost,
        raw: raw,
        order: index,
        searchText: cleanText(name + " " + description + " " + primitiveText).toLowerCase()
      };
    }).filter(function (entity) {
      return entity.name && entity.name.toLowerCase() !== "undefined";
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function resolveDescription(raw, type) {
    var candidate = raw.description || raw.Description || raw.helptext || raw.help_text || raw.tooltip || raw.summary;
    var resolved = cleanText(resolveText(candidate));
    if (resolved && !/^\d+$/.test(resolved)) {
      return resolved;
    }
    var bullets = extractBullets(raw);
    if (bullets.length) {
      return bullets.slice(0, 2).join(" ");
    }
    if (type === "civilizations") {
      return "Open the civilization record to inspect its identity, bonuses, and available technology.";
    }
    return "Open this atlas record for available stats, costs, and connected strategy context.";
  }

  function resolveText(value) {
    if (value === null || value === undefined) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(resolveText).filter(Boolean).join(" ");
    }
    if (typeof value === "object") {
      return resolveText(value.text || value.value || value.en || value.name || "");
    }
    var key = String(value);
    var lookedUp = state.strings[key];
    if (lookedUp !== undefined && lookedUp !== value) {
      if (typeof lookedUp === "object") {
        return resolveText(lookedUp);
      }
      return String(lookedUp);
    }
    return key;
  }

  function cleanText(value) {
    var holder = document.createElement("div");
    holder.innerHTML = String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\\n/g, " ")
      .replace(/\{[^}]+\}/g, " ");
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
  }

  function resolveAge(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    if (state.data && state.data.age_names && state.data.age_names[value] !== undefined) {
      return cleanText(resolveText(state.data.age_names[value]));
    }
    var numeric = Number(value);
    var ages = {
      0: "Dark Age",
      1: "Dark Age",
      2: "Feudal Age",
      3: "Castle Age",
      4: "Imperial Age",
      5: "Post-Imperial"
    };
    return ages[numeric] || cleanText(resolveText(value));
  }

  function formatCost(cost) {
    if (!cost) {
      return "";
    }
    if (Array.isArray(cost)) {
      return cost.map(function (item) {
        if (item && typeof item === "object") {
          return Object.keys(item).map(function (key) {
            return titleCase(key) + " " + item[key];
          }).join(" ");
        }
        return String(item);
      }).join(", ");
    }
    if (typeof cost === "object") {
      return Object.keys(cost).filter(function (key) {
        return cost[key] !== null && cost[key] !== undefined && Number(cost[key]) !== 0;
      }).map(function (key) {
        return titleCase(key) + " " + cost[key];
      }).join(" / ");
    }
    return cleanText(resolveText(cost));
  }

  function renderAll() {
    updateCounts();
    renderFeatured();
    renderCivilizations();
    renderDatabase();
  }

  function updateCounts() {
    setText("civ-count", state.entities.civilizations.length);
    setText("unit-count", state.entities.units.length);
    setText("building-count", state.entities.buildings.length);
    setText("tech-count", state.entities.technologies.length);
    setText("units-tab-count", state.entities.units.length);
    setText("buildings-tab-count", state.entities.buildings.length);
    setText("technologies-tab-count", state.entities.technologies.length);
  }

  function renderFeatured() {
    var featured = state.entities.civilizations.slice(0, 6);
    elements.featuredCivs.innerHTML = featured.map(function (entity, index) {
      return entityCard(entity, index);
    }).join("");
  }

  function renderCivilizations() {
    var query = (elements.civSearch.value || "").trim().toLowerCase();
    var list = state.entities.civilizations.filter(function (entity) {
      var matchesSearch = !query || entity.searchText.indexOf(query) !== -1;
      var matchesFavorite = !state.civFavoritesOnly || isFavorite(entity);
      return matchesSearch && matchesFavorite;
    });
    elements.civResultCount.textContent = list.length + " records";
    elements.civGrid.innerHTML = list.length
      ? list.map(function (entity, index) { return entityCard(entity, index); }).join("")
      : '<p class="empty-state">No civilizations match this search yet.</p>';
  }

  function renderDatabase() {
    var query = (elements.databaseSearch.value || "").trim().toLowerCase();
    var list = state.entities[state.collection].filter(function (entity) {
      var matchesSearch = !query || entity.searchText.indexOf(query) !== -1;
      var matchesFavorite = !state.databaseFavoritesOnly || isFavorite(entity);
      return matchesSearch && matchesFavorite;
    });
    elements.databaseResultCount.textContent = list.length + " records";
    elements.databaseGrid.innerHTML = list.length
      ? list.map(function (entity, index) { return entityCard(entity, index); }).join("")
      : '<p class="empty-state">No records match this search yet.</p>';
  }

  function entityCard(entity, index) {
    var image = VISUALS[(index + typeOffset(entity.type)) % VISUALS.length];
    var meta = [];
    if (entity.age) {
      meta.push(entity.age);
    }
    if (entity.cost) {
      meta.push(entity.cost);
    }
    if (!meta.length) {
      meta.push("Atlas record");
    }
    var saved = isFavorite(entity);
    return '<article class="entity-card">' +
      '<div class="entity-card-image">' +
        '<img src="' + image + '" loading="lazy" alt="">' +
        '<span class="entity-index">' + String(index + 1).padStart(2, "0") + "</span>" +
        '<span class="entity-type">' + escapeHtml(TYPE_LABELS[entity.type]) + "</span>" +
      "</div>" +
      '<div class="entity-card-body">' +
        "<h3>" + escapeHtml(entity.name) + "</h3>" +
        "<p>" + escapeHtml(entity.description) + "</p>" +
        '<div class="entity-meta">' + meta.slice(0, 2).map(function (item) {
          return "<span>" + escapeHtml(item) + "</span>";
        }).join("") + "</div>" +
      "</div>" +
      '<div class="entity-card-actions">' +
        '<button class="card-action card-action-primary" type="button" data-open-detail="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">Open brief</button>' +
        '<button class="card-action ' + (saved ? "is-saved" : "") + '" type="button" data-favorite="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">' + (saved ? "Saved" : "Save") + "</button>" +
        '<button class="card-action" type="button" data-compare="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">Compare</button>' +
      "</div>" +
    "</article>";
  }

  function typeOffset(type) {
    return {
      civilizations: 0,
      units: 1,
      buildings: 2,
      technologies: 0
    }[type] || 0;
  }

  function handleDocumentClick(event) {
    var viewButton = event.target.closest("[data-view-target]");
    if (viewButton) {
      var collectionTarget = viewButton.getAttribute("data-collection-target");
      if (collectionTarget) {
        setCollection(collectionTarget);
      }
      switchView(viewButton.getAttribute("data-view-target"));
      return;
    }

    var collectionButton = event.target.closest("[data-collection]");
    if (collectionButton) {
      setCollection(collectionButton.getAttribute("data-collection"));
      return;
    }

    var detailButton = event.target.closest("[data-open-detail]");
    if (detailButton) {
      openDetail(findEntity(detailButton.getAttribute("data-entity-type"), detailButton.getAttribute("data-open-detail")));
      return;
    }

    var favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      toggleFavorite(findEntity(favoriteButton.getAttribute("data-entity-type"), favoriteButton.getAttribute("data-favorite")));
      return;
    }

    var compareButton = event.target.closest("[data-compare]");
    if (compareButton) {
      toggleCompare(findEntity(compareButton.getAttribute("data-entity-type"), compareButton.getAttribute("data-compare")));
      return;
    }

    var removeCompareButton = event.target.closest("[data-remove-compare]");
    if (removeCompareButton) {
      removeCompare(removeCompareButton.getAttribute("data-remove-compare"));
      return;
    }

    var promptButton = event.target.closest("[data-ai-prompt]");
    if (promptButton) {
      setAiPrompt(promptButton.getAttribute("data-ai-prompt"));
      return;
    }

    var priceButton = event.target.closest("[data-open-pricing]");
    if (priceButton) {
      openDialog(elements.pricingDialog);
      return;
    }

    var closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
      var dialog = closeButton.closest("dialog");
      if (dialog) {
        dialog.close();
      }
      return;
    }

    var favoriteFilter = event.target.closest("[data-favorites-filter]");
    if (favoriteFilter) {
      state.civFavoritesOnly = favoriteFilter.getAttribute("data-favorites-filter") === "true";
      setActiveFilter("[data-favorites-filter]", favoriteFilter);
      renderCivilizations();
      return;
    }

    var databaseFilter = event.target.closest("[data-database-filter]");
    if (databaseFilter) {
      state.databaseFavoritesOnly = databaseFilter.getAttribute("data-database-filter") === "favorites";
      setActiveFilter("[data-database-filter]", databaseFilter);
      renderDatabase();
      return;
    }

    var searchResult = event.target.closest("[data-search-result]");
    if (searchResult) {
      elements.searchDialog.close();
      openDetail(findEntity(searchResult.getAttribute("data-entity-type"), searchResult.getAttribute("data-search-result")));
      return;
    }

    var askContextButton = event.target.closest("[data-ask-context]");
    if (askContextButton) {
      var contextEntity = findEntity(askContextButton.getAttribute("data-entity-type"), askContextButton.getAttribute("data-ask-context"));
      if (contextEntity) {
        state.activeEntity = contextEntity;
        elements.detailDialog.close();
        setAiPrompt("Explain " + contextEntity.name + " and give me the most useful strategic takeaways.");
      }
      return;
    }

    var planButton = event.target.closest("[data-plan-interest]");
    if (planButton) {
      savePlanInterest(planButton);
    }
  }

  function switchView(view, updateHash) {
    if (!document.querySelector('[data-view="' + view + '"]')) {
      return;
    }
    state.view = view;
    document.querySelectorAll("[data-view]").forEach(function (section) {
      var active = section.getAttribute("data-view") === view;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });
    document.querySelectorAll("[data-view-target]").forEach(function (button) {
      var active = button.getAttribute("data-view-target") === view;
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    if (updateHash !== false) {
      history.replaceState(null, "", "#" + view);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "ai") {
      updateAiContext();
    }
  }

  function setCollection(collection) {
    if (!state.entities[collection] || collection === "civilizations") {
      return;
    }
    state.collection = collection;
    document.querySelectorAll("[data-collection]").forEach(function (button) {
      button.setAttribute("aria-selected", String(button.getAttribute("data-collection") === collection));
    });
    elements.databaseSearch.value = "";
    renderDatabase();
  }

  function setActiveFilter(selector, activeButton) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.classList.toggle("is-active", button === activeButton);
    });
  }

  function findEntity(type, id) {
    if (!state.entities[type]) {
      return null;
    }
    return state.entities[type].find(function (entity) {
      return entity.id === String(id);
    }) || null;
  }

  function entityStorageKey(entity) {
    return entity.type + ":" + entity.id;
  }

  function isFavorite(entity) {
    return entity && state.favorites.has(entityStorageKey(entity));
  }

  function toggleFavorite(entity) {
    if (!entity) {
      return;
    }
    var key = entityStorageKey(entity);
    if (state.favorites.has(key)) {
      state.favorites.delete(key);
      showToast(entity.name + " removed from saved records.");
    } else {
      state.favorites.add(key);
      showToast(entity.name + " saved to your atlas.");
    }
    writeSet("forge-atlas-favorites", state.favorites);
    renderCivilizations();
    renderDatabase();
    renderFeatured();
    if (elements.detailDialog.open) {
      openDetail(entity);
    }
  }

  function toggleCompare(entity) {
    if (!entity) {
      return;
    }
    var key = entityStorageKey(entity);
    var existingIndex = state.compare.findIndex(function (item) {
      return entityStorageKey(item) === key;
    });
    if (existingIndex !== -1) {
      state.compare.splice(existingIndex, 1);
      showToast(entity.name + " removed from comparison.");
    } else {
      if (state.compare.length === 2) {
        state.compare.shift();
      }
      state.compare.push(entity);
      showToast(entity.name + " added to comparison.");
    }
    renderCompareTray();
  }

  function removeCompare(key) {
    state.compare = state.compare.filter(function (entity) {
      return entityStorageKey(entity) !== key;
    });
    renderCompareTray();
  }

  function clearCompare() {
    state.compare = [];
    renderCompareTray();
  }

  function renderCompareTray() {
    elements.compareTray.hidden = state.compare.length === 0;
    elements.compareItems.innerHTML = state.compare.map(function (entity) {
      return '<span class="compare-chip">' + escapeHtml(entity.name) +
        '<button type="button" aria-label="Remove ' + escapeHtml(entity.name) + '" data-remove-compare="' + escapeHtml(entityStorageKey(entity)) + '">x</button></span>';
    }).join("");
    elements.compareNow.disabled = state.compare.length !== 2;
  }

  function openComparison() {
    if (state.compare.length !== 2) {
      return;
    }
    elements.detailKicker.textContent = "Side-by-side field brief";
    elements.detailContent.innerHTML = '<div class="comparison-grid">' +
      state.compare.map(function (entity) {
        return '<article class="comparison-column">' +
          '<p class="eyebrow">' + escapeHtml(TYPE_LABELS[entity.type]) + "</p>" +
          "<h2>" + escapeHtml(entity.name) + "</h2>" +
          '<dl class="fact-grid">' + renderFacts(entity) + "</dl>" +
          '<p>' + escapeHtml(entity.description) + "</p>" +
          '<button class="button button-ghost" type="button" data-ask-context="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">Ask AI about this</button>' +
        "</article>";
      }).join("") +
    "</div>";
    openDialog(elements.detailDialog);
  }

  function openDetail(entity) {
    if (!entity) {
      return;
    }
    state.activeEntity = entity;
    updateAiContext();
    var bullets = extractBullets(entity.raw);
    var saved = isFavorite(entity);
    var image = VISUALS[(entity.order + typeOffset(entity.type)) % VISUALS.length];
    elements.detailKicker.textContent = TYPE_LABELS[entity.type] + " atlas record";
    elements.detailContent.innerHTML =
      '<div class="detail-hero">' +
        '<img src="' + image + '" alt="">' +
        '<div class="detail-copy">' +
          '<p class="eyebrow">' + escapeHtml(TYPE_LABELS[entity.type]) + "</p>" +
          "<h2>" + escapeHtml(entity.name) + "</h2>" +
          "<p>" + escapeHtml(entity.description) + "</p>" +
          '<div class="detail-actions">' +
            '<button class="button button-primary" type="button" data-ask-context="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">Ask Forge AI</button>' +
            '<button class="button button-ghost" type="button" data-favorite="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">' + (saved ? "Saved" : "Save record") + "</button>" +
            '<button class="button button-ghost" type="button" data-compare="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">Compare</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="detail-body">' +
        '<section class="fact-panel"><h3>Quick facts</h3><dl class="fact-grid">' + renderFacts(entity) + "</dl></section>" +
        '<section class="context-panel"><h3>Strategy context</h3>' +
          (bullets.length
            ? "<ul>" + bullets.slice(0, 8).map(function (bullet) { return "<li>" + escapeHtml(bullet) + "</li>"; }).join("") + "</ul>"
            : "<p>Use Forge AI to connect this record to counters, upgrades, and civilization choices.</p>") +
        "</section>" +
      "</div>";
    openDialog(elements.detailDialog);
  }

  function renderFacts(entity) {
    var facts = [];
    if (entity.age) {
      facts.push(["Available", entity.age]);
    }
    if (entity.cost) {
      facts.push(["Cost", entity.cost]);
    }
    Object.keys(FACT_LABELS).forEach(function (key) {
      if (key === "age" || key === "cost") {
        return;
      }
      var value = entity.raw[key];
      if (value === undefined && entity.raw[camelCase(key)] !== undefined) {
        value = entity.raw[camelCase(key)];
      }
      if (value !== undefined && value !== null && value !== "" && typeof value !== "object") {
        facts.push([FACT_LABELS[key], resolveText(value)]);
      }
    });
    if (entity.type === "civilizations" && entity.raw.tech_tree) {
      var tree = entity.raw.tech_tree;
      if (tree.units && tree.units.length !== undefined) {
        facts.push(["Unit options", tree.units.length]);
      }
      if (tree.techs && tree.techs.length !== undefined) {
        facts.push(["Technology options", tree.techs.length]);
      }
    }
    if (!facts.length) {
      facts.push(["Record type", TYPE_LABELS[entity.type]]);
      facts.push(["Atlas ID", entity.id]);
    }
    return facts.slice(0, 10).map(function (fact) {
      return "<div><dt>" + escapeHtml(fact[0]) + "</dt><dd>" + escapeHtml(String(fact[1])) + "</dd></div>";
    }).join("");
  }

  function extractBullets(raw) {
    var keys = [
      "civ_bonus",
      "civ_bonuses",
      "bonuses",
      "bonus",
      "team_bonus",
      "unique_units",
      "unique_unit",
      "unique_techs",
      "unique_technologies",
      "special"
    ];
    var bullets = [];
    keys.forEach(function (key) {
      var value = raw[key];
      if (value === undefined || value === null) {
        return;
      }
      var values = Array.isArray(value) ? value : [value];
      values.forEach(function (item) {
        var text = cleanText(resolveText(item));
        if (text && !/^\d+$/.test(text) && bullets.indexOf(text) === -1) {
          bullets.push(text);
        }
      });
    });
    return bullets;
  }

  function openSearch() {
    openDialog(elements.searchDialog);
    elements.globalSearch.value = "";
    renderGlobalSearch("");
    window.setTimeout(function () {
      elements.globalSearch.focus();
    }, 50);
  }

  function renderGlobalSearch(query) {
    var normalized = (query || "").trim().toLowerCase();
    if (!normalized) {
      elements.searchResults.innerHTML = '<p class="empty-copy">Start typing to search civilizations, units, buildings, and technologies.</p>';
      return;
    }
    var all = []
      .concat(state.entities.civilizations)
      .concat(state.entities.units)
      .concat(state.entities.buildings)
      .concat(state.entities.technologies);
    var matches = all.filter(function (entity) {
      return entity.searchText.indexOf(normalized) !== -1;
    }).slice(0, 18);
    elements.searchResults.innerHTML = matches.length
      ? matches.map(function (entity, index) {
          return '<button class="search-result" type="button" data-search-result="' + escapeHtml(entity.id) + '" data-entity-type="' + entity.type + '">' +
            '<span class="search-result-index">' + String(index + 1).padStart(2, "0") + "</span>" +
            "<span><strong>" + escapeHtml(entity.name) + "</strong><small>" + escapeHtml(entity.description.slice(0, 100)) + "</small></span>" +
            '<span class="search-result-type">' + escapeHtml(TYPE_LABELS[entity.type]) + "</span>" +
          "</button>";
        }).join("")
      : '<p class="empty-copy">No atlas records match "' + escapeHtml(query) + '".</p>';
  }

  function openDialog(dialog) {
    document.querySelectorAll("dialog[open]").forEach(function (open) {
      if (open !== dialog) {
        open.close();
      }
    });
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function setAiPrompt(prompt) {
    switchView("ai");
    elements.aiQuestion.value = prompt;
    updateAiContext();
    window.setTimeout(function () {
      elements.aiQuestion.focus();
      elements.aiQuestion.setSelectionRange(prompt.length, prompt.length);
    }, 80);
  }

  function updateAiContext() {
    elements.aiContextLabel.textContent = state.activeEntity
      ? "Context: " + state.activeEntity.name
      : "Using the full atlas";
  }

  async function handleAiSubmit(event) {
    event.preventDefault();
    var question = elements.aiQuestion.value.trim();
    if (!question) {
      return;
    }
    var usage = getDailyUsage();
    if (usage >= FREE_DAILY_LIMIT) {
      showToast("Your free strategy briefs are used for today. Forge+ is designed for unlimited sessions.");
      openDialog(elements.pricingDialog);
      return;
    }

    appendChatMessage("user", question);
    elements.aiQuestion.value = "";
    elements.chatSuggestions.hidden = true;
    var thinkingId = appendThinkingMessage();
    setComposerBusy(true);

    try {
      var response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          contextType: state.activeEntity ? state.activeEntity.type : "",
          contextId: state.activeEntity ? state.activeEntity.id : ""
        })
      });
      var payload = await response.json().catch(function () { return {}; });
      removeThinkingMessage(thinkingId);
      if (!response.ok) {
        if (payload.code === "ai_unconfigured") {
          throw new Error("Forge AI is ready for the DeepSeek key. The atlas and comparison tools are available now.");
        }
        if (response.status === 429) {
          throw new Error("The forge is cooling down after several requests. Try again in a few minutes.");
        }
        throw new Error(payload.message || "Forge AI could not create this brief.");
      }
      appendChatMessage("assistant", payload.answer, payload.sources || []);
      incrementDailyUsage();
    } catch (error) {
      removeThinkingMessage(thinkingId);
      appendChatMessage("assistant", error.message || "Forge AI is temporarily unavailable.");
    } finally {
      setComposerBusy(false);
    }
  }

  function appendChatMessage(role, text, sources) {
    var article = document.createElement("article");
    article.className = "chat-message " + (role === "user" ? "user-message" : "assistant-message");
    var avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "YOU" : "F";
    var body = document.createElement("div");
    var label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : "Forge AI";
    var paragraph = document.createElement("p");
    paragraph.textContent = text;
    body.appendChild(label);
    body.appendChild(paragraph);
    if (sources && sources.length) {
      var sourceLine = document.createElement("small");
      sourceLine.className = "message-sources";
      sourceLine.textContent = "Atlas records: " + sources.join(", ");
      body.appendChild(sourceLine);
    }
    article.appendChild(avatar);
    article.appendChild(body);
    elements.chatMessages.appendChild(article);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function appendThinkingMessage() {
    var id = "thinking-" + Date.now();
    var article = document.createElement("article");
    article.id = id;
    article.className = "chat-message assistant-message thinking-message";
    article.innerHTML = '<span class="message-avatar">F</span><div><strong>Forge AI</strong><p>Searching the atlas and forging a brief...</p></div>';
    elements.chatMessages.appendChild(article);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return id;
  }

  function removeThinkingMessage(id) {
    var node = document.getElementById(id);
    if (node) {
      node.remove();
    }
  }

  function setComposerBusy(busy) {
    elements.aiQuestion.disabled = busy;
    var submit = elements.aiForm.querySelector('button[type="submit"]');
    submit.disabled = busy;
    submit.textContent = busy ? "Forging..." : "Forge brief ->";
  }

  function resetChat() {
    elements.chatMessages.innerHTML =
      '<article class="chat-message assistant-message">' +
        '<span class="message-avatar">F</span>' +
        "<div><strong>Forge AI</strong><p>Fresh slate. Ask about a civilization, unit, technology, or matchup and I will search the atlas first.</p></div>" +
      "</article>";
    elements.chatSuggestions.hidden = false;
    state.activeEntity = null;
    updateAiContext();
  }

  function getDailyUsage() {
    var today = new Date().toISOString().slice(0, 10);
    var record = readJson("forge-atlas-ai-usage", { date: today, count: 0 });
    return record.date === today ? Number(record.count || 0) : 0;
  }

  function incrementDailyUsage() {
    var today = new Date().toISOString().slice(0, 10);
    var count = getDailyUsage() + 1;
    localStorage.setItem("forge-atlas-ai-usage", JSON.stringify({ date: today, count: count }));
    updateQuota();
  }

  function updateQuota() {
    var used = getDailyUsage();
    var remaining = Math.max(0, FREE_DAILY_LIMIT - used);
    elements.quotaText.textContent = remaining + " / " + FREE_DAILY_LIMIT + " left";
    elements.quotaBar.style.transform = "scaleX(" + (remaining / FREE_DAILY_LIMIT) + ")";
  }

  function savePlanInterest(button) {
    var plan = button.getAttribute("data-plan-interest");
    localStorage.setItem("forge-atlas-plan-interest", plan);
    document.querySelectorAll("[data-plan-interest]").forEach(function (candidate) {
      if (candidate.getAttribute("data-plan-interest") === plan) {
        candidate.textContent = "Interest saved";
      }
    });
    showToast(plan + " interest saved on this device. Checkout is the next commercial milestone.");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 3400);
  }

  function readSet(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function writeSet(key, set) {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = String(value);
    }
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function camelCase(value) {
    return value.replace(/_([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
