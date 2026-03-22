import { createJob, updateJob } from "./_store.js";
import {
  ensureMethod,
  isAllowedSourceSet,
  normalizeText,
  sendJson,
  shortlistStories,
} from "./_shared.js";

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  const sourceSet = normalizeText(req.body?.sourceSet || "curated-public");
  const region = normalizeText(req.body?.region || "Rajasthan");
  const theme = normalizeText(req.body?.theme || "courage");
  const ageTone = normalizeText(req.body?.ageTone || "family");

  if (!isAllowedSourceSet(sourceSet)) {
    sendJson(res, 400, {
      error: "Only curated-public or manual-library source sets are allowed for Katha Studio.",
    });
    return;
  }

  const ranked = shortlistStories({ sourceSet, region, theme, ageTone });
  const selected = ranked[0];
  const backups = ranked.slice(1, 3);

  const storyDossier = {
    sourceSet,
    region,
    theme,
    ageTone,
    selectedStoryId: selected.id,
    selectedStory: selected,
    backups,
    shortlist: ranked.slice(0, 4),
    authenticityNotes: selected.authenticityNotes,
    copyrightStatus: selected.copyrightStatus,
  };

  const job = createJob({
    status: "research-complete",
    stage: "pipeline-status",
    storyDossier,
    metadata: {
      language: "hindi",
      visualTone: "cinematic-real",
      reviewRequired: true,
    },
  });

  updateJob(job.id, {
    status: "research-complete",
    stage: "pipeline-status",
  });

  sendJson(res, 200, job);
}
