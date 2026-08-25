import React from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import GameCanvas from '@/components/GameCanvas';
import styles from './index.module.scss';

type Difficulty = 'easy' | 'medium' | 'hard';

const GamePage: React.FC = () => {
  const params = Taro.getCurrentInstance()?.router?.params || {};
  const level = parseInt(String(params.level || '0'), 10);
  const doubleMode = params.doubleMode === 'true';
  const difficulty: Difficulty = (['easy', 'medium', 'hard'] as const).includes(params.difficulty as any)
    ? (params.difficulty as Difficulty)
    : 'medium';

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <GameCanvas level={level} doubleMode={doubleMode} difficulty={difficulty} onBack={handleBack} />
    </View>
  );
};

export default GamePage;
