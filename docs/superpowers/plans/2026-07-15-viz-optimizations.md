# 算法可视化网站四项优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 优化 leetcode-76 算法可视化网站的四个方面：CI 任意提交即自动重新部署、画布元素不再重叠、Debug 模式单行高亮 + 变量值面板可见、控制面板移至页面最底部并全宽居中。

**Architecture:** CI 侧扩展 deploy.yml 触发条件并在 workflow 加部署状态总结步。前端侧分三层改动：数据层（algorithmCode.ts 的 stepToLines 改为每步骤单"当前执行行"，minWindowSteps.ts 补充变量快照字段）→ 视图层（CodePanel 用单行高亮 + 独立变量状态面板；Canvas 把所有垂直坐标从硬编码改为基于间距常量的累加计算，并随画布高度自适应缩放）→ 布局层（App.tsx 把 ControlPanel 从 left-panel 内移出，成为 main-content 之外、页面最底部的全宽栏，App.css 调整 grid/flex 结构）。设计选择：保留现有 D3 zoom、保留 Prism 高亮、保留多语言，只改数据映射与坐标计算，不引入新依赖。

**Tech Stack:** React 18, TypeScript 5, Vite 5, D3 7, PrismJS 1.30, GitHub Actions（actions/checkout@4, setup-node@4, upload-pages-artifact@3, deploy-pages@4）

**Risks:**
- Task 2 重算 Canvas 垂直坐标可能改变 D3 zoom 的视觉锚点 → 缓解：zoom transform 仅作用于 `main-group`，坐标重算不影响 zoom 逻辑，只重排静态元素
- Task 3 把 stepToLines 多行映射改为单行，需精确核对 4 语言 × 5 步骤共 20 个行号，行号错位会导致高亮到错误行 → 缓解：每语言都对照源码字符串逐行确认；保留原多行映射为 `stepToRelatedLines` 做淡色"相关行"提示，降低单行错位风险
- Task 4 改全局布局可能破坏 commit a392470 已实现的"单屏显示"目标 → 缓解：底栏用 `flex-shrink: 0` 固定高度，main-content 用 `flex: 1; min-height: 0`，控制面板内部按钮 `justify-content: center`
- Task 1 改 deploy.yml 触发条件若配置错误会导致部署不触发 → 缓解：保留 push 到 main 为核心触发，仅增加 paths 触发粒度，不删除现有配置

---

### Task 1: 扩展 GitHub Actions 部署触发条件

**Depends on:** None
**Files:**
- Modify: `.github/workflows/deploy.yml:3-10`

- [ ] **Step 1: 修改 deploy.yml 触发条件 — 使任意代码/内容提交到 main 都重新部署**
文件: `.github/workflows/deploy.yml:3-10`（替换 `on:` 触发块）

当前配置只有 `push.branches: main`，会忽略 paths 过滤以外的所有文件，且用户无法从 workflow run 列表快速看到"是否因本次提交而部署"。改为：push 到 main（不限制 paths，确保任何文件变更都触发）+ workflow_dispatch 手动触发 + 增加 deployment-status 总结步。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

说明：移除了 `cache: 'npm'` 之外的 paths 限制（原配置无 paths，本就全文件触发，此处保持不变并显式注释说明）。新增 `workflow_dispatch` 允许手动重新部署。核心是确认 push 到 main 即触发，无需 paths 过滤。

- [ ] **Step 2: 验证 workflow YAML 语法**
Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('YAML valid')"`
Expected:
  - Exit code: 0
  - Output contains: "YAML valid"

- [ ] **Step 3: 验证本地构建仍通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - Output contains: "dist" 或 "built"
  - Output does NOT contain: "error" 或 "Error"

- [ ] **Step 4: 提交**
Run: `git add .github/workflows/deploy.yml && git commit -m "ci: 扩展 GitHub Pages 部署触发条件，支持手动触发与任意提交重部署"`

---

### Task 2: 重构 Canvas 垂直布局以消除元素重叠

**Depends on:** None
**Files:**
- Modify: `src/components/Canvas/Canvas.tsx:39-381`
- Modify: `src/components/Canvas/Canvas.css:1-8`

- [ ] **Step 1: 修改 Canvas.css 增大容器最小高度 — 为重排后的元素留出垂直空间**
文件: `src/components/Canvas/Canvas.css:1-8`（替换 `.canvas-container` 块）

```css
.canvas-container {
  flex: 1;
  background: #111827;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  min-height: 280px;
}
```

说明：最小高度从 160px 提到 280px，避免内容在矮画布里被压缩重叠。

- [ ] **Step 2: 重构 Canvas.tsx 垂直坐标计算 — 用间距常量累加代替硬编码 y 值**
文件: `src/components/Canvas/Canvas.tsx:39-110`（替换从 `const { width, height } = dimensions;` 到创建 main-group `g` 之前的布局计算段，约 39-98 行）

根因：原代码用 `stringY=50`、`legendY=stringY-35=15`、`statusY=stringY+charHeight+30` 等绝对硬编码值，图例(y=15)与标题(y=20)、状态徽章与指针标签互相侵入。改为从顶部 padding 开始，按"区块高度 + 区块间距"逐段累加，并随画布高度自适应缩放系数。

```typescript
    const { width, height } = dimensions;
    const charWidth = Math.min(32, (width - 80) / s.length);
    const charHeight = 32;
    const startX = (width - s.length * charWidth) / 2;

    // 垂直布局：从顶部 padding 开始，按区块累加 y 坐标，消除重叠
    // scale 让整体布局随画布高度自适应（矮画布压缩间距，高画布展开）
    const contentHeight = 340; // 各区块自然总高度基准
    const topPad = 12;
    const scale = Math.min(1, Math.max(0.7, (height - topPad * 2) / contentHeight));
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

    // 区块 7：步骤说明（位于频次对比下方）
    const descY = freqY + gap(62);
```

- [ ] **Step 3: 更新图例绘制坐标引用 — 使用新的 legendY/legendStartX**
文件: `src/components/Canvas/Canvas.tsx`（图例绘制块，原 51-93 行）

```typescript
    // 绘制图例1: 当前窗口
    svg.append('rect')
      .attr('x', legendStartX)
      .attr('y', legendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#f59e0b');
    svg.append('text')
      .attr('x', legendStartX + 20)
      .attr('y', legendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('当前窗口');

    // 绘制图例2: 最优解
    svg.append('rect')
      .attr('x', legendStartX + legendItemWidth)
      .attr('y', legendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#10b981');
    svg.append('text')
      .attr('x', legendStartX + legendItemWidth + 20)
      .attr('y', legendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('当前最优解');

    // 绘制图例3: 窗口外字符
    svg.append('rect')
      .attr('x', legendStartX + legendItemWidth * 2)
      .attr('y', legendY - 8)
      .attr('width', 16)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', '#374151');
    svg.append('text')
      .attr('x', legendStartX + legendItemWidth * 2 + 20)
      .attr('y', legendY)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .text('窗口外');
```

- [ ] **Step 4: 更新左/右指针绘制坐标 — 使用独立计算的指针 y，避免与字符行/徽章重叠**
文件: `src/components/Canvas/Canvas.tsx`（左指针绘制块，原 195-218 行）

```typescript
    // 绘制左指针（位于字符行上方独立区域）
    g.append('g')
      .attr('class', 'pointer-left')
      .attr('transform', `translate(${startX + left * charWidth + (charWidth - 4) / 2}, ${leftPointerTopY})`)
      .call(g => {
        g.append('rect')
          .attr('x', -12)
          .attr('y', -10)
          .attr('width', 24)
          .attr('height', 16)
          .attr('rx', 3)
          .attr('fill', '#f59e0b');
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 3)
          .attr('fill', '#111827')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .text('L');
        g.append('path')
          .attr('d', `M0,${6} L-5,${14} L5,${14} Z`)
          .attr('fill', '#f59e0b');
      });
```

文件: `src/components/Canvas/Canvas.tsx`（右指针绘制块，原 221-244 行）

```typescript
    // 绘制右指针（位于字符行下方独立区域）
    if (right > 0) {
      g.append('g')
        .attr('class', 'pointer-right')
        .attr('transform', `translate(${startX + (right - 1) * charWidth + (charWidth - 4) / 2}, ${rightPointerBottomY})`)
        .call(g => {
          g.append('path')
            .attr('d', 'M0,-6 L-5,-14 L5,-14 Z')
            .attr('fill', '#10b981');
          g.append('rect')
            .attr('x', -12)
            .attr('y', -6)
            .attr('width', 24)
            .attr('height', 16)
            .attr('rx', 3)
            .attr('fill', '#10b981');
          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 7)
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .attr('font-weight', '700')
            .text('R');
        });
    }
```

说明：右指针原来用 `stringY + charHeight + 25`，与状态徽章 `statusY = stringY + charHeight + 30` 仅差 5px 必然重叠。现右指针用 `rightPointerBottomY`，状态徽章在其下方再留 18px 间距。

- [ ] **Step 5: 验证 Canvas 编译通过**
Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "Canvas" || echo "Canvas OK"`
Expected:
  - Exit code: 0
  - Output contains: "Canvas OK"（无 Canvas 相关类型错误）

- [ ] **Step 6: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - Output does NOT contain: "error"

- [ ] **Step 7: 提交**
Run: `git add src/components/Canvas/Canvas.tsx src/components/Canvas/Canvas.css && git commit -m "fix(canvas): 用间距常量累加重算垂直坐标，消除元素重叠"`

---

### Task 3: 修复 Debug 单行高亮并新增变量状态面板

**Depends on:** None
**Files:**
- Modify: `src/data/algorithmCode.ts:10-17,216-246,255-284`
- Modify: `src/algorithm/minWindowSteps.ts:13-24,54-63`
- Modify: `src/components/CodePanel/CodePanel.tsx:16-75,94-123`
- Modify: `src/components/CodePanel/CodePanel.css:116-129`

- [ ] **Step 1: 修改 algorithmCode.ts 类型定义 — 增加 stepToActiveLine 单行映射字段**
文件: `src/data/algorithmCode.ts:10-17`（替换 `AlgorithmCode` 接口）

```typescript
export interface AlgorithmCode {
  language: CodeLanguage;
  displayName: string;
  code: string;
  lines: CodeLine[];
  // 步骤类型到"当前执行行"的映射（单行，用于 Debug 高亮）
  stepToActiveLine: Record<string, number>;
  // 步骤类型到"相关代码行区间"的映射（多行，用于淡色提示）
  stepToRelatedLines: Record<string, number[]>;
}
```

- [ ] **Step 2: 修改 algorithmCode.ts 行号映射 — 将多行 stepToLines 拆为单行 active + 多行 related**
文件: `src/data/algorithmCode.ts:216-246`（替换四个 `*StepToLines` 常量定义）

每个步骤的"当前执行行"取该步骤语义核心行：init→声明起始行、expand→右指针右移行、found→更新 minLen 行、shrink→左指针右移行、complete→return 行。逐语言对照源码字符串确认行号。

```typescript
// 步骤类型到"当前执行行"（单行）的映射 —— Debug 高亮这一行
const jsStepToActiveLine: Record<string, number> = {
  init: 1,       // function minWindow(s, t) {
  expand: 34,    // const c = s[right];
  found: 48,     // if (right - left < minLen) {
  shrink: 54,    // const d = s[left];
  complete: 46,  // return ...
};

const pyStepToActiveLine: Record<string, number> = {
  init: 1,       // def minWindow(s: str, t: str) -> str:
  expand: 13,    // c = s[right]
  found: 24,     // if right - left < min_len:
  shrink: 29,    // d = s[left]
  complete: 38,
};

const javaStepToActiveLine: Record<string, number> = {
  init: 1,
  expand: 13,    // char c = s.charAt(right);
  found: 26,     // if (right - left < minLen) {
  shrink: 32,    // char d = s.charAt(left);
  complete: 44,
};

const goStepToActiveLine: Record<string, number> = {
  init: 1,
  expand: 13,    // c := s[right]
  found: 26,     // if right-left < minLen {
  shrink: 32,    // d := s[left]
  complete: 44,
};

// 步骤类型到"相关代码行区间"的映射 —— 淡色提示整段（保留原多行映射）
const jsStepToRelatedLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22, 23],
  found: [27, 28, 29, 30],
  shrink: [33, 34, 35, 37, 38, 39, 40, 41],
  complete: [46],
};

const pyStepToRelatedLines: Record<string, number[]> = {
  init: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  expand: [12, 13, 14, 15, 17, 18, 19, 20],
  found: [24, 25, 26],
  shrink: [29, 30, 31, 33, 34, 35, 36],
  complete: [38],
};

const javaStepToRelatedLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22],
  found: [26, 27, 28, 29],
  shrink: [32, 33, 34, 36, 37, 38, 39, 40],
  complete: [44],
};

const goStepToRelatedLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22],
  found: [26, 27, 28, 29],
  shrink: [32, 33, 34, 36, 37, 38, 39, 40],
  complete: [44, 45, 46],
};
```

- [ ] **Step 3: 修改 algorithmCode.ts 导出对象 — 用新字段名替换 stepToLines**
文件: `src/data/algorithmCode.ts:255-284`（替换 `algorithmCodes` 导出对象）

```typescript
export const algorithmCodes: Record<CodeLanguage, AlgorithmCode> = {
  javascript: {
    language: 'javascript',
    displayName: 'JavaScript',
    code: javascriptCode,
    lines: parseCodeLines(javascriptCode),
    stepToActiveLine: jsStepToActiveLine,
    stepToRelatedLines: jsStepToRelatedLines,
  },
  python: {
    language: 'python',
    displayName: 'Python',
    code: pythonCode,
    lines: parseCodeLines(pythonCode),
    stepToActiveLine: pyStepToActiveLine,
    stepToRelatedLines: pyStepToRelatedLines,
  },
  java: {
    language: 'java',
    displayName: 'Java',
    code: javaCode,
    lines: parseCodeLines(javaCode),
    stepToActiveLine: javaStepToActiveLine,
    stepToRelatedLines: javaStepToRelatedLines,
  },
  golang: {
    language: 'golang',
    displayName: 'Go',
    code: golangCode,
    lines: parseCodeLines(golangCode),
    stepToActiveLine: goStepToActiveLine,
    stepToRelatedLines: goStepToRelatedLines,
  },
};
```

- [ ] **Step 4: 修改 minWindowSteps.ts 的 variables 字段 — 补充 needStr 已有，确认字段完整供面板使用**
文件: `src/algorithm/minWindowSteps.ts:13-24`（替换 `variables` 类型定义）

当前 variables 已含 left/right/valid/start/minLen/currentChar/windowStr/needStr，足够面板显示。补充 `type` 字段让面板能标注当前步骤类型。

```typescript
  // 变量状态，用于代码调试显示
  variables: {
    type: string;
    left: number;
    right: number;
    valid: number;
    start: number;
    minLen: number | string;
    currentChar?: string;
    windowStr: string;
    needStr: string;
  };
```

文件: `src/algorithm/minWindowSteps.ts:54-63`（替换 `createVariables` 函数，加入 type 参数）

```typescript
  const createVariables = (currentChar?: string) => ({
    type: '', // 由调用处覆盖
    left,
    right,
    valid,
    start,
    minLen: minLen === Infinity ? '∞' : minLen,
    currentChar,
    windowStr: formatMap(window),
    needStr: formatMap(need),
  });
```

说明：`type` 字段在每处 `steps.push` 时通过 `variables: { ...createVariables(), type: 'init' }` 形式覆盖。需在 5 处 `steps.push`（init/expand/found×多次/shrink/complete）的 `variables` 字段后追加 `type`。以 init 为例：

文件: `src/algorithm/minWindowSteps.ts:65-76`（init step 的 push，替换 variables 字段行）

```typescript
  steps.push({
    type: 'init',
    left,
    right,
    window: new Map(),
    valid,
    minStart: -1,
    minLen: Infinity,
    description: `📋 初始化：统计目标字符串 "${t}" 中每个字符的频次。需要找到 s 中包含这些字符的最短子串。`,
    need: new Map(need),
    variables: { ...createVariables(), type: 'init' },
  });
```

对其余 4 处 `steps.push`（expand 行 102、found 行 120、shrink 行 154、complete 行 170）的 `variables: createVariables(...)` 行，统一改为 `variables: { ...createVariables(...), type: '对应类型' }`，对应类型分别为 `'expand'`、`'found'`、`'shrink'`、`'complete'`。

- [ ] **Step 5: 重写 CodePanel.tsx — 单行 active 高亮 + related 淡色 + 独立变量状态面板**
文件: `src/components/CodePanel/CodePanel.tsx`（整体替换 import 到组件结束，行 1-129）

根因：原 `highlightedLines = codeData.stepToLines[currentStep.type]` 高亮整段多行。改为：activeLine 单行高亮（强），relatedLines 多行淡色提示（弱）。新增独立 `variables-panel` 区块，始终显示当前步骤所有变量最新值 + window/need map，不再依赖脆弱的 `line.includes` 匹配。

```typescript
import React, { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import { algorithmCodes, CodeLanguage, languageOptions } from '../../data/algorithmCode';
import { getCodeLanguage, setCodeLanguage } from '../../utils/storage';
import { AlgorithmStep } from '../../algorithm/minWindowSteps';
import './CodePanel.css';

interface CodePanelProps {
  currentStep: AlgorithmStep | null;
}

const STEP_LABELS: Record<string, string> = {
  init: '初始化',
  expand: '扩张窗口',
  found: '找到覆盖',
  shrink: '收缩窗口',
  complete: '完成',
};

const CodePanel: React.FC<CodePanelProps> = ({ currentStep }) => {
  const [language, setLanguage] = useState<CodeLanguage>('java');

  useEffect(() => {
    getCodeLanguage().then((lang) => {
      if (lang && algorithmCodes[lang as CodeLanguage]) {
        setLanguage(lang as CodeLanguage);
      }
    });
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [language]);

  const handleLanguageChange = (newLang: CodeLanguage) => {
    setLanguage(newLang);
    setCodeLanguage(newLang);
  };

  const codeData = algorithmCodes[language];
  const stepType = currentStep?.type ?? '';
  // 当前执行行：单行高亮
  const activeLine = currentStep ? codeData.stepToActiveLine[stepType] : undefined;
  // 相关行区间：淡色提示
  const relatedLines = currentStep ? codeData.stepToRelatedLines[stepType] || [] : [];

  const getPrismLanguage = (lang: CodeLanguage): string => {
    const map: Record<CodeLanguage, string> = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      golang: 'go',
    };
    return map[lang];
  };

  // 滚动到当前 active 行
  useEffect(() => {
    if (activeLine !== undefined) {
      const el = document.querySelector(`.code-line[data-line="${activeLine}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeLine, language]);

  const vars = currentStep?.variables;

  return (
    <div className="code-panel">
      <div className="code-header">
        <h3>算法代码</h3>
        <div className="language-tabs">
          {languageOptions.map((opt) => (
            <button
              key={opt.value}
              className={`lang-tab ${language === opt.value ? 'active' : ''}`}
              onClick={() => handleLanguageChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {vars && (
        <div className="variables-panel">
          <div className="variables-panel-title">
            变量状态{stepType ? ` · ${STEP_LABELS[stepType] ?? stepType}` : ''}
          </div>
          <div className="variables-grid">
            <div className="var-chip"><span className="var-key">left</span><span className="var-val">{vars.left}</span></div>
            <div className="var-chip"><span className="var-key">right</span><span className="var-val">{vars.right}</span></div>
            <div className="var-chip"><span className="var-key">valid</span><span className="var-val">{vars.valid}</span></div>
            <div className="var-chip"><span className="var-key">start</span><span className="var-val">{vars.start}</span></div>
            <div className="var-chip"><span className="var-key">minLen</span><span className="var-val">{String(vars.minLen)}</span></div>
            {vars.currentChar && (
              <div className="var-chip"><span className="var-key">当前字符</span><span className="var-val">{vars.currentChar}</span></div>
            )}
          </div>
          <div className="var-map-row">
            <div className="var-map"><span className="var-key">window</span><code>{vars.windowStr}</code></div>
            <div className="var-map"><span className="var-key">need</span><code>{vars.needStr}</code></div>
          </div>
        </div>
      )}

      <div className="code-container">
        <div className="code-lines">
          {codeData.lines.map((line, index) => {
            const lineNum = index + 1;
            const isActive = activeLine === lineNum;
            const isRelated = !isActive && relatedLines.includes(lineNum);

            return (
              <div
                key={lineNum}
                data-line={lineNum}
                className={`code-line ${isActive ? 'highlighted' : ''} ${isRelated ? 'related' : ''}`}
              >
                <span className="line-number">{lineNum}</span>
                <pre className="line-code">
                  <code
                    className={`language-${getPrismLanguage(language)}`}
                    dangerouslySetInnerHTML={{
                      __html: Prism.highlight(
                        line.code,
                        Prism.languages[getPrismLanguage(language)],
                        getPrismLanguage(language)
                      )
                    }}
                  />
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CodePanel;
```

- [ ] **Step 6: 修改 CodePanel.css — 新增变量面板样式 + related 行淡色样式**
文件: `src/components/CodePanel/CodePanel.css:116-129`（在 `.var-value` 块之后、Prism 主题之前插入新样式，并保留原 `.var-annotation`/`.var-value` 避免破坏，实际可保留原样式不动）

在 `.var-value` 规则块（原 116-129 行）之后追加：

```css
/* 变量状态面板 */
.variables-panel {
  background: #1a1a1a;
  border-bottom: 1px solid #3c3c3c;
  padding: 0.3rem 0.5rem;
  flex-shrink: 0;
}

.variables-panel-title {
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.variables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-bottom: 0.25rem;
}

.var-chip {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: #2d2d2d;
  border: 1px solid #3c3c3c;
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
  font-size: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.var-chip .var-key {
  color: #9ca3af;
}

.var-chip .var-val {
  color: #fbbf24;
  font-weight: 600;
}

.var-map-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.var-map {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 10px;
}

.var-map .var-key {
  color: #9ca3af;
  font-size: 10px;
}

.var-map code {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.05rem 0.3rem;
  border-radius: 2px;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 相关行淡色提示（非当前执行行） */
.code-line.related {
  background: rgba(96, 165, 250, 0.06);
  border-left: 2px solid rgba(96, 165, 250, 0.25);
}

.code-line.related::before {
  content: '';
}
```

- [ ] **Step 7: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "algorithmCode|minWindowSteps|CodePanel" || echo "Types OK"`
Expected:
  - Exit code: 0
  - Output contains: "Types OK"（无相关类型错误）

- [ ] **Step 8: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - Output does NOT contain: "error"

- [ ] **Step 9: 提交**
Run: `git add src/data/algorithmCode.ts src/algorithm/minWindowSteps.ts src/components/CodePanel/CodePanel.tsx src/components/CodePanel/CodePanel.css && git commit -m "feat(code-panel): Debug 单行高亮当前执行行，新增变量状态面板显示最新值"`

---

### Task 4: 控制面板移至页面最底部并全宽居中

**Depends on:** Task 3（CodePanel 变量面板已就位，避免布局重组时冲突）
**Files:**
- Modify: `src/App.tsx:197-230`
- Modify: `src/App.css:170-193,238-247`

- [ ] **Step 1: 修改 App.tsx — 把 ControlPanel 从 left-panel 移出，作为 main-content 之后的独立全宽底栏**
文件: `src/App.tsx:197-230`（替换 `.main-content` 区块，将 ControlPanel 移到其下方）

```tsx
          <div className="main-content">
            <div className="left-panel">
              <Canvas s={s} t={t} currentStep={currentStepData} />
            </div>

            <div className="right-panel">
              <CodePanel currentStep={currentStepData} />
            </div>
          </div>

          <ControlPanel
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onPrev={() => {
              if (currentStep > 0) {
                setCurrentStep(prev => prev - 1);
                setIsPlaying(false);
              }
            }}
            onNext={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
              }
            }}
            onReset={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
            onSeek={setCurrentStep}
            speed={speed}
            onSpeedChange={setSpeed}
          />
```

说明：ControlPanel 不再嵌在 `.left-panel` 内，而是 `.main-content` 的兄弟节点，位于其下方，作为页面最底部的全宽控制栏。`keyboard-hints` 区块保持在 ControlPanel 之后或之前均可（当前顺序 keyboard-hints 在 main-content 之后，现 ControlPanel 也放其后；为满足"控制面板在最底部"，需把 ControlPanel 放在 keyboard-hints 之前，让 keyboard-hints 作为最末尾）。实际上 keyboard-hints 较小，可保留在 ControlPanel 之下。最终结构：input-panel → main-content → ControlPanel → keyboard-hints。

- [ ] **Step 2: 修改 App.css — main-content 不再包含控制面板，left-panel 只放 Canvas**
文件: `src/App.css:170-193`（替换 `.main-content` / `.left-panel` / `.right-panel` 块）

```css
/* 主内容区域 - 两栏布局（Canvas | CodePanel） */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 控制面板：全宽底栏，按钮居中 */
.control-panel {
  width: 100%;
  flex-shrink: 0;
}
```

- [ ] **Step 3: 修改 ControlPanel.css — 全宽自适应、按钮居中**
文件: `src/components/ControlPanel/ControlPanel.css:1-9`（替换 `.control-panel` 块）

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
  flex-shrink: 0;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

说明：改为 `flex-direction: row` + `justify-content: center`，让控制按钮、速度、进度条在一行内居中排布，宽度撑满页面。`flex-wrap: wrap` 保证窄屏自动换行仍居中。

- [ ] **Step 4: 验证类型检查通过**
Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "App\.tsx|ControlPanel" || echo "Types OK"`
Expected:
  - Exit code: 0
  - Output contains: "Types OK"

- [ ] **Step 5: 验证构建通过**
Run: `npm run build`
Expected:
  - Exit code: 0
  - Output does NOT contain: "error"

- [ ] **Step 6: 提交**
Run: `git add src/App.tsx src/App.css src/components/ControlPanel/ControlPanel.css && git commit -m "refactor(layout): 控制面板移至页面最底部全宽居中，不再被代码面板挤压"`

---

### Task 5: 集成验证

**Depends on:** Task 1, Task 2, Task 3, Task 4
**Files:**
- None（仅验证）

- [ ] **Step 1: 全量类型检查**
Run: `npx tsc --noEmit -p tsconfig.json`
Expected:
  - Exit code: 0
  - Output does NOT contain: "error TS"

- [ ] **Step 2: 全量构建**
Run: `npm run build`
Expected:
  - Exit code: 0
  - Output contains: "dist" 或 "built in"
  - Output does NOT contain: "error" 或 "Error"

- [ ] **Step 3: 验证 dist 产物生成**
Run: `ls dist/ && ls dist/assets/ | head -5`
Expected:
  - Exit code: 0
  - Output contains: "index.html" 和 "assets"

- [ ] **Step 4: 验证 deploy.yml 仍存在且有效**
Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('deploy.yml valid')"`
Expected:
  - Exit code: 0
  - Output contains: "deploy.yml valid"
