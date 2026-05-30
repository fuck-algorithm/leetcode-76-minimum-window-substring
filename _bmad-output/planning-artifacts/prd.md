---
stepsCompleted: ['step-01-init']
inputDocuments: ['README.md', 'FEATURES.md', 'src/algorithm/minWindowSteps.ts']
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 2
workflowType: 'prd'
---

# Product Requirements Document - leetcode-76-minimum-window-substring

**Author:** leetcode-76-minimum-window-substring
**Date:** 2026-02-21

---

# 1. 项目概述

## 1.1 项目背景

LeetCode 第76题「最小覆盖子串」是一个经典的滑动窗口算法问题。当前的算法可视化工具已经具备了基本的演示功能，但经调研发现，**分镜步骤的粒度太粗**，导致学习者在一帧内需要同时理解过多的信息变化，认知负荷过高。

## 1.2 项目目标

通过优化算法演示的分镜设计，将粗粒度的步骤拆分为更细的阶段，使学习者能够：
- 更容易跟随算法的逻辑流程
- 清晰理解每个决策点的原因
- 减少认知负荷，提高学习效率

## 1.3 核心问题定义

**问题陈述：** 当前算法演示将"右指针移动+字符加入+有效性判断"合并为一步，将"左指针移动+字符移除+有效性判断"合并为一步，信息过载。

**成功标准：**
- 每个步骤只展示一个核心概念变化
- 关键决策点（如窗口满足条件）有专门的视觉强调
- 学习者能够无需暂停就能理解每一步的含义

---

# 2. 用户故事

## 2.1 目标用户

- **初级算法学习者**：刚开始学习滑动窗口算法，需要理解每一步的细节
- **面试准备者**：复习算法，需要快速回顾算法逻辑
- **算法可视化爱好者**：对算法动画演示质量有要求的用户

## 2.2 用户故事

### US-001: 作为算法学习者，我希望步骤拆分得更细，以便我能跟上算法的每一步
**验收标准：**
- 每个动画步骤只展示一个核心变化（指针移动、字符加入/移除、有效性判断）
- 每个步骤有清晰的文字说明

### US-002: 作为算法学习者，我希望关键决策点有视觉强调，以便我理解算法为什么这样做
**验收标准：**
- "窗口满足条件"这个里程碑有专门的动画效果
- "找到更短子串"时有醒目的视觉反馈
- 收缩/扩张的决策原因清晰展示

### US-003: 作为算法学习者，我希望能够控制播放速度，以便我能按自己的节奏学习
**验收标准：**
- 可调节播放速度（0.5x - 3.0x）
- 支持单步前进/后退
- 重要步骤自动减速，次要步骤可以快速播放

---

# 3. 功能需求

## 3.1 核心功能需求

### FR-001: 细粒度步骤类型
**优先级：** P0（最高）
**描述：** 将现有的5种步骤类型扩展为更细粒度的8+种步骤类型

| 新步骤类型 | 触发时机 | 说明 |
|-----------|---------|------|
| `init` | 初始化 | 展示算法初始状态 |
| `expand-start` | 准备扩张 | 展示"即将移动右指针"的意图 |
| `expand-add` | 字符加入 | 展示字符加入窗口的过程 |
| `expand-check` | 扩张检查 | 展示是否满足需求的判断 |
| `window-satisfied` | 窗口满足 | 新增：专门展示"所有需求已满足"的里程碑 |
| `found` | 找到解 | 找到更短的覆盖子串 |
| `shrink-start` | 准备收缩 | 展示"开始收缩窗口"的决策 |
| `shrink-remove` | 字符移除 | 展示字符移出窗口的过程 |
| `shrink-check` | 收缩检查 | 展示是否还满足需求的判断 |
| `complete` | 算法结束 | 展示最终结果 |

### FR-002: 步骤状态机设计
**优先级：** P0
**描述：** 清晰定义步骤之间的流转关系

```
init
  ↓
expand-start → expand-add → expand-check
                              ↓
                    ┌─不满足─→ 继续 expand-start
                    ↓
              window-satisfied
                    ↓
            found（如果更短）
                    ↓
            shrink-start → shrink-remove → shrink-check
                                              ↓
                                    ├─仍满足─→ 继续 shrink-start
                                    ↓
                              └─不满足─→ expand-start
                                        ↓
                                    right >= s.length ? complete : expand-start
```

### FR-003: 动画节奏控制
**优先级：** P1
**描述：** 不同步骤类型有不同的动画时长

| 步骤类型 | 建议时长 | 说明 |
|---------|---------|------|
| `init` | 1.0s | 正常速度展示初始状态 |
| `expand-start` | 0.3s | 快速展示意图 |
| `expand-add` | 0.8s | 中等速度展示字符加入 |
| `expand-check` | 0.5s | 快速展示判断结果 |
| `window-satisfied` | 1.5s | **慢速强调**里程碑 |
| `found` | 2.0s | **最慢强调**找到更短解 |
| `shrink-start` | 0.3s | 快速展示意图 |
| `shrink-remove` | 0.8s | 中等速度展示字符移除 |
| `shrink-check` | 0.5s | 快速展示判断结果 |
| `complete` | 2.0s | 慢速展示最终结果 |

### FR-004: 视觉层次设计
**优先级：** P1
**描述：** 不同步骤类型有不同的视觉强调效果

| 步骤类型 | 背景效果 | 字符强调 | 指针动画 |
|---------|---------|---------|---------|
| `init` | 标准背景 | 无 | 无 |
| `expand-start` | 轻微高亮 | 目标字符闪烁 | 右指针脉动 |
| `expand-add` | 窗口区域高亮 | 新字符淡入 | 右指针移动 |
| `expand-check` | 判断区域高亮 | 满足的字符绿闪 | 无 |
| `window-satisfied` | **全局金色背景** | 所有满足字符发光 | 双指针发光 |
| `found` | **全局绿色背景+脉冲** | 最小子串闪烁 | 无 |
| `shrink-start` | 轻微高亮 | 待移除字符闪烁 | 左指针脉动 |
| `shrink-remove` | 窗口区域高亮 | 移除字符淡出 | 左指针移动 |
| `shrink-check` | 判断区域高亮 | 不满足字符红闪 | 无 |
| `complete` | **庆祝效果** | 结果高亮 | 无 |

## 3.2 辅助功能需求

### FR-005: 步骤计数器优化
**优先级：** P2
**描述：** 步骤计数器不仅显示数字，还显示当前步骤类型

**示例：** `步骤 12/45 · 窗口满足`

### FR-006: 进度条可视化
**优先级：** P2
**描述：** 在进度条上用不同颜色标记不同类型的步骤

- 黄色段：扩张相关步骤
- 绿色段：收缩相关步骤
- 红色段：找到解的步骤

### FR-007: 键盘快捷键
**优先级：** P2
**描述：** 支持键盘控制播放

- `Space`: 播放/暂停
- `→`: 下一步
- `←`: 上一步
- `↑`: 加速
- `↓`: 减速
- `R`: 重置

---

# 4. 非功能需求

## 4.1 性能需求

### NFR-001: 动画流畅性
- 动画帧率不低于 60fps
- 步骤切换延迟不超过 100ms

### NFR-002: 响应速度
- 用户操作响应时间不超过 50ms
- 大量步骤（100+）时仍然流畅

## 4.2 兼容性需求

### NFR-003: 浏览器兼容性
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 4.3 可维护性需求

### NFR-004: 代码结构
- 步骤生成逻辑与渲染逻辑分离
- 动画配置可外部化（便于调整节奏）

---

# 5. 技术实现方案

## 5.1 数据模型变更

### 当前数据结构（简化）
```typescript
interface AlgorithmStep {
  type: 'init' | 'expand' | 'found' | 'shrink' | 'complete';
  // ... 其他字段
}
```

### 新数据结构
```typescript
interface AlgorithmStep {
  type: 'init' | 'expand-start' | 'expand-add' | 'expand-check' | 
        'window-satisfied' | 'found' | 
        'shrink-start' | 'shrink-remove' | 'shrink-check' | 'complete';
  phase: 'expansion' | 'contraction' | 'milestone' | 'terminal';  // 新增：阶段分组
  priority: 'normal' | 'important' | 'critical';  // 新增：重要性级别
  duration: number;  // 新增：建议动画时长（毫秒）
  // ... 其他字段
}
```

## 5.2 核心算法逻辑变更

### 步骤生成函数重构
`src/algorithm/minWindowSteps.ts` 需要重构：

1. **拆分数组操作步骤**：将"移动指针+更新窗口+判断有效性"拆分为独立的步骤
2. **插入中间步骤**：在关键决策点插入额外的展示步骤
3. **计算步骤属性**：为每个步骤计算 phase、priority、duration

### 伪代码示例
```typescript
// 旧逻辑：一步完成
right++;
window.set(c, count + 1);
if (window.get(c) === need.get(c)) valid++;
steps.push({ type: 'expand', ... });

// 新逻辑：拆分为多步
// step 1: expand-start
steps.push({ type: 'expand-start', duration: 300, ... });

// step 2: expand-add
right++;
window.set(c, count + 1);
steps.push({ type: 'expand-add', duration: 800, currentChar: c, ... });

// step 3: expand-check
const isValidNow = window.get(c) === need.get(c);
steps.push({ type: 'expand-check', duration: 500, isValidNow, ... });

// step 4: window-satisfied (conditional)
if (isValidNow && valid === need.size) {
  steps.push({ type: 'window-satisfied', duration: 1500, ... });
}
```

## 5.3 UI组件变更

### StringDisplay 组件增强
- 支持不同步骤类型的字符动画（淡入、淡出、闪烁、发光）
- 支持指针脉动效果
- 支持全局背景效果切换

### ControlPanel 组件增强
- 步骤计数器显示步骤类型标签
- 进度条按步骤类型着色

### StatusPanel 组件增强
- 根据步骤优先级调整文字强调效果
- 关键步骤使用更大的字体和醒目的颜色

---

# 6. 验收标准

## 6.1 功能验收

| ID | 验收项 | 验收方法 |
|----|--------|---------|
| AC-001 | 步骤类型扩展到8+种 | 代码审查 `AlgorithmStep.type` 定义 |
| AC-002 | 每个步骤只展示一个核心变化 | 人工测试：播放算法，检查每步的信息量 |
| AC-003 | window-satisfied 步骤有专门视觉强调 | 视觉测试：观察该步骤是否有金色背景+发光效果 |
| AC-004 | found 步骤有庆祝效果 | 视觉测试：观察找到解时是否有脉冲动画 |
| AC-005 | 不同步骤有不同的动画时长 | 计时测试：测量各类步骤的实际播放时长 |
| AC-006 | 步骤计数器显示类型标签 | UI测试：检查计数器格式为"步骤 X/Y · 类型" |

## 6.2 性能验收

| ID | 验收项 | 验收方法 |
|----|--------|---------|
| AC-007 | 动画帧率 ≥ 60fps | Chrome DevTools Performance 面板 |
| AC-008 | 100+步骤流畅播放 | 使用长字符串测试，观察是否卡顿 |

---

# 7. 项目风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 步骤拆分导致总步骤数过多，用户感到冗长 | 中 | 中 | 提供"紧凑模式"选项，可以合并次要步骤 |
| 动画效果过多导致性能问题 | 低 | 高 | 使用 CSS 硬件加速，限制同时进行的动画数量 |
| 学习者不适应新的分镜节奏 | 低 | 中 | 提供新旧模式切换选项 |

---

# 8. 后续迭代方向

## 8.1 短期优化（v1.1）
- 收集用户反馈，微调动画时长
- 优化移动端体验

## 8.2 中期优化（v1.2）
- 添加更多算法（双指针、二分查找等）
- 支持用户自定义示例

## 8.3 长期优化（v2.0）
- 支持代码与动画同步高亮
- 添加音频讲解

---

# 9. 附录

## 9.1 参考资源
- 当前算法实现：`src/algorithm/minWindowSteps.ts`
- UI组件：`src/components/`
- 现有功能说明：`FEATURES.md`

## 9.2 术语表
- **分镜（Storyboard）**：算法演示的每一个步骤画面
- **滑动窗口**：算法中维护的动态子串范围
- **双指针**：left和right两个指针维护窗口边界
- **valid计数**：记录已满足需求的字符种类数

---

*文档版本: 1.0*
*最后更新: 2026-02-21*
