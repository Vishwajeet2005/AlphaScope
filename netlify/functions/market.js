const { ok, preflight } = require('./utils');
const { fetchYahooQuote } = require('./stocks');

const SYMBOLS = [
  { sym:'^NSEI',    label:'Nifty 50',  unit:'pts',    cat:'index'    },
  { sym:'^BSESN',   label:'Sensex',    unit:'pts',    cat:'index'    },
  { sym:'^INDIAVIX',label:'India VIX', unit:'',       cat:'vix'      },
  { sym:'GC=F',     label:'Gold',      unit:'USD/oz', cat:'commodity'},
  { sym:'SI=F',     label:'Silver',    unit:'USD/oz', cat:'commodity'},
  { sym:'CL=F',     label:'Crude Oil', unit:'USD/bbl',cat:'commodity'},
  { sym:'USDINR=X', label:'USD/INR',   unit:'INR',    cat:'forex'    },
  { sym:'BTC-USD',  label:'Bitcoin',   unit:'USD',    cat:'crypto'   },
  { sym:'ETH-USD',  label:'Ethereum',  unit:'USD',    cat:'crypto'   },
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const results = await Promise.allSettled(SYMBOLS.map(s => fetchYahooQuote(s.sym)));

  const market = {};
  SYMBOLS.forEach((s, i) => {
    const d = results[i].status === 'fulfilled' ? results[i].value : null;
    market[s.sym] = {
      label:      s.label,
      unit:       s.unit,
      cat:        s.cat,
      price:      d?.price      || 0,
      change_pct: d?.change_pct || 0,
      error:      !d,
    };
  });

  const vix  = market['^INDIAVIX']?.price || 15;
  const nChg = market['^NSEI']?.change_pct || 0;
  let sentiment = 'Neutral', score = 50;
  if      (vix > 25 || nChg < -1.5) { sentiment = 'Fear';     score = 18; }
  else if (vix > 18 || nChg < -0.5) { sentiment = 'Caution';  score = 36; }
  else if (vix < 12 && nChg > 0.5)  { sentiment = 'Greed';    score = 80; }
  else if (vix < 15 && nChg > 0)    { sentiment = 'Optimism'; score = 62; }

  return ok({ market, sentiment, sentiment_score: score, fetched_at: new Date().toISOString() });
};
