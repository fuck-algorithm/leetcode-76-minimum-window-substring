export type CodeLanguage = 'javascript' | 'python' | 'java' | 'golang';

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
  // 步骤类型到行号的映射
  stepToLines: Record<string, number[]>;
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

// 步骤类型到代码行的映射
const jsStepToLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22, 23],
  found: [27, 28, 29, 30],
  shrink: [33, 34, 35, 37, 38, 39, 40, 41],
  complete: [46],
};

const pyStepToLines: Record<string, number[]> = {
  init: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  expand: [12, 13, 14, 15, 17, 18, 19, 20],
  found: [24, 25, 26],
  shrink: [29, 30, 31, 33, 34, 35, 36],
  complete: [38],
};

const javaStepToLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22],
  found: [26, 27, 28, 29],
  shrink: [32, 33, 34, 36, 37, 38, 39, 40],
  complete: [44],
};

const goStepToLines: Record<string, number[]> = {
  init: [1, 2, 3, 5, 6, 7, 9, 10, 11],
  expand: [13, 14, 15, 16, 18, 19, 20, 21, 22],
  found: [26, 27, 28, 29],
  shrink: [32, 33, 34, 36, 37, 38, 39, 40],
  complete: [44, 45, 46],
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
    stepToLines: jsStepToLines,
  },
  python: {
    language: 'python',
    displayName: 'Python',
    code: pythonCode,
    lines: parseCodeLines(pythonCode),
    stepToLines: pyStepToLines,
  },
  java: {
    language: 'java',
    displayName: 'Java',
    code: javaCode,
    lines: parseCodeLines(javaCode),
    stepToLines: javaStepToLines,
  },
  golang: {
    language: 'golang',
    displayName: 'Go',
    code: golangCode,
    lines: parseCodeLines(golangCode),
    stepToLines: goStepToLines,
  },
};

export const languageOptions: { value: CodeLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'golang', label: 'Go' },
];
