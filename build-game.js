const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 小游戏构建脚本
console.log('🎮 开始构建微信小游戏...\n');

const distDir = path.join(__dirname, 'dist');

// 0. 清空 dist 目录内容（不删除目录本身，避免被开发者工具锁定）
console.log('🧹 清理旧的构建产物...');
if (fs.existsSync(distDir)) {
  const entries = fs.readdirSync(distDir);
  for (const entry of entries) {
    const fullPath = path.join(distDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.warn(`   ⚠️ 跳过 ${entry}: ${e.message}`);
    }
  }
  console.log(`   清理了 ${entries.length} 个文件/目录`);
} else {
  fs.mkdirSync(distDir, { recursive: true });
}
console.log('✅ 清理完成\n');

// 1. 使用 webpack 构建 game.js
try {
  console.log('📦 构建游戏代码...');
  execSync('npx webpack --config webpack.game.config.js', { stdio: 'inherit' });
  console.log('✅ 游戏代码构建完成\n');
} catch (e) {
  console.error('❌ 构建失败:', e.message);
  process.exit(1);
}

// 2. 验证 game.js 已生成
const gameJsPath = path.join(distDir, 'game.js');
if (!fs.existsSync(gameJsPath)) {
  console.error('❌ game.js 未生成');
  process.exit(1);
}

// 3. 写入配置文件
console.log('📋 写入配置文件...');

// game.json（小游戏配置）
const gameJson = {
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 5000,
    "connectSocket": 5000,
    "uploadFile": 5000,
    "downloadFile": 5000
  },
  "subpackages": []
};
fs.writeFileSync(path.join(distDir, 'game.json'), JSON.stringify(gameJson, null, 2));

// project.config.json（项目配置）
const projectConfig = {
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "compileHotReLoad": true,
    "postcss": false,
    "minified": false,
    "newFeature": true,
    "autoAudits": false,
    "coverView": true,
    "showShadowRootInWxmlPanel": false,
    "scopeDataCheck": false,
    "useCompilerModule": true
  },
  "compileType": "game",
  "libVersion": "3.3.4",
  "appid": "touristappid",
  "projectname": "tank_battle_city",
  "condition": {}
};
fs.writeFileSync(path.join(distDir, 'project.config.json'), JSON.stringify(projectConfig, null, 2));

console.log('✅ 配置文件写入完成\n');

// 4. 列出最终产物
console.log('📁 最终产物:');
const files = fs.readdirSync(distDir);
for (const f of files) {
  const stat = fs.statSync(path.join(distDir, f));
  const size = stat.isFile() ? `${(stat.size / 1024).toFixed(1)} KB` : '(dir)';
  console.log(`   ${f}  (${size})`);
}

console.log('\n🎉 微信小游戏构建完成！');
console.log('\n下一步:');
console.log('1. 在微信开发者工具中点击"编译"刷新');
console.log('2. 或重新导入项目，选择 ./dist 目录');
console.log('');
