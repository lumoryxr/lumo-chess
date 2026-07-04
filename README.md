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

## 安卓 App（Capacitor）

本项目通过 [Capacitor](https://capacitorjs.com/) 打包为原生安卓 App（`appId: com.lumoryx.lumochess`）。

### 获取安装包

**云端构建（推荐，本机无需任何环境）**
- 每次 push 都会触发 GitHub Actions 工作流 **Build Android APK**，在 run 页面的 Artifacts 中下载 `lumochess-debug-apk`，传到手机安装（需允许「未知来源」）。

**本地构建**（需 Android Studio + JDK 21）
```bash
npm run android:open   # 构建 web + cap sync，并用 Android Studio 打开工程
# 或直接出包：
npm run cap:sync
cd android && ./gradlew assembleDebug   # 产物：app/build/outputs/apk/debug/app-debug.apk
```

### 应用图标 / 启动图

源图在 `assets/`，由 `scripts/gen-icons.mjs` 生成。修改后重新生成各密度资源：
```bash
node scripts/gen-icons.mjs
npx capacitor-assets generate --android
```

### 发布签名（上架 Google Play）

上架需要**签名的 release AAB**。推送 `v*` 版本 tag（或手动运行 **Build Android Release** 工作流）会自动构建签名的 AAB + APK 并附到 GitHub Release。

**一次性准备：生成 keystore 并配置仓库 secrets**
```bash
# 1) 生成 keystore（keytool 随 JDK 提供）——请妥善保管，丢失后无法再更新已上架应用
keytool -genkey -v -keystore release.jks -alias lumochess \
  -keyalg RSA -keysize 2048 -validity 10000

# 2) 把 keystore 与密码写入 GitHub secrets（gh CLI）
base64 -w0 release.jks | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEYSTORE_PASSWORD   # 输入 keystore 密码
gh secret set ANDROID_KEY_ALIAS           # 输入 lumochess
gh secret set ANDROID_KEY_PASSWORD        # 输入 key 密码
```
> keystore 与密码切勿提交进仓库（`.gitignore` 已忽略 `*.jks` / `*.keystore`）。

**发布一个版本**
```bash
git tag v1.0.0 && git push origin v1.0.0
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
