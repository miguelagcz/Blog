"use client";

import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { posts, totalTemporadas, toRoman } from "@/data/posts";
import { tracks } from "@/data/music";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  // ── Cursor ──────────────────────────────────────────────────
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 300, damping: 28, mass: 0.4 });
  const springY = useSpring(cursorY, { stiffness: 300, damping: 28, mass: 0.4 });

  // ── Grain ────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  

  // ── Poems state ─────────────────────────────────────────────
  const [loaded,       setLoaded]       = useState(false);
  const [cardReady,    setCardReady]    = useState<Record<string, boolean>>({});
  const [activeIndex,  setActiveIndex]  = useState<number | null>(null);
  const [closing,      setClosing]      = useState(false);
  const [traduccion,   setTraduccion]   = useState<string | null>(null);
  const [idioma,       setIdioma]       = useState("es");
  const [traduciendo,  setTraduciendo]  = useState(false);
  const [view, setView] = useState<"poemas" | "musica">("poemas");
  

  // ── Scroll-to-poems ─────────────────────────────────────────
  const poemsRef = useRef<HTMLDivElement>(null);
  const scrollToPoems = () => poemsRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Global mouse ────────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 6);
      cursorY.set(e.clientY - 6);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // ── Grain canvas ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;
    let animId: number;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    const drawGrain = () => {
      frameRef.current++;
      if (frameRef.current % 3 === 0) {
        const { width, height } = canvas;
        const qx = frameRef.current % 2 === 0 ? 0 : Math.floor(width / 2);
        const qy = Math.floor(frameRef.current / 2) % 2 === 0 ? 0 : Math.floor(height / 2);
        const qw = Math.floor(width / 2);
        const qh = Math.floor(height / 2);
        const imageData = ctx.createImageData(qw, qh);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          data[i] = v; data[i+1] = v; data[i+2] = v;
          data[i+3] = (Math.random() * 16) | 0;
        }
        ctx.putImageData(imageData, qx, qy);
      }
      animId = requestAnimationFrame(drawGrain);
    };
    drawGrain();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // ── Image preload ────────────────────────────────────────────
  useEffect(() => {
    setLoaded(true);
    let doneCount = 0;
    const markReady = (id: string) => {
      doneCount++;
      setCardReady(prev => ({ ...prev, [id]: true }));
    };
    posts.forEach((p) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try { await img.decode(); } catch (_) { /* noop */ }
        markReady(p.id);
      };
      img.onerror = () => markReady(p.id);
      img.src = p.image;
    });
    const timeout = setTimeout(() => {
      posts.forEach(p => setCardReady(prev => ({ ...prev, [p.id]: true })));
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  // ── Escape key ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  // ── Reset translation on modal change ───────────────────────
  useEffect(() => {
    setTraduccion(null);
    setIdioma("es");
  }, [activeIndex]);

  // ── Modal helpers ────────────────────────────────────────────
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setActiveIndex(null); setClosing(false); }, 350);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (activeIndex === null) return;
    if (direction === "left"  && activeIndex < posts.length - 1) setActiveIndex(activeIndex + 1);
    if (direction === "right" && activeIndex > 0)                setActiveIndex(activeIndex - 1);
  };

  const traducir = async (targetLang: string) => {
    if (!activePost) return;
    if (targetLang === "es") { setIdioma("es"); setTraduccion(null); return; }
    setIdioma(targetLang);
    setTraduciendo(true);
    try {
      const nombreIdioma =  targetLang;
      const res = await fetch("/api/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: activePost.text, idioma: nombreIdioma }),
      });
      const data = await res.json();
      setTraduccion(data.traduccion ?? activePost.text);
    } catch {
      setTraduccion(null);
    } finally {
      setTraduciendo(false);
    }
  };

  const activePost   = activeIndex !== null ? posts[activeIndex] : null;
  const textoVisible = traduciendo
    ? activePost?.text ?? ""
    : (traduccion ?? activePost?.text ?? "");

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@200;300&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
          background: #07070f;
          cursor: none;
          /* overflow visible para scroll normal */
        }

        /* ── Globals ──────────────────────────────────────────── */
        .cursor-dot {
          position: fixed; width: 10px; height: 10px; border-radius: 50%;
          background: rgba(200,170,220,0.65); pointer-events: none;
          z-index: 9999; mix-blend-mode: screen; will-change: transform;
        }
        .grain-canvas {
          position: fixed; inset: 0; pointer-events: none; z-index: 50;
          opacity: 0.45; will-change: auto;
        }
        .blob {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0; will-change: transform;
        }

        /* ── Hero animations ──────────────────────────────────── */
        @keyframes glitch-img {
          0%,89%,100% { opacity: 0; transform: translate(0,0); }
          91% { opacity: 0.4; transform: translate(-3px,1px); filter: hue-rotate(80deg); }
          93% { opacity: 0.2; transform: translate(3px,-1px); filter: hue-rotate(200deg); }
          95% { opacity: 0; }
        }
        .avatar-glitch {
          position: absolute; inset: 0; border-radius: 50%;
          background-size: cover; background-position: center;
          mix-blend-mode: screen;
          animation: glitch-img 7s ease-in-out infinite;
          pointer-events: none; will-change: opacity, transform;
        }
        @keyframes arrow-float {
          0%,100% { opacity: 0.25; transform: translateY(0); }
          50%      { opacity: 0.55; transform: translateY(6px); }
        }
        .scroll-arrow { animation: arrow-float 2.4s ease-in-out infinite; will-change: transform, opacity; }

        /* ── Blob drifts ──────────────────────────────────────── */
        @keyframes star-twinkle { 0%,100% { opacity: 0.1; } 50% { opacity: 0.32; } }
        @keyframes drift1 {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(70px,50px); }
          66%      { transform: translate(-35px,90px); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-80px,-50px); }
        }
        @keyframes drift3 {
          0%,100% { transform: translate(0,0); }
          40%      { transform: translate(50px,-60px); }
          70%      { transform: translate(-50px,35px); }
        }
        .blob-1 { animation: drift1 22s ease-in-out infinite; }
        .blob-2 { animation: drift2 28s ease-in-out infinite; }
        .blob-3 { animation: drift3 32s ease-in-out infinite; }

        /* ── Skeleton ─────────────────────────────────────────── */
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skeleton-card {
          position: relative; width: 100%; aspect-ratio: 9/16;
          border-radius: 14px; overflow: hidden;
          border: 0.5px solid rgba(200,170,220,0.06);
          background: rgba(255,255,255,0.03);
        }
        .skeleton-card::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg,
            transparent 0%, rgba(200,170,220,0.06) 40%,
            rgba(200,170,220,0.12) 50%, rgba(200,170,220,0.06) 60%, transparent 100%);
          background-size: 600px 100%;
          animation: shimmer 2s ease-in-out infinite;
        }
        .skeleton-line { border-radius: 100px; background: rgba(200,170,220,0.07); position: absolute; }

        /* ── Poem cards ───────────────────────────────────────── */
        .poem-card {
          position: relative; width: 100%; aspect-ratio: 9/16;
          border-radius: 14px; overflow: hidden; cursor: none;
          border: 0.5px solid rgba(200,170,220,0.08); transition: border-color 0.4s;
        }
        .poem-card:hover { border-color: rgba(200,170,220,0.22); }
        .poem-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
        .poem-card:hover img { transform: scale(1.05); }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,7,15,0.92) 0%, rgba(7,7,15,0.5) 45%, transparent 100%);
        }
        .card-meta {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity 0.3s;
        }
        .poem-card:hover .card-meta { opacity: 1; }
        .meta-tag {
          font-family: 'Inter', sans-serif; font-size: 0.55rem; font-weight: 300;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(200,180,215,0.6); background: rgba(7,7,15,0.6);
          padding: 3px 7px; border-radius: 100px;
          border: 0.5px solid rgba(200,170,220,0.15); backdrop-filter: blur(6px);
        }
        .card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 14px; z-index: 2; }
        .card-title {
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
          font-size: clamp(0.75rem, 1.4vw, 0.9rem); color: rgba(230,220,235,0.9);
          letter-spacing: 0.03em; margin-bottom: 5px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-poem {
          font-family: 'Cormorant Garamond', serif; font-weight: 300;
          font-size: clamp(0.6rem, 1.1vw, 0.75rem); color: rgba(190,175,185,0.65);
          line-height: 1.6; white-space: pre-line;
          display: -webkit-box; -webkit-line-clamp: 3;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        /* ── Modal ────────────────────────────────────────────── */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(5,5,12,0.88); z-index: 100; backdrop-filter: blur(12px); }
        .modal-container { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center; }
        .modal-card {
          width: min(420px, 92vw); height: min(780px, 90vh); min-height: 0;
          border-radius: 20px; overflow: hidden; position: relative;
          border: 0.5px solid rgba(200,170,220,0.15);
          background: #07070f; display: flex; flex-direction: column;
        }
        .modal-img-wrap { position: relative; flex: 0 0 50%; overflow: hidden; }
        .modal-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .modal-img-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #07070f 0%, rgba(7,7,15,0.3) 60%, transparent 100%);
        }
        .modal-header {
          position: absolute; top: 0; left: 0; right: 0; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between; z-index: 5;
          background: linear-gradient(to bottom, rgba(7,7,15,0.7) 0%, transparent 100%);
        }
        .modal-meta-group { display: flex; gap: 6px; align-items: center; }
        .modal-tag {
          font-family: 'Inter', sans-serif; font-size: 0.55rem; font-weight: 300;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(200,180,215,0.65); background: rgba(7,7,15,0.55);
          padding: 3px 8px; border-radius: 100px;
          border: 0.5px solid rgba(200,170,220,0.18); backdrop-filter: blur(8px);
        }
        .modal-close {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(7,7,15,0.6); border: 0.5px solid rgba(200,170,220,0.2);
          backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
          cursor: none; color: rgba(210,195,220,0.7); font-size: 14px; transition: background 0.3s;
        }
        .modal-close:hover { background: rgba(120,80,160,0.3); }
        .modal-title-over { position: absolute; bottom: 16px; left: 20px; right: 20px; z-index: 5; }
        .modal-title {
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.1rem, 4vw, 1.5rem); color: rgba(240,232,245,0.95);
          letter-spacing: 0.04em; line-height: 1.2;
        }
        .modal-poem-wrap {
          flex: 1; min-height: 0; overflow-y: auto; padding: 20px 28px 12px;
          display: flex; align-items: flex-start; justify-content: center; scrollbar-width: none;
        }
        .modal-poem-wrap::-webkit-scrollbar { display: none; }
        .modal-poem {
          font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic;
          font-size: clamp(1.1rem, 3.5vw, 1.4rem); color: rgba(215,205,225,0.85);
          line-height: 1.85; letter-spacing: 0.02em; white-space: pre-line;
          text-align: center; padding-top: 8px; width: 100%; transition: opacity 0.3s;
        }

        /* ── Lang selector ────────────────────────────────────── */
        .lang-selector {
          padding: 0 16px 10px; display: flex; align-items: center;
          justify-content: center; gap: 5px; flex-wrap: wrap; flex-shrink: 0;
        }
        .lang-btn {
          font-family: 'Inter', sans-serif; font-size: 0.48rem;
          letter-spacing: 0.18em; text-transform: uppercase; cursor: none;
          padding: 4px 9px; border-radius: 100px; transition: all 0.25s;
          border: 0.5px solid rgba(200,170,220,0.15);
          background: transparent; color: rgba(180,165,190,0.4);
        }
        .lang-btn.active { border-color: rgba(200,170,220,0.6); background: rgba(130,80,170,0.2); color: rgba(210,190,225,0.9); }
        .lang-btn:disabled { opacity: 0.3; }
        .lang-btn:not(.active):not(:disabled):hover { border-color: rgba(200,170,220,0.3); color: rgba(200,185,210,0.6); }

        /* ── Nav dots ─────────────────────────────────────────── */
        .nav-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(200,170,220,0.3); transition: background 0.3s, transform 0.3s;
          cursor: none; flex-shrink: 0;
        }
        .nav-dot.active { background: rgba(200,170,220,0.85); transform: scale(1.4); }
      `}</style>

      {/* ── Fixed globals (grain, cursor, blobs, stars) ────────── */}
      <canvas ref={canvasRef} className="grain-canvas" />
      <motion.div className="cursor-dot" style={{ x: springX, y: springY, position: "fixed", zIndex: 9999 }} />

      <div className="blob blob-1" style={{ width:520, height:520, background:"radial-gradient(circle, rgba(110,70,170,0.11) 0%, transparent 70%)", top:-130, left:-130 }} />
      <div className="blob blob-2" style={{ width:400, height:400, background:"radial-gradient(circle, rgba(50,90,155,0.09) 0%, transparent 70%)", bottom:-90, right:-70 }} />
      <div className="blob blob-3" style={{ width:300, height:300, background:"radial-gradient(circle, rgba(160,50,70,0.06) 0%, transparent 70%)", top:"42%", left:"32%" }} />

      <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} preserveAspectRatio="xMidYMid slice">
        {[
          [120,90],[380,150],[720,55],[980,140],[1100,250],
          [70,420],[1160,520],[580,740],[195,700],[920,710],
          [440,360],[800,440],[260,200],[860,320],[500,540],
        ].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy}
            r={0.5+(i%3)*0.35}
            fill={`rgba(200,185,215,${0.1+(i%4)*0.05})`}
            style={{ animation:`star-twinkle ${3+(i%5)}s ease-in-out ${i*0.4}s infinite` }}
          />
        ))}
      </svg>

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", zIndex: 10,
        height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "0 2rem",
      }}>
        {/* Avatar */}
        <motion.div {...fadeUp(0.05)} style={{ position:"relative", width:88, height:88, marginBottom:"2rem" }}>
          <motion.img
            src="/teescribisinnombre.png"
            alt="teescribisinnombre"
            style={{
              width:"100%", height:"100%", borderRadius:"50%",
              objectFit:"cover", display:"block",
              filter:"saturate(0.65) brightness(0.88)",
              border:"0.5px solid rgba(200,170,220,0.2)",
            }}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.3 }}
          />
          <div className="avatar-glitch" style={{ backgroundImage:"url(/teescribisinnombre.png)" }} />
        </motion.div>

        {/* Title */}
        <motion.h1
          {...fadeUp(0.2)}
          style={{
            fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:300,
            fontSize:"clamp(2rem, 6vw, 3.8rem)", letterSpacing:"0.09em",
            color:"#efe9e0", lineHeight:1, marginBottom:"1rem",
          }}
        >
          tee<span style={{ fontStyle:"italic", color:"#c4aed0" }}>scribi</span>sinnombre
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ opacity:0, scaleX:0 }}
          animate={{ opacity:1, scaleX:1 }}
          transition={{ duration:0.7, delay:0.45, ease:[0.16,1,0.3,1] }}
          style={{
            width:36, height:"0.5px",
            background:"rgba(200,175,215,0.3)",
            margin:"0 auto 1.2rem", transformOrigin:"center",
          }}
        />

        {/* Tagline */}
        <motion.p
          {...fadeUp(0.55)}
          style={{
            fontFamily:"'Cormorant Garamond', serif", fontStyle:"italic", fontWeight:300,
            fontSize:"clamp(0.88rem, 2.2vw, 1.1rem)", color:"rgba(195,185,180,0.58)",
            maxWidth:330, lineHeight:1.75, letterSpacing:"0.025em", marginBottom:"2.6rem",
          }}
        >
          Tal vez te llegue, pero si no es así,<br />
          siempre estarás en forma de letras.
        </motion.p>

        {/* Social links */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:0.8, duration:0.7 }}
          style={{ display:"flex", gap:"0.8rem", alignItems:"center" }}
        >
          <motion.a
            href="https://www.tiktok.com/@teescribisinnombre"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ color:"rgba(210,195,220,0.9)" }}
            style={{
              display:"flex", alignItems:"center", gap:"0.45rem",
              fontSize:"0.68rem", letterSpacing:"0.18em", textTransform:"uppercase",
              color:"rgba(175,165,172,0.5)", textDecoration:"none",
              fontFamily:"'Inter',sans-serif", fontWeight:300,
              padding:"0.45rem 0.9rem", cursor:"none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
            </svg>
            tiktok
          </motion.a>

          <div style={{ width:3, height:3, borderRadius:"50%", background:"rgba(180,160,190,0.3)" }} />

          <motion.a
            href="https://www.instagram.com/teescribisinnombre"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ color:"rgba(210,195,220,0.9)" }}
            style={{
              display:"flex", alignItems:"center", gap:"0.45rem",
              fontSize:"0.68rem", letterSpacing:"0.18em", textTransform:"uppercase",
              color:"rgba(175,165,172,0.5)", textDecoration:"none",
              fontFamily:"'Inter',sans-serif", fontWeight:300,
              padding:"0.45rem 0.9rem", cursor:"none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            instagram
          </motion.a>
        </motion.div>

        {/* Scroll arrow — clickable, scrolls to poems */}
        <motion.button
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1.1, duration:0.8 }}
          onClick={scrollToPoems}
          style={{
            position:"absolute", bottom:"2rem", left:"50%", transform:"translateX(-50%)",
            display:"flex", flexDirection:"column", alignItems:"center",
            gap:6, background:"none", border:"none", cursor:"none",
          }}
        >
          <svg
            className="scroll-arrow"
            width="18" height="18" viewBox="0 0 18 18" fill="none"
          >
            <path
              d="M9 3.5V14.5M9 14.5L4 9.5M9 14.5L14 9.5"
              stroke="rgba(200,170,220,0.45)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </section>
      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 2 — POEMAS
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={poemsRef}
        style={{ position:"relative", zIndex:10, minHeight:"100vh", background:"transparent" }}
      >
        {/* Header */}
      <motion.div
          initial={{ opacity:0, y:-16 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : -16 }}
          transition={{ duration:0.7, delay:0.1, ease:[0.16,1,0.3,1] }}
          style={{ padding:"2rem 1.5rem 1rem", display:"flex", alignItems:"baseline", justifyContent:"space-between" }}
        >
          <div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontWeight:200, fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(180,165,190,0.45)", marginBottom:8 }}>archivo</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:"italic", fontWeight:300, fontSize:"clamp(1.4rem, 4vw, 2rem)", color:"rgba(235,228,242,0.88)", letterSpacing:"0.05em" }}>
              tee<span style={{ color:"#c4aed0" }}>scribi</span>sinnombre
            </h2>
          </div>
          <div style={{ width:"0.5px", height:32, background:"rgba(200,170,220,0.2)" }} />
          <p style={{ fontFamily:"'Inter',sans-serif", fontWeight:200, fontSize:"0.6rem", letterSpacing:"0.14em", color:"rgba(180,165,190,0.4)", textAlign:"right" }}>
            {posts.length} poemas<br />
            {Array.from({ length: totalTemporadas }, (_,i) => (
              <span key={i} style={{ color:"rgba(200,170,220,0.35)", display:"block" }}>temporada {toRoman(i+1)}</span>
            ))}
          </p>
      </motion.div>

<div style={{ display:"flex", justifyContent:"center", gap:8, margin:"0.5rem 0 1.5rem" }}>
          <button
            onClick={() => setView("poemas")}
            style={{
              fontFamily:"'Inter',sans-serif", fontSize:"0.6rem", letterSpacing:"0.18em",
              textTransform:"uppercase", cursor:"none",
              padding:"6px 16px", borderRadius:"100px", transition:"all 0.25s",
              border: view==="poemas" ? "0.5px solid rgba(200,170,220,0.6)" : "0.5px solid rgba(200,170,220,0.15)",
              background: view==="poemas" ? "rgba(130,80,170,0.2)" : "transparent",
              color: view==="poemas" ? "rgba(210,190,225,0.9)" : "rgba(180,165,190,0.4)",
            }}
          >poemas</button>
          <button
            onClick={() => setView("musica")}
            style={{
              fontFamily:"'Inter',sans-serif", fontSize:"0.6rem", letterSpacing:"0.18em",
              textTransform:"uppercase", cursor:"none",
              padding:"6px 16px", borderRadius:"100px", transition:"all 0.25s",
              border: view==="musica" ? "0.5px solid rgba(200,170,220,0.6)" : "0.5px solid rgba(200,170,220,0.15)",
              background: view==="musica" ? "rgba(130,80,170,0.2)" : "transparent",
              color: view==="musica" ? "rgba(210,190,225,0.9)" : "rgba(180,165,190,0.4)",
            }}
          >música</button>
        </div>
        {/* Divider */}
        <motion.div
          initial={{ scaleX:0, opacity:0 }}
          animate={{ scaleX: loaded ? 1 : 0, opacity: loaded ? 1 : 0 }}
          transition={{ duration:0.9, delay:0.25 }}
          style={{ height:"0.5px", background:"rgba(200,170,220,0.1)", margin:"0 1.5rem 1.8rem", transformOrigin:"left" }}
        />

        {/* Grid */}
        {view === "poemas" && (
        <div style={{ padding:"0 1rem 3rem", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:"10px" }}>
          {posts.map((post, i) => {
            const ready = cardReady[post.id] ?? false;
            return (
              <div key={post.id} style={{ position:"relative", width:"100%", aspectRatio:"9/16" }}>
                {/* Skeleton */}
                <AnimatePresence>
                  {!ready && (
                    <motion.div
                      className="skeleton-card"
                      style={{ position:"absolute", inset:0 }}
                      initial={{ opacity:1 }}
                      exit={{ opacity:0 }}
                      transition={{ duration:0.4 }}
                    >
                      <div className="skeleton-line" style={{ bottom:44, left:14, right:40, height:7 }} />
                      <div className="skeleton-line" style={{ bottom:30, left:14, right:60, height:5 }} />
                      <div className="skeleton-line" style={{ bottom:18, left:14, right:50, height:5 }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card real */}
                <AnimatePresence>
                  {ready && (
                    <motion.div
                      className="poem-card"
                      style={{ position:"absolute", inset:0 }}
                      initial={{ opacity:0 }}
                      animate={{ opacity:1 }}
                      transition={{ duration:0.5, delay: i * 0.02 }}
                      onClick={() => setActiveIndex(i)}
                    >
                      <img src={post.image} alt={post.title} />
                      <div className="card-overlay" />
                      <div className="card-meta">
                        <span className="meta-tag">T{post.temporada}</span>
                        <span className="meta-tag">E{String(post.episodio).padStart(2,"0")}</span>
                      </div>
                      <div className="card-content">
                        <div className="card-title">{post.title}</div>
                        <div className="card-poem">{post.text}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
        )}
        {/* Reproductor de música (siempre montado para que el audio no se corte al cambiar de pestaña) */}
        <MusicPlayer tracks={tracks} hidden={view !== "musica"} />
      </section>


      {/* ══════════════════════════════════════════════════════════
          MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeIndex !== null && !closing && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.35 }}
              onClick={handleClose}
            />
            <div className="modal-container">
              <motion.div
                className="modal-card"
                initial={{ opacity:0, scale:0.94, y:30 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.94, y:30 }}
                transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
                drag="y"
                dragConstraints={{ top:0, bottom:0 }}
                dragElastic={{ top:0.05, bottom:0.3 }}
                onDragEnd={(_,info) => { if (info.offset.y > 100) handleClose(); }}
                onClick={(e) => e.stopPropagation()}
              >
                {activePost && (
                  <>
                    <div className="modal-img-wrap">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activePost.id}
                          src={activePost.image} alt={activePost.title}
                          initial={{ opacity:0, scale:1.06 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                          transition={{ duration:0.5 }}
                        />
                      </AnimatePresence>
                      <div className="modal-img-gradient" />
                      <div className="modal-header">
                        <div className="modal-meta-group">
                          <span className="modal-tag">T{activePost.temporada}</span>
                          <span className="modal-tag">E{String(activePost.episodio).padStart(2,"0")}</span>
                        </div>
                        <button className="modal-close" onClick={handleClose}>✕</button>
                      </div>
                      <div className="modal-title-over">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={activePost.id+"-title"}
                            className="modal-title"
                            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                            transition={{ duration:0.4 }}
                          >{activePost.title}</motion.p>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="modal-poem-wrap">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={activePost.id+"-poem-"+idioma}
                          className="modal-poem"
                          style={{ opacity: traduciendo ? 0.3 : 1 }}
                          initial={{ opacity:0, y:16 }}
                          animate={{ opacity: traduciendo ? 0.3 : 1, y:0 }}
                          exit={{ opacity:0, y:-8 }}
                          transition={{ duration:0.5, delay:0.1 }}
                        >{textoVisible}</motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Nav */}
                    <div style={{ padding:"0 8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
                      <button
                        onClick={() => handleSwipe("right")}
                        disabled={activeIndex === 0}
                        style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.6rem", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"none", color: activeIndex===0 ? "rgba(180,165,190,0.2)" : "rgba(200,170,220,0.55)", background:"none", border:"0.5px solid currentColor", borderRadius:"100px", padding:"6px 14px", transition:"color 0.3s", flexShrink:0, whiteSpace:"nowrap" }}
                      >← ant</button>

                      <div style={{ display:"flex", gap:5, overflowX:"auto", scrollbarWidth:"none", padding:"4px 0", flexShrink:1, justifyContent:"center" }}>
                        {posts.map((_,i) => (
                          <div key={i} className={`nav-dot ${i===activeIndex?"active":""}`} onClick={() => setActiveIndex(i)} />
                        ))}
                      </div>
                      <button
                        onClick={() => handleSwipe("left")}
                        disabled={activeIndex === posts.length-1}
                        style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.6rem", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"none", color: activeIndex===posts.length-1 ? "rgba(180,165,190,0.2)" : "rgba(200,170,220,0.55)", background:"none", border:"0.5px solid currentColor", borderRadius:"100px", padding:"6px 14px", transition:"color 0.3s", flexShrink:0, whiteSpace:"nowrap" }}
                      >sig →</button>
                    </div>

                    <div style={{ paddingBottom:12, display:"flex", justifyContent:"center" }}>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.5rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(180,165,190,0.25)" }}>
                        desliza abajo para cerrar
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}