export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/records/index',
    'pages/game/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0a0a0a',
    navigationBarTitleText: '坦克大战',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0a0a'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#FFD700',
    backgroundColor: '#0a0a0a',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/records/index',
        text: '战绩'
      }
    ]
  }
})
