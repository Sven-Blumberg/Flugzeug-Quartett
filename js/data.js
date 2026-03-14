const DEFAULT_AIRCRAFT = [
  // ── Gruppe A – Kampfjets ──
  { id:'a1', group:'A', number:1, name:'F-22 Raptor',           category:'Kampfjets',        emoji:'🦅', wikiTitle:'Lockheed_Martin_F-22_Raptor',    stats:{speed:2414,range:2960,wingspan:13.56,length:18.92,altitude:19812,firstFlight:1997}},
  { id:'a2', group:'A', number:2, name:'Eurofighter Typhoon',   category:'Kampfjets',        emoji:'⚡', wikiTitle:'Eurofighter_Typhoon',             stats:{speed:2495,range:2900,wingspan:10.95,length:15.96,altitude:19810,firstFlight:1994}},
  { id:'a3', group:'A', number:3, name:'F-35 Lightning II',     category:'Kampfjets',        emoji:'🌩️',wikiTitle:'Lockheed_Martin_F-35_Lightning_II',stats:{speed:1975,range:2220,wingspan:10.67,length:15.67,altitude:15240,firstFlight:2006}},
  { id:'a4', group:'A', number:4, name:'Dassault Rafale',       category:'Kampfjets',        emoji:'🇫🇷',wikiTitle:'Dassault_Rafale',                 stats:{speed:1912,range:3700,wingspan:10.80,length:15.27,altitude:15235,firstFlight:1986}},

  // ── Gruppe B – Passagierflugzeuge ──
  { id:'b1', group:'B', number:1, name:'Boeing 747',            category:'Passagierflugzeuge',emoji:'👑', wikiTitle:'Boeing_747',                      stats:{speed:988,range:13450,wingspan:64.40,length:70.70,altitude:13747,firstFlight:1969}},
  { id:'b2', group:'B', number:2, name:'Airbus A380',           category:'Passagierflugzeuge',emoji:'🐋', wikiTitle:'Airbus_A380',                     stats:{speed:1020,range:15200,wingspan:79.75,length:72.70,altitude:13136,firstFlight:2005}},
  { id:'b3', group:'B', number:3, name:'Concorde',              category:'Passagierflugzeuge',emoji:'🔺', wikiTitle:'Concorde',                        stats:{speed:2179,range:7223,wingspan:25.60,length:61.66,altitude:18300,firstFlight:1969}},
  { id:'b4', group:'B', number:4, name:'Boeing 787 Dreamliner', category:'Passagierflugzeuge',emoji:'💫', wikiTitle:'Boeing_787_Dreamliner',            stats:{speed:954,range:14140,wingspan:60.10,length:56.70,altitude:13100,firstFlight:2009}},

  // ── Gruppe C – Transportflugzeuge ──
  { id:'c1', group:'C', number:1, name:'C-130 Hercules',        category:'Transportflugzeuge',emoji:'💪', wikiTitle:'Lockheed_C-130_Hercules',          stats:{speed:592,range:3800,wingspan:40.40,length:29.80,altitude:10060,firstFlight:1954}},
  { id:'c2', group:'C', number:2, name:'Antonov An-225',        category:'Transportflugzeuge',emoji:'🏋️',wikiTitle:'Antonov_An-225_Mriya',             stats:{speed:850,range:15400,wingspan:88.40,length:84.00,altitude:12000,firstFlight:1988}},
  { id:'c3', group:'C', number:3, name:'Airbus A400M',          category:'Transportflugzeuge',emoji:'📦', wikiTitle:'Airbus_A400M_Atlas',               stats:{speed:780,range:8700,wingspan:42.40,length:45.10,altitude:11300,firstFlight:2009}},
  { id:'c4', group:'C', number:4, name:'C-17 Globemaster III',  category:'Transportflugzeuge',emoji:'🌍', wikiTitle:'Boeing_C-17_Globemaster_III',      stats:{speed:830,range:4482,wingspan:51.75,length:53.00,altitude:13716,firstFlight:1991}},

  // ── Gruppe D – Leichtflugzeuge ──
  { id:'d1', group:'D', number:1, name:'Cessna 172',            category:'Leichtflugzeuge',  emoji:'🛩️',wikiTitle:'Cessna_172',                       stats:{speed:302,range:1289,wingspan:11.00,length:8.28,altitude:4100,firstFlight:1955}},
  { id:'d2', group:'D', number:2, name:'Piper PA-28 Cherokee',  category:'Leichtflugzeuge',  emoji:'🪶', wikiTitle:'Piper_PA-28_Cherokee',              stats:{speed:237,range:1530,wingspan:10.67,length:7.16,altitude:4206,firstFlight:1960}},
  { id:'d3', group:'D', number:3, name:'Beechcraft King Air',   category:'Leichtflugzeuge',  emoji:'👔', wikiTitle:'Beechcraft_King_Air',               stats:{speed:578,range:3338,wingspan:17.65,length:14.22,altitude:10668,firstFlight:1963}},
  { id:'d4', group:'D', number:4, name:'Diamond DA42',          category:'Leichtflugzeuge',  emoji:'💎', wikiTitle:'Diamond_DA42',                      stats:{speed:338,range:1693,wingspan:13.56,length:8.56,altitude:5486,firstFlight:2002}},

  // ── Gruppe E – Bomber ──
  { id:'e1', group:'E', number:1, name:'B-2 Spirit',            category:'Bomber',           emoji:'👻', wikiTitle:'Northrop_Grumman_B-2_Spirit',       stats:{speed:1010,range:11100,wingspan:52.43,length:21.03,altitude:15200,firstFlight:1989}},
  { id:'e2', group:'E', number:2, name:'B-52 Stratofortress',   category:'Bomber',           emoji:'🏰', wikiTitle:'Boeing_B-52_Stratofortress',        stats:{speed:1047,range:16232,wingspan:56.39,length:48.50,altitude:15166,firstFlight:1952}},
  { id:'e3', group:'E', number:3, name:'Avro Lancaster',        category:'Bomber',           emoji:'🇬🇧',wikiTitle:'Avro_Lancaster',                   stats:{speed:462,range:4073,wingspan:31.09,length:21.18,altitude:7468,firstFlight:1941}},
  { id:'e4', group:'E', number:4, name:'Tu-160 Blackjack',      category:'Bomber',           emoji:'🃏', wikiTitle:'Tupolev_Tu-160',                    stats:{speed:2220,range:12300,wingspan:55.70,length:54.10,altitude:15600,firstFlight:1981}},

  // ── Gruppe F – Hubschrauber ──
  { id:'f1', group:'F', number:1, name:'AH-64 Apache',          category:'Hubschrauber',     emoji:'🪖', wikiTitle:'Boeing_AH-64_Apache',               stats:{speed:293,range:476,wingspan:14.63,length:17.73,altitude:6400,firstFlight:1975}},
  { id:'f2', group:'F', number:2, name:'CH-47 Chinook',         category:'Hubschrauber',     emoji:'🪢', wikiTitle:'Boeing_CH-47_Chinook',              stats:{speed:315,range:741,wingspan:18.29,length:30.10,altitude:6096,firstFlight:1961}},
  { id:'f3', group:'F', number:3, name:'Airbus H145',           category:'Hubschrauber',     emoji:'🚑', wikiTitle:'Airbus_Helicopters_H145',            stats:{speed:259,range:680,wingspan:11.00,length:13.64,altitude:5486,firstFlight:2014}},
  { id:'f4', group:'F', number:4, name:'Mi-26',                 category:'Hubschrauber',     emoji:'🦣', wikiTitle:'Mil_Mi-26',                         stats:{speed:295,range:800,wingspan:32.00,length:40.03,altitude:4600,firstFlight:1977}}
];

const STAT_META = {
  speed:       { label: 'Geschwindigkeit', unit: 'km/h', icon: '⚡' },
  range:       { label: 'Reichweite',      unit: 'km',   icon: '📏' },
  wingspan:    { label: 'Spannweite',      unit: 'm',    icon: '↔️' },
  length:      { label: 'Länge',           unit: 'm',    icon: '📐' },
  altitude:    { label: 'Max. Flughöhe',   unit: 'm',    icon: '⬆️' },
  firstFlight: { label: 'Erstflug',        unit: '',     icon: '📅' }
};

const GROUP_COLORS = {
  A: { bg: '#e74c3c', light: '#fadbd8', name: 'Kampfjets' },
  B: { bg: '#3498db', light: '#d4e6f1', name: 'Passagierflugzeuge' },
  C: { bg: '#27ae60', light: '#d5f5e3', name: 'Transportflugzeuge' },
  D: { bg: '#f39c12', light: '#fdebd0', name: 'Leichtflugzeuge' },
  E: { bg: '#8e44ad', light: '#e8daef', name: 'Bomber' },
  F: { bg: '#16a085', light: '#d1f2eb', name: 'Hubschrauber' },
  X: { bg: '#f1c40f', light: '#fef9e7', name: '⚡ MEGA JET' }
};

const PLAYER_COLORS = ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
const PLAYER_ICONS  = ['🧑','🤖','👩','👨','👧','🧒'];

// ─── Data Management ─────────────────────────────────────────────
const FlugzeugData = {
  getAll() {
    const stored = localStorage.getItem('flugzeug_quartett_data');
    if (stored) { try { return JSON.parse(stored); } catch(e) {/* fall through */} }
    this.saveAll(DEFAULT_AIRCRAFT);
    return [...DEFAULT_AIRCRAFT];
  },
  saveAll(a)     { localStorage.setItem('flugzeug_quartett_data', JSON.stringify(a)); },
  getById(id)    { return this.getAll().find(a => a.id === id); },
  add(aircraft)  { const a = this.getAll(); a.push(aircraft); this.saveAll(a); },
  update(id, u)  { const a = this.getAll(); const i = a.findIndex(x=>x.id===id); if(i!==-1){a[i]={...a[i],...u};this.saveAll(a);} },
  remove(id)     { this.saveAll(this.getAll().filter(a => a.id !== id)); },
  resetToDefault(){ this.saveAll(DEFAULT_AIRCRAFT); ImageCache.clear(); ImageCache.fetchAll(); },
  exportJSON()   { return JSON.stringify(this.getAll(), null, 2); },
  importJSON(j)  { const d=JSON.parse(j); if(!Array.isArray(d))throw new Error('Ungültig'); d.forEach(a=>{if(!a.id||!a.name||!a.group||!a.stats)throw new Error('Unvollständig');}); this.saveAll(d); }
};

// ─── Wikipedia Image Cache ───────────────────────────────────────
const ImageCache = {
  _cache: null,

  _load() {
    if (this._cache) return this._cache;
    try { this._cache = JSON.parse(localStorage.getItem('flugzeug_img_cache') || '{}'); }
    catch(e) { this._cache = {}; }
    return this._cache;
  },

  _save() { localStorage.setItem('flugzeug_img_cache', JSON.stringify(this._cache)); },

  get(aircraftId) { return this._load()[aircraftId] || null; },

  set(aircraftId, url) { this._load(); this._cache[aircraftId] = url; this._save(); },

  clear() { this._cache = {}; localStorage.removeItem('flugzeug_img_cache'); },

  async fetchOne(aircraft) {
    if (this.get(aircraft.id)) return this.get(aircraft.id);
    if (!aircraft.wikiTitle) return null;
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(aircraft.wikiTitle)}`);
      if (!r.ok) return null;
      const d = await r.json();
      const url = d.thumbnail?.source || d.originalimage?.source || null;
      if (url) this.set(aircraft.id, url);
      return url;
    } catch(e) { return null; }
  },

  async fetchAll() {
    const all = FlugzeugData.getAll();
    const promises = all.map(a => this.fetchOne(a));
    await Promise.allSettled(promises);
    document.dispatchEvent(new CustomEvent('images-loaded'));
  }
};
