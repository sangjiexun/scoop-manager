const { createCanvas } = require('canvas');
const fs = require('fs');

// 创建紫色方块托盘图标
function createTrayIcon() {
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  
  // 设置紫色背景
  ctx.fillStyle = '#8b5cf6'; // 紫色
  ctx.fillRect(0, 0, 16, 16);
  
  // 添加边框
  ctx.strokeStyle = '#6d28d9'; // 深紫色边框
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 16, 16);
  
  // 保存为PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('tray-icon.png', buffer);
  console.log('托盘图标已创建: tray-icon.png');
}

// 如果直接运行此文件
if (require.main === module) {
  createTrayIcon();
}

module.exports = { createTrayIcon };