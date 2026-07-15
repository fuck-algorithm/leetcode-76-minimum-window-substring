# 合并底部控制区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 消除页面底部"两个控制面板"的观感——把 Canvas 内底部的"步骤说明"框移出画布并融入真正的 ControlPanel，同时精简 ControlPanel 内重复的进度指示（stats-row 文字与 progress-bar 图形）。

**Architecture:** 数据流：App.tsx 已有的 `currentStepData`（含 description）→ 新增 prop 传入 ControlPanel → ControlPanel 顶部渲染"当前步骤描述"行。Canvas 端删除内部 descY 步骤说明框绘制（Canvas.tsx:384-402）并回收 descY 坐标空间（下调 contentHeight 基准）。ControlPanel 端把 `.stats-row` 的"步骤 N/M"文字合并为进度条左侧简洁标签，移除独立徽章，使底部只剩"描述行 + 按钮 + 速度 + 进度条(带步骤标签)"一个统一控制面板。设计理由：description 与进度指示本就属于控制区信息，集中到 ControlPanel 后画布只保留纯算法可视化，底部条状元素从 4 层（Canvas描述框/ControlPanel/keyboard-hints/footer）收敛为清晰职责分层。

**Tech Stack:** React 18, TypeScript 5, Vite 5, D3 7

**Risks:**
- Canvas 移除 descY 后 contentHeight 基准需下调，否则画布底部留白过大 → 缓解：contentHeight 从 340 下调到约 250（去掉 descY 贡献的 gap(82)+36 高度），scale 公式不变
- ControlPanel 加入描述行后高度增加，可能影响单屏显示 → 缓解：描述行单行省略、小字号、flex-shrink:0 但高度可控（约 20px）
- stats-row 合并到进度条旁，需保证 progressRef 拖拽逻辑（基于 getBoundingClientRect）不受影响 → 缓解：只把"步骤 N/M"文字作为 progress-bar-container 的兄弟标签，不改 progressRef 容器本身

---

### Task 1: 给 ControlPanel 增加 stepDescription 数据通路

**Depends on:** None
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.tsx:5-17`（接口与解构）
- Modify: `src/App.tsx:207-231`（传 prop）

- [ ] **Step 1: 修改 ControlPanelProps 接口与解构 — 增加 stepDescription prop**
文件: `src/components/ControlPanel/ControlPanel.tsx:5-17`（替换接口定义与组件解构签名）

```typescript
interface ControlPanelProps {
  currentStep: number;
  totalSteps: number;
  stepDescription?: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  stepDescription,
  isPlaying,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onReset,
  onSeek,
  speed,
  onSpeedChange,
}) => {
```

- [ ] **Step 2: 修改 App.tsx — 把 currentStepData.description 传入 ControlPanel**
文件: `src/App.tsx:207-210`（在 ControlPanel 调用处增加 stepDescription prop）

```tsx
          <ControlPanel
            currentStep={currentStep}
            totalSteps={steps.length}
            stepDescription={currentStepData?.description}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
```

说明：在 `totalSteps={steps.length}` 之后、`isPlaying` 之前插入 `stepDescription={currentStepData?.description}` 一行。其余 prop 保持不变。

- [ ] **Step 3: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - 输出中不包含 "error TS"

- [ ] **Step 4: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.tsx src/App.tsx && git commit -m "feat(control-panel): 增加 stepDescription 数据通路，传入当前步骤描述"`

---

### Task 2: 移除 Canvas 内步骤说明框并回收坐标空间

**Depends on:** Task 1
**Files:**
- Modify: `src/components/Canvas/Canvas.tsx:44-75,384-402`

- [ ] **Step 1: 删除 Canvas 步骤说明框绘制 — 把描述职责让给 ControlPanel**
文件: `src/components/Canvas/Canvas.tsx:384-402`（删除"绘制步骤说明"整段）

删除以下代码块（从 `// 绘制步骤说明` 注释到 `.text(descText...)` 结束）：

```typescript
    // 绘制步骤说明
    const descText = currentStep.description;
    
    g.append('rect')
      .attr('x', 15)
      .attr('y', descY - 14)
      .attr('width', width - 30)
      .attr('height', 36)
      .attr('rx', 6)
      .attr('fill', 'rgba(31, 41, 55, 0.8)')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', descY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '11px')
      .text(descText.length > 90 ? descText.substring(0, 90) + '...' : descText);
```

说明：这段是画布底部带框的"步骤说明示意图"，与下方 ControlPanel 视觉重复，是用户感知"两个控制面板"的主因。description 数据已通过 Task 1 传入 ControlPanel，此处安全删除。

- [ ] **Step 2: 回收 descY 坐标空间 — 下调 contentHeight 基准避免画布底部留白**
文件: `src/components/Canvas/Canvas.tsx:44-75`（替换布局常量段，删除 descY 声明并下调 contentHeight）

当前（约 44-75 行）:
```typescript
    const contentHeight = 340; // 各区块自然总高度基准
    const topPad = 12;
    const scale = Math.min(1, Math.max(0.85, (height - topPad * 2) / contentHeight));
    const gap = (base: number) => base * scale;

    // 区块 1：图例（占 1 行高度）
    const legendBlockH = gap(20);
    const legendY = topPad + 10;
    const legendItemWidth = 100;
    const legendStartX = (width - legendItemWidth * 3) / 2;

    // 区块 2：源字符串标题
    const titleY = legendY + legendBlockH + gap(8);

    // 区块 3：字符行 + 指针（左指针在上方，右指针在下方）
    const stringY = titleY + gap(20);
    const leftPointerTopY = stringY - gap(24); // 左指针标签，独立于字符行上方
    const rightPointerBottomY = stringY + charHeight + gap(22); // 右指针标签，独立于字符行下方

    // 区块 4：窗口状态徽章
    const statusY = rightPointerBottomY + gap(18);

    // 区块 5：目标字符串
    const targetY = statusY + gap(22);

    // 区块 6：频次对比
    const freqY = targetY + gap(25);

    // 区块 7：步骤说明（位于频次对比下方，间距需覆盖频次区块 ~52px 纵深）
    const descY = freqY + gap(82);
```

改为（删除 descY 声明、区块7 注释；contentHeight 从 340 下调到 248，因为去掉 descY 贡献的 gap(82)+36≈118px）:
```typescript
    const contentHeight = 248; // 各区块自然总高度基准（已移除画布内步骤说明框）
    const topPad = 12;
    const scale = Math.min(1, Math.max(0.85, (height - topPad * 2) / contentHeight));
    const gap = (base: number) => base * scale;

    // 区块 1：图例（占 1 行高度）
    const legendBlockH = gap(20);
    const legendY = topPad + 10;
    const legendItemWidth = 100;
    const legendStartX = (width - legendItemWidth * 3) / 2;

    // 区块 2：源字符串标题
    const titleY = legendY + legendBlockH + gap(8);

    // 区块 3：字符行 + 指针（左指针在上方，右指针在下方）
    const stringY = titleY + gap(20);
    const leftPointerTopY = stringY - gap(24); // 左指针标签，独立于字符行上方
    const rightPointerBottomY = stringY + charHeight + gap(22); // 右指针标签，独立于字符行下方

    // 区块 4：窗口状态徽章
    const statusY = rightPointerBottomY + gap(18);

    // 区块 5：目标字符串
    const targetY = statusY + gap(22);

    // 区块 6：频次对比（画布末尾区块，步骤说明已移至 ControlPanel）
    const freqY = targetY + gap(25);
```

- [ ] **Step 3: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - 输出中不包含 "error TS"（注意确认无 descY 未使用变量残留报错——descY 已删除，不应再有引用）

- [ ] **Step 4: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - 输出不包含 "error"

- [ ] **Step 5: 提交**
Run: `git add src/components/Canvas/Canvas.tsx && git commit -m "refactor(canvas): 移除画布内步骤说明框，回收 descY 坐标空间，描述职责移交控制面板"`

---

### Task 3: 重构 ControlPanel 布局 — 描述行 + 合并进度指示

**Depends on:** Task 1, Task 2
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.tsx:86-176`
- Modify: `src/components/ControlPanel/ControlPanel.css:122-157`

- [ ] **Step 1: 重构 ControlPanel 渲染 — 顶部描述行 + 把步骤计数合并为进度条标签**
文件: `src/components/ControlPanel/ControlPanel.tsx:86-176`（替换整个 return JSX）

根因：原 `.stats-row`（步骤 N/M 文字徽章）与 `.progress-bar-container`（图形进度条）并排，功能重复像两套进度控件。改为：顶部新增"当前步骤描述"行（承接画布移出的 description），下方控制行把"步骤 N/M"作为进度条左侧简洁标签，删除独立 stats-row 徽章。

```tsx
  return (
    <div className="control-panel">
      {stepDescription && (
        <div className="step-description" title={stepDescription}>
          {stepDescription}
        </div>
      )}

      <div className="control-row">
        <div className="control-buttons">
          <button className="control-btn" onClick={onReset} title="重置 (R)">
            <span className="btn-icon">↺</span>
            <span className="btn-text">重置</span>
            <span className="btn-shortcut">R</span>
          </button>

          <button
            className="control-btn"
            onClick={onPrev}
            disabled={currentStep === 0}
            title="上一步 (←)"
          >
            <span className="btn-icon">←</span>
            <span className="btn-text">上一步</span>
            <span className="btn-shortcut">←</span>
          </button>

          <button
            className="control-btn primary"
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
          >
            <span className="btn-icon">{isPlaying ? '⏸' : '▶'}</span>
            <span className="btn-text">{isPlaying ? '暂停' : '播放'}</span>
            <span className="btn-shortcut">Space</span>
          </button>

          <button
            className="control-btn"
            onClick={onNext}
            disabled={currentStep >= totalSteps - 1}
            title="下一步 (→)"
          >
            <span className="btn-icon">→</span>
            <span className="btn-text">下一步</span>
            <span className="btn-shortcut">→</span>
          </button>
        </div>

        <div className="speed-control">
          <span className="speed-label">速度:</span>
          <div className="speed-buttons">
            {speedOptions.map((s) => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => handleSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="progress-group">
          <span className="progress-label">{currentStep + 1} / {totalSteps}</span>
          <div
            className="progress-bar-container"
            ref={progressRef}
            onMouseDown={handleMouseDown}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="progress-thumb"
              style={{ left: `${progress}%` }}
            />
            <div className="progress-steps">
              {Array.from({ length: Math.min(totalSteps, 20) }).map((_, i) => {
                const stepIndex = Math.round((i / 19) * (totalSteps - 1));
                return (
                  <div
                    key={i}
                    className={`progress-dot ${stepIndex <= currentStep ? 'passed' : ''}`}
                    style={{ left: `${(stepIndex / (totalSteps - 1)) * 100}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
```

说明：
- 新增 `.step-description` 行（顶部，承接 description）。
- 新增 `.control-row` 包裹按钮+速度+进度组，与描述行上下分层。
- 删除原 `.stats-row` 独立徽章，把"步骤 N/M"改为 `.progress-label` 放在 `.progress-group` 内、进度条左侧。
- `.progress-bar-container` 及其 ref/拖拽逻辑保持不变，确保 onSeek 拖拽不受影响。

- [ ] **Step 2: 重构 ControlPanel.css — 描述行样式 + progress-group + 精简 stats**
文件: `src/components/ControlPanel/ControlPanel.css:1-12`（替换 `.control-panel` 块）

当前:
```css
.control-panel {
  background: #111827;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

改为（column 布局：描述行在上、control-row 在下；control-row 内部 row 居中）:
```css
.control-panel {
  background: #111827;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.step-description {
  width: 100%;
  font-size: 11px;
  color: #e0e0e0;
  background: rgba(31, 41, 55, 0.6);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.4;
}

.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
```

- [ ] **Step 3: 替换 stats-row 样式为 progress-group — 合并进度指示**
文件: `src/components/ControlPanel/ControlPanel.css:122-157`（替换 `.stats-row`/`.stat-item`/`.stat-label`/`.stat-value` 块与 `.progress-bar-container` 块）

当前:
```css
.stats-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 10px;
}

.stat-label {
  color: #9ca3af;
}

.stat-value {
  color: #e0e0e0;
  font-weight: 600;
  background: #374151;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.progress-bar-container {
  position: relative;
  height: 14px;
  background: #374151;
  border-radius: 7px;
  cursor: pointer;
  overflow: visible;
  flex: 1;
  min-width: 120px;
  max-width: 500px;
}
```

改为（删除 stats 系列样式，新增 progress-group/progress-label，progress-bar-container 保留但 flex:1 由 group 管理）:
```css
.progress-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 160px;
  max-width: 560px;
}

.progress-label {
  font-size: 10px;
  color: #e0e0e0;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.progress-bar-container {
  position: relative;
  height: 14px;
  background: #374151;
  border-radius: 7px;
  cursor: pointer;
  overflow: visible;
  flex: 1;
  min-width: 100px;
}
```

说明：`.progress-group` 承接原 progress-bar-container 的 flex:1 撑宽职责，内部 `.progress-label`（步骤 N/M）+ `.progress-bar-container`（进度条）并排。progress-bar-container 的 max-width:500px 移除（改由 group 的 max-width:560px 统一管控），min-width 降到 100px（label 已占一部分宽度）。原 `.stats-row`/`.stat-item`/`.stat-label`/`.stat-value` 全部删除（已不再使用）。

- [ ] **Step 4: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - 输出中不包含 "error TS"

- [ ] **Step 5: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - 输出不包含 "error"

- [ ] **Step 6: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.tsx src/components/ControlPanel/ControlPanel.css && git commit -m "refactor(control-panel): 新增步骤描述行，合并步骤计数为进度条标签，消除重复进度指示"`
