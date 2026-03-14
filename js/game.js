const Game = (() => {
  /* ── State ── */
  let players = [];
  let currentIdx = 0;
  let pile = [];
  let phase = 'setup';        // setup | playing | comparing | ended
  let revealedStat = null;
  let xrayOn = false;

  const defaultPlayers = [
    { name: 'Spieler 1', type: 'human' },
    { name: 'Computer',  type: 'ai' }
  ];
  let setupPlayers = [...defaultPlayers];

  /* ── Helpers ── */
  const $ = id => document.getElementById(id);
  const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const fmt = (k,v) => k==='firstFlight' ? v : v.toLocaleString('de-DE');
  const activePlayers = () => players.filter(p => p.deck.length > 0);

  /* ── Screens ── */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id + '-screen').classList.add('active');
    if (id === 'setup') renderSetup();
  }

  /* ─── SETUP ─────────────────────────────────────────── */
  function renderSetup() {
    const el = $('players-config');
    const totalCards = FlugzeugData.getAll().length;
    el.innerHTML = setupPlayers.map((p, i) => `
      <div class="player-setup-row slide-in" style="animation-delay:${i*80}ms">
        <div class="player-color" style="background:${PLAYER_COLORS[i]}"></div>
        <input type="text" value="${p.name}" placeholder="Name…"
               onchange="Game.setPlayerName(${i}, this.value)">
        <div class="type-toggle">
          <button type="button" class="${p.type==='human'?'active':''}"
                  onclick="Game.setPlayerType(${i},'human')">🧑 Mensch</button>
          <button type="button" class="${p.type==='ai'?'active':''}"
                  onclick="Game.setPlayerType(${i},'ai')">🤖 KI</button>
        </div>
        ${setupPlayers.length > 2 ? `<button class="player-remove" onclick="Game.removePlayer(${i})">✕</button>` : ''}
      </div>`).join('');

    $('add-player-btn').style.display = setupPlayers.length >= 6 ? 'none' : '';
    $('setup-card-info').textContent =
      `${totalCards} Karten • ${Math.floor(totalCards / setupPlayers.length)} pro Spieler`;
    $('start-game-btn').disabled = setupPlayers.length < 2;
  }

  function addPlayer() {
    if (setupPlayers.length >= 6) return;
    const n = setupPlayers.length + 1;
    setupPlayers.push({ name: `Spieler ${n}`, type: 'human' });
    renderSetup();
  }
  function removePlayer(i) {
    if (setupPlayers.length <= 2) return;
    setupPlayers.splice(i, 1);
    renderSetup();
  }
  function setPlayerName(i, name) { setupPlayers[i].name = name.trim() || `Spieler ${i+1}`; }
  function setPlayerType(i, type) { setupPlayers[i].type = type; renderSetup(); }

  /* ─── START ─────────────────────────────────────────── */
  function start() {
    const allCards = FlugzeugData.getAll();
    if (allCards.length < setupPlayers.length * 2) {
      alert('Zu wenige Karten für so viele Spieler!');
      return;
    }
    const shuffled = shuffle(allCards);
    players = setupPlayers.map((p, i) => ({
      ...p,
      idx: i,
      color: PLAYER_COLORS[i],
      icon: p.type === 'ai' ? '🤖' : PLAYER_ICONS[i] || '🧑',
      deck: []
    }));

    let ci = 0;
    shuffled.forEach(card => { players[ci % players.length].deck.push(card); ci++; });

    currentIdx = 0;
    pile = [];
    phase = 'playing';
    revealedStat = null;
    showScreen('game');
    renderGame();

    ImageCache.fetchAll();
  }

  /* ─── RENDER GAME ───────────────────────────────────── */
  function renderGame() {
    renderPlayerBar();
    renderActiveCard();
    renderOpponents();
    renderXrayPanel();
    updateMessage();

    if (phase === 'playing' && current().type === 'ai') {
      setTimeout(aiTurn, 1000 + Math.random() * 800);
    }
  }

  function current() { return players[currentIdx]; }

  function renderPlayerBar() {
    $('player-bar').innerHTML = players.map((p, i) => {
      const cls = [
        'player-chip',
        i === currentIdx && phase !== 'ended' ? 'active-turn' : '',
        p.deck.length === 0 ? 'eliminated' : ''
      ].filter(Boolean).join(' ');
      return `<div class="${cls}">
        <span class="chip-dot" style="background:${p.color}"></span>
        ${p.icon} ${p.name}
        <span class="chip-count">${p.deck.length}</span>
      </div>`;
    }).join('');
  }

  function renderActiveCard() {
    const p = current();
    $('active-label').innerHTML =
      `<span style="color:${p.color}">${p.icon} ${p.name}</span>`;

    if (!p.deck.length) { $('active-card').innerHTML = ''; return; }
    const card = p.deck[0];
    const isClickable = p.type === 'human' && phase === 'playing';
    $('active-card').innerHTML =
      `<div class="card-front card-enter">${renderCardFrontHTML(card, isClickable)}</div>`;
    $('active-card').classList.remove('flipped');
  }

  function renderOpponents() {
    const opps = players.filter((_, i) => i !== currentIdx);
    $('opponents-area').innerHTML = opps.map(p => {
      if (p.deck.length === 0) {
        return `<div class="opponent-slot" style="opacity:.3">
          <span class="opp-label"><span class="opp-dot" style="background:${p.color}"></span>${p.icon} ${p.name} – raus!</span>
        </div>`;
      }
      const card = p.deck[0];
      const showFront = xrayOn || (phase === 'comparing' && revealedStat);
      return `<div class="opponent-slot">
        <span class="opp-label"><span class="opp-dot" style="background:${p.color}"></span>${p.icon} ${p.name} (${p.deck.length})</span>
        <div class="card small ${showFront ? '' : 'flipped'}">
          <div class="card-front">${renderCardFrontHTML(card, false)}</div>
          <div class="card-back"><div class="card-back-pattern"><span class="back-icon">✈️</span><span class="back-text">Quartett</span></div></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderCardFrontHTML(card, clickable) {
    const gc = GROUP_COLORS[card.group] || { bg: '#555' };
    const imgUrl = ImageCache.get(card.id);
    const imgHtml = imgUrl
      ? `<div class="card-image"><img src="${imgUrl}" alt="${card.name}" onerror="this.parentNode.innerHTML='<span class=card-emoji>${card.emoji||'✈️'}</span>'"></div>`
      : `<div class="card-image"><span class="card-emoji">${card.emoji || '✈️'}</span></div>`;

    const statKeys = Object.keys(STAT_META);
    const rows = statKeys.map(key => {
      const meta = STAT_META[key];
      const val = card.stats[key];
      const cls = [
        clickable ? 'clickable' : '',
        revealedStat === key ? 'selected-stat' : ''
      ].filter(Boolean).join(' ');
      const onclick = clickable ? `onclick="Game.selectStat('${key}')"` : '';
      return `<tr class="${cls}" data-stat="${key}" ${onclick}>
        <td>${meta.icon} ${meta.label}</td>
        <td>${fmt(key, val)}${meta.unit ? ' '+meta.unit : ''}</td>
      </tr>`;
    }).join('');

    return `
      <div class="card-header" style="background:${gc.bg}">
        <span class="card-group-badge">${card.group}${card.number}</span>
        <span class="card-category">${card.category || ''}</span>
      </div>
      ${imgHtml}
      <div class="card-name">${card.name}</div>
      <div class="card-stats"><table>${rows}</table></div>`;
  }

  function updateMessage() {
    const p = current();
    if (phase === 'playing') {
      $('message-bar').innerHTML = p.type === 'human'
        ? `⬅️ <strong>${p.name}</strong>, wähle eine Eigenschaft!`
        : `🤖 <strong>${p.name}</strong> denkt nach…`;
    }
  }

  /* ─── STAT SELECTION ────────────────────────────────── */
  function selectStat(key) {
    if (phase !== 'playing' || current().type !== 'human') return;
    doCompare(key);
  }

  function aiTurn() {
    if (phase !== 'playing') return;
    if (current().type === 'human') return;

    const card = current().deck[0];
    if (!card) return;

    const statKeys = Object.keys(STAT_META);
    const all = FlugzeugData.getAll();
    let best = statKeys[0], bestNorm = -1;
    statKeys.forEach(k => {
      const max = Math.max(...all.map(a => a.stats[k] || 0));
      const norm = max > 0 ? card.stats[k] / max : 0;
      if (norm > bestNorm) { bestNorm = norm; best = k; }
    });
    doCompare(best);
  }

  function doCompare(statKey) {
    phase = 'comparing';
    revealedStat = statKey;

    renderActiveCard();
    renderOpponents();
    highlightCards(statKey);

    const active = activePlayers();
    const entries = active.map(p => ({
      player: p,
      card: p.deck[0],
      value: p.deck[0].stats[statKey]
    }));

    const maxVal = Math.max(...entries.map(e => e.value));
    const winners = entries.filter(e => e.value === maxVal);

    setTimeout(() => {
      if (winners.length === 1) {
        const winner = winners[0].player;
        const wonCards = [];
        active.forEach(p => { wonCards.push(p.deck.shift()); });
        wonCards.push(...pile);
        pile = [];
        winner.deck.push(...wonCards);
        currentIdx = winner.idx;
        showResultOverlay(statKey, entries, winner, wonCards.length);
      } else {
        active.forEach(p => { pile.push(p.deck.shift()); });
        showResultOverlay(statKey, entries, null, 0);
      }
    }, 700);
  }

  function highlightCards(statKey) {
    document.querySelectorAll(`tr[data-stat]`).forEach(tr => {
      tr.classList.remove('highlight-win','highlight-lose','highlight-tie','selected-stat','clickable');
      tr.removeAttribute('onclick');
    });
    document.querySelectorAll(`tr[data-stat="${statKey}"]`).forEach(tr => {
      tr.classList.add('selected-stat');
    });
  }

  /* ─── RESULT OVERLAY ────────────────────────────────── */
  function showResultOverlay(statKey, entries, winner, wonCount) {
    const meta = STAT_META[statKey];
    const isTie = !winner;

    $('result-icon').textContent = isTie ? '🤝' : '🎉';
    $('result-title').textContent = isTie
      ? 'Unentschieden!'
      : `${winner.icon} ${winner.name} gewinnt!`;

    const sorted = [...entries].sort((a,b) => b.value - a.value);
    let compareHtml = `<div class="result-stat-label">${meta.icon} ${meta.label}</div>`;
    sorted.forEach(e => {
      const isW = winner && e.player.idx === winner.idx;
      compareHtml += `<div class="result-row ${isW ? 'winner' : ''}">
        <span class="rr-dot" style="background:${e.player.color}"></span>
        <span class="rr-name">${e.player.icon} ${e.player.name}</span>
        <span class="rr-aircraft">${e.card.name}</span>
        <span class="rr-value">${fmt(statKey, e.value)}${meta.unit ? ' '+meta.unit : ''}</span>
      </div>`;
    });
    $('result-compare').innerHTML = compareHtml;

    $('result-text').textContent = isTie
      ? `${pile.length} Karte(n) liegen auf dem Stapel.`
      : `+${wonCount} Karte(n)!`;

    $('result-overlay').classList.add('active');
  }

  /* ─── NEXT ROUND ────────────────────────────────────── */
  function nextRound() {
    $('result-overlay').classList.remove('active');
    revealedStat = null;

    const alive = activePlayers();
    if (alive.length <= 1) {
      endGame(alive[0] || null);
      return;
    }

    if (!players[currentIdx].deck.length) {
      advanceTurn();
    }

    phase = 'playing';
    renderGame();
  }

  function advanceTurn() {
    let tries = 0;
    do { currentIdx = (currentIdx + 1) % players.length; tries++; }
    while (players[currentIdx].deck.length === 0 && tries < players.length);
  }

  /* ─── END GAME ──────────────────────────────────────── */
  function endGame(winner) {
    phase = 'ended';
    showScreen('end');
    if (winner) {
      $('end-icon').textContent = '🏆';
      $('end-title').innerHTML = `<span style="color:${winner.color}">${winner.icon} ${winner.name}</span> gewinnt!`;
      $('end-text').textContent = `Alle ${winner.deck.length} Karten gesammelt!`;
      if (winner.type === 'human') launchConfetti();
    } else {
      $('end-icon').textContent = '🤷';
      $('end-title').textContent = 'Unentschieden!';
      $('end-text').textContent = '';
    }
  }

  /* ─── CONFETTI ──────────────────────────────────────── */
  function launchConfetti() {
    const c = $('confetti-canvas'), ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const cols = ['#f1c40f','#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22','#1abc9c'];
    const parts = Array.from({length:150},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height-c.height,
      w:Math.random()*10+5, h:Math.random()*6+3,
      color:cols[Math.random()*cols.length|0],
      speed:Math.random()*3+2, angle:Math.random()*Math.PI*2,
      spin:(Math.random()-.5)*.2, drift:(Math.random()-.5)*2
    }));
    let f=0;
    (function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      parts.forEach(p=>{p.y+=p.speed;p.x+=p.drift;p.angle+=p.spin;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
      if(++f<200)requestAnimationFrame(draw);else ctx.clearRect(0,0,c.width,c.height);
    })();
  }

  /* ═══════════════════════════════════════════════════════
     ██  CHEATS  ██
     ═══════════════════════════════════════════════════════ */

  const MEGA_PRE  = ['Turbo','Mega','Ultra','Hyper','Super','Blitz','Donner','Laser','Plasma','Quanten','Nitro','Astro','Cyber','Titan'];
  const MEGA_MID  = ['Jet','Falke','Adler','Drache','Phönix','Titan','Hammer','Rakete','Stern','Panzer','Wolf','Hai','Kraken','Komet'];
  const MEGA_SUF  = ['9000','X','Pro Max','Supreme','Ultimate','Infinity','Omega','Extreme','Z','Plus Ultra','EX','Deluxe','Destroyer','3000'];
  const MEGA_EMO  = ['🚀','💥','⚡','🔥','💎','🌟','🦅','🐉','☄️','👑','💀','🛸','🌪️','🦈'];

  const pick = arr => arr[Math.random() * arr.length | 0];

  function randomMegaName() {
    return `${pick(MEGA_PRE)}-${pick(MEGA_MID)} ${pick(MEGA_SUF)}`;
  }

  function toast(msg) {
    const c = $('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 400); }, 2800);
  }

  function cheatPlayer() {
    return players.find(p => p.type === 'human' && p.deck.length > 0) || players[0];
  }

  function needsGame() {
    if (phase !== 'playing' && phase !== 'comparing') {
      toast('⚠️ Starte zuerst ein Spiel!');
      return false;
    }
    return true;
  }

  /* 🚀 Random Mega Jet */
  function cheatMegaJet() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const name = randomMegaName();
    const emoji = pick(MEGA_EMO);
    p.deck.unshift({
      id: 'mega_' + Date.now(), group: 'X', number: 99,
      name, category: 'MEGA JET', emoji,
      stats: {
        speed:       50000 + (Math.random() * 50000 | 0),
        range:       500000 + (Math.random() * 500000 | 0),
        wingspan:    500 + (Math.random() * 500 | 0),
        length:      200 + (Math.random() * 300 | 0),
        altitude:    50000 + (Math.random() * 50000 | 0),
        firstFlight: 2099
      }
    });
    renderGame();
    toast(`🚀 <b>${name}</b> ${emoji} erstellt!`);
  }

  /* 🛠️ Custom Mega Jet */
  function cheatCustomJet() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const name = $('mj-name')?.value?.trim() || randomMegaName();
    p.deck.unshift({
      id: 'mega_' + Date.now(), group: 'X', number: 99,
      name, category: 'MEGA JET', emoji: '🚀',
      stats: {
        speed:       parseFloat($('mj-speed')?.value)    || 99999,
        range:       parseFloat($('mj-range')?.value)    || 999999,
        wingspan:    parseFloat($('mj-wingspan')?.value)  || 999,
        length:      parseFloat($('mj-length')?.value)    || 500,
        altitude:    parseFloat($('mj-altitude')?.value)  || 100000,
        firstFlight: parseInt($('mj-year')?.value)        || 2099
      }
    });
    renderGame();
    toast(`🛠️ <b>${name}</b> als Top-Karte!`);
  }

  /* 🃏 Karten stehlen */
  function cheatSteal(n) {
    if (!needsGame()) return;
    const p = cheatPlayer();
    let stolen = 0;
    for (let i = 0; i < n; i++) {
      const opps = players.filter(o => o !== p && o.deck.length > 0);
      if (!opps.length) break;
      const opp = pick(opps);
      const ci = Math.random() * opp.deck.length | 0;
      p.deck.push(opp.deck.splice(ci, 1)[0]);
      stolen++;
    }
    renderGame();
    toast(`🃏 ${stolen} Karte(n) gestohlen!`);
  }

  /* ⬆️ Karte aufladen (x10) */
  function cheatBoost() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (!p.deck.length) return;
    const card = p.deck[0];
    Object.keys(card.stats).forEach(k => {
      if (k !== 'firstFlight') card.stats[k] = Math.round(card.stats[k] * 10);
    });
    card.name = '⚡ ' + card.name;
    renderGame();
    toast(`⬆️ <b>${card.name}</b> x10 aufgeladen!`);
  }

  /* 💀 x 1.000.000.000.000.000 */
  function cheatTrillion() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (!p.deck.length) return;
    const card = p.deck[0];
    Object.keys(card.stats).forEach(k => {
      if (k !== 'firstFlight') card.stats[k] = Math.round(card.stats[k] * 1000000000000000);
    });
    card.name = '💀 ' + card.name;
    card.emoji = '💀';
    renderGame();
    toast(`💀 <b>${card.name}</b> x1.000.000.000.000.000!!!`);
  }

  /* 💣 Gegner schwächen */
  function cheatWeaken() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    let count = 0;
    players.forEach(op => {
      if (op === p || !op.deck.length) return;
      Object.keys(op.deck[0].stats).forEach(k => {
        if (k !== 'firstFlight') op.deck[0].stats[k] = Math.round(op.deck[0].stats[k] / 3);
      });
      count++;
    });
    renderGame();
    toast(`💣 ${count} Gegner geschwächt! Werte gedrittelt!`);
  }

  /* 👀 Spicken */
  function cheatPeek() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const others = players.filter(o => o !== p && o.deck.length > 0);
    let html = '';
    others.forEach(op => {
      html += `<div class="peek-player"><h4 style="color:${op.color}">${op.icon} ${op.name} (${op.deck.length})</h4><div class="peek-cards">`;
      op.deck.forEach(c => {
        const gc = GROUP_COLORS[c.group] || { bg: '#555' };
        html += `<div class="peek-card">
          <span class="peek-badge" style="background:${gc.bg}">${c.group}${c.number}</span>
          ${c.emoji || '✈️'} <b>${c.name}</b>
          <span class="peek-stats">⚡${c.stats.speed} 📏${c.stats.range} ↔️${c.stats.wingspan}</span>
        </div>`;
      });
      html += '</div></div>';
    });
    $('peek-content').innerHTML = html;
    $('peek-modal').classList.add('active');
    toast('👀 Gegner-Karten aufgedeckt!');
  }

  /* 🔀 Beste Karte nach oben */
  function cheatBestOnTop() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (p.deck.length < 2) return;
    const all = FlugzeugData.getAll();
    const maxes = {};
    Object.keys(STAT_META).forEach(k => {
      maxes[k] = Math.max(...all.map(a => a.stats[k] || 0), ...p.deck.map(c => c.stats[k] || 0));
    });
    p.deck.sort((a, b) => {
      const sa = Object.keys(STAT_META).reduce((s, k) => s + (maxes[k] ? a.stats[k] / maxes[k] : 0), 0);
      const sb = Object.keys(STAT_META).reduce((s, k) => s + (maxes[k] ? b.stats[k] / maxes[k] : 0), 0);
      return sb - sa;
    });
    renderGame();
    toast(`🔀 <b>${p.deck[0].name}</b> ist jetzt oben!`);
  }

  /* 🏆 Sofort gewinnen */
  function cheatWin() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    players.forEach(op => {
      if (op === p) return;
      p.deck.push(...op.deck);
      op.deck = [];
    });
    p.deck.push(...pile);
    pile = [];
    renderPlayerBar();
    toast('🏆 ALLE Karten eingesammelt!');
    setTimeout(() => endGame(p), 600);
  }

  /* 🃏 Bestimmte Karte geben */
  function cheatGiveCard(aircraftId) {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const all = FlugzeugData.getAll();
    const card = all.find(a => a.id === aircraftId);
    if (!card) return;
    const copy = JSON.parse(JSON.stringify(card));
    copy.id = card.id + '_c' + Date.now();
    p.deck.unshift(copy);
    renderGame();
    renderDeckMgr();
    toast(`🃏 <b>${card.name}</b> hinzugefügt!`);
  }

  /* 🎲 Zufalls-Event */
  function cheatRandomEvent() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const events = [
      () => { cheatMegaJet(); },
      () => { cheatSteal(3); },
      () => { cheatBoost(); },
      () => {
        if (!p.deck.length) return;
        const orig = p.deck[0];
        const clone = JSON.parse(JSON.stringify(orig));
        clone.id = 'clone_' + Date.now();
        clone.name = orig.name + ' (Klon)';
        p.deck.splice(1, 0, clone);
        renderGame();
        toast(`🧬 <b>${clone.name}</b> geklont!`);
      },
      () => {
        if (!p.deck.length) return;
        const card = p.deck[0];
        Object.keys(card.stats).forEach(k => { card.stats[k] = 99999; });
        card.name = '🌟 ' + card.name;
        renderGame();
        toast('✨ Goldene Rüstung! Alles auf 99.999!');
      },
      () => {
        players.forEach(op => {
          if (op === p || !op.deck.length) return;
          op.deck.shift();
        });
        renderGame();
        toast('☄️ Meteor! Gegner verlieren ihre Top-Karte!');
      },
      () => { cheatSteal(7); },
      () => {
        for (let i = 0; i < 3; i++) cheatMegaJet();
        toast('🛸 ALIEN-INVASION! 3 Mega Jets!');
      },
      () => {
        if (!p.deck.length) return;
        const card = p.deck[0];
        Object.keys(card.stats).forEach(k => {
          if (k !== 'firstFlight') card.stats[k] = Math.round(card.stats[k] * 100);
        });
        card.name = '💀 GOTT-MODUS ' + card.name;
        card.emoji = '💀';
        renderGame();
        toast('💀 GOTT-MODUS! x100 Power!');
      }
    ];
    pick(events)();
  }

  /* 🎲 Random Name Button */
  function cheatRandomName() {
    const el = $('mj-name');
    if (el) el.value = randomMegaName();
  }

  /* Cheat card selector population */
  /* ─── DECK MANAGER ─────────────────────────────────── */
  let deckMgrMode = 'add';

  function deckMgrTab(mode) {
    deckMgrMode = mode;
    document.querySelectorAll('.dm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dm-tab').forEach(t => {
      if ((mode === 'add' && t.textContent.includes('Hinzufügen')) ||
          (mode === 'my' && t.textContent.includes('Mein Deck')) ||
          (mode === 'give-opp' && t.textContent.includes('Gegner')))
        t.classList.add('active');
    });
    renderDeckMgr();
  }

  function renderDeckMgr() {
    const el = $('deck-mgr-content');
    if (!el) return;
    if (phase !== 'playing' && phase !== 'comparing') {
      el.innerHTML = '<div class="dm-hint">Starte ein Spiel um den Deck Manager zu nutzen.</div>';
      return;
    }
    if (deckMgrMode === 'add') renderDeckMgrAdd(el);
    else if (deckMgrMode === 'my') renderDeckMgrMy(el);
    else if (deckMgrMode === 'give-opp') renderDeckMgrOpp(el);
  }

  function renderDeckMgrAdd(el) {
    const all = FlugzeugData.getAll().sort((a, b) => a.group.localeCompare(b.group) || a.number - b.number);
    const groups = [...new Set(all.map(a => a.group))].sort();
    let html = '<div class="dm-hint">Klicke auf eine Karte um sie deinem Deck hinzuzufügen</div>';
    groups.forEach(g => {
      const gc = GROUP_COLORS[g] || { bg: '#555', name: g };
      const cards = all.filter(a => a.group === g);
      html += `<div class="dm-group"><div class="dm-group-head" style="background:${gc.bg}">${g} – ${gc.name}</div><div class="dm-cards">`;
      cards.forEach(c => {
        html += `<button class="dm-card" onclick="Game.cheatGiveCard('${c.id}')" title="${c.name}&#10;⚡${c.stats.speed} 📏${c.stats.range} ↔️${c.stats.wingspan}">
          <span class="dm-badge" style="background:${gc.bg}">${c.group}${c.number}</span>
          <span class="dm-emoji">${c.emoji || '✈️'}</span>
          <span class="dm-name">${c.name}</span>
          <span class="dm-mini-stats">⚡${fmt('speed',c.stats.speed)}</span>
        </button>`;
      });
      html += '</div></div>';
    });
    el.innerHTML = html;
  }

  function renderDeckMgrMy(el) {
    const p = cheatPlayer();
    if (!p || !p.deck.length) {
      el.innerHTML = '<div class="dm-hint">Dein Deck ist leer!</div>';
      return;
    }
    let html = `<div class="dm-hint">${p.deck.length} Karten – Klicke ✕ um zu entfernen, ⬆ um nach oben zu schieben</div>`;
    html += '<div class="dm-my-list">';
    p.deck.forEach((c, i) => {
      const gc = GROUP_COLORS[c.group] || { bg: '#555' };
      html += `<div class="dm-my-row${i === 0 ? ' dm-my-top' : ''}">
        <span class="dm-badge" style="background:${gc.bg}">${c.group}${c.number}</span>
        <span class="dm-emoji-sm">${c.emoji || '✈️'}</span>
        <span class="dm-my-name">${c.name}</span>
        <span class="dm-my-stats">⚡${fmt('speed',c.stats.speed)}</span>
        ${i > 0 ? `<button class="dm-action dm-up" onclick="Game.deckMgrMove(${i})" title="Nach oben">⬆</button>` : '<span class="dm-action" style="opacity:.2">★</span>'}
        <button class="dm-action dm-del" onclick="Game.deckMgrRemove(${i})" title="Entfernen">✕</button>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function deckMgrMove(idx) {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (idx <= 0 || idx >= p.deck.length) return;
    const card = p.deck.splice(idx, 1)[0];
    p.deck.unshift(card);
    renderGame();
    renderDeckMgr();
    toast(`⬆ <b>${card.name}</b> ist jetzt deine Top-Karte!`);
  }

  function deckMgrRemove(idx) {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (idx < 0 || idx >= p.deck.length) return;
    const card = p.deck.splice(idx, 1)[0];
    renderGame();
    renderDeckMgr();
    toast(`✕ <b>${card.name}</b> entfernt.`);
  }

  let oppTarget = null;

  function renderDeckMgrOpp(el) {
    const me = cheatPlayer();
    const opps = players.filter(p => p !== me && p.deck.length >= 0);
    if (!opps.length) { el.innerHTML = '<div class="dm-hint">Keine Gegner!</div>'; return; }

    if (!oppTarget || !opps.find(o => o.idx === oppTarget)) oppTarget = opps[0].idx;

    let html = '<div class="dm-hint">Wähle einen Gegner und gib ihm Karten</div>';
    html += '<div class="dm-opp-select">';
    opps.forEach(o => {
      html += `<button class="dm-opp-btn${o.idx === oppTarget ? ' active' : ''}" style="--c:${o.color}" onclick="Game.setOppTarget(${o.idx})">${o.icon} ${o.name} (${o.deck.length})</button>`;
    });
    html += '</div>';

    const all = FlugzeugData.getAll().sort((a, b) => cardScore(b) - cardScore(a));
    html += '<div class="dm-hint" style="margin-top:8px">Beste Karten zuerst – klicke zum Geben</div>';
    html += '<div class="dm-cards">';
    all.forEach(c => {
      const gc = GROUP_COLORS[c.group] || { bg: '#555' };
      html += `<button class="dm-card dm-card-opp" onclick="Game.cheatGiveToOpp('${c.id}')" title="${c.name}">
        <span class="dm-badge" style="background:${gc.bg}">${c.group}${c.number}</span>
        <span class="dm-emoji">${c.emoji || '✈️'}</span>
        <span class="dm-name">${c.name}</span>
        <span class="dm-mini-stats">⚡${fmt('speed',c.stats.speed)}</span>
      </button>`;
    });
    html += '</div>';

    html += '<div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">';
    html += `<button class="cheat-btn cb-gold" style="flex:1;font-size:.7rem" onclick="Game.cheatGiveOppTop(5)">🏅 Top 5 geben</button>`;
    html += `<button class="cheat-btn cb-gold" style="flex:1;font-size:.7rem" onclick="Game.cheatGiveOppTop(10)">🏅 Top 10 geben</button>`;
    html += `<button class="cheat-btn cb-rainbow" style="flex:1;font-size:.7rem" onclick="Game.cheatGiveOppAll()">🗃️ ALLE geben</button>`;
    html += '</div>';

    el.innerHTML = html;
  }

  function setOppTarget(idx) {
    oppTarget = idx;
    renderDeckMgr();
  }

  function cheatGiveToOpp(aircraftId) {
    if (!needsGame()) return;
    const opp = players.find(p => p.idx === oppTarget);
    if (!opp) return;
    const all = FlugzeugData.getAll();
    const card = all.find(a => a.id === aircraftId);
    if (!card) return;
    const copy = JSON.parse(JSON.stringify(card));
    copy.id = card.id + '_opp' + Date.now();
    opp.deck.unshift(copy);
    renderGame();
    renderDeckMgr();
    toast(`🎁 <b>${card.name}</b> an <b>${opp.name}</b> gegeben!`);
  }

  function cheatGiveOppTop(n) {
    if (!needsGame()) return;
    const opp = players.find(p => p.idx === oppTarget);
    if (!opp) return;
    const all = FlugzeugData.getAll();
    const ranked = [...all].sort((a, b) => cardScore(b) - cardScore(a)).slice(0, n);
    ranked.forEach((card, i) => {
      const copy = JSON.parse(JSON.stringify(card));
      copy.id = card.id + '_ot' + Date.now() + i;
      opp.deck.unshift(copy);
    });
    renderGame();
    renderDeckMgr();
    toast(`🎁 Top ${n} Karten an <b>${opp.name}</b>!`);
  }

  function cheatGiveOppAll() {
    if (!needsGame()) return;
    const opp = players.find(p => p.idx === oppTarget);
    if (!opp) return;
    const all = FlugzeugData.getAll();
    all.forEach((card, i) => {
      const copy = JSON.parse(JSON.stringify(card));
      copy.id = card.id + '_oa' + Date.now() + i;
      opp.deck.unshift(copy);
    });
    renderGame();
    renderDeckMgr();
    toast(`🎁 ALLE ${all.length} Karten an <b>${opp.name}</b>!`);
  }

  function populateCheatCards() {}
  function cheatGiveSelected() {}

  /* 🏅 Top-N beste Karten geben */
  function cardScore(card) {
    const all = FlugzeugData.getAll();
    const maxes = {};
    Object.keys(STAT_META).forEach(k => {
      maxes[k] = Math.max(...all.map(a => a.stats[k] || 0));
    });
    return Object.keys(STAT_META).reduce((s, k) => s + (maxes[k] ? (card.stats[k] || 0) / maxes[k] : 0), 0);
  }

  function cheatTopCards(n) {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const all = FlugzeugData.getAll();
    const ranked = [...all].sort((a, b) => cardScore(b) - cardScore(a));
    const top = ranked.slice(0, n);
    let added = 0;
    top.forEach(card => {
      const copy = JSON.parse(JSON.stringify(card));
      copy.id = card.id + '_top' + Date.now() + (added++);
      p.deck.unshift(copy);
    });
    renderGame();
    const names = top.slice(0, 3).map(c => c.name).join(', ');
    toast(`🏅 Top ${n} Karten! ${names}…`);
  }

  /* 🥇 Alle Asse (Nr. 1 jeder Gruppe) */
  function cheatAllAces() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const all = FlugzeugData.getAll();
    const groups = [...new Set(all.map(a => a.group))].sort();
    let added = 0;
    groups.forEach(g => {
      const best = all.filter(a => a.group === g).sort((a, b) => cardScore(b) - cardScore(a))[0];
      if (best) {
        const copy = JSON.parse(JSON.stringify(best));
        copy.id = best.id + '_ace' + Date.now() + (added++);
        p.deck.unshift(copy);
      }
    });
    renderGame();
    toast(`🥇 Alle ${groups.length} Gruppen-Asse ins Deck!`);
  }

  /* 🔬 X-Ray Toggle */
  function cheatXray() {
    if (!needsGame()) return;
    xrayOn = !xrayOn;
    renderGame();
    const btn = $('xray-toggle');
    if (btn) {
      btn.classList.toggle('xray-active', xrayOn);
      btn.textContent = xrayOn ? '🔬 X-Ray AUS' : '🔬 X-Ray AN';
    }
    toast(xrayOn ? '🔬 X-Ray AN! Alle Karten sichtbar!' : '🔬 X-Ray aus.');
  }

  /* 🔬 X-Ray Live-Panel */
  function renderXrayPanel() {
    const panel = $('xray-panel');
    if (!panel) return;
    if (!xrayOn || (phase !== 'playing' && phase !== 'comparing')) {
      panel.classList.remove('active');
      return;
    }
    panel.classList.add('active');

    const me = cheatPlayer();
    let html = '';

    // Stapel
    if (pile.length > 0) {
      html += `<div class="xray-group"><div class="xray-group-title">📥 Stapel (${pile.length})</div><div class="xray-list">`;
      pile.forEach(c => {
        const gc = GROUP_COLORS[c.group] || { bg: '#555' };
        html += `<div class="xray-item"><span class="xray-badge" style="background:${gc.bg}">${c.group}${c.number}</span>${c.emoji||'✈️'} <b>${c.name}</b><span class="xray-stats">⚡${fmt('speed',c.stats.speed)} 📏${fmt('range',c.stats.range)} ↔️${c.stats.wingspan} ⬆️${fmt('altitude',c.stats.altitude)}</span></div>`;
      });
      html += '</div></div>';
    }

    // Gegner-Decks
    players.forEach(p => {
      if (p === me) return;
      if (p.deck.length === 0) return;
      html += `<div class="xray-group"><div class="xray-group-title" style="color:${p.color}">${p.icon} ${p.name} (${p.deck.length})</div><div class="xray-list">`;
      p.deck.forEach((c, i) => {
        const gc = GROUP_COLORS[c.group] || { bg: '#555' };
        const isTop = i === 0 ? ' xray-top' : '';
        html += `<div class="xray-item${isTop}"><span class="xray-badge" style="background:${gc.bg}">${c.group}${c.number}</span>${c.emoji||'✈️'} <b>${c.name}</b><span class="xray-stats">⚡${fmt('speed',c.stats.speed)} 📏${fmt('range',c.stats.range)} ↔️${c.stats.wingspan} ⬆️${fmt('altitude',c.stats.altitude)}</span></div>`;
      });
      html += '</div></div>';
    });

    // Eigenes Deck
    if (me && me.deck.length > 1) {
      html += `<div class="xray-group"><div class="xray-group-title" style="color:${me.color}">${me.icon} ${me.name} – nächste Karten</div><div class="xray-list">`;
      me.deck.slice(1, 8).forEach(c => {
        const gc = GROUP_COLORS[c.group] || { bg: '#555' };
        html += `<div class="xray-item xray-own"><span class="xray-badge" style="background:${gc.bg}">${c.group}${c.number}</span>${c.emoji||'✈️'} <b>${c.name}</b><span class="xray-stats">⚡${fmt('speed',c.stats.speed)} 📏${fmt('range',c.stats.range)}</span></div>`;
      });
      if (me.deck.length > 8) html += `<div class="xray-item" style="opacity:.4;text-align:center">… +${me.deck.length - 8} weitere</div>`;
      html += '</div></div>';
    }

    panel.innerHTML = html || '<div style="padding:16px;opacity:.5;text-align:center">Keine Daten</div>';
  }

  /* 📥 Alle Karten aus dem Stapel ziehen */
  function cheatGrabPile() {
    if (!needsGame()) return;
    if (pile.length === 0) {
      toast('📥 Der Stapel ist leer!');
      return;
    }
    const p = cheatPlayer();
    const count = pile.length;
    p.deck.unshift(...pile);
    pile = [];
    renderGame();
    toast(`📥 ${count} Karte(n) vom Stapel gezogen!`);
  }

  /* 🗃️ ALLE Karten aus dem gesamten Deck geben */
  function cheatGiveAll() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const all = FlugzeugData.getAll();
    let added = 0;
    all.forEach(card => {
      const copy = JSON.parse(JSON.stringify(card));
      copy.id = card.id + '_all' + Date.now() + (added++);
      p.deck.unshift(copy);
    });
    renderGame();
    toast(`🗃️ ALLE ${all.length} Karten ins Deck! Totale Dominanz!`);
  }

  /* 🌀 Kartentausch – Deck mit Gegner tauschen */
  function cheatSwapDeck() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const opps = players.filter(o => o !== p && o.deck.length > 0);
    if (!opps.length) return;
    const opp = pick(opps);
    const tmp = p.deck;
    p.deck = opp.deck;
    opp.deck = tmp;
    renderGame();
    toast(`🌀 Deck mit <b>${opp.name}</b> getauscht! (${p.deck.length} Karten)`);
  }

  /* 🧲 Magnet – Alle Top-Karten von Gegnern */
  function cheatMagnet() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    let count = 0;
    players.forEach(op => {
      if (op === p || !op.deck.length) return;
      p.deck.unshift(op.deck.shift());
      count++;
    });
    renderGame();
    toast(`🧲 Magnet! ${count} Top-Karten angezogen!`);
  }

  /* 🎭 Doppelgänger – Top-Karte 5x klonen */
  function cheatCloneArmy() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (!p.deck.length) return;
    const orig = p.deck[0];
    for (let i = 0; i < 5; i++) {
      const clone = JSON.parse(JSON.stringify(orig));
      clone.id = 'clone_' + Date.now() + '_' + i;
      clone.name = orig.name + ` #${i + 2}`;
      p.deck.splice(1, 0, clone);
    }
    renderGame();
    toast(`🎭 5x <b>${orig.name}</b> geklont! Armee erstellt!`);
  }

  /* 💫 Fusion – Top 2 Karten verschmelzen */
  function cheatFusion() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (p.deck.length < 2) { toast('⚠️ Brauche mindestens 2 Karten!'); return; }
    const a = p.deck.shift();
    const b = p.deck.shift();
    const fused = {
      id: 'fusion_' + Date.now(), group: 'X', number: 99,
      name: `${a.name} ⚡ ${b.name}`,
      category: 'FUSION', emoji: '💫',
      stats: {}
    };
    Object.keys(STAT_META).forEach(k => {
      fused.stats[k] = Math.max(a.stats[k], b.stats[k]);
    });
    p.deck.unshift(fused);
    renderGame();
    toast(`💫 FUSION! <b>${fused.name}</b> – nur die besten Werte!`);
  }

  /* 🌊 Tsunami – Halbes Deck der Gegner entfernen */
  function cheatTsunami() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    let total = 0;
    players.forEach(op => {
      if (op === p || !op.deck.length) return;
      const remove = Math.ceil(op.deck.length / 2);
      op.deck.splice(0, remove);
      total += remove;
    });
    renderGame();
    toast(`🌊 TSUNAMI! ${total} gegnerische Karten weggespült!`);
  }

  /* 🧊 Einfrieren – Alle Gegner-Werte auf 1 */
  function cheatFreeze() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    let count = 0;
    players.forEach(op => {
      if (op === p || !op.deck.length) return;
      const card = op.deck[0];
      Object.keys(card.stats).forEach(k => { card.stats[k] = 1; });
      card.name = '🧊 ' + card.name;
      count++;
    });
    renderGame();
    toast(`🧊 EINGEFROREN! ${count} Gegner-Karten auf Wert 1!`);
  }

  /* 🃏 Joker – Karte mit MAX aller Stats */
  function cheatJoker() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    const all = FlugzeugData.getAll();
    const joker = {
      id: 'joker_' + Date.now(), group: 'X', number: 1,
      name: '★ JOKER SUPREME ★', category: 'JOKER', emoji: '🃏',
      stats: {}
    };
    Object.keys(STAT_META).forEach(k => {
      joker.stats[k] = Math.max(...all.map(a => a.stats[k] || 0)) * 2;
    });
    p.deck.unshift(joker);
    renderGame();
    toast('🃏 <b>JOKER SUPREME</b> – doppelt so stark wie die Besten!');
  }

  /* 🎪 Shuffle Chaos – Alle Karten neu mischen */
  function cheatShuffleChaos() {
    if (!needsGame()) return;
    const allCards = [];
    players.forEach(p => { allCards.push(...p.deck); p.deck = []; });
    allCards.push(...pile);
    pile = [];
    const shuffled = shuffle(allCards);
    let ci = 0;
    const alive = players.filter(p => true);
    shuffled.forEach(card => {
      alive[ci % alive.length].deck.push(card);
      ci++;
    });
    renderGame();
    toast('🎪 CHAOS! Alle Karten neu verteilt!');
  }

  /* 🔮 Zeitreise – Alle Stats aufs Maximum der Zukunft */
  function cheatTimewarp() {
    if (!needsGame()) return;
    const p = cheatPlayer();
    if (!p.deck.length) return;
    const card = p.deck[0];
    card.stats.speed = 299792;
    card.stats.range = 9999999;
    card.stats.wingspan = 9999;
    card.stats.length = 9999;
    card.stats.altitude = 999999;
    card.stats.firstFlight = 3000;
    card.name = '🔮 ' + card.name + ' [ZUKUNFT]';
    card.emoji = '🔮';
    renderGame();
    toast('🔮 ZEITREISE! Lichtgeschwindigkeit & Zukunfts-Werte!');
  }

  /* 🎰 Jackpot – 3 zufällige Mega Jets + Boost */
  function cheatJackpot() {
    if (!needsGame()) return;
    for (let i = 0; i < 3; i++) cheatMegaJet();
    cheatBoost();
    toast('🎰 JACKPOT! 3 Mega Jets + Power Boost!');
  }

  /* ─── Image reload handler ── */
  document.addEventListener('images-loaded', () => {
    if (phase === 'playing' || phase === 'comparing') {
      renderActiveCard();
      renderOpponents();
    }
  });

  /* ─── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    renderSetup();
  });

  return {
    showScreen, start, selectStat, nextRound,
    addPlayer, removePlayer, setPlayerName, setPlayerType, renderSetup,
    cheatMegaJet, cheatCustomJet, cheatSteal, cheatBoost, cheatWeaken,
    cheatPeek, cheatBestOnTop, cheatWin, cheatGiveCard, cheatGiveSelected,
    cheatRandomEvent, cheatRandomName, populateCheatCards,
    cheatTopCards, cheatAllAces, cheatXray, cheatGrabPile, cheatGiveAll,
    cheatSwapDeck, cheatMagnet, cheatCloneArmy, cheatFusion, cheatTsunami,
    cheatFreeze, cheatJoker, cheatShuffleChaos, cheatTimewarp, cheatJackpot,
    cheatTrillion, deckMgrTab, deckMgrMove, deckMgrRemove, renderDeckMgr,
    setOppTarget, cheatGiveToOpp, cheatGiveOppTop, cheatGiveOppAll
  };
})();
