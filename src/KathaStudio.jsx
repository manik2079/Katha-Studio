import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createZipBlob } from "./simpleZip.js";

const REGIONS = ["Rajasthan", "Assam", "Tamil Nadu", "Uttar Pradesh"];
const THEMES = ["courage", "resilience", "justice", "wit"];
const AGE_TONES = ["family", "kids", "young-adult"];

const MODULE_TABS = [
  { id: "setup", label: "Setup" },
  { id: "agent1", label: "Agent 1" },
  { id: "agent2", label: "Agent 2" },
  { id: "agent3", label: "Agent 3" },
  { id: "agent4", label: "Agent 4" },
];

const KATHA_CSS = `
.katha-shell {
  min-height: 100vh;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 10%, var(--glow-soft), transparent 26%),
    radial-gradient(circle at 88% 8%, var(--glow-hot), transparent 22%),
    linear-gradient(180deg, var(--surface) 0%, var(--surface-deep) 100%);
}

.katha-frame {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 18px 72px;
}

.katha-panel {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.katha-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px;
}

.katha-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted-strong);
}

.katha-title {
  margin: 8px 0 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(34px, 5vw, 60px);
  line-height: 0.95;
  letter-spacing: -0.04em;
}

.katha-title span {
  color: var(--accent);
}

.katha-header-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.katha-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.katha-tab {
  border: 1px solid var(--line-soft);
  background: var(--inner);
  color: var(--text-soft);
  border-radius: 18px;
  min-height: 58px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.katha-tab:hover {
  transform: translateY(-1px);
}

.katha-tab[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
  color: var(--text);
}

.katha-tab:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  transform: none;
}

.katha-stage {
  margin-top: 18px;
  padding: 24px;
}

.katha-stage-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.katha-stage-title {
  margin: 6px 0 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 34px;
  line-height: 1;
}

.katha-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.katha-pill[data-tone="idle"] {
  background: rgba(255,255,255,0.06);
  color: var(--text-soft);
}

.katha-pill[data-tone="warn"] {
  background: rgba(251,191,36,0.14);
  color: #fbbf24;
}

.katha-pill[data-tone="ok"] {
  background: rgba(74,222,128,0.14);
  color: #86efac;
}

.katha-pill[data-tone="live"] {
  background: rgba(125,211,252,0.14);
  color: #7dd3fc;
}

.katha-pill[data-tone="error"] {
  background: rgba(248,113,113,0.14);
  color: #fca5a5;
}

.katha-grid {
  display: grid;
  gap: 14px;
}

.katha-grid.two {
  grid-template-columns: minmax(0, 0.88fr) minmax(320px, 0.72fr);
}

.katha-grid.story {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.katha-grid.preview {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.katha-card {
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: var(--inner);
}

.katha-card.pad {
  padding: 18px;
}

.katha-field {
  display: grid;
  gap: 7px;
}

.katha-field span {
  font-size: 12px;
  font-weight: 700;
}

.katha-input,
.katha-select,
.katha-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--line-soft);
  background: var(--input);
  color: var(--text);
  border-radius: 16px;
  padding: 13px 14px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.katha-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.56;
}

.katha-button,
.katha-button-secondary {
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.katha-button:hover,
.katha-button-secondary:hover {
  transform: translateY(-1px);
}

.katha-button:disabled,
.katha-button-secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.katha-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 999px;
  padding: 0 18px;
  background: linear-gradient(135deg, var(--accent), var(--accent-deep));
  color: var(--accent-contrast);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.katha-button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 999px;
  padding: 0 16px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--line-soft);
  font-size: 13px;
  font-weight: 700;
}

.katha-story-card {
  text-align: left;
  color: inherit;
  cursor: pointer;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.katha-story-card[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.katha-story-title {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 23px;
  line-height: 1.04;
}

.katha-chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.katha-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: rgba(255,255,255,0.04);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-soft);
}

.katha-note {
  display: grid;
  gap: 8px;
  padding: 18px;
}

.katha-note strong {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted-strong);
}

.katha-note span,
.katha-note a {
  font-size: 14px;
  line-height: 1.56;
  color: var(--text-soft);
  text-decoration: none;
}

.katha-source-list {
  display: grid;
  gap: 10px;
}

.katha-source-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
}

.katha-source-link:hover {
  border-color: var(--accent-line);
}

.katha-reel-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.katha-reel-tab {
  text-align: left;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--inner);
  color: inherit;
  cursor: pointer;
  padding: 12px;
}

.katha-reel-tab[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.katha-reel-tab strong {
  display: block;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-strong);
  margin-bottom: 8px;
}

.katha-reel-tab span {
  display: block;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-soft);
}

.katha-reel-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
}

.katha-editor-col {
  display: grid;
  gap: 12px;
}

.katha-preview-card {
  overflow: hidden;
}

.katha-preview-visual {
  position: relative;
  aspect-ratio: 9 / 16;
  background: #0d0d0c;
}

.katha-preview-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.katha-preview-overlay {
  position: absolute;
  inset: auto 14px 14px 14px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(9,8,8,0.58);
  color: #fff7e8;
  font-size: 13px;
  line-height: 1.45;
  backdrop-filter: blur(8px);
}

.katha-preview-body {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.katha-audio-stack {
  display: grid;
  gap: 10px;
}

.katha-audio-stack audio {
  width: 100%;
}

.katha-export-list {
  display: grid;
  gap: 12px;
}

.katha-export-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 16px 18px;
}

.katha-export-title {
  font-weight: 800;
}

.katha-export-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted);
}

.katha-progress {
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}

.katha-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-deep));
}

.katha-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  border: 1px dashed var(--line-soft);
  background: var(--inner);
  color: var(--muted);
  text-align: center;
  padding: 22px;
}

.katha-alert {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 22px;
  border: 1px solid rgba(248,113,113,0.26);
  background: rgba(127,29,29,0.08);
  color: #fecaca;
  line-height: 1.56;
}

@media (max-width: 1100px) {
  .katha-grid.two,
  .katha-reel-editor,
  .katha-grid.preview {
    grid-template-columns: 1fr;
  }

  .katha-grid.story {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .katha-reel-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .katha-tabs {
    grid-template-columns: 1fr 1fr;
  }

  .katha-grid.story {
    grid-template-columns: 1fr;
  }

  .katha-reel-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .katha-export-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .katha-frame {
    padding: 18px 12px 56px;
  }

  .katha-header,
  .katha-stage {
    padding: 18px;
  }

  .katha-tabs,
  .katha-reel-strip {
    grid-template-columns: 1fr;
  }
}
`;

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function useFfmpeg() {
  const ffmpegRef = useRef(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current && ffmpegRef.current) return ffmpegRef.current;

    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegRef.current = ffmpeg;
    loadedRef.current = true;
    return ffmpeg;
  }, []);

  return load;
}

async function dataUrlToUint8Array(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function imageUrlToPngBytes(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 1080;
        canvas.height = image.naturalHeight || 1920;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
        if (!blob) {
          reject(new Error("Failed to rasterize image"));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Failed to load image for rendering"));
    image.src = url;
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function revokeExportUrls(items) {
  for (const item of items) {
    if (item?.url) URL.revokeObjectURL(item.url);
  }
}

function StatusPill({ label, tone = "idle" }) {
  return (
    <span className="katha-pill" data-tone={tone}>
      {label}
    </span>
  );
}

function EmptyState({ children }) {
  return <div className="katha-empty">{children}</div>;
}

export default function KathaStudio({ darkMode }) {
  const loadFfmpeg = useFfmpeg();
  const [activeTab, setActiveTab] = useState("setup");
  const [filters, setFilters] = useState({
    sourceSet: "curated-public",
    region: "Rajasthan",
    theme: "courage",
    ageTone: "family",
  });
  const [job, setJob] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [selectedReelIndex, setSelectedReelIndex] = useState(1);
  const [storyDraft, setStoryDraft] = useState({ title: "", synopsis: "", storyText: "" });
  const [reelDrafts, setReelDrafts] = useState([]);
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [renderProgress, setRenderProgress] = useState({ total: 7, done: 0, current: "" });
  const [exportsState, setExportsState] = useState([]);
  const [zipBlob, setZipBlob] = useState(null);
  const [zipName, setZipName] = useState("");

  useEffect(() => {
    let ignore = false;
    async function fetchVoices() {
      try {
        const response = await fetch("/api/voices");
        if (!response.ok) return;
        const data = await response.json();
        if (ignore) return;
        setVoices(data);
        if (data[0]?.voice_id !== undefined) {
          setVoiceId((current) => current || data[0].voice_id);
        }
      } catch {}
    }
    fetchVoices();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!job?.storyDossier) return;
    const selected =
      job.storyDossier.shortlist?.find((story) => story.id === job.storyDossier.selectedStoryId) ||
      job.storyDossier.selectedStory;
    if (!selected) return;
    setSelectedStoryId(selected.id);
    setStoryDraft({
      title: selected.title,
      synopsis: selected.synopsis,
      storyText: selected.storyText,
    });
  }, [job?.storyDossier]);

  useEffect(() => {
    if (!job?.reels?.length) return;
    setReelDrafts(job.reels);
  }, [job?.reels]);

  useEffect(() => {
    if (!reelDrafts.length) {
      setSelectedReelIndex(1);
      return;
    }
    if (!reelDrafts.some((reel) => reel.index === selectedReelIndex)) {
      setSelectedReelIndex(reelDrafts[0].index);
    }
  }, [reelDrafts, selectedReelIndex]);

  useEffect(() => {
    return () => {
      revokeExportUrls(exportsState);
    };
  }, [exportsState]);

  const shortlistedStories = job?.storyDossier?.shortlist || [];
  const selectedStory = useMemo(
    () =>
      shortlistedStories.find((story) => story.id === selectedStoryId) ||
      job?.storyDossier?.selectedStory ||
      null,
    [job, shortlistedStories, selectedStoryId]
  );
  const selectedReel = useMemo(
    () => reelDrafts.find((reel) => reel.index === selectedReelIndex) || reelDrafts[0] || null,
    [reelDrafts, selectedReelIndex]
  );

  const readyAssetCount = job?.assets?.filter((item) => item.status === "ready").length || 0;
  const readyExportCount = exportsState.filter((item) => item.status === "ready").length;
  const canRunAgent1 = busy === "";
  const canRunAgent2 = busy === "" && Boolean(job?.id && selectedStoryId);
  const canRunAgent3 = busy === "" && reelDrafts.length === 7;
  const canRunAgent4 = busy === "" && Boolean(job?.assets?.length);
  const assetProgress = reelDrafts.length ? Math.round((readyAssetCount / reelDrafts.length) * 100) : 0;
  const renderProgressPercent = renderProgress.total ? Math.round((renderProgress.done / renderProgress.total) * 100) : 0;

  const tabAccess = {
    setup: true,
    agent1: Boolean(job?.storyDossier),
    agent2: Boolean(selectedStory),
    agent3: reelDrafts.length === 7,
    agent4: Boolean(job?.assets?.length),
  };

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Request failed");
    }
    return data;
  }

  const startResearch = async () => {
    setBusy("research");
    setError("");
    revokeExportUrls(exportsState);
    setExportsState([]);
    setZipBlob(null);
    try {
      const nextJob = await postJson("/api/katha/research", filters);
      setJob(nextJob);
      setActiveTab("agent1");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const buildBlueprint = async () => {
    if (!job?.id || !selectedStoryId) return;
    setBusy("blueprint");
    setError("");
    try {
      const nextJob = await postJson("/api/katha/blueprint", {
        jobId: job.id,
        selectedStoryId,
        storyEdits: storyDraft,
      });
      setJob(nextJob);
      setActiveTab("agent2");
      setSelectedReelIndex(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const updateReelField = (index, key, value) => {
    setReelDrafts((current) =>
      current.map((reel) =>
        reel.index === index
          ? {
              ...reel,
              [key]: value,
              subtitleText: key === "narration" ? value : reel.subtitleText,
            }
          : reel
      )
    );
  };

  const generateAssets = async () => {
    if (!job?.id || reelDrafts.length !== 7) return;
    setBusy("assets");
    setError("");
    try {
      const nextJob = await postJson("/api/katha/assets", {
        jobId: job.id,
        reels: reelDrafts,
        voiceId,
      });
      setJob(nextJob);
      setActiveTab("agent3");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const renderSingleReel = useCallback(
    async (manifestReel) => {
      const ffmpeg = await loadFfmpeg();
      const safeBase = `katha-${manifestReel.index}`;
      const imageName = `${safeBase}.png`;
      const voiceName = `${safeBase}-voice`;
      const musicName = `${safeBase}-music.wav`;
      const subtitleName = `${safeBase}.srt`;
      const outputName = `${safeBase}.mp4`;

      for (const name of [imageName, `${voiceName}.mp3`, `${voiceName}.wav`, musicName, subtitleName, outputName]) {
        try {
          await ffmpeg.deleteFile(name);
        } catch {}
      }

      const imageBytes = await imageUrlToPngBytes(manifestReel.imageUrl);
      const voiceResponse = await fetch(manifestReel.voiceoverUrl);
      const voiceArrayBuffer = await voiceResponse.arrayBuffer();
      const voiceContentType =
        voiceResponse.headers.get("content-type") ||
        (manifestReel.voiceoverUrl.includes("mpeg") ? "audio/mpeg" : "audio/wav");
      const voiceExt = voiceContentType.includes("mpeg") ? "mp3" : "wav";
      const voiceFileName = `${voiceName}.${voiceExt}`;

      await ffmpeg.writeFile(imageName, imageBytes);
      await ffmpeg.writeFile(voiceFileName, new Uint8Array(voiceArrayBuffer));
      await ffmpeg.writeFile(musicName, await dataUrlToUint8Array(manifestReel.musicUrl));
      await ffmpeg.writeFile(subtitleName, new TextEncoder().encode(manifestReel.subtitleSrt || ""));

      const filterCore = [
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p[base]",
        "[1:a]volume=1.0[a1]",
        `[2:a]volume=0.18,atrim=0:${manifestReel.durationSec}[a2]`,
        "[a1][a2]amix=inputs=2:duration=first:dropout_transition=0[aout]",
      ];

      const subtitleStyle =
        "FontName=Arial,FontSize=18,PrimaryColour=&H00F7F7F7,OutlineColour=&H00291509,BorderStyle=3,Outline=1,MarginV=54";

      try {
        await ffmpeg.exec([
          "-loop",
          "1",
          "-i",
          imageName,
          "-i",
          voiceFileName,
          "-stream_loop",
          "-1",
          "-i",
          musicName,
          "-filter_complex",
          `${filterCore.join(";")};[base]subtitles=${subtitleName}:force_style='${subtitleStyle}'[vout]`,
          "-map",
          "[vout]",
          "-map",
          "[aout]",
          "-t",
          String(manifestReel.durationSec),
          "-r",
          "24",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-shortest",
          outputName,
        ]);
      } catch {
        await ffmpeg.exec([
          "-loop",
          "1",
          "-i",
          imageName,
          "-i",
          voiceFileName,
          "-stream_loop",
          "-1",
          "-i",
          musicName,
          "-filter_complex",
          `${filterCore.join(";")};[base]drawbox=x=56:y=1490:w=968:h=300:color=black@0.18:t=fill[vout]`,
          "-map",
          "[vout]",
          "-map",
          "[aout]",
          "-t",
          String(manifestReel.durationSec),
          "-r",
          "24",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-shortest",
          outputName,
        ]);
      }

      const videoBytes = await ffmpeg.readFile(outputName);
      const blob = new Blob([videoBytes.buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      return {
        reelIndex: manifestReel.index,
        fileName: `katha-reel-${String(manifestReel.index).padStart(2, "0")}.mp4`,
        title: manifestReel.title,
        status: "ready",
        sizeBytes: blob.size,
        url,
        blob,
      };
    },
    [loadFfmpeg]
  );

  const renderAll = async () => {
    if (!job?.id) return;
    setBusy("render");
    setError("");
    revokeExportUrls(exportsState);
    setExportsState([]);
    setZipBlob(null);
    setActiveTab("agent4");
    setRenderProgress({ total: 7, done: 0, current: "Preparing" });

    try {
      const manifest = await postJson("/api/katha/render", { jobId: job.id });
      const collected = [];

      for (const manifestReel of manifest.reels) {
        setRenderProgress((current) => ({
          ...current,
          current: `Reel ${manifestReel.index}`,
        }));

        try {
          const rendered = await renderSingleReel(manifestReel);
          collected.push(rendered);
        } catch (err) {
          collected.push({
            reelIndex: manifestReel.index,
            title: manifestReel.title,
            fileName: `katha-reel-${String(manifestReel.index).padStart(2, "0")}.mp4`,
            status: "failed",
            error: err.message,
            sizeBytes: 0,
          });
        }

        setRenderProgress((current) => ({
          ...current,
          done: current.done + 1,
        }));
      }

      const zipFiles = [];
      collected.forEach((item) => {
        if (item.status === "ready" && item.blob) {
          zipFiles.push({ name: `reels/${item.fileName}`, data: item.blob });
        }
      });

      reelDrafts.forEach((reel) => {
        const asset = job.assets.find((entry) => entry.reelIndex === reel.index);
        zipFiles.push({
          name: `scripts/reel-${String(reel.index).padStart(2, "0")}.txt`,
          data: `${reel.title}\n\nHOOK\n${reel.hook}\n\nNARRATION\n${reel.narration}\n\nON-SCREEN\n${reel.onscreenText}\n\nCLIFFHANGER\n${reel.cliffhanger}`,
        });
        if (asset?.subtitleSrt) {
          zipFiles.push({
            name: `scripts/reel-${String(reel.index).padStart(2, "0")}.srt`,
            data: asset.subtitleSrt,
          });
        }
      });

      const nextZipBlob = await createZipBlob(zipFiles);
      const nextZipName = `katha-studio-${job.id}.zip`;
      setZipBlob(nextZipBlob);
      setZipName(nextZipName);
      setExportsState(collected);

      const persisted = await postJson("/api/katha/render", {
        jobId: job.id,
        exports: collected.map((item) => ({
          reelIndex: item.reelIndex,
          title: item.title,
          fileName: item.fileName,
          status: item.status,
          sizeBytes: item.sizeBytes,
        })),
      });
      setJob(persisted);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
      setRenderProgress((current) => ({ ...current, current: "" }));
    }
  };

  const renderSetupTab = () => (
    <div className="katha-grid two">
      <div className="katha-card pad">
        <div className="katha-grid">
          <label className="katha-field">
            <span>Source set</span>
            <select
              className="katha-select"
              value={filters.sourceSet}
              onChange={(event) => setFilters((current) => ({ ...current, sourceSet: event.target.value }))}
            >
              <option value="curated-public">Curated public-domain / cultural portals</option>
              <option value="manual-library">Manual library</option>
            </select>
          </label>

          <label className="katha-field">
            <span>Region</span>
            <select
              className="katha-select"
              value={filters.region}
              onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>

          <label className="katha-field">
            <span>Theme</span>
            <select
              className="katha-select"
              value={filters.theme}
              onChange={(event) => setFilters((current) => ({ ...current, theme: event.target.value }))}
            >
              {THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>

          <label className="katha-field">
            <span>Age tone</span>
            <select
              className="katha-select"
              value={filters.ageTone}
              onChange={(event) => setFilters((current) => ({ ...current, ageTone: event.target.value }))}
            >
              {AGE_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="katha-card katha-note">
        <strong>Next</strong>
        <span>Start Agent 1</span>
        <button type="button" className="katha-button" onClick={startResearch} disabled={!canRunAgent1}>
          {busy === "research" ? "Running..." : "Run Agent 1"}
        </button>
      </div>
    </div>
  );

  const renderAgent1Tab = () => {
    if (!shortlistedStories.length) {
      return <EmptyState>Complete Setup</EmptyState>;
    }

    return (
      <div className="katha-grid two">
        <div className="katha-grid story">
          {shortlistedStories.map((story, index) => {
            const active = story.id === selectedStoryId;
            return (
              <button
                key={story.id}
                type="button"
                className="katha-card katha-story-card"
                data-active={active}
                onClick={() => {
                  setSelectedStoryId(story.id);
                  setStoryDraft({
                    title: story.title,
                    synopsis: story.synopsis,
                    storyText: story.storyText,
                  });
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div className="katha-story-title">{story.title}</div>
                  <StatusPill label={index === 0 ? "Primary" : `Backup ${index}`} tone={index === 0 ? "ok" : "idle"} />
                </div>
                <div className="katha-chip-row">
                  <span className="katha-chip">{story.region}</span>
                  <span className="katha-chip">Score {story.score}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="katha-card pad">
          {selectedStory ? (
            <div className="katha-grid">
              <div className="katha-note" style={{ padding: 0 }}>
                <strong>{selectedStory.title}</strong>
                <span>{selectedStory.synopsis}</span>
              </div>
              <div className="katha-chip-row">
                <span className="katha-chip">{selectedStory.theme}</span>
                <span className="katha-chip">{selectedStory.ageTone}</span>
                <span className="katha-chip">{selectedStory.copyrightStatus}</span>
              </div>
              <div className="katha-note" style={{ padding: 0 }}>
                <strong>Authenticity</strong>
                <span>{selectedStory.authenticityNotes}</span>
              </div>
              <div className="katha-source-list">
                {selectedStory.sourceLinks?.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="katha-card katha-source-link">
                    <span>{link.label}</span>
                    <StatusPill label="Source" tone="idle" />
                  </a>
                ))}
              </div>
              <button type="button" className="katha-button" onClick={() => setActiveTab("agent2")}>
                Open Agent 2
              </button>
            </div>
          ) : (
            <EmptyState>Select a story</EmptyState>
          )}
        </div>
      </div>
    );
  };

  const renderAgent2Tab = () => {
    if (!selectedStory) {
      return <EmptyState>Complete Agent 1</EmptyState>;
    }

    return (
      <div className="katha-grid">
        <div className="katha-card pad">
          <div className="katha-grid">
            <label className="katha-field">
              <span>Story title</span>
              <input
                className="katha-input"
                value={storyDraft.title}
                onChange={(event) => setStoryDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label className="katha-field">
              <span>Synopsis</span>
              <textarea
                className="katha-textarea"
                rows={4}
                value={storyDraft.synopsis}
                onChange={(event) => setStoryDraft((current) => ({ ...current, synopsis: event.target.value }))}
              />
            </label>

            <label className="katha-field">
              <span>Source narrative</span>
              <textarea
                className="katha-textarea"
                rows={8}
                value={storyDraft.storyText}
                onChange={(event) => setStoryDraft((current) => ({ ...current, storyText: event.target.value }))}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <StatusPill label={reelDrafts.length === 7 ? "7 reels ready" : "Not built"} tone={reelDrafts.length === 7 ? "ok" : "warn"} />
              <button type="button" className="katha-button" onClick={buildBlueprint} disabled={!canRunAgent2}>
                {busy === "blueprint" ? "Running..." : "Run Agent 2"}
              </button>
            </div>
          </div>
        </div>

        {reelDrafts.length ? (
          <>
            <div className="katha-reel-strip">
              {reelDrafts.map((reel) => (
                <button
                  key={reel.index}
                  type="button"
                  className="katha-reel-tab"
                  data-active={selectedReel?.index === reel.index}
                  onClick={() => setSelectedReelIndex(reel.index)}
                >
                  <strong>Reel {reel.index}</strong>
                  <span>{reel.title}</span>
                </button>
              ))}
            </div>

            {selectedReel ? (
              <div className="katha-card katha-reel-editor">
                <div className="katha-editor-col">
                  <label className="katha-field">
                    <span>Reel title</span>
                    <input
                      className="katha-input"
                      value={selectedReel.title}
                      onChange={(event) => updateReelField(selectedReel.index, "title", event.target.value)}
                    />
                  </label>
                  <label className="katha-field">
                    <span>Hook</span>
                    <textarea
                      className="katha-textarea"
                      rows={3}
                      value={selectedReel.hook}
                      onChange={(event) => updateReelField(selectedReel.index, "hook", event.target.value)}
                    />
                  </label>
                  <label className="katha-field">
                    <span>Narration</span>
                    <textarea
                      className="katha-textarea"
                      rows={7}
                      value={selectedReel.narration}
                      onChange={(event) => updateReelField(selectedReel.index, "narration", event.target.value)}
                    />
                  </label>
                </div>

                <div className="katha-editor-col">
                  <label className="katha-field">
                    <span>On-screen text</span>
                    <textarea
                      className="katha-textarea"
                      rows={4}
                      value={selectedReel.onscreenText}
                      onChange={(event) => updateReelField(selectedReel.index, "onscreenText", event.target.value)}
                    />
                  </label>
                  <label className="katha-field">
                    <span>Image prompt</span>
                    <textarea
                      className="katha-textarea"
                      rows={5}
                      value={selectedReel.imagePrompt}
                      onChange={(event) => updateReelField(selectedReel.index, "imagePrompt", event.target.value)}
                    />
                  </label>
                  <label className="katha-field">
                    <span>Music mood</span>
                    <textarea
                      className="katha-textarea"
                      rows={3}
                      value={selectedReel.musicPrompt}
                      onChange={(event) => updateReelField(selectedReel.index, "musicPrompt", event.target.value)}
                    />
                  </label>
                  <label className="katha-field">
                    <span>Cliffhanger</span>
                    <textarea
                      className="katha-textarea"
                      rows={3}
                      value={selectedReel.cliffhanger}
                      onChange={(event) => updateReelField(selectedReel.index, "cliffhanger", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="katha-button" onClick={() => setActiveTab("agent3")} disabled={!canRunAgent3}>
                Open Agent 3
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  };

  const renderAgent3Tab = () => {
    if (!reelDrafts.length) {
      return <EmptyState>Complete Agent 2</EmptyState>;
    }

    return (
      <div className="katha-grid">
        <div className="katha-card pad">
          <div className="katha-grid two">
            <label className="katha-field">
              <span>Voice</span>
              <select className="katha-select" value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
                {voices.map((voice) => (
                  <option key={voice.voice_id || "default"} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end" }}>
              <button type="button" className="katha-button" onClick={generateAssets} disabled={!canRunAgent3}>
                {busy === "assets" ? "Running..." : "Run Agent 3"}
              </button>
            </div>
          </div>
        </div>

        {job?.assets?.length ? (
          <>
            <div className="katha-progress">
              <div className="katha-progress-bar" style={{ width: `${assetProgress}%` }} />
            </div>
            <div className="katha-grid preview">
              {job.assets.map((asset) => {
                const reel = reelDrafts.find((item) => item.index === asset.reelIndex);
                return (
                  <div key={asset.reelIndex} className="katha-card katha-preview-card">
                    <div className="katha-preview-visual">
                      <img src={asset.imageUrl} alt={reel?.title || `Reel ${asset.reelIndex}`} />
                      <div className="katha-preview-overlay">{reel?.onscreenText}</div>
                    </div>
                    <div className="katha-preview-body">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div className="katha-export-title">{reel?.title || `Reel ${asset.reelIndex}`}</div>
                        <StatusPill label={`${Math.round(asset.durationSec)} sec`} tone="idle" />
                      </div>
                      <div className="katha-audio-stack">
                        <audio controls src={asset.voiceoverUrl} />
                        <audio controls src={asset.musicUrl} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="katha-button" onClick={() => setActiveTab("agent4")} disabled={!canRunAgent4}>
                Open Agent 4
              </button>
            </div>
          </>
        ) : (
          <EmptyState>Run Agent 3</EmptyState>
        )}
      </div>
    );
  };

  const renderAgent4Tab = () => {
    if (!job?.assets?.length) {
      return <EmptyState>Complete Agent 3</EmptyState>;
    }

    return (
      <div className="katha-grid">
        <div className="katha-card pad">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <StatusPill label={busy === "render" ? renderProgress.current || "Running" : readyExportCount ? "Ready" : "Idle"} tone={busy === "render" ? "live" : readyExportCount ? "ok" : "idle"} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {zipBlob ? (
                <button type="button" className="katha-button-secondary" onClick={() => downloadBlob(zipBlob, zipName)}>
                  Download ZIP
                </button>
              ) : null}
              <button type="button" className="katha-button" onClick={renderAll} disabled={!canRunAgent4}>
                {busy === "render" ? "Running..." : "Run Agent 4"}
              </button>
            </div>
          </div>
        </div>

        {busy === "render" || exportsState.length ? (
          <div className="katha-progress">
            <div className="katha-progress-bar" style={{ width: `${renderProgressPercent}%` }} />
          </div>
        ) : null}

        {exportsState.length ? (
          <div className="katha-export-list">
            {exportsState.map((item) => (
              <div key={item.reelIndex} className="katha-card katha-export-row">
                <div>
                  <div className="katha-export-title">{item.title || `Reel ${item.reelIndex}`}</div>
                  <div className="katha-export-sub">
                    {item.fileName} · {formatBytes(item.sizeBytes)}
                  </div>
                </div>
                <StatusPill label={item.status} tone={item.status === "ready" ? "ok" : "error"} />
                {item.status === "ready" && item.blob ? (
                  <button type="button" className="katha-button-secondary" onClick={() => downloadBlob(item.blob, item.fileName)}>
                    Download
                  </button>
                ) : (
                  <div className="katha-export-sub">{item.error || "Failed"}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Run Agent 4</EmptyState>
        )}
      </div>
    );
  };

  const stageBody = (() => {
    switch (activeTab) {
      case "setup":
        return renderSetupTab();
      case "agent1":
        return renderAgent1Tab();
      case "agent2":
        return renderAgent2Tab();
      case "agent3":
        return renderAgent3Tab();
      case "agent4":
        return renderAgent4Tab();
      default:
        return null;
    }
  })();

  const stageTitle = (() => {
    switch (activeTab) {
      case "setup":
        return "Setup";
      case "agent1":
        return "Research + Collect";
      case "agent2":
        return "Story Architect";
      case "agent3":
        return "Asset Generator";
      case "agent4":
        return "Reel Editor";
      default:
        return "Setup";
    }
  })();

  return (
    <div
      className="katha-shell"
      style={{
        "--surface": darkMode ? "#070606" : "#f4ecdf",
        "--surface-deep": darkMode ? "#050404" : "#efe5d8",
        "--panel": darkMode
          ? "linear-gradient(180deg, rgba(24,16,13,0.92), rgba(8,8,8,0.96))"
          : "linear-gradient(180deg, rgba(255,249,241,0.96), rgba(244,235,224,0.98))",
        "--inner": darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.68)",
        "--input": darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.82)",
        "--text": darkMode ? "#f7ebd1" : "#2f1a12",
        "--text-soft": darkMode ? "rgba(247,235,209,0.84)" : "rgba(47,26,18,0.84)",
        "--muted": darkMode ? "rgba(247,235,209,0.58)" : "rgba(72,39,18,0.62)",
        "--muted-strong": darkMode ? "rgba(247,235,209,0.72)" : "rgba(72,39,18,0.74)",
        "--line": darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)",
        "--line-soft": darkMode ? "rgba(255,236,201,0.07)" : "rgba(99,58,24,0.10)",
        "--accent": darkMode ? "#f0c58e" : "#7d3f22",
        "--accent-deep": darkMode ? "#c86d3b" : "#b65e31",
        "--accent-soft": darkMode ? "rgba(240,197,142,0.12)" : "rgba(125,63,34,0.08)",
        "--accent-line": darkMode ? "rgba(240,197,142,0.30)" : "rgba(125,63,34,0.18)",
        "--accent-contrast": darkMode ? "#1e1009" : "#fff8f0",
        "--glow-soft": darkMode ? "rgba(240,197,142,0.14)" : "rgba(240,197,142,0.34)",
        "--glow-hot": darkMode ? "rgba(197,97,57,0.16)" : "rgba(182,94,49,0.18)",
        "--shadow": darkMode ? "0 24px 80px rgba(0,0,0,0.38)" : "0 24px 70px rgba(125,79,34,0.14)",
      }}
    >
      <style>{KATHA_CSS}</style>
      <div className="katha-frame">
        <section className="katha-panel katha-header">
          <div>
            <div className="katha-kicker">Katha Studio</div>
            <h1 className="katha-title">
              Step by step
              <br />
              <span>agent workflow</span>
            </h1>
          </div>
          <div className="katha-header-meta">
            <StatusPill label={busy || "idle"} tone={busy ? "live" : "idle"} />
            <StatusPill label={selectedStory?.title || "No story"} tone={selectedStory ? "ok" : "warn"} />
            <StatusPill label={`${readyAssetCount} assets`} tone={readyAssetCount ? "ok" : "idle"} />
            <StatusPill label={`${readyExportCount} exports`} tone={readyExportCount ? "ok" : "idle"} />
          </div>
        </section>

        <div className="katha-tabs">
          {MODULE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="katha-tab"
              data-active={activeTab === tab.id}
              disabled={!tabAccess[tab.id]}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <div className="katha-alert">{error}</div> : null}

        <section className="katha-panel katha-stage">
          <div className="katha-stage-head">
            <div>
              <div className="katha-kicker">{MODULE_TABS.find((tab) => tab.id === activeTab)?.label}</div>
              <div className="katha-stage-title">{stageTitle}</div>
            </div>
            {activeTab === "agent3" ? <StatusPill label={`${assetProgress}%`} tone={readyAssetCount ? "ok" : "idle"} /> : null}
            {activeTab === "agent4" ? <StatusPill label={`${renderProgressPercent}%`} tone={readyExportCount ? "ok" : busy === "render" ? "live" : "idle"} /> : null}
          </div>
          {stageBody}
        </section>
      </div>
    </div>
  );
}
