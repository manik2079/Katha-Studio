import { getJob, updateJob } from "./_store.js";
import { ensureMethod, normalizeText, sendJson } from "./_shared.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  const jobId = normalizeText(req.body?.jobId);
  const exportsPayload = Array.isArray(req.body?.exports) ? req.body.exports : null;
  const job = getJob(jobId);

  if (!job) {
    sendJson(res, 404, { error: "Job not found" });
    return;
  }

  if (!exportsPayload) {
    const manifest = {
      jobId: job.id,
      status: "render-manifest-ready",
      stage: "export-download",
      video: {
        width: 1080,
        height: 1920,
        fps: 24,
        safeMargin: 84,
        introLabel: "Katha Studio",
      },
      reels: job.reels.map((reel) => {
        const asset = job.assets.find((item) => item.reelIndex === reel.index);
        return {
          index: reel.index,
          title: reel.title,
          onscreenText: reel.onscreenText,
          subtitleSrt: asset?.subtitleSrt || "",
          imageUrl: asset?.imageUrl || "",
          voiceoverUrl: asset?.voiceoverUrl || "",
          musicUrl: asset?.musicUrl || "",
          durationSec: asset?.durationSec || 20,
        };
      }),
    };

    updateJob(job.id, {
      status: "render-manifest-ready",
      stage: "export-download",
      reels: job.reels.map((reel) => ({ ...reel, renderStatus: "queued" })),
    });

    sendJson(res, 200, manifest);
    return;
  }

  const updated = updateJob(job.id, {
    status: "render-complete",
    stage: "export-download",
    exports: exportsPayload,
    reels: job.reels.map((reel) => ({
      ...reel,
      renderStatus: exportsPayload.find((item) => item.reelIndex === reel.index)?.status || "failed",
    })),
  });

  sendJson(res, 200, updated);
}
