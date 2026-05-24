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
export const ENEMY_COLORS: Record<number, string> = { 0: '#888', 1: '#4fc3f7', 2: '#e74c3c' };

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
  
  // 确保最小 CELL 大小
  const finalCell = Math.max(8, Math.min(cell, 40));
  
  return {
    cell: finalCell,
    width: COLS * finalCell,
    height: ROWS * finalCell,
  };
}

/**
 * 初始化响应式尺寸
 */
export function initResponsiveSize(): { cell: number; width: number; height: number } {
  // 尝试获取屏幕尺寸
  let screenWidth: number;
  let screenHeight: number;
  
  try {
    // 在 Taro 环境中
    const systemInfo = typeof window !== 'undefined' 
      ? { screenWidth: window.innerWidth, screenHeight: window.innerHeight }
      : { screenWidth: 375, screenHeight: 667 };
    
    screenWidth = systemInfo.screenWidth;
    screenHeight = systemInfo.screenHeight;
  } catch {
    screenWidth = 375;
    screenHeight = 667;
  }
  
  const { cell, width, height } = calculateResponsiveSize(screenWidth, screenHeight);
  
  CELL = cell;
  W = width;
  H = height;
  
  return { cell, width, height };
}
