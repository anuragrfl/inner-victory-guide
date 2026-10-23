// "Did you know?" hooks: a picture, a surprising teaching and a one-tap guessing game.
// Sent from the menu ("Did you know? 💡") and now and then during light conversations.

export const HOOKS = [
  { id: "stress", card: "mandala",
    en: "💡 *Did you know?*\nMost of our stress and unhappiness doesn't come from life itself, but from 10 old habits of the mind: wanting more, anger, clinging, comparing, ego…\n\nThe Ramayana painted them as *Ravan's 10 heads*. And the good news: each one can be defeated, one at a time 🔥\n\n🎯 *Guess:* which head makes us feel \"it's never enough\"?",
    hi: "💡 *क्या आप जानते हैं?*\nहमारा ज़्यादातर तनाव और दुख ज़िंदगी से नहीं, मन की 10 पुरानी आदतों से आता है: और चाहिए की चाह, गुस्सा, चिपके रहना, तुलना, अहंकार…\n\nरामायण ने इन्हें *रावण के 10 सिर* के रूप में दिखाया। अच्छी ख़बर: हर एक को हराया जा सकता है, एक-एक करके 🔥\n\n🎯 *अंदाज़ा लगाइए:* कौन सा सिर हमें \"कभी काफ़ी नहीं\" का एहसास कराता है?",
    options: ["Lobh (greed)", "Moh (attachment)", "Mada (pride)"], hiOptions: ["लोभ (लालच)", "मोह (आसक्ति)", "मद (घमंड)"], answer: 0,
    explain: "*Lobh*, greed: the \"just one more\" mind. However much we get, it moves the finish line. Its antidote is *contentment* (santosh): enjoying what is already here 🌸",
    hiExplain: "*लोभ*, लालच: \"बस एक और\" वाला मन। जितना भी मिले, वह मंज़िल आगे खिसका देता है। इसकी दवा है *संतोष*: जो है, उसका आनंद 🌸",
    next: ["Ravan's 10 heads 🔥", "Inner Ravan check 🪞", "Another fact 💡"] },
  { id: "ravan", card: "victor",
    en: "💡 *Did you know?*\nRavan was a great scholar and a devotee of Shiva, yet he fell. Why? The story goes that his *ten heads* were ten vices he never conquered.\n\nDussehra isn't only about burning an effigy outside. The real Vijayadashami is defeating those ten heads *inside us* ⚔️\n\n🎯 *Guess:* which of these heads is anger?",
    hi: "💡 *क्या आप जानते हैं?*\nरावण महान विद्वान और शिव भक्त था, फिर भी हार गया। क्यों? कथा कहती है कि उसके *दस सिर* दस बुराइयाँ थीं, जिन्हें उसने कभी नहीं जीता।\n\nदशहरा सिर्फ़ बाहर पुतला जलाना नहीं। असली विजयादशमी है उन दस सिरों को *अपने भीतर* हराना ⚔️\n\n🎯 *अंदाज़ा लगाइए:* इनमें से कौन सा सिर गुस्सा है?",
    options: ["Kaam", "Krodh", "Moh"], hiOptions: ["काम", "क्रोध", "मोह"], answer: 1,
    explain: "*Krodh* is anger. The Gita says anger clouds memory and judgment. A simple way to weaken it: breathe out longer than you breathe in, and wait 20 minutes before you reply ⚔️",
    hiExplain: "*क्रोध* यानी गुस्सा। गीता कहती है गुस्सा याददाश्त और समझ पर पर्दा डाल देता है। इसे कमज़ोर करने का आसान तरीका: साँस अंदर से ज़्यादा लंबी बाहर छोड़ें, और जवाब देने से पहले 20 मिनट रुकें ⚔️",
    next: ["Ravan's 10 heads 🔥", "Kill a head ⚔️", "Another fact 💡"] },
  { id: "siddhi", card: "laghima",
    en: "💡 *Did you know?*\nThe *8 Siddhis* are famous as yogic superpowers: becoming tiny, huge, heavy, weightless…\n\nBut their real meaning is inner. They are powers anyone can grow in daily life ✨\n\n🎯 *Guess:* Laghima, the power to become weightless, really teaches us…",
    hi: "💡 *क्या आप जानते हैं?*\n*आठ सिद्धियाँ* योगियों की अद्भुत शक्तियों के रूप में प्रसिद्ध हैं: छोटा होना, विशाल होना, भारी होना, भारहीन होना…\n\nपर इनका असली अर्थ भीतरी है। ये ऐसी शक्तियाँ हैं जो कोई भी रोज़ के जीवन में बढ़ा सकता है ✨\n\n🎯 *अंदाज़ा लगाइए:* लघिमा, भारहीन होने की शक्ति, असल में सिखाती है…",
    options: ["Letting go", "Flying", "Losing weight"], hiOptions: ["छोड़ देना", "उड़ना", "वज़न घटाना"], answer: 0,
    explain: "*Letting go.* Laghima is lightness of the heart: putting down grudges, worries and things that aren't ours to carry. The lighter we are, the higher we rise ✨",
    hiExplain: "*छोड़ देना।* लघिमा दिल का हल्कापन है: गिले-शिकवे, चिंताएँ और वो बोझ जो हमारा नहीं, उसे नीचे रख देना। जितने हल्के, उतने ऊँचे ✨",
    next: ["The 8 Siddhis ✨", "Feel-good tips 🌻", "Another fact 💡"] },
  { id: "devi", card: "kalaratri",
    en: "💡 *Did you know?*\nThe 9 nights of Navratri are a journey: from Shailaputri at the root to Siddhidatri at the crown. Each Devi is a quality we can live by 🌸\n\n🎯 *Guess:* which Devi teaches us to stay fearless in our darkest night?",
    hi: "💡 *क्या आप जानते हैं?*\nनवरात्रि की 9 रातें एक यात्रा हैं: मूल में शैलपुत्री से शिखर पर सिद्धिदात्री तक। हर देवी एक गुण है जिसे हम जी सकते हैं 🌸\n\n🎯 *अंदाज़ा लगाइए:* कौन सी देवी हमें सबसे अंधेरी रात में भी निडर रहना सिखाती हैं?",
    options: ["Kalaratri", "Mahagauri", "Kushmanda"], hiOptions: ["कालरात्रि", "महागौरी", "कूष्मांडा"], answer: 0,
    explain: "*Maa Kalaratri*, the fiercest form, who destroys darkness and fear. She is also called Shubhankari, the one who brings good. Her lesson: the darkest night is exactly where dawn begins 🌸",
    hiExplain: "*माँ कालरात्रि*, सबसे उग्र रूप, जो अंधकार और भय का नाश करती हैं। उन्हें शुभंकरी भी कहते हैं, जो शुभ करती हैं। उनकी सीख: सबसे अंधेरी रात से ही सुबह शुरू होती है 🌸",
    next: ["The 9 Devis 🌸", "Devi's teaching 🌸", "Another fact 💡"] },
  { id: "nidhi", card: "kunda",
    en: "💡 *Did you know?*\nKubera, the god of wealth, guards *9 treasures*, the Nidhis. But the deepest reading says they are inner wealth, the kind no one can take away 💎\n\n🎯 *Guess:* which treasure is contentment, the one that makes all the others feel enough?",
    hi: "💡 *क्या आप जानते हैं?*\nधन के देवता कुबेर *9 ख़ज़ानों*, यानी निधियों की रक्षा करते हैं। पर गहरा अर्थ कहता है कि ये भीतर की दौलत हैं, जिसे कोई छीन नहीं सकता 💎\n\n🎯 *अंदाज़ा लगाइए:* कौन सा ख़ज़ाना संतोष है, जो बाकी सबको काफ़ी बना देता है?",
    options: ["Kunda", "Padma", "Shankha"], hiOptions: ["कुंद", "पद्म", "शंख"], answer: 0,
    explain: "*Kunda (Nanda) Nidhi*, contentment. _Santosham paramam sukham_: contentment is the greatest happiness. Without it, no amount of wealth ever feels enough 💎",
    hiExplain: "*कुंद (नंद) निधि*, संतोष। _संतोषम् परमम् सुखम्_: संतोष ही सबसे बड़ा सुख है। इसके बिना कितनी भी दौलत काफ़ी नहीं लगती 💎",
    next: ["The 9 Nidhis 💎", "Gratitude journal 📓", "Another fact 💡"] },
  { id: "happy", card: "mukunda",
    en: "💡 *Did you know?*\nThe sages said happiness isn't something we chase outside. Our true nature is *sat-chit-ananda*: being, awareness and bliss. Joy is what's left when the mind's noise settles 🪔\n\n🎯 *Guess:* what's the quickest way to touch that calm right now?",
    hi: "💡 *क्या आप जानते हैं?*\nऋषियों ने कहा, खुशी बाहर ढूँढने की चीज़ नहीं। हमारा असली स्वभाव है *सत्-चित्-आनंद*: अस्तित्व, चेतना और आनंद। मन का शोर थमे, तो जो बचता है वही आनंद है 🪔\n\n🎯 *अंदाज़ा लगाइए:* अभी उस शांति को छूने का सबसे तेज़ रास्ता क्या है?",
    options: ["Watch my breath", "Buy something new", "Scroll my phone"], hiOptions: ["साँस को देखना", "कुछ नया ख़रीदना", "फ़ोन चलाना"], answer: 0,
    explain: "*Watch your breath.* Just notice it coming in and going out, without changing it. In a minute the mind settles, like a lake when the wind stops 🪔",
    hiExplain: "*साँस को देखना।* बस उसे आते और जाते देखिए, बदले बिना। एक मिनट में मन ठहर जाता है, जैसे हवा रुकने पर झील 🪔",
    next: ["Meditate 🧘", "Feel-good tips 🌻", "Another fact 💡"] },
  { id: "shankh", card: "shankha",
    en: "💡 *Did you know?*\nAt the end of an aarti, one long sound of the *shankh* silences everything: the bells, the crowd, even our wandering thoughts. Tradition says the conch is a wake-up call for the soul 🐚\n\nAt Kurukshetra, the great war began not with arrows but with conches, each warrior's with its own name.\n\n🎯 *Guess:* what was Shri Krishna's conch called?",
    hi: "💡 *क्या आप जानते हैं?*\nआरती के अंत में *शंख* की एक लंबी ध्वनि सब कुछ शांत कर देती है: घंटियाँ, भीड़, यहाँ तक कि हमारे भटकते विचार भी। परंपरा कहती है शंख आत्मा को जगाने वाली पुकार है 🐚\n\nकुरुक्षेत्र में महायुद्ध तीरों से नहीं, शंखों से शुरू हुआ था, और हर योद्धा के शंख का अपना नाम था।\n\n🎯 *अंदाज़ा लगाइए:* श्री कृष्ण के शंख का नाम क्या था?",
    options: ["Panchajanya", "Devadatta", "Paundra"], hiOptions: ["पांचजन्य", "देवदत्त", "पौंड्र"], answer: 0,
    explain: "*Panchajanya!* (Arjuna's was Devadatta, Bhima's Paundra.) The story goes it came from a demon who lived in a conch. Read inwardly, \"pancha\" is our senses: when Krishna blows Panchajanya, the senses are mastered. And remember, *your own voice is your conch*: use it to give hope, not noise 🐚",
    hiExplain: "*पांचजन्य!* (अर्जुन का देवदत्त, भीम का पौंड्र था।) कथा कहती है यह शंख में रहने वाले एक दैत्य से आया। भीतरी अर्थ में \"पंच\" हमारी इंद्रियाँ हैं: कृष्ण जब पांचजन्य बजाते हैं, तो इंद्रियाँ वश में होती हैं। और याद रखिए, *आपकी अपनी वाणी ही आपका शंख है*: इससे शोर नहीं, आशा दीजिए 🐚",
    next: ["🐚 Shankh sound", "The 9 Nidhis 💎", "Another fact 💡"] },
];

export const ANOTHER_FACT = "Another fact 💡";
export const HOOK_MENU = "Did you know? 💡";

export function pickHook(seen = []) {
  const fresh = HOOKS.filter((h) => !seen.includes(h.id));
  return (fresh.length ? fresh : HOOKS)[Math.floor(Math.random() * (fresh.length || HOOKS.length))];
}

export function hookAnswer(hook, text) {
  const t = text.trim();
  const i = hook.options.indexOf(t);
  return i >= 0 ? i : hook.hiOptions.indexOf(t);
}

// English → Hindi pairs for the i18n layer.
export const HOOK_HI = [[ANOTHER_FACT, "एक और तथ्य 💡"], [HOOK_MENU, "क्या आप जानते हैं 💡"], ["Fun facts and real meanings", "रोचक तथ्य और असली अर्थ"]];
for (const h of HOOKS) { HOOK_HI.push([h.en, h.hi], [h.explain, h.hiExplain]); h.options.forEach((o, i) => HOOK_HI.push([o, h.hiOptions[i]])); }
