"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { posts, totalTemporadas, toRoman } from "@/data/posts";

export default function Poemas() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 80, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 6);
      cursorY.set(e.clientY - 6);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const drawGrain = () => {
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v; data[i + 1] = v; data[i + 2] = v;
        data[i + 3] = Math.random() * 18;
      }
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(drawGrain);
    };
    drawGrain();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    posts.forEach((p) => { const img = new Image(); img.src = p.image; });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setActiveIndex(null); setClosing(false); }, 350);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (activeIndex === null) return;
    if (direction === "left" && activeIndex < posts.length - 1) setActiveIndex(activeIndex + 1);
    if (direction === "right" && activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const activePost = activeIndex !== null ? posts[activeIndex] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@200;300&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #07070f; cursor: none; }

        .cursor-dot {
          position: fixed; width: 12px; height: 12px;
          border-radius: 50%; background: rgba(200,170,220,0.7);
          pointer-events: none; z-index: 9999; mix-blend-mode: screen;
        }
        .grain-canvas {
          position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.5;
        }
        .blob {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .poem-card {
          position: relative; width: 100%; aspect-ratio: 9/16;
          border-radius: 14px; overflow: hidden; cursor: none;
          border: 0.5px solid rgba(200,170,220,0.08);
          transition: border-color 0.4s;
        }
        .poem-card:hover { border-color: rgba(200,170,220,0.22); }
        .poem-card img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transition: transform 0.8s ease;
        }
        .poem-card:hover img { transform: scale(1.05); }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,7,15,0.92) 0%, rgba(7,7,15,0.5) 45%, transparent 100%);
        }
        .card-meta {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; align-items: center; gap: 6px;
          opacity: 0; transition: opacity 0.3s;
        }
        .poem-card:hover .card-meta { opacity: 1; }
        .meta-tag {
          font-family: 'Inter', sans-serif; font-size: 0.55rem; font-weight: 300;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(200,180,215,0.6); background: rgba(7,7,15,0.6);
          padding: 3px 7px; border-radius: 100px;
          border: 0.5px solid rgba(200,170,220,0.15); backdrop-filter: blur(6px);
        }
        .card-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px 14px; z-index: 2;
        }
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
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(5,5,12,0.88);
          z-index: 100; backdrop-filter: blur(12px);
        }
        .modal-container {
          position: fixed; inset: 0; z-index: 110;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-card {
  width: min(420px, 92vw);
  height: min(780px, 90vh);
  min-height: 0;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  border: 0.5px solid rgba(200,170,220,0.15);
  background: #07070f;
  display: flex;
  flex-direction: column;
}
        .modal-img-wrap { position: relative; flex: 0 0 55%; overflow: hidden; }
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
        .modal-title-over {
          position: absolute; bottom: 16px; left: 20px; right: 20px; z-index: 5;
        }
        .modal-title {
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.1rem, 4vw, 1.5rem); color: rgba(240,232,245,0.95);
          letter-spacing: 0.04em; line-height: 1.2;
        }
      .modal-poem-wrap {
  flex: 1;
  min-height: 0;          /* ← clave: permite que flex shrink funcione */
  overflow-y: auto;
  padding: 24px 28px 32px;
  display: flex;
  align-items: flex-start; /* ← cambia de center a flex-start */
  justify-content: center;
  scrollbar-width: none;
}
.modal-poem-wrap::-webkit-scrollbar { display: none; }

.modal-poem {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  font-style: italic;
  font-size: clamp(1.1rem, 3.5vw, 1.4rem);
  color: rgba(215,205,225,0.85);
  line-height: 1.85;
  letter-spacing: 0.02em;
  white-space: pre-line;
  text-align: center;
  padding-top: 12px;      /* ← compensa el align-items: flex-start */
  width: 100%;
}
        .nav-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(200,170,220,0.3); transition: background 0.3s, transform 0.3s;
          cursor: none;
        }
        .nav-dot.active { background: rgba(200,170,220,0.85); transform: scale(1.4); }
        @keyframes star-twinkle { 0%,100% { opacity: 0.12; } 50% { opacity: 0.38; } }
        @keyframes drift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(80px,60px) scale(1.1); }
          66% { transform: translate(-40px,100px) scale(0.9); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(-90px,-60px) scale(1.12); }
        }
      `}</style>

      <canvas ref={canvasRef} className="grain-canvas" />
      <motion.div className="cursor-dot" style={{ x: springX, y: springY, position: "fixed", zIndex: 9999 }} />

      <div className="blob" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(110,70,170,0.11) 0%, transparent 70%)", top: -120, left: -120, animation: "drift1 20s ease-in-out infinite" }} />
      <div className="blob" style={{ width: 380, height: 380, background: "radial-gradient(circle, rgba(50,90,155,0.09) 0%, transparent 70%)", bottom: -80, right: -60, animation: "drift2 25s ease-in-out infinite" }} />

      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} preserveAspectRatio="xMidYMid slice">
        {[[120,90],[380,150],[720,55],[980,140],[1100,250],[70,420],[1160,520],[580,740],[195,700],[920,710],[440,360],[800,440]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={0.6 + (i % 3) * 0.4}
            fill={`rgba(200,185,215,${0.1 + (i % 4) * 0.06})`}
            style={{ animation: `star-twinkle ${3 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}
          />
        ))}
      </svg>

      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", background: "#07070f", fontFamily: "'Cormorant Garamond', serif" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: "2rem 1.5rem 1rem", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}
        >
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 200, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(180,165,190,0.45)", marginBottom: 8 }}>archivo</p>
            <h2 style={{ fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.4rem, 4vw, 2rem)", color: "rgba(235,228,242,0.88)", letterSpacing: "0.05em" }}>
              tee<span style={{ color: "#c4aed0" }}>scribi</span>sinnombre
            </h2>
          </div>
          <div style={{ width: "0.5px", height: 32, background: "rgba(200,170,220,0.2)" }} />
          {/* Header derecho: temporadas dinámicas */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 200, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(180,165,190,0.4)", textAlign: "right" }}>
            {posts.length} poemas<br />
            {Array.from({ length: totalTemporadas }, (_, i) => (
              <span key={i} style={{ color: "rgba(200,170,220,0.35)", display: "block" }}>
                temporada {toRoman(i + 1)}
              </span>
            ))}
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{ height: "0.5px", background: "rgba(200,170,220,0.1)", margin: "0 1.5rem 1.8rem", transformOrigin: "left" }}
        />

        {/* Grid */}
        <div style={{ padding: "0 1rem 3rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              className="poem-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setActiveIndex(i)}
            >
              <img src={post.image} alt={post.title} />
              <div className="card-overlay" />
              <div className="card-meta">
                <span className="meta-tag">T{post.temporada}</span>
                <span className="meta-tag">E{String(post.episodio).padStart(2, "0")}</span>
              </div>
              <div className="card-content">
                <div className="card-title">{post.title}</div>
                <div className="card-poem">{post.text}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {activeIndex !== null && !closing && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={handleClose}
            />
            <div className="modal-container">
              <motion.div
                className="modal-card"
                initial={{ opacity: 0, scale: 0.94, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.3 }}
                onDragEnd={(_, info) => { if (info.offset.y > 100) handleClose(); }}
                onClick={(e) => e.stopPropagation()}
              >
                {activePost && (
                  <>
                    <div className="modal-img-wrap">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activePost.id}
                          src={activePost.image}
                          alt={activePost.title}
                          initial={{ opacity: 0, scale: 1.06 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      </AnimatePresence>
                      <div className="modal-img-gradient" />
                      <div className="modal-header">
                        <div className="modal-meta-group">
                          <span className="modal-tag">T{activePost.temporada}</span>
                          <span className="modal-tag">E{String(activePost.episodio).padStart(2, "0")}</span>
                        </div>
                        <button className="modal-close" onClick={handleClose}>✕</button>
                      </div>
                      <div className="modal-title-over">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={activePost.id + "-title"}
                            className="modal-title"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                          >
                            {activePost.title}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="modal-poem-wrap">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={activePost.id + "-poem"}
                          className="modal-poem"
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          {activePost.text}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Nav */}
                 {/* Nav */}
<div style={{
  padding: "0 8px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
}}>
  <button
    onClick={() => handleSwipe("right")}
    disabled={activeIndex === 0}
    style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.6rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      cursor: "none",
      color: activeIndex === 0 ? "rgba(180,165,190,0.2)" : "rgba(200,170,220,0.55)",
      background: "none",
      border: "0.5px solid currentColor",
      borderRadius: "100px",
      padding: "6px 14px",
      transition: "color 0.3s",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >← ant</button>

  {/* dots — scroll horizontal si hay muchos */}
  <div style={{
    display: "flex",
    gap: 5,
    overflowX: "auto",
    scrollbarWidth: "none",
    padding: "4px 0",
    flexShrink: 1,
    justifyContent: "center",
  }}>
    {posts.map((_, i) => (
      <div
        key={i}
        className={`nav-dot ${i === activeIndex ? "active" : ""}`}
        onClick={() => setActiveIndex(i)}
        style={{ flexShrink: 0 }}
      />
    ))}
  </div>

  <button
    onClick={() => handleSwipe("left")}
    disabled={activeIndex === posts.length - 1}
    style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.6rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      cursor: "none",
      color: activeIndex === posts.length - 1 ? "rgba(180,165,190,0.2)" : "rgba(200,170,220,0.55)",
      background: "none",
      border: "0.5px solid currentColor",
      borderRadius: "100px",
      padding: "6px 14px",
      transition: "color 0.3s",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >sig →</button>
</div>

                    <div style={{ paddingBottom: 14, display: "flex", justifyContent: "center" }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(180,165,190,0.25)" }}>
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
