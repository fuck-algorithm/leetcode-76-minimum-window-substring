import React, { useEffect, useState, useRef } from 'react';
import { getPlaybackSpeed, setPlaybackSpeed } from '../../utils/storage';
import './ControlPanel.css';

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
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPlaybackSpeed().then(onSpeedChange);
  }, []);

  const handleSpeedChange = (newSpeed: number) => {
    onSpeedChange(newSpeed);
    setPlaybackSpeed(newSpeed);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const step = Math.round(percentage * (totalSteps - 1));
    onSeek(Math.max(0, Math.min(step, totalSteps - 1)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const step = Math.round(percentage * (totalSteps - 1));
    onSeek(Math.max(0, Math.min(step, totalSteps - 1)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  const speedOptions = [0.5, 1, 1.5, 2, 2.5, 3];

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
};

export default ControlPanel;
