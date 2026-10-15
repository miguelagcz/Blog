"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/data/music";

type RepeatMode = "off" | "all" | "one";

const DEFAULT_COVER = "/teescribisinnombre.png";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

/* ── Iconos ─────────────────────────────────────────────────── */
const Icon = {
  play: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" /></svg>
  ),
  pause: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
  ),
  prev: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="2.2" height="14" rx="1" /><path d="M19 6.2v11.6a.8.8 0 01-1.25.66l-8.4-5.8a.8.8 0 010-1.32l8.4-5.8A.8.8 0 0119 6.2z" /></svg>
  ),
  next: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="16.8" y="5" width="2.2" height="14" rx="1" /><path d="M5 6.2v11.6a.8.8 0 001.25.66l8.4-5.8a.8.8 0 000-1.32l-8.4-5.8A.8.8 0 005 6.2z" /></svg>
  ),
  shuffle: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
  ),
  repeat: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 013-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 01-3 3H3" /></svg>
  ),
  vol: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /></svg>
  ),
  mute: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
  ),
};

type Props = {
  tracks: Track[];
  /** Si es true el reproductor se oculta pero el audio sigue sonando */
  hidden?: boolean;
};

export default function MusicPlayer({ tracks, hidden = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlay = useRef(false);

  // Índices de pistas que sí tienen mp3
  const playable = useMemo(
    () =>
      tracks
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => !!t.src && !t.comingSoon)
        .map(({ i }) => i),
    [tracks]
  );

  const [index, setIndex] = useState<number>(playable[0] ?? -1);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [error, setError] = useState(false);

  const track = index >= 0 ? tracks[index] : undefined;

  /* ── Cargar pista al cambiar de índice ──────────────────── */
  useEffect(() => {
    const a = audioRef.current;
    if (!a || index < 0) return;
    a.load();
    if (pendingPlay.current) a.play().catch(() => {});
  }, [index]);

  /* ── Volumen ────────────────────────────────────────────── */
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /* ── Controles del sistema (pantalla de bloqueo, teclas multimedia) ── */
  useEffect(() => {
    if (!track || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist ?? "teescribisinnombre",
      artwork: [{ src: track.cover ?? DEFAULT_COVER }],
    });
  }, [track]);

  /* ── Acciones ───────────────────────────────────────────── */
  const select = (i: number, autoplay = true) => {
    if (i === index) return;
    pendingPlay.current = autoplay;
    setError(false);
    setCurrent(0);
    setDuration(0);
    setIndex(i);
  };

  const step = (dir: 1 | -1) => {
    if (!playable.length) return;
    const pos = playable.indexOf(index);
    let target: number;
    if (shuffle && playable.length > 1) {
      do {
        target = playable[Math.floor(Math.random() * playable.length)];
      } while (target === index);
    } else {
      target = playable[(pos + dir + playable.length) % playable.length];
    }
    if (target === index) {
      const a = audioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      return;
    }
    select(target, true);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || index < 0) return;
    if (a.paused) {
      pendingPlay.current = true;
      a.play().catch(() => setPlaying(false));
    } else {
      pendingPlay.current = false;
      a.pause();
    }
  };

  const prev = () => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    step(-1);
  };

  const onEnded = () => {
    const a = audioRef.current;
    if (repeat === "one" && a) { a.currentTime = 0; a.play().catch(() => {}); return; }
    const isLast = playable.indexOf(index) === playable.length - 1;
    if (isLast && repeat === "off" && !shuffle) {
      pendingPlay.current = false;
      setPlaying(false);
      setCurrent(0);
      return;
    }
    step(1);
  };

  const seek = (v: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = v;
    setCurrent(v);
  };

  const cycleRepeat = () =>
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));

  /* ── Media Session handlers (usan la versión más reciente) ── */
  const handlersRef = useRef({ toggle, prev, step });
  useEffect(() => {
    handlersRef.current = { toggle, prev, step };
  });
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => handlersRef.current.toggle());
    ms.setActionHandler("pause", () => handlersRef.current.toggle());
    ms.setActionHandler("previoustrack", () => handlersRef.current.prev());
    ms.setActionHandler("nexttrack", () => handlersRef.current.step(1));
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
    };
  }, []);

  const pct = duration ? (current / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const hasTracks = playable.length > 0;

  return (
    <div className="mp-root" style={{ display: hidden ? "none" : "block" }}>
      <style>{`
        .mp-root { padding: 0 0 4rem; }

        /* ── Tarjeta principal ── */
        .mp-player {
          width: min(760px, 100%); margin: 0 auto 1.6rem;
          display: grid; grid-template-columns: 230px 1fr; gap: 1.8rem; align-items: center;
          padding: 1.5rem;
          background: linear-gradient(160deg, #1b1b1d 0%, #121213 60%);
          border: 1px solid rgba(205,210,218,0.16);
          border-radius: 22px;
          box-shadow: 0 30px 60px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .mp-cover {
          position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(205,210,218,0.22);
          box-shadow: 0 18px 40px -18px rgba(0,0,0,0.95);
          background: #000;
        }
        .mp-cover img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.05) brightness(0.9); }
        .mp-cover::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 40%, rgba(0,0,0,0.35) 100%);
        }

        .mp-info { min-width: 0; display: flex; flex-direction: column; }
        .mp-kicker {
          font-family: var(--font-sans), sans-serif; font-weight: 300; font-size: 0.58rem;
          letter-spacing: 0.28em; text-transform: uppercase; color: #8d9299; margin-bottom: 0.7rem;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .mp-dot { width: 6px; height: 6px; border-radius: 50%; background: #5a5e65; }
        .mp-dot.on { background: #f1f3f5; box-shadow: 0 0 8px rgba(241,243,245,0.7); }

        .mp-title {
          font-weight: 400; font-size: clamp(1.3rem, 3.4vw, 1.9rem); line-height: 1.2;
          color: #f1f3f5; letter-spacing: 0.01em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-artist {
          font-family: var(--font-sans), sans-serif; font-weight: 300; font-size: 0.62rem;
          letter-spacing: 0.22em; text-transform: uppercase; color: #8d9299; margin-top: 8px;
        }
        .mp-error {
          font-family: var(--font-sans), sans-serif; font-size: 0.55rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: #c8ccd2; margin-top: 8px;
        }

        .mp-progress { display: flex; align-items: center; gap: 12px; margin-top: 1.6rem; }
        .mp-time {
          font-family: var(--font-sans), sans-serif; font-weight: 300; font-size: 0.6rem;
          letter-spacing: 0.08em; color: #8d9299; min-width: 32px; font-variant-numeric: tabular-nums;
        }
        .mp-time.r { text-align: right; }

        .mp-range {
          -webkit-appearance: none; appearance: none; flex: 1; height: 18px;
          background: transparent; cursor: pointer; outline: none; --p: 0%;
        }
        .mp-range::-webkit-slider-runnable-track {
          height: 4px; border-radius: 4px;
          background: linear-gradient(to right, #f1f3f5 var(--p), rgba(205,210,218,0.16) var(--p));
        }
        .mp-range::-moz-range-track { height: 4px; border-radius: 4px; background: rgba(205,210,218,0.16); }
        .mp-range::-moz-range-progress { height: 4px; border-radius: 4px; background: #f1f3f5; }
        .mp-range::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
          background: #ffffff; margin-top: -4px; border: none; box-shadow: 0 0 0 3px rgba(12,12,13,0.9);
        }
        .mp-range::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: none; }
        .mp-range:disabled { opacity: 0.3; cursor: default; }

        .mp-bottom { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.2rem; flex-wrap: wrap; }
        .mp-controls { display: flex; align-items: center; gap: 8px; }
        .mp-btn {
          display: flex; align-items: center; justify-content: center; position: relative;
          background: none; border: none; cursor: pointer; color: #8d9299;
          width: 38px; height: 38px; border-radius: 50%;
        }
        .mp-btn:hover:not(:disabled) { color: #f1f3f5; background: rgba(255,255,255,0.06); }
        .mp-btn:disabled { opacity: 0.25; cursor: default; }
        .mp-btn.on { color: #f1f3f5; }
        .mp-btn.on::after {
          content: ''; position: absolute; bottom: 4px; left: 50%; width: 3px; height: 3px;
          border-radius: 50%; background: currentColor; transform: translateX(-50%);
        }
        .mp-play {
          width: 58px; height: 58px; color: #0c0c0d; margin: 0 6px;
          background: linear-gradient(145deg, #ffffff 0%, #b9bec6 100%);
          box-shadow: 0 10px 24px -10px rgba(255,255,255,0.35);
        }
        .mp-play:hover:not(:disabled) { color: #0c0c0d; background: #ffffff; }
        .mp-badge {
          position: absolute; top: 5px; right: 4px; font-family: var(--font-sans), sans-serif;
          font-size: 0.45rem; font-weight: 400; line-height: 1;
        }

        .mp-vol { display: flex; align-items: center; gap: 6px; width: 140px; }
        .mp-vol .mp-btn { width: 30px; height: 30px; }
        .mp-vol .mp-range::-webkit-slider-runnable-track { height: 3px; }
        .mp-vol .mp-range::-moz-range-track, .mp-vol .mp-range::-moz-range-progress { height: 3px; }

        /* ── Lista ── */
        .mp-list { width: min(760px, 100%); margin: 0 auto; list-style: none; display: grid; gap: 8px; }
        .mp-item {
          display: flex; align-items: center; gap: 14px; padding: 0.9rem 1rem;
          cursor: pointer; border-radius: 14px;
          background: #131314; border: 1px solid rgba(205,210,218,0.10);
        }
        .mp-item:not(.soon):hover { background: #1b1b1d; border-color: rgba(205,210,218,0.28); }
        .mp-item.active { background: #1b1b1d; border-color: rgba(241,243,245,0.5); }
        .mp-item.soon { opacity: 0.4; cursor: default; }
        .mp-num {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-sans), sans-serif; font-weight: 300; font-size: 0.62rem;
          color: #8d9299; border: 1px solid rgba(205,210,218,0.16); font-variant-numeric: tabular-nums;
        }
        .mp-item.active .mp-num { background: #f1f3f5; color: #0c0c0d; border-color: #f1f3f5; }
        .mp-num svg { width: 12px; height: 12px; }
        .mp-item-title {
          flex: 1; min-width: 0; font-weight: 400; font-size: 0.98rem; color: #c8ccd2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-item.active .mp-item-title { color: #ffffff; }
        .mp-tag {
          font-family: var(--font-sans), sans-serif; font-size: 0.5rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: #8d9299;
          border: 1px solid rgba(205,210,218,0.2); border-radius: 100px; padding: 4px 10px;
        }

        .mp-empty { text-align: center; color: #8d9299; padding: 1.2rem 0 0.4rem; font-size: 1rem; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .mp-player { grid-template-columns: 1fr; gap: 1.3rem; padding: 1.1rem; border-radius: 18px; }
          .mp-cover { width: min(260px, 100%); margin: 0 auto; }
          .mp-info { align-items: stretch; text-align: center; }
          .mp-kicker { justify-content: center; }
          .mp-bottom { flex-direction: column; gap: 0.8rem; }
          .mp-vol { width: min(220px, 100%); }
          .mp-item { padding: 0.75rem 0.8rem; gap: 11px; }
        }
      
`}</style>

      {/* El audio vive siempre montado: no se corta al cambiar a "poemas" */}
      <audio
        ref={audioRef}
        src={track?.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => { setError(true); setPlaying(false); }}
      />

      <div className="mp-player">
        <div className="mp-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={track?.cover ?? DEFAULT_COVER} alt={track?.title ?? "portada"} />
        </div>

        <div className="mp-info">
          <span className="mp-kicker">
            <i className={`mp-dot ${playing ? "on" : ""}`} />
            {playing ? "reproduciendo" : "en pausa"}
          </span>
          <p className="mp-title">{track ? track.title : "sin canciones aún"}</p>
          <p className="mp-artist">{track?.artist ?? (hasTracks ? "teescribisinnombre" : "próximamente")}</p>
          {error && <p className="mp-error">no se pudo cargar el audio</p>}

          <div className="mp-progress">
            <span className="mp-time">{fmt(current)}</span>
            <input
              type="range"
              className="mp-range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(current, duration || 0)}
              disabled={!hasTracks || !duration}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ ["--p" as string]: `${pct}%` }}
              aria-label="Progreso"
            />
            <span className="mp-time r">{fmt(duration)}</span>
          </div>

          <div className="mp-bottom">
            <div className="mp-controls">
              <button className={`mp-btn ${shuffle ? "on" : ""}`} onClick={() => setShuffle((s) => !s)} disabled={playable.length < 2} aria-label="Aleatorio" title="Aleatorio">
                {Icon.shuffle}
              </button>
              <button className="mp-btn" onClick={prev} disabled={!hasTracks} aria-label="Anterior">{Icon.prev}</button>
              <button className="mp-btn mp-play" onClick={toggle} disabled={!hasTracks} aria-label={playing ? "Pausar" : "Reproducir"}>
                {playing ? Icon.pause : Icon.play}
              </button>
              <button className="mp-btn" onClick={() => step(1)} disabled={!hasTracks} aria-label="Siguiente">{Icon.next}</button>
              <button className={`mp-btn ${repeat !== "off" ? "on" : ""}`} onClick={cycleRepeat} disabled={!hasTracks} aria-label="Repetir" title={`Repetir: ${repeat}`}>
                {Icon.repeat}
                {repeat === "one" && <span className="mp-badge">1</span>}
              </button>
            </div>

            <div className="mp-vol">
              <button className="mp-btn" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Activar sonido" : "Silenciar"}>
                {muted || volume === 0 ? Icon.mute : Icon.vol}
              </button>
              <input
                type="range"
                className="mp-range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                style={{ ["--p" as string]: `${volPct}%` }}
                aria-label="Volumen"
              />
            </div>
          </div>
        </div>
      </div>

      
{/* ── Lista de reproducción ── */}
      <ul className="mp-list">
        {tracks.map((t, i) => {
          const isPlayable = playable.includes(i);
          const active = i === index;
          return (
            <li
              key={t.id}
              className={`mp-item ${active ? "active" : ""} ${isPlayable ? "" : "soon"}`}
              onClick={() => {
                if (!isPlayable) return;
                if (active) toggle();
                else select(i, true);
              }}
            >
              <span className="mp-num">
                {active && isPlayable ? (playing ? Icon.pause : Icon.play) : String(i + 1).padStart(2, "0")}
              </span>
              <span className="mp-item-title">{t.title}</span>
              {!isPlayable && <span className="mp-tag">próximamente</span>}
            </li>
          );
        })}
      </ul>

      {!hasTracks && (
        <p className="mp-empty">pronto habrá música aquí.</p>
      )}
    </div>
  );
}
