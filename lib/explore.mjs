// Explore the core teachings one by one: the 9 Devis, the 9 Nidhis and the 8 Siddhis.
// (Ravan's 10 heads use the existing head pages in challenges.mjs.)

export const COLLECTIONS = {
  devi: {
    title: "🌸 The 9 Devis", next: "Next Devi ➡️", all: "All 9 Devis 🌸",
    body: "🌸 *The 9 Devis of Navratri*\nNine forms of Maa Durga, nine qualities we can live by, rising from the root to the crown. Whom would you like to meet? 👇",
    items: [
      { slug: "shailaputri", name: "Shailaputri", hi: "शैलपुत्री", q: "Grounded strength", qhi: "स्थिर शक्ति" },
      { slug: "brahmacharini", name: "Brahmacharini", hi: "ब्रह्मचारिणी", q: "Discipline and devotion", qhi: "तप और निष्ठा" },
      { slug: "chandraghanta", name: "Chandraghanta", hi: "चंद्रघंटा", q: "Courage with calm", qhi: "शांत साहस" },
      { slug: "kushmanda", name: "Kushmanda", hi: "कूष्मांडा", q: "Warmth that creates", qhi: "सृजन की ऊष्मा" },
      { slug: "skandamata", name: "Skandamata", hi: "स्कंदमाता", q: "Nurturing love", qhi: "ममता और पोषण" },
      { slug: "katyayani", name: "Katyayani", hi: "कात्यायनी", q: "Clarity and right action", qhi: "स्पष्टता और सही कर्म" },
      { slug: "kalaratri", name: "Kalaratri", hi: "कालरात्रि", q: "Fearless through darkness", qhi: "अंधकार में निर्भयता" },
      { slug: "mahagauri", name: "Mahagauri", hi: "महागौरी", q: "Purity and peace", qhi: "पवित्रता और शांति" },
      { slug: "siddhidatri", name: "Siddhidatri", hi: "सिद्धिदात्री", q: "Fulfilment and grace", qhi: "पूर्णता और कृपा" },
    ],
    note: (it, i) => `Introduce Devi ${it.name}, the ${i + 1}${["st","nd","rd"][i] || "th"} form of Navratri, using the KNOWLEDGE (her story, symbols, chakra, quality: ${it.q}). Shape: a vivid one-line hook; her story in 2-3 short lines; her teaching for modern life (work, family, mind) in 2 lines; one tiny practice for today; one warm question linking her quality to their life. Under 140 words. Say 'the story goes' for legends.`,
  },
  nidhi: {
    title: "💎 The 9 Nidhis", next: "Next Nidhi ➡️", all: "All 9 Nidhis 💎",
    body: "💎 *The 9 Nidhis*\nKubera's nine treasures, read as the inner wealth that makes a life truly rich. Which treasure shall we open? 👇",
    items: [
      { slug: "padma", name: "Padma", hi: "पद्म", q: "Resilience", qhi: "लचीलापन" },
      { slug: "mahapadma", name: "Mahapadma", hi: "महापद्म", q: "Generosity", qhi: "उदारता" },
      { slug: "shankha", name: "Shankha", hi: "शंख", q: "True voice", qhi: "सच्ची वाणी" },
      { slug: "makara", name: "Makara", hi: "मकर", q: "Courage", qhi: "साहस" },
      { slug: "kachchhapa", name: "Kachchhapa", hi: "कच्छप", q: "Stillness", qhi: "स्थिरता" },
      { slug: "mukunda", name: "Mukunda", hi: "मुकुंद", q: "Joy", qhi: "आनंद" },
      { slug: "kunda", name: "Kunda", hi: "कुंद", q: "Contentment", qhi: "संतोष" },
      { slug: "neela", name: "Neela", hi: "नील", q: "Depth", qhi: "गहराई" },
      { slug: "kharva", name: "Kharva", hi: "खर्व", q: "Humility", qhi: "विनम्रता" },
    ],
    note: (it) => `Open the treasure of ${it.name} Nidhi (inner wealth: ${it.q}) using the KNOWLEDGE. Shape: a one-line hook; what the symbol means; how this treasure makes everyday life richer (money, family, work) in 2 lines; one tiny practice to 'earn' this treasure today; one warm question. Under 120 words.`,
  },
  siddhi: {
    title: "✨ The 8 Siddhis", next: "Next Siddhi ➡️", all: "All 8 Siddhis ✨",
    body: "✨ *The 8 Siddhis*\nThe legendary powers of yogis, and the real inner powers they point to. Which power would you like to understand? 👇",
    items: [
      { slug: "anima", name: "Anima", hi: "अणिमा", q: "Become subtle: humility", qhi: "सूक्ष्मता: विनम्रता" },
      { slug: "mahima", name: "Mahima", hi: "महिमा", q: "Become vast: a big heart", qhi: "विशालता: बड़ा दिल" },
      { slug: "garima", name: "Garima", hi: "गरिमा", q: "Become steady: gravitas", qhi: "स्थिरता: गरिमा" },
      { slug: "laghima", name: "Laghima", hi: "लघिमा", q: "Become light: letting go", qhi: "हल्कापन: छोड़ देना" },
      { slug: "prapti", name: "Prapti", hi: "प्राप्ति", q: "Reach: right things find you", qhi: "प्राप्ति: सही चीज़ें मिलना" },
      { slug: "prakamya", name: "Prakamya", hi: "प्राकाम्य", q: "Will that manifests", qhi: "संकल्प शक्ति" },
      { slug: "ishitva", name: "Ishitva", hi: "ईशित्व", q: "Lead yourself first", qhi: "स्वयं का नेतृत्व" },
      { slug: "vashitva", name: "Vashitva", hi: "वशित्व", q: "Mastery of mind", qhi: "मन पर नियंत्रण" },
    ],
    note: (it) => `Explain the Siddhi ${it.name} using the KNOWLEDGE: first its traditional meaning in yoga lore (one line, told as legend), then its real inner meaning (${it.q}) for modern life in 2 lines, a short example from daily life, one tiny practice for today, and a warm question. Under 120 words.`,
  },
};

export const rowTitle = (c, it, i) => `${c.title.split(" ")[0]} ${i + 1} ${it.name}`;

export function findExplore(text) {
  const t = text.trim();
  for (const [kind, c] of Object.entries(COLLECTIONS)) {
    const i = c.items.findIndex((it, k) => rowTitle(c, it, k) === t);
    if (i >= 0) return { kind, i };
  }
  return null;
}

// English → Hindi pairs for the i18n layer.
export const EXPLORE_HI = [];
const HI_HEAD = {
  devi: ["🌸 नौ देवियाँ", "अगली देवी ➡️", "सभी 9 देवियाँ 🌸", "🌸 *नवरात्रि की नौ देवियाँ*\nमाँ दुर्गा के नौ रूप, जीवन के नौ गुण, मूल से शिखर तक। आप किनसे मिलना चाहेंगे? 👇"],
  nidhi: ["💎 नौ निधियाँ", "अगली निधि ➡️", "सभी 9 निधियाँ 💎", "💎 *नौ निधियाँ*\nकुबेर के नौ ख़ज़ाने, जो भीतर की असली दौलत हैं। कौन सा ख़ज़ाना खोलें? 👇"],
  siddhi: ["✨ आठ सिद्धियाँ", "अगली सिद्धि ➡️", "सभी 8 सिद्धियाँ ✨", "✨ *आठ सिद्धियाँ*\nयोगियों की प्रसिद्ध शक्तियाँ, और उनके पीछे छिपी असली भीतरी शक्तियाँ। कौन सी समझना चाहेंगे? 👇"],
};
for (const [kind, c] of Object.entries(COLLECTIONS)) {
  const [title, next, all, body] = HI_HEAD[kind];
  EXPLORE_HI.push([c.title, title], [c.next, next], [c.all, all], [c.body, body]);
  c.items.forEach((it, i) => { EXPLORE_HI.push([rowTitle(c, it, i), `${c.title.split(" ")[0]} ${i + 1} ${it.hi}`], [it.q, it.qhi]); });
}
