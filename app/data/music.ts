// data/music.ts
//
// CÓMO AGREGAR UNA CANCIÓN:
//   1. Copia tu .mp3 a la carpeta  public/music/
//      (usa nombres sin espacios ni acentos: "mi-cancion.mp3")
//   2. Agrega un objeto a la lista de abajo con  src: "/music/mi-cancion.mp3"
//
// Las pistas SIN `src` se muestran como "próximamente" en la lista.

export type Track = {
  id: string;
  title: string;
  artist?: string;      // opcional, se muestra debajo del título
  src?: string;         // ruta al mp3, ej: "/music/mi-cancion.mp3"
  cover?: string;       // opcional, ej: "/music/portadas/mi-cancion.jpg"
  link?: string;        // (opcional) link externo a Spotify/YouTube
  comingSoon?: boolean; // true = mostrar "Próximamente"
};

export const tracks: Track[] = [
  // ── Ejemplo (descomenta y cambia el nombre del archivo) ──────────
  // {
  //   id: "m1",
  //   title: "Nombre de la canción",
  //   artist: "teescribisinnombre",
  //   src: "/music/nombre-de-la-cancion.mp3",
  // },

  { id: "m1",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m2",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m3",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m4",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m5",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m6",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m7",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m8",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m9",  title: "PROXIMAMENTE", comingSoon: true },
  { id: "m10", title: "PROXIMAMENTE", comingSoon: true },
];
