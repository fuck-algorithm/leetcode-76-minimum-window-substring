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
