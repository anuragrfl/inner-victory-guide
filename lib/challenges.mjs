// "Kill Ravan's 10 heads": one head at a time, a deep-dive and a 7-day challenge.
// Each day: a small task, what the mind will say to dodge it, and how to answer the mind.

export const MIND_TOOLKIT = `🧠 *How to outsmart the mind*
The mind protects every head of Ravan. It doesn't fight you openly; it _negotiates_. These five tools work for all ten heads:

1️⃣ *Watch, don't wrestle.* Step back and see the thought like a cloud passing. You are the sky, not the cloud (_sakshi bhav_).
2️⃣ *Name it to tame it.* Say silently: "This is Krodh talking." Naming a feeling cools it.
3️⃣ *The 10-second gap.* Between urge and action, take 3 slow breaths. The head loses most of its power in that gap.
4️⃣ *"Not now, later."* Don't argue with the craving; postpone it. Urges rise like a wave and pass in a few minutes.
5️⃣ *Body first.* Stand up, drink water, walk. Change the body and the mind follows.

Remember: you won't silence the mind in a day. You just stop obeying it, one choice at a time 🙏`;

export const CHALLENGE_LEN = 7;

export const HEAD_CHALLENGES = [
  {
    slug: "kaam", name: "Kaam", hi: "काम", en: "endless desire", virtue: "self-control",
    what: "Not desire itself, but the *craving that runs you*: food, phone, shopping, pleasure, always one more.",
    signs: ["You reach for your phone without deciding to", "\"Just one more\" becomes five", "Satisfaction fades minutes after you get what you wanted"],
    trick: "\"You deserve this. You've had a hard day. One time won't matter.\"",
    tips: ["Delay, don't deny: postpone a craving by 10 minutes and watch it shrink", "Remove the trigger: phone in another room, no snacks on the desk", "Replace, don't just resist: a walk, a glass of water, a call to a friend"],
    days: [
      { task: "Notice 3 cravings today. Don't fight them; just write each one down when it comes.", mind: "\"This is silly, I don't have cravings.\"", answer: "Just observe. Seeing is the first sword." },
      { task: "Keep your phone in another room for the first 30 minutes after waking.", mind: "\"What if I miss something important?\"", answer: "The world waited all night. It can wait 30 minutes." },
      { task: "When a craving hits, wait 10 minutes before acting on it. Use a timer.", mind: "\"Just this once, then I'll start.\"", answer: "\"Once\" is how every habit was built. Set the timer." },
      { task: "Eat one meal today slowly, with no screen, tasting every bite.", mind: "\"I'm too busy to eat slowly.\"", answer: "Ten minutes of presence is not busy-ness; it's freedom." },
      { task: "Skip one small pleasure you do on autopilot (dessert, a reel, a purchase).", mind: "\"Life is short, enjoy it.\"", answer: "Real enjoyment needs choice. Autopilot isn't enjoyment." },
      { task: "Swap your biggest craving moment today for a 5-minute walk or a glass of water.", mind: "\"This won't really change anything.\"", answer: "Small swaps rewire the habit. Do it and see." },
      { task: "Write: \"What am I really hungry for?\" (rest, love, meaning?). Give yourself one bit of that today.", mind: "\"Too deep, I'll think later.\"", answer: "The craving is a messenger. Listen to it once." },
    ],
  },
  {
    slug: "krodh", name: "Krodh", hi: "क्रोध", en: "anger", virtue: "patience",
    what: "The fire that flares when things don't go your way. It burns the one who holds it first.",
    signs: ["Jaw tight, voice rising, heart racing", "You replay arguments in your head", "Sharp words you regret within the hour"],
    trick: "\"You're right and they're wrong. If you stay quiet, they'll walk all over you.\"",
    tips: ["Breathe out longer than you breathe in; it physically calms the body", "Delay every reply when angry: no message, no email for 20 minutes", "Ask \"What am I afraid of?\" Anger usually guards a fear or a hurt"],
    days: [
      { task: "Notice your anger signals today: jaw, chest, voice. Just notice where it starts in the body.", mind: "\"I'm not an angry person.\"", answer: "Everyone has a fire. Find where yours lights up." },
      { task: "When irritated, breathe in for 4, out for 8, three times, before you speak.", mind: "\"They need to hear it right now.\"", answer: "Truth spoken calmly lands. Truth shouted is ignored." },
      { task: "Write the angry message you want to send. Don't send it. Delete it after an hour.", mind: "\"But I'm right!\"", answer: "You can be right and still be kind. Wait an hour." },
      { task: "Find the fear under one anger today (\"I'm angry because I'm afraid that…\").", mind: "\"There's no fear, they're just wrong.\"", answer: "Look once more. Anger is a guard dog at the door of hurt." },
      { task: "Say \"You may have a point\" once today, to someone you disagree with.", mind: "\"That's weakness.\"", answer: "It takes more strength to soften than to strike." },
      { task: "Do one physical release: a brisk walk, 20 squats or a cold splash on the face.", mind: "\"I don't have time.\"", answer: "Two minutes now saves an hour of regret later." },
      { task: "Forgive one small thing from this week. Say it silently: \"I release this.\"", mind: "\"They don't deserve forgiveness.\"", answer: "Forgiveness is for your peace, not their reward." },
    ],
  },
  {
    slug: "lobh", name: "Lobh", hi: "लोभ", en: "greed", virtue: "contentment",
    what: "The hunger for *more* that never ends: money, things, status, even likes. Enough never feels like enough.",
    signs: ["You compare prices, salaries, followers constantly", "A new purchase thrills for a day, then you want the next", "Giving feels like losing"],
    trick: "\"When you have a bit more, then you'll be happy and generous.\"",
    tips: ["Count what you have before chasing what you don't", "Give something small away every week; generosity loosens greed's grip", "Define \"enough\" in writing, so you know when you've arrived"],
    days: [
      { task: "Write down 5 things you have today that you once wished for.", mind: "\"That's old; I need new things now.\"", answer: "Once these were your dream. Honour that." },
      { task: "Go one full day without buying anything you don't truly need.", mind: "\"It's on sale, I'm saving money!\"", answer: "Not buying saves 100%." },
      { task: "Give away one thing you don't use, to someone who will.", mind: "\"I might need it someday.\"", answer: "\"Someday\" is greed's favourite word. Let it go." },
      { task: "Write your personal definition of \"enough\" for money or things.", mind: "\"There's no such thing as enough.\"", answer: "Then you'll never arrive. Draw the line yourself." },
      { task: "Mute or unfollow one account that makes you want more.", mind: "\"It's just for inspiration.\"", answer: "Notice how you feel after scrolling it. That's your answer." },
      { task: "Pay for someone's chai, coffee or meal today, quietly.", mind: "\"Why should I spend on others?\"", answer: "Try it once and notice the feeling. That's a Nidhi." },
      { task: "Before bed, say thank you for 3 ordinary things (water, a bed, a friend).", mind: "\"Gratitude won't pay the bills.\"", answer: "No, but it makes the bills feel lighter." },
    ],
  },
  {
    slug: "moh", name: "Moh", hi: "मोह", en: "attachment", virtue: "letting go",
    what: "Clinging to people, things, roles or the past so tightly that love becomes a cage.",
    signs: ["You can't let go of an old hurt, job or relationship", "You control loved ones \"for their own good\"", "Change of any kind feels like loss"],
    trick: "\"If you let go, you'll lose it forever. Holding on is love.\"",
    tips: ["Hold life like water in open palms, not a fist", "Love without owning: care, then step back", "Practise small letting-go daily, so big ones become possible"],
    days: [
      { task: "Name one thing, person or memory you're clinging to. Just write it down.", mind: "\"I'm not attached, I just care.\"", answer: "Caring is open. Clinging is tight. Which one is it?" },
      { task: "Clear one drawer or shelf and let go of what you're keeping \"just in case\".", mind: "\"It has memories.\"", answer: "The memories live in you, not in the object." },
      { task: "Let someone you love make one choice today without your advice.", mind: "\"They'll get it wrong.\"", answer: "Let them learn. That's real love." },
      { task: "Sit 3 minutes with open palms on your knees, breathing out slowly: \"I let it be.\"", mind: "\"This is pointless.\"", answer: "The body teaches the mind how to release. Try it." },
      { task: "Write a short letter to the past (an old hurt or regret) and tear it up.", mind: "\"Digging it up will hurt.\"", answer: "It already hurts in hiding. Let it out to let it go." },
      { task: "Spend 1 hour today without checking on someone or something you usually monitor.", mind: "\"Something bad might happen.\"", answer: "Worry is not protection. Trust for one hour." },
      { task: "Do one thing you've avoided because it means change.", mind: "\"Things are fine the way they are.\"", answer: "Comfortable isn't the same as alive." },
    ],
  },
  {
    slug: "mada", name: "Mada", hi: "मद", en: "pride", virtue: "humility",
    what: "Feeling above others because of money, looks, title, knowledge or success. Ravan tried to lift Kailash with it.",
    signs: ["You need people to know your achievements", "You look down on those with less", "You find it hard to say \"I was wrong\" or \"thank you\""],
    trick: "\"You earned this. If you don't show it, people won't respect you.\"",
    tips: ["Credit others for your success, out loud", "Do one humble task each day that nobody sees", "Remember: every gift you have was given, by parents, teachers, luck and grace"],
    days: [
      { task: "List 3 people without whom your biggest success wouldn't exist.", mind: "\"I did it all myself.\"", answer: "Look again. Someone taught you, fed you, believed in you." },
      { task: "Thank one of them today by message or call.", mind: "\"They know I'm grateful.\"", answer: "Unspoken thanks is a gift left wrapped." },
      { task: "Go a whole day without mentioning your achievements or possessions.", mind: "\"People should know who I am.\"", answer: "Who you are shows without being said." },
      { task: "Do one humble task: wash the dishes, help the cleaner, carry something for someone.", mind: "\"That's not my job.\"", answer: "Kharva Nidhi: the full branch bends low." },
      { task: "Ask someone \"younger\" or \"junior\" to teach you something.", mind: "\"What could they teach me?\"", answer: "Everyone knows something you don't." },
      { task: "Say \"I was wrong\" or \"I don't know\" once today.", mind: "\"It'll make me look weak.\"", answer: "It makes you look real, and people trust real." },
      { task: "Look at the night sky or a big tree for 3 minutes. Feel how small and lucky you are.", mind: "\"I'm busy with important things.\"", answer: "Kailash didn't move for Ravan. Bow to something bigger." },
    ],
  },
  {
    slug: "matsarya", name: "Matsarya", hi: "मात्सर्य", en: "jealousy", virtue: "gratitude",
    what: "The quiet sting when others succeed. Duryodhana's envy of the Pandavas' hall started a war.",
    signs: ["Someone's good news makes you feel smaller", "You secretly enjoy a rival's failure", "Scrolling social media leaves you restless"],
    trick: "\"It's unfair. They don't deserve it as much as you do.\"",
    tips: ["Turn envy into information: what does their success show you about your own goal?", "Bless the person you envy, silently and sincerely", "Count your own blessings before counting theirs"],
    days: [
      { task: "Notice one moment of envy today. Name it: \"This is Matsarya.\"", mind: "\"I'm not jealous, just being realistic.\"", answer: "A small sting counts. Naming it takes its power." },
      { task: "Write what that envy tells you about something you want for yourself.", mind: "\"I'll never get it anyway.\"", answer: "Envy points to a goal. Take one step toward it." },
      { task: "Silently wish the person you envy: \"May you have even more.\"", mind: "\"Why would I wish them well?\"", answer: "Because envy poisons you, not them. Bless and be free." },
      { task: "Congratulate someone on their success today, sincerely.", mind: "\"They'll get arrogant.\"", answer: "Your generosity says who you are." },
      { task: "Take a 24-hour break from social media, or from the one app that triggers comparison.", mind: "\"I'll miss out.\"", answer: "You'll miss comparison. Your peace stays." },
      { task: "Write 5 things in your life that someone else might envy.", mind: "\"My life is ordinary.\"", answer: "Health, a roof, someone who loves you: many pray for these." },
      { task: "Help a peer or competitor with something small.", mind: "\"They'll get ahead of me.\"", answer: "There's room for both of you to bloom." },
    ],
  },
  {
    slug: "swarth", name: "Swarth", hi: "स्वार्थ", en: "selfishness", virtue: "generosity",
    what: "Putting \"me\" first even when it costs others. Kaikeyi's two boons sent Ram into 14 years of exile.",
    signs: ["You keep score of who owes whom", "You take credit, share blame", "Others' needs feel like interruptions"],
    trick: "\"If you don't look after yourself, nobody will.\"",
    tips: ["Before deciding, ask \"Who else does this affect?\"", "Give time, not just money; attention is the rarest gift", "Help one person a day with no expectation"],
    days: [
      { task: "Before one decision today, name 2 people it affects and how.", mind: "\"It's my decision, my life.\"", answer: "Your life is woven with others. Look at the threads." },
      { task: "Do one helpful act for someone and tell no one.", mind: "\"What do I get out of it?\"", answer: "A lighter heart. Try it and see." },
      { task: "Give 15 minutes of full attention to someone who needs to talk.", mind: "\"I don't have time for their problems.\"", answer: "15 minutes could be the best part of their week." },
      { task: "Share credit for something at work or home: \"We did this together.\"", mind: "\"I did most of the work.\"", answer: "Shared credit multiplies; hoarded credit divides." },
      { task: "Let someone else have the better seat, the last piece or the first turn.", mind: "\"Why should I always give in?\"", answer: "This is a choice, not a defeat." },
      { task: "Ask a family member \"How can I help you today?\" and do it.", mind: "\"They'll ask for too much.\"", answer: "Usually they just need to be asked." },
      { task: "Donate a little (money, food, time) to someone in need.", mind: "\"I'll give when I'm richer.\"", answer: "Generosity isn't a size; it's a habit. Start small." },
    ],
  },
  {
    slug: "ahankara", name: "Ahankara", hi: "अहंकार", en: "ego, \"I know best\"", virtue: "surrender",
    what: "The voice that says \"I know best\" and can't hear advice. Ravan insulted Vibhishana and lost his wisest adviser.",
    signs: ["You argue to win, not to understand", "Criticism feels like an attack", "You interrupt to make your point"],
    trick: "\"Admitting they're right means you're less.\"",
    tips: ["Listen to understand, not to reply", "Look for one thing you can learn from every criticism", "Surrender doesn't mean giving up; it means trusting something bigger than your plan"],
    days: [
      { task: "In one conversation today, don't interrupt even once.", mind: "\"But my point is important!\"", answer: "It will still be important in 30 seconds." },
      { task: "Take one recent criticism and write: \"They may be right that…\"", mind: "\"They don't know anything.\"", answer: "Even a broken clock is right twice a day. Find the grain of truth." },
      { task: "Ask for advice from someone today, and try it.", mind: "\"I already know what to do.\"", answer: "Vibhishana's advice could have saved Lanka." },
      { task: "Let someone else win a small argument today.", mind: "\"They're clearly wrong.\"", answer: "Peace matters more than points." },
      { task: "Say \"Tell me more\" when someone disagrees with you.", mind: "\"I don't need to hear more.\"", answer: "Curiosity is ego's kryptonite." },
      { task: "Spend 5 minutes in silent prayer or stillness: \"Not my will, but Thine.\"", mind: "\"I control my own life.\"", answer: "Control what you can; surrender the rest." },
      { task: "Apologise for one thing you were defensive about.", mind: "\"It's too late now.\"", answer: "It's never too late to soften." },
    ],
  },
  {
    slug: "sankirnata", name: "Sankirnata", hi: "संकीर्णता", en: "narrow-mindedness", virtue: "an open mind",
    what: "Judging people by birth, caste, religion, region, accent or looks before knowing them. Karna was judged by his birth, not his skill.",
    signs: ["You form opinions about people within seconds", "\"People like them are all…\"", "New ideas feel threatening"],
    trick: "\"You're just being practical. Everyone thinks this way.\"",
    tips: ["Meet the person, not the label", "Seek out one view different from yours each week", "Notice your first judgment, then look for one fact that disproves it"],
    days: [
      { task: "Notice one quick judgment you make about someone today. Just notice.", mind: "\"I'm not judgmental.\"", answer: "Everyone's mind sorts people. Catch it in the act." },
      { task: "Name one person you admire from a group you hold an opinion about.", mind: "\"They're an exception.\"", answer: "Maybe the \"rule\" is the mistake." },
      { task: "Have a real conversation with someone very different from you.", mind: "\"We have nothing in common.\"", answer: "You'll be surprised. Ask about their dreams." },
      { task: "Read or watch something from a viewpoint you usually avoid.", mind: "\"It's a waste of time.\"", answer: "Understanding isn't agreeing. Just understand." },
      { task: "Catch one stereotype in your speech or a forward, and drop it.", mind: "\"It's just a joke.\"", answer: "Jokes shape how we see people." },
      { task: "Try a food, music or custom from another region or culture.", mind: "\"I like what I know.\"", answer: "Neela Nidhi: be as wide as the sky." },
      { task: "Write one belief you've never questioned. Ask: \"What if I'm wrong?\"", mind: "\"I'm sure about this.\"", answer: "Certainty closes doors. Curiosity opens them." },
    ],
  },
  {
    slug: "hatha", name: "Hatha", hi: "हठ", en: "stubbornness", virtue: "flexibility",
    what: "Digging in your heels even when you sense you're wrong. Duryodhana wouldn't give even five villages, and war followed.",
    signs: ["\"I've decided, end of discussion\"", "You keep a failing plan just to avoid looking wrong", "Compromise feels like losing"],
    trick: "\"Changing your mind means they win.\"",
    tips: ["Ask \"What would change my mind?\" If nothing could, that's Hatha", "Be firm on values, flexible on methods", "Practise small changes so that big ones don't scare you"],
    days: [
      { task: "Ask yourself about one decision: \"What would change my mind?\"", mind: "\"Nothing, I'm right.\"", answer: "If nothing could, that's Hatha talking." },
      { task: "Change one small routine today (route, breakfast, seat).", mind: "\"Why fix what works?\"", answer: "Flexibility is a muscle. Train it with small things." },
      { task: "In one disagreement, find a middle path and offer it.", mind: "\"Meeting halfway means losing.\"", answer: "It means both of you win something." },
      { task: "Admit one plan of yours isn't working, and adjust it.", mind: "\"I've invested too much to stop.\"", answer: "Sunk cost is Duryodhana's trap. Adjust now." },
      { task: "Say yes to one suggestion you'd normally refuse.", mind: "\"My way is better.\"", answer: "Maybe. Try theirs once and find out." },
      { task: "Write your 3 core values. Everything else is open to change.", mind: "\"Everything I believe is a value.\"", answer: "Values are few. Preferences are many." },
      { task: "Go back to someone you were stubborn with and say \"Let's look at it again.\"", mind: "\"They'll think I'm weak.\"", answer: "The bamboo bends and survives the storm." },
    ],
  },
];

export function findHead(text) {
  const t = text.toLowerCase();
  return HEAD_CHALLENGES.find((h) => t.includes(h.name.toLowerCase()) || t.includes(h.slug) || t.includes(h.hi));
}

export function slainBar(slain) {
  return HEAD_CHALLENGES.map((h) => (slain.includes(h.slug) ? "🗡️" : "👹")).join("");
}
