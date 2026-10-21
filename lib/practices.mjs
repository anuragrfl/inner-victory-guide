// Feel-good practices: small, research-backed habits for a happier, kinder life,
// each tied to a teaching the guide already knows (Devis, Nidhis, Gita).

export const PRACTICES = [
  { key: "gratitude", title: "📓 Gratitude journal", description: "Write 3 good things today", card: "kunda" },
  { key: "music", title: "🎵 Music for the soul", description: "Songs and sounds that heal", card: "kushmanda",
    note: "Teach the gift of music for the heart. Music can lift mood and calm the body; bhajans, kirtan, ragas, or simply a favourite song all count, and listening fully (eyes closed, nothing else) is itself a meditation (nada yoga: sound as a path inward). Saraswati is the Devi of music and wisdom. Give a tiny practice: today, listen to ONE song with full attention, or hum 'Om' three times and feel the vibration in the chest. Ask what song always lifts them, or what music their family loved. Under 110 words." },
  { key: "proud", title: "🏅 Be proud of yourself", description: "Notice how far you've come", card: "chandraghanta",
    note: "Help them feel genuinely proud of themselves, without ego: healthy self-respect is not Mada (pride over others), it is honouring the effort Brahmacharini honoured. Invite them to name 3 things they handled this year that past-them would be amazed by, even small ones (getting up on a hard day counts). Gita 6.5: lift yourself by yourself; be your own friend. Celebrate them warmly and specifically. End by asking for one thing they're quietly proud of. No options or menu, so they write it. Under 100 words." },
  { key: "kindness", title: "🤝 Small kindness", description: "One kind act, big joy", card: "mukunda",
    note: "Teach how small kindness lifts both giver and receiver (it's one of the quickest ways to feel good). Link to Swarth's opposite, generosity, and Mukunda Nidhi's joy. Give 3 tiny ideas for today (a thank-you message, a compliment to a stranger, helping someone at home without being asked) and ask which one they'll try, or who comes to mind. Under 100 words." },
  { key: "nature", title: "🌳 Nature & sunlight", description: "5 minutes outside", card: "shailaputri",
    note: "Teach the healing of nature: a few minutes of sunlight, sky, trees or even a plant on the windowsill can calm the mind. Shailaputri is the daughter of the mountains, steady and grounded. Practice: step outside for 5 minutes today, feel the ground under your feet, look at the sky, take 5 slow breaths, and notice 3 things in nature. Ask where they feel closest to nature. Under 100 words." },
  { key: "rest", title: "😴 Rest without guilt", description: "Rest is sacred, not lazy", card: "laghima",
    note: "Teach that rest is sacred, not laziness: even the earth has night, and Kalaratri's night makes the dawn possible; Laghima is the lightness of putting down what we don't need to carry. Practice: one guilt-free pause today (10 minutes, phone away, eyes closed or a slow cup of tea), and one 'no' to something non-essential. Ask what usually stops them from resting. Under 100 words." },
  { key: "forgive", title: "🕊️ Let go & forgive", description: "Lighten your heart", card: "moh",
    note: "Gently teach letting go and forgiveness: forgiving doesn't mean what happened was okay; it means we stop carrying the weight. Holding resentment is like holding a hot coal (Krodh burns the holder first). Moh, attachment, also includes holding on to old hurt. Practice: think of one small grudge, breathe out slowly, and silently say 'I release this for my own peace.' Never push them to forgive something serious; be tender. Ask if there is something they'd like to put down. Under 110 words." },
];

export function findPractice(text) {
  const t = text.trim().toLowerCase();
  return PRACTICES.find((p) => p.title.toLowerCase() === t) || null;
}
