import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { LEVELS, THEMES, MAP_OPTIONS } from '@/utils/game/levels';
import { sound } from '@/utils/game/sound';
import styles from './index.module.scss';

type Difficulty = 'easy' | 'medium' | 'hard';

// 将 26x26 地图按 2 倍下采样为 13x13 预览格，按主题着色
function buildPreview(levelIdx: number): { color: string }[] {
  const def = LEVELS[levelIdx];
  const theme = THEMES[def.theme];
  const cells: { color: string }[] = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const tile = (def.map[r * 2] && def.map[r * 2][c * 2]) || 0;
      let color = theme.floorColor;
      if (tile === 1 || tile === 6) color = theme.wallColor;
      else if (tile === 2) color = '#9a9a9a';
      else if (tile === 3) color = theme.forestColor;
      else if (tile === 4) color = theme.waterColor;
      else if (tile === 5) color = '#FFD700';
      cells.push({ color });
    }
  }
  return cells;
}

const MapSelectPage: React.FC = () => {
  const previews = useMemo(
    () =>
      MAP_OPTIONS.map((opt) => ({
        ...opt,
        cells: buildPreview(opt.levelIdx)
      })),
    []
  );

  const startWith = (levelIdx: number) => {
    Taro.showActionSheet({
      itemList: ['单人模式', '双人合作'],
      success: (res) => {
        const doubleMode = res.tapIndex === 1;
        Taro.showActionSheet({
          itemList: ['简单 (5条命)', '普通 (3条命)', '困难 (2条命)'],
          success: (r2) => {
            const diff = (['easy', 'medium', 'hard'] as Difficulty[])[r2.tapIndex] || 'medium';
            sound.init();
            sound.resume();
            Taro.navigateTo({
              url: `/pages/game/index?level=${levelIdx}&doubleMode=${doubleMode}&difficulty=${diff}`
            });
          },
          fail: () => {}
        });
      },
      fail: () => {}
    });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>选择地图</Text>
      <Text className={styles.subtitle}>SELECT MAP · 自由选择 3 张地图</Text>

      <View className={styles.cards}>
        {previews.map((m) => (
          <View key={m.levelIdx} className={styles.card} onClick={() => startWith(m.levelIdx)}>
            <View className={styles.preview}>
              {m.cells.map((cell, i) => (
                <View key={i} className={styles.cell} style={{ background: cell.color }} />
              ))}
            </View>
            <View className={styles.info}>
              <Text className={styles.mapName}>{m.name}</Text>
              <Text className={styles.mapDesc}>{m.desc}</Text>
              <Text className={styles.mapTag}>{m.tag} · 第 {m.levelIdx + 1} 关</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.back} onClick={() => Taro.navigateBack()}>
        <Text>返回</Text>
      </View>
    </View>
  );
};

export default MapSelectPage;
