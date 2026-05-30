---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-map-coverage', 'step-05-review-epics']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
workflowType: 'epics'
---

# leetcode-76-minimum-window-substring - Epic Breakdown

## Overview

本文档提供分镜清晰度优化项目的完整Epic和Story分解，将PRD中的需求分解为可实现的开发任务。

## Requirements Inventory

### Functional Requirements

FR-001: 细粒度步骤类型 - 将现有的5种步骤类型扩展为10种更细粒度的步骤类型
FR-002: 步骤状态机设计 - 清晰定义步骤之间的流转关系
FR-003: 动画节奏控制 - 不同步骤类型有不同的动画时长
FR-004: 视觉层次设计 - 不同步骤类型有不同的视觉强调效果
FR-005: 步骤计数器优化 - 步骤计数器显示当前步骤类型标签
FR-006: 进度条可视化 - 进度条按步骤类型着色
FR-007: 键盘快捷键 - 支持键盘控制播放

### Non-Functional Requirements

NFR-001: 动画流畅性 - 动画帧率不低于60fps
NFR-002: 响应速度 - 用户操作响应时间不超过50ms
NFR-003: 浏览器兼容性 - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
NFR-004: 代码结构 - 步骤生成逻辑与渲染逻辑分离，动画配置可外部化

### Additional Requirements

- 现有React + TypeScript技术栈
- Vite构建工具
- CSS动画使用硬件加速
- 组件化设计保持
- 向后兼容（支持新旧模式切换）

### FR Coverage Map

| FR ID | Epic 1 | Epic 2 | Epic 3 | Epic 4 |
|-------|--------|--------|--------|--------|
| FR-001 | ✓ | - | - | - |
| FR-002 | ✓ | - | - | - |
| FR-003 | - | ✓ | - | - |
| FR-004 | - | ✓ | - | - |
| FR-005 | - | - | ✓ | - |
| FR-006 | - | - | ✓ | - |
| FR-007 | - | - | ✓ | - |
| NFR-001 | ✓ | ✓ | ✓ | ✓ |
| NFR-002 | ✓ | ✓ | ✓ | ✓ |
| NFR-003 | - | - | - | ✓ |
| NFR-004 | ✓ | - | - | ✓ |

## Epic List

1. **Epic 1: 核心算法步骤重构** - 重构算法步骤生成逻辑，实现细粒度步骤拆分
2. **Epic 2: 视觉与动画系统** - 实现步骤类型的视觉层次和动画节奏控制
3. **Epic 3: UI控制增强** - 优化步骤计数器、进度条和键盘快捷键
4. **Epic 4: 测试与优化** - 性能测试、兼容性测试和代码重构

---

## Epic 1: 核心算法步骤重构

**目标:** 重构现有的算法步骤生成逻辑，将粗粒度的expand/shrink步骤拆分为更细粒度的多个步骤，清晰展示算法的每个决策点。

### Story 1.1: 扩展步骤类型定义

As a 算法可视化开发者,
I want 扩展AlgorithmStep类型以支持10种细粒度步骤类型,
So that 系统可以区分不同阶段的算法执行。

**Acceptance Criteria:**

**Given** 当前AlgorithmStep类型定义
**When** 我查看src/types/algorithm.ts（或类似文件）
**Then** 应该看到新的步骤类型：'init', 'expand-start', 'expand-add', 'expand-check', 'window-satisfied', 'found', 'shrink-start', 'shrink-remove', 'shrink-check', 'complete'
**And** 每个类型都有phase、priority、duration属性

**Given** 步骤类型定义
**When** 编译项目
**Then** 应该没有TypeScript类型错误

### Story 1.2: 重构扩张阶段步骤生成

As a 算法学习者,
I want 看到扩张窗口被拆分为多个清晰的步骤,
So that 我能理解右指针移动、字符加入、有效性判断的完整过程。

**Acceptance Criteria:**

**Given** 源字符串"ADOBECODEBANC"和目标"ABC"
**When** 算法执行扩张阶段
**Then** 应该生成expand-start步骤（展示即将移动右指针）
**And** 应该生成expand-add步骤（展示字符加入窗口）
**And** 应该生成expand-check步骤（展示是否满足需求）
**And** 如果满足条件，生成window-satisfied步骤

**Given** expand-check步骤
**When** 目标字符刚好满足需求
**Then** 该步骤应该标记isValidNow = true

**Given** window-satisfied步骤
**When** valid计数等于need.size
**Then** 该步骤的priority应该为'critical'
**And** duration应该为1500ms

### Story 1.3: 重构收缩阶段步骤生成

As a 算法学习者,
I want 看到收缩窗口被拆分为多个清晰的步骤,
So that 我能理解左指针移动、字符移除、有效性判断的完整过程。

**Acceptance Criteria:**

**Given** 当前窗口满足所有需求
**When** 算法开始收缩阶段
**Then** 应该生成shrink-start步骤（展示开始收缩的决策）
**And** 应该生成shrink-remove步骤（展示字符移出窗口）
**And** 应该生成shrink-check步骤（展示是否还满足需求）

**Given** shrink-check步骤
**When** 窗口失去有效性（valid < need.size）
**Then** 该步骤应该标记willBreak = true
**And** 该步骤的description应该包含"不满足，继续扩张"

### Story 1.4: 实现步骤状态机

As a 算法可视化系统,
I want 步骤之间有明确的流转关系,
So that 演示逻辑清晰且易于维护。

**Acceptance Criteria:**

**Given** 步骤序列
**When** 检查步骤流转
**Then** 应该符合状态机定义：
  init → expand-start → expand-add → expand-check → (不满足→expand-start, 满足→window-satisfied) → found → shrink-start → shrink-remove → shrink-check → (仍满足→shrink-start, 不满足→expand-start) → complete

**Given** 生成的步骤数组
**When** 检查每个步骤的phase属性
**Then** 扩张相关步骤的phase应该是'expansion'
**And** 收缩相关步骤的phase应该是'contraction'
**And** 里程碑步骤的phase应该是'milestone'
**And** 终止步骤的phase应该是'terminal'

---

## Epic 2: 视觉与动画系统

**目标:** 为不同步骤类型实现差异化的视觉层次和动画节奏，使用户能够直观地感知算法执行的关键时刻。

### Story 2.1: 实现步骤动画时长配置

As a 算法学习者,
I want 关键步骤有更长的动画停留时间,
So that 我有足够的时间理解重要概念。

**Acceptance Criteria:**

**Given** 步骤配置表
**When** 系统加载动画配置
**Then** 应该读取不同步骤类型的建议时长：
  - init: 1000ms
  - expand-start: 300ms
  - expand-add: 800ms
  - expand-check: 500ms
  - window-satisfied: 1500ms
  - found: 2000ms
  - shrink-start: 300ms
  - shrink-remove: 800ms
  - shrink-check: 500ms
  - complete: 2000ms

**Given** 自动播放模式
**When** 播放到不同类型步骤
**Then** 动画停留时间应该根据配置自动调整
**And** 用户可以在播放中实时调整速度倍数

### Story 2.2: 实现StringDisplay视觉层次

As a 算法学习者,
I want 不同步骤类型有不同的字符显示效果,
So that 我能快速识别当前发生了什么。

**Acceptance Criteria:**

**Given** window-satisfied步骤
**When** 渲染StringDisplay组件
**Then** 整个显示区域应该有金色背景渐变
**And** 所有满足需求的字符应该有发光效果（glow animation）
**And** 左右指针应该有脉冲动画

**Given** found步骤
**When** 渲染StringDisplay组件
**Then** 整个显示区域应该有绿色背景渐变
**And** 最小覆盖子串应该有闪烁动画
**And** 子串应该高亮显示2秒

**Given** expand-add步骤
**When** 渲染StringDisplay组件
**Then** 新加入的字符应该有淡入动画（fade-in）
**And** 右指针应该有移动动画

**Given** shrink-remove步骤
**When** 渲染StringDisplay组件
**Then** 移除的字符应该有淡出动画（fade-out）
**And** 左指针应该有移动动画

**Given** expand-check或shrink-check步骤且判断结果为不满足
**When** 渲染StringDisplay组件
**Then** 不满足的字符应该有红色闪烁提示

### Story 2.3: 实现指针脉动效果

As a 算法学习者,
I want 准备移动的指针有明显的视觉提示,
So that 我知道下一步将要发生什么。

**Acceptance Criteria:**

**Given** expand-start步骤
**When** 渲染左右指针
**Then** 右指针应该有脉动动画（pulse）
**And** 脉动动画应该持续300ms

**Given** shrink-start步骤
**When** 渲染左右指针
**Then** 左指针应该有脉动动画（pulse）
**And** 脉动动画应该持续300ms

**Given** 其他步骤类型
**When** 渲染左右指针
**Then** 指针应该保持静态样式

---

## Epic 3: UI控制增强

**目标:** 优化用户界面，增强步骤计数器、进度条可视化，并添加键盘快捷键支持，提升用户操作体验。

### Story 3.1: 优化步骤计数器

As a 算法学习者,
I want 步骤计数器显示当前步骤的类型,
So that 我能快速了解当前在看什么。

**Acceptance Criteria:**

**Given** 任意步骤
**When** 查看步骤计数器
**Then** 显示格式应该为"步骤 X/Y · 步骤类型"
**And** 步骤类型应该使用中文翻译：
  - expand-start → "准备扩张"
  - expand-add → "加入字符"
  - expand-check → "检查满足"
  - window-satisfied → "窗口满足"
  - found → "找到解"
  - shrink-start → "准备收缩"
  - shrink-remove → "移除字符"
  - shrink-check → "检查收缩"
  - complete → "完成"

**Given** 步骤类型标签
**When** 不同步骤类型
**Then** 应该使用不同颜色：
  - 扩张相关：黄色
  - 收缩相关：蓝色
  - 里程碑：金色
  - 完成：绿色

### Story 3.2: 实现彩色进度条

As a 算法学习者,
I want 进度条用不同颜色标记不同类型的步骤,
So that 我能一眼看出算法的执行模式。

**Acceptance Criteria:**

**Given** 步骤序列
**When** 渲染进度条
**Then** 进度条应该按步骤类型分段着色：
  - 扩张相关步骤：黄色段
  - 收缩相关步骤：蓝色段
  - 找到解的步骤：绿色段
  - 里程碑步骤：金色段

**Given** 进度条
**When** 当前步骤变化
**Then** 应该有平滑的进度过渡动画

**Given** 进度条
**When** 点击任意位置
**Then** 应该跳转到对应的步骤（如果技术可行）
**And** 如果不支持跳转，显示提示"点击跳转功能即将上线"

### Story 3.3: 实现键盘快捷键

As a 算法学习者,
I want 使用键盘控制播放,
So that 我不用频繁移动鼠标。

**Acceptance Criteria:**

**Given** 算法演示页面
**When** 按下Space键
**Then** 应该在"播放"和"暂停"之间切换

**Given** 算法演示页面
**When** 按下右箭头键（→）
**Then** 应该前进到下一步

**Given** 算法演示页面
**When** 按下左箭头键（←）
**Then** 应该回退到上一步

**Given** 算法演示页面
**When** 按下上箭头键（↑）
**Then** 应该增加播放速度（最高3.0x）

**Given** 算法演示页面
**When** 按下下箭头键（↓）
**Then** 应该降低播放速度（最低0.5x）

**Given** 算法演示页面
**When** 按下R键
**Then** 应该重置到初始状态

**Given** 键盘快捷键
**When** 触发快捷键
**Then** 应该阻止默认浏览器行为（preventDefault）

---

## Epic 4: 测试与优化

**目标:** 确保重构后的系统性能达标，代码结构清晰可维护，并在各浏览器中正常工作。

### Story 4.1: 性能测试与优化

As a 用户,
I want 算法演示流畅不卡顿,
So that 我有良好的观看体验。

**Acceptance Criteria:**

**Given** 长字符串示例（50+字符）
**When** 自动生成所有步骤
**Then** 步骤生成时间应该小于100ms

**Given** 100+步骤的算法演示
**When** 自动播放
**Then** 动画帧率应该保持在60fps以上
**And** 没有明显的卡顿或掉帧

**Given** Chrome DevTools Performance面板
**When** 录制算法演示
**Then** 每个动画帧的渲染时间应该小于16.67ms

**Given** 性能瓶颈检测
**When** 分析动画性能
**Then** 应该使用CSS硬件加速（transform、opacity）
**And** 避免触发重排的属性变化

### Story 4.2: 浏览器兼容性测试

As a 用户,
I want 在不同浏览器中都能正常使用,
So that 我不受浏览器限制。

**Acceptance Criteria:**

**Given** Chrome 90+
**When** 运行所有功能
**Then** 应该完全正常工作

**Given** Firefox 88+
**When** 运行所有功能
**Then** 应该完全正常工作

**Given** Safari 14+
**When** 运行所有功能
**Then** 应该完全正常工作

**Given** Edge 90+
**When** 运行所有功能
**Then** 应该完全正常工作

**Given** 移动端浏览器（iOS Safari, Android Chrome）
**When** 运行基本功能
**Then** 布局应该响应式适配
**And** 触摸操作应该正常工作

### Story 4.3: 代码重构与配置外部化

As a 开发者,
I want 动画配置可以外部化,
So that 调整动画参数不需要修改代码。

**Acceptance Criteria:**

**Given** 项目代码
**When** 查看配置
**Then** 应该有独立的配置文件（如src/config/animationConfig.ts）
**And** 配置应该包含所有步骤类型的时长、颜色、动画效果

**Given** 代码结构
**When** 查看组件依赖
**Then** 步骤生成逻辑（algorithm）应该与渲染逻辑（components）完全分离
**And** 组件不应该直接依赖算法实现细节

**Given** 现有代码
**When** 重构后的代码
**Then** 应该保持向后兼容
**And** 原有功能不受影响
**And** 可以通过配置切换到新模式

### Story 4.4: 创建回归测试

As a 开发者,
I want 有回归测试确保功能正确,
So that 重构不会引入bug。

**Acceptance Criteria:**

**Given** 测试套件
**When** 运行单元测试
**Then** 应该覆盖所有步骤类型生成逻辑

**Given** 测试套件
**When** 运行集成测试
**Then** 应该验证完整算法演示流程

**Given** 预设示例（ADOBECODEBANC/ABC）
**When** 执行算法
**Then** 生成的步骤序列应该与预期一致
**And** 最终答案应该是"BANC"

**Given** CI/CD流程
**When** 提交代码
**Then** 应该自动运行测试套件
**And** 测试失败应该阻止合并

---

## Story Summary

| ID | 标题 | Epic | 优先级 | 估算点数 |
|----|------|------|--------|---------|
| 1.1 | 扩展步骤类型定义 | Epic 1 | P0 | 3 |
| 1.2 | 重构扩张阶段步骤生成 | Epic 1 | P0 | 5 |
| 1.3 | 重构收缩阶段步骤生成 | Epic 1 | P0 | 5 |
| 1.4 | 实现步骤状态机 | Epic 1 | P0 | 3 |
| 2.1 | 实现步骤动画时长配置 | Epic 2 | P1 | 3 |
| 2.2 | 实现StringDisplay视觉层次 | Epic 2 | P1 | 8 |
| 2.3 | 实现指针脉动效果 | Epic 2 | P1 | 3 |
| 3.1 | 优化步骤计数器 | Epic 3 | P2 | 3 |
| 3.2 | 实现彩色进度条 | Epic 3 | P2 | 5 |
| 3.3 | 实现键盘快捷键 | Epic 3 | P2 | 3 |
| 4.1 | 性能测试与优化 | Epic 4 | P1 | 5 |
| 4.2 | 浏览器兼容性测试 | Epic 4 | P2 | 5 |
| 4.3 | 代码重构与配置外部化 | Epic 4 | P1 | 5 |
| 4.4 | 创建回归测试 | Epic 4 | P2 | 5 |

**总计: 14个Stories, 56个估算点数**

---

## 依赖关系

```
Epic 1 (核心算法) → Epic 2 (视觉系统) → Epic 3 (UI控制)
       ↓                    ↓                  ↓
              Epic 4 (测试与优化) ←──────────┘
```

**关键依赖:**
- Epic 2依赖于Epic 1的步骤类型定义
- Epic 3依赖于Epic 2的动画系统
- Epic 4需要在前三个Epic基本完成后进行

---

## 实施建议

### Sprint 1: 核心重构
- Story 1.1, 1.2, 1.3
- 完成算法步骤的细粒度拆分

### Sprint 2: 状态机与视觉基础
- Story 1.4, 2.1, 2.3
- 完成状态机定义和基础动画配置

### Sprint 3: 视觉系统
- Story 2.2
- 完成所有视觉层次效果

### Sprint 4: UI增强
- Story 3.1, 3.2, 3.3
- 完成所有UI改进

### Sprint 5: 测试与优化
- Story 4.1, 4.2, 4.3, 4.4
- 完成性能优化和测试覆盖

---

*文档版本: 1.0*
*最后更新: 2026-02-21*
