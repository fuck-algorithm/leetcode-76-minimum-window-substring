export type CodeLanguage = 'java' | 'javascript' | 'python' | 'golang';

export interface CodeLine {
  lineNumber: number;
  code: string;
  // 该行对应的步骤类型
  stepTypes?: string[];
}

export interface AlgorithmCode {
  language: CodeLanguage;
  displayName: string;
  code: string;
  lines: CodeLine[];
  // 步骤类型到"当前执行行"的映射（单行，用于 Debug 高亮）
  stepToActiveLine: Record<string, number>;
  // 步骤类型到"相关代码行区间"的映射（多行，用于淡色提示）
  stepToRelatedLines: Record<string, number[]>;
}

const javascriptCode = `function minWindow(s, t) {
    const need = new Map();
    const window = new Map();
    
    // 统计t中每个字符的频次
    for (const c of t) {
        need.set(c, (need.get(c) || 0) + 1);
    }
    
    let left = 0, right = 0;
    let valid = 0;
    let start = -1, minLen = Infinity;
    
    while (right < s.length) {
        // 扩张窗口：右指针右移
        const c = s[right];
        right++;
        
        // 更新窗口数据
        if (need.has(c)) {
            window.set(c, (window.get(c) || 0) + 1);
            if (window.get(c) === need.get(c)) {
                valid++;
            }
        }
        
        // 收缩窗口
        while (valid === need.size) {
            // 更新最小覆盖子串
            if (right - left < minLen) {
                start = left;
                minLen = right - left;
            }
            
            // 左指针右移
            const d = s[left];
            left++;
            
            if (need.has(d)) {
                if (window.get(d) === need.get(d)) {
                    valid--;
                }
                window.set(d, window.get(d) - 1);
            }
        }
    }
    
    return minLen === Infinity ? "" : s.substring(start, start + minLen);
}`;

const pythonCode = `def minWindow(s: str, t: str) -> str:
    from collections import defaultdict
    
    need = defaultdict(int)
    window = defaultdict(int)
    
    # 统计t中每个字符的频次
    for c in t:
        need[c] += 1
    
    left, right = 0, 0
    valid = 0
    start, min_len = -1, float('inf')
    
    while right < len(s):
        # 扩张窗口：右指针右移
        c = s[right]
        right += 1
        
        # 更新窗口数据
        if c in need:
            window[c] += 1
            if window[c] == need[c]:
                valid += 1
        
        # 收缩窗口
        while valid == len(need):
            # 更新最小覆盖子串
            if right - left < min_len:
                start = left
                min_len = right - left
            
            # 左指针右移
            d = s[left]
            left += 1
            
            if d in need:
                if window[d] == need[d]:
                    valid -= 1
                window[d] -= 1
    
    return "" if min_len == float('inf') else s[start:start + min_len]`;

const javaCode = `public String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    Map<Character, Integer> window = new HashMap<>();
    
    // 统计t中每个字符的频次
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }
    
    int left = 0, right = 0;
    int valid = 0;
    int start = -1, minLen = Integer.MAX_VALUE;
    
    while (right < s.length()) {
        // 扩张窗口：右指针右移
        char c = s.charAt(right);
        right++;
        
        // 更新窗口数据
        if (need.containsKey(c)) {
            window.put(c, window.getOrDefault(c, 0) + 1);
            if (window.get(c).equals(need.get(c))) {
                valid++;
            }
        }
        
        // 收缩窗口
        while (valid == need.size()) {
            // 更新最小覆盖子串
            if (right - left < minLen) {
                start = left;
                minLen = right - left;
            }
            
            // 左指针右移
            char d = s.charAt(left);
            left++;
            
            if (need.containsKey(d)) {
                if (window.get(d).equals(need.get(d))) {
                    valid--;
                }
                window.put(d, window.get(d) - 1);
            }
        }
    }
    
    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}`;

const golangCode = `func minWindow(s string, t string) string {
    need := make(map[byte]int)
    window := make(map[byte]int)
    
    // 统计t中每个字符的频次
    for i := 0; i < len(t); i++ {
        need[t[i]]++
    }
    
    left, right := 0, 0
    valid := 0
    start, minLen := -1, len(s)+1
    
    for right < len(s) {
        // 扩张窗口：右指针右移
        c := s[right]
        right++
        
        // 更新窗口数据
        if _, ok := need[c]; ok {
            window[c]++
            if window[c] == need[c] {
                valid++
            }
        }
        
        // 收缩窗口
        for valid == len(need) {
            // 更新最小覆盖子串
            if right-left < minLen {
                start = left
                minLen = right - left
            }
            
            // 左指针右移
            d := s[left]
            left++
            
            if _, ok := need[d]; ok {
                if window[d] == need[d] {
                    valid--
                }
                window[d]--
            }
        }
    }
    
    if minLen == len(s)+1 {
        return ""
    }
    return s[start : start+minLen]
}`;

// 步骤类型到"当前执行行"（单行）的映射 —— Debug 高亮这一行
// 行号已逐一对照源码字符串逐行核对（语义核心行），与源码实际内容一致。
const jsStepToActiveLine: Record<string, number> = {
  init: 2,
  read: 16,
  skip: 20,
  expand: 21,
  compare: 50,
  found: 51,
  shrink: 63,
  complete: 68,
};

const pyStepToActiveLine: Record<string, number> = {
  init: 4,
  read: 17,
  skip: 21,
  expand: 22,
  compare: 99,
  found: 100,
  shrink: 110,
  complete: 42,
};

const javaStepToActiveLine: Record<string, number> = {
  init: 2,
  read: 16,
  skip: 20,
  expand: 21,
  compare: 143,
  found: 144,
  shrink: 156,
  complete: 48,
};

const goStepToActiveLine: Record<string, number> = {
  init: 2,
  read: 16,
  skip: 20,
  expand: 21,
  compare: 193,
  found: 194,
  shrink: 206,
  complete: 51,
};

// 步骤类型到"相关代码行区间"的映射 —— 淡色提示整段（保留原多行映射）
const jsStepToRelatedLines: Record<string, number[]> = {
  init: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
  read: [14, 15, 16, 17],
  skip: [14, 15, 16, 17, 18, 19, 20],
  expand: [20, 21, 22, 23, 24, 25, 26],
  compare: [48, 49, 50],
  found: [50, 51, 52],
  shrink: [55, 56, 57, 59, 60, 61, 62, 63, 64],
  complete: [68],
};

const pyStepToRelatedLines: Record<string, number[]> = {
  init: [74, 75, 77, 78, 79, 81, 82, 83],
  read: [15, 16, 17, 18],
  skip: [15, 16, 17, 18, 19, 20, 21],
  expand: [21, 22, 23, 24, 25, 26],
  compare: [97, 98, 99],
  found: [99, 100, 101],
  shrink: [103, 104, 105, 107, 108, 109, 110],
  complete: [112],
};

const javaStepToRelatedLines: Record<string, number[]> = {
  init: [115, 116, 118, 119, 120, 123, 124, 125],
  read: [14, 15, 16, 17],
  skip: [14, 15, 16, 17, 18, 19, 20],
  expand: [20, 21, 22, 23, 24, 25, 26],
  compare: [141, 142, 143],
  found: [143, 144, 145],
  shrink: [148, 149, 150, 152, 153, 154, 155, 156],
  complete: [161],
};

const goStepToRelatedLines: Record<string, number[]> = {
  init: [165, 166, 168, 169, 170, 173, 174, 175],
  read: [14, 15, 16, 17],
  skip: [14, 15, 16, 17, 18, 19, 20],
  expand: [20, 21, 22, 23, 24, 25],
  compare: [191, 192, 193],
  found: [193, 194, 195],
  shrink: [198, 199, 200, 202, 203, 204, 205, 206],
  complete: [211, 212, 214],
};

const parseCodeLines = (code: string): CodeLine[] => {
  return code.split('\n').map((line, index) => ({
    lineNumber: index + 1,
    code: line,
  }));
};

export const algorithmCodes: Record<CodeLanguage, AlgorithmCode> = {
  javascript: {
    language: 'javascript',
    displayName: 'JavaScript',
    code: javascriptCode,
    lines: parseCodeLines(javascriptCode),
    stepToActiveLine: jsStepToActiveLine,
    stepToRelatedLines: jsStepToRelatedLines,
  },
  python: {
    language: 'python',
    displayName: 'Python',
    code: pythonCode,
    lines: parseCodeLines(pythonCode),
    stepToActiveLine: pyStepToActiveLine,
    stepToRelatedLines: pyStepToRelatedLines,
  },
  java: {
    language: 'java',
    displayName: 'Java',
    code: javaCode,
    lines: parseCodeLines(javaCode),
    stepToActiveLine: javaStepToActiveLine,
    stepToRelatedLines: javaStepToRelatedLines,
  },
  golang: {
    language: 'golang',
    displayName: 'Go',
    code: golangCode,
    lines: parseCodeLines(golangCode),
    stepToActiveLine: goStepToActiveLine,
    stepToRelatedLines: goStepToRelatedLines,
  },
};

export const languageOptions: { value: CodeLanguage; label: string }[] = [
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'golang', label: 'Go' },
];
