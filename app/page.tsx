"use client";
 
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
 
export default function Home() {
  const router = useRouter();
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 80, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 80, damping: 20 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  // Custom cursor
  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 6);
      cursorY.set(e.clientY - 6);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
 
  // Grain canvas
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
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = Math.random() * 18;
      }
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(drawGrain);
    };
    drawGrain();
 
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 1.1,
    delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
});
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@200;300&display=swap');
 
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
 
        html, body {
          height: 100%;
          background: #07070f;
          overflow: hidden;
          cursor: none;
        }
 
        .cursor-dot {
          position: fixed;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(200, 170, 220, 0.7);
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: screen;
        }
 
        .grain-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          opacity: 0.55;
        }
 
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
 
        @keyframes glitch-img {
          0%,89%,100% { opacity: 0; transform: translate(0,0) scaleX(1); }
          90% { opacity: 0.5; transform: translate(-4px, 1px) scaleX(1.02); filter: hue-rotate(80deg) saturate(2); }
          92% { opacity: 0.3; transform: translate(4px, -2px); filter: hue-rotate(200deg); }
          94% { opacity: 0; }
          96% { opacity: 0.2; transform: translate(-2px,2px); filter: hue-rotate(340deg); }
          97% { opacity: 0; }
        }
 
        .avatar-glitch {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          mix-blend-mode: screen;
          animation: glitch-img 5s ease-in-out infinite;
          pointer-events: none;
        }
 
        @keyframes scroll-pulse {
          0%,100% { opacity: 0.2; transform: scaleY(1); }
          50% { opacity: 0.6; transform: scaleY(1.08); }
        }
        .scroll-line {
          width: 0.5px;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(200,170,220,0.45));
          animation: scroll-pulse 2.8s ease-in-out infinite;
        }
 
        @keyframes star-twinkle {
          0%,100% { opacity: 0.12; }
          50% { opacity: 0.4; }
        }
      `}</style>
 
      {/* Grain */}
      <canvas ref={canvasRef} className="grain-canvas" />
 
      {/* Custom cursor */}
      <motion.div
        className="cursor-dot"
        style={{ x: springX, y: springY, position: "fixed", zIndex: 9999 }}
      />
 
      {/* Ambient blobs */}
      <motion.div
        className="blob"
        style={{
          width: 560, height: 560,
          background: "radial-gradient(circle, rgba(110,70,170,0.13) 0%, transparent 70%)",
          top: -140, left: -140,
        }}
        animate={{ x: [0, 80, -50, 0], y: [0, 60, 110, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blob"
        style={{
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(50,90,155,0.10) 0%, transparent 70%)",
          bottom: -100, right: -80,
        }}
        animate={{ x: [0, -90, 30, 0], y: [0, -60, -30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="blob"
        style={{
          width: 320, height: 320,
          background: "radial-gradient(circle, rgba(160,50,70,0.07) 0%, transparent 70%)",
          top: "45%", left: "35%",
        }}
        animate={{ x: [0, 50, -70, 20, 0], y: [0, -80, 40, -20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
 
      {/* Stars */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
        preserveAspectRatio="xMidYMid slice"
      >
        {[
          [120,90],[380,150],[720,55],[980,140],[1100,250],
          [70,420],[1160,520],[580,740],[195,700],[920,710],
          [440,360],[800,440],[260,200],[860,320],[500,540],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={0.6 + (i % 3) * 0.4}
            fill={`rgba(200,185,215,${0.12 + (i % 4) * 0.06})`}
            style={{ animation: `star-twinkle ${3 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}
          />
        ))}
      </svg>
 
      {/* Main content */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 2rem",
          gap: 0,
        }}
      >
        {/* Avatar */}
        <motion.div
          {...stagger(0.1)}
          style={{ position: "relative", width: 88, height: 88, marginBottom: "2.2rem" }}
        >
          <motion.img
           src="/teescribisinnombre.png"
            alt="teescribisinnombre"
            style={{
              width: "100%", height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.65) brightness(0.88)",
              border: "0.5px solid rgba(200,170,220,0.2)",
            }}
            whileHover={{ filter: "saturate(0.9) brightness(1)", scale: 1.04 }}
            transition={{ duration: 0.5 }}
          />
          {/* Glitch layer */}
          <div
            className="avatar-glitch"
            style={{ backgroundImage: "url(/teescribisinnombre.jpeg)" }}
          />
        </motion.div>
 
        {/* Title */}
        <motion.h1
          {...stagger(0.4)}
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(2rem, 6vw, 3.8rem)",
            letterSpacing: "0.09em",
            color: "#efe9e0",
            lineHeight: 1,
            marginBottom: "1.1rem",
          }}
        >
          tee
          <span style={{ fontStyle: "italic", color: "#c4aed0" }}>scribi</span>
          sinnombre
        </motion.h1>
 
        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 38, height: "0.5px",
            background: "rgba(200,175,215,0.32)",
            margin: "0 auto 1.3rem",
            transformOrigin: "center",
          }}
        />
 
        {/* Tagline */}
        <motion.p
          {...stagger(1.05)}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(0.9rem, 2.2vw, 1.12rem)",
            color: "rgba(195,185,180,0.6)",
            maxWidth: 340,
            lineHeight: 1.75,
            letterSpacing: "0.025em",
            marginBottom: "2.8rem",
          }}
        >
          Tal vez te llegue, pero si no es así,
          <br />
          siempre estarás en forma de letras.
        </motion.p>
 
        {/* Enter button */}
        <motion.button
          onClick={() => router.push("/poemas")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          whileHover={{ scale: 1.05, borderColor: "rgba(200,165,220,0.6)", backgroundColor: "rgba(130,80,170,0.15)" }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "inline-block",
            padding: "0.75rem 2.6rem",
            border: "0.5px solid rgba(200,180,215,0.35)",
            borderRadius: 100,
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 300,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#ddd4e6",
            cursor: "none",
            background: "rgba(110,70,155,0.07)",
            marginBottom: "2.4rem",
            transition: "background 0.4s, border-color 0.4s",
          }}
        >
          entrar
        </motion.button>
 
        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.65, duration: 0.9 }}
          style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}
        >
          {/* TikTok */}
          <motion.a
            href="https://www.tiktok.com/@teescribisinnombre"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ color: "rgba(210,195,220,0.9)" }}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(175,165,172,0.5)", textDecoration: "none",
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              padding: "0.45rem 0.9rem", cursor: "none",
              transition: "color 0.3s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
            </svg>
            tiktok
          </motion.a>
 
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(180,160,190,0.3)" }} />
 
          {/* Instagram */}
          <motion.a
            href="https://www.instagram.com/teescribisinnombre"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ color: "rgba(210,195,220,0.9)" }}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(175,165,172,0.5)", textDecoration: "none",
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              padding: "0.45rem 0.9rem", cursor: "none",
              transition: "color 0.3s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            instagram
          </motion.a>
        </motion.div>
      </main>
 
      {/* Scroll hint line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        style={{
          position: "fixed", bottom: "2rem", left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 10,
        }}
      >
        <div className="scroll-line" />
      </motion.div>
    </>
  );
}
 
