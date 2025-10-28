import L from 'leaflet';

export default function CarIcon({
  heading = 0,
  size = 32,
  color = '#ff1100ff',
  accent,
  stroke = '#1f2937',
  wheel = '#111827',
  label,
  labelBg = '#ffffff',
  className = '',
} = {}) {
  const s = Math.max(24, Math.min(size, 64)); // clamp for sanity
  const anchor = Math.round(s / 2);
  const accentColor = accent ?? shade(color, -18); // slightly darker variant

  // Keep rotation & rendering crisp. We rotate the wrapper DIV, not the SVG internals.
  const rotationStyle =
    `transform: rotate(${heading}deg) translateZ(0); transform-origin: center; will-change: transform;`;

  // Inlined SVG with a soft drop shadow and a direction arrow cue
  const html = `
    <div class="car-wrapper" style="position:relative; width:${s}px; height:${s}px; ${rotationStyle}">
      ${label ? pill(label, labelBg) : ''}
      <svg
        width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        aria-label="vehicle marker" role="img"
        style="display:block; pointer-events:none; shape-rendering:geometricPrecision">
        <defs>
          <filter id="carShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-opacity="0.25"/>
          </filter>
          <linearGradient id="carGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lighten(color, 12)}"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
        </defs>

        <!-- Faint forward arrow indicating heading -->
        <path d="M12 2 l0 4" stroke="${accentColor}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>

        <!-- Car body -->
        <g filter="url(#carShadow)">
          <!-- roof + bonnet -->
          <path d="M6 10 L8.3 5.5 H15.7 L18 10 Z" fill="${accentColor}" stroke="${stroke}" stroke-width="0.6"/>
          <!-- cabin/body -->
          <rect x="3" y="10" width="18" height="7.4" rx="2.2"
                fill="url(#carGrad)" stroke="${stroke}" stroke-width="0.6"/>
          <!-- windshield -->
          <rect x="7" y="10.3" width="10" height="3.2" rx="0.8" fill="${lighten(accentColor, 22)}" opacity="0.9"/>
          <!-- side detail -->
          <path d="M5 13 H19" stroke="${shade(color, -28)}" stroke-width="0.7" opacity="0.65"/>

          <!-- wheels -->
          <circle cx="7"  cy="18.3" r="2.1" fill="${wheel}" stroke="${darken(wheel, 15)}" stroke-width="0.4"/>
          <circle cx="17" cy="18.3" r="2.1" fill="${wheel}" stroke="${darken(wheel, 15)}" stroke-width="0.4"/>
          <circle cx="7"  cy="18.3" r="0.9" fill="#e5e7eb" opacity="0.85"/>
          <circle cx="17" cy="18.3" r="0.9" fill="#e5e7eb" opacity="0.85"/>
        </g>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: `car-marker ${className}`.trim(),
    html,
    iconSize: [s, s],
    iconAnchor: [anchor, anchor], // center anchor—nice for rotation
  });
}

/* ---------- helpers ---------- */

/** simple shade: negative amt darkens, positive lightens (in HSL-ish space) */
function shade(hex, amt = -15) {
  try {
    const { h, s, l } = hexToHsl(hex);
    const nl = clamp(l + amt, 0, 100);
    return hslToHex(h, s, nl);
  } catch { return hex; }
}
function lighten(hex, amt = 12) { return shade(hex, Math.abs(amt)); }
function darken(hex, amt = 12) { return shade(hex, -Math.abs(amt)); }

function pill(text, bg) {
  const safe = String(text).slice(0, 6);
  return `
    <div style="
      position:absolute; top:-6px; right:-6px;
      background:${bg};
      color:#111827; border:1px solid rgba(0,0,0,.08);
      font: 600 10px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
      padding:2px 6px; border-radius:999px; white-space:nowrap; pointer-events:none;
      box-shadow:0 2px 8px rgba(0,0,0,.08);
    ">${safe}</div>`;
}

/* tiny color utilities */
function clamp(n, min, max){ return Math.min(max, Math.max(min, n)); }

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  let h, s, l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r=0, g=0, b=0;

  if (0 <= h && h < 60)      { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120){ r = x; g = c; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
  else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
  else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
  else if (300 <= h && h < 360){ r = c; g = 0; b = x; }

  const toHex = v => {
    const n = Math.round((v + m) * 255);
    return n.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  let h = hex.trim().replace('#','');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
