# 底部控制区分层重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 重构底部 ControlPanel 为清晰两行分层——上行控制行（合并步骤描述 + 按钮 + 速度，消除"第二个面板"观感），下行进度条独占整行全宽；并验证 GitHub Action 已在每次 push 到 main 时自动部署。

**Architecture:** 当前 ControlPanel 是「描述横条 + control-row(按钮/速度/进度条并排)」三段式，描述独立成横条像第二个控制面板，进度条被 max-width:560px 限制未占满宽度。重构为两行：`.control-row`（描述文本作为左侧行内元素 + 按钮 + 速度，flex-wrap 换行）+ `.progress-row`（进度条 width:100% 独占全宽，步骤计数标签在进度条左侧）。数据流不变：App.tsx 的 `currentStepData?.description` → ControlPanel 的 `stepDescription` prop → 渲染为 control-row 内行内文本（而非独立横条）。设计理由：描述与按钮同属"当前操作"语义，合并后底部只剩「操作行 + 进度行」两层，职责清晰；进度条全宽使其成为页面底部最显著的进度指示，符合用户"单独占用整个屏幕宽度"的诉求。

**Tech Stack:** React 18, TypeScript 5, Vite 5, GitHub Actions (actions/checkout@4, setup-node@4, upload-pages-artifact@v3, deploy-pages@4)

**Risks:**
- Task 1 修改 JSX 结构时，progressRef 必须仍挂在 `.progress-bar-container` 上，拖拽逻辑（handleMouseDown/handleMouseMove 基于 getBoundingClientRect）不能断 → 缓解：只移动 DOM 层级，不改 ref 绑定与事件处理函数
- Task 2 进度条全宽后，progress-bar-container 的 flex:1 在 progress-row（width:100%）内会撑满整行，需移除原 progress-group 的 max-width:560px 约束 → 缓解：progress-row 设 width:100%，progress-bar-container 保留 flex:1 但无 max-width
- 描述合并进 control-row 后长文本挤压按钮 → 缓解：描述容器 flex:1 + min-width:0 + ellipsis，按钮组 flex-shrink:0

---

### Task 1: 重构 ControlPanel JSX — 描述并入控制行 + 进度条提为独立全宽行

**Depends on:** None
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.tsx:88-183`

- [ ] **Step 1: 替换 return JSX — 描述合并进 control-row，进度条提为独立 progress-row**

文件: `src/components/ControlPanel/ControlPanel.tsx:88-183`（替换整个 return 块）

当前结构问题：`step-description` 独立成横条行（像第二个面板），`progress-group` 在 control-row 内被 max-width 限制未占满宽度。改为：描述作为 control-row 内的行内文本（不再独立横条），进度条提为 `.progress-row` 独占全宽。

```tsx
  return (
    <div className="control-panel">
      <div className="control-row">
        {stepDescription && (
          <div className="step-description" title={stepDescription}>
            {stepDescription}
          </div>
        )}

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
      </div>

      <div className="progress-row">
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
  );
```

关键变化：
- `.step-description` 从 control-panel 的直接子节点（独立横条）移入 `.control-row` 内作为首个行内元素，与按钮、速度同行
- 删除原 `.progress-group` 包裹层，改为 `.progress-row` 独占一行（control-panel 的直接子节点，与 control-row 平级）
- `.progress-label` 与 `.progress-bar-container` 直接放在 `.progress-row` 内
- `progressRef` 仍挂在 `.progress-bar-container`，`onMouseDown={handleMouseDown}` 不变，拖拽逻辑完整保留

- [ ] **Step 2: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - 输出中不包含 "error TS"

- [ ] **Step 3: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.tsx && git commit -m "refactor(control-panel): 描述并入控制行，进度条提为独立全宽行，消除重复横条观感"`

---

### Task 2: 重构 ControlPanel CSS — 控制行行内描述 + 进度行全宽

**Depends on:** Task 1
**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.css:1-33`（control-panel + step-description + control-row 块）
- Modify: `src/components/ControlPanel/ControlPanel.css:143-169`（progress-group/progress-label/progress-bar-container 块）

- [ ] **Step 1: 替换 control-panel/step-description/control-row 样式块 — 描述改为行内可收缩**

文件: `src/components/ControlPanel/ControlPanel.css:1-33`（替换 `.control-panel` + `.step-description` + `.control-row` 三个块）

当前 `.step-description` 是 `width:100%` 独立横条（导致像第二个面板）。改为行内元素：在 control-row 内 flex:1 可收缩、ellipsis 截断，不再占满整行。

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
  flex: 1;
  min-width: 0;
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

.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
```

关键变化：
- `.step-description`：`width:100%` → `flex:1; min-width:0`（行内可收缩，长文本 ellipsis，不再独占整行横条），删除 `text-align:center`（行内左对齐更自然）
- `.control-panel`、`.control-row` 保持不变（column 容器 + row 居中换行）

- [ ] **Step 2: 替换 progress-group/progress-label/progress-bar-container 样式块 — 进度行全宽**

文件: `src/components/ControlPanel/ControlPanel.css:143-169`（替换 `.progress-group` + `.progress-label` + `.progress-bar-container` 三个块）

当前 `.progress-group` 有 `max-width:560px` 限制进度条宽度。改为 `.progress-row` 独占全宽（width:100%），进度条 flex:1 撑满整行无 max-width。

```css
.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
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
  min-width: 0;
}
```

关键变化：
- `.progress-group`（flex:1 + min-width:160px + max-width:560px）→ 重命名为 `.progress-row`（width:100%，无 max-width，独占全宽）
- `.progress-label` 保持不变
- `.progress-bar-container`：`min-width:100px` → `min-width:0`（在 progress-row 全宽内由 flex:1 撑满，无需固定最小宽度），保留 flex:1，无 max-width

- [ ] **Step 3: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - 输出中不包含 "error TS"

- [ ] **Step 4: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - 输出不包含 "error"

- [ ] **Step 5: 提交**
Run: `git add src/components/ControlPanel/ControlPanel.css && git commit -m "refactor(control-panel): 描述行内可收缩，进度行 width:100% 独占全宽"`

---

### Task 3: 验证 GitHub Action 自动部署配置

**Depends on:** None
**Files:**
- Verify: `.github/workflows/deploy.yml:3-7`

- [ ] **Step 1: 核对 deploy.yml 触发条件 — 确认每次 push 到 main 自动部署**

文件: `.github/workflows/deploy.yml:3-7`（`on:` 触发器块）

当前配置（已满足用户诉求，无需修改）:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

核对要点：
- `push.branches: [main]` 无 `paths` 限制 → 任意文件变更（代码、文档、配置）push 到 main 都触发
- `workflow_dispatch` → 支持手动触发
- 已满足用户"每次提交推送都能自动触发部署"诉求，无需改动

- [ ] **Step 2: 验证最近一次 push 是否成功触发部署**
Run: `gh run list --workflow=deploy.yml --limit=3`
Expected:
  - Exit code: 0
  - 输出包含最近 1-3 次部署记录，最近一次 status 为 success 或 completed
  - 若 gh 未认证或无记录，降级为：确认 `.github/workflows/deploy.yml` 存在且触发条件正确即可（Step 1 已确认）

- [ ] **Step 3: 提交（仅当本 Task 有改动时）**
Run: `git status --short`
Expected:
- 若无改动（配置已正确）→ 跳过提交，本 Task 为纯验证
- 若有改动 → `git add .github/workflows/deploy.yml && git commit -m "ci: 确认 GitHub Action 在 push 到 main 时自动部署"`

说明：本 Task 主要是验证确认。根据 Step 1 核对，deploy.yml 已满足诉求，预期无改动、无提交。Step 2 用 gh CLI 确认部署链路实际生效。
