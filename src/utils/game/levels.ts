import { ROWS, COLS } from './constants';

function createEmptyGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = 0;
    }
  }
  return grid;
}

function placeBase(grid: number[][]) {
  grid[24][12] = 5; grid[24][13] = 5;
  grid[25][12] = 5; grid[25][13] = 5;
  const bw = [[23,11],[23,12],[23,13],[23,14],[24,11],[24,14],[25,11],[25,14]];
  for (const [r,c] of bw) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] !== 5) {
      grid[r][c] = 1;
    }
  }
}

function setCell(grid: number[][], r: number, c: number, val: number) {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = val;
}

function setRowRange(grid: number[][], r: number, cStart: number, cEnd: number, val: number) {
  for (let c = cStart; c <= cEnd; c++) setCell(grid, r, c, val);
}

export interface LevelDef {
  map: number[][];
  theme: number;
  totalEnemies: number;
  enemyTypes?: number[];
}

export const LEVELS: LevelDef[] = [];

(function() {
  // Level 1 - Standard
  const g1 = createEmptyGrid(); placeBase(g1);
  setRowRange(g1, 2, 2, 5, 1); setRowRange(g1, 2, 8, 11, 1);
  setRowRange(g1, 2, 14, 17, 1); setRowRange(g1, 2, 20, 23, 1);
  setRowRange(g1, 4, 0, 3, 1); setCell(g1, 4, 5, 1); setCell(g1, 4, 6, 1);
  setCell(g1, 4, 19, 1); setCell(g1, 4, 20, 1); setRowRange(g1, 4, 22, 25, 1);
  setCell(g1, 6, 8, 2); setCell(g1, 6, 9, 2); setCell(g1, 6, 16, 2); setCell(g1, 6, 17, 2);
  setRowRange(g1, 8, 4, 7, 4); setRowRange(g1, 8, 18, 21, 4);
  setCell(g1, 10, 3, 1); setCell(g1, 10, 4, 1);
  setCell(g1, 10, 10, 1); setCell(g1, 10, 11, 1);
  setCell(g1, 10, 14, 1); setCell(g1, 10, 15, 1);
  setCell(g1, 10, 21, 1); setCell(g1, 10, 22, 1);
  setRowRange(g1, 12, 6, 9, 3); setRowRange(g1, 12, 16, 19, 3);
  setCell(g1, 14, 0, 1); setCell(g1, 14, 1, 1);
  setCell(g1, 14, 5, 1); setCell(g1, 14, 6, 1);
  setCell(g1, 14, 11, 2); setCell(g1, 14, 14, 2);
  setCell(g1, 14, 19, 1); setCell(g1, 14, 20, 1);
  setCell(g1, 14, 24, 1); setCell(g1, 14, 25, 1);
  setCell(g1, 16, 8, 4); setCell(g1, 16, 9, 4); setCell(g1, 16, 16, 4); setCell(g1, 16, 17, 4);
  setRowRange(g1, 18, 2, 5, 1); setRowRange(g1, 18, 20, 23, 1);
  setRowRange(g1, 20, 0, 3, 3); setRowRange(g1, 20, 10, 15, 3); setRowRange(g1, 20, 22, 25, 3);
  LEVELS.push({ map: g1, theme: 0, totalEnemies: 16, enemyTypes: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 0, 4, 3); setRowRange(g, 1, 21, 25, 3);
  setRowRange(g, 3, 6, 9, 2); setRowRange(g, 3, 16, 19, 2);
  setRowRange(g, 5, 2, 4, 1); setRowRange(g, 5, 21, 23, 1);
  setCell(g, 5, 11, 1); setCell(g, 5, 12, 1); setCell(g, 5, 13, 1); setCell(g, 5, 14, 1);
  setRowRange(g, 7, 0, 2, 4); setRowRange(g, 7, 23, 25, 4);
  setCell(g, 7, 8, 1); setCell(g, 7, 9, 1); setCell(g, 7, 16, 1); setCell(g, 7, 17, 1);
  setCell(g, 9, 4, 2); setCell(g, 9, 5, 2); setCell(g, 9, 20, 2); setCell(g, 9, 21, 2);
  setRowRange(g, 9, 10, 15, 1);
  setRowRange(g, 11, 6, 8, 3); setRowRange(g, 11, 17, 19, 3);
  setCell(g, 11, 11, 1); setCell(g, 11, 12, 1); setCell(g, 11, 13, 1); setCell(g, 11, 14, 1);
  setRowRange(g, 13, 0, 2, 1); setRowRange(g, 13, 23, 25, 1);
  setCell(g, 13, 8, 1); setCell(g, 13, 9, 1); setCell(g, 13, 16, 1); setCell(g, 13, 17, 1);
  setRowRange(g, 15, 4, 6, 2); setRowRange(g, 15, 19, 21, 2);
  setRowRange(g, 17, 2, 4, 4); setRowRange(g, 17, 21, 23, 4);
  setCell(g, 17, 10, 1); setCell(g, 17, 11, 1); setCell(g, 17, 14, 1); setCell(g, 17, 15, 1);
  setRowRange(g, 19, 0, 2, 3); setRowRange(g, 19, 23, 25, 3);
  setRowRange(g, 19, 6, 9, 1); setRowRange(g, 19, 16, 19, 1);
  setRowRange(g, 21, 4, 7, 3); setRowRange(g, 21, 18, 21, 3);
  LEVELS.push({ map: g, theme: 1, totalEnemies: 18, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 4, 7, 4); setRowRange(g, 1, 18, 21, 4);
  setRowRange(g, 3, 2, 4, 1); setRowRange(g, 3, 5, 7, 2);
  setRowRange(g, 3, 18, 20, 2); setRowRange(g, 3, 21, 23, 1);
  setRowRange(g, 5, 0, 2, 3); setRowRange(g, 5, 23, 25, 3);
  setCell(g, 5, 10, 1); setCell(g, 5, 11, 1); setCell(g, 5, 14, 1); setCell(g, 5, 15, 1);
  setRowRange(g, 7, 6, 9, 1); setRowRange(g, 7, 16, 19, 1);
  setCell(g, 7, 11, 2); setCell(g, 7, 14, 2);
  setRowRange(g, 9, 2, 5, 4); setRowRange(g, 9, 20, 23, 4);
  setCell(g, 9, 8, 1); setCell(g, 9, 9, 1); setCell(g, 9, 16, 1); setCell(g, 9, 17, 1);
  setRowRange(g, 11, 4, 7, 3); setRowRange(g, 11, 18, 21, 3);
  setCell(g, 11, 10, 2); setCell(g, 11, 15, 2);
  setRowRange(g, 13, 0, 2, 1); setRowRange(g, 13, 23, 25, 1);
  setCell(g, 13, 8, 1); setCell(g, 13, 9, 1); setCell(g, 13, 16, 1); setCell(g, 13, 17, 1);
  setRowRange(g, 15, 4, 7, 4); setRowRange(g, 15, 18, 21, 4);
  setRowRange(g, 17, 2, 4, 1); setRowRange(g, 17, 21, 23, 1);
  setCell(g, 17, 10, 1); setCell(g, 17, 15, 1);
  setRowRange(g, 19, 6, 9, 3); setRowRange(g, 19, 16, 19, 3);
  setRowRange(g, 21, 4, 7, 1); setRowRange(g, 21, 18, 21, 1);
  LEVELS.push({ map: g, theme: 2, totalEnemies: 20, enemyTypes: [0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 6, 9, 2); setRowRange(g, 1, 16, 19, 2);
  setRowRange(g, 3, 2, 5, 3); setRowRange(g, 3, 20, 23, 3);
  setCell(g, 3, 10, 4); setCell(g, 3, 11, 4); setCell(g, 3, 14, 4); setCell(g, 3, 15, 4);
  setRowRange(g, 5, 0, 2, 1); setRowRange(g, 5, 23, 25, 1);
  setCell(g, 5, 8, 1); setCell(g, 5, 9, 1); setCell(g, 5, 16, 1); setCell(g, 5, 17, 1);
  setRowRange(g, 7, 4, 6, 2); setRowRange(g, 7, 19, 21, 2);
  setRowRange(g, 9, 2, 4, 4); setRowRange(g, 9, 21, 23, 4);
  setCell(g, 9, 10, 1); setCell(g, 9, 15, 1);
  setRowRange(g, 11, 6, 9, 3); setRowRange(g, 11, 16, 19, 3);
  setCell(g, 11, 11, 2); setCell(g, 11, 14, 2);
  setRowRange(g, 13, 0, 3, 1); setRowRange(g, 13, 22, 25, 1);
  setCell(g, 13, 8, 1); setCell(g, 13, 17, 1);
  setCell(g, 13, 11, 1); setCell(g, 13, 14, 1);
  setRowRange(g, 15, 4, 6, 3); setRowRange(g, 15, 19, 21, 3);
  setCell(g, 15, 10, 2); setCell(g, 15, 15, 2);
  setRowRange(g, 17, 2, 4, 1); setRowRange(g, 17, 21, 23, 1);
  setRowRange(g, 19, 0, 3, 2); setRowRange(g, 19, 22, 25, 2);
  setRowRange(g, 19, 6, 9, 4); setRowRange(g, 19, 16, 19, 4);
  setCell(g, 21, 4, 1); setCell(g, 21, 21, 1);
  setRowRange(g, 21, 8, 11, 1); setRowRange(g, 21, 14, 17, 1);
  LEVELS.push({ map: g, theme: 3, totalEnemies: 18, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 4, 7, 1); setRowRange(g, 1, 18, 21, 1);
  setRowRange(g, 3, 0, 3, 3); setRowRange(g, 3, 22, 25, 3);
  setCell(g, 3, 10, 2); setCell(g, 3, 11, 2); setCell(g, 3, 14, 2); setCell(g, 3, 15, 2);
  setRowRange(g, 5, 6, 9, 4); setRowRange(g, 5, 16, 19, 4);
  setCell(g, 5, 11, 1); setCell(g, 5, 14, 1);
  setRowRange(g, 7, 2, 5, 1); setRowRange(g, 7, 20, 23, 1);
  setRowRange(g, 9, 0, 2, 3); setRowRange(g, 9, 23, 25, 3);
  setCell(g, 9, 8, 1); setCell(g, 9, 9, 1); setCell(g, 9, 16, 1); setCell(g, 9, 17, 1);
  setRowRange(g, 11, 4, 7, 2); setRowRange(g, 11, 18, 21, 2);
  setCell(g, 11, 10, 4); setCell(g, 11, 15, 4);
  setRowRange(g, 13, 6, 9, 1); setRowRange(g, 13, 16, 19, 1);
  setCell(g, 13, 11, 1); setCell(g, 13, 14, 1);
  setRowRange(g, 15, 2, 5, 3); setRowRange(g, 15, 20, 23, 3);
  setCell(g, 15, 8, 2); setCell(g, 15, 17, 2);
  setRowRange(g, 17, 0, 2, 4); setRowRange(g, 17, 23, 25, 4);
  setCell(g, 17, 10, 1); setCell(g, 17, 15, 1);
  setRowRange(g, 19, 4, 7, 1); setRowRange(g, 19, 18, 21, 1);
  setCell(g, 19, 11, 1); setCell(g, 19, 14, 1);
  LEVELS.push({ map: g, theme: 4, totalEnemies: 20, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 6, 9, 3); setRowRange(g, 1, 16, 19, 3);
  setRowRange(g, 3, 2, 5, 4); setRowRange(g, 3, 20, 23, 4);
  setRowRange(g, 5, 0, 3, 1); setRowRange(g, 5, 22, 25, 1);
  setCell(g, 5, 8, 2); setCell(g, 5, 9, 2); setCell(g, 5, 16, 2); setCell(g, 5, 17, 2);
  setRowRange(g, 7, 4, 7, 1); setRowRange(g, 7, 18, 21, 1);
  setCell(g, 7, 10, 4); setCell(g, 7, 15, 4);
  setRowRange(g, 9, 2, 4, 3); setRowRange(g, 9, 21, 23, 3);
  setCell(g, 9, 8, 1); setCell(g, 9, 17, 1);
  setRowRange(g, 11, 6, 9, 2); setRowRange(g, 11, 16, 19, 2);
  setRowRange(g, 13, 0, 3, 1); setRowRange(g, 13, 22, 25, 1);
  setCell(g, 13, 10, 1); setCell(g, 13, 11, 1); setCell(g, 13, 14, 1); setCell(g, 13, 15, 1);
  setRowRange(g, 15, 4, 6, 4); setRowRange(g, 15, 19, 21, 4);
  setCell(g, 15, 8, 2); setCell(g, 15, 17, 2);
  setRowRange(g, 17, 2, 4, 1); setRowRange(g, 17, 21, 23, 1);
  setRowRange(g, 19, 0, 3, 3); setRowRange(g, 19, 22, 25, 3);
  setCell(g, 19, 6, 1); setCell(g, 19, 7, 1); setCell(g, 19, 18, 1); setCell(g, 19, 19, 1);
  setRowRange(g, 21, 4, 7, 2); setRowRange(g, 21, 18, 21, 2);
  LEVELS.push({ map: g, theme: 5, totalEnemies: 22, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,2,2,0,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 2, 6, 2); setRowRange(g, 1, 19, 23, 2);
  setRowRange(g, 3, 0, 2, 4); setRowRange(g, 3, 23, 25, 4);
  setRowRange(g, 5, 4, 7, 1); setRowRange(g, 5, 18, 21, 1);
  setCell(g, 5, 10, 3); setCell(g, 5, 11, 3); setCell(g, 5, 14, 3); setCell(g, 5, 15, 3);
  setCell(g, 7, 8, 2); setCell(g, 7, 9, 2); setCell(g, 7, 16, 2); setCell(g, 7, 17, 2);
  setRowRange(g, 9, 2, 5, 3); setRowRange(g, 9, 20, 23, 3);
  setCell(g, 9, 10, 4); setCell(g, 9, 15, 4);
  setRowRange(g, 11, 6, 9, 1); setRowRange(g, 11, 16, 19, 1);
  setCell(g, 11, 11, 1); setCell(g, 11, 14, 1);
  setRowRange(g, 13, 0, 3, 2); setRowRange(g, 13, 22, 25, 2);
  setCell(g, 13, 8, 2); setCell(g, 13, 17, 2);
  setRowRange(g, 15, 4, 7, 4); setRowRange(g, 15, 18, 21, 4);
  setRowRange(g, 17, 2, 5, 1); setRowRange(g, 17, 20, 23, 1);
  setCell(g, 17, 10, 3); setCell(g, 17, 11, 3); setCell(g, 17, 14, 3); setCell(g, 17, 15, 3);
  setRowRange(g, 19, 0, 2, 2); setRowRange(g, 19, 23, 25, 2);
  setRowRange(g, 19, 6, 9, 1); setRowRange(g, 19, 16, 19, 1);
  setCell(g, 21, 4, 4); setCell(g, 21, 5, 4); setCell(g, 21, 20, 4); setCell(g, 21, 21, 4);
  LEVELS.push({ map: g, theme: 6, totalEnemies: 22, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 4, 8, 1); setRowRange(g, 1, 17, 21, 1);
  setRowRange(g, 3, 0, 3, 2); setRowRange(g, 3, 22, 25, 2);
  setRowRange(g, 5, 6, 9, 3); setRowRange(g, 5, 16, 19, 3);
  setCell(g, 5, 11, 2); setCell(g, 5, 14, 2);
  setRowRange(g, 7, 2, 5, 4); setRowRange(g, 7, 20, 23, 4);
  setCell(g, 7, 8, 1); setCell(g, 7, 9, 1); setCell(g, 7, 16, 1); setCell(g, 7, 17, 1);
  setRowRange(g, 9, 0, 2, 1); setRowRange(g, 9, 23, 25, 1);
  setCell(g, 9, 10, 3); setCell(g, 9, 15, 3);
  setRowRange(g, 11, 4, 7, 2); setRowRange(g, 11, 18, 21, 2);
  setRowRange(g, 13, 6, 9, 4); setRowRange(g, 13, 16, 19, 4);
  setCell(g, 13, 11, 1); setCell(g, 13, 14, 1);
  setRowRange(g, 15, 2, 5, 1); setRowRange(g, 15, 20, 23, 1);
  setCell(g, 15, 8, 3); setCell(g, 15, 17, 3);
  setRowRange(g, 17, 0, 3, 3); setRowRange(g, 17, 22, 25, 3);
  setRowRange(g, 17, 6, 9, 2); setRowRange(g, 17, 16, 19, 2);
  setRowRange(g, 19, 4, 7, 4); setRowRange(g, 19, 18, 21, 4);
  setCell(g, 21, 10, 1); setCell(g, 21, 11, 1); setCell(g, 21, 14, 1); setCell(g, 21, 15, 1);
  LEVELS.push({ map: g, theme: 7, totalEnemies: 24, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,0,0,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 6, 9, 4); setRowRange(g, 1, 16, 19, 4);
  setRowRange(g, 3, 2, 5, 2); setRowRange(g, 3, 20, 23, 2);
  setCell(g, 3, 10, 3); setCell(g, 3, 11, 3); setCell(g, 3, 14, 3); setCell(g, 3, 15, 3);
  setRowRange(g, 5, 0, 3, 1); setRowRange(g, 5, 22, 25, 1);
  setCell(g, 5, 8, 1); setCell(g, 5, 9, 1); setCell(g, 5, 16, 1); setCell(g, 5, 17, 1);
  setRowRange(g, 7, 4, 7, 3); setRowRange(g, 7, 18, 21, 3);
  setCell(g, 7, 10, 4); setCell(g, 7, 15, 4);
  setRowRange(g, 9, 2, 4, 2); setRowRange(g, 9, 21, 23, 2);
  setCell(g, 9, 8, 2); setCell(g, 9, 17, 2);
  setRowRange(g, 11, 6, 9, 1); setRowRange(g, 11, 16, 19, 1);
  setRowRange(g, 13, 0, 3, 3); setRowRange(g, 13, 22, 25, 3);
  setCell(g, 13, 10, 1); setCell(g, 13, 11, 1); setCell(g, 13, 14, 1); setCell(g, 13, 15, 1);
  setRowRange(g, 15, 4, 7, 4); setRowRange(g, 15, 18, 21, 4);
  setCell(g, 15, 8, 2); setCell(g, 15, 17, 2);
  setRowRange(g, 17, 2, 4, 1); setRowRange(g, 17, 21, 23, 1);
  setRowRange(g, 19, 0, 2, 2); setRowRange(g, 19, 23, 25, 2);
  setCell(g, 19, 10, 3); setCell(g, 19, 11, 3); setCell(g, 19, 14, 3); setCell(g, 19, 15, 3);
  setRowRange(g, 21, 4, 7, 1); setRowRange(g, 21, 18, 21, 1);
  LEVELS.push({ map: g, theme: 8, totalEnemies: 24, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,2,2,2,2,0,0,0] });
})();

(function() {
  const g = createEmptyGrid(); placeBase(g);
  setRowRange(g, 1, 0, 4, 2); setRowRange(g, 1, 21, 25, 2);
  setRowRange(g, 3, 6, 9, 4); setRowRange(g, 3, 16, 19, 4);
  setRowRange(g, 5, 2, 5, 1); setRowRange(g, 5, 20, 23, 1);
  setCell(g, 5, 10, 2); setCell(g, 5, 11, 2); setCell(g, 5, 14, 2); setCell(g, 5, 15, 2);
  setRowRange(g, 7, 0, 2, 3); setRowRange(g, 7, 23, 25, 3);
  setCell(g, 7, 8, 1); setCell(g, 7, 9, 1); setCell(g, 7, 16, 1); setCell(g, 7, 17, 1);
  setRowRange(g, 9, 4, 7, 2); setRowRange(g, 9, 18, 21, 2);
  setRowRange(g, 11, 6, 9, 3); setRowRange(g, 11, 16, 19, 3);
  setCell(g, 11, 10, 4); setCell(g, 11, 11, 4); setCell(g, 11, 14, 4); setCell(g, 11, 15, 4);
  setRowRange(g, 13, 2, 5, 1); setRowRange(g, 13, 20, 23, 1);
  setCell(g, 13, 8, 2); setCell(g, 13, 9, 2); setCell(g, 13, 16, 2); setCell(g, 13, 17, 2);
  setRowRange(g, 15, 0, 2, 4); setRowRange(g, 15, 23, 25, 4);
  setCell(g, 15, 10, 1); setCell(g, 15, 15, 1);
  setRowRange(g, 17, 4, 7, 2); setRowRange(g, 17, 18, 21, 2);
  setCell(g, 17, 11, 1); setCell(g, 17, 14, 1);
  setRowRange(g, 19, 6, 9, 3); setRowRange(g, 19, 16, 19, 3);
  setRowRange(g, 21, 2, 5, 1); setRowRange(g, 21, 20, 23, 1);
  setCell(g, 21, 10, 2); setCell(g, 21, 11, 2); setCell(g, 21, 14, 2); setCell(g, 21, 15, 2);
  LEVELS.push({ map: g, theme: 9, totalEnemies: 26, enemyTypes: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,2,0,0,0] });
})();

(function() {
  // Level 11 - 峡谷突围：两侧钢壁夹道 + 中央河流（两座桥）
  const g = createEmptyGrid(); placeBase(g);
  // 顶部砖块（保留敌人出生列 0/12/24）
  setRowRange(g, 0, 2, 5, 1); setRowRange(g, 0, 9, 11, 1);
  setRowRange(g, 0, 14, 16, 1); setRowRange(g, 0, 20, 23, 1);
  // 两侧钢壁（列 5-6 / 19-20，行 1-19），缺口在行 6-7 与 13-14
  for (let r = 1; r <= 19; r++) {
    if (r === 6 || r === 7 || r === 13 || r === 14) continue;
    setCell(g, r, 5, 2); setCell(g, r, 6, 2);
    setCell(g, r, 19, 2); setCell(g, r, 20, 2);
  }
  // 中央河流（列 12-13，行 3-19），桥梁在行 8-9 与 15-16
  for (let r = 3; r <= 19; r++) {
    if (r === 8 || r === 9 || r === 15 || r === 16) continue;
    setCell(g, r, 12, 4); setCell(g, r, 13, 4);
  }
  // 砖石台地
  setRowRange(g, 2, 0, 1, 1); setRowRange(g, 2, 24, 25, 1);
  setRowRange(g, 3, 3, 4, 1); setRowRange(g, 3, 21, 22, 1);
  setRowRange(g, 10, 0, 2, 1); setRowRange(g, 10, 23, 25, 1);
  setRowRange(g, 12, 0, 1, 1); setRowRange(g, 12, 24, 25, 1);
  setRowRange(g, 18, 0, 2, 1); setRowRange(g, 18, 23, 25, 1);
  setRowRange(g, 20, 3, 4, 1); setRowRange(g, 20, 21, 22, 1);
  setRowRange(g, 21, 0, 2, 1); setRowRange(g, 21, 23, 25, 1);
  // 灌木丛
  setRowRange(g, 2, 10, 15, 3);
  setRowRange(g, 11, 8, 9, 3); setRowRange(g, 11, 16, 17, 3);
  setRowRange(g, 17, 8, 9, 3); setRowRange(g, 17, 16, 17, 3);
  setRowRange(g, 20, 6, 7, 3); setRowRange(g, 20, 18, 19, 3);
  LEVELS.push({ map: g, theme: 10, totalEnemies: 20, enemyTypes: [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2] });
})();

(function() {
  // Level 12 - 钢铁都市：2x2 钢铁建筑群 + 砖墙街巷 + 中央公园
  const g = createEmptyGrid(); placeBase(g);
  // 顶部砖块（保留敌人出生列 0/12/24）
  setRowRange(g, 0, 3, 5, 1); setRowRange(g, 0, 9, 11, 1);
  setRowRange(g, 0, 14, 16, 1); setRowRange(g, 0, 20, 22, 1);
  // 2x2 钢铁建筑（上下两排）
  const buildings: [number, number][] = [[3,3],[3,9],[3,15],[3,21],[12,3],[12,9],[12,15],[12,21]];
  for (const [r0, c0] of buildings) {
    setCell(g, r0, c0, 2); setCell(g, r0, c0 + 1, 2);
    setCell(g, r0 + 1, c0, 2); setCell(g, r0 + 1, c0 + 1, 2);
  }
  // 边缘钢墙
  setRowRange(g, 7, 0, 1, 2); setRowRange(g, 7, 24, 25, 2);
  setRowRange(g, 18, 0, 1, 2); setRowRange(g, 18, 24, 25, 2);
  // 砖墙街巷
  setRowRange(g, 6, 6, 8, 1); setRowRange(g, 6, 17, 19, 1);
  setRowRange(g, 10, 0, 2, 1); setRowRange(g, 10, 23, 25, 1);
  setRowRange(g, 11, 6, 8, 1); setRowRange(g, 11, 17, 19, 1);
  setRowRange(g, 15, 6, 8, 1); setRowRange(g, 15, 17, 19, 1);
  setRowRange(g, 17, 0, 2, 1); setRowRange(g, 17, 23, 25, 1);
  setRowRange(g, 19, 3, 5, 1); setRowRange(g, 19, 20, 22, 1);
  setRowRange(g, 21, 0, 2, 1); setRowRange(g, 21, 23, 25, 1);
  // 公园绿荫
  setRowRange(g, 8, 11, 14, 3);
  setRowRange(g, 16, 11, 14, 3);
  setRowRange(g, 20, 8, 9, 3); setRowRange(g, 20, 16, 17, 3);
  LEVELS.push({ map: g, theme: 11, totalEnemies: 22, enemyTypes: [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2] });
})();

(function() {
  // Level 13 - 火山地带：熔岩池群 + 黑曜岩壁 + 基地护城熔岩
  const g = createEmptyGrid(); placeBase(g);
  // 熔岩池 2x2
  const lavaPools: [number, number][] = [[4,6],[4,18],[11,2],[11,22],[17,8],[17,16]];
  for (const [r0, c0] of lavaPools) {
    setCell(g, r0, c0, 4); setCell(g, r0, c0 + 1, 4);
    setCell(g, r0 + 1, c0, 4); setCell(g, r0 + 1, c0 + 1, 4);
  }
  // 基地两侧护城熔岩（保留中央 12-13 列通道）
  setCell(g, 21, 10, 4); setCell(g, 21, 11, 4); setCell(g, 22, 10, 4); setCell(g, 22, 11, 4);
  setCell(g, 21, 14, 4); setCell(g, 21, 15, 4); setCell(g, 22, 14, 4); setCell(g, 22, 15, 4);
  // 黑曜岩壁
  setRowRange(g, 2, 0, 3, 2); setRowRange(g, 2, 22, 25, 2);
  setRowRange(g, 9, 5, 7, 2); setRowRange(g, 9, 18, 20, 2);
  setRowRange(g, 15, 0, 2, 2); setRowRange(g, 15, 23, 25, 2);
  setRowRange(g, 20, 5, 6, 2); setRowRange(g, 20, 19, 20, 2);
  // 砖石废墟
  setRowRange(g, 1, 6, 8, 1); setRowRange(g, 1, 17, 19, 1);
  setRowRange(g, 3, 10, 11, 1); setRowRange(g, 3, 14, 15, 1);
  setRowRange(g, 7, 0, 2, 1); setRowRange(g, 7, 23, 25, 1);
  setRowRange(g, 13, 11, 14, 1);
  setRowRange(g, 19, 3, 4, 1); setRowRange(g, 19, 21, 22, 1);
  setRowRange(g, 21, 0, 3, 1); setRowRange(g, 21, 22, 25, 1);
  // 火山植被
  setRowRange(g, 6, 12, 13, 3);
  setRowRange(g, 10, 12, 13, 3);
  setRowRange(g, 16, 12, 13, 3);
  LEVELS.push({ map: g, theme: 12, totalEnemies: 24, enemyTypes: [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2] });
})();

export const THEMES = [
  { name: '标准', bg: '#1a1a1a', wallColor: '#8B4513', forestColor: '#228B22', waterColor: '#1E90FF', floorColor: '#2a2a2a', brickAlt: '#A0522D' },
  { name: '丛林', bg: '#0d1f0d', wallColor: '#5C4033', forestColor: '#006400', waterColor: '#006994', floorColor: '#1a2e1a', brickAlt: '#6B4423' },
  { name: '雪原', bg: '#d0d8e0', wallColor: '#6B5B4F', forestColor: '#8B8B8B', waterColor: '#4682B4', floorColor: '#c0c8d0', brickAlt: '#7A6B5F' },
  { name: '沙漠', bg: '#2a2010', wallColor: '#8B7355', forestColor: '#556B2F', waterColor: '#2E86C1', floorColor: '#3a3020', brickAlt: '#9B8365' },
  { name: '雪原', bg: '#b8c8d8', wallColor: '#7A6B5F', forestColor: '#9A9A9A', waterColor: '#5DADE2', floorColor: '#a8b8c8', brickAlt: '#8A7B6F' },
  { name: '丛林', bg: '#0a1f0a', wallColor: '#4A3525', forestColor: '#004d00', waterColor: '#005a7a', floorColor: '#152615', brickAlt: '#5A4535' },
  { name: '沙漠', bg: '#2e2414', wallColor: '#7A6345', forestColor: '#4A5B1F', waterColor: '#2471A3', floorColor: '#3e3424', brickAlt: '#8A7355' },
  { name: '标准', bg: '#1a1a1a', wallColor: '#8B4513', forestColor: '#228B22', waterColor: '#1E90FF', floorColor: '#2a2a2a', brickAlt: '#A0522D' },
  { name: '雪原', bg: '#c8d8e8', wallColor: '#6B5B4F', forestColor: '#7B7B7B', waterColor: '#3498DB', floorColor: '#b8c8d8', brickAlt: '#7B6B5F' },
  { name: '最终', bg: '#0a0a0a', wallColor: '#8B0000', forestColor: '#006400', waterColor: '#191970', floorColor: '#1a0a0a', brickAlt: '#A00000' },
  { name: '峡谷', bg: '#2b2118', wallColor: '#B87333', forestColor: '#6B8E23', waterColor: '#3A6EA5', floorColor: '#33281c', brickAlt: '#96551E' },
  { name: '都市', bg: '#141a22', wallColor: '#7A8A99', forestColor: '#2E8B57', waterColor: '#1C6EA4', floorColor: '#1c232d', brickAlt: '#5F6E7D' },
  { name: '火山', bg: '#190c0c', wallColor: '#8B3A1A', forestColor: '#4A5B23', waterColor: '#FF4500', floorColor: '#241212', brickAlt: '#A0451A' }
];

export interface MapOption {
  levelIdx: number;
  name: string;
  desc: string;
  tag: string;
}

/** 供“地图选择”界面使用的 3 张可选地图 */
export const MAP_OPTIONS: MapOption[] = [
  { levelIdx: 10, name: '峡谷突围', desc: '峡谷夹道 · 钢壁河流', tag: '峡谷' },
  { levelIdx: 11, name: '钢铁都市', desc: '都市街区 · 钢铁建筑', tag: '都市' },
  { levelIdx: 12, name: '火山地带', desc: '熔岩池群 · 黑曜岩壁', tag: '火山' }
];

export function getLevelTheme(levelIdx: number) {
  return THEMES[LEVELS[levelIdx]?.theme || 0];
}
