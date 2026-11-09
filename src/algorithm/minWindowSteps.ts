export type StepType = 'init' | 'read' | 'skip' | 'expand' | 'compare' | 'found' | 'shrink' | 'complete';

export interface AlgorithmStep {
  type: StepType;
  left: number;
  right: number;
  window: Map<string, number>;
  need: Map<string, number>;
  valid: number;
  minStart: number;
  minLen: number;
  description: string;
  operation: string;
  narration: string;
  currentChar?: string;
  currentIndex?: number;
  result?: string;
  anchorIds: string[];
  variables: {
    left: number;
    right: number;
    valid: number;
    start: number;
    minLen: number | string;
    currentChar?: string;
    windowStr: string;
    needStr: string;
  };
}

/**
 * 生成最小覆盖子串算法的教学步骤快照。
 * 读取、加入窗口、更新答案、移出左端字符分别成步，便于对照代码理解状态变化。
 */
export function generateMinWindowSteps(s: string, t: string): AlgorithmStep[] {
  if (!s || !t) return [];

  const steps: AlgorithmStep[] = [];
  const need = new Map<string, number>();
  for (const char of t) need.set(char, (need.get(char) || 0) + 1);

  const window = new Map<string, number>();
  let left = 0;
  let right = 0;
  let valid = 0;
  let start = -1;
  let minLen = Infinity;

  const formatMap = (map: Map<string, number>) => {
    const entries = Array.from(map.entries())
      .filter(([, count]) => count > 0)
      .map(([char, count]) => `${char}:${count}`);
    return entries.length ? `{${entries.join(', ')}}` : '{}';
  };

  const addStep = (
    type: StepType,
    operation: string,
    narration: string,
    currentChar?: string,
    currentIndex?: number,
    result?: string,
  ) => {
    const variables = {
      left,
      right,
      valid,
      start,
      minLen: minLen === Infinity ? '∞' : minLen,
      currentChar,
      windowStr: formatMap(window),
      needStr: formatMap(need),
    };
    steps.push({
      type,
      left,
      right,
      window: new Map(window),
      need: new Map(need),
      valid,
      minStart: start,
      minLen,
      description: narration,
      operation,
      narration,
      currentChar,
      currentIndex,
      result,
      anchorIds: [type],
      variables,
    });
  };

  addStep(
    'init',
    '初始化需求',
    `统计 need=${formatMap(need)}。valid 统计“频次已达到需求”的不同字符种类数，不是窗口字符总数；窗口统一按左闭右开 [left, right) 计算。`,
  );

  while (right < s.length) {
    const char = s[right];
    const index = right;
    const isNeeded = need.has(char);
    if (isNeeded) {
      addStep(
        'read',
        '读取右端字符',
        `检查 s[${index}]="${char}"；此时窗口是 [${left}, ${right})，R 指向待纳入位置 ${index}。`,
        char,
        index,
      );
    }

    right++;
    if (isNeeded) {
      const count = (window.get(char) || 0) + 1;
      window.set(char, count);
      if (count === need.get(char)) valid++;
      const becameValid = count === need.get(char);
      addStep(
        'expand',
        becameValid ? '加入并达标' : '加入窗口',
        `把 s[${index}]="${char}" 计入 [${left}, ${right})，${char} 的频次变为 ${count}/${need.get(char)}；${becameValid ? '从不足跨到达标，valid 加 1。' : count > (need.get(char) || 0) ? '需求已满足，多出的副本是冗余；valid 按字符种类计数，因此不变。' : '尚未达到需求，valid 不变。'}`,
        char,
        index,
      );
    } else {
      addStep(
        'skip',
        '跳过非目标字符',
        `检查并越过 s[${index}]="${char}"：窗口边界从 ${index} 移到 ${right}，该字符不在 need 中，因此频次与 valid 不变。`,
        char,
        index,
      );
    }

    while (valid === need.size) {
      const candidateLength = right - left;
      const hasAnswer = minLen !== Infinity;
      const improvesAnswer = candidateLength < minLen;
      const candidate = s.substring(left, right);
      addStep(
        'compare',
        improvesAnswer ? '候选更短，准备更新' : '候选不优，保留原答案',
        `当前窗口 [${left}, ${right}) 长度 ${candidateLength}，${hasAnswer ? `已知最短长度是 ${minLen}` : '还没有答案'}；${improvesAnswer ? `它更短，保存 "${candidate}"。` : '它没有更短，最优答案保持不变。'}`,
        s[left],
        left,
        candidate,
      );
      if (improvesAnswer) {
        start = left;
        minLen = candidateLength;
        const best = s.substring(start, start + minLen);
        addStep(
          'found',
          '记录新的最短答案',
          `把答案起点设为 ${start}、长度设为 ${minLen}，当前最优子串是 "${best}"；然后尝试移走左端字符。`,
          s[left],
          left,
          best,
        );
      }

      const removed = s[left];
      const removedIndex = left;
      if (need.has(removed)) {
        const previousCount = window.get(removed) || 0;
        if (previousCount === need.get(removed)) valid--;
        window.set(removed, previousCount - 1);
      }
      left++;

      if (need.has(removed)) {
        const remaining = window.get(removed) || 0;
        const stillValid = remaining >= (need.get(removed) || 0);
        addStep(
          'shrink',
          stillValid ? '移出左端字符' : '移出并失去覆盖',
          `窗口频次 ${removed}：${remaining + 1} → ${remaining}（需求 ${need.get(removed)}）；left 从 ${removedIndex} 到 ${left}。${stillValid ? `${removed} 仍达标，valid 保持 ${valid}，窗口继续有效。` : `${removed} 从达标变不足，valid 降为 ${valid}，必须重新扩张。`}`,
          removed,
          removedIndex,
        );
      } else {
        addStep(
          'shrink',
          '越过无关字符',
          `移出 s[${removedIndex}]="${removed}"；它不属于 need，因此 valid 不变，只把 left 从 ${removedIndex} 推进到 ${left}。`,
          removed,
          removedIndex,
        );
      }
    }
  }

  const result = minLen === Infinity ? '' : s.substring(start, start + minLen);
  addStep(
    'complete',
    result ? '返回最短答案' : '没有覆盖子串',
    result
      ? `扫描结束，返回历史最优区间 [${start}, ${start + minLen}) 的 "${result}"（长度 ${minLen}）；它覆盖 t 的全部需求。`
      : `扫描结束仍未让 valid 达到 ${need.size}；s 中不存在覆盖 t 全部字符的子串。`,
    undefined,
    undefined,
    result,
  );

  return steps;
}
