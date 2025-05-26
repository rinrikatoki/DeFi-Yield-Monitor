// Multi-select dropdown logic with search, select all, deselect all
function createMultiSelectDropdown({ id, title, values, onChange, searchable = false }) {
  const container = document.getElementById(id);
  container.classList.add('dropdown');
  container.innerHTML = `<div class="dropdown-toggle">${title} (<span class="count">${values.length}</span>)</div><div class="dropdown-menu"></div>`;

  const toggle = container.querySelector('.dropdown-toggle');
  const countSpan = toggle.querySelector('.count');
  const menu = container.querySelector('.dropdown-menu');
  let selected = new Set(values);
  let displayed = [...values];
  let currentQuery = '';

  const updateSelection = () => {
    countSpan.textContent = selected.size;
    onChange([...selected]);
  };

  const sortSearchResults = (list, query) => {
    return list.sort((a, b) => {
      const aIndex = a.toLowerCase().indexOf(query);
      const bIndex = b.toLowerCase().indexOf(query);
      return (aIndex === bIndex) ? a.localeCompare(b) : aIndex - bIndex;
    });
  };

  const renderOptions = (list) => {
    menu.innerHTML = '';
    
    if (searchable) {
      const input = document.createElement('input');
      input.className = 'dropdown-search';
      input.placeholder = 'Search...';
      input.style.width = 'calc(100% - 32px)';
      input.style.margin = '12px 16px';
      input.style.padding = '12px 16px';
      input.style.border = '1px solid var(--border)';
      input.style.borderRadius = 'var(--radius)';
      input.style.background = 'var(--card)';
      input.style.color = 'var(--text)';
      input.style.fontSize = '16px';
      input.setAttribute('inputmode', 'text');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'none');

      // Prevent propagation for mobile devices
      input.addEventListener('click', e => {
        e.stopPropagation();
        if (window.innerWidth <= 768) {
          e.preventDefault();
          container.classList.add('open');
        }
      });

      input.addEventListener('focus', e => {
        if (window.innerWidth <= 768) {
          container.classList.add('open');
        }
      });

      input.addEventListener('keydown', e => e.stopPropagation());
      input.addEventListener('touchstart', e => e.stopPropagation());

      input.oninput = () => {
        currentQuery = input.value.toLowerCase();
        const filtered = sortSearchResults(
          values.filter(v => v.toLowerCase().includes(currentQuery)),
          currentQuery
        );
        renderOptions(filtered);
        const newInput = menu.querySelector('input.dropdown-search');
        if (newInput) {
          newInput.value = currentQuery;
          if (window.innerWidth > 768) {
            newInput.focus({ preventScroll: true });
          }
        }
      };

      menu.appendChild(input);
      
      // Only auto-focus on desktop to prevent mobile keyboard issues
      if (window.innerWidth > 768) {
        setTimeout(() => input.focus({ preventScroll: true }), 0);
      }
    }

    const controlBar = document.createElement('div');
    controlBar.style.padding = '8px 16px';
    controlBar.style.display = 'flex';
    controlBar.style.justifyContent = 'space-between';
    controlBar.style.gap = '8px';
    controlBar.style.borderBottom = '1px solid var(--border)';
    controlBar.innerHTML = `
      <button type="button" style="flex:1; padding: 8px; border-radius: var(--radius); background:var(--card); border:1px solid var(--border); color:var(--text)">Select All</button>
      <button type="button" style="flex:1; padding: 8px; border-radius: var(--radius); background:var(--card); border:1px solid var(--border); color:var(--text)">Deselect All</button>
    `;
    
    const [selectAllBtn, deselectAllBtn] = controlBar.querySelectorAll('button');
    
    selectAllBtn.onclick = (e) => {
      e.stopPropagation();
      selected = new Set(values);
      updateSelection();
      renderOptions(list);
    };
    
    deselectAllBtn.onclick = (e) => {
      e.stopPropagation();
      selected = new Set();
      updateSelection();
      renderOptions(list);
    };
    
    menu.appendChild(controlBar);

    if (list.length === 0) {
      const noResult = document.createElement('div');
      noResult.textContent = 'No results found';
      noResult.style.padding = '16px';
      noResult.style.textAlign = 'center';
      noResult.style.color = 'var(--text-secondary)';
      menu.appendChild(noResult);
      return;
    }

    list.forEach(v => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.padding = '12px 16px';
      label.style.cursor = 'pointer';
      label.style.borderBottom = '1px solid var(--border)';
      label.style.fontSize = '16px';
      label.style.userSelect = 'none';
      label.style.transition = 'background 0.2s';
      label.innerHTML = `
        <input type="checkbox" style="margin-right: 12px; width: 18px; height: 18px;" value="${v}" ${selected.has(v) ? 'checked' : ''}>
        <span>${v}</span>
      `;
      
      const checkbox = label.querySelector('input');
      checkbox.onchange = (e) => {
        e.stopPropagation();
        if (checkbox.checked) selected.add(v);
        else selected.delete(v);
        updateSelection();
      };
      
      label.onclick = (e) => {
        if (e.target.tagName !== 'INPUT') {
          checkbox.checked = !checkbox.checked;
          if (checkbox.checked) selected.add(v);
          else selected.delete(v);
          updateSelection();
        }
      };
      
      menu.appendChild(label);
    });
  };

  renderOptions(displayed);

  toggle.onclick = (e) => {
    // On mobile, only toggle if dropdown is closed
    if (window.innerWidth > 768 || !container.classList.contains('open')) {
      e.stopPropagation();
      document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
      container.classList.toggle('open');
    }
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });

  // Handle mobile virtual keyboard close
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) return;
    const input = container.querySelector('input.dropdown-search');
    if (input && document.activeElement === input) {
      input.blur();
    }
  });

  updateSelection();
}

// Main integration
document.addEventListener('DOMContentLoaded', () => {
  let pools = [];
  let protocolSet = [], chainSet = [], tokenSet = [];
  let selectedProtocols = [], selectedChains = [], selectedTokens = [];

  const el = {
    search: document.getElementById("search"),
    sort: document.getElementById("sort"),
    refresh: document.getElementById("refresh"),
    lang: document.getElementById("lang"),
    toggleTheme: document.getElementById("toggle-theme"),
    title: document.getElementById("title"),
    container: document.getElementById("yield-list"),
    loader: document.getElementById("loader"),
    loadMore: document.getElementById("load-more")
  };

  const translations = {
    en: {
      title: "Top DeFi Yields",
      loading: "Loading...",
      searchPlaceholder: "Search...",
      loadMore: "Load More",
      platform: "Platform",
      pool: "Pool",
      apy: "APY",
      tvl: "TVL",
      stablecoin: "Stablecoin",
      rewards: "Rewards",
      noResults: "No results found."
    },
    fa: {
      title: "بیشترین سودهای دیفای",
      loading: "در حال بارگذاری...",
      searchPlaceholder: "جستجو...",
      loadMore: "بیشتر",
      platform: "پلتفرم",
      pool: "استخر",
      apy: "سود سالانه",
      tvl: "TVL",
      stablecoin: "استیبل‌کوین",
      rewards: "جوایز",
      noResults: "نتیجه‌ای یافت نشد."
    }
  };

  let currentLang = "en";
  function t(key) {
    return translations[currentLang][key];
  }
  function faDigits(s) {
    return s.toString().replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  }
  function format(val) {
    return currentLang === "fa" ? faDigits(val) : val;
  }
  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    el.title.textContent = t("title");
    el.search.placeholder = t("searchPlaceholder");
    el.loadMore.textContent = t("loadMore");
    render();
  }

  function applyTheme(toggle = false) {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    const newTheme = toggle ? (isDark ? "light" : "dark") : (Telegram.WebApp.colorScheme || "light");
    document.body.setAttribute("data-theme", newTheme);
  }

  const fetchAndInit = async () => {
    el.loader.style.display = "block";
    const res = await fetch('https://yields.llama.fi/pools');
    const data = await res.json();
    pools = data.data.filter(p => p.apy > 0);

    protocolSet = [...new Set(pools.map(p => p.project))].sort();
    chainSet = [...new Set(pools.map(p => p.chain))].sort();
    tokenSet = [...new Set(pools.map(p => p.symbol))].sort();

    createMultiSelectDropdown({
      id: 'protocol-dropdown',
      title: 'Protocols',
      values: protocolSet,
      searchable: true,
      onChange: v => { selectedProtocols = v; render(); },
    });
    createMultiSelectDropdown({
      id: 'chain-dropdown',
      title: 'Chains',
      values: chainSet,
      searchable: true,
      onChange: v => { selectedChains = v; render(); },
    });
    createMultiSelectDropdown({
      id: 'token-dropdown',
      title: 'Tokens',
      values: tokenSet,
      searchable: true,
      loadMore: true,
      onChange: v => { selectedTokens = v; render(); },
    });

    el.loader.style.display = "none";
    render();
  };

  function render() {
    el.container.innerHTML = '';
    el.loader.style.display = 'block';
    const search = el.search.value.toLowerCase();
    const sort = el.sort.value;

    let filtered = pools.filter(p =>
      selectedProtocols.includes(p.project) &&
      selectedChains.includes(p.chain) &&
      selectedTokens.includes(p.symbol) &&
      (!search || [p.project, p.symbol, p.chain, p.pool].some(v => v?.toLowerCase().includes(search)))
    );

    if (sort === 'apy') filtered.sort((a, b) => b.apy - a.apy);
    else if (sort === 'tvl') filtered.sort((a, b) => b.tvlUsd - a.tvlUsd);
    else filtered.sort((a, b) => a.project.localeCompare(b.project));

    const chunk = filtered.slice(0, 20);
    for (const pool of chunk) {
      const div = document.createElement('div');
      div.className = 'pool';
      div.innerHTML = `
        <h3>${pool.project} — ${pool.symbol}</h3>
        <div class="meta">${t("platform")}: ${pool.chain} | ${t("pool")}: ${pool.pool}</div>
        <div class="yield">${t("apy")}: ${format(pool.apy.toFixed(2))}%</div>
        <div class="extra">
          ${t("tvl")}: $${format((pool.tvlUsd || 0).toLocaleString())}<br>
          ${t("stablecoin")}: ${pool.stablecoin ? '✅' : '❌'}<br>
          ${t("rewards")}: ${pool.rewardTokens ? pool.rewardTokens.join(', ') : '-'}
        </div>
      `;
      el.container.appendChild(div);
    }

    if (filtered.length === 0) {
      el.container.innerHTML = `<p style="text-align:center;">${t("noResults")}</p>`;
    }
    el.loader.style.display = 'none';
  }

  el.search.oninput = () => render();
  el.sort.onchange = () => render();
  el.refresh.onclick = () => fetchAndInit();
  el.lang.onchange = () => applyLanguage(el.lang.value);
  el.toggleTheme.onclick = () => applyTheme(true);

  applyTheme();
  applyLanguage("en");
  fetchAndInit();
});