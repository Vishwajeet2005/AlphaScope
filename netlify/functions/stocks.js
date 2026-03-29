const { ok, fail, preflight } = require('./utils');

async function fetchYahooQuote(symbol) {
  // Only append .NS for clean NSE ticker symbols (letters/digits/& only, no suffix)
  const needsNS = /^[A-Z0-9&]+$/.test(symbol) && !symbol.includes('.') && !symbol.includes('-') && !symbol.includes('=') && !symbol.startsWith('^');
  const ySymbol = needsNS ? symbol + '.NS' : symbol;

  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=3mo`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=3mo`,
  ];

  const hdrs = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com/',
  };

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: hdrs });
      if (res.status === 429 || res.status === 403) continue;
      if (!res.ok) continue;
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) continue;
      return parse(result, symbol);
    } catch { continue; }
  }
  return null;
}

function parse(result, originalSymbol) {
  const meta = result.meta;
  const q    = result.indicators?.quote?.[0] || {};
  const rawC = q.close  || [];
  const rawO = q.open   || [];
  const rawH = q.high   || [];
  const rawL = q.low    || [];
  const rawV = q.volume || [];

  // Build OHLCV with index alignment (do NOT filter — keep nulls in position)
  const ohlcv = [];
  for (let i = 0; i < rawC.length; i++) {
    const c = rawC[i];
    if (!c || c <= 0) continue;
    ohlcv.push({
      o: +(rawO[i] || c).toFixed(4),
      h: +(rawH[i] || c).toFixed(4),
      l: +(rawL[i] || c).toFixed(4),
      c: +c.toFixed(4),
      v: rawV[i] || 0,
    });
  }
  const last90 = ohlcv.slice(-90);
  const closeArr = last90.map(d => d.c);

  const cur  = meta.regularMarketPrice || meta.price || closeArr[closeArr.length - 1] || 0;
  const prev = meta.chartPreviousClose || meta.previousClose || closeArr[closeArr.length - 2] || cur;
  const chg  = prev && prev !== cur ? (cur - prev) / prev * 100 : 0;

  function sma(arr, n) {
    return arr.map((_, i) => i < n - 1 ? null : +(arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n).toFixed(4));
  }
  function rsi(arr, n = 14) {
    const out = new Array(arr.length).fill(null);
    if (arr.length <= n) return out;
    let ag = 0, al = 0;
    for (let i = 1; i <= n; i++) { const d = arr[i] - arr[i-1]; d > 0 ? ag += d : al -= d; }
    ag /= n; al /= n;
    for (let i = n; i < arr.length - 1; i++) {
      const d = arr[i+1] - arr[i];
      ag = (ag * (n-1) + Math.max(d,0)) / n;
      al = (al * (n-1) + Math.max(-d,0)) / n;
      out[i+1] = al === 0 ? 100 : +(100 - 100/(1 + ag/al)).toFixed(1);
    }
    return out;
  }

  function rnd(p) {
    if (!p) return 0;
    if (p > 1000) return Math.round(p * 100) / 100;
    if (p > 1)    return Math.round(p * 10000) / 10000;
    return Math.round(p * 1000000) / 1000000;
  }

  return {
    symbol:      originalSymbol.replace('.NS','').replace(/^\^/,''),
    price:       rnd(cur),
    prev_close:  rnd(prev),
    change_pct:  +chg.toFixed(2),
    high_52w:    rnd(meta.fiftyTwoWeekHigh || 0),
    low_52w:     rnd(meta.fiftyTwoWeekLow  || 0),
    market_cap:  meta.marketCap || 0,
    currency:    meta.currency  || 'INR',
    ohlcv:       last90,
    sma20:       sma(closeArr, 20),
    sma50:       sma(closeArr, Math.min(50, closeArr.length)),
    rsi:         rsi(closeArr),
  };
}

function getNSEMaster() {
  return [
    { symbol:'RELIANCE',   name:'Reliance Industries',        sector:'Energy'      },
    { symbol:'TCS',        name:'Tata Consultancy Services',  sector:'IT'          },
    { symbol:'HDFCBANK',   name:'HDFC Bank',                  sector:'Banking'     },
    { symbol:'INFY',       name:'Infosys',                    sector:'IT'          },
    { symbol:'ICICIBANK',  name:'ICICI Bank',                 sector:'Banking'     },
    { symbol:'SBIN',       name:'State Bank of India',        sector:'Banking'     },
    { symbol:'WIPRO',      name:'Wipro',                      sector:'IT'          },
    { symbol:'BAJFINANCE', name:'Bajaj Finance',              sector:'NBFC'        },
    { symbol:'ZOMATO',     name:'Zomato',                     sector:'Tech'        },
    { symbol:'TATAMOTORS', name:'Tata Motors',                sector:'Auto'        },
    { symbol:'SUNPHARMA',  name:'Sun Pharma',                 sector:'Pharma'      },
    { symbol:'TITAN',      name:'Titan Company',              sector:'Consumer'    },
    { symbol:'IRCTC',      name:'IRCTC',                      sector:'Travel'      },
    { symbol:'MARUTI',     name:'Maruti Suzuki',              sector:'Auto'        },
    { symbol:'AXISBANK',   name:'Axis Bank',                  sector:'Banking'     },
    { symbol:'HCLTECH',    name:'HCL Technologies',           sector:'IT'          },
    { symbol:'NESTLEIND',  name:'Nestle India',               sector:'FMCG'        },
    { symbol:'LTIM',       name:'LTIMindtree',                sector:'IT'          },
    { symbol:'ADANIENT',   name:'Adani Enterprises',          sector:'Conglomerate'},
    { symbol:'COALINDIA',  name:'Coal India',                 sector:'Mining'      },
    { symbol:'ONGC',       name:'ONGC',                       sector:'Energy'      },
    { symbol:'NTPC',       name:'NTPC',                       sector:'Utilities'   },
    { symbol:'BHARTIARTL', name:'Bharti Airtel',              sector:'Telecom'     },
    { symbol:'BAJAJFINSV', name:'Bajaj Finserv',              sector:'NBFC'        },
    { symbol:'DRREDDY',    name:"Dr. Reddy's Laboratories",   sector:'Pharma'      },
    { symbol:'CIPLA',      name:'Cipla',                      sector:'Pharma'      },
    { symbol:'HINDALCO',   name:'Hindalco Industries',        sector:'Metals'      },
    { symbol:'JSWSTEEL',   name:'JSW Steel',                  sector:'Metals'      },
    { symbol:'TATASTEEL',  name:'Tata Steel',                 sector:'Metals'      },
    { symbol:'ULTRACEMCO', name:'UltraTech Cement',           sector:'Cement'      },
    { symbol:'ASIANPAINT', name:'Asian Paints',               sector:'Paints'      },
    { symbol:'INDUSINDBK', name:'IndusInd Bank',              sector:'Banking'     },
    { symbol:'DELHIVERY',  name:'Delhivery',                  sector:'Logistics'   },
    { symbol:'NYKAA',      name:'FSN E-Commerce (Nykaa)',     sector:'Tech'        },
    { symbol:'TATAPOWER',  name:'Tata Power',                 sector:'Energy'      },
    { symbol:'IREDA',      name:'Indian Renewable Energy',    sector:'Finance'     },
  ];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const sub = (event.path || '').replace(/.*\/stocks/, '').replace(/^\//, '');
  const p   = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && sub === 'quote') {
    if (!p.symbol) return fail('symbol required');
    const d = await fetchYahooQuote(p.symbol);
    return d ? ok(d) : fail('Could not fetch ' + p.symbol + '. Yahoo may be rate-limiting — retry shortly.', 502);
  }

  if (event.httpMethod === 'GET' && sub === 'search') {
    const q = (p.q || '').toLowerCase().trim();
    if (!q) return ok([]);
    const res = getNSEMaster().filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)   ||
      s.sector.toLowerCase().includes(q)
    ).slice(0, 10);
    return ok(res);
  }

  return fail('Not found', 404);
};

exports.fetchYahooQuote = fetchYahooQuote;
exports.getNSEMaster    = getNSEMaster;
