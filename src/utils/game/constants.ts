export const COLS = 26;
export const ROWS = 26;
export const DEFAULT_CELL = 30;
export const DEFAULT_W = COLS * DEFAULT_CELL;
export const DEFAULT_H = ROWS * DEFAULT_CELL;

// 动态尺寸，会在游戏初始化时根据屏幕计算
export let CELL: number = DEFAULT_CELL;
export let W: number = DEFAULT_W;
export let H: number = DEFAULT_H;

export const DX: Record<number, number> = { 0: 0, 1: 1, 2: 0, 3: -1 };
export const DY: Record<number, number> = { 0: -1, 1: 0, 2: 1, 3: 0 };

export const ENEMY_SPEEDS: Record<number, number> = { 0: 1, 1: 2, 2: 1 };
export const ENEMY_HP: Record<number, number> = { 0: 1, 1: 1, 2: 4 };
export const ENEMY_COLORS: Record<number, number> = { 0: 1, 1: 2, 2: 3 };

/**
 * 根据屏幕尺寸计算适配后的 CELL 大小
 * @param availableWidth 可用宽度
 * @param availableHeight 可用高度
 * @param hudHeight 顶部 HUD 高度（默认 60px）
 * @param controlsHeight 底部控制区高度（默认 160px）
 * @param padding 上下内边距（默认 10px）
 */
export function calculateResponsiveSize(
  availableWidth: number,
  availableHeight: number,
  hudHeight: number = 60,
  controlsHeight: number = 160,
  padding: number = 10
): { cell: number; width: number; height: number } {
  // 计算游戏画布可用的最大尺寸
  const maxWidth = availableWidth - padding * 2;
  const maxHeight = availableHeight - hudHeight - controlsHeight - padding * 2;
  
  // 保持正方形，取较小值
  const size = Math.min(maxWidth, maxHeight);
  
  // 计算 CELL 大小（向下取整）
  const cell = Math.floor(size / COLS);
  
  // 确保最小 CELL 大小，同时适配小屏幕
  const finalCell = Math.max(10, Math.min(cell, 40));
  
  return {
    cell: finalCell,
    width: COLS * finalCell,
    height: ROWS * finalCell,
  };
}

/**
 * 获取屏幕尺寸（兼容 H5 和微信小游戏环境）
 */
function getScreenSize(): { width: number; height: number } {
  // 检测微信小游戏环境
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    try {
      const sysInfo = wx.getSystemInfoSync();
      return {
        width: sysInfo.windowWidth || sysInfo.screenWidth,
        height: sysInfo.windowHeight || sysInfo.screenHeight,
      };
    } catch (e) {
      console.warn('[constants] Failed to get system info from wx:', e);
    }
  }
  
  // H5 环境
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  
  // 默认尺寸
  return { width: 375, height: 667 };
}

/**
 * 初始化响应式尺寸
 */
export function initResponsiveSize(): { cell: number; width: number; height: number } {
  const { width: screenWidth, height: screenHeight } = getScreenSize();
  
  console.log(`[constants] Screen size: ${screenWidth}x${screenHeight}`);
  
  const { cell, width, height } = calculateResponsiveSize(screenWidth, screenHeight);
  
  CELL = cell;
  W = width;
  H = height;
  
  console.log(`[constants] Game size: cell=${cell}, canvas=${width}x${height}`);
  
  return { cell, width, height };
}

/**
 * 获取 Canvas 实际显示尺寸（用于缩放）
 */
export function getCanvasDisplaySize(): { width: number; height: number; scale: number } {
  const { width: screenWidth, height: screenHeight } = getScreenSize();
  
  // 计算游戏区域可用空间
  const hudHeight = 50;
  const controlsHeight = 140;
  const padding = 8;
  
  const availableWidth = screenWidth - padding * 2;
  const availableHeight = screenHeight - hudHeight - controlsHeight - padding * 2;
  
  // 计算缩放比例
  const scaleX = availableWidth / W;
  const scaleY = availableHeight / H;
  const scale = Math.min(scaleX, scaleY, 1); // 最大不放大，只缩小
  
  return {
    width: W * scale,
    height: H * scale,
    scale,
  };
}
