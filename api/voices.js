export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(200).json([
      { voice_id: "", name: "Default warm narrator" },
    ]);
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      return res.status(200).json([
        { voice_id: "", name: "Default warm narrator" },
      ]);
    }

    const payload = await response.json();
    const voices = Array.isArray(payload.voices)
      ? payload.voices.map((voice) => ({
          voice_id: voice.voice_id,
          name: voice.name,
        }))
      : [];

    return res.status(200).json([
      { voice_id: "", name: "Default warm narrator" },
      ...voices,
    ]);
  } catch {
    return res.status(200).json([
      { voice_id: "", name: "Default warm narrator" },
    ]);
  }
}
