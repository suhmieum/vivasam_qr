export interface WordData {
  text: string;
  count: number;
  students: Array<{ number: string; nickname: string }>;
}

// 한글 조사, 접속사 등 제외할 불용어
const STOP_WORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '도', '만', '에서', '으로', '로',
  '한', '그', '저', '것', '수', '등', '및', '더', '때', '곳', '위', '중', '안', '밖',
]);

export interface ResponseData {
  text: string;
  studentNumber: string;
  nickname: string;
}

export function extractWords(responses: ResponseData[]): WordData[] {
  const wordMap = new Map<string, { count: number; students: Array<{ number: string; nickname: string }> }>();

  responses.forEach((response) => {
    if (!response.text || response.text.trim().length === 0) return;

    // 특수문자 제거하고 공백으로 분리
    const words = response.text
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter((word) => {
        // 2글자 이상, 불용어가 아닌 단어만
        return word.length >= 2 && !STOP_WORDS.has(word);
      });

    const uniqueWords = new Set(words.map(w => w.trim().toLowerCase()));

    uniqueWords.forEach((word) => {
      if (word) {
        const existing = wordMap.get(word);
        if (existing) {
          existing.count++;
          existing.students.push({ number: response.studentNumber, nickname: response.nickname });
        } else {
          wordMap.set(word, {
            count: 1,
            students: [{ number: response.studentNumber, nickname: response.nickname }],
          });
        }
      }
    });
  });

  // 빈도순 정렬하고 상위 50개만
  return Array.from(wordMap.entries())
    .map(([text, data]) => ({ text, count: data.count, students: data.students }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

export function getWordSize(count: number, minCount: number, maxCount: number): number {
  if (maxCount === minCount) return 36;

  const minSize = 24;
  const maxSize = 72;

  // 로그 스케일로 크기 계산
  const normalized = (count - minCount) / (maxCount - minCount);
  return Math.round(minSize + normalized * (maxSize - minSize));
}
