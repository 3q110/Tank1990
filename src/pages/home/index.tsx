import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { sound } from '@/utils/game/sound';
import styles from './index.module.scss';

const THEMES = ['标准', '丛林', '雪原', '沙漠', '雪原', '丛林', '沙漠', '标准', '雪原', '最终'];
type Difficulty = 'easy' | 'medium' | 'hard';

const HomePage: React.FC = () => {
  const startGame = (level: number, doubleMode: boolean, difficulty: Difficulty) => {
    sound.init();
    sound.resume();
    Taro.navigateTo({
      url: `/pages/game/index?level=${level}&doubleMode=${doubleMode}&difficulty=${difficulty}`
    });
  };

  const pickDifficulty = (doubleMode: boolean) => {
    Taro.showActionSheet({
      itemList: ['简单 (5条命)', '普通 (3条命)', '困难 (2条命)'],
      success: (res) => {
        const diff = (['easy', 'medium', 'hard'] as Difficulty[])[res.tapIndex] || 'medium';
        startGame(0, doubleMode, diff);
      },
      fail: () => {}
    });
  };

  const showStageSelect = () => {
    Taro.showActionSheet({
      itemList: THEMES.map((t, i) => `STAGE ${i + 1} - ${t}`),
      success: (res) => {
        Taro.showActionSheet({
          itemList: ['简单 (5条命)', '普通 (3条命)', '困难 (2条命)'],
          success: (r2) => {
            const diff = (['easy', 'medium', 'hard'] as Difficulty[])[r2.tapIndex] || 'medium';
            startGame(res.tapIndex, false, diff);
          },
          fail: () => {}
        });
      },
      fail: () => {}
    });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.title}>坦克大战</Text>
      <Text className={styles.subtitle}>BATTLE CITY</Text>

      <Button
        className={styles.menuBtn}
        onClick={() => pickDifficulty(false)}
      >
        <Text className={styles.btnKey}>[1P]</Text>
        单人闯关
      </Button>

      <Button
        className={styles.menuBtn}
        onClick={() => pickDifficulty(true)}
      >
        <Text className={styles.btnKey}>[2P]</Text>
        双人合作
      </Button>

      <Button
        className={styles.menuBtn}
        onClick={showStageSelect}
      >
        <Text className={styles.btnKey}>[STAGE]</Text>
        SELECT STAGE
      </Button>

      <View className={styles.controlsInfo}>
        <Text>[摇杆] 移动 &nbsp; [FIRE] 射击 &nbsp; [双击摇杆] 暂停</Text>
        <Text>单人闯关：生命/洋枪跨关保留，从第1关打到最后一关</Text>
      </View>
    </View>
  );
};

export default HomePage;
