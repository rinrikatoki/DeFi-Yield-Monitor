// Multi-select dropdown logic
function createMultiSelectDropdown({ id, title, values, onChange, searchable = false, loadMore = false, chunkSize = 20 }) {
  const container = document.getElementById(id);
  container.classList.add('dropdown');
  container.innerHTML = `<div class="dropdown-toggle">${title}</div><div class="dropdown-menu"></div>`;

  const toggle = container.querySelector('.dropdown-toggle');
  const menu = container.querySelector('.dropdown-menu');
  let selected = new Set(values);
  let displayed = [...values];

  const renderOptions = (list) => {
    menu.innerHTML = '';
    if (searchable) {
      const input = document.createElement('input');
      input.className = 'dropdown-search';
      input.placeholder = 'Search...';
      input.oninput = () => {
        const q = input.value.toLowerCase();
        const filtered = values.filter(v => v.toLowerCase().includes(q));
        renderOptions(filtered);
      };
      menu.appendChild(input);
      input.focus();
    }
    list.forEach(v => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${v}" checked> ${v}`;
      const checkbox = label.querySelector('input');
      checkbox.onchange = () => {
        if (checkbox.checked) selected.add(v);
        else selected.delete(v);
        onChange([...selected]);
      };
      menu.appendChild(label);
    });
    if (loadMore && list.length < values.length) {
      const btn = document.createElement('button');
      btn.textContent = 'Load More';
      btn.onclick = () => {
        displayed = values.slice(0, displayed.length + chunkSize);
        renderOptions(displayed);
      };
      menu.appendChild(btn);
    }
  };

  renderOptions(displayed);

  toggle.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    container.classList.toggle('open');
  };

  document.addEventListener('click', e => {
    if (!container.contains(e.target)) container.classList.remove('open');
  });

  onChange([...selected]);
}

// Example usage integration
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
      onChange: v => { selectedProtocols = v; render(); },
    });
    createMultiSelectDropdown({
      id: 'chain-dropdown',
      title: 'Chains',
      values: chainSet,
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