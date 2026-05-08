/** Escape HTML special characters to prevent XSS in generated HTML output */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface InputSpecifics {
  numbers: string[];
  dates: string[];
  locations: string[];
  quotedTerms: string[];
  keyPhrases: string[];
}

export function extractInputSpecifics(input: string): InputSpecifics {
  const numbers: string[] = [];
  const dates: string[] = [];
  const locations: string[] = [];
  const quotedTerms: string[] = [];
  const keyPhrases: string[] = [];

  for (const m of input.matchAll(/\d+[\d,.]*\s*[%％万亿千百人次天月年个件台套美元元块RMB\$€£]+/g)) {
    numbers.push(m[0].trim());
  }
  for (const m of input.matchAll(/\d+(?:\.\d+)?(?!\s*[%％万亿千百人次天月年个件台套美元元块])/g)) {
    if (!numbers.some(n => n.includes(m[0]))) {
      const ctx = input.slice(Math.max(0, m.index! - 2), m.index! + m[0].length + 4);
      if (!/\d+\s*(页|slides?|pages?)/.test(ctx)) {
        numbers.push(m[0]);
      }
    }
  }

  for (const m of input.matchAll(/\d{4}\s*[年\/\-]\s*\d{1,2}(?:\s*[月\/\-]\s*\d{1,2}[日号]?)?|\d{1,2}\s*月\s*\d{1,2}\s*[日号]|Q[1-4]|第[一二三四]季度/g)) {
    dates.push(m[0].trim());
  }

  const locationPatterns = /(?:在|\bat\b|@)\s*([^\s,，。！？]{2,8})|(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|重庆|线上|线下|远程)/g;
  for (const m of input.matchAll(locationPatterns)) {
    locations.push((m[1] || m[0]).trim());
  }

  for (const m of input.matchAll(/["「『""]([^"」』""]+)["」』""]/g)) {
    quotedTerms.push(m[1].trim());
  }

  const phrasePattern = /(?:[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)|(?:[\u4e00-\u9fff]{2,6}(?:与|和|及)[\u4e00-\u9fff]{2,6})/g;
  for (const m of input.matchAll(phrasePattern)) {
    const phrase = m[0].trim();
    if (phrase.length >= 2 && phrase.length <= 50 && !quotedTerms.includes(phrase)) {
      keyPhrases.push(phrase);
    }
  }

  return {
    numbers: [...new Set(numbers)],
    dates: [...new Set(dates)],
    locations: [...new Set(locations)],
    quotedTerms: [...new Set(quotedTerms)],
    keyPhrases: [...new Set(keyPhrases)],
  };
}
