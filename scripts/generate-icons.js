const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Criar um SVG simples para o ícone
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3b82f6" rx="100"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="middle">R$</text>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="80" 
        fill="white" text-anchor="middle" dominant-baseline="middle">200</text>
</svg>
`;

async function generateIcons() {
  try {
    // Gerar ícone 192x192
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    // Gerar ícone 512x512
    await sharp(Buffer.from(svgIcon))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    console.log('Ícones gerados com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();

