const fs = require('fs');
const path = require('path');

// 创建一个带有"S"字母的16x16紫色方块图标
function createTrayIcon() {
  const size = 16;
  
  // S字母的像素图案 (简化的5x7像素S字母)
  const sPattern = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ];
  
  // 计算S字母的起始位置（居中）
  const startX = Math.floor((size - 5) / 2);
  const startY = Math.floor((size - 7) / 2);
  
  // 创建SVG图标
  const svgIcon = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#8b5cf6"/>
  <text x="8" y="12" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>`;
  
  fs.writeFileSync('tray-icon.svg', svgIcon);
  
  // 生成ICO格式的像素数据
  const pixels = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sX = x - startX;
      const sY = y - startY;
      
      if (sX >= 0 && sX < 5 && sY >= 0 && sY < 7 && sPattern[sY][sX] === 1) {
        // S字母 - 白色 (BGRA格式)
        pixels.push(0xff, 0xff, 0xff, 0xff);
      } else {
        // 背景 - 紫色 #8b5cf6 (BGRA格式)
        pixels.push(0xf6, 0x5c, 0x8b, 0xff);
      }
    }
  }
  
  // 创建ICO文件头
  const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type: ICO
    0x01, 0x00, // Image count: 1
    // Image directory entry
    0x10,       // Width: 16
    0x10,       // Height: 16
    0x00,       // Color palette: 0
    0x00,       // Reserved
    0x01, 0x00, // Color planes: 1
    0x20, 0x00, // Bits per pixel: 32
    0x00, 0x04, 0x00, 0x00, // Image size: 1024 bytes
    0x16, 0x00, 0x00, 0x00  // Image offset: 22 bytes
  ]);
  
  // 创建BMP信息头
  const bmpHeader = Buffer.from([
    0x28, 0x00, 0x00, 0x00, // Header size: 40
    0x10, 0x00, 0x00, 0x00, // Width: 16
    0x20, 0x00, 0x00, 0x00, // Height: 32 (16*2 for ICO)
    0x01, 0x00,             // Planes: 1
    0x20, 0x00,             // Bits per pixel: 32
    0x00, 0x00, 0x00, 0x00, // Compression: none
    0x00, 0x04, 0x00, 0x00, // Image size: 1024
    0x00, 0x00, 0x00, 0x00, // X pixels per meter
    0x00, 0x00, 0x00, 0x00, // Y pixels per meter
    0x00, 0x00, 0x00, 0x00, // Colors used
    0x00, 0x00, 0x00, 0x00  // Important colors
  ]);
  
  // BMP数据需要从底部到顶部存储
  const bmpPixels = [];
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      bmpPixels.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }
  
  // AND mask (全透明)
  const andMask = Buffer.alloc(size * size / 8, 0x00);
  
  const icoData = Buffer.concat([
    icoHeader,
    bmpHeader,
    Buffer.from(bmpPixels),
    andMask
  ]);
  
  fs.writeFileSync('tray-icon.ico', icoData);
  console.log('托盘图标已创建（带S字母）');
}

createTrayIcon();