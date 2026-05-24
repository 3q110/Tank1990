import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { sound } from '@/utils/game/sound';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const startGame = (level: number, doubleMode: boolean) => {
    sound.init();
    sound.resume();
    Taro.navigateTo({
      url: `/pages/game/index?level=${level}&doubleMode=${doubleMode}`
    });
  };

  const showStageSelect = () => {
    const levels = Array.from({ length: 10 }, (_, i) => ({
      name: `STAGE ${i + 1}`,
      themeName: ['标准', '丛林', '雪原', '沙漠', '雪原', '丛林', '沙漠', '标准', '雪原', '最终'][i]
    }));

    Taro.showActionSheet({
      itemList: levels.map(l => `${l.name} - ${l.themeName}`),
      success: (res) => {
        startGame(res.tapIndex, false);
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
        onClick={() => startGame(0, false)}
      >
        <Text className={styles.btnKey}>[1P]</Text>
        1 PLAYER
      </Button>

      <Button
        className={styles.menuBtn}
        onClick={() => startGame(0, true)}
      >
        <Text className={styles.btnKey}>[2P]</Text>
        2 PLAYERS
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
      </View>
    </View>
  );
};

export default HomePage;
