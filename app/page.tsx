"use client";

import { useEffect, useState } from "react";
import { posts, totalTemporadas, toRoman } from "@/data/posts";
import { tracks } from "@/data/music";
import MusicPlayer from "@/components/MusicPlayer";

/**
 * Imagen horizontal de cada temporada.
 * Guarda tus fotos en /public/temporadas/ con estos nombres:
 *   temporada-1.jpg, temporada-2.jpg, temporada-3.jpg ...
 * Tamaño recomendado: 2100 × 900 px (formato 21:9).
 */
const seasonImage = (n: number) => `/temporadas/temporada-${n}.jpg`;

function SeasonBanner({ n }: { n: number }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className="season-banner">
      {missing && (
        <div className="season-slot">
          <span className="eyebrow">temporada {toRoman(n)}</span>
          <span className="eyebrow">espacio para imagen · 2100 × 900</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={seasonImage(n)}
        alt={`Temporada ${toRoman(n)}`}
        style={missing ? { display: "none" } : undefined}
        onError={() => setMissing(true)}
      />
    </div>
  );
}

const TikTok = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" />
  </svg>
);
const Instagram = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export default function Home() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [view, setView] = useState<"poemas" | "musica">("poemas");

  const close = () => setActiveIndex(null);
  const go = (delta: number) =>
    setActiveIndex((i) => (i === null ? i : Math.min(Math.max(i + delta, 0), posts.length - 1)));

  // Teclado + bloqueo de scroll mientras el modal está abierto
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeIndex !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = activeIndex !== null ? posts[activeIndex] : null;
  const pad = (n: number) => String(n).padStart(2, "0");

  const seasons = Array.from({ length: totalTemporadas }, (_, i) => ({
    n: i + 1,
    items: posts
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.temporada === i + 1),
  }));

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="hero">
        <div className="avatar-ring">
          <div className="avatar-gap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="avatar-img" src="/teescribisinnombre.png" alt="teescribisinnombre" />
          </div>
        </div>

        <h1 className="brand silver-text">
          tee<em>scribi</em>sinnombre
        </h1>
        <div className="rule" />
        <p className="tagline">
          Tal vez te llegue, pero si no es así,
          <br />
          siempre estarás en forma de letras.
        </p>

        <div className="socials">
          <a className="social" href="https://www.tiktok.com/@teescribisinnombre" target="_blank" rel="noopener noreferrer">
            {TikTok} tiktok
          </a>
          <a className="social" href="https://www.instagram.com/teescribisinnombre" target="_blank" rel="noopener noreferrer">
            {Instagram} instagram
          </a>
        </div>

        <div className="stats">
          <div className="stat"><b>{posts.length}</b><span className="eyebrow">poemas</span></div>
          <div className="stat"><b>{toRoman(totalTemporadas).toUpperCase()}</b><span className="eyebrow">temporadas</span></div>
          <div className="stat"><b>{tracks.length}</b><span className="eyebrow">canciones</span></div>
        </div>

        <a href="#archivo" className="eyebrow hero-link">ver archivo ↓</a>
      </section>

      {/* ───────────── ARCHIVO ───────────── */}
      <main id="archivo" className="archive">
        <nav className="tabs">
          <button className={`tab ${view === "poemas" ? "active" : ""}`} onClick={() => setView("poemas")}>poemas</button>
          <button className={`tab ${view === "musica" ? "active" : ""}`} onClick={() => setView("musica")}>música</button>
        </nav>

        {view === "poemas" &&
          seasons.map(({ n, items }) => (
            <section key={n} className="season">
              <SeasonBanner n={n} />
              <div className="season-caption">
                <h2 className="season-title">temporada {toRoman(n)}</h2>
                <span className="eyebrow">{items.length} poemas</span>
              </div>

              <div className="grid">
                {items.map(({ p, idx }) => (
                  <button key={p.id} className="card" onClick={() => setActiveIndex(idx)}>
                    <div className="card-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" loading="lazy" />
                      <span className="card-num">T{p.temporada} · E{pad(p.episodio)}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-title">{p.title}</div>
                      <div className="card-line" />
                      <div className="card-text">{p.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}

        {/* Siempre montado para que el audio no se corte al cambiar de pestaña */}
        <MusicPlayer tracks={tracks} hidden={view !== "musica"} />
      </main>

      {/* ───────────── MODAL ───────────── */}
      {active && activeIndex !== null && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <span className="eyebrow">
                temporada {toRoman(active.temporada)} · episodio {pad(active.episodio)}
              </span>
              <button className="modal-close" onClick={close} aria-label="Cerrar">✕</button>
            </div>

            <div className="modal-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.image} alt={active.title} />
            </div>

            <h3 className="modal-title">{active.title}</h3>

            <div className="modal-poem-wrap">
              <p className="modal-poem">{active.text}</p>
            </div>

            <div className="modal-nav">
              <button className="nav-btn" onClick={() => go(-1)} disabled={activeIndex === 0}>← ant</button>
              <span className="eyebrow">{pad(activeIndex + 1)} / {pad(posts.length)}</span>
              <button className="nav-btn" onClick={() => go(1)} disabled={activeIndex === posts.length - 1}>sig →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
