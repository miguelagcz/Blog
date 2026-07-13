import { Track } from "@/data/music";

export default function MusicCard({ track }: { track: Track }) {
  return (
    <div className="music-card">
      <h3>{track.title}</h3>
      {track.comingSoon || !track.link ? (
        <span className="coming-soon">Próximamente</span>
      ) : (
        <a href={track.link} target="_blank" rel="noopener noreferrer">
          Escuchar
        </a>
      )}
    </div>
  );
}