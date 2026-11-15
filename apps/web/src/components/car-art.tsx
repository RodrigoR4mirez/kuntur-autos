/**
 * Ilustración provisional de un sedán (no es una foto de un anuncio). Se reemplaza por la foto real
 * cuando exista la subida de fotos. Tonos grafito para encajar con el panel gris.
 */
export function CarArt() {
  return (
    <svg
      viewBox="0 0 640 260"
      role="img"
      aria-label="Ilustración de un sedán gris grafito"
      className="car-art"
    >
      <defs>
        <linearGradient id="ca-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a919c" />
          <stop offset=".42" stopColor="#4b515b" />
          <stop offset="1" stopColor="#1b1f26" />
        </linearGradient>
        <linearGradient id="ca-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8d1de" />
          <stop offset="1" stopColor="#5b6676" />
        </linearGradient>
        <linearGradient id="ca-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f3f6" />
          <stop offset="1" stopColor="#8f97a3" />
        </linearGradient>
        <radialGradient id="ca-shadow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".4" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="320" cy="232" rx="292" ry="18" fill="url(#ca-shadow)" />
      <path
        d="M30 180c0-18 12-28 40-32l78-8c28-34 70-58 130-58h92c44 3 78 24 104 52l60 10c40 8 74 20 74 44v22H30Z"
        fill="url(#ca-body)"
      />
      <path d="M212 134c24-28 56-42 96-42h46v42Z" fill="url(#ca-glass)" />
      <path d="M368 92h26c32 2 56 18 76 42H368Z" fill="url(#ca-glass)" />
      <path d="M362 92v42" stroke="#1b1f26" strokeWidth="5" />
      <path
        d="M70 150c150-16 330-18 538 6"
        stroke="#fff"
        strokeOpacity=".32"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M236 112c20-14 44-20 70-20"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M598 170c14 2 20 8 20 16h-26Z" fill="#fff6d6" />
      <rect x="28" y="162" width="18" height="10" rx="3" fill="#ff5a3c" />
      <path d="M26 198h590v6a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6Z" fill="#12151a" />
      {[154, 492].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="200" r="50" fill="#0e1116" />
          <circle cx={cx} cy="204" r="40" fill="#1a1e26" />
          <circle cx={cx} cy="204" r="29" fill="url(#ca-rim)" />
          <circle cx={cx} cy="204" r="10" fill="#4b515b" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x={cx - 2.5}
              y="178"
              width="5"
              height="18"
              rx="2.5"
              fill="#5a616c"
              transform={`rotate(${a} ${cx} 204)`}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
