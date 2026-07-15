import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from '../../algorithm/minWindowSteps';
import './Canvas.css';

interface CanvasProps {
  s: string;
  t: string;
  currentStep: AlgorithmStep | null;
}

const Canvas: React.FC<CanvasProps> = ({ s, t, currentStep }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // 响应式尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 20, height: height - 20 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 渲染
  useEffect(() => {
    if (!svgRef.current || !currentStep) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const charWidth = Math.min(32, (width - 80) / s.length);
    const charHeight = 32;
    const startX = (width - s.length * charWidth) / 2;

    // 垂直布局：从顶部 padding 开始，按区块累加 y 坐标，消除重叠
    // scale 让整体布局随画布高度自适应（矮画布压缩间距，高画布展开）
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

    // 绘制图例
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
    
    // 图例2: 最优解
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
    
    // 图例3: 窗口外字符
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

    // 创建主容器
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', transform.toString());

    // 绘制标题
    g.append('text')
      .attr('x', width / 2)
      .attr('y', titleY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(`源字符串 s = "${s}"`);

    // 绘制窗口背景
    const { left, right, minStart, minLen } = currentStep;
    
    if (right > left) {
      g.append('rect')
        .attr('x', startX + left * charWidth - 4)
        .attr('y', stringY - 8)
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
        .attr('y', stringY - 4)
        .attr('width', minLen * charWidth + 4)
        .attr('height', charHeight + 8)
        .attr('rx', 6)
        .attr('fill', 'rgba(16, 185, 129, 0.2)')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2);
    }

    // 绘制字符
    const charGroup = g.selectAll('.char-group')
      .data(s.split(''))
      .enter()
      .append('g')
      .attr('class', 'char-group')
      .attr('transform', (_, i) => `translate(${startX + i * charWidth}, ${stringY})`);

    charGroup.append('rect')
      .attr('width', charWidth - 4)
      .attr('height', charHeight)
      .attr('rx', 6)
      .attr('fill', (_, i) => {
        if (minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) {
          return '#10b981';
        }
        if (i >= left && i < right) {
          return '#f59e0b';
        }
        return '#374151';
      })
      .attr('stroke', (_, i) => {
        if (minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) {
          return '#059669';
        }
        if (i >= left && i < right) {
          return '#d97706';
        }
        return '#4b5563';
      })
      .attr('stroke-width', 2);

    charGroup.append('text')
      .attr('x', (charWidth - 4) / 2)
      .attr('y', charHeight / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', (_, i) => {
        if ((minStart >= 0 && minLen !== Infinity && i >= minStart && i < minStart + minLen) || 
            (i >= left && i < right)) {
          return '#111827';
        }
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
          .attr('d', 'M0,6 L-5,14 L5,14 Z')
          .attr('fill', '#f59e0b');
      });

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

    // 计算窗口是否满足条件
    const isWindowValid = currentStep.valid === currentStep.need.size && currentStep.need.size > 0;
    
    // 绘制窗口状态徽章
    const statusText = isWindowValid ? '窗口满足条件 ✓' : '窗口不满足条件 ✗';
    const statusColor = isWindowValid ? '#10b981' : '#ef4444';
    const statusBgColor = isWindowValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    
    const statusWidth = statusText.length * 12 + 20;
    const statusX = (width - statusWidth) / 2;
    
    g.append('rect')
      .attr('x', statusX)
      .attr('y', statusY - 12)
      .attr('width', statusWidth)
      .attr('height', 22)
      .attr('rx', 11)
      .attr('fill', statusBgColor)
      .attr('stroke', statusColor)
      .attr('stroke-width', 2);
    
    g.append('text')
      .attr('x', width / 2)
      .attr('y', statusY + 3)
      .attr('text-anchor', 'middle')
      .attr('fill', statusColor)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(statusText);

    // 绘制目标字符串
    g.append('text')
      .attr('x', width / 2)
      .attr('y', targetY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(`目标字符串 t = "${t}"`);

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
        .attr('y', freqY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fbbf24')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .text(char);

      // 需要的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', freqY + 6)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#374151')
        .attr('stroke', '#4b5563');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', freqY + 17)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .text(`需要: ${needCount}`);

      // 窗口中的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', freqY + 26)
        .attr('width', freqWidth - 10)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', isMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
        .attr('stroke', isMatched ? '#10b981' : '#f59e0b');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', freqY + 37)
        .attr('text-anchor', 'middle')
        .attr('fill', isMatched ? '#10b981' : '#f59e0b')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(`窗口: ${windowCount}`);

      // 匹配标记
      if (isMatched) {
        g.append('text')
          .attr('x', x + freqWidth / 2)
          .attr('y', freqY + 52)
          .attr('text-anchor', 'middle')
          .attr('fill', '#10b981')
          .attr('font-size', '12px')
          .text('✓');
      }
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
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="algorithm-canvas"
      />
      <div className="canvas-hint">
        拖拽平移 | 滚轮缩放
      </div>
    </div>
  );
};

export default Canvas;
