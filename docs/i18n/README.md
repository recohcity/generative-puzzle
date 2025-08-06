# 多语言国际化系统

本项目支持多语言切换功能，目前支持简体中文（默认）和英文。

## 功能特性

- 🌍 支持简体中文和英文两种语言
- 🔄 动态语言切换，无需刷新页面
- 💾 语言设置自动保存到本地存储
- 🎯 智能浏览器语言检测
- 📱 响应式语言切换器组件
- 🔧 类型安全的翻译系统
- 📄 动态页面标题和元数据翻译
- 🏷️ HTML lang属性自动更新
- 🎉 随机完成祝贺消息
- 💬 画布内文本翻译支持

## 文件结构

```
src/i18n/
├── config.ts              # 语言配置和工具函数
├── index.ts               # 翻译系统核心功能
└── locales/
    ├── zh-CN.json         # 简体中文翻译
    └── en.json            # 英文翻译

contexts/
└── I18nContext.tsx        # React Context 和 Hook

components/
├── LanguageSwitcher.tsx   # 语言切换组件
└── DynamicTitle.tsx       # 动态页面标题组件
```

## 使用方法

### 1. 在组件中使用翻译

```tsx
import { useTranslation } from '@/contexts/I18nContext';

function MyComponent() {
  const { t, locale, changeLocale } = useTranslation();

  return (
    <div>
      <h1>{t('game.title')}</h1>
      <p>{t('game.hints.selectShape')}</p>
      
      {/* 带参数的翻译 */}
      <p>{t('game.hints.progress', { completed: 3, total: 8 })}</p>
      
      {/* 切换语言 */}
      <button onClick={() => changeLocale('en')}>
        Switch to English
      </button>
    </div>
  );
}
```

### 2. 添加语言切换器

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

function Header() {
  return (
    <div className="header">
      <h1>My App</h1>
      {/* 图标样式的语言切换器 */}
      <LanguageSwitcher variant="icon" size="default" />
      
      {/* 文本样式的语言切换器 */}
      <LanguageSwitcher variant="text" />
    </div>
  );
}
```

## 翻译键值结构

翻译文件使用嵌套的JSON结构：

```json
{
  "common": {
    "loading": "加载中...",
    "error": "错误"
  },
  "game": {
    "title": "生成式拼图游戏",
    "shapes": {
      "polygon": "多边形",
      "curve": "云朵形状"
    },
    "hints": {
      "progress": "{{completed}} / {{total}} 块拼图已完成"
    }
  }
}
```

## 添加新语言

### 1. 创建翻译文件

在 `src/i18n/locales/` 目录下创建新的语言文件，如 `fr.json`：

```json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur"
  },
  "game": {
    "title": "Jeu de Puzzle Génératif"
  }
}
```

### 2. 更新配置

在 `src/i18n/config.ts` 中添加新语言：

```typescript
export const SUPPORTED_LOCALES = {
  'zh-CN': '简体中文',
  'en': 'English',
  'fr': 'Français'  // 新增
} as const;
```

### 3. 更新类型定义

在 `src/i18n/index.ts` 中更新 `TranslationMessages` 接口，确保类型安全。

## 最佳实践

### 1. 翻译键命名规范

- 使用点分隔的层级结构：`game.shapes.polygon`
- 使用描述性的键名，避免使用数字或特殊字符
- 保持键名简洁但具有描述性

### 2. 参数插值

对于需要动态内容的翻译，使用双花括号语法：

```json
{
  "welcome": "欢迎 {{username}}！",
  "progress": "进度：{{current}}/{{total}}"
}
```

```tsx
// 使用时
t('welcome', { username: 'John' })
t('progress', { current: 5, total: 10 })
```

### 3. 条件翻译

对于复数形式或条件文本，可以在组件中处理：

```tsx
const getMessage = (count: number) => {
  if (count === 0) return t('game.noPieces');
  if (count === 1) return t('game.onePiece');
  return t('game.multiplePieces', { count });
};
```

### 4. 随机完成消息

游戏完成时会随机显示不同的祝贺消息：

```tsx
import { useTranslation } from '@/contexts/I18nContext';

function GameComponent() {
  const { getRandomCompletionMessage } = useTranslation();
  
  const handleGameComplete = () => {
    const message = getRandomCompletionMessage();
    // 中文: "你好犀利吖！", "太棒了！", "完美！" 等
    // 英文: "Awesome!", "Perfect!", "Amazing!" 等
    console.log(message);
  };
}
```

## 测试

### Playwright 测试

语言切换器已添加测试ID，可以在E2E测试中使用：

```typescript
// 测试语言切换
await page.getByTestId('language-switcher-button').click();
await page.getByTestId('language-option-en').click();

// 验证语言已切换
await expect(page.getByText('Generative Puzzle Game')).toBeVisible();
```

## 性能优化

- 翻译文件采用动态导入，减少初始包大小
- 语言设置缓存到 localStorage，避免重复检测
- 使用 React Context 避免不必要的重渲染

## 故障排除

### 1. 翻译不显示

检查翻译键是否正确：
```tsx
// 错误：键不存在
t('game.nonexistent.key') // 返回键名本身

// 正确：使用存在的键
t('game.title')
```

### 2. 参数插值不工作

确保参数名称匹配：
```json
// 翻译文件
{ "message": "Hello {{name}}" }
```

```tsx
// 使用时参数名必须匹配
t('message', { name: 'World' }) // ✅ 正确
t('message', { username: 'World' }) // ❌ 错误
```

### 3. 语言切换不生效

检查是否正确包装了 I18nProvider：
```tsx
// App.tsx 或根组件
<I18nProvider>
  <YourApp />
</I18nProvider>
```