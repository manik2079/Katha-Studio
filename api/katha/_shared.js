const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API ||
  process.env.OPEN_AI_API ||
  process.env.OPEN_AI;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export const KATHA_SOURCE_LIBRARY = [
  {
    id: "neelkamal-golden-lotus",
    title: "Neelkamal aur Sone ka Kamal",
    region: "Rajasthan",
    theme: "courage",
    ageTone: "family",
    tags: ["rajput folk", "sibling bond", "trial", "wonder"],
    authenticityNotes: "North-west Indian lok paramparaon me alag-alag roop milte hain; heroic oral retellings common hain.",
    sourceStatus: "public-domain-adaptable",
    copyrightStatus: "safe-curated",
    sourceLinks: [
      {
        label: "Archive.org folk collection",
        url: "https://archive.org/details/indianfolktales",
        type: "archive",
      },
      {
        label: "Cultural retelling reference",
        url: "https://indianculture.gov.in/",
        type: "cultural-portal",
      },
    ],
    synopsis:
      "Ek rajgharane ka bachcha, vanvas, asambhav kasautiyan, aur ek aisi yatra jahan narm dil aur himmat dono ki parakh hoti hai.",
    emotionalPull: 92,
    novelty: 78,
    oralFit: 95,
    sourceConfidence: 88,
    storyText:
      "Purane Rajasthan me ek rani ke bachche ko dushman chal se door bhej diya gaya. Jungle, jadui nishaniyan aur ek behen-bhai ki kasam ke beech, Neelkamal ko har mod par apni akal aur daya ka sahara lena pada. Aakhir me sach saamne aata hai aur parivaar phir se judta hai.",
  },
  {
    id: "tejimola",
    title: "Tejimola",
    region: "Assam",
    theme: "resilience",
    ageTone: "family",
    tags: ["assamese folklore", "rebirth", "motherhood", "poetic"],
    authenticityNotes: "Assam ki lokkatha, kai school collections aur cultural archives me documented hai.",
    sourceStatus: "public-domain-adaptable",
    copyrightStatus: "safe-curated",
    sourceLinks: [
      {
        label: "Assamese folklore reference",
        url: "https://archive.org/details/folktalesofassam",
        type: "archive",
      },
      {
        label: "Government culture portal",
        url: "https://indianculture.gov.in/",
        type: "cultural-portal",
      },
    ],
    synopsis:
      "Ek ladki zulm jhelti hai, lekin uski komalta aur jeevan shakti baar-baar naye roop me laut kar insaaf dilati hai.",
    emotionalPull: 96,
    novelty: 84,
    oralFit: 90,
    sourceConfidence: 91,
    storyText:
      "Assam ke gaon me Tejimola naam ki ladki apni sauteli maa ke atyachar seh kar bhi tootti nahi. Woh kabhi paudhe, kabhi phool, kabhi geet ki tarah laut aati hai. Aakhir uski kahani sach ko sabke saamne laakar daya aur insaaf ki jeet ban jaati hai.",
  },
  {
    id: "kannagi-silambu",
    title: "Kannagi aur Payal ka Sach",
    region: "Tamil Nadu",
    theme: "justice",
    ageTone: "young-adult",
    tags: ["devotion", "justice", "epic", "moral fire"],
    authenticityNotes: "Silappatikaram epic se prerit lok-oral adaptations; dramatized oral version suitable for reels.",
    sourceStatus: "public-domain-adaptable",
    copyrightStatus: "safe-curated",
    sourceLinks: [
      {
        label: "Digital Library of India reference",
        url: "https://archive.org/details/digitallibraryindia",
        type: "archive",
      },
      {
        label: "Cultural portal reference",
        url: "https://indianculture.gov.in/",
        type: "cultural-portal",
      },
    ],
    synopsis:
      "Ek nari apne pati par lage jhoothe ilzaam ko sach ki taqat se palat deti hai aur poore shahar ko nyaay ka matlab yaad dila deti hai.",
    emotionalPull: 89,
    novelty: 82,
    oralFit: 86,
    sourceConfidence: 90,
    storyText:
      "Kannagi apni payal lekar rajdarbar pahunchti hai aur sabit karti hai ki uske pati ko jhoothe aarop me maara gaya. Uska dard gusse me badalta hai, aur rajya ko nyaay aur zimmedari ki keemat samajh aati hai.",
  },
  {
    id: "shekhchilli-lost-shadow",
    title: "Shekhchilli aur Gumshuda Saya",
    region: "Uttar Pradesh",
    theme: "wit",
    ageTone: "kids",
    tags: ["humor", "village", "trickster", "oral comedy"],
    authenticityNotes: "Shekhchilli oral cycle me loosely adapted comic tale; family-safe retelling.",
    sourceStatus: "public-domain-adaptable",
    copyrightStatus: "safe-curated",
    sourceLinks: [
      {
        label: "Public-domain trickster tales",
        url: "https://archive.org/details/indianfairytales",
        type: "archive",
      },
      {
        label: "Cultural reference",
        url: "https://indianculture.gov.in/",
        type: "cultural-portal",
      },
    ],
    synopsis:
      "Shekhchilli ko lagta hai uska saya chori ho gaya. Gaon bhar ka hungama ek hasi bhari seekh me badal jaata hai.",
    emotionalPull: 74,
    novelty: 72,
    oralFit: 94,
    sourceConfidence: 85,
    storyText:
      "Ek din Shekhchilli dekhta hai ki dhoop badli aur uska saya chhota-bada ho raha hai. Use lagta hai koi uska saya chura raha hai. Poora gaon uske saath bhaag-daud karta hai, aur phir sabko apni hi hansi aa jaati hai.",
  },
];

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function ensureMethod(req, res, method) {
  if (req.method !== method) {
    sendJson(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

export function normalizeText(value) {
  return String(value || "").trim();
}

export function isAllowedSourceSet(sourceSet) {
  return ["curated-public", "manual-library"].includes(sourceSet);
}

export function scoreStory(story, filters) {
  const regionBoost = story.region === filters.region ? 8 : 0;
  const themeBoost = story.theme === filters.theme ? 10 : 0;
  const ageBoost = story.ageTone === filters.ageTone ? 6 : 0;
  return (
    story.emotionalPull * 0.35 +
    story.oralFit * 0.3 +
    story.sourceConfidence * 0.2 +
    story.novelty * 0.15 +
    regionBoost +
    themeBoost +
    ageBoost
  );
}

export function shortlistStories(filters) {
  return [...KATHA_SOURCE_LIBRARY]
    .map((story) => ({
      ...story,
      score: Math.round(scoreStory(story, filters)),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function completeJson({ system, prompt, fallback }) {
  if (!OPENAI_API_KEY) return fallback();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return fallback();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback();
    return JSON.parse(content);
  } catch {
    return fallback();
  }
}

function buildPalette(seed) {
  const presets = [
    ["#25150f", "#7d3f22", "#f0c58e"],
    ["#1d1f2f", "#754f8f", "#f1d0a8"],
    ["#132429", "#386d73", "#e6c4a8"],
    ["#24140f", "#983b2e", "#f7ddae"],
  ];
  return presets[seed % presets.length];
}

export function createPosterDataUrl({ title, subtitle, paletteSeed = 0, badge = "Reel" }) {
  const [base, accent, light] = buildPalette(paletteSeed);
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeBadge = escapeXml(badge);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${base}" />
          <stop offset="55%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#0b0b0f" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="${light}" stop-opacity="0.5" />
          <stop offset="100%" stop-color="${light}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#bg)" />
      <rect width="1080" height="1920" fill="url(#glow)" />
      <circle cx="840" cy="280" r="190" fill="${light}" fill-opacity="0.12" />
      <path d="M120 1500 C 320 1250, 710 1260, 960 960 L 960 1720 L 120 1720 Z" fill="${light}" fill-opacity="0.09" />
      <rect x="82" y="90" width="250" height="64" rx="32" fill="rgba(255,255,255,0.14)" />
      <text x="132" y="132" fill="#fff4df" font-size="30" font-family="Georgia, serif" letter-spacing="6">${safeBadge}</text>
      <text x="84" y="1180" fill="#fff4df" font-size="120" font-family="Georgia, serif" font-weight="700">${safeTitle}</text>
      <foreignObject x="84" y="1236" width="910" height="380">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color:#f9e9cf;font-size:44px;line-height:1.35;font-family:Georgia,serif;max-width:910px;">
          ${safeSubtitle}
        </div>
      </foreignObject>
      <text x="84" y="1810" fill="rgba(255,244,223,0.8)" font-size="34" font-family="Georgia, serif">Katha Studio cinematic oral retelling</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function buildSubtitleCues(text, durationSec) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const chunkSize = Math.max(8, Math.ceil(words.length / 3));
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  const slot = durationSec / chunks.length;
  return chunks
    .map((chunk, index) => {
      const start = formatSrtTime(index * slot);
      const end = formatSrtTime((index + 1) * slot - 0.15);
      return `${index + 1}\n${start} --> ${end}\n${chunk}`;
    })
    .join("\n\n");
}

function formatSrtTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function writeWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = Buffer.alloc(44 + samples.length * bytesPerSample);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * bytesPerSample, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * bytesPerSample, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index], 44 + index * 2);
  }
  return buffer;
}

function buildToneTrack({ frequencies, durationSec, volume = 0.2 }) {
  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    let value = 0;
    for (let j = 0; j < frequencies.length; j += 1) {
      value += Math.sin(2 * Math.PI * frequencies[j] * t) / frequencies.length;
    }
    const envelope = Math.min(1, t / 0.8, (durationSec - t) / 0.8);
    samples[i] = Math.round(value * envelope * volume * 32767);
  }
  return writeWav(samples, sampleRate);
}

export function createAmbientMusicDataUrl({ reelIndex, durationSec }) {
  const base = 110 + reelIndex * 8;
  const buffer = buildToneTrack({
    frequencies: [base, base * 1.5, base * 2],
    durationSec,
    volume: 0.12,
  });
  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}

export function createFallbackVoiceDataUrl({ reelIndex, durationSec }) {
  const base = 180 + reelIndex * 12;
  const buffer = buildToneTrack({
    frequencies: [base, base * 1.01],
    durationSec,
    volume: 0.08,
  });
  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}

export async function createVoiceoverDataUrl({ text, reelIndex, voiceId }) {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (elevenLabsKey && voiceId) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.75,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
      }
    } catch {}
  }

  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "sage",
          input: text,
          format: "mp3",
          instructions:
            "Warm Hindi oral storyteller voice, intimate like a grandmother telling a night story, unhurried but gripping.",
        }),
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
      }
    } catch {}
  }

  const estimatedDurationSec = estimateNarrationDuration(text);
  return createFallbackVoiceDataUrl({ reelIndex, durationSec: estimatedDurationSec });
}

export async function createVisualDataUrl({ title, prompt, reelIndex }) {
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          size: "1024x1536",
          quality: "medium",
          prompt,
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const imageBase64 = payload.data?.[0]?.b64_json;
        if (imageBase64) {
          return `data:image/png;base64,${imageBase64}`;
        }
      }
    } catch {}
  }

  return createPosterDataUrl({
    title,
    subtitle: prompt,
    paletteSeed: reelIndex - 1,
    badge: `REEL ${reelIndex}`,
  });
}

export function estimateNarrationDuration(text) {
  const wordCount = normalizeText(text).split(/\s+/).filter(Boolean).length;
  return Math.min(48, Math.max(18, Math.round((wordCount / 2.4) * 10) / 10));
}

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildFallbackBlueprint(story) {
  const beats = [
    "Purani duniya ka darwaza khulta hai aur kahani ki mitti ki khushboo aati hai.",
    "Nayak ya nayika ki seedhi zindagi me pehla daraar padta hai.",
    "Jungle, safar ya samaj ka ek kathin imtihaan saamne aata hai.",
    "Andar ka darr aur bahar ki mushkil takraate hain.",
    "Ek chhota sa ishara sach ya raasta dikhaata hai.",
    "Sach khulne ke kareeb sab kuch toot-ta sa lagta hai.",
    "Ant me kahani apni seekh ke saath dil me baith jaati hai.",
  ];

  const blueprint = beats.map((beat, index) => {
    const reelNumber = index + 1;
    return {
      index: reelNumber,
      title: `Part ${reelNumber}: ${[
        "Shuruaat",
        "Pehla Mod",
        "Kasauti",
        "Andhera",
        "Nishani",
        "Sach ka Darwaza",
        "Ant aur Seekh",
      ][index]}`,
      hook:
        index === 0
          ? "Socho, agar ek raat me poori zindagi ulat jaye to?"
          : index === 6
            ? "Aur phir jo hua, usne poori kahani ka matlab badal diya."
            : "Par asli mod to abhi aana baaki tha.",
      narration:
        `${story.title} ki iss kadi me ${beat} ${story.storyText} Is mod par hawa bhi jaise dheere chal rahi thi, jaise dadi apni awaaz halka sa neeche karke agla raaz batane wali ho.`,
      onscreenText:
        index === 0
          ? `${story.title}\nEk purani kahani, saat hisson me`
          : `Part ${reelNumber}\n${beat}`,
      imagePrompt:
        `Cinematic-real still for a vertical reel, inspired by ${story.region} folk atmosphere, warm lamp light, tactile textiles, expressive faces, oral storytelling mood, ${beat}`,
      musicPrompt:
        index < 3
          ? "soft tanpura drone with earthy percussion pulse"
          : index < 6
            ? "tense folk strings, low drone, restrained heartbeat rhythm"
            : "resolved folk melody with warm flute and soft percussion",
      cliffhanger:
        index === 6
          ? "Agli baar kisi aur lokkatha ka darwaza kholenge."
          : "Lekin asli baat abhi chhupi hui thi...",
      emotionalBeat: ["wonder", "unease", "tension", "fear", "hope", "revelation", "resolution"][index],
    };
  });

  return {
    hook: `${story.title}: ek aisi lokkatha jo raat ki khamoshi me aur gehri lagti hai`,
    emotionalProgression: ["wonder", "unease", "tension", "fear", "hope", "revelation", "resolution"],
    cliffhangerStyle: "soft-grandmotherly",
    reels: blueprint,
  };
}
