import React from 'react';
import { algorithmThoughts } from '../../data/algorithmThoughts';
import './AlgorithmThoughts.css';

interface AlgorithmThoughtsProps {
  onClose: () => void;
}

const AlgorithmThoughts: React.FC<AlgorithmThoughtsProps> = ({ onClose }) => {
  return (
    <div className="thoughts-overlay" onClick={onClose}>
      <div className="thoughts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="thoughts-header">
          <h2>{algorithmThoughts.title}</h2>
          <button className="thoughts-close" onClick={onClose}>✕</button>
        </div>

        <div className="thoughts-content">
          {algorithmThoughts.sections.map((section, index) => (
            <section key={index} className="thoughts-section">
              <h3>{section.title}</h3>
              <div className="section-content">
                {section.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmThoughts;
