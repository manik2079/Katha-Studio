import { getJob, updateJob } from "./_store.js";
import {
  buildSubtitleCues,
  createAmbientMusicDataUrl,
  createVisualDataUrl,
  createVoiceoverDataUrl,
  ensureMethod,
  estimateNarrationDuration,
  normalizeText,
  sendJson,
} from "./_shared.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  const jobId = normalizeText(req.body?.jobId);
  const requestJob = req.body?.job && typeof req.body.job === "object" ? req.body.job : null;
  const approvedReels = Array.isArray(req.body?.reels) ? req.body.reels : null;
  const voiceId = normalizeText(req.body?.voiceId);

  const job = getJob(jobId) || requestJob;
  if (!job) {
    sendJson(res, 404, { error: "Job not found" });
    return;
  }

  const reels = approvedReels?.length ? approvedReels : job.reels;
  if (!Array.isArray(reels) || reels.length !== 7) {
    sendJson(res, 400, { error: "Exactly 7 reels are required before asset generation." });
    return;
  }

  updateJob(job.id, {
    status: "asset-generation",
    stage: "asset-generation",
    reels: reels.map((reel) => ({ ...reel, assetStatus: "generating" })),
  });

  const assets = await Promise.all(
    reels.map(async (reel) => {
      const durationSec = estimateNarrationDuration(reel.narration);
      const [imageUrl, voiceoverUrl] = await Promise.all([
        createVisualDataUrl({
          title: reel.title,
          prompt: reel.imagePrompt,
          reelIndex: reel.index,
        }),
        createVoiceoverDataUrl({
          text: reel.narration,
          reelIndex: reel.index,
          voiceId,
        }),
      ]);

      const musicUrl = createAmbientMusicDataUrl({
        reelIndex: reel.index,
        durationSec,
      });

      return {
        reelIndex: reel.index,
        imageUrl,
        voiceoverUrl,
        musicUrl,
        durationSec,
        subtitleText: normalizeText(reel.subtitleText || reel.narration),
        subtitleSrt: buildSubtitleCues(reel.subtitleText || reel.narration, durationSec),
        status: "ready",
      };
    })
  );

  const nextPatch = {
    status: "assets-ready",
    stage: "asset-generation",
    reels: reels.map((reel) => ({ ...reel, assetStatus: "ready" })),
    assets,
    metadata: {
      ...job.metadata,
      voiceId: voiceId || null,
    },
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
