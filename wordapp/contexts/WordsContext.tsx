import { createContext, useContext, useState, useCallback } from 'react';
import type { DetectResult } from '@/services/api';

interface WordsContextValue {
  words: DetectResult[];
  addWord: (word: DetectResult) => void;
}

const WordsContext = createContext<WordsContextValue>({
  words: [],
  addWord: () => {},
});

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const [words, setWords] = useState<DetectResult[]>([]);

  const addWord = useCallback((word: DetectResult) => {
    setWords((prev) => {
      const exists = prev.some(
        (w) => w.english.toLowerCase() === word.english.toLowerCase(),
      );
      if (exists) return prev;
      return [...prev, word];
    });
  }, []);

  return (
    <WordsContext.Provider value={{ words, addWord }}>
      {children}
    </WordsContext.Provider>
  );
}

export function useWords() {
  return useContext(WordsContext);
}
