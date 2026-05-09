/**
 * Amenires World Bank - Identity & Branding
 * High-definition SVG Logo and Visual Assets
 */

const fs = require('fs');
const path = require('path');

const generateLogo = () => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.svg');

  const svgLogo = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FDB931;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Outer Shield -->
  <path d="M100 10 L170 40 V100 C170 145 135 180 100 190 C65 180 30 145 30 100 V40 L100 10Z"
        fill="url(#goldGrad)" filter="url(#shadow)"/>

  <!-- Temple Structure -->
  <path d="M60 140 H140 V130 H60 V140Z" fill="#1a1a2e"/>
  <rect x="65" y="90" width="10" height="40" fill="#1a1a2e"/>
  <rect x="85" y="90" width="10" height="40" fill="#1a1a2e"/>
  <rect x="105" y="90" width="10" height="40" fill="#1a1a2e"/>
  <rect x="125" y="90" width="10" height="40" fill="#1a1a2e"/>
  <path d="M60 90 L100 60 L140 90 H60Z" fill="#1a1a2e"/>

  <!-- Globe Grid -->
  <circle cx="100" cy="45" r="8" fill="#1a1a2e"/>
  <path d="M92 45 Q100 35 108 45 Q100 55 92 45" fill="none" stroke="#FFD700" stroke-width="0.5"/>
</svg>
  `;

  fs.writeFileSync(logoPath, svgLogo.trim());
  console.log('✓ Amenires World Bank Logo generated successfully');
};

if (require.main === module) {
  generateLogo();
}

module.exports = generateLogo;
