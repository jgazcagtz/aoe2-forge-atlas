const DATA_URL = './data/aoe2-data.json';
const STRINGS_URL = './data/aoe2-strings.json';
const WIKI_SUMMARY_URL =
  'https://en.wikipedia.org/api/rest_v1/page/summary/Age_of_Empires_II';

const els = {
  metricCivs: document.getElementById('metricCivs'),
  metricUnits: document.getElementById('metricUnits'),
  metricBuildings: document.getElementById('metricBuildings'),
  metricTechs: document.getElementById('metricTechs'),
  statusLine: document.getElementById('statusLine'),
  searchInput: document.getElementById('searchInput'),
  sortBy: document.getElementById('sortBy'),
  refreshData: document.getElementById('refreshData'),
  exportSnapshot: document.getElementById('exportSnapshot'),
  tabButtons: document.getElementById('tabButtons'),
  panels: {
    overview: document.getElementById('panel-overview'),
    civs: document.getElementById('panel-civs'),
    units: document.getElementById('panel-units'),
    buildings: document.getElementById('panel-buildings'),
    techs: document.getElementById('panel-techs'),
    monetization: document.getElementById('panel-monetization'),
  },
  overviewCards: document.getElementById('overviewCards'),
  wikiHub: document.getElementById('wikiHub'),
  civsGrid: document.getElementById('civsGrid'),
  unitsGrid: document.getElementById('unitsGrid'),
  buildingsGrid: document.getElementById('buildingsGrid'),
  techGrid: document.getElementById('techGrid'),
};

const state = {
  activeTab: 'overview',
  query: '',
  sortBy: 'name-asc',
  civs: [],
  units: [],
  buildings: [],
  techs: [],
  civMap: {},
  unitMap: {},
  buildingMap: {},
  techMap: {},
  rawCivsData: null,
  strings: null,
  wiki: null,
};

function setStatus(message) {
  els.statusLine.textContent = message;
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(input) {
  return String(input || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function costToText(cost) {
  if (!cost || typeof cost !== 'object') {
    return '—';
  }
  const keys = Object.keys(cost);
  if (!keys.length) {
    return '—';
  }
  return keys
    .map((resource) => `${cost[resource]} ${resource}`)
    .join(' · ');
}

function costToValue(cost) {
  if (!cost || typeof cost !== 'object') {
    return 0;
  }
  return Object.values(cost).reduce((sum, value) => {
    const num = Number(value);
    return Number.isFinite(num) ? sum + num : sum;
  }, 0);
}

function mapById(entries) {
  const result = {};
  for (const value of Object.values(entries)) {
    if (!value || value.ID === undefined) continue;
    result[String(value.ID)] = value;
  }
  return result;
}

function textByStringId(id, fallback = '') {
  if (!state.strings) return fallback;
  return state.strings[String(id)] || state.strings[id] || fallback;
}

function resolveName(type, id, fallback = '') {
  const map = {
    unit: state.unitMap,
    building: state.buildingMap,
    tech: state.techMap,
    civ: state.civMap,
  };
  const entry = map[type]?.[String(id)];
  if (!entry) return fallback;
  const label = textByStringId(entry.LanguageNameId);
  return label || entry.internal_name || fallback;
}

function parseCivName(civ, key) {
  const direct = textByStringId(civ.name_string_id);
  return (direct && stripHtml(direct)) || key.replace(/_/g, ' ');
}

function parseCivObject(raw) {
  const civs = [];
  const civMap = {};
  for (const [key, civ] of Object.entries(raw)) {
    const unitList = Array.isArray(civ.Unit) ? civ.Unit : [];
    const buildingList = Array.isArray(civ.Building) ? civ.Building : [];
    const techList = Array.isArray(civ.Tech) ? civ.Tech : [];
    const name = parseCivName(civ, key);
    const help = stripHtml(textByStringId(civ.help_string_id));
    const entry = {
      slug: key,
      id: civ.id || key,
      name,
      era: civ.era || 'base',
      help,
      unitIds: unitList.map(String),
      buildingIds: buildingList.map(String),
      techIds: techList.map(String),
      unitCount: unitList.length,
      buildingCount: buildingList.length,
      techCount: techList.length,
      wikiUrl: `https://ageofempires.fandom.com/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`,
    };
    entry.unitNames = unitList
      .map((id) => resolveName('unit', String(id), `Unit ${id}`))
      .filter(Boolean)
      .slice(0, 6);
    entry.buildingNames = buildingList
      .map((id) => resolveName('building', String(id), `Building ${id}`))
      .filter(Boolean)
      .slice(0, 6);
    entry.techNames = techList
      .map((id) => resolveName('tech', String(id), `Tech ${id}`))
      .filter(Boolean)
      .slice(0, 6);
    civs.push(entry);
    civMap[String(civ.id || key)] = entry;
  }
  return { civs, civMap };
}

function parseUnitItem(rawUnit, type = 'unit') {
  return {
    type,
    id: String(rawUnit.ID),
    name: stripHtml(textByStringId(rawUnit.LanguageNameId) || rawUnit.internal_name),
    internalName: rawUnit.internal_name,
    hp: rawUnit.HP ?? 0,
    attack: rawUnit.Attack ?? 0,
    range: rawUnit.Range ?? 0,
    speed: rawUnit.Speed ?? 0,
    reload: rawUnit.ReloadTime ?? 0,
    lineOfSight: rawUnit.LineOfSight ?? 0,
    armorMelee: rawUnit.MeleeArmor ?? 0,
    armorPierce: rawUnit.PierceArmor ?? 0,
    cost: rawUnit.Cost || {},
    costTotal: costToValue(rawUnit.Cost),
    raw: rawUnit,
  };
}

function parseBuildingItem(rawBuilding) {
  return {
    ...parseUnitItem(rawBuilding, 'building'),
    garrison: rawBuilding.GarrisonCapacity ?? 0,
    trainTime: rawBuilding.TrainTime ?? 0,
  };
}

function parseTechItem(rawTech) {
  return {
    type: 'tech',
    id: String(rawTech.ID),
    name: stripHtml(textByStringId(rawTech.LanguageNameId) || rawTech.internal_name),
    internalName: rawTech.internal_name,
    cost: rawTech.Cost || {},
    costTotal: costToValue(rawTech.Cost),
    repeatable: Boolean(rawTech.Repeatable),
    researchTime: rawTech.ResearchTime ?? 0,
    raw: rawTech,
  };
}

function getRows(list) {
  if (!state.query) return list;
  const q = normalize(state.query);
  return list.filter((entry) =>
    normalize(`${entry.name} ${entry.internalName || ''} ${entry.help || ''}`).includes(q),
  );
}

function sortRows(rows, tab = 'overview') {
  const key = state.sortBy;
  const sorted = [...rows];
  switch (key) {
    case 'name-desc': {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    }
    case 'cost-low': {
      sorted.sort((a, b) => (a.costTotal || 0) - (b.costTotal || 0));
      break;
    }
    case 'cost-high': {
      sorted.sort((a, b) => (b.costTotal || 0) - (a.costTotal || 0));
      break;
    }
    case 'hp-high': {
      sorted.sort((a, b) => (b.hp || 0) - (a.hp || 0));
      break;
    }
    case 'attack-high': {
      sorted.sort((a, b) => (b.attack || 0) - (a.attack || 0));
      break;
    }
    case 'name-asc':
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  if (tab === 'civs') {
    sorted.sort((a, b) => {
      if (key === 'cost-low' || key === 'cost-high') {
        return 0;
      }
      return a.name.localeCompare(b.name);
    });
  }

  return sorted;
}

function renderListCards(container, rows, renderCard) {
  container.innerHTML = '';
  if (!rows.length) {
    container.innerHTML =
      '<article class="card"><p>No results with current search and filters.</p></article>';
    return;
  }
  for (const row of rows) {
    container.appendChild(renderCard(row));
  }
}

function makeTag(text) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = text;
  return tag;
}

function makeSimpleLink(href, text) {
  const a = document.createElement('a');
  a.className = 'inline-link';
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  return a;
}

function makeCard(title, description, valueLines = []) {
  const article = document.createElement('article');
  article.className = 'card';
  const h = document.createElement('h3');
  h.textContent = title;
  article.appendChild(h);
  const p = document.createElement('p');
  p.textContent = description || 'No description available.';
  article.appendChild(p);

  if (valueLines.length) {
    const stats = document.createElement('div');
    stats.className = 'stats-line';
    valueLines.forEach((line) => {
      const s = document.createElement('span');
      s.textContent = line;
      stats.appendChild(s);
    });
    article.appendChild(stats);
  }
  return article;
}

function renderCivCard(civ) {
  const card = document.createElement('article');
  card.className = 'card';
  const h3 = document.createElement('h3');
  h3.textContent = civ.name;
  card.appendChild(h3);

  const meta = document.createElement('div');
  meta.className = 'item-meta';
  meta.appendChild(makeTag(`Era ${civ.era}`));
  meta.appendChild(makeTag(`${civ.unitCount} units`));
  meta.appendChild(makeTag(`${civ.buildingCount} buildings`));
  meta.appendChild(makeTag(`${civ.techCount} techs`));
  card.appendChild(meta);

  const desc = document.createElement('p');
  desc.className = 'muted';
  desc.textContent =
    (civ.help ? `${civ.help.substring(0, 170)}...` : 'Civilization bonus details loaded from data source.') ||
    '';
  card.appendChild(desc);

  const row = document.createElement('div');
  row.className = 'stats-line';
  row.innerHTML = `<span>Top units: ${civ.unitNames.slice(0, 3).join(', ') || 'none'}</span>`;
  card.appendChild(row);

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Full civ roster';
  details.appendChild(summary);

  const ul = document.createElement('ul');
  const top = civ.unitNames.slice(0, 12);
  const buildingPreview = civ.buildingNames.slice(0, 12);
  const techPreview = civ.techNames.slice(0, 12);
  for (const item of top) {
    const li = document.createElement('li');
    li.textContent = `${item} (unit)`;
    ul.appendChild(li);
  }
  for (const item of buildingPreview) {
    const li = document.createElement('li');
    li.textContent = `${item} (building)`;
    ul.appendChild(li);
  }
  for (const item of techPreview) {
    const li = document.createElement('li');
    li.textContent = `${item} (tech)`;
    ul.appendChild(li);
  }
  details.appendChild(ul);
  card.appendChild(details);

  const cta = document.createElement('div');
  cta.className = 'cta-row';
  cta.appendChild(makeSimpleLink(civ.wikiUrl, 'Open wiki page'));
  const wikiLink = document.createElement('a');
  wikiLink.className = 'wiki-btn';
  wikiLink.href = 'https://en.wikipedia.org/wiki/Age_of_Empires_II';
  wikiLink.target = '_blank';
  wikiLink.rel = 'noopener noreferrer';
  wikiLink.textContent = 'AOE2 wiki';
  cta.appendChild(wikiLink);
  card.appendChild(cta);

  return card;
}

function renderUnitCard(item) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <h3>${item.name}</h3>
    <p class="muted">${item.type.toUpperCase()} • ${item.internalName}</p>
    <div class="item-meta">
      <span class="tag">Cost: ${costToText(item.cost)}</span>
      <span class="tag">Cost Total: ${item.costTotal}</span>
      <span class="tag">HP: ${item.hp}</span>
    </div>
    <div class="stats-line">
      <span>Attack: ${item.attack}</span>
      <span>Range: ${item.range}</span>
      <span>Speed: ${item.speed}</span>
      <span>Reload: ${item.reload}</span>
      <span>Armor: Melee ${item.armorMelee}, Pierce ${item.armorPierce}</span>
      <span>LOS: ${item.lineOfSight}</span>
    </div>
  `;
  return card;
}

function renderTechCard(item) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <h3>${item.name}</h3>
    <p class="muted">${item.type.toUpperCase()} • ${item.internalName}</p>
    <div class="item-meta">
      <span class="tag">Cost: ${costToText(item.cost)}</span>
      <span class="tag">Repeatable: ${item.repeatable ? 'yes' : 'no'}</span>
      <span class="tag">Research: ${item.researchTime}s</span>
    </div>
  `;
  return card;
}

function renderOverviewCards() {
  const civs = sortRows(getRows(state.civs), 'civs');
  const units = sortRows(getRows(state.units), 'units');
  const buildings = sortRows(getRows(state.buildings), 'buildings');
  const techs = sortRows(getRows(state.techs), 'techs');

  const featured = [
    ['Civilizations loaded', `${civs.length} unique civilization profiles`],
    ['Largest unit list', units[0]?.name || 'No data'],
    ['Largest building list', buildings[0]?.name || 'No data'],
    ['Highest cost tech', techs[0]?.name || 'No data'],
  ];

  els.overviewCards.innerHTML = '';
  for (const item of featured) {
    els.overviewCards.appendChild(
      makeCard(
        item[0],
        item[1],
        [
          `Dataset timestamp: ${new Date().toLocaleString()}`,
          `Data mode: ${state.wiki ? 'live summaries + local AOE2 dataset' : 'local dataset only'}`,
        ],
      ),
    );
  }

  const summary = state.wiki
    ? stripHtml(state.wiki.extract || '')
    : 'Age of Empires II summary will appear here once loaded.';
  const wikiCard = makeCard(
    'Age of Empires II quick context',
    summary ? summary.substring(0, 390) + '…' : 'No wiki summary available.',
    ['Live source: Wikipedia Age of Empires II', `Source URL: ${state.wiki?.content_urls?.desktop?.page || 'N/A'}`],
  );
  wikiCard.classList.remove('card');
  wikiCard.className = 'card';
  const linkWrap = document.createElement('div');
  linkWrap.className = 'cta-row';
  const link = document.createElement('a');
  link.className = 'wiki-btn';
  link.href = state.wiki?.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Age_of_Empires_II';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open full page';
  linkWrap.appendChild(link);
  wikiCard.appendChild(linkWrap);

  const list = document.createElement('article');
  list.className = 'card';
  list.innerHTML = `
    <h3>Useful quick links</h3>
    <p class="muted">Jump straight to community pages, patch guides, and strategy resources.</p>
  `;
  const quickLinks = document.createElement('div');
  quickLinks.className = 'cta-row';
  quickLinks.appendChild(makeSimpleLink('https://www.ageofempires.com/news/', 'Official News'));
  quickLinks.appendChild(makeSimpleLink('https://ageofempires.fandom.com/wiki/Age_of_Empires_II', 'Fandom Age of Empires II'));
  quickLinks.appendChild(makeSimpleLink('https://www.ageofempires.com/games/age-of-empires-ii-de/', 'Game Home'));
  list.appendChild(quickLinks);

  els.wikiHub.innerHTML = '';
  els.wikiHub.appendChild(wikiCard);
  els.wikiHub.appendChild(list);
}

function renderAll() {
  if (!state.civs.length) return;
  els.metricCivs.textContent = String(state.civs.length);
  els.metricUnits.textContent = String(state.units.length);
  els.metricBuildings.textContent = String(state.buildings.length);
  els.metricTechs.textContent = String(state.techs.length);

  renderOverviewCards();

  const civRows = sortRows(getRows(state.civs), 'civs');
  renderListCards(els.civsGrid, civRows, renderCivCard);

  const unitRows = sortRows(getRows(state.units), 'units');
  renderListCards(els.unitsGrid, unitRows, renderUnitCard);

  const buildingRows = sortRows(getRows(state.buildings), 'buildings');
  renderListCards(els.buildingsGrid, buildingRows, renderUnitCard);

  const techRows = sortRows(getRows(state.techs), 'techs');
  renderListCards(els.techGrid, techRows, renderTechCard);
}

function switchTab(tabName) {
  state.activeTab = tabName;
  for (const [name, panel] of Object.entries(els.panels)) {
    panel.classList.toggle('active', name === tabName);
  }
  for (const button of els.tabButtons.querySelectorAll('button')) {
    button.classList.toggle('active', button.dataset.tab === tabName);
  }
  if (tabName === 'overview') {
    renderOverviewCards();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}`);
  }
  return response.json();
}

async function fetchWikiSummary() {
  try {
    return await fetchJson(WIKI_SUMMARY_URL);
  } catch {
    return null;
  }
}

function bootstrapState(rawData, rawStrings, wiki) {
  state.strings = rawStrings;
  state.rawCivsData = rawData.civs || {};
  const dataBuckets = rawData.data || {};

  state.unitMap = mapById(dataBuckets.Unit || {});
  state.buildingMap = mapById(dataBuckets.Building || {});
  state.techMap = mapById(dataBuckets.Tech || {});

  const parsedCivs = parseCivObject(state.rawCivsData);
  state.civs = parsedCivs.civs;
  state.civMap = parsedCivs.civMap;
  state.units = Object.values(state.unitMap).map((unit) => parseUnitItem(unit, 'unit'));
  state.buildings = Object.values(state.buildingMap).map((building) => parseBuildingItem(building));
  state.techs = Object.values(state.techMap).map((tech) => parseTechItem(tech));
  state.wiki = wiki;
}

function initEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll();
  });
  els.sortBy.addEventListener('change', (event) => {
    state.sortBy = event.target.value;
    renderAll();
  });
  els.refreshData.addEventListener('click', () => {
    loadData(true);
  });
  els.exportSnapshot.addEventListener('click', () => {
    const snapshot = {
      source: 'AOE2 Forge Atlas local snapshot',
      createdAt: new Date().toISOString(),
      civs: state.civs,
      units: state.units,
      buildings: state.buildings,
      techs: state.techs,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aoe2-forge-atlas-snapshot-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
  els.tabButtons.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (!button) return;
    switchTab(button.dataset.tab);
  });
}

async function loadData(force) {
  if (!force) setStatus('Loading AOE2 data from local files...');
  else setStatus('Refreshing local dataset...');
  try {
    const cacheBuster = force ? `?t=${Date.now()}` : '';
    const [rawData, strings, wiki] = await Promise.all([
      fetchJson(`${DATA_URL}${cacheBuster}`),
      fetchJson(`${STRINGS_URL}${cacheBuster}`),
      fetchWikiSummary(),
    ]);
    bootstrapState(rawData, strings, wiki);
    renderAll();
    setStatus('Dataset ready. Use search and filters to explore.');
  } catch (error) {
    setStatus(`Failed to load data (${error.message}).`);
    console.error(error);
  }
}

function init() {
  initEvents();
  switchTab('overview');
  loadData(false);
}

document.addEventListener('DOMContentLoaded', init);
