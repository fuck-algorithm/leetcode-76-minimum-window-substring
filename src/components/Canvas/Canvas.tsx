import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from '../../algorithm/minWindowSteps';
import './Canvas.css';

interface CanvasProps {
  s: string;
  t: string;
  currentStep: AlgorithmStep | null;
  stepDescription?: string;
}

const Canvas: React.FC<CanvasProps> = ({ s, t, currentStep, stepDescription }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // 用 ResizeObserver 跟随网格重排，避免初次测量到隐藏/折叠尺寸后画布停留在 16×16。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width: Math.max(1, width - 20), height: Math.max(1, height - 20) });
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    updateDimensions();
    return () => observer.disconnect();
  }, []);

  // D3 渲染
  useEffect(() => {
    if (!svgRef.current || !currentStep) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.append('defs').append('marker')
      .attr('id', 'focus-arrow-head')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M0,0 L10,5 L0,10 z')
      .attr('fill', '#fbbf24');
    const flowMarkers = svg.select('defs');
    for (const [id, color, orient] of [['flow-in-head', '#34d399', 'auto-start-reverse'], ['flow-out-head', '#fb7185', 'auto']]) {
      flowMarkers.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', orient)
        .append('path')
        .attr('d', 'M0,0 L10,5 L0,10 z')
        .attr('fill', color);
    }

    const width = Math.max(dimensions.width, s.length * 26 + 24);
    const height = Math.max(dimensions.height, 640);
    const minCharWidth = 26;
    const charWidth = Math.max(minCharWidth, Math.min(32, (width - 80) / s.length));
    const charHeight = 32;
    const contentWidth = s.length * charWidth;
    const startX = Math.max(12, (width - contentWidth) / 2);

    // Anchor the same teaching lanes to the top edge at every viewport size; do not re-center
    // individual lanes, which made pointers, frequency cards and status badges drift apart.
    const gap = (base: number) => base;
    const legendY = 22;
    const legendItemWidth = 100;
    const legendStartX = (width - legendItemWidth * 3) / 2;
    const titleY = 48;
    const stringY = 148;
    const leftPointerTopY = stringY - 22;
    const rightPointerTopY = stringY + charHeight + 54;
    const statusY = stringY + charHeight + 126;
    const targetY = statusY + 42;
    const freqY = targetY + 78;
    const adjustedLegendY = legendY;
    const adjustedTitleY = titleY;
    const adjustedStringY = stringY;
    const adjustedLeftPointerTopY = leftPointerTopY;
    const adjustedRightPointerBottomY = rightPointerTopY;
    const adjustedStatusY = statusY;
    const adjustedTargetY = targetY;
    const adjustedFreqY = freqY;
    const flowTrackY = stringY + charHeight + 146;
    const infoShiftY = 0;

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

    // 创建主容器
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', transform.toString());

    const { left, right, minStart, minLen } = currentStep;
    const windowByChar = new Map<string, number>();
    for (let index = left; index < right; index++) {
      const char = s[index];
      windowByChar.set(char, (windowByChar.get(char) || 0) + 1);
    }

    // 操作徽标与本步指向的字符索引，让文字解释能对应到具体格子。
    const operationWidth = Math.max(86, currentStep.operation.length * 12 + 24);
    const titleMaxChars = Math.max(8, Math.floor((width - operationWidth - 40) / 7));
    const sourceTitle = `源字符串 s = "${s}"`;
    const displayTitle = sourceTitle.length > titleMaxChars
      ? `${sourceTitle.slice(0, titleMaxChars - 1)}…`
      : sourceTitle;
    const focusIndex = currentStep.currentIndex;

    // 给右侧徽标预留固定区域，源字符串过长时省略，避免标题与徽标叠字。
    g.append('text')
      .attr('x', 12)
      .attr('y', adjustedTitleY)
      .attr('text-anchor', 'start')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(displayTitle)
      .append('title')
      .text(sourceTitle);
    const focusX = focusIndex === undefined
      ? width / 2
      : startX + focusIndex * charWidth + (charWidth - 4) / 2;
    g.append('rect')
      .attr('class', 'operation-badge')
      .attr('x', width - operationWidth - 12)
      .attr('y', adjustedTitleY - 16)
      .attr('width', operationWidth)
      .attr('height', 22)
      .attr('rx', 11)
      .attr('fill', '#1f6b57')
      .attr('stroke', '#34d399');
    g.append('text')
      .attr('class', 'operation-badge-text')
      .attr('x', width - operationWidth / 2 - 12)
      .attr('y', adjustedTitleY - 1)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ecfdf5')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text(currentStep.operation);

    const showFlow = ['expand', 'skip', 'compare', 'found', 'shrink'].includes(currentStep.type);
    if (showFlow && focusIndex !== undefined && focusIndex >= 0 && focusIndex < s.length) {
      const isRemoval = currentStep.type === 'shrink';
      const flowStart = currentStep.type === 'compare' || currentStep.type === 'found'
        ? startX + left * charWidth
        : focusX + (isRemoval ? -8 : 8);
      const flowEnd = currentStep.type === 'compare' || currentStep.type === 'found'
        ? startX + right * charWidth - 4
        : focusX + (isRemoval ? -24 : 24);
      const flowColor = isRemoval ? '#fb7185' : '#34d399';
      const flowCount = currentStep.currentChar
        ? windowByChar.get(currentStep.currentChar) || 0
        : 0;
      const needCount = currentStep.currentChar
        ? currentStep.need.get(currentStep.currentChar) || 0
        : 0;
      const flowText = isRemoval
        ? `${currentStep.currentChar}：窗口 ${flowCount + 1} → ${flowCount} / 需要 ${needCount}；valid=${currentStep.valid}`
        : currentStep.type === 'skip'
          ? `${currentStep.currentChar}：不在 need，跳过计数`
          : currentStep.type === 'compare' || currentStep.type === 'found'
            ? `候选 [${left}, ${right})：${currentStep.result ?? ''} · 长度 ${right - left}；最优 ${currentStep.minLen === Infinity ? '尚无' : currentStep.minLen}`
            : `${currentStep.currentChar}：${Math.max(0, flowCount - 1)} → ${flowCount} / 需要 ${needCount}；valid=${currentStep.valid}`;
      const flowWidth = Math.min(width - 24, Math.max(112, flowText.length * 6 + 20));
      const flowX = width - flowWidth - 12;
      const flowY = flowTrackY + infoShiftY;

      g.append('rect')
        .attr('class', 'data-flow-label')
        .attr('x', flowX)
        .attr('y', flowY - 14)
        .attr('width', flowWidth)
        .attr('height', 20)
        .attr('rx', 8)
        .attr('fill', '#111827')
        .attr('stroke', flowColor);
      g.append('text')
        .attr('class', 'data-flow-text')
        .attr('x', flowX + flowWidth / 2)
        .attr('y', flowY)
        .attr('text-anchor', 'middle')
        .attr('fill', flowColor)
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(flowText);
      g.append('path')
        .attr('class', 'data-flow-arrow')
        .attr('d', `M${flowStart},${flowY - 10} Q${(flowStart + flowEnd) / 2},${flowY - 22} ${flowEnd},${flowY - 10}`)
        .attr('fill', 'none')
        .attr('stroke', flowColor)
        .attr('stroke-width', 1.5)
        .attr('marker-end', `url(#${isRemoval ? 'flow-out-head' : 'flow-in-head'})`);
    }

    if (focusIndex !== undefined && focusIndex >= 0 && focusIndex < s.length && currentStep.type !== 'compare') {
      g.append('path')
        .attr('class', 'focus-arrow')
        .attr('d', `M${focusX},${adjustedStringY - 22 + infoShiftY} L${focusX},${adjustedStringY - 7 + infoShiftY}`)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#focus-arrow-head)');
      const sharesLeftPointer = focusIndex === currentStep.left;
      g.append('text')
        .attr('class', 'focus-index-label')
        .attr('x', focusX + (sharesLeftPointer ? 18 : 0))
        .attr('y', adjustedStringY - 27 + infoShiftY)
        .attr('text-anchor', sharesLeftPointer ? 'start' : 'middle')
        .attr('fill', '#fbbf24')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text(`${currentStep.type === 'shrink' ? '移出' : currentStep.type === 'found' ? '记录候选' : currentStep.operation.includes('跳过') ? '判断' : '读取'} [${focusIndex}]`);
    }

    // 绘制窗口背景
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

    // 历史最优答案使用字符行上方的范围标记，避免覆盖当前窗口字符填色。
    if (minStart >= 0 && minLen !== Infinity) {
      const bestStartX = startX + minStart * charWidth - 2;
      const bestEndX = startX + (minStart + minLen) * charWidth - 2;
      g.append('path')
        .attr('class', 'best-window-range')
        .attr('d', `M${bestStartX},${adjustedStringY - 8} v-6 H${bestEndX} v6`)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2);
      g.append('text')
        .attr('class', 'best-window-label')
        .attr('x', (bestStartX + bestEndX) / 2)
        .attr('y', adjustedStringY - 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6ee7b7')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(`历史最优 [${minStart}, ${minStart + minLen}) · ${s.substring(minStart, minStart + minLen)}`);
    }

    const bestWindowLabel = minStart >= 0 && minLen !== Infinity
      ? `历史最优 [${minStart}, ${minStart + minLen}) · ${s.substring(minStart, minStart + minLen)}`
      : '历史最优：尚无';
    const currentWindowLabel = `当前窗口 [${left}, ${right}) · ${right > left ? s.substring(left, right) : '空'}`;
    const currentWindowLabelY = adjustedStringY + charHeight + 27;
    g.append('text')
      .attr('class', 'current-window-label')
      .attr('x', width / 2)
      .attr('y', currentWindowLabelY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fcd34d')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text(currentWindowLabel);
    g.append('text')
      .attr('class', 'best-window-label')
      .attr('x', width / 2)
      .attr('y', currentWindowLabelY + 13)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6ee7b7')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text(bestWindowLabel);

    // 绘制字符；当前窗口橙色填充始终优先，历史最优只用绿色上沿标记。
    const charGroup = g.selectAll('.char-group')
      .data(s.split(''))
      .enter()
      .append('g')
      .attr('class', 'char-group')
      .attr('transform', (_, i) => `translate(${startX + i * charWidth}, ${adjustedStringY})`);

    charGroup.append('rect')
      .attr('width', charWidth - 4)
      .attr('height', charHeight)
      .attr('rx', 6)
      .attr('fill', (_, i) => {
        if (i >= left && i < right) return '#f59e0b';
        if (minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) return '#10b981';
        return '#374151';
      })
      .attr('stroke', (_, i) => {
        if (i >= left && i < right) return '#d97706';
        if (minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) return '#059669';
        return '#4b5563';
      })
      .attr('stroke-width', 2);

    charGroup.append('text')
      .attr('x', (charWidth - 4) / 2)
      .attr('y', charHeight / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', (_, i) => {
        if (i >= left && i < right) return '#111827';
        if (minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) return '#111827';
        return '#e0e0e0';
      })
      .attr('font-size', '14px')
      .attr('font-weight', '700')
      .text(d => d);

    // 绘制索引
    charGroup.append('text')
      .attr('x', (charWidth - 4) / 2)
      .attr('y', charHeight + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '9px')
      .text((_, i) => i.toString());

    // 绘制左指针（位于字符行上方独立区域）
    g.append('g')
      .attr('class', 'pointer-left')
      .attr('transform', `translate(${startX + left * charWidth + (charWidth - 4) / 2}, ${adjustedLeftPointerTopY})`)
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
          .attr('d', 'M0,6 L-5,14 L5,14 Z')
          .attr('fill', '#f59e0b');
      });

    // R 标记半开窗口的排他边界，即下一个不包含的字符位置。
    {
      g.append('g')
        .attr('class', 'pointer-right')
        .attr('transform', `translate(${startX + right * charWidth - 2}, ${adjustedRightPointerBottomY})`)
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
          g.append('text')
            .attr('class', 'right-boundary-caption')
            .attr('text-anchor', 'start')
            .attr('x', 15)
            .attr('y', 7)
            .attr('fill', '#a7f3d0')
            .attr('font-size', '9px')
            .text('不含');
        });
    }

    // 计算窗口是否满足条件
    const isWindowValid = currentStep.valid === currentStep.need.size && currentStep.need.size > 0;
    
    // 绘制窗口状态徽章
    const statusText = isWindowValid ? '窗口满足条件 ✓' : '窗口不满足条件 ✗';
    const statusColor = isWindowValid ? '#10b981' : '#ef4444';
    const statusBgColor = isWindowValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    
    const statusWidth = statusText.length * 12 + 20;
    const statusX = (width - statusWidth) / 2;
    const resultText = currentStep.type === 'complete'
      ? currentStep.result
        ? `结果 ${currentStep.result} · [${currentStep.minStart}, ${currentStep.minStart + currentStep.minLen}) · 长度 ${currentStep.minLen}`
        : '结果为空 · 不存在覆盖窗口'
      : '';
    const bestLabel = minStart >= 0 && minLen !== Infinity
      ? `历史最优 [${minStart}, ${minStart + minLen}) · ${s.substring(minStart, minStart + minLen)}`
      : '历史最优：尚无';
    
    g.append('rect')
      .attr('x', statusX)
      .attr('y', adjustedStatusY + 8 + infoShiftY)
      .attr('width', statusWidth)
      .attr('height', 22)
      .attr('rx', 11)
      .attr('fill', statusBgColor)
      .attr('stroke', statusColor)
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedStatusY + 23 + infoShiftY)
      .attr('text-anchor', 'middle')
      .attr('fill', statusColor)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(statusText);
    if (resultText) {
      g.append('rect')
        .attr('class', 'final-result-card')
        .attr('x', Math.max(12, width / 2 - Math.min(width - 24, resultText.length * 7 + 24) / 2))
        .attr('y', adjustedStatusY + 42 + infoShiftY)
        .attr('width', Math.min(width - 24, resultText.length * 7 + 24))
        .attr('height', 26)
        .attr('rx', 8)
        .attr('fill', '#064e3b')
        .attr('stroke', '#34d399');
      g.append('text')
        .attr('class', 'final-result-text')
        .attr('x', width / 2)
        .attr('y', adjustedStatusY + 59 + infoShiftY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#d1fae5')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text(resultText);
    }

    // 绘制目标字符串
    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedTargetY + 24 + infoShiftY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(`valid = ${currentStep.valid} / ${currentStep.need.size} 种字符达标`);
    g.append('text')
      .attr('x', width / 2)
      .attr('y', adjustedTargetY + 38 + infoShiftY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text(`目标 t = "${t}" · 每种字符的频次达标才计 1`);

    // 绘制字符频次对比
    const needMap = currentStep.need;
    const windowMap = currentStep.window;
    const chars = Array.from(needMap.keys()).sort();
    const freqWidth = Math.min(60, (width - 80) / chars.length);
    const freqStartX = (width - chars.length * freqWidth) / 2;

    chars.forEach((char, i) => {
      const x = freqStartX + i * freqWidth;
      const needCount = needMap.get(char) || 0;
      const windowCount = windowMap.get(char) || 0;
      const isMatched = windowCount >= needCount;

      // 字符标签
      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + infoShiftY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fbbf24')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .text(char);

      // 需要的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', adjustedFreqY + 6 + infoShiftY)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#374151')
        .attr('stroke', '#4b5563');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + 17 + infoShiftY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .text(`需要: ${needCount}`);

      // 窗口中的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', adjustedFreqY + 26 + infoShiftY)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', isMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
        .attr('stroke', isMatched ? '#10b981' : '#f59e0b');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + 37 + infoShiftY)
        .attr('text-anchor', 'middle')
        .attr('fill', isMatched ? '#10b981' : '#f59e0b')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(`窗口: ${windowCount}`);

      // 匹配标记
      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', adjustedFreqY + 52 + infoShiftY)
        .attr('text-anchor', 'middle')
        .attr('fill', isMatched ? '#10b981' : '#fbbf24')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(isMatched ? '达标' : `差 ${Math.max(0, needCount - windowCount)}`);
    });

    // 缩放功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

  }, [s, t, currentStep, dimensions, transform]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <section className="canvas-step-explainer" aria-live="polite" aria-label="当前步骤说明">
        <span className="canvas-step-kicker">当前步骤 · {currentStep?.operation ?? '等待开始'}</span>
        <p>{stepDescription ?? '点击下一步，开始观察窗口如何扩张。'}</p>
      </section>
      <svg
        ref={svgRef}
        width={Math.max(dimensions.width, s.length * 26 + 24)}
        height={Math.max(dimensions.height, 430)}
        className="algorithm-canvas"
      />
      <div className="canvas-hint">
        拖拽平移 | 滚轮缩放
      </div>
    </div>
  );
};

export default Canvas;
