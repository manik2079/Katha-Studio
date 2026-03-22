import { getJob } from "../../_store.js";
import { sendJson } from "../../_shared.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const id = req.query?.id;
  const job = getJob(id);

  if (!job) {
    sendJson(res, 404, { error: "Job not found" });
    return;
  }

  sendJson(res, 200, job);
}
