// Multi-select dropdown logic
function createMultiSelectDropdown({ id, title, values, onChange, searchable = false, loadMore = false, chunkSize = 20 }) {
  const container = document.getElementById(id);
  container.classList.add('dropdown');
  container.innerHTML = `<div class="dropdown-toggle">${title}</div><div class="dropdown-menu"></div>`;

  const toggle = container.querySelector('.dropdown-toggle');
  const menu = container.querySelector('.dropdown-menu');
  let selected = new Set(values);
  let displayed = values.slice(0, chunkSize);

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

  toggle.onclick = () => {
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

  const fetchAndInit = async () => {
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
  };

  function render() {
    const search = document.getElementById('search').value.toLowerCase();
    const sort = document.getElementById('sort').value;
    const list = document.getElementById('yield-list');
    const loader = document.getElementById('loader');

    list.innerHTML = '';
    loader.style.display = 'block';

    let filtered = pools.filter(p =>
      (selectedProtocols.includes(p.project)) &&
      (selectedChains.includes(p.chain)) &&
      (selectedTokens.includes(p.symbol)) &&
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
        <div class="meta">Platform: ${pool.chain} | Pool: ${pool.pool}</div>
        <div class="yield">APY: ${pool.apy.toFixed(2)}%</div>
        <div class="extra">
          TVL: $${(pool.tvlUsd || 0).toLocaleString()}<br>
          Stablecoin: ${pool.stablecoin ? '✅' : '❌'}<br>
          Rewards: ${pool.rewardTokens ? pool.rewardTokens.join(', ') : '-'}
        </div>
      `;
      list.appendChild(div);
    }

    loader.style.display = 'none';
  }

  document.getElementById('search').oninput = () => render();
  document.getElementById('sort').onchange = () => render();

  fetchAndInit();
});