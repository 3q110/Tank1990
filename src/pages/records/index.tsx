import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

const RecordsPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>🏆</Text>
      <Text className={styles.title}>战绩功能</Text>
      <Text className={styles.desc}>功能开发中，敬请期待...</Text>
    </View>
  );
};

export default RecordsPage;
