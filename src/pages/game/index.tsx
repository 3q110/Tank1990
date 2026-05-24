import React from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import GameCanvas from '@/components/GameCanvas';
import styles from './index.module.scss';

const GamePage: React.FC = () => {
  const params = Taro.getCurrentInstance()?.router?.params || {};
  const level = parseInt(String(params.level || '0'), 10);
  const doubleMode = params.doubleMode === 'true';

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <GameCanvas level={level} doubleMode={doubleMode} onBack={handleBack} />
    </View>
  );
};

export default GamePage;
