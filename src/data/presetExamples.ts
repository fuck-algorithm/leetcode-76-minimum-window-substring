export interface PresetExample {
  name: string;
  s: string;
  t: string;
  description?: string;
}

export const presetExamples: PresetExample[] = [
  {
    name: '力扣示例1',
    s: 'ADOBECODEBANC',
    t: 'ABC',
    description: '经典示例，答案是 "BANC"',
  },
  {
    name: '力扣示例2',
    s: 'a',
    t: 'a',
    description: '最简单的情况，整个字符串就是答案',
  },
  {
    name: '力扣示例3',
    s: 'a',
    t: 'aa',
    description: '无解的情况，s 中没有足够的字符',
  },
  {
    name: '较长示例',
    s: 'ADOBECODEBANCABC',
    t: 'ABCC',
    description: '需要两个 C 的情况',
  },
  {
    name: '复杂示例',
    s: 'AAAAABBBBBCCCCC',
    t: 'ABC',
    description: '重复字符较多的情况',
  },
];

// 生成随机合法数据
export const generateRandomExample = (): { s: string; t: string } => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // 随机生成 t（3-6个字符）
  const tLength = Math.floor(Math.random() * 4) + 3;
  let t = '';
  for (let i = 0; i < tLength; i++) {
    t += chars[Math.floor(Math.random() * 10)]; // 只用前10个字母，增加重复概率
  }
  
  // 生成 s，确保包含 t 的所有字符
  const sLength = Math.floor(Math.random() * 15) + 10; // 10-24个字符
  let s = '';
  
  // 先把 t 的字符打散放入
  const tChars = t.split('');
  const positions = new Set<number>();
  while (positions.size < tChars.length) {
    positions.add(Math.floor(Math.random() * sLength));
  }
  
  const posArray = Array.from(positions).sort((a, b) => a - b);
  let tIndex = 0;
  
  for (let i = 0; i < sLength; i++) {
    if (posArray.includes(i) && tIndex < tChars.length) {
      s += tChars[tIndex++];
    } else {
      s += chars[Math.floor(Math.random() * 26)];
    }
  }
  
  return { s, t };
};

// 验证输入数据
export const validateInput = (s: string, t: string): { valid: boolean; error?: string } => {
  if (!s || s.trim().length === 0) {
    return { valid: false, error: '源字符串 s 不能为空' };
  }
  
  if (!t || t.trim().length === 0) {
    return { valid: false, error: '目标字符串 t 不能为空' };
  }
  
  if (s.length > 100) {
    return { valid: false, error: '源字符串太长（建议不超过100个字符）' };
  }
  
  if (t.length > 20) {
    return { valid: false, error: '目标字符串太长（建议不超过20个字符）' };
  }
  
  // 检查是否只包含英文字母
  const letterRegex = /^[a-zA-Z]+$/;
  if (!letterRegex.test(s)) {
    return { valid: false, error: '源字符串只能包含英文字母' };
  }
  
  if (!letterRegex.test(t)) {
    return { valid: false, error: '目标字符串只能包含英文字母' };
  }
  
  return { valid: true };
};
