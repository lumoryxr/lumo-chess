import sharp from 'sharp';

const FONT = "'Noto Serif SC','Noto Sans SC','Microsoft YaHei','SimHei','SimSun',serif";

// A xiangqi red piece disc centered at (cx,cy) with outer radius R
function disc(cx, cy, R, fontScale = 1.12) {
  const shadow = R * 0.06;
  return `
    <circle cx="${cx}" cy="${cy + shadow}" r="${R}" fill="#000" opacity="0.35"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#e74c3c"/>
    <circle cx="${cx}" cy="${cy}" r="${R - R * 0.06}" fill="#c0392b"/>
    <circle cx="${cx}" cy="${cy}" r="${R - R * 0.14}" fill="none" stroke="#f5a39a" stroke-width="${R * 0.022}" opacity="0.65"/>
    <text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="${R * fontScale}" fill="#fff5e0">象</text>`;
}

const iconOnly = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><radialGradient id="bg" cx="50%" cy="42%" r="72%">
    <stop offset="0%" stop-color="#241f17"/><stop offset="100%" stop-color="#0d0d0d"/>
  </radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${disc(512, 512, 322)}
</svg>`;

const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${disc(512, 512, 300)}
</svg>`;

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><radialGradient id="bg" cx="50%" cy="42%" r="75%">
    <stop offset="0%" stop-color="#241f17"/><stop offset="100%" stop-color="#0d0d0d"/>
  </radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;

const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#0d0d0d"/>
  ${disc(1366, 1230, 300)}
  <text x="1366" y="1660" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="150" fill="#f0f0f0">象棋残局</text>
</svg>`;

async function render(svg, out, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(out);
  console.log('wrote', out);
}

await render(iconOnly, 'assets/icon-only.png', 1024, 1024);
await render(foreground, 'assets/icon-foreground.png', 1024, 1024);
await render(background, 'assets/icon-background.png', 1024, 1024);
await render(splash, 'assets/splash.png', 2732, 2732);
await render(splash, 'assets/splash-dark.png', 2732, 2732);
