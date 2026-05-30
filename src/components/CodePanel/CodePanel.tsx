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
  const highlightedLines = currentStep 
    ? codeData.stepToLines[currentStep.type] || []
    : [];

  const getPrismLanguage = (lang: CodeLanguage): string => {
    const map: Record<CodeLanguage, string> = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      golang: 'go',
    };
    return map[lang];
  };

  const renderVariableValue = (lineNumber: number): React.ReactNode => {
    if (!currentStep) return null;
    
    const vars = currentStep.variables;
    const line = codeData.lines[lineNumber - 1]?.code || '';
    
    // 根据代码行内容显示相关变量值
    if (line.includes('left') && line.includes('right') && line.includes('=')) {
      return <span className="var-value">left={vars.left}, right={vars.right}</span>;
    }
    if (line.includes('valid') && line.includes('=') && !line.includes('==')) {
      return <span className="var-value">valid={vars.valid}</span>;
    }
    if (line.includes('minLen') || line.includes('min_len')) {
      return <span className="var-value">minLen={vars.minLen}</span>;
    }
    if (line.includes('start') && line.includes('=') && !line.includes('==')) {
      return <span className="var-value">start={vars.start}</span>;
    }
    if (line.includes('window') && line.includes('=') && vars.windowStr !== '{}') {
      return <span className="var-value">window={vars.windowStr}</span>;
    }
    
    return null;
  };

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
      
      <div className="code-container">
        <div className="code-lines">
          {codeData.lines.map((line, index) => {
            const lineNum = index + 1;
            const isHighlighted = highlightedLines.includes(lineNum);
            const varValue = renderVariableValue(lineNum);
            
            return (
              <div 
                key={lineNum} 
                className={`code-line ${isHighlighted ? 'highlighted' : ''}`}
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
                {varValue && <div className="var-annotation">{varValue}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CodePanel;
