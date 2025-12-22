export interface AlgorithmStep {
  type: 'init' | 'expand' | 'found' | 'shrink' | 'complete';
  left: number;
  right: number;
  window: Map<string, number>;
  need: Map<string, number>;
  valid: number;
  minStart: number;
  minLen: number;
  description: string;
  currentChar?: string;
  result?: string;
  // 变量状态，用于代码调试显示
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
 * 生成最小覆盖子串算法的步骤
 */
export function generateMinWindowSteps(s: string, t: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  
  if (!s || !t || s.length === 0 || t.length === 0) {
    return steps;
  }

  // 统计 t 中每个字符的频次
  const need = new Map<string, number>();
  for (const c of t) {
    need.set(c, (need.get(c) || 0) + 1);
  }

  const window = new Map<string, number>();
  let left = 0, right = 0;
  let valid = 0;
  let start = -1, minLen = Infinity;

  const formatMap = (map: Map<string, number>): string => {
    const entries = Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`);
    return entries.length > 0 ? `{${entries.join(', ')}}` : '{}';
  };

  const createVariables = (currentChar?: string) => ({
    left,
    right,
    valid,
    start,
    minLen: minLen === Infinity ? '∞' : minLen,
    currentChar,
    windowStr: formatMap(window),
    needStr: formatMap(need),
  });

  steps.push({
    type: 'init',
    left,
    right,
    window: new Map(),
    valid,
    minStart: -1,
    minLen: Infinity,
    description: `📋 初始化：统计目标字符串 "${t}" 中每个字符的频次。需要找到 s 中包含这些字符的最短子串。`,
    need: new Map(need),
    variables: createVariables(),
  });

  while (right < s.length) {
    const c = s[right];
    right++;

    if (need.has(c)) {
      window.set(c, (window.get(c) || 0) + 1);
      if (window.get(c) === need.get(c)) {
        valid++;
      }
    }

    const needsChar = need.has(c);
    const isValidNow = needsChar && window.get(c) === need.get(c);
    let expandDesc = `➡️ 扩张窗口：右指针移动到位置 ${right}，字符 '${c}' 加入窗口。`;
    
    if (needsChar) {
      expandDesc += ` 目标字符！窗口内 '${c}': ${window.get(c)}，需要: ${need.get(c)}`;
      if (isValidNow) {
        expandDesc += ` ✓ 已满足`;
      }
    } else {
      expandDesc += ` 非目标字符。`;
    }

    steps.push({
      type: 'expand',
      left,
      right,
      window: new Map(window),
      need: new Map(need),
      valid,
      minStart: start,
      minLen,
      currentChar: c,
      description: expandDesc,
      variables: createVariables(c),
    });

    while (valid === need.size) {
      if (right - left < minLen) {
        start = left;
        minLen = right - left;
        steps.push({
          type: 'found',
          left,
          right,
          window: new Map(window),
          need: new Map(need),
          valid,
          minStart: start,
          minLen,
          description: `🎉 找到覆盖子串："${s.substring(start, start + minLen)}"（位置 ${start}~${start + minLen - 1}），长度 ${minLen}！尝试缩小窗口。`,
          variables: createVariables(),
        });
      }

      const d = s[left];
      left++;

      if (need.has(d)) {
        if (window.get(d) === need.get(d)) {
          valid--;
        }
        window.set(d, (window.get(d) || 0) - 1);
      }

      const willBreak = need.has(d) && (window.get(d) || 0) < (need.get(d) || 0);
      let shrinkDesc = `⬅️ 收缩窗口：左指针移动到位置 ${left}，字符 '${d}' 移出窗口。`;
      
      if (need.has(d)) {
        shrinkDesc += ` 窗口内 '${d}': ${window.get(d)}，需要: ${need.get(d)}`;
        if (willBreak) {
          shrinkDesc += ` ⚠️ 不满足，继续扩张`;
        }
      }

      steps.push({
        type: 'shrink',
        left,
        right,
        window: new Map(window),
        need: new Map(need),
        valid,
        minStart: start,
        minLen,
        currentChar: d,
        description: shrinkDesc,
        variables: createVariables(d),
      });
    }
  }

  steps.push({
    type: 'complete',
    left,
    right,
    window: new Map(window),
    need: new Map(need),
    valid,
    minStart: start,
    minLen,
    result: minLen === Infinity ? '' : s.substring(start, start + minLen),
    description: minLen === Infinity 
      ? `❌ 算法结束：未找到包含所有目标字符的子串。` 
      : `✅ 完成！最小覆盖子串："${s.substring(start, start + minLen)}"，位置 ${start}~${start + minLen - 1}，长度 ${minLen}。`,
    variables: createVariables(),
  });

  return steps;
}
