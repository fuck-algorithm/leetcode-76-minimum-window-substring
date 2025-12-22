import React, { useState, useEffect } from 'react';
import './Tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '欢迎使用滑动窗口算法可视化！',
      content: '这个工具将帮助你理解 LeetCode 76 题「最小覆盖子串」的解题思路。让我们开始一个快速教程吧！',
    },
    {
      title: '什么是滑动窗口？',
      content: '滑动窗口是一种常用算法技巧，通过维护一个窗口在数组/字符串上滑动，来解决子数组/子串问题。它可以将暴力解法的 O(n²) 优化到 O(n)。',
    },
    {
      title: '理解问题',
      content: '给定源字符串 s 和目标字符串 t，我们需要找到 s 中包含 t 所有字符的最短子串。例如：s="ADOBECODEBANC", t="ABC"，答案是 "BANC"。',
    },
    {
      title: '双指针技巧',
      content: '我们使用左指针 L 和右指针 R 来表示窗口的边界。R 向右移动扩大窗口，L 向右移动缩小窗口。',
    },
    {
      title: '控制按钮',
      content: '使用播放/暂停按钮自动演示，或使用上一步/下一步按钮手动控制。你还可以调整播放速度，拖动进度条跳转到任意步骤。',
    },
    {
      title: '代码同步',
      content: '右侧代码面板会高亮显示当前执行的代码行，并显示变量的实时值，就像真正的调试器一样！',
    },
    {
      title: '键盘快捷键',
      content: '按 Space 键播放/暂停，← → 键切换步骤，R 键重置。按 ? 键随时查看帮助。',
    },
    {
      title: '开始探索！',
      content: '教程结束！现在你可以尝试运行算法，或者选择不同的预设示例来深入理解滑动窗口算法。祝学习愉快！',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('tutorial-completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial-completed', 'true');
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-dialog">
        <div className="tutorial-header">
          <h2>{currentStepData.title}</h2>
          <button className="tutorial-close" onClick={handleSkip} aria-label="关闭教程">
            ✕
          </button>
        </div>

        <div className="tutorial-body">
          <p>{currentStepData.content}</p>
        </div>

        <div className="tutorial-footer">
          <div className="tutorial-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`tutorial-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <div className="tutorial-actions">
            <button className="tutorial-btn secondary" onClick={handleSkip}>
              跳过教程
            </button>
            
            <div className="tutorial-nav">
              <button
                className="tutorial-btn"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                上一步
              </button>
              <button className="tutorial-btn primary" onClick={handleNext}>
                {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
              </button>
            </div>
          </div>
        </div>

        <div className="tutorial-hint">
          提示：按 ← → 键切换步骤，Esc 键跳过
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
