import React from 'react';
import './HelpPanel.css';

interface HelpPanelProps {
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>💡 使用指南</h2>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>

        <div className="help-content">
          <section className="help-section">
            <h3>🎯 算法说明</h3>
            <p>
              <strong>窗口使用左闭右开区间 [L, R)</strong>：L 指向第一个纳入字符，R 指向下一个不纳入的位置，
              所以窗口长度是 R − L。valid 是“已达标的不同字符种类数”；只有某字符频次从不足跨到需求值时才增加。
            </p>
            <p>
              先移动 R 扩大窗口；valid 达到 need 的种类数后，记录并比较候选答案，再移动 L 移除字符，
              直到某个需求再次不足。整体时间复杂度为 <code>O(m+n)</code>。
            </p>
            <div className="help-complexity">
              <div>⏱ <strong>时间复杂度：</strong>O(m + n)</div>
              <div>💾 <strong>空间复杂度：</strong>O(k)，k 为字符集大小</div>
            </div>
          </section>

          <section className="help-section">
            <h3>🎮 控制说明</h3>
            <div className="help-controls">
              <div className="help-control-item">
                <span className="help-icon">▶/⏸</span>
                <span>自动播放/暂停算法演示</span>
              </div>
              <div className="help-control-item">
                <span className="help-icon">←/→</span>
                <span>手动切换到上一步/下一步</span>
              </div>
              <div className="help-control-item">
                <span className="help-icon">↺</span>
                <span>重置到初始状态</span>
              </div>
              <div className="help-control-item">
                <span className="help-icon">🎚</span>
                <span>调节播放速度（0.5x - 3.0x）</span>
              </div>
              <div className="help-control-item">
                <span className="help-icon">📊</span>
                <span>拖动进度条跳转到任意步骤</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>⌨️ 键盘快捷键</h3>
            <div className="help-shortcuts">
              <div className="help-shortcut">
                <kbd>Space</kbd>
                <span>播放/暂停</span>
              </div>
              <div className="help-shortcut">
                <kbd>←</kbd> <kbd>→</kbd>
                <span>上一步/下一步</span>
              </div>
              <div className="help-shortcut">
                <kbd>R</kbd>
                <span>重置</span>
              </div>
              <div className="help-shortcut">
                <kbd>?</kbd>
                <span>显示/隐藏帮助</span>
              </div>
              <div className="help-shortcut">
                <kbd>Esc</kbd>
                <span>关闭弹窗</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>🎨 颜色说明</h3>
            <div className="help-colors">
              <div className="help-color-item">
                <span className="help-color-box" style={{background: '#f59e0b'}}></span>
                <span><strong>橙色：</strong>当前窗口内的字符</span>
              </div>
              <div className="help-color-item">
                <span className="help-color-box" style={{background: '#10b981'}}></span>
                <span><strong>绿色：</strong>找到的最小覆盖子串</span>
              </div>
              <div className="help-color-item">
                <span className="help-color-box" style={{background: '#f59e0b'}}></span>
                <span><strong>L 标记：</strong>左指针位置（窗口起始）</span>
              </div>
              <div className="help-color-item">
                <span className="help-color-box" style={{background: '#10b981'}}></span>
                <span><strong>R 标记：</strong>窗口右边界（不含该格）；窗口是 [L, R)，长度 = R − L</span>
              </div>
            </div>
          </section>

          <section className="help-section help-tip">
            <strong>💡 学习建议：</strong>
            <p>
              建议先从简单示例开始，观察每一步的变化。理解窗口扩张和收缩的时机，
              以及如何判断窗口是否满足条件。可以尝试自己预测下一步会发生什么！
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
