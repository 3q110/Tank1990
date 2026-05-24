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

function setColRange(grid: number[][], c: number, rStart: number, rEnd: number, val: number) {
  for (let r = rStart; r <= rEnd; r++) setCell(grid, r, c, val);
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
  { name: '最终', bg: '#0a0a0a', wallColor: '#8B0000', forestColor: '#006400', waterColor: '#191970', floorColor: '#1a0a0a', brickAlt: '#A00000' }
];

export function getLevelTheme(levelIdx: number) {
  return THEMES[LEVELS[levelIdx]?.theme || 0];
}
