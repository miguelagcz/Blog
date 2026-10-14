import fs from "fs";

const files = fs
  .readdirSync("public/music/mp3")
  .filter((f) => f.toLowerCase().endsWith(".mp3"))
  .sort();

const titulo = (f) => f.replace(/\.mp3$/i, "").replace(/[-_]+/g, " ").trim();

const items = files
  .map(
    (f, i) => `  {
    id: "m${i + 1}",
    title: ${JSON.stringify(titulo(f))},
    artist: "teescribisinnombre",
    src: ${JSON.stringify("/music/" + encodeURIComponent(f))},
  },`
  )
  .join("\n");

const out = `// data/music.ts  (generado con generar-musica.mjs)
export type Track = {
  id: string;
  title: string;
  artist?: string;
  src?: string;
  cover?: string;
  link?: string;
  comingSoon?: boolean;
};

export const tracks: Track[] = [
${items}
];
`;

fs.writeFileSync("data/music.ts", out);
console.log(`Listo: ${files.length} canciones registradas.`);