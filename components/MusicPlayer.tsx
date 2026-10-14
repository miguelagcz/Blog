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
        .mp-root { padding: 0 1rem 4rem; }
        .mp-player {
          width: min(480px, 100%); margin: 0 auto 2rem;
          padding: 1.6rem 1.4rem 1.3rem; border-radius: 20px;
          border: 0.5px solid rgba(200,170,220,0.14);
          background: linear-gradient(160deg, rgba(130,80,170,0.10), rgba(7,7,15,0.55));
          backdrop-filter: blur(14px);
          display: flex; flex-direction: column; align-items: center;
        }
        .mp-cover {
          position: relative; width: 168px; height: 168px; border-radius: 50%;
          margin-bottom: 1.3rem; flex-shrink: 0;
          border: 0.5px solid rgba(200,170,220,0.25);
          box-shadow: 0 0 60px rgba(130,80,170,0.18);
          animation: mp-spin 18s linear infinite; animation-play-state: paused;
          overflow: hidden;
        }
        .mp-cover.on { animation-play-state: running; }
        .mp-cover img { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.7) brightness(0.85); }
        .mp-cover::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: 26px; height: 26px; border-radius: 50%; transform: translate(-50%,-50%);
          background: #07070f; border: 0.5px solid rgba(200,170,220,0.3);
        }
        @keyframes mp-spin { to { transform: rotate(360deg); } }

        .mp-title {
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.15rem, 4vw, 1.5rem); color: rgba(240,232,245,0.95);
          letter-spacing: 0.04em; text-align: center; max-width: 100%;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-artist {
          font-family: 'Inter', sans-serif; font-weight: 200; font-size: 0.58rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(180,165,190,0.5); margin-top: 6px; min-height: 0.9rem; text-align: center;
        }
        .mp-error {
          font-family: 'Inter', sans-serif; font-size: 0.55rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(220,130,150,0.8); margin-top: 6px;
        }

        .mp-progress { width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 1.3rem; }
        .mp-time {
          font-family: 'Inter', sans-serif; font-weight: 200; font-size: 0.58rem;
          letter-spacing: 0.1em; color: rgba(180,165,190,0.55);
          min-width: 30px; font-variant-numeric: tabular-nums;
        }
        .mp-time.r { text-align: right; }

        .mp-range {
          -webkit-appearance: none; appearance: none; flex: 1; height: 14px;
          background: transparent; cursor: none; outline: none; --p: 0%;
        }
        .mp-range::-webkit-slider-runnable-track {
          height: 2px; border-radius: 2px;
          background: linear-gradient(to right, rgba(210,185,230,0.85) var(--p), rgba(200,170,220,0.15) var(--p));
        }
        .mp-range::-moz-range-track { height: 2px; border-radius: 2px; background: rgba(200,170,220,0.15); }
        .mp-range::-moz-range-progress { height: 2px; border-radius: 2px; background: rgba(210,185,230,0.85); }
        .mp-range::-webkit-slider-thumb {
          -webkit-appearance: none; width: 11px; height: 11px; border-radius: 50%;
          background: #e6d6f0; margin-top: -4.5px; border: none;
          box-shadow: 0 0 10px rgba(196,174,208,0.6); transition: transform .2s;
        }
        .mp-range::-moz-range-thumb { width: 11px; height: 11px; border-radius: 50%; background: #e6d6f0; border: none; }
        .mp-range:hover::-webkit-slider-thumb { transform: scale(1.35); }
        .mp-range:disabled { opacity: 0.3; }

        .mp-controls { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 1rem; }
        .mp-btn {
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: none;
          color: rgba(200,170,220,0.6); width: 34px; height: 34px; border-radius: 50%;
          transition: color .25s, background .25s, transform .2s; position: relative;
        }
        .mp-btn:hover:not(:disabled) { color: rgba(235,220,245,0.95); background: rgba(130,80,170,0.15); }
        .mp-btn:disabled { opacity: 0.25; }
        .mp-btn.on { color: #d9bdf0; }
        .mp-btn.on::after {
          content: ''; position: absolute; bottom: 3px; left: 50%; width: 3px; height: 3px;
          border-radius: 50%; background: currentColor; transform: translateX(-50%);
        }
        .mp-play {
          width: 52px; height: 52px; color: rgba(240,230,248,0.95);
          border: 0.5px solid rgba(200,170,220,0.4); background: rgba(130,80,170,0.22);
        }
        .mp-play:hover:not(:disabled) { background: rgba(130,80,170,0.4); transform: scale(1.05); }
        .mp-badge {
          position: absolute; top: 4px; right: 3px; font-family: 'Inter', sans-serif;
          font-size: 0.45rem; font-weight: 300; line-height: 1;
        }

        .mp-vol { display: flex; align-items: center; gap: 8px; margin-top: 0.9rem; width: 150px; }
        .mp-vol .mp-btn { width: 26px; height: 26px; }

        /* ── Lista ── */
        .mp-list { width: min(480px, 100%); margin: 0 auto; list-style: none; }
        .mp-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 12px;
          border-radius: 12px; cursor: none; border: 0.5px solid transparent;
          transition: background .25s, border-color .25s;
        }
        .mp-item:not(.soon):hover { background: rgba(130,80,170,0.10); }
        .mp-item.active { background: rgba(130,80,170,0.16); border-color: rgba(200,170,220,0.18); }
        .mp-item.soon { opacity: 0.4; }
        .mp-num {
          width: 20px; text-align: center; flex-shrink: 0;
          font-family: 'Inter', sans-serif; font-weight: 200; font-size: 0.6rem;
          color: rgba(180,165,190,0.5); font-variant-numeric: tabular-nums;
        }
        .mp-item-title {
          flex: 1; min-width: 0; font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-weight: 300; font-size: 1rem; color: rgba(230,220,235,0.9);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mp-item.active .mp-item-title { color: #e8d4f5; }
        .mp-tag {
          font-family: 'Inter', sans-serif; font-size: 0.5rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(200,180,215,0.5);
          border: 0.5px solid rgba(200,170,220,0.2); border-radius: 100px; padding: 3px 9px;
        }
        .mp-eq { display: flex; align-items: flex-end; gap: 2px; height: 12px; width: 14px; }
        .mp-eq i { display: block; width: 2px; background: #d9bdf0; border-radius: 1px; height: 30%; }
        .mp-eq.on i { animation: mp-eq 0.9s ease-in-out infinite; }
        .mp-eq.on i:nth-child(2) { animation-delay: .25s; }
        .mp-eq.on i:nth-child(3) { animation-delay: .5s; }
        @keyframes mp-eq { 0%,100% { height: 25%; } 50% { height: 100%; } }

        .mp-empty {
          text-align: center; font-family: 'Cormorant Garamond', serif; font-style: italic;
          color: rgba(190,175,200,0.55); padding: 1.2rem 0 0.4rem; font-size: 1rem;
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
        <div className={`mp-cover ${playing ? "on" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={track?.cover ?? DEFAULT_COVER} alt={track?.title ?? "portada"} />
        </div>

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
                {active && isPlayable ? (
                  <span className={`mp-eq ${playing ? "on" : ""}`}><i /><i /><i /></span>
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
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
