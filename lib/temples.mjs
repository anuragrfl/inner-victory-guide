// Sacred places: a two-level menu (category → temple). The guide writes each temple's story
// from the researched TEMPLE KNOWLEDGE in lib/knowledge.mjs.

export const TEMPLE_GROUPS = [
  { key: "devi", title: "🌺 Shakti Peethas & Devi", description: "Kamakhya, Vaishno Devi, Kalighat and more", card: "shaktipeeth",
    temples: ["Kamakhya", "Vaishno Devi", "Kalighat", "Jwalamukhi", "Vindhyavasini", "Kamakshi Amman", "Meenakshi Amman", "Chamundeshwari", "Mahalakshmi Kolhapur", "Dakshineswar Kali"] },
  { key: "devi2", title: "🌸 More Devi temples", description: "Naina Devi, Chintpurni, Ambaji, Tripura Sundari…", card: "shaktipeeth",
    temples: ["Naina Devi", "Chintpurni", "Ambaji", "Tripura Sundari", "Tara Tarini", "Mansa Devi"] },
  { key: "shiva", title: "🔱 Jyotirlingas & Shiva", description: "Kashi, Somnath, Kedarnath, Mahakal…", card: "temple",
    temples: ["Kashi Vishwanath", "Somnath", "Kedarnath", "Mahakaleshwar", "Ramanathaswamy", "Omkareshwar", "Trimbakeshwar", "The 12 Jyotirlingas"] },
  { key: "vishnu", title: "🪷 Vishnu, Krishna & Ram", description: "Tirupati, Jagannath, Badrinath, Ayodhya…", card: "temple",
    temples: ["Tirupati Balaji", "Jagannath Puri", "Badrinath", "Padmanabhaswamy", "Ram Mandir Ayodhya", "Char Dham"] },
  { key: "more", title: "🛕 Other famous shrines", description: "Golden Temple, Siddhivinayak, Shirdi, Konark…", card: "temple",
    temples: ["Golden Temple", "Siddhivinayak", "Shirdi Sai Baba", "Sabarimala", "Konark Sun Temple", "Chota Char Dham"] },
];

export const ALL_TEMPLES = TEMPLE_GROUPS.flatMap((g) => g.temples.map((t) => ({ name: t, group: g })));

export function findTempleGroup(text) {
  const t = text.trim().toLowerCase();
  return TEMPLE_GROUPS.find((g) => g.title.toLowerCase() === t || t.endsWith(g.title.toLowerCase().replace(/^\S+\s/, "")));
}

export function findTemple(text) {
  const t = text.trim().toLowerCase().replace(/^🛕\s*/, "");
  return ALL_TEMPLES.find((x) => x.name.toLowerCase() === t);
}
