// Short guided meditations, sent as one calm message each. Then the guide asks how it felt.

export const MEDITATIONS = [
  { key: "breath", title: "🌬️ Watch the breath", description: "1 minute · steady the mind", card: "kachchhapa",
    text: `🌬️ *Watch the breath* · 1 minute

Sit comfortably. Let your shoulders drop.
Close your eyes, or rest them softly on the floor.

Now just *watch your breath*… coming in… going out.
Don't change it. Only watch.

Cool air coming in… warm air going out.
When the mind wanders, smile, and come back to the breath.

Stay with 10 breaths.
Slowly, the mind becomes still, like a lake after the wind stops. 🙏` },
  { key: "calm", title: "😮‍💨 Calm in 6 breaths", description: "For stress and worry", card: "shailaputri",
    text: `😮‍💨 *Calm in 6 breaths* · for stress and worry

Breathe *in* through the nose… 1, 2, 3, 4
Breathe *out* slowly through the mouth… 1, 2, 3, 4, 5, 6

Do this six times.
With every out-breath, let your shoulders and jaw soften.

Silently say: _"I am safe. This moment is enough."_

A long out-breath tells the body: you can relax now. 🌸` },
  { key: "heart", title: "💛 Hand on heart", description: "Self-love · 2 minutes", card: "kushmanda",
    text: `💛 *Hand on heart* · self-love, 2 minutes

Place your hand gently on your heart.
Feel its warmth… feel it beating, for you, every moment.

Breathe slowly and say silently:
_"I am here for you."_
_"I am enough, just as I am."_
_"May I be kind to myself today."_

If a tear or a smile comes, let it. 🌷
You deserve the love you give to others.` },
  { key: "witness", title: "☁️ Watch the thoughts", description: "Be the sky, not the clouds", card: "mahagauri",
    text: `☁️ *Watch the thoughts* · 2 minutes

Close your eyes. Imagine a wide, clear sky.
Your thoughts are clouds passing through it.

A thought comes… notice it: _"ah, a thought"_… let it drift away.
Don't fight it. Don't follow it. Just watch.

You are the *sky*, not the clouds.
Clouds come and go; the sky is always peaceful.

This is _sakshi bhav_, the witness inside you. ✨` },
  { key: "sohum", title: "🕉️ So-Hum mantra", description: "Breath + mantra · 2 minutes", card: "siddhidatri",
    text: `🕉️ *So-Hum* · 2 minutes

Breathe naturally.
On the in-breath, silently hear *"So…"*
On the out-breath, silently hear *"Hum…"*

So-Hum means _"I am That"_: I am one with the peace of the universe.

Let the mantra ride on the breath, easy and soft.
If the mind wanders, gently return to So… Hum…

You are not the worries. You are That: pure, peaceful, blissful. 🙏` },
  { key: "gratitude", title: "🙏 Gratitude breath", description: "Fill the heart · 1 minute", card: "kunda",
    text: `🙏 *Gratitude breath* · 1 minute

Breathe in slowly.
With each out-breath, silently thank one thing:

…my breath
…my body that carries me
…someone who loves me
…food on my plate
…this very moment

Notice how the heart feels fuller.
Santosham paramam sukham: contentment is the greatest happiness. 🌸` },
  { key: "sleep", title: "🌙 Before sleep", description: "Let the day go", card: "kalaratri",
    text: `🌙 *Before sleep* · let the day go

Lie down. Let the bed hold your whole weight.
Breathe out slowly, three times.

Now let the day go, piece by piece:
_"I release today's work… today's worries… today's words."_

Soften the forehead… the jaw… the shoulders… the belly… the legs.

Whatever wasn't finished can wait for tomorrow.
Tonight, you rest. You are safe. You did enough. 🌙` },
  { key: "morning", title: "🌅 Morning intention", description: "Start the day with light", card: "kushmanda",
    text: `🌅 *Morning intention* · 1 minute

Before the phone, before the rush, sit for one minute.

Three slow breaths.
Feel gratitude for a new day: _"Thank you for this day."_

Now choose one quality to carry today: patience, kindness, courage, joy…
Say it silently: _"Today I choose ____."_

Smile softly. Carry this light with you. ☀️` },
  { key: "shankh", title: "🐚 Shankh sound", description: "Sound, then silence · 2 minutes", card: "shankha",
    text: `🐚 *Sound of the shankh* · 2 minutes

Sit tall. Close your eyes.
Take a deep breath in… and on the out-breath hum a long, low *"Ommm…"*, like the sound of a conch.

Feel it vibrate in your chest and throat.
Do it three times.

Now stop… and *listen to the silence* after the sound.
That stillness is the real gift of the shankh: the noise outside stops, and you meet the quiet inside.

Ask softly: _"Beneath all the noise, what is my true sound?"_ 🙏` },
];

export function findMeditation(text) {
  const t = text.trim().toLowerCase();
  return MEDITATIONS.find((m) => m.title.toLowerCase() === t) || null;
}
