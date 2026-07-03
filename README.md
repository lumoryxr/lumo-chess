# LumoChess — 象棋残局

轻量化中国象棋残局游戏，专注残局战术训练。

## 特性

- **15+ 经典残局**：从入门到大师，覆盖马后炮、双车错、卧槽马等经典杀法
- **AI 对手**：内置 Negamax + Alpha-Beta 剪枝引擎，自动应对黑方走棋
- **提示系统**：卡壳时请求最优步提示
- **悔棋 & 重置**：支持撤销走棋，随时重开
- **现代 UI**：深色主题 + 暖金棋盘，framer-motion 流畅动画

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 |
| 动画 | Framer Motion |
| 状态 | Zustand |
| 引擎 | 自实现 Negamax α-β（纯 TS） |

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 工程结构

```
src/
  types/      # 类型定义
  data/       # 残局库数据
  engine/     # 象棋规则引擎 + AI
  store/      # Zustand 全局状态
  components/ # UI 组件（棋盘、棋子、面板）
  pages/      # 页面视图
```

## 残局分类

- **炮马类**：马后炮、卧槽马、挂角马
- **车类**：双车错、海底捞月、单车胜士象全
- **车炮类**：铁门栓、空心炮、炮打双士
- **炮类**：重炮绝杀
- **车马类**：车马胜单将、三子归边
- **兵类**：过河兵胜象
