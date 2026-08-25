import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Canvas, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { GameEngine } from '@/utils/game/engine';
import { W, H, initResponsiveSize } from '@/utils/game/constants';
import { LEVELS } from '@/utils/game/levels';
import { sound } from '@/utils/game/sound';
import styles from './index.module.scss';

interface GameCanvasProps {
  level: number;
  doubleMode: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  onBack: () => void;
}

const J_RADIUS = 40;

const GameCanvasPage: React.FC<GameCanvasProps> = ({ level, doubleMode, difficulty = 'medium', onBack }) => {
  const engineRef = useRef<GameEngine | null>(null);
  const jTouchId = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const [knobStyle, setKnobStyle] = useState({ transform: 'translate(-50%, -50%)' });
  const [hud, setHud] = useState({ lives: 3, score: 0, enemies: 0, stage: 1 });
  const [finished, setFinished] = useState<null | 'over' | 'clear'>(null);

  useEffect(() => {
    // 初始化响应式尺寸
    const { width, height } = initResponsiveSize();

    const engine = new GameEngine();
    engineRef.current = engine;

    // 状态回调：过关 / 失败
    engine.onStateChange = (state, data) => {
      if (state === 2) {
        // 过关
        setHud(h => ({ ...h, score: data?.score || h.score }));
        if (engine.level >= LEVELS.length - 1) {
          setFinished('clear');
        } else {
          // 单人闯关：自动进入下一关（保留生命/洋枪）
          engine.nextLevel();
          setHud(h => ({ ...h, stage: engine.level + 1, lives: engine.lives }));
        }
      } else if (state === 3) {
        setFinished('over');
      }
    };

    const timer = setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#gameCanvas')
        .node((res: any) => {
          if (!res || !res.node) {
            console.error('[GameCanvas] Failed to get canvas node');
            return;
          }
          const canvas = res.node as HTMLCanvasElement;
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
          const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          engine.canvas = canvas;
          engine.ctx = ctx;
          // 单人闯关模式：从指定关卡开始，保留进度
          engine.startCampaign(doubleMode, difficulty, true);
          // 若从菜单指定了非 0 关卡，则跳到该关
          if (level > 0) {
            engine.initLevel(level, doubleMode);
          }
        })
        .exec();
    }, 200);

    // HUD 轮询（轻量，避免频繁 setState）
    const hudTimer = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      const remaining = Math.max(0, e.totalEnemies - e.enemiesSpawned + e.enemies.filter((en: any) => en.alive || en.spawning).length);
      setHud({ lives: Math.max(0, e.lives), score: e.score, enemies: remaining, stage: e.level + 1 });
    }, 200);

    sound.init();

    return () => {
      clearTimeout(timer);
      clearInterval(hudTimer);
      engineRef.current = null;
    };
  }, [level, doubleMode, difficulty]);

  const handleFireStart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.keys['j'] = true;
    sound.resume();
  }, []);

  const handleFireEnd = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.keys['j'] = false;
  }, []);

  const clearDir = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.keys['w'] = false;
    engine.keys['s'] = false;
    engine.keys['a'] = false;
    engine.keys['d'] = false;
  }, []);

  const setDirFromAngle = useCallback((angle: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    let dir = 'a';
    if (angle >= -45 && angle < 45) dir = 'd';
    else if (angle >= 45 && angle < 135) dir = 's';
    else if (angle >= -135 && angle < -45) dir = 'w';
    clearDir();
    engine.keys[dir] = true;
  }, [clearDir]);

  const resetKnob = useCallback(() => {
    setKnobStyle({ transform: 'translate(-50%, -50%)' });
  }, []);

  const handleJoystickTouchStart = useCallback((e: any) => {
    const engine = engineRef.current;
    if (!engine) return;

    const now = Date.now();
    if (now - lastTapTime.current < 350) {
      if (engine.state === 1) engine.state = 4;
      else if (engine.state === 4) engine.state = 1;
      sound.resume();
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    const touch = e.touches[0];
    jTouchId.current = touch.identifier;

    const rect = e.target.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= 10) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const clampedDist = Math.min(dist, J_RADIUS);
      const kx = (clampedDist / dist) * dx;
      const ky = (clampedDist / dist) * dy;
      setKnobStyle({ transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))` });
      setDirFromAngle(angle);
    }
    sound.resume();
  }, [setDirFromAngle]);

  const handleJoystickTouchMove = useCallback((e: any) => {
    const engine = engineRef.current;
    if (!engine) return;

    let touch: any = null;
    for (const t of e.touches) {
      if (t.identifier === jTouchId.current) { touch = t; break; }
    }
    if (!touch) return;

    const rect = e.target.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const clampedDist = Math.min(dist, J_RADIUS);
    const kx = (clampedDist / dist) * dx;
    const ky = (clampedDist / dist) * dy;
    setKnobStyle({ transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))` });

    if (dist < 10) {
      clearDir();
    } else {
      setDirFromAngle(angle);
    }
  }, [clearDir, setDirFromAngle]);

  const handleJoystickTouchEnd = useCallback((e: any) => {
    for (const t of e.changedTouches) {
      if (t.identifier === jTouchId.current) {
        jTouchId.current = null;
        resetKnob();
        clearDir();
        break;
      }
    }
  }, [clearDir, resetKnob]);

  return (
    <View className={styles.canvasWrapper}>
      <View className={styles.hud}>
        <View className={styles.hudItem}>
          <View className={styles.hudIconLives} />
          <Text className={styles.hudValue}>{hud.lives}</Text>
        </View>
        <View className={styles.hudItem}>
          <Text className={styles.hudLabel}>STAGE</Text>
          <Text className={styles.hudValue}>{hud.stage}</Text>
        </View>
        <View className={styles.hudItem}>
          <Text className={styles.hudLabel}>SCORE</Text>
          <Text className={styles.hudValue}>{hud.score}</Text>
        </View>
        <View className={styles.hudItem}>
          <View className={styles.hudIconEnemy} />
          <Text className={styles.hudValue}>{hud.enemies}</Text>
        </View>
      </View>
      <View className={styles.canvasContainer}>
        <Canvas
          type="2d"
          id="gameCanvas"
          className={styles.gameCanvas}
          style={`width: ${W}px; height: ${H}px; image-rendering: pixelated;`}
        />
        {finished && (
          <View className={styles.overlay} onClick={onBack}>
            <Text className={styles.overlayTitle}>
              {finished === 'clear' ? '恭喜通关全部关卡!' : 'GAME OVER'}
            </Text>
            <Text className={styles.overlayScore}>得分: {hud.score}</Text>
            <Text className={styles.overlayHint}>点击返回</Text>
          </View>
        )}
      </View>
      <View className={styles.controls}>
        <View
          className={styles.joystickZone}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
        >
          <View className={styles.joystickKnob} style={knobStyle} />
        </View>
        <Button
          className={styles.fireBtn}
          onTouchStart={handleFireStart}
          onTouchEnd={handleFireEnd}
          onTouchCancel={handleFireEnd}
        >
          FIRE
        </Button>
      </View>
    </View>
  );
};

export default GameCanvasPage;
