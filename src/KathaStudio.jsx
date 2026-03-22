import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createZipBlob } from "./simpleZip.js";

const REGIONS = ["Rajasthan", "Assam", "Tamil Nadu", "Uttar Pradesh"];
const THEMES = ["courage", "resilience", "justice", "wit"];
const AGE_TONES = ["family", "kids", "young-adult"];

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

function StatusPill({ label, tone }) {
  const colors = {
    idle: ["rgba(255,255,255,0.08)", "#f7ebd1"],
    warn: ["rgba(251,191,36,0.14)", "#fbbf24"],
    ok: ["rgba(74,222,128,0.14)", "#86efac"],
    live: ["rgba(125,211,252,0.14)", "#7dd3fc"],
    error: ["rgba(248,113,113,0.14)", "#fca5a5"],
  };
  const [bg, color] = colors[tone] || colors.idle;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: "999px",
        background: bg,
        color,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function StoryMetric({ label, value }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(247,235,209,0.64)" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff3dc" }}>{value}</div>
    </div>
  );
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
        if (data[0]?.voice_id) {
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
    const selected = job.storyDossier.shortlist?.find((story) => story.id === job.storyDossier.selectedStoryId) || job.storyDossier.selectedStory;
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

  const shortlistedStories = job?.storyDossier?.shortlist || [];
  const selectedStory = useMemo(
    () => shortlistedStories.find((story) => story.id === selectedStoryId) || job?.storyDossier?.selectedStory || null,
    [job, shortlistedStories, selectedStoryId]
  );

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
    setExportsState([]);
    setZipBlob(null);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const updateReelField = (index, key, value) => {
    setReelDrafts((current) =>
      current.map((reel) => (reel.index === index ? { ...reel, [key]: value, subtitleText: key === "narration" ? value : reel.subtitleText } : reel))
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

      try {
        await ffmpeg.deleteFile(imageName);
      } catch {}
      try {
        await ffmpeg.deleteFile(voiceName);
      } catch {}
      try {
        await ffmpeg.deleteFile(musicName);
      } catch {}
      try {
        await ffmpeg.deleteFile(subtitleName);
      } catch {}
      try {
        await ffmpeg.deleteFile(outputName);
      } catch {}

      const imageBytes = await imageUrlToPngBytes(manifestReel.imageUrl);
      const voiceResponse = await fetch(manifestReel.voiceoverUrl);
      const voiceArrayBuffer = await voiceResponse.arrayBuffer();
      const voiceContentType = voiceResponse.headers.get("content-type") || (manifestReel.voiceoverUrl.includes("mpeg") ? "audio/mpeg" : "audio/wav");
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

      const subtitleStyle = "FontName=Arial,FontSize=18,PrimaryColour=&H00F7F7F7,OutlineColour=&H00291509,BorderStyle=3,Outline=1,MarginV=54";

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
    setRenderProgress({ total: 7, done: 0, current: "Preparing render manifest" });
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

  const stageIndex = useMemo(() => {
    if (!job) return 0;
    switch (job.stage) {
      case "pipeline-status":
        return 2;
      case "review-edit":
        return 3;
      case "asset-generation":
        return 4;
      case "export-download":
        return 5;
      default:
        return 1;
    }
  }, [job]);

  const visualThesis = "A candlelit folk-cinema dashboard that feels like a midnight kahani sitting rather than a generic media tool.";
  const contentPlan = "Poster hero, source intake rail, shortlisted dossier, seven-part story table, cinematic asset wall, final export stack.";
  const interactionThesis = "Slow glow in the hero, stage rail progression, and reel previews that shift from manuscript mode to finished media.";

  const panelStyle = {
    background: darkMode
      ? "linear-gradient(180deg, rgba(28,17,13,0.92), rgba(9,8,8,0.94))"
      : "linear-gradient(180deg, rgba(255,247,236,0.96), rgba(242,232,219,0.98))",
    border: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)"}`,
    borderRadius: 28,
    boxShadow: darkMode ? "0 24px 80px rgba(0,0,0,0.38)" : "0 28px 90px rgba(125,79,34,0.18)",
  };

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "26px 18px 88px", color: darkMode ? "#f7ebd1" : "#2c180f" }}>
      <div
        style={{
          ...panelStyle,
          overflow: "hidden",
          position: "relative",
          minHeight: 380,
          padding: "34px 34px 30px",
          backgroundImage: darkMode
            ? "radial-gradient(circle at 15% 22%, rgba(240,197,142,0.18), transparent 28%), radial-gradient(circle at 80% 18%, rgba(151,59,46,0.22), transparent 34%), linear-gradient(135deg, #1b100c 0%, #4b2316 46%, #09090a 100%)"
            : "radial-gradient(circle at 15% 22%, rgba(240,197,142,0.45), transparent 28%), radial-gradient(circle at 80% 18%, rgba(151,59,46,0.20), transparent 34%), linear-gradient(135deg, #fff4e6 0%, #e5c4a8 46%, #f4ede4 100%)",
        }}
      >
        <div style={{ position: "absolute", right: -80, top: -40, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,236,201,0.18), transparent 68%)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 26, position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
            <StatusPill label="Katha Studio / 4-Agent MVP" tone="warn" />
            <div style={{ fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.62)" : "rgba(77,40,16,0.72)" }}>
              Story-to-reels engine for untapped Indian oral narratives
            </div>
            <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "clamp(44px, 6vw, 82px)", lineHeight: 0.96, letterSpacing: "-0.03em" }}>
              Dadi-nani wali kahani,
              <br />
              <span style={{ color: darkMode ? "#f0c58e" : "#7d3f22" }}>7 cinematic reels me.</span>
            </h1>
            <p style={{ margin: 0, maxWidth: 760, fontSize: 18, lineHeight: 1.55, color: darkMode ? "rgba(247,235,209,0.84)" : "rgba(54,27,13,0.78)" }}>
              Curated Indian folk sources se kahani uthao, 4-agent pipeline se usse research, script, media aur export tak le jao, aur final pack review-gated format me download karo.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatusPill label={visualThesis} tone="idle" />
              <StatusPill label={contentPlan} tone="idle" />
              <StatusPill label={interactionThesis} tone="idle" />
            </div>
          </div>

          <div
            style={{
              alignSelf: "stretch",
              padding: 24,
              borderRadius: 26,
              background: darkMode ? "rgba(10,8,8,0.42)" : "rgba(255,250,244,0.66)",
              border: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.10)"}`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            <StoryMetric label="Current Stage" value={`${stageIndex}/5`} />
            <StoryMetric label="Reels" value={reelDrafts.length || 7} />
            <StoryMetric label="Assets Ready" value={job?.assets?.filter((item) => item.status === "ready").length || 0} />
            <StoryMetric label="Exports Ready" value={exportsState.filter((item) => item.status === "ready").length || 0} />
            <div style={{ gridColumn: "1 / -1", display: "grid", gap: 10 }}>
              {[
                "1 Story intake",
                "2 Pipeline status",
                "3 Review and edit",
                "4 Asset generation",
                "5 Export download",
              ].map((step, index) => {
                const active = stageIndex >= index + 1;
                return (
                  <div key={step} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", background: active ? "#f0c58e" : "rgba(255,255,255,0.08)", color: active ? "#1d110c" : "rgba(247,235,209,0.56)", fontSize: 11, fontWeight: 800 }}>{index + 1}</div>
                    <div style={{ fontSize: 14, color: active ? (darkMode ? "#fff1da" : "#412014") : (darkMode ? "rgba(247,235,209,0.56)" : "rgba(65,32,20,0.58)") }}>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, ...panelStyle, padding: "14px 18px", borderColor: "rgba(248,113,113,0.3)", color: darkMode ? "#fecaca" : "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 18, marginTop: 18 }}>
        <section style={{ ...panelStyle, padding: 26, display: "grid", gap: 18, alignContent: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Story Intake</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 6 }}>Curated source rail</div>
            </div>
            <StatusPill label={busy === "research" ? "Researching" : "Agent 1"} tone={busy === "research" ? "live" : "idle"} />
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Source set</span>
            <select value={filters.sourceSet} onChange={(event) => setFilters((current) => ({ ...current, sourceSet: event.target.value }))} style={inputStyle(darkMode)}>
              <option value="curated-public">Curated public-domain / cultural portals</option>
              <option value="manual-library">Manual library</option>
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Region</span>
              <select value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} style={inputStyle(darkMode)}>
                {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Theme</span>
              <select value={filters.theme} onChange={(event) => setFilters((current) => ({ ...current, theme: event.target.value }))} style={inputStyle(darkMode)}>
                {THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Age tone</span>
            <select value={filters.ageTone} onChange={(event) => setFilters((current) => ({ ...current, ageTone: event.target.value }))} style={inputStyle(darkMode)}>
              {AGE_TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </label>

          <button onClick={startResearch} disabled={busy !== ""} style={primaryButton(darkMode)}>
            {busy === "research" ? "Agent 1 researching stories..." : "Start research"}
          </button>

          <div style={{ display: "grid", gap: 10 }}>
            {shortlistedStories.map((story, index) => {
              const active = story.id === selectedStoryId;
              return (
                <button
                  key={story.id}
                  onClick={() => {
                    setSelectedStoryId(story.id);
                    setStoryDraft({ title: story.title, synopsis: story.synopsis, storyText: story.storyText });
                  }}
                  style={{
                    textAlign: "left",
                    borderRadius: 22,
                    border: `1px solid ${active ? "rgba(240,197,142,0.52)" : darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)"}`,
                    background: active ? (darkMode ? "linear-gradient(180deg, rgba(77,35,22,0.82), rgba(20,10,9,0.9))" : "linear-gradient(180deg, rgba(248,227,197,0.92), rgba(255,247,238,0.98))") : "transparent",
                    color: "inherit",
                    padding: "16px 18px",
                    cursor: "pointer",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 24 }}>{index === 0 ? "Primary" : `Backup ${index}`}</div>
                    <StatusPill label={`Score ${story.score}`} tone={index === 0 ? "ok" : "idle"} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{story.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: darkMode ? "rgba(247,235,209,0.76)" : "rgba(65,32,20,0.78)" }}>{story.synopsis}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill label={story.region} tone="idle" />
                    <StatusPill label={story.theme} tone="idle" />
                    <StatusPill label={story.copyrightStatus} tone="warn" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 26, display: "grid", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Pipeline Status</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 6 }}>Research dossier</div>
            </div>
            <StatusPill label={job?.status || "Waiting"} tone={job ? "ok" : "idle"} />
          </div>

          {selectedStory ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Story title</span>
                  <input value={storyDraft.title} onChange={(event) => setStoryDraft((current) => ({ ...current, title: event.target.value }))} style={inputStyle(darkMode)} />
                </label>
                <div style={{ ...miniPanel(darkMode), display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Authenticity</div>
                  <div style={{ fontSize: 14, lineHeight: 1.55 }}>{selectedStory.authenticityNotes}</div>
                </div>
              </div>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Synopsis</span>
                <textarea value={storyDraft.synopsis} onChange={(event) => setStoryDraft((current) => ({ ...current, synopsis: event.target.value }))} rows={4} style={textareaStyle(darkMode)} />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Source narrative</span>
                <textarea value={storyDraft.storyText} onChange={(event) => setStoryDraft((current) => ({ ...current, storyText: event.target.value }))} rows={7} style={textareaStyle(darkMode)} />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selectedStory.sourceLinks?.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={ghostLink(darkMode)}>
                    {link.label}
                  </a>
                ))}
              </div>

              <button onClick={buildBlueprint} disabled={busy !== ""} style={primaryButton(darkMode)}>
                {busy === "blueprint" ? "Agent 2 writing 7-part blueprint..." : "Build 7-part script pack"}
              </button>
            </>
          ) : (
            <div style={{ ...miniPanel(darkMode), minHeight: 240, display: "grid", placeItems: "center", textAlign: "center", color: darkMode ? "rgba(247,235,209,0.58)" : "rgba(65,32,20,0.58)" }}>
              Research start karte hi shortlisted stories yahan dikhenge.
            </div>
          )}
        </section>
      </div>

      <section style={{ ...panelStyle, padding: 26, display: "grid", gap: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Review Gate</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 6 }}>7 connected reels</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <StatusPill label={reelDrafts.length === 7 ? "Blueprint ready" : "Pending blueprint"} tone={reelDrafts.length === 7 ? "ok" : "idle"} />
            <select value={voiceId} onChange={(event) => setVoiceId(event.target.value)} style={{ ...inputStyle(darkMode), minWidth: 220 }}>
              <option value="">Default warm voice</option>
              {voices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </option>
              ))}
            </select>
            <button onClick={generateAssets} disabled={busy !== "" || reelDrafts.length !== 7} style={primaryButton(darkMode)}>
              {busy === "assets" ? "Agent 3 generating assets..." : "Approve and generate assets"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {reelDrafts.map((reel) => (
            <div key={reel.index} style={{ ...miniPanel(darkMode), padding: 18, display: "grid", gridTemplateColumns: "0.32fr 0.68fr", gap: 18 }}>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>
                  Reel {reel.index}
                </div>
                <textarea value={reel.onscreenText} onChange={(event) => updateReelField(reel.index, "onscreenText", event.target.value)} rows={6} style={textareaStyle(darkMode)} />
                <textarea value={reel.hook} onChange={(event) => updateReelField(reel.index, "hook", event.target.value)} rows={3} style={textareaStyle(darkMode)} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <StatusPill label={reel.assetStatus || "pending"} tone={reel.assetStatus === "ready" ? "ok" : "idle"} />
                  <StatusPill label={reel.renderStatus || "pending"} tone={reel.renderStatus === "ready" ? "ok" : "idle"} />
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <input value={reel.title} onChange={(event) => updateReelField(reel.index, "title", event.target.value)} style={inputStyle(darkMode)} />
                <textarea value={reel.narration} onChange={(event) => updateReelField(reel.index, "narration", event.target.value)} rows={5} style={textareaStyle(darkMode)} />
                <textarea value={reel.imagePrompt} onChange={(event) => updateReelField(reel.index, "imagePrompt", event.target.value)} rows={3} style={textareaStyle(darkMode)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <textarea value={reel.musicPrompt} onChange={(event) => updateReelField(reel.index, "musicPrompt", event.target.value)} rows={3} style={textareaStyle(darkMode)} />
                  <textarea value={reel.cliffhanger} onChange={(event) => updateReelField(reel.index, "cliffhanger", event.target.value)} rows={3} style={textareaStyle(darkMode)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...panelStyle, padding: 26, display: "grid", gap: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Asset Generation</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 6 }}>Cinematic preview wall</div>
          </div>
          <button onClick={renderAll} disabled={busy !== "" || !job?.assets?.length} style={primaryButton(darkMode)}>
            {busy === "render" ? "Agent 4 rendering reel pack..." : "Render 7 reels"}
          </button>
        </div>

        {job?.assets?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {job.assets.map((asset) => {
              const reel = reelDrafts.find((item) => item.index === asset.reelIndex);
              return (
                <div key={asset.reelIndex} style={{ ...miniPanel(darkMode), overflow: "hidden", padding: 0 }}>
                  <div style={{ position: "relative", aspectRatio: "9 / 16", background: "#120d0b" }}>
                    <img src={asset.imageUrl} alt={reel?.title || `Reel ${asset.reelIndex}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: "auto 14px 14px 14px", padding: "10px 12px", borderRadius: 14, background: "rgba(9,8,8,0.54)", backdropFilter: "blur(8px)", fontSize: 13, lineHeight: 1.45 }}>
                      {reel?.onscreenText}
                    </div>
                  </div>
                  <div style={{ padding: 16, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 700 }}>{reel?.title || `Reel ${asset.reelIndex}`}</div>
                      <StatusPill label={`${Math.round(asset.durationSec)} sec`} tone="idle" />
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <audio controls src={asset.voiceoverUrl} style={{ width: "100%" }} />
                      <audio controls src={asset.musicUrl} style={{ width: "100%" }} />
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: darkMode ? "rgba(247,235,209,0.72)" : "rgba(65,32,20,0.72)" }}>
                      Subtitle cues ready and tied to narration duration.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ ...miniPanel(darkMode), minHeight: 220, display: "grid", placeItems: "center", textAlign: "center", color: darkMode ? "rgba(247,235,209,0.58)" : "rgba(65,32,20,0.58)" }}>
            Asset generation ke baad yahan visual, voiceover aur music previews aayenge.
          </div>
        )}
      </section>

      <section style={{ ...panelStyle, padding: 26, display: "grid", gap: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.56)" : "rgba(87,48,20,0.58)" }}>Export Download</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 6 }}>Ready-to-download pack</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {busy === "render" && <StatusPill label={`${renderProgress.done}/${renderProgress.total} ${renderProgress.current}`} tone="live" />}
            {zipBlob && (
              <button onClick={() => downloadBlob(zipBlob, zipName)} style={primaryButton(darkMode)}>
                Download ZIP
              </button>
            )}
          </div>
        </div>

        {exportsState.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {exportsState.map((item) => (
              <div key={item.reelIndex} style={{ ...miniPanel(darkMode), padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.title || `Reel ${item.reelIndex}`}</div>
                  <div style={{ fontSize: 13, color: darkMode ? "rgba(247,235,209,0.64)" : "rgba(65,32,20,0.64)" }}>
                    {item.fileName} · {formatBytes(item.sizeBytes)}
                  </div>
                </div>
                <StatusPill label={item.status} tone={item.status === "ready" ? "ok" : "error"} />
                {item.status === "ready" && item.blob ? (
                  <button onClick={() => downloadBlob(item.blob, item.fileName)} style={secondaryButton(darkMode)}>
                    Download
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: "#fca5a5" }}>{item.error || "Render failed"}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...miniPanel(darkMode), minHeight: 180, display: "grid", placeItems: "center", textAlign: "center", color: darkMode ? "rgba(247,235,209,0.58)" : "rgba(65,32,20,0.58)" }}>
            Final render ke baad 7 MP4 reels aur ZIP bundle yahan se download honge.
          </div>
        )}
      </section>
    </div>
  );
}

function inputStyle(darkMode) {
  return {
    width: "100%",
    padding: "14px 15px",
    borderRadius: 18,
    border: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)"}`,
    background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.74)",
    color: darkMode ? "#fff3dc" : "#2c180f",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };
}

function textareaStyle(darkMode) {
  return {
    ...inputStyle(darkMode),
    resize: "vertical",
    lineHeight: 1.55,
    fontFamily: "inherit",
  };
}

function primaryButton(darkMode) {
  return {
    border: "none",
    borderRadius: 999,
    padding: "14px 22px",
    background: darkMode ? "linear-gradient(135deg, #f0c58e, #c86d3b)" : "linear-gradient(135deg, #7d3f22, #b65e31)",
    color: darkMode ? "#1e1009" : "#fff8f0",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: "0.04em",
  };
}

function secondaryButton(darkMode) {
  return {
    border: `1px solid ${darkMode ? "rgba(255,236,201,0.16)" : "rgba(99,58,24,0.18)"}`,
    borderRadius: 999,
    padding: "11px 18px",
    background: "transparent",
    color: darkMode ? "#fff3dc" : "#2c180f",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

function ghostLink(darkMode) {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 999,
    background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.76)",
    border: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)"}`,
    color: darkMode ? "#fff3dc" : "#2c180f",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  };
}

function miniPanel(darkMode) {
  return {
    borderRadius: 24,
    border: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.12)"}`,
    background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.62)",
  };
}
