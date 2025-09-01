# 游戏数据管理指南

## 🗑️ 清空localStorage数据

请在浏览器开发者工具的控制台中执行以下命令来清空所有游戏数据：

### 方法1：使用内置数据工具
```javascript
// 如果已经导入了数据工具
window.clearAllGameData();
```

### 方法2：直接清理localStorage
```javascript
// 清除排行榜数据
localStorage.removeItem('puzzle-leaderboard');

// 清除历史记录数据
localStorage.removeItem('puzzle-history');

// 验证清理结果
console.log('排行榜数据:', localStorage.getItem('puzzle-leaderboard'));
console.log('历史数据:', localStorage.getItem('puzzle-history'));
```

### 方法3：完全清空localStorage（谨慎使用）
```javascript
// 这会清空所有localStorage数据，包括其他网站的数据
localStorage.clear();
```

## 🧪 验证清理结果

清理完成后，刷新页面并检查：
1. 榜单界面应该显示"暂无个人最佳成绩数据"
2. 成绩详情界面的个人最佳成绩部分应该为空
3. 控制台不应该有任何个人最佳成绩数据

## 🎮 测试流程

1. **清空数据**：执行上述清理命令
2. **刷新页面**：确保数据已清空
3. **开始游戏**：选择难度并开始新游戏
4. **完成游戏**：手动完成拼图
5. **查看结果**：检查成绩是否正确保存到榜单

## 🔍 预期结果

首次完成游戏后应该看到：
- 成绩详情界面显示本局成绩
- Top5排行榜显示这条记录（排名第1）
- 点击榜单按钮能看到相同的记录
- 控制台显示保存成功的日志信息