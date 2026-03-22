const globalStore = globalThis.__KATHA_JOB_STORE__ || new Map();

if (!globalThis.__KATHA_JOB_STORE__) {
  globalThis.__KATHA_JOB_STORE__ = globalStore;
}

export function createJob(seed = {}) {
  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    status: "draft",
    stage: "story-intake",
    createdAt: now,
    updatedAt: now,
    storyDossier: null,
    seriesBlueprint: null,
    reels: [],
    assets: [],
    exports: [],
    errors: [],
    metadata: {},
    ...seed,
  };

  globalStore.set(job.id, job);
  return job;
}

export function getJob(id) {
  return globalStore.get(id) || null;
}

export function updateJob(id, patch) {
  const current = getJob(id);
  if (!current) return null;
  const nextPatch = typeof patch === "function" ? patch(current) : patch;
  const updated = {
    ...current,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  };
  globalStore.set(id, updated);
  return updated;
}

export function appendJobError(id, error) {
  return updateJob(id, (job) => ({
    errors: [
      ...(job.errors || []),
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ...error,
      },
    ],
  }));
}
