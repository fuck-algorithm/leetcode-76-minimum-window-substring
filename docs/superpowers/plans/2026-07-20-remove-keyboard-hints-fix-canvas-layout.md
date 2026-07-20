# 删除底部键盘提示 + 修复 Canvas 垂直布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 删除页面底部纯展示的键盘快捷键提示文案（控制面板按钮已自带说明），并修复 Canvas 画布元素垂直布局——当前内容总高度仅约 241px 却从顶部 12px 开始向下排，导致高画布下内容全部挤在上半部分、底部大片空白。

**Architecture:** 数据流——Canvas 容器高度由 flex 布局动态决定（`.canvas-container` flex:1 撑满 `.left-panel`），D3 渲染时读取 `dimensions.height`，当前以 `topPad=12` 为顶部锚点向下累加 y 坐标、且 `scale` 上限锁死为 1，内容无法随高画布展开或居中。修复方式：计算内容实际总高 `actualContentHeight`，引入 `verticalOffset = max(0, (height - actualContentHeight) / 2)` 将整体下移垂直居中；同时放宽 `scale` 上限（如 1.4）让内容在高画布下适度放大填充。删除提示则直接移除 `App.tsx` 的 keyboard-hints JSX 块与 `App.css` 对应样式及响应式隐藏规则，键盘事件处理逻辑保留不动。

**Tech Stack:** React 18, TypeScript 5, D3 7, Vite 5

**Risks:**
- Task 2 放宽 `scale` 上限后，需保证矮画布（contentHeight > 画布高）时 `verticalOffset` 钳制为 0，避免内容被推到画布顶部之外被裁切 → 缓解：`Math.max(0, ...)` 钳制 + `scale` 下限 0.85 保留
- Task 2 放大 scale 后字符宽度 `charWidth` 与频次块 `freqWidth` 不受 scale 影响（它们用 width 而非 height 计算），横向不变，仅纵向间距放大，需确认放大后纵向不溢出 → 缓解：scale 上限取 1.4 而非过大，且 `verticalOffset` 在溢出时为 0 顶对齐

---

### Task 1: 删除底部键盘快捷键提示文案

**Depends on:** None
**Files:**
- Modify: `src/App.tsx:234-252`（删除 keyboard-hints JSX 区块）
- Modify: `src/App.css:200-231,267-269`（删除 keyboard-hints / hint-item / kbd 样式及 768px 响应式隐藏规则）

- [ ] **Step 1: 删除 App.tsx 的 keyboard-hints JSX 区块 — 移除页面底部纯展示提示**

控制面板按钮已自带功能说明，底部这行键盘提示属冗余展示，删除。键盘事件处理逻辑（App.tsx:57-101 的 handleKeyDown）保留，仅移除展示 DOM。

文件: `src/App.tsx:234-252`（删除整个 `<div className="keyboard-hints">...</div>` 区块，位于 ControlPanel 之后、`</div>`（container 闭合）之前）

删除后的上下文（ControlPanel 紧接 container 闭合标签）：

```typescript
            onSeek={setCurrentStep}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        </div>
      </main>
```

- [ ] **Step 2: 删除 App.css 的 keyboard-hints 相关样式 — 清理死代码 CSS**

文件: `src/App.css:200-231`（删除 `.keyboard-hints`、`.hint-item`、`.hint-item kbd` 三段样式）和 `src/App.css:267-269`（删除 768px 媒体查询内的 `.keyboard-hints { display: none; }` 规则）

删除后 200 行附近上下文（`.control-panel` 段直接接 `.footer` 段）：

```css
/* 控制面板：全宽底栏，按钮居中 */
.control-panel {
  width: 100%;
  flex-shrink: 0;
}

.footer {
```

768px 媒体查询删除 keyboard-hints 规则后上下文：

```css
@media (max-width: 768px) {
  .input-group {
    grid-template-columns: 1fr;
  }

  .title {
    font-size: 1.2rem;
  }

  .main {
    padding: 0.5rem;
  }
}
```

- [ ] **Step 3: 验证构建通过 — 确认删除后无残留引用导致编译失败**
Run: `npx vite build 2>&1 | tail -20`
Expected:
  - Exit code: 0
  - Output contains: "built in"
  - Output does NOT contain: "error" or "keyboard-hints"

- [ ] **Step 4: 提交**
Run: `git add src/App.tsx src/App.css && git commit -m "refactor(ui): 删除底部键盘快捷键提示文案，控制面板按钮已自带说明"`

---

### Task 2: 修复 Canvas 画布内容垂直布局

**Depends on:** None（与 Task 1 无依赖，但顺序执行）
**Files:**
- Modify: `src/components/Canvas/Canvas.tsx:44-72`（重写垂直布局：计算内容实际总高 + 垂直居中偏移 + 放宽 scale 上限）

- [ ] **Step 1: 重写 Canvas 垂直布局算法 — 内容垂直居中并随高画布适度放大**

当前布局以 `topPad=12` 为顶锚向下累加，`scale` 上限锁死 1，高画布下内容仅占 ~241px 全挤在上半。改为：先以 `topPad` 为基准计算各区块 y（相对坐标），累加得到 `actualContentHeight`，再算 `verticalOffset = Math.max(0, (height - actualContentHeight) / 2)`，所有 y 坐标加上该偏移实现垂直居中；`scale` 上限从 1 放宽到 1.4 让高画布下内容适度展开填充，下限保留 0.85 保护矮画布。

文件: `src/components/Canvas/Canvas.tsx:44-72`（替换整段垂直布局区块，从 `// 垂直布局` 注释行到 `const freqY = targetY + gap(25);` 行）

```typescript
    // 垂直布局：以 topPad 为顶锚计算各区块相对 y 坐标，累加得内容实际总高，
    // 再用 verticalOffset 把整体下移，实现高画布下内容垂直居中、消除底部大片空白。
    // scale 让整体布局随画布高度自适应（矮画布压缩间距，高画布展开填充），上限放宽到 1.4。
    const contentHeight = 248; // 各区块自然总高度基准（已移除画布内步骤说明框）
    const topPad = 12;
    const scale = Math.min(1.4, Math.max(0.85, (height - topPad * 2) / contentHeight));
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

    // 内容实际总高度：从 topPad 到频次块最后一行（freqY + 52）
    const actualContentHeight = freqY + 52 - topPad;
    // 垂直居中偏移：画布高于内容时把整体下移；内容高于画布时钳制为 0 顶对齐避免裁切
    const verticalOffset = Math.max(0, (height - actualContentHeight) / 2 - topPad / 2);

    // 应用垂直居中偏移：所有 y 坐标加上 verticalOffset
    const adjustedLegendY = legendY + verticalOffset;
    const adjustedTitleY = titleY + verticalOffset;
    const adjustedStringY = stringY + verticalOffset;
    const adjustedLeftPointerTopY = leftPointerTopY + verticalOffset;
    const adjustedRightPointerBottomY = rightPointerBottomY + verticalOffset;
    const adjustedStatusY = statusY + verticalOffset;
    const adjustedTargetY = targetY + verticalOffset;
    const adjustedFreqY = freqY + verticalOffset;
```

- [ ] **Step 2: 把后续绘制代码的 y 坐标引用替换为 adjusted 变量 — 让居中偏移生效**

上一步定义了 adjusted* 变量，但绘制代码仍引用旧的 legendY/stringY 等。需把所有 y 坐标引用改为 adjusted 版本。以下逐处替换：

**图例绘制**（Canvas.tsx:76,84,91,99,106,114 各行的 `legendY` → `adjustedLegendY`）：

```typescript
    // 绘制图例
    svg.append('rect')
      .attr('x', legendStartX)
      .attr('y', adjustedLegendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#f59e0b');
    svg.append('text')
      .attr('x', legendStartX + 20)
      .attr('y', adjustedLegendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('当前窗口');

    // 图例2: 最优解
    svg.append('rect')
      .attr('x', legendStartX + legendItemWidth)
      .attr('y', adjustedLegendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#10b981');
    svg.append('text')
      .attr('x', legendStartX + legendItemWidth + 20)
      .attr('y', adjustedLegendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('当前最优解');

    // 图例3: 窗口外字符
    svg.append('rect')
      .attr('x', legendStartX + legendItemWidth * 2)
      .attr('y', adjustedLegendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#374151');
    svg.append('text')
      .attr('x', legendStartX + legendItemWidth * 2 + 20)
      .attr('y', adjustedLegendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('窗口外');
```

- [ ] **Step 3: 替换标题与字符行绘制中的 y 引用 — titleY/stringY 改为 adjusted 版本**

文件: `src/components/Canvas/Canvas.tsx:127,141,148,153,160,169,213`

标题绘制（`:127` 的 `titleY` → `adjustedTitleY`）：

```typescript
    // 绘制标题
    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedTitleY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(`源字符串 s = "${s}"`);
```

窗口背景与最小覆盖子串背景（`:141` 和 `:154` 的 `stringY` → `adjustedStringY`）：

```typescript
    if (right > left) {
      g.append('rect')
        .attr('x', startX + left * charWidth - 4)
        .attr('y', adjustedStringY - 8)
        .attr('width', (right - left) * charWidth + 8)
        .attr('height', charHeight + 16)
        .attr('rx', 8)
        .attr('fill', 'rgba(245, 158, 11, 0.15)')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3');
    }

    // 绘制最小覆盖子串背景
    if (minStart >= 0 && minLen !== Infinity) {
      g.append('rect')
        .attr('x', startX + minStart * charWidth - 2)
        .attr('y', adjustedStringY - 4)
        .attr('width', minLen * charWidth + 4)
        .attr('height', charHeight + 8)
        .attr('rx', 6)
        .attr('fill', 'rgba(16, 185, 129, 0.2)')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2);
    }
```

字符行 translate（`:169` 的 `stringY` → `adjustedStringY`）：

```typescript
    const charGroup = g.selectAll('.char-group')
      .data(s.split(''))
      .enter()
      .append('g')
      .attr('class', 'char-group')
      .attr('transform', (_, i) => `translate(${startX + i * charWidth}, ${adjustedStringY})`);
```

索引文字（`:213` 的 `charHeight + 12` 相对偏移不变，但其父 g 已用 adjustedStringY 定位，无需再改）——保持原样。

- [ ] **Step 4: 替换左右指针绘制中的 y 引用 — leftPointerTopY/rightPointerBottomY 改为 adjusted 版本**

文件: `src/components/Canvas/Canvas.tsx:222,247`

左指针（`:222` 的 `leftPointerTopY` → `adjustedLeftPointerTopY`）：

```typescript
    // 绘制左指针（位于字符行上方独立区域）
    g.append('g')
      .attr('class', 'pointer-left')
      .attr('transform', `translate(${startX + left * charWidth + (charWidth - 4) / 2}, ${adjustedLeftPointerTopY})`)
```

右指针（`:247` 的 `rightPointerBottomY` → `adjustedRightPointerBottomY`）：

```typescript
      g.append('g')
        .attr('class', 'pointer-right')
        .attr('transform', `translate(${startX + (right - 1) * charWidth + (charWidth - 4) / 2}, ${adjustedRightPointerBottomY})`)
```

- [ ] **Step 5: 替换状态徽章、目标字符串、频次对比绘制中的 y 引用 — statusY/targetY/freqY 改为 adjusted 版本**

文件: `src/components/Canvas/Canvas.tsx:282,292,302,325,335,344,353,362,371`

状态徽章（`:282,292` 的 `statusY` → `adjustedStatusY`）：

```typescript
    g.append('rect')
      .attr('x', statusX)
      .attr('y', adjustedStatusY - 12)
      .attr('width', statusWidth)
      .attr('height', 22)
      .attr('rx', 11)
      .attr('fill', statusBgColor)
      .attr('stroke', statusColor)
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedStatusY + 3)
      .attr('text-anchor', 'middle')
      .attr('fill', statusColor)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(statusText);
```

目标字符串（`:302` 的 `targetY` → `adjustedTargetY`）：

```typescript
    // 绘制目标字符串
    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedTargetY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(`目标字符串 t = "${t}"`);
```

频次对比（`:325,335,344,353,362,371` 的 `freqY` → `adjustedFreqY`，频次块内部相对偏移 +6/+17/+26/+37/+52 不变）：

```typescript
    chars.forEach((char, i) => {
      const x = freqStartX + i * freqWidth;
      const needCount = needMap.get(char) || 0;
      const windowCount = windowMap.get(char) || 0;
      const isMatched = windowCount >= needCount;

      // 字符标签
      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fbbf24')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .text(char);

      // 需要的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', adjustedFreqY + 6)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#374151')
        .attr('stroke', '#4b5563');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + 17)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .text(`需要: ${needCount}`);

      // 窗口中的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', adjustedFreqY + 26)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', isMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
        .attr('stroke', isMatched ? '#10b981' : '#f59e0b');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + 37)
        .attr('text-anchor', 'middle')
        .attr('fill', isMatched ? '#10b981' : '#f59e0b')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(`窗口: ${windowCount}`);

      // 匹配标记
      if (isMatched) {
        g.append('text')
          .attr('x', x + freqWidth / 2)
          .attr('y', adjustedFreqY + 52)
          .attr('text-anchor', 'middle')
          .attr('fill', '#10b981')
          .attr('font-size', '12px')
          .text('✓');
      }
    });
```

- [ ] **Step 6: 验证构建通过 — 确认所有 adjusted 变量已替换且无未定义引用**
Run: `npx vite build 2>&1 | tail -20`
Expected:
  - Exit code: 0
  - Output contains: "built in"
  - Output does NOT contain: "error TS" or "is not defined"

- [ ] **Step 7: 提交**
Run: `git add src/components/Canvas/Canvas.tsx && git commit -m "fix(canvas): 内容垂直居中并放宽 scale 上限至 1.4，消除高画布下内容挤在上半、底部大片空白"`
