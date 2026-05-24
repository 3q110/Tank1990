import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Canvas, Button, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { GameEngine } from '@/utils/game/engine';
import { W, H, initResponsiveSize } from '@/utils/game/constants';
import { sound } from '@/utils/game/sound';
import styles from './index.module.scss';

interface GameCanvasProps {
  level: number;
  doubleMode: boolean;
  onBack: () => void;
}

const J_RADIUS = 40;

const GameCanvasPage: React.FC<GameCanvasProps> = ({ level, doubleMode, onBack }) => {
  const engineRef = useRef<GameEngine | null>(null);
  const jTouchId = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const [knobStyle, setKnobStyle] = useState({ transform: 'translate(-50%, -50%)' });

  useEffect(() => {
    // 初始化响应式尺寸
    const { cell, width, height } = initResponsiveSize();
    console.log(`[GameCanvas] Responsive size: cell=${cell}, canvas=${width}x${height}`);

    const engine = new GameEngine();
    engineRef.current = engine;

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
          
          // 设置 Canvas 内部分辨率（考虑设备像素比）
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          
          engine.canvas = canvas;
          engine.ctx = ctx;
          engine.start(level, doubleMode);
        })
        .exec();
    }, 200);

    sound.init();

    return () => {
      clearTimeout(timer);
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, [level, doubleMode]);

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
      setKnobStyle({
        transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
      });
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
    setKnobStyle({
      transform: `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
    });

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
          <Text className={styles.hudValue}>3</Text>
        </View>
        <View className={styles.hudItem}>
          <Text className={styles.hudLabel}>STAGE</Text>
          <Text className={styles.hudValue}>{level + 1}</Text>
        </View>
        <View className={styles.hudItem}>
          <Text className={styles.hudLabel}>SCORE</Text>
          <Text className={styles.hudValue}>0</Text>
        </View>
        <View className={styles.hudItem}>
          <View className={styles.hudIconEnemy} />
          <Text className={styles.hudValue}>20</Text>
        </View>
      </View>
      <View className={styles.canvasContainer}>
        <Canvas
          type="2d"
          id="gameCanvas"
          className={styles.gameCanvas}
          style={`width: ${W}px; height: ${H}px; image-rendering: pixelated;`}
        />
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
