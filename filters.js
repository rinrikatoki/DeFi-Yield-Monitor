// Multi-select dropdown logic with search, select all, deselect all
function createMultiSelectDropdown({ id, title, values, onChange, searchable = false }) {
  const container = document.getElementById(id);
  container.classList.add('dropdown');
  container.innerHTML = `<div class="dropdown-toggle">${title} (<span class="count">${values.length}</span>)</div><div class="dropdown-menu"></div>`;

  const toggle = container.querySelector('.dropdown-toggle');
  const countSpan = toggle.querySelector('.count');
  const menu = container.querySelector('.dropdown-menu');
  let selected = new Set();
  let currentQuery = '';
  let isMobileKeyboardOpen = false;

  // Update selection display and callback
  const updateSelection = () => {
    countSpan.textContent = selected.size;
    onChange([...selected]);
  };

  // Filter and sort functionality
  const filterResults = (query) => {
    return values
      .filter(v => v.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  };

  // Render dropdown content
  const renderOptions = (filteredValues) => {
    menu.innerHTML = '';

    // Search input
    if (searchable) {
      const input = document.createElement('input');
      input.className = 'dropdown-search';
      input.placeholder = 'Search...';
      input.value = currentQuery;
      Object.assign(input.style, {
        width: 'calc(100% - 32px)',
        margin: '12px 16px',
        padding: '12px 16px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--card)',
        color: 'var(--text)',
        fontSize: window.innerWidth <= 768 ? '14px' : '16px'
      });

      input.addEventListener('input', (e) => {
        currentQuery = e.target.value;
        renderOptions(filterResults(currentQuery));
      });

      menu.appendChild(input);
    }

    // Control buttons
    const controlBar = document.createElement('div');
    controlBar.style.cssText = `
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid var(--border);
    `;
    
    controlBar.innerHTML = `
      <button type="button" class="select-all" style="flex:1; padding: 8px; border-radius: var(--radius); background:var(--card); border:1px solid var(--border); color:var(--text)">
        Select All
      </button>
      <button type="button" class="deselect-all" style="flex:1; padding: 8px; border-radius: var(--radius); background:var(--card); border:1px solid var(--border); color:var(--text)">
        Deselect All
      </button>
    `;

    controlBar.querySelector('.select-all').addEventListener('click', () => {
      selected = new Set(values);
      updateSelection();
      renderOptions(filterResults(currentQuery));
    });

    controlBar.querySelector('.deselect-all').addEventListener('click', () => {
      selected.clear();
      updateSelection();
      renderOptions(filterResults(currentQuery));
    });

    menu.appendChild(controlBar);

    // Options list
    const listContainer = document.createElement('div');
    if (filteredValues.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = 'No results found';
      noResults.style.cssText = `
        padding: 16px;
        text-align: center;
        color: var(--text-secondary);
      `;
      listContainer.appendChild(noResults);
    } else {
      filteredValues.forEach(value => {
        const label = document.createElement('label');
        label.style.cssText = `
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          font-size: 16px;
          user-select: none;
          transition: background 0.2s;
        `;

        label.innerHTML = `
          <input 
            type="checkbox" 
            style="margin-right: 12px; width: 18px; height: 18px" 
            ${selected.has(value) ? 'checked' : ''}
          >
          <span>${value}</span>
        `;

        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', () => {
          checkbox.checked ? selected.add(value) : selected.delete(value);
          updateSelection();
        });

        listContainer.appendChild(label);
      });
    }

    menu.appendChild(listContainer);
  };

  // Toggle dropdown
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = container.classList.contains('open');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown').forEach(d => {
      if (d !== container) d.classList.remove('open');
    });

    if (!isOpen) {
      container.classList.add('open');
      renderOptions(filterResults(currentQuery));
      if (searchable) {
        setTimeout(() => {
          const input = menu.querySelector('input');
          if (input) input.focus();
        }, 50);
      }
    } else {
      container.classList.remove('open');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });

  // Handle mobile keyboard
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      isMobileKeyboardOpen = false;
    }
  });

  // Initial setup
  renderOptions(values);
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

  document.addEventListener('touchstart', function(e) {
    if (window.innerWidth > 768) return;
    
    // بستن dropdownها وقتی روی جای دیگری از صفحه کلیک می‌شود
    const dropdowns = document.querySelectorAll('.dropdown');
    let isDropdownClicked = false;
    
    dropdowns.forEach(dropdown => {
      if (dropdown.contains(e.target)) {
        isDropdownClicked = true;
      }
    });
    
    if (!isDropdownClicked) {
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('open');
      });
    }
  }, { passive: true });
});