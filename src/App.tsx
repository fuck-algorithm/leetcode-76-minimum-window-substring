import React, { useState, useEffect, useCallback } from 'react';
import { generateMinWindowSteps, AlgorithmStep } from './algorithm/minWindowSteps';
import { presetExamples, generateRandomExample, validateInput } from './data/presetExamples';
import Header from './components/Header/Header';
import Canvas from './components/Canvas/Canvas';
import CodePanel from './components/CodePanel/CodePanel';
import ControlPanel from './components/ControlPanel/ControlPanel';
import Tutorial from './components/Tutorial/Tutorial';
import HelpPanel from './components/HelpPanel/HelpPanel';
import AlgorithmThoughts from './components/AlgorithmThoughts/AlgorithmThoughts';
import WeChatFloat from './components/WeChatFloat/WeChatFloat';
import './App.css';

const App: React.FC = () => {
  const [s, setS] = useState('ADOBECODEBANC');
  const [t, setT] = useState('ABC');
  const [inputS, setInputS] = useState('ADOBECODEBANC');
  const [inputT, setInputT] = useState('ABC');
  const [inputError, setInputError] = useState('');
  
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);

  // 检查是否首次访问
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // 初始化算法步骤
  useEffect(() => {
    const generatedSteps = generateMinWindowSteps(s, t);
    setSteps(generatedSteps);
    setCurrentStep(0);
  }, [s, t]);

  // 自动播放
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000 / speed);
      return () => clearTimeout(timeout);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, steps.length, speed]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setIsPlaying(false);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setCurrentStep(0);
          setIsPlaying(false);
          break;
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
        case 'Escape':
          if (showHelp) setShowHelp(false);
          if (showThoughts) setShowThoughts(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length, showHelp, showThoughts]);

  const handleApply = useCallback(() => {
    setInputError('');
    const validation = validateInput(inputS, inputT);
    
    if (!validation.valid) {
      setInputError(`⚠️ ${validation.error}`);
      return;
    }
    
    setS(inputS.trim().toUpperCase());
    setT(inputT.trim().toUpperCase());
    setCurrentStep(0);
    setIsPlaying(false);
  }, [inputS, inputT]);

  const handlePresetExample = useCallback((example: typeof presetExamples[0]) => {
    setInputS(example.s);
    setInputT(example.t);
    setS(example.s);
    setT(example.t);
    setCurrentStep(0);
    setIsPlaying(false);
    setInputError('');
  }, []);

  const handleRandomExample = useCallback(() => {
    const { s: randomS, t: randomT } = generateRandomExample();
    setInputS(randomS);
    setInputT(randomT);
    setS(randomS);
    setT(randomT);
    setCurrentStep(0);
    setIsPlaying(false);
    setInputError('');
  }, []);

  const currentStepData = steps[currentStep] || null;

  return (
    <div className="app">
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      {showThoughts && <AlgorithmThoughts onClose={() => setShowThoughts(false)} />}
      
      <Header 
        onShowHelp={() => setShowHelp(true)}
        onShowTutorial={() => setShowTutorial(true)}
        onShowAlgorithmThoughts={() => setShowThoughts(true)}
      />

      <main className="main">
        <div className="container">
          <div className="input-panel">
            <div className="input-group">
              <div className="input-row">
                <label>源字符串 s:</label>
                <input 
                  type="text" 
                  value={inputS} 
                  onChange={(e) => setInputS(e.target.value)}
                  placeholder="例如：ADOBECODEBANC"
                />
              </div>
              <div className="input-row">
                <label>目标字符串 t:</label>
                <input 
                  type="text" 
                  value={inputT} 
                  onChange={(e) => setInputT(e.target.value)}
                  placeholder="例如：ABC"
                />
              </div>
              <button className="apply-btn" onClick={handleApply}>应用</button>
            </div>

            {inputError && <div className="input-error">{inputError}</div>}

            <div className="preset-buttons">
              {presetExamples.map((example, index) => (
                <button 
                  key={index}
                  className="preset-btn"
                  onClick={() => handlePresetExample(example)}
                  title={example.description}
                >
                  {example.name}
                </button>
              ))}
              <button className="preset-btn random" onClick={handleRandomExample}>
                🎲 随机生成
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="left-panel">
              <Canvas s={s} t={t} currentStep={currentStepData} />
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
            </div>
            
            <div className="right-panel">
              <CodePanel currentStep={currentStepData} />
            </div>
          </div>

          <div className="keyboard-hints">
            <div className="hint-item">
              <kbd>Space</kbd>
              <span>播放/暂停</span>
            </div>
            <div className="hint-item">
              <kbd>←</kbd>
              <kbd>→</kbd>
              <span>上一步/下一步</span>
            </div>
            <div className="hint-item">
              <kbd>R</kbd>
              <span>重置</span>
            </div>
            <div className="hint-item">
              <kbd>?</kbd>
              <span>帮助</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>© 2024 fuck-algorithm | LeetCode 可视化系列</p>
      </footer>

      <WeChatFloat />
    </div>
  );
};

export default App;
