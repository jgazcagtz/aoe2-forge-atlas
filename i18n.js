(function () {
  "use strict";

  var locale = detectLocale();

  var packs = {
    en: {
      metaTitle: "Forge Atlas | AOE2 Strategy Intelligence",
      metaDescription: "Explore civilizations, units, technologies, tournaments, videos, and AI-powered Age of Empires II strategy briefs.",
      ui: {
        records: "{count} records",
        openBrief: "Open brief",
        save: "Save",
        saved: "Saved",
        compare: "Compare",
        atlasRecord: "Atlas record",
        noCivs: "No civilizations match this search yet.",
        noRecords: "No records match this search yet.",
        loading: "Loading atlas...",
        available: "Available",
        cost: "Cost",
        recordType: "Record type",
        atlasId: "Atlas ID",
        unitOptions: "Unit options",
        technologyOptions: "Technology options",
        quickFacts: "Quick facts",
        strategyContext: "Strategy context",
        askAi: "Ask Forge AI",
        saveRecord: "Save record",
        detailRecord: "{type} atlas record",
        comparisonBrief: "Side-by-side field brief",
        compareTwo: "Compare 2",
        freeLeft: "{remaining} / {limit} left",
        typeCivilization: "Civilization",
        typeUnit: "Unit",
        typeBuilding: "Building",
        typeTechnology: "Technology",
        aiWelcome: "Bring me a civilization, unit, technology, or matchup question. I will search the atlas and turn the relevant records into a concise field brief.",
        aiFresh: "Fresh slate. Ask about a civilization, unit, technology, or matchup and I will search the atlas first.",
        aiUsing: "Using the full atlas",
        aiContext: "Context: {name}",
        hubLoading: "Collecting this week's signals from trusted AOE2 sources.",
        hubError: "The weekly sources are temporarily unavailable. The atlas and AI strategy room still work.",
        noTournaments: "No current tournament records were returned. Open the full calendar for the latest schedule.",
        noNews: "No new AOE2 dispatches were returned this week.",
        noVideos: "No fresh videos were returned from the selected feeds.",
        readSource: "Read source",
        watchVideo: "Watch video",
        prize: "Prize",
        ongoing: "Ongoing",
        upcoming: "Upcoming",
        sourcesReady: "{count} sourced items ready",
        weeklyLabel: "Week {week}",
        generatedAt: "Refreshed {date}"
      },
      text: {},
      html: {},
      placeholders: {}
    },
    es: {
      metaTitle: "Forge Atlas | Inteligencia estratégica de AOE2",
      metaDescription: "Explora civilizaciones, unidades, tecnologías, torneos, videos y análisis de Age of Empires II con IA.",
      ui: {
        records: "{count} registros",
        openBrief: "Abrir ficha",
        save: "Guardar",
        saved: "Guardado",
        compare: "Comparar",
        atlasRecord: "Registro del atlas",
        noCivs: "Ninguna civilización coincide con esta búsqueda.",
        noRecords: "Ningún registro coincide con esta búsqueda.",
        loading: "Cargando el atlas...",
        available: "Disponible",
        cost: "Costo",
        recordType: "Tipo de registro",
        atlasId: "ID del atlas",
        unitOptions: "Opciones de unidades",
        technologyOptions: "Opciones tecnológicas",
        quickFacts: "Datos rápidos",
        strategyContext: "Contexto estratégico",
        askAi: "Preguntar a Forge AI",
        saveRecord: "Guardar registro",
        detailRecord: "Ficha de {type}",
        comparisonBrief: "Comparación lado a lado",
        compareTwo: "Comparar 2",
        freeLeft: "{remaining} / {limit} disponibles",
        typeCivilization: "Civilización",
        typeUnit: "Unidad",
        typeBuilding: "Edificio",
        typeTechnology: "Tecnología",
        aiWelcome: "Pregúntame por una civilización, unidad, tecnología o enfrentamiento. Buscaré primero en el atlas y convertiré los registros relevantes en un informe claro.",
        aiFresh: "Empezamos de nuevo. Pregunta por una civilización, unidad, tecnología o enfrentamiento y buscaré primero en el atlas.",
        aiUsing: "Usando todo el atlas",
        aiContext: "Contexto: {name}",
        hubLoading: "Reuniendo las señales de esta semana desde fuentes confiables de AOE2.",
        hubError: "Las fuentes semanales no están disponibles temporalmente. El atlas y la sala de estrategia siguen funcionando.",
        noTournaments: "No llegaron torneos actuales. Abre el calendario completo para consultar el programa más reciente.",
        noNews: "No llegaron noticias nuevas de AOE2 esta semana.",
        noVideos: "No llegaron videos recientes desde los canales seleccionados.",
        readSource: "Leer fuente",
        watchVideo: "Ver video",
        prize: "Premio",
        ongoing: "En curso",
        upcoming: "Próximo",
        sourcesReady: "{count} elementos con fuente",
        weeklyLabel: "Semana {week}",
        generatedAt: "Actualizado {date}"
      },
      text: {
        ".hero .eyebrow": "Guía de campo independiente",
        ".hero-lede": "Un atlas estratégico rápido y visual para quienes quieren respuestas sin abrir diez pestañas. Explora el árbol tecnológico completo, compara opciones y pide un informe respaldado por datos.",
        ".trust-row li:nth-child(1)": "Datos completos",
        ".trust-row li:nth-child(2)": "Con fuentes",
        ".trust-row li:nth-child(3)": "Listo para móvil",
        ".stat-ribbon article:nth-child(1) span": "Civilizaciones",
        ".stat-ribbon article:nth-child(2) span": "Unidades",
        ".stat-ribbon article:nth-child(3) span": "Edificios",
        ".stat-ribbon article:nth-child(4) span": "Tecnologías",
        ".stat-ribbon > p": "Un centro de mando para búsquedas rápidas y análisis profundos.",
        ".journey-section .eyebrow": "Elige tu ventaja",
        ".journey-section .section-heading h2": "Tres formas de entrar al atlas",
        ".journey-section .section-heading > p": "Tengas treinta segundos o toda una noche, empieza por tu pregunta.",
        ".journey-card:nth-child(1) strong": "Encuentra tu civilización",
        ".journey-card:nth-child(1) > span:not(.journey-number, .journey-icon)": "Explora identidades, bonificaciones y forma del árbol tecnológico.",
        ".journey-card:nth-child(1) b": "Abrir índice de civilizaciones ->",
        ".journey-card:nth-child(2) strong": "Compara el campo",
        ".journey-card:nth-child(2) > span:not(.journey-number, .journey-icon)": "Pon unidades y edificios lado a lado antes de jugar.",
        ".journey-card:nth-child(2) b": "Abrir base de datos ->",
        ".journey-card:nth-child(3) strong": "Pide un plan de juego",
        ".journey-card:nth-child(3) > span:not(.journey-number, .journey-icon)": "Convierte datos estructurados en un informe del enfrentamiento.",
        ".journey-card:nth-child(3) b": "Preguntar a Forge AI ->",
        ".featured-section .eyebrow": "Índice de civilizaciones",
        ".featured-section h2": "Empieza con una identidad",
        ".featured-section .text-button": "Ver todas ->",
        ".ai-stage .eyebrow": "Inteligencia Forge",
        ".ai-stage-copy > p:not(.eyebrow)": "Pregunta por qué un enfrentamiento fue imposible, qué desbloquea una tecnología o cómo se comparan dos unidades. Forge AI consulta primero el atlas.",
        ".archive-section .eyebrow": "Archivo visual",
        ".archive-section h2": "Historia sin el silencio del museo",
        ".archive-section .section-heading > p": "Mapas y manuscritos de dominio público dan textura al atlas sin utilizar arte protegido del juego.",
        ".plus-banner .eyebrow": "Para jugadores que regresan",
        ".plus-banner li:nth-child(1)": "Informes estratégicos ilimitados",
        ".plus-banner li:nth-child(2)": "Enfrentamientos y órdenes guardadas",
        ".plus-banner li:nth-child(3)": "Alertas de parches y práctica personalizada",
        "[data-view=\"civilizations\"] .eyebrow": "Índice de civilizaciones",
        "[data-view=\"civilizations\"] .view-hero > p": "Busca el roster completo, guarda favoritos, abre fichas detalladas o compara dos civilizaciones.",
        "[data-view=\"database\"] .eyebrow": "Base de datos abierta",
        "[data-view=\"database\"] .view-hero > p": "Explora unidades, edificios y tecnologías con datos rápidos, favoritos, comparaciones e IA contextual.",
        ".strategy-sidebar .eyebrow": "Inteligencia Forge",
        ".strategy-sidebar > p:not(.eyebrow)": "Forge AI recupera registros relevantes antes de responder. Los valores exactos siempre pertenecen a la fuente.",
        ".premium-list h2": "Mejores funciones premium",
        ".premium-list li:nth-child(1)": "Informes ilimitados",
        ".premium-list li:nth-child(2)": "Coach personalizado de aperturas",
        ".premium-list li:nth-child(3)": "Playbooks guardados en la nube",
        ".premium-list li:nth-child(4)": "Alertas de cambios",
        ".ai-disclaimer": "La IA puede equivocarse. Verifica las estadísticas exactas antes de competir.",
        ".hub-hero .eyebrow": "Señal semanal de la comunidad",
        ".hub-hero-copy > p:not(.eyebrow)": "Un informe con torneos actuales, noticias oficiales, videos de la comunidad y un resumen de IA que separa hechos de recomendaciones.",
        "#hub-refresh": "Actualizar informe",
        ".weekly-brief-top span": "Informe semanal Forge",
        ".hub-section:nth-child(1) .eyebrow": "Radar competitivo",
        ".hub-section:nth-child(1) h2": "Torneos para seguir",
        ".hub-section:nth-child(2) .eyebrow": "Noticias oficiales",
        ".hub-section:nth-child(2) h2": "Novedades y actualizaciones",
        ".hub-section:nth-child(3) .eyebrow": "Mira y aprende",
        ".hub-section:nth-child(3) h2": "Videos recientes de la comunidad",
        ".hub-section:nth-child(3) .section-heading > p": "Seleccionados desde canales oficiales y creadores establecidos. Forge Atlas no republica su contenido.",
        ".source-standard .eyebrow": "Estándar de fuentes",
        ".source-standard > p": "Fechas y títulos vienen de la fuente enlazada. DeepSeek resume únicamente el material recuperado.",
        ".footer-brand p": "Recurso independiente creado por fans. No está afiliado con Microsoft ni con Age of Empires.",
        ".footer-links a:nth-child(2)": "Fuente de datos",
        "#credits-trigger": "Créditos de imágenes",
        ".search-dialog .dialog-topline > span": "Buscar en el atlas",
        ".pricing-dialog .dialog-topline > span": "Membresía Forge+",
        ".pricing-header .eyebrow": "Capa de producto monetizable",
        ".pricing-header > p:last-child": "Los jugadores pagan por personalización, continuidad y decisiones más rápidas, no por datos básicos."
      },
      html: {
        ".primary-nav [data-view-target=\"discover\"]": "Descubrir",
        ".primary-nav [data-view-target=\"civilizations\"]": "Civilizaciones",
        ".primary-nav [data-view-target=\"database\"]": "Base de datos",
        ".primary-nav [data-view-target=\"hub\"]": "Hub semanal <span class=\"nav-spark\">en vivo</span>",
        ".primary-nav [data-view-target=\"ai\"]": "Forge AI <span class=\"nav-spark\">nuevo</span>",
        ".mobile-nav [data-view-target=\"discover\"]": "<span>01</span>Inicio",
        ".mobile-nav [data-view-target=\"civilizations\"]": "<span>02</span>Civs",
        ".mobile-nav [data-view-target=\"database\"]": "<span>03</span>Atlas",
        ".mobile-nav [data-view-target=\"hub\"]": "<span>04</span>Hub",
        ".mobile-nav [data-view-target=\"ai\"]": "<span>05</span>IA",
        ".hero h1": "Conoce el duelo.<br><em>Domina la edad.</em>",
        ".hero-actions [data-view-target=\"civilizations\"]": "Explorar civilizaciones",
        ".hero-actions [data-view-target=\"ai\"]": "Preguntar a Forge AI <span aria-hidden=\"true\">-&gt;</span>",
        ".ai-stage h2": "Tu curiosidad después de la partida, convertida en ventaja.",
        ".plus-banner h2": "Pasa de consultar datos a construir tu propio playbook.",
        ".plus-banner .button": "Ver planes Forge+",
        "[data-view=\"civilizations\"] h1": "Elige una identidad,<br><em>no solo una bonificación.</em>",
        "[data-view=\"database\"] h1": "Cada pieza del juego.<br><em>Un solo campo claro.</em>",
        ".strategy-sidebar h1": "Pregunta mejor.<br><em>Juega más preciso.</em>",
        ".hub-hero h1": "Esta semana en<br><em>Age of Empires II.</em>",
        ".source-standard h2": "Primero los enlaces.<br>Después la IA.",
        ".pricing-header h2": "El atlas sigue abierto.<br><em>Las herramientas avanzadas llegan más lejos.</em>"
      },
      placeholders: {
        "#civ-search": "Buscar civilizaciones, bonos, estilos...",
        "#database-search": "Buscar en esta colección...",
        "#global-search": "Prueba Britons, trebuchet, química...",
        "#ai-question": "Pregunta por una civilización, counter, tecnología o plan de juego..."
      }
    },
    "pt-BR": {
      metaTitle: "Forge Atlas | Inteligência estratégica de AOE2",
      metaDescription: "Explore civilizações, unidades, tecnologias, torneios, vídeos e análises de Age of Empires II com IA.",
      ui: {
        records: "{count} registros",
        openBrief: "Abrir ficha",
        save: "Salvar",
        saved: "Salvo",
        compare: "Comparar",
        atlasRecord: "Registro do atlas",
        noCivs: "Nenhuma civilização corresponde a esta busca.",
        noRecords: "Nenhum registro corresponde a esta busca.",
        loading: "Carregando o atlas...",
        available: "Disponível",
        cost: "Custo",
        recordType: "Tipo de registro",
        atlasId: "ID do atlas",
        unitOptions: "Opções de unidades",
        technologyOptions: "Opções tecnológicas",
        quickFacts: "Dados rápidos",
        strategyContext: "Contexto estratégico",
        askAi: "Perguntar ao Forge AI",
        saveRecord: "Salvar registro",
        detailRecord: "Ficha de {type}",
        comparisonBrief: "Comparação lado a lado",
        compareTwo: "Comparar 2",
        freeLeft: "{remaining} / {limit} disponíveis",
        typeCivilization: "Civilização",
        typeUnit: "Unidade",
        typeBuilding: "Edifício",
        typeTechnology: "Tecnologia",
        aiWelcome: "Pergunte sobre uma civilização, unidade, tecnologia ou confronto. Vou consultar o atlas e transformar os registros relevantes em um resumo claro.",
        aiFresh: "Começamos de novo. Pergunte sobre uma civilização, unidade, tecnologia ou confronto e consultarei o atlas primeiro.",
        aiUsing: "Usando todo o atlas",
        aiContext: "Contexto: {name}",
        hubLoading: "Reunindo os sinais desta semana em fontes confiáveis de AOE2.",
        hubError: "As fontes semanais estão temporariamente indisponíveis. O atlas e a sala de estratégia continuam funcionando.",
        noTournaments: "Nenhum torneio atual foi retornado. Abra o calendário completo para ver a programação mais recente.",
        noNews: "Nenhuma nova notícia de AOE2 foi retornada nesta semana.",
        noVideos: "Nenhum vídeo recente foi retornado dos canais selecionados.",
        readSource: "Ler fonte",
        watchVideo: "Assistir vídeo",
        prize: "Premiação",
        ongoing: "Em andamento",
        upcoming: "Em breve",
        sourcesReady: "{count} itens com fonte",
        weeklyLabel: "Semana {week}",
        generatedAt: "Atualizado em {date}"
      },
      text: {
        ".hero .eyebrow": "Guia de campo independente",
        ".hero-lede": "Um atlas estratégico rápido e visual para quem quer respostas sem abrir dez abas. Explore toda a árvore tecnológica, compare opções e peça um resumo baseado em dados.",
        ".trust-row li:nth-child(1)": "Dados completos",
        ".trust-row li:nth-child(2)": "Com fontes",
        ".trust-row li:nth-child(3)": "Pronto para celular",
        ".stat-ribbon article:nth-child(1) span": "Civilizações",
        ".stat-ribbon article:nth-child(2) span": "Unidades",
        ".stat-ribbon article:nth-child(3) span": "Edifícios",
        ".stat-ribbon article:nth-child(4) span": "Tecnologias",
        ".stat-ribbon > p": "Um centro de comando para consultas rápidas e análises profundas.",
        ".journey-section .eyebrow": "Escolha sua vantagem",
        ".journey-section .section-heading h2": "Três caminhos para o atlas",
        ".journey-section .section-heading > p": "Com trinta segundos ou uma noite inteira, comece pela pergunta.",
        ".journey-card:nth-child(1) strong": "Encontre sua civilização",
        ".journey-card:nth-child(1) > span:not(.journey-number, .journey-icon)": "Explore identidades, bônus e o formato da árvore tecnológica.",
        ".journey-card:nth-child(1) b": "Abrir índice de civilizações ->",
        ".journey-card:nth-child(2) strong": "Compare o campo",
        ".journey-card:nth-child(2) > span:not(.journey-number, .journey-icon)": "Coloque unidades e edifícios lado a lado antes da partida.",
        ".journey-card:nth-child(2) b": "Abrir base de dados ->",
        ".journey-card:nth-child(3) strong": "Peça um plano de jogo",
        ".journey-card:nth-child(3) > span:not(.journey-number, .journey-icon)": "Transforme dados estruturados em um resumo do confronto.",
        ".journey-card:nth-child(3) b": "Perguntar ao Forge AI ->",
        ".featured-section .eyebrow": "Índice de civilizações",
        ".featured-section h2": "Comece com uma identidade",
        ".featured-section .text-button": "Ver todas ->",
        ".ai-stage .eyebrow": "Inteligência Forge",
        ".ai-stage-copy > p:not(.eyebrow)": "Pergunte por que um confronto pareceu impossível, o que uma tecnologia libera ou como duas unidades se comparam. O Forge AI consulta o atlas primeiro.",
        ".archive-section .eyebrow": "Arquivo visual",
        ".archive-section h2": "História sem o silêncio do museu",
        ".archive-section .section-heading > p": "Mapas e manuscritos de domínio público dão textura ao atlas sem usar arte protegida do jogo.",
        ".plus-banner .eyebrow": "Para jogadores recorrentes",
        ".plus-banner li:nth-child(1)": "Resumos estratégicos ilimitados",
        ".plus-banner li:nth-child(2)": "Confrontos e ordens salvos",
        ".plus-banner li:nth-child(3)": "Alertas de patches e treino personalizado",
        "[data-view=\"civilizations\"] .eyebrow": "Índice de civilizações",
        "[data-view=\"civilizations\"] .view-hero > p": "Pesquise o elenco completo, salve favoritos, abra fichas detalhadas ou compare duas civilizações.",
        "[data-view=\"database\"] .eyebrow": "Base de dados aberta",
        "[data-view=\"database\"] .view-hero > p": "Explore unidades, edifícios e tecnologias com dados rápidos, favoritos, comparações e IA contextual.",
        ".strategy-sidebar .eyebrow": "Inteligência Forge",
        ".strategy-sidebar > p:not(.eyebrow)": "O Forge AI recupera registros relevantes antes de responder. Os valores exatos sempre pertencem à fonte.",
        ".premium-list h2": "Melhores recursos premium",
        ".premium-list li:nth-child(1)": "Resumos ilimitados",
        ".premium-list li:nth-child(2)": "Coach personalizado de build orders",
        ".premium-list li:nth-child(3)": "Playbooks salvos na nuvem",
        ".premium-list li:nth-child(4)": "Alertas de mudanças",
        ".ai-disclaimer": "A IA pode errar. Confirme as estatísticas exatas antes de competir.",
        ".hub-hero .eyebrow": "Sinal semanal da comunidade",
        ".hub-hero-copy > p:not(.eyebrow)": "Um briefing com torneios atuais, notícias oficiais, vídeos da comunidade e um resumo de IA que separa fatos de recomendações.",
        "#hub-refresh": "Atualizar briefing",
        ".weekly-brief-top span": "Resumo semanal Forge",
        ".hub-section:nth-child(1) .eyebrow": "Radar competitivo",
        ".hub-section:nth-child(1) h2": "Torneios para acompanhar",
        ".hub-section:nth-child(2) .eyebrow": "Comunicados oficiais",
        ".hub-section:nth-child(2) h2": "Notícias e atualizações",
        ".hub-section:nth-child(3) .eyebrow": "Assista e aprenda",
        ".hub-section:nth-child(3) h2": "Vídeos recentes da comunidade",
        ".hub-section:nth-child(3) .section-heading > p": "Selecionados de canais oficiais e criadores estabelecidos. O Forge Atlas não republica o conteúdo.",
        ".source-standard .eyebrow": "Padrão de fontes",
        ".source-standard > p": "Datas e títulos vêm da fonte vinculada. O DeepSeek resume apenas o material recuperado.",
        ".footer-brand p": "Recurso independente criado por fãs. Não é afiliado à Microsoft ou à franquia Age of Empires.",
        ".footer-links a:nth-child(2)": "Fonte de dados",
        "#credits-trigger": "Créditos das imagens",
        ".search-dialog .dialog-topline > span": "Pesquisar no atlas",
        ".pricing-dialog .dialog-topline > span": "Assinatura Forge+",
        ".pricing-header .eyebrow": "Camada de produto monetizável",
        ".pricing-header > p:last-child": "Jogadores pagam por personalização, continuidade e decisões mais rápidas, não por fatos básicos."
      },
      html: {
        ".primary-nav [data-view-target=\"discover\"]": "Descobrir",
        ".primary-nav [data-view-target=\"civilizations\"]": "Civilizações",
        ".primary-nav [data-view-target=\"database\"]": "Base de dados",
        ".primary-nav [data-view-target=\"hub\"]": "Hub semanal <span class=\"nav-spark\">ao vivo</span>",
        ".primary-nav [data-view-target=\"ai\"]": "Forge AI <span class=\"nav-spark\">novo</span>",
        ".mobile-nav [data-view-target=\"discover\"]": "<span>01</span>Início",
        ".mobile-nav [data-view-target=\"civilizations\"]": "<span>02</span>Civs",
        ".mobile-nav [data-view-target=\"database\"]": "<span>03</span>Atlas",
        ".mobile-nav [data-view-target=\"hub\"]": "<span>04</span>Hub",
        ".mobile-nav [data-view-target=\"ai\"]": "<span>05</span>IA",
        ".hero h1": "Conheça o duelo.<br><em>Domine a era.</em>",
        ".hero-actions [data-view-target=\"civilizations\"]": "Explorar civilizações",
        ".hero-actions [data-view-target=\"ai\"]": "Perguntar ao Forge AI <span aria-hidden=\"true\">-&gt;</span>",
        ".ai-stage h2": "Sua curiosidade depois da partida, transformada em vantagem.",
        ".plus-banner h2": "Passe de consultar dados a construir seu próprio playbook.",
        ".plus-banner .button": "Ver planos Forge+",
        "[data-view=\"civilizations\"] h1": "Escolha uma identidade,<br><em>não apenas um bônus.</em>",
        "[data-view=\"database\"] h1": "Cada parte do jogo.<br><em>Um único campo claro.</em>",
        ".strategy-sidebar h1": "Pergunte melhor.<br><em>Jogue com precisão.</em>",
        ".hub-hero h1": "Esta semana em<br><em>Age of Empires II.</em>",
        ".source-standard h2": "Primeiro os links.<br>Depois a IA.",
        ".pricing-header h2": "O atlas continua aberto.<br><em>As ferramentas avançadas vão além.</em>"
      },
      placeholders: {
        "#civ-search": "Buscar civilizações, bônus, estilos...",
        "#database-search": "Buscar nesta coleção...",
        "#global-search": "Tente Britons, trebuchet, química...",
        "#ai-question": "Pergunte sobre uma civilização, counter, tecnologia ou plano de jogo..."
      }
    }
  };

  function detectLocale() {
    var path = window.location.pathname.toLowerCase();
    if (path === "/es" || path.indexOf("/es/") === 0) {
      return "es";
    }
    if (path === "/pt-br" || path.indexOf("/pt-br/") === 0) {
      return "pt-BR";
    }
    return "en";
  }

  function format(template, variables) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return variables && variables[key] !== undefined ? variables[key] : "";
    });
  }

  function t(key, variables) {
    var pack = packs[locale] || packs.en;
    var value = pack.ui[key];
    if (value === undefined) {
      value = packs.en.ui[key] || key;
    }
    return format(value, variables);
  }

  function applyMap(map, property) {
    Object.keys(map || {}).forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        node[property] = map[selector];
      });
    });
  }

  function apply() {
    var pack = packs[locale] || packs.en;
    document.documentElement.lang = locale;
    document.title = pack.metaTitle;
    var description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", pack.metaDescription);
    }
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", canonicalUrl());
    }
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", canonicalUrl());
    }
    applyMap(pack.text, "textContent");
    applyMap(pack.html, "innerHTML");
    Object.keys(pack.placeholders || {}).forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        node.setAttribute("placeholder", pack.placeholders[selector]);
      });
    });
    document.querySelectorAll("[data-locale-link]").forEach(function (link) {
      var active = link.getAttribute("data-locale-link") === locale;
      link.classList.toggle("is-active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    });
    try {
      localStorage.setItem("forge-atlas-locale", locale);
    } catch (error) {
      return;
    }
  }

  function canonicalUrl() {
    if (locale === "es") {
      return "https://aoe2-forge-atlas.vercel.app/es";
    }
    if (locale === "pt-BR") {
      return "https://aoe2-forge-atlas.vercel.app/pt-br";
    }
    return "https://aoe2-forge-atlas.vercel.app/";
  }

  function localePath(target) {
    if (target === "es") {
      return "/es";
    }
    if (target === "pt-BR") {
      return "/pt-br";
    }
    return "/";
  }

  window.ForgeI18n = {
    locale: locale,
    t: t,
    apply: apply,
    pathFor: localePath,
    canonicalUrl: canonicalUrl
  };
})();
