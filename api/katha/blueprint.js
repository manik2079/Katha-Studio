import { getJob, updateJob } from "./_store.js";
import {
  buildFallbackBlueprint,
  completeJson,
  ensureMethod,
  normalizeText,
  sendJson,
} from "./_shared.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  const jobId = normalizeText(req.body?.jobId);
  const requestJob = req.body?.job && typeof req.body.job === "object" ? req.body.job : null;
  const selectedStoryId = normalizeText(req.body?.selectedStoryId);
  const storyEdits = req.body?.storyEdits || {};

  const job = getJob(jobId) || requestJob;
  if (!job) {
    sendJson(res, 404, { error: "Job not found" });
    return;
  }

  const story =
    job.storyDossier?.shortlist?.find((item) => item.id === selectedStoryId) ||
    job.storyDossier?.selectedStory;

  if (!story) {
    sendJson(res, 400, { error: "Selected story not found in dossier" });
    return;
  }

  const mergedStory = {
    ...story,
    title: normalizeText(storyEdits.title || story.title),
    synopsis: normalizeText(storyEdits.synopsis || story.synopsis),
    storyText: normalizeText(storyEdits.storyText || story.storyText),
  };

  const blueprintPayload = await completeJson({
    system:
      "You are Agent 2 of Katha Studio. Return valid JSON only. Write warm Hindi oral storytelling scripts, one continuous arc across exactly seven reels. Each reel needs title, hook, narration, onscreenText, imagePrompt, musicPrompt, cliffhanger, and emotionalBeat.",
    prompt: `Create a 7-reel series blueprint for this folk story.\n\nStory title: ${mergedStory.title}\nRegion: ${mergedStory.region}\nTheme: ${mergedStory.theme}\nSynopsis: ${mergedStory.synopsis}\nFull story text: ${mergedStory.storyText}\n\nReturn JSON with keys hook, emotionalProgression, cliffhangerStyle, reels. Reels must be an array of 7 objects with index 1-7.`,
    fallback: async () => buildFallbackBlueprint(mergedStory),
  });

  const normalizedReels = (blueprintPayload.reels || []).slice(0, 7).map((reel, index) => ({
    index: index + 1,
    title: normalizeText(reel.title || `Part ${index + 1}`),
    hook: normalizeText(reel.hook || "Suno, kahani ka mod yahin se badalta hai."),
    narration: normalizeText(reel.narration || ""),
    onscreenText: normalizeText(reel.onscreenText || ""),
    imagePrompt: normalizeText(reel.imagePrompt || ""),
    musicPrompt: normalizeText(reel.musicPrompt || ""),
    cliffhanger: normalizeText(reel.cliffhanger || ""),
    subtitleText: normalizeText(reel.subtitleText || reel.narration || ""),
    assetStatus: "pending",
    renderStatus: "pending",
    emotionalBeat: normalizeText(reel.emotionalBeat || ""),
  }));

  const nextPatch = {
    status: "blueprint-complete",
    stage: "review-edit",
    storyDossier: {
      ...job.storyDossier,
      selectedStoryId: mergedStory.id,
      selectedStory: mergedStory,
    },
    seriesBlueprint: {
      hook: normalizeText(blueprintPayload.hook),
      emotionalProgression: blueprintPayload.emotionalProgression || normalizedReels.map((reel) => reel.emotionalBeat),
      cliffhangerStyle: normalizeText(blueprintPayload.cliffhangerStyle || "soft-grandmotherly"),
    },
    reels: normalizedReels,
  };

  const updated =
    updateJob(job.id, nextPatch) ||
    {
      ...job,
      ...nextPatch,
      updatedAt: new Date().toISOString(),
    };

  sendJson(res, 200, updated);
}
