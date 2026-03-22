import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createZipBlob } from "./simpleZip.js";

const REGIONS = ["Rajasthan", "Assam", "Tamil Nadu", "Uttar Pradesh"];
const THEMES = ["courage", "resilience", "justice", "wit"];
const AGE_TONES = ["family", "kids", "young-adult"];

const PIPELINE_STAGES = [
  {
    id: "story-intake",
    number: "01",
    title: "Story Intake",
  },
  {
    id: "pipeline-status",
    number: "02",
    title: "Research Dossier",
  },
  {
    id: "review-edit",
    number: "03",
    title: "Script Room",
  },
  {
    id: "asset-generation",
    number: "04",
    title: "Asset Wall",
  },
  {
    id: "export-download",
    number: "05",
    title: "Export Deck",
  },
];

const WORKSPACE_TABS = [
  { id: "research", label: "Research" },
  { id: "scripts", label: "Script Room" },
  { id: "assets", label: "Asset Wall" },
  { id: "exports", label: "Exports" },
];

const KATHA_CSS = `
.katha-shell {
  min-height: 100vh;
  color: var(--text);
  background:
    radial-gradient(circle at 10% 12%, var(--glow-soft), transparent 28%),
    radial-gradient(circle at 86% 10%, var(--glow-hot), transparent 24%),
    linear-gradient(180deg, var(--surface) 0%, var(--surface-deep) 100%);
}

.katha-frame {
  max-width: 1520px;
  margin: 0 auto;
  padding: 28px 18px 92px;
}

.katha-panel {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.katha-hero {
  position: relative;
  overflow: hidden;
  padding: 30px;
  background:
    radial-gradient(circle at 18% 20%, rgba(255,255,255,0.08), transparent 24%),
    radial-gradient(circle at 82% 16%, rgba(197,97,57,0.18), transparent 24%),
    linear-gradient(135deg, var(--hero-start) 0%, var(--hero-mid) 48%, var(--hero-end) 100%);
}

.katha-hero::after {
  content: "";
  position: absolute;
  inset: auto -90px -140px auto;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,238,208,0.18), transparent 68%);
  pointer-events: none;
}

.katha-hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 24px;
  align-items: start;
}

.katha-eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted-strong);
}

.katha-display {
  margin: 0;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(40px, 6vw, 76px);
  line-height: 0.94;
  letter-spacing: -0.04em;
}

.katha-display span {
  color: var(--accent);
}

.katha-hero-copy {
  margin: 0;
  max-width: 760px;
  font-size: 18px;
  line-height: 1.62;
  color: var(--text-soft);
}

.katha-hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 20px;
  border-radius: 24px;
  background: var(--panel-soft);
  border: 1px solid var(--line-soft);
}

.katha-stat-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  background: var(--inner);
  border: 1px solid var(--line-soft);
}

.katha-stat-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.katha-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
}

.katha-stat-sub {
  font-size: 12px;
  color: var(--muted);
}

.katha-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}

.katha-rail,
.katha-overview {
  position: sticky;
  top: 94px;
  display: grid;
  gap: 18px;
}

.katha-main {
  display: grid;
  gap: 18px;
}

.katha-section {
  padding: 24px;
}

.katha-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.katha-section-title {
  margin: 4px 0 0;
  font-size: 32px;
  line-height: 1.02;
  font-family: "Georgia", "Times New Roman", serif;
}

.katha-section-copy {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
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

.katha-note {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  background: var(--inner);
  border: 1px solid var(--line-soft);
}

.katha-note strong {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted-strong);
}

.katha-note span {
  font-size: 14px;
  line-height: 1.58;
  color: var(--text-soft);
}

.katha-grid {
  display: grid;
  gap: 14px;
}

.katha-stage-list,
.katha-agent-list {
  display: grid;
  gap: 12px;
}

.katha-stage-item,
.katha-agent-item,
.katha-story-card,
.katha-link-card,
.katha-export-row,
.katha-reel-editor,
.katha-preview-card {
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: var(--inner);
}

.katha-stage-item {
  padding: 14px 15px;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
}

.katha-stage-item[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.katha-stage-item[data-complete="true"] .katha-stage-number {
  background: var(--accent);
  color: var(--accent-contrast);
}

.katha-stage-number {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.06);
  color: var(--text-soft);
  font-weight: 800;
  font-size: 12px;
}

.katha-stage-title {
  font-weight: 700;
  font-size: 14px;
}

.katha-control-grid {
  display: grid;
  gap: 12px;
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
  border: 1px solid var(--line-soft);
  background: var(--input);
  color: var(--text);
  border-radius: 16px;
  padding: 13px 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.katha-textarea {
  resize: vertical;
  line-height: 1.56;
  min-height: 120px;
}

.katha-button,
.katha-button-secondary,
.katha-tab {
  border: none;
  cursor: pointer;
  transition: transform 0.16s ease, opacity 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.katha-button:hover,
.katha-button-secondary:hover,
.katha-tab:hover {
  transform: translateY(-1px);
}

.katha-button:disabled,
.katha-button-secondary:disabled,
.katha-tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.katha-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.katha-agent-item {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.katha-agent-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.katha-agent-name {
  font-size: 15px;
  font-weight: 800;
}

.katha-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.katha-tab {
  padding: 11px 14px;
  border-radius: 999px;
  background: var(--inner);
  border: 1px solid var(--line-soft);
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 700;
}

.katha-tab[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
  color: var(--text);
}

.katha-story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.katha-story-card {
  padding: 18px;
  display: grid;
  gap: 12px;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.katha-story-card[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.katha-story-kicker {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.katha-story-title {
  font-size: 22px;
  line-height: 1.08;
  font-family: "Georgia", "Times New Roman", serif;
}

.katha-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.katha-story-form,
.katha-story-two-col {
  display: grid;
  gap: 14px;
}

.katha-story-two-col {
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
}

.katha-links {
  display: grid;
  gap: 10px;
}

.katha-link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}

.katha-link-card:hover {
  border-color: var(--accent-line);
}

.katha-reel-layout {
  display: grid;
  gap: 16px;
}

.katha-reel-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.katha-reel-tab {
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--inner);
  color: inherit;
  text-align: left;
  padding: 12px;
  cursor: pointer;
}

.katha-reel-tab[data-active="true"] {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.katha-reel-tab strong {
  display: block;
  font-size: 12px;
  margin-bottom: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-strong);
}

.katha-reel-tab span {
  display: block;
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-soft);
}

.katha-reel-editor {
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 16px;
}

.katha-editor-col {
  display: grid;
  gap: 12px;
  align-content: start;
}

.katha-editor-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.katha-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.katha-preview-card {
  overflow: hidden;
}

.katha-preview-visual {
  position: relative;
  aspect-ratio: 9 / 16;
  background: #0f0d0c;
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
  background: rgba(7,6,6,0.58);
  color: #fff7e8;
  font-size: 13px;
  line-height: 1.45;
  backdrop-filter: blur(8px);
}

.katha-preview-body {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.katha-audio-stack {
  display: grid;
  gap: 10px;
}

.katha-audio-stack audio {
  width: 100%;
}

.katha-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 22px;
  border-radius: 22px;
  border: 1px dashed var(--line-soft);
  background: var(--inner);
  color: var(--muted);
  line-height: 1.65;
}

.katha-overview-card {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.katha-overview-copy {
  font-size: 13px;
  line-height: 1.62;
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

.katha-export-list {
  display: grid;
  gap: 12px;
}

.katha-export-row {
  padding: 16px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
}

.katha-export-meta {
  display: grid;
  gap: 4px;
}

.katha-export-title {
  font-weight: 800;
}

.katha-export-sub {
  font-size: 13px;
  color: var(--muted);
}

.katha-alert {
  padding: 14px 18px;
  border-radius: 22px;
  border: 1px solid rgba(248,113,113,0.26);
  background: rgba(127,29,29,0.08);
  color: #fecaca;
  line-height: 1.56;
}

@media (max-width: 1280px) {
  .katha-layout {
    grid-template-columns: 1fr;
  }

  .katha-rail,
  .katha-overview {
    position: static;
  }

  .katha-rail {
    order: 2;
  }

  .katha-overview {
    order: 3;
  }

  .katha-main {
    order: 1;
  }
}

@media (max-width: 980px) {
  .katha-hero-grid,
  .katha-story-two-col,
  .katha-reel-editor {
    grid-template-columns: 1fr;
  }

  .katha-story-grid,
  .katha-preview-grid {
    grid-template-columns: 1fr;
  }

  .katha-reel-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .katha-hero {
    padding: 24px;
  }
}

@media (max-width: 720px) {
  .katha-frame {
    padding: 18px 12px 64px;
  }

  .katha-hero,
  .katha-section {
    padding: 18px;
  }

  .katha-hero-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .katha-reel-strip {
    grid-template-columns: 1fr;
  }

  .katha-export-row {
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

function getStageIndex(stage) {
  return Math.max(
    1,
    PIPELINE_STAGES.findIndex((item) => item.id === stage) + 1 || 1
  );
}

function getAgentTone(status) {
  switch (status) {
    case "working":
      return "live";
    case "ready":
      return "ok";
    case "blocked":
      return "warn";
    default:
      return "idle";
  }
}

function StatusPill({ label, tone = "idle" }) {
  return (
    <span className="katha-pill" data-tone={tone}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="katha-stat-card">
      <div className="katha-stat-label">{label}</div>
      <div className="katha-stat-value">{value}</div>
      <div className="katha-stat-sub">{sub}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, copy, actions }) {
  return (
    <div className="katha-header-row">
      <div>
        {eyebrow ? <div className="katha-eyebrow">{eyebrow}</div> : null}
        <h2 className="katha-section-title">{title}</h2>
        {copy ? <p className="katha-section-copy">{copy}</p> : null}
      </div>
      {actions}
    </div>
  );
}

function EmptyState({ children }) {
  return <div className="katha-empty">{children}</div>;
}

export default function KathaStudio({ darkMode }) {
  const loadFfmpeg = useFfmpeg();
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
  const [workspaceTab, setWorkspaceTab] = useState("research");
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

  const currentStage = getStageIndex(job?.stage);
  const primaryStoryScore = shortlistedStories[0]?.score || 0;
  const readyAssetCount = job?.assets?.filter((item) => item.status === "ready").length || 0;
  const readyExportCount = exportsState.filter((item) => item.status === "ready").length;
  const canBuildBlueprint = busy === "" && Boolean(job?.id && selectedStoryId);
  const canGenerateAssets = busy === "" && Boolean(job?.id && reelDrafts.length === 7);
  const canRender = busy === "" && Boolean(job?.assets?.length);
  const seriesProgress = reelDrafts.length ? Math.round((readyAssetCount / reelDrafts.length) * 100) : 0;
  const exportProgress = renderProgress.total ? Math.round((renderProgress.done / renderProgress.total) * 100) : 0;

  const agentStations = [
    {
      id: "a1",
      name: "Agent 1",
      title: "Research + Collect",
      status: busy === "research" ? "working" : job?.storyDossier ? "ready" : "idle",
    },
    {
      id: "a2",
      name: "Agent 2",
      title: "Story Architect",
      status: busy === "blueprint" ? "working" : reelDrafts.length === 7 ? "ready" : selectedStory ? "blocked" : "idle",
    },
    {
      id: "a3",
      name: "Agent 3",
      title: "Asset Generator",
      status: busy === "assets" ? "working" : readyAssetCount > 0 ? "ready" : reelDrafts.length === 7 ? "blocked" : "idle",
    },
    {
      id: "a4",
      name: "Agent 4",
      title: "Reel Editor",
      status: busy === "render" ? "working" : readyExportCount > 0 ? "ready" : readyAssetCount > 0 ? "blocked" : "idle",
    },
  ];

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
    setWorkspaceTab("research");
    try {
      const nextJob = await postJson("/api/katha/research", filters);
      setJob(nextJob);
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
      setWorkspaceTab("scripts");
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
      setWorkspaceTab("assets");
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
    setWorkspaceTab("exports");
    setRenderProgress({ total: 7, done: 0, current: "Preparing render manifest" });
    revokeExportUrls(exportsState);
    setExportsState([]);
    setZipBlob(null);

    try {
      const manifest = await postJson("/api/katha/render", { jobId: job.id });
      const collected = [];

      for (const manifestReel of manifest.reels) {
        setRenderProgress((current) => ({
          ...current,
          current: `Rendering reel ${manifestReel.index}`,
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
        if (asset?.imageUrl) {
          zipFiles.push({
            name: `assets/reel-${String(reel.index).padStart(2, "0")}.image.url.txt`,
            data: asset.imageUrl,
          });
        }
      });
      zipFiles.push({
        name: "story-dossier.json",
        data: JSON.stringify(job.storyDossier, null, 2),
      });
      zipFiles.push({
        name: "series-blueprint.json",
        data: JSON.stringify({ seriesBlueprint: job.seriesBlueprint, reels: reelDrafts }, null, 2),
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

  const workspaceBody = (() => {
    if (workspaceTab === "research") {
      return (
        <div className="katha-grid">
          <section className="katha-panel katha-section">
            <SectionHeader
              eyebrow="Research Deck"
              title="Shortlisted story stack"
              actions={<StatusPill label={shortlistedStories.length ? `${shortlistedStories.length} stories` : "No stories yet"} tone={shortlistedStories.length ? "ok" : "idle"} />}
            />
            {shortlistedStories.length ? (
              <div className="katha-story-grid">
                {shortlistedStories.map((story, index) => {
                  const active = story.id === selectedStoryId;
                  return (
                    <button
                      key={story.id}
                      type="button"
                      className="katha-story-card"
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
                      <div className="katha-story-kicker">
                        <div className="katha-story-title">{index === 0 ? "Primary pick" : `Backup ${index}`}</div>
                        <StatusPill label={`Score ${story.score}`} tone={index === 0 ? "ok" : "idle"} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{story.title}</div>
                      <div className="katha-chip-row">
                        <span className="katha-chip">{story.region}</span>
                        <span className="katha-chip">{story.theme}</span>
                        <span className="katha-chip">{story.copyrightStatus}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState>Run Agent 1</EmptyState>
            )}
          </section>

          <section className="katha-panel katha-section">
            <SectionHeader
              eyebrow="Review Gate"
              title="Editable story dossier"
              actions={
                <button type="button" className="katha-button" onClick={buildBlueprint} disabled={!canBuildBlueprint}>
                  {busy === "blueprint" ? "Writing blueprint..." : "Build 7-part script"}
                </button>
              }
            />
            {selectedStory ? (
              <div className="katha-story-form">
                <div className="katha-story-two-col">
                  <label className="katha-field">
                    <span>Story title</span>
                    <input
                      className="katha-input"
                      value={storyDraft.title}
                      onChange={(event) => setStoryDraft((current) => ({ ...current, title: event.target.value }))}
                    />
                  </label>
                  <div className="katha-note">
                    <strong>Authenticity</strong>
                    <span>{selectedStory.authenticityNotes}</span>
                  </div>
                </div>

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

                <div className="katha-links">
                  {selectedStory.sourceLinks?.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="katha-link-card">
                      <div>
                        <div style={{ fontWeight: 700 }}>{link.label}</div>
                        <div className="katha-export-sub">{link.type}</div>
                      </div>
                      <StatusPill label="Source" tone="idle" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState>Select a story</EmptyState>
            )}
          </section>
        </div>
      );
    }

    if (workspaceTab === "scripts") {
      return (
        <div className="katha-grid">
          <section className="katha-panel katha-section">
            <SectionHeader
              eyebrow="Script Room"
              title="Seven-part reel structure"
              actions={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <StatusPill label={job?.seriesBlueprint?.hook ? "Series hook ready" : "Waiting"} tone={job?.seriesBlueprint?.hook ? "ok" : "idle"} />
                  <button type="button" className="katha-button" onClick={generateAssets} disabled={!canGenerateAssets}>
                    {busy === "assets" ? "Generating assets..." : "Approve and generate assets"}
                  </button>
                </div>
              }
            />
            {reelDrafts.length ? (
              <div className="katha-reel-layout">
                <div className="katha-note">
                  <strong>Series</strong>
                  <span>
                    {job?.seriesBlueprint?.hook || "Hook pending."}
                    {job?.seriesBlueprint?.emotionalProgression?.length
                      ? ` Emotional flow: ${job.seriesBlueprint.emotionalProgression.join(" -> ")}.`
                      : ""}
                  </span>
                </div>

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
                  <div className="katha-reel-editor">
                    <div className="katha-editor-col">
                      <div className="katha-editor-meta">
                        <StatusPill label={selectedReel.assetStatus || "pending"} tone={selectedReel.assetStatus === "ready" ? "ok" : "idle"} />
                        <StatusPill label={selectedReel.renderStatus || "pending"} tone={selectedReel.renderStatus === "ready" ? "ok" : "idle"} />
                      </div>
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
                      <label className="katha-field">
                        <span>On-screen text</span>
                        <textarea
                          className="katha-textarea"
                          rows={4}
                          value={selectedReel.onscreenText}
                          onChange={(event) => updateReelField(selectedReel.index, "onscreenText", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="katha-editor-col">
                      <label className="katha-field">
                        <span>Image prompt</span>
                        <textarea
                          className="katha-textarea"
                          rows={6}
                          value={selectedReel.imagePrompt}
                          onChange={(event) => updateReelField(selectedReel.index, "imagePrompt", event.target.value)}
                        />
                      </label>
                      <label className="katha-field">
                        <span>Music mood</span>
                        <textarea
                          className="katha-textarea"
                          rows={4}
                          value={selectedReel.musicPrompt}
                          onChange={(event) => updateReelField(selectedReel.index, "musicPrompt", event.target.value)}
                        />
                      </label>
                      <label className="katha-field">
                        <span>Cliffhanger / transition</span>
                        <textarea
                          className="katha-textarea"
                          rows={4}
                          value={selectedReel.cliffhanger}
                          onChange={(event) => updateReelField(selectedReel.index, "cliffhanger", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState>Run Agent 2</EmptyState>
            )}
          </section>
        </div>
      );
    }

    if (workspaceTab === "assets") {
      return (
        <div className="katha-grid">
          <section className="katha-panel katha-section">
            <SectionHeader
              eyebrow="Asset Wall"
              title="Per-reel media bundles"
              actions={
                <button type="button" className="katha-button" onClick={renderAll} disabled={!canRender}>
                  {busy === "render" ? "Rendering reel pack..." : "Render 7 reels"}
                </button>
              }
            />
            {job?.assets?.length ? (
              <div className="katha-preview-grid">
                {job.assets.map((asset) => {
                  const reel = reelDrafts.find((item) => item.index === asset.reelIndex);
                  return (
                    <div key={asset.reelIndex} className="katha-preview-card">
                      <div className="katha-preview-visual">
                        <img src={asset.imageUrl} alt={reel?.title || `Reel ${asset.reelIndex}`} />
                        <div className="katha-preview-overlay">{reel?.onscreenText}</div>
                      </div>
                      <div className="katha-preview-body">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ fontWeight: 800 }}>{reel?.title || `Reel ${asset.reelIndex}`}</div>
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
            ) : (
              <EmptyState>Run Agent 3</EmptyState>
            )}
          </section>
        </div>
      );
    }

    return (
      <div className="katha-grid">
        <section className="katha-panel katha-section">
          <SectionHeader
            eyebrow="Export Deck"
            title="Exports"
            actions={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {busy === "render" ? (
                  <StatusPill label={`${renderProgress.done}/${renderProgress.total} ${renderProgress.current}`} tone="live" />
                ) : null}
                {zipBlob ? (
                  <button type="button" className="katha-button" onClick={() => downloadBlob(zipBlob, zipName)}>
                    Download ZIP
                  </button>
                ) : null}
              </div>
            }
          />
          {exportsState.length ? (
            <div className="katha-export-list">
              {exportsState.map((item) => (
                <div key={item.reelIndex} className="katha-export-row">
                  <div className="katha-export-meta">
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
                    <div className="katha-export-sub">{item.error || "Render failed"}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Run Agent 4</EmptyState>
          )}
        </section>
      </div>
    );
  })();

  return (
    <div
      className="katha-shell"
      style={{
        "--surface": darkMode ? "#070606" : "#f4ecdf",
        "--surface-deep": darkMode ? "#050404" : "#efe5d8",
        "--hero-start": darkMode ? "#1a110d" : "#fff3e3",
        "--hero-mid": darkMode ? "#4a2415" : "#ebcdb1",
        "--hero-end": darkMode ? "#090809" : "#f8f1e8",
        "--panel": darkMode
          ? "linear-gradient(180deg, rgba(24,16,13,0.92), rgba(8,8,8,0.96))"
          : "linear-gradient(180deg, rgba(255,249,241,0.96), rgba(244,235,224,0.98))",
        "--panel-soft": darkMode ? "rgba(8,7,7,0.48)" : "rgba(255,252,248,0.68)",
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
        <section className="katha-panel katha-hero">
          <div className="katha-hero-grid">
            <div style={{ display: "grid", gap: 18 }}>
              <StatusPill label="Katha Studio" tone="warn" />
              <h1 className="katha-display">
                Kahani ko research se
                <br />
                <span>reel pack</span> tak clearly chalao.
              </h1>
              <div className="katha-chip-row">
                <span className="katha-chip">Curated public-domain intake</span>
                <span className="katha-chip">Hindi-belt oral narration</span>
                <span className="katha-chip">7 connected reels</span>
              </div>
            </div>

            <div className="katha-hero-metrics">
              <StatCard label="Pipeline Stage" value={`${currentStage}/5`} sub={PIPELINE_STAGES[currentStage - 1]?.title || "Story Intake"} />
              <StatCard label="Primary Story Score" value={primaryStoryScore || "--"} sub={selectedStory ? selectedStory.title : "No story selected"} />
              <StatCard label="Assets Ready" value={readyAssetCount} sub={reelDrafts.length ? `${reelDrafts.length} total reels` : "Waiting for Agent 3"} />
              <StatCard label="Exports Ready" value={readyExportCount} sub={zipBlob ? "ZIP bundle prepared" : "Waiting for Agent 4"} />
            </div>
          </div>
        </section>

        {error ? <div className="katha-alert" style={{ marginTop: 18 }}>{error}</div> : null}

        <div className="katha-layout">
          <aside className="katha-rail">
            <section className="katha-panel katha-section">
              <SectionHeader
                title="Modules"
              />
              <div className="katha-stage-list">
                {PIPELINE_STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="katha-stage-item"
                    data-active={currentStage === index + 1}
                    data-complete={currentStage > index + 1}
                  >
                    <div className="katha-stage-number">{stage.number}</div>
                    <div>
                      <div className="katha-stage-title">{stage.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="katha-panel katha-section">
              <SectionHeader
                title="Story Intake"
              />
              <div className="katha-control-grid">
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
                <button type="button" className="katha-button" onClick={startResearch} disabled={busy !== ""}>
                  {busy === "research" ? "Researching..." : "Start research"}
                </button>
              </div>
            </section>

            <section className="katha-panel katha-section">
              <SectionHeader
                title="Agents"
              />
              <div className="katha-agent-list">
                {agentStations.map((agent) => (
                  <div key={agent.id} className="katha-agent-item">
                    <div className="katha-agent-top">
                      <div>
                        <div className="katha-eyebrow">{agent.name}</div>
                        <div className="katha-agent-name">{agent.title}</div>
                      </div>
                      <StatusPill label={agent.status} tone={getAgentTone(agent.status)} />
                    </div>

                    {agent.id === "a3" ? (
                      <label className="katha-field">
                        <span>Voice profile</span>
                        <select className="katha-select" value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
                          {voices.map((voice) => (
                            <option key={voice.voice_id || "default"} value={voice.voice_id}>
                              {voice.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {agent.id === "a1" ? (
                      <button type="button" className="katha-button-secondary" onClick={startResearch} disabled={busy !== ""}>
                        Run Agent 1
                      </button>
                    ) : null}
                    {agent.id === "a2" ? (
                      <button type="button" className="katha-button-secondary" onClick={buildBlueprint} disabled={!canBuildBlueprint}>
                        Run Agent 2
                      </button>
                    ) : null}
                    {agent.id === "a3" ? (
                      <button type="button" className="katha-button-secondary" onClick={generateAssets} disabled={!canGenerateAssets}>
                        Run Agent 3
                      </button>
                    ) : null}
                    {agent.id === "a4" ? (
                      <button type="button" className="katha-button-secondary" onClick={renderAll} disabled={!canRender}>
                        Run Agent 4
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="katha-main">
            <section className="katha-panel katha-section">
              <SectionHeader
                title="Workspace"
                actions={
                  <div className="katha-tabs">
                    {WORKSPACE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className="katha-tab"
                        data-active={workspaceTab === tab.id}
                        onClick={() => setWorkspaceTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                }
              />
              {workspaceBody}
            </section>
          </main>

          <aside className="katha-overview">
            <section className="katha-panel katha-overview-card">
              <SectionHeader
                eyebrow="Story"
                title={selectedStory ? selectedStory.title : "No story selected"}
                actions={<StatusPill label={selectedStory ? selectedStory.region : "Waiting"} tone={selectedStory ? "idle" : "warn"} />}
              />
              {selectedStory ? (
                <>
                  <div className="katha-chip-row">
                    <span className="katha-chip">{selectedStory.theme}</span>
                    <span className="katha-chip">{selectedStory.ageTone}</span>
                    <span className="katha-chip">{selectedStory.copyrightStatus}</span>
                  </div>
                </>
              ) : null}
            </section>

            <section className="katha-panel katha-overview-card">
              <SectionHeader
                title="Review Gate"
              />
              <div className="katha-grid">
                <div className="katha-note">
                  <strong>Blueprint hook</strong>
                  <span>{job?.seriesBlueprint?.hook || "Series hook pending."}</span>
                </div>
                <div className="katha-note">
                  <strong>Asset completion</strong>
                  <span>{readyAssetCount}/{reelDrafts.length || 7} reels with media bundles.</span>
                </div>
                <div className="katha-progress">
                  <div className="katha-progress-bar" style={{ width: `${seriesProgress}%` }} />
                </div>
              </div>
            </section>

            <section className="katha-panel katha-overview-card">
              <SectionHeader
                title="Render"
              />
              <div className="katha-grid">
                <div className="katha-note">
                  <strong>Run</strong>
                  <span>{busy === "render" ? renderProgress.current || "Rendering..." : readyExportCount ? "Rendered" : "Idle"}</span>
                </div>
                <div className="katha-progress">
                  <div className="katha-progress-bar" style={{ width: `${exportProgress}%` }} />
                </div>
                <div className="katha-chip-row">
                  <span className="katha-chip">{readyExportCount} ready reels</span>
                  <span className="katha-chip">{zipBlob ? "ZIP prepared" : "ZIP pending"}</span>
                </div>
                {zipBlob ? (
                  <button type="button" className="katha-button" onClick={() => downloadBlob(zipBlob, zipName)}>
                    Download ZIP
                  </button>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
