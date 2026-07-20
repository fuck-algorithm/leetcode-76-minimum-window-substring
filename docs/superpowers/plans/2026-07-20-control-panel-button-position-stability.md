# 修复控制面板按钮"弹来弹去"位移 Bug Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 修复底部控制面板按钮在用户连续单击（下一步/上一步/播放暂停）时位置"弹来弹去"左右漂移、无法稳定点击的 bug，让按钮位置在任何步骤状态下都纹丝不动。

**Architecture:** 数据流——用户单击按钮 → App 状态 currentStep/isPlaying 变化 → ControlPanel 重渲染，`stepDescription` 文案与"播放/暂停"文字随之变化 → 由于布局用 `flex-wrap: wrap` + `justify-content: center` + `.step-description flex:0 1 auto`，子元素宽度变化导致整个按钮组居中点漂移、临界换行弹跳 → 按钮屏幕绝对位置跳动 → 鼠标脱靶。修复关键组件：改 `.control-row`/`.control-buttons` 为 `flex-wrap: nowrap` 阻断换行弹跳；`.step-description` 改固定宽度 `flex: 0 0 200px` 阻断文案长度推挤；所有 `.control-btn` 加统一 `min-width` 阻断"播放↔暂停"文字宽度跳变；移除 hover `translateY(-2px)` 与 `transition: all` 阻断垂直抖动。设计理由：布局对子元素内容宽度敏感是根因，固定各子元素宽度让按钮组总宽度恒定，居中点自然稳定。

**Tech Stack:** React 18, TypeScript 5, CSS3 Flexbox, Vite 5

**Root Cause:**
- `ControlPanel.css:33` `.control-row { flex-wrap: wrap }` + `:31 justify-content: center`：子元素总宽度变化时居中点漂移，临界宽度时换行导致按钮跳到第二行
- `ControlPanel.css:40` `.control-buttons { flex-wrap: wrap }`：按钮组内部同样换行弹跳
- `ControlPanel.css:13` `.step-description { flex: 0 1 auto; max-width: 40% }`：文案长短变化（每步描述不同）导致其宽度变化，推挤按钮组
- `ControlPanel.tsx:121` `{isPlaying ? '暂停' : '播放'}`：文字切换导致 primary 按钮宽度跳变（虽有 min-width:80px，但其他按钮无 min-width）
- `ControlPanel.css:52` `.control-btn { transition: all 0.3s }` + `:61 transform: translateY(-2px)`：hover 时按钮垂直上跳 2px，hover/取消 hover 时垂直抖动

**Risks:**
- 移除 `flex-wrap: wrap` 后窄屏（<768px）按钮组可能横向溢出 → 缓解：768px 媒体查询已有 `.btn-text/.btn-shortcut { display: none }` 缩窄按钮，且 `min-width` 取较小值；按钮组容器加 `overflow: visible` 不裁切
- `.step-description` 固定 200px 宽可能装不下长文案 → 缓解：已有 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`，固定宽度后超长自动省略号
- 统一 `min-width` 可能让按钮组总宽超过极窄屏 → 缓解：min-width 取 60px，4 按钮组约 280px，768px 以上安全；768px 以下靠 display:none 缩窄

---

### Task 1: CSS 布局稳定化修复按钮位移根因

**Depends on:** None
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.css:12-56,58-75,222-242`（多处样式调整）

- [ ] **Step 1: 修改 .step-description 改固定宽度 — 阻断文案长度推挤按钮组**

当前 `.step-description` 用 `flex: 0 1 auto; max-width: 40%`，文案长短变化导致宽度变化推挤按钮组居中点漂移。改为固定宽度 `flex: 0 0 200px; width: 200px`，超长由已有 `overflow: hidden; text-overflow: ellipsis` 省略号处理。

文件: `src/components/ControlPanel/ControlPanel.css:12-25`（替换 `.step-description` 整段）

```css
.step-description {
  flex: 0 0 200px;
  width: 200px;
  font-size: 11px;
  color: #e0e0e0;
  background: rgba(31, 41, 55, 0.6);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
```

- [ ] **Step 2: 修改 .control-row 和 .control-buttons 移除 flex-wrap — 阻断换行弹跳**

当前两者都用 `flex-wrap: wrap`，子元素总宽变化时临界换行导致按钮跳到第二行。改为 `nowrap`，配合后续固定宽度让按钮组总宽恒定、居中点稳定。

文件: `src/components/ControlPanel/ControlPanel.css:27-41`（替换 `.control-row` 和 `.control-buttons` 两段）

```css
.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow: visible;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  flex-wrap: nowrap;
}
```

- [ ] **Step 3: 修改 .control-btn 加统一 min-width 并移除 hover 位移 — 阻断按钮宽度跳变与垂直抖动**

当前 `.control-btn` 无统一 min-width，"播放↔暂停"文字切换导致按钮宽度跳变；hover `transform: translateY(-2px)` + `transition: all 0.3s` 导致垂直抖动。改为：所有 `.control-btn` 加 `min-width: 60px`（primary 已有 80px 保留）；移除 hover 的 `translateY(-2px)`；`transition` 从 `all 0.3s` 收窄为只过渡颜色 `background 0.2s, border-color 0.2s, box-shadow 0.2s`，不过渡 transform。

文件: `src/components/ControlPanel/ControlPanel.css:43-63`（替换 `.control-btn` 与 `.control-btn:hover:not(:disabled)` 两段）

```css
.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.25rem 0.4rem;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  font-size: 11px;
  font-weight: 500;
  color: #e0e0e0;
  min-width: 60px;
  white-space: nowrap;
}

.control-btn:hover:not(:disabled) {
  background: #4b5563;
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
```

- [ ] **Step 4: 验证构建通过 — 确认 CSS 改动无语法错误**
Run: `npx vite build 2>&1 | tail -10`
Expected:
  - Exit code: 0
  - Output contains: "built in"
  - Output does NOT contain: "error" or "Error"

- [ ] **Step 5: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.css && git commit -m "fix(control-panel): 固定描述宽度与按钮 min-width、移除 flex-wrap 与 hover 位移，根除按钮连续单击时位置漂移弹跳"`

---

### Task 2: 防御性审查所有"状态相关宽度/位置变化"元素

**Depends on:** Task 1
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.css`（如审查发现遗漏点则补 fix）
- Read-only: `src/components/ControlPanel/ControlPanel.tsx`（审查动态内容源）

- [ ] **Step 1: 审查 ControlPanel.tsx 枚举所有随状态变化的动态内容 — 找出剩余宽度跳变源**

用户要求"自己审核此类脑残操作"。需系统审查 ControlPanel.tsx 中所有"值随 currentStep/isPlaying/speed 变化而变化"的渲染内容，逐一确认其 CSS 已稳定（固定宽度或已 nowrap+ellipsis）。

读 `src/components/ControlPanel/ControlPanel.tsx`，枚举动态内容点：
1. `stepDescription`（:92-94）—— Task 1 已固定 200px ✓
2. `isPlaying ? '暂停' : '播放'`（:121）—— Task 1 已给所有 btn min-width:60px，primary min-width:80px ✓，但需确认"暂停"两字 vs "播放"两字宽度相同（都是两字，宽度一致）✓
3. `currentStep + 1 / totalSteps`（:154 progress-label）—— 数字位数变化（如 9/20 → 10/20）导致 progress-label 宽度跳变，会推挤进度条起点。需检查 `.progress-label` 是否固定宽度
4. `speed === s ? 'active' : ''`（:143）—— active 仅改颜色不改宽度，speed-btn 内容 `{s}x` 固定 ✓
5. `progress` 百分比（:162,166）—— 进度条 fill/thumb 位置本就该动，非 bug

预期发现：`.progress-label` 未固定宽度，数字位数变化会推挤进度条。这是 Task 1 之外需补的 fix。

Read `src/components/ControlPanel/ControlPanel.css:151-157` 确认 `.progress-label` 当前样式（当前是 `white-space: nowrap; flex-shrink: 0`，但无固定 width，数字位数变化仍会改变其自然宽度）。

- [ ] **Step 2: 给 .progress-label 加固定宽度 — 阻断数字位数变化推挤进度条**

`currentStep + 1` 从 9 跳到 10 时位数增加，`.progress-label` 宽度变化推挤进度条起点漂移。加固定宽度并右对齐让数字变化不引起宽度跳变。

文件: `src/components/ControlPanel/ControlPanel.css:151-157`（替换 `.progress-label` 段）

```css
.progress-label {
  font-size: 10px;
  color: #e0e0e0;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  width: 50px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

说明：`width: 50px` 固定宽度容纳 "999 / 999" 量级；`text-align: right` 让数字增长向左扩展不推挤右侧进度条；`font-variant-numeric: tabular-nums` 让等宽数字避免 1/7 等窄字数字引起的微抖动。

- [ ] **Step 3: 审查 768px 媒体查询窄屏兼容 — 确认移除 flex-wrap 后窄屏不溢出**

读 `src/components/ControlPanel/ControlPanel.css:222-242`（768px 媒体查询）。当前已有 `.btn-text { display: none }`、`.btn-shortcut { display: none }` 缩窄按钮。Task 1 Step 3 给所有 btn 加了 `min-width: 60px`，4 按钮组在 768px 以下：60×4 + gap 0.3rem×3 ≈ 249px，加 step-description 200px + speed-control，总宽可能超 320px 小屏。

缓解：在 768px 媒体查询内覆盖 `.step-description` 为 `display: none`（窄屏隐藏描述，按钮优先），并降低 `.control-btn min-width` 到 44px。

文件: `src/components/ControlPanel/ControlPanel.css:222-242`（替换 768px 媒体查询整段）

```css
@media (max-width: 768px) {
  .step-description {
    display: none;
  }

  .control-buttons {
    gap: 0.35rem;
  }

  .control-btn {
    padding: 0.4rem 0.6rem;
    min-width: 44px;
  }

  .btn-text {
    display: none;
  }

  .btn-shortcut {
    display: none;
  }

  .speed-buttons {
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 4: 验证构建通过 — 确认 768px 媒体查询与 progress-label 改动无语法错误**
Run: `npx vite build 2>&1 | tail -10`
Expected:
  - Exit code: 0
  - Output contains: "built in"
  - Output does NOT contain: "error" or "Error"

- [ ] **Step 5: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.css && git commit -m "fix(control-panel): 固定 progress-label 宽度阻断数字位数推挤进度条，768px 隐藏描述并缩窄按钮防溢出"`
