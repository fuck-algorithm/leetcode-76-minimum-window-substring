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
    const charWidth = Math.min(40, (width - 100) / s.length);
    const charHeight = 40;
    const startX = (width - s.length * charWidth) / 2;
    const stringY = 80;

    // 创建主容器
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', transform.toString());

    // 绘制标题
    g.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '14px')
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
        if (minStart >= 0 && i >= minStart && i < minStart + minLen) {
          return '#10b981';
        }
        if (i >= left && i < right) {
          return '#f59e0b';
        }
        return '#374151';
      })
      .attr('stroke', (_, i) => {
        if (minStart >= 0 && i >= minStart && i < minStart + minLen) {
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
      .attr('y', charHeight / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', (_, i) => {
        if ((minStart >= 0 && i >= minStart && i < minStart + minLen) || 
            (i >= left && i < right)) {
          return '#111827';
        }
        return '#e0e0e0';
      })
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .text(d => d);

    // 绘制索引
    charGroup.append('text')
      .attr('x', (charWidth - 4) / 2)
      .attr('y', charHeight + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .text((_, i) => i.toString());

    // 绘制左指针
    const pointerY = stringY - 30;
    g.append('g')
      .attr('class', 'pointer-left')
      .attr('transform', `translate(${startX + left * charWidth + (charWidth - 4) / 2}, ${pointerY})`)
      .call(g => {
        g.append('rect')
          .attr('x', -15)
          .attr('y', -12)
          .attr('width', 30)
          .attr('height', 20)
          .attr('rx', 4)
          .attr('fill', '#f59e0b');
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('fill', '#111827')
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .text('L');
        g.append('path')
          .attr('d', 'M0,8 L-6,18 L6,18 Z')
          .attr('fill', '#f59e0b');
      });

    // 绘制右指针
    if (right > 0) {
      g.append('g')
        .attr('class', 'pointer-right')
        .attr('transform', `translate(${startX + (right - 1) * charWidth + (charWidth - 4) / 2}, ${stringY + charHeight + 35})`)
        .call(g => {
          g.append('path')
            .attr('d', 'M0,-8 L-6,-18 L6,-18 Z')
            .attr('fill', '#10b981');
          g.append('rect')
            .attr('x', -15)
            .attr('y', -8)
            .attr('width', 30)
            .attr('height', 20)
            .attr('rx', 4)
            .attr('fill', '#10b981');
          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 8)
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .attr('font-weight', '700')
            .text('R');
        });
    }

    // 绘制目标字符串
    const targetY = stringY + charHeight + 80;
    g.append('text')
      .attr('x', width / 2)
      .attr('y', targetY)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .text(`目标字符串 t = "${t}"`);

    // 绘制字符频次对比
    const freqY = targetY + 40;
    const needMap = currentStep.need;
    const windowMap = currentStep.window;
    const chars = Array.from(needMap.keys()).sort();
    const freqWidth = Math.min(80, (width - 100) / chars.length);
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
        .attr('font-size', '16px')
        .attr('font-weight', '700')
        .text(char);

      // 需要的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', freqY + 10)
        .attr('width', freqWidth - 10)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', '#374151')
        .attr('stroke', '#4b5563');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', freqY + 24)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '11px')
        .text(`需要: ${needCount}`);

      // 窗口中的数量
      g.append('rect')
        .attr('x', x + 5)
        .attr('y', freqY + 35)
        .attr('width', freqWidth - 10)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', isMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
        .attr('stroke', isMatched ? '#10b981' : '#f59e0b');

      g.append('text')
        .attr('x', x + freqWidth / 2)
        .attr('y', freqY + 49)
        .attr('text-anchor', 'middle')
        .attr('fill', isMatched ? '#10b981' : '#f59e0b')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(`窗口: ${windowCount}`);

      // 匹配标记
      if (isMatched) {
        g.append('text')
          .attr('x', x + freqWidth / 2)
          .attr('y', freqY + 70)
          .attr('text-anchor', 'middle')
          .attr('fill', '#10b981')
          .attr('font-size', '14px')
          .text('✓');
      }
    });

    // 绘制步骤说明
    const descY = freqY + 100;
    const descText = currentStep.description;
    
    g.append('rect')
      .attr('x', 20)
      .attr('y', descY - 20)
      .attr('width', width - 40)
      .attr('height', 50)
      .attr('rx', 8)
      .attr('fill', 'rgba(31, 41, 55, 0.8)')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', descY + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '13px')
      .text(descText.length > 80 ? descText.substring(0, 80) + '...' : descText);

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
