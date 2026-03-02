import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Book, Sparkles, Volume2 } from 'lucide-react';

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  createdAt: number;
}

const PixelCat = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-[0_0_10px_rgba(51,102,255,0.5)]">
    {/* Body */}
    <rect x="30" y="40" width="60" height="60" fill="#3366FF" />
    <rect x="20" y="50" width="10" height="40" fill="#3366FF" />
    <rect x="90" y="50" width="10" height="40" fill="#3366FF" />
    
    {/* Ears */}
    <rect x="30" y="20" width="20" height="20" fill="#3366FF" />
    <rect x="70" y="20" width="20" height="20" fill="#3366FF" />
    
    {/* Eyes */}
    <rect x="40" y="50" width="10" height="10" fill="#FFCC00" />
    <rect x="70" y="50" width="10" height="10" fill="#FFCC00" />
    
    {/* Pupils */}
    <rect x="43" y="53" width="4" height="4" fill="#000" />
    <rect x="73" y="53" width="4" height="4" fill="#000" />
    
    {/* Nose */}
    <rect x="55" y="65" width="10" height="5" fill="#000" opacity="0.3" />
    
    {/* Tail */}
    <rect x="10" y="70" width="10" height="10" fill="#3366FF" />
    <rect x="0" y="60" width="10" height="10" fill="#3366FF" />
    
    {/* Feet */}
    <rect x="35" y="100" width="15" height="10" fill="#3366FF" />
    <rect x="70" y="100" width="15" height="10" fill="#3366FF" />
  </svg>
);

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [character, setCharacter] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('chinese-catto-words');
    if (saved) {
      try {
        setWords(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load words', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chinese-catto-words', JSON.stringify(words));
  }, [words]);

  const addWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !pinyin || !meaning) return;

    const newWord: Word = {
      id: crypto.randomUUID(),
      character,
      pinyin,
      meaning,
      createdAt: Date.now(),
    };

    setWords([newWord, ...words]);
    setCharacter('');
    setPinyin('');
    setMeaning('');
  };

  const deleteWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="crt-overlay" />
      <div className="crt-flicker" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="inline-block mb-6"
          >
            <PixelCat />
          </motion.div>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-pixel text-2xl md:text-4xl text-retro-yellow mb-2 tracking-tighter"
            style={{ textShadow: '4px 4px 0px #3366FF' }}
          >
            CHINESECATTO
          </motion.h1>
          <p className="text-retro-blue font-pixel text-[10px] opacity-80 uppercase">
            Retro Vocabulary Collector
          </p>
        </header>

        {/* Input Form */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-retro-surface p-6 pixel-border mb-12"
        >
          <form onSubmit={addWord} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block font-pixel text-[8px] text-retro-blue uppercase">Character</label>
                <input
                  type="text"
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="汉字"
                  className="w-full pixel-input"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-pixel text-[8px] text-retro-blue uppercase">Pinyin</label>
                <input
                  type="text"
                  value={pinyin}
                  onChange={(e) => setPinyin(e.target.value)}
                  placeholder="pīnyīn"
                  className="w-full pixel-input"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-pixel text-[8px] text-retro-blue uppercase">Meaning</label>
                <input
                  type="text"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="Meaning"
                  className="w-full pixel-input"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full pixel-button flex items-center justify-center gap-3 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>Add to Collection</span>
            </button>
          </form>
        </motion.section>

        {/* List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6 border-b-2 border-retro-border pb-2">
            <h2 className="font-pixel text-sm text-retro-yellow flex items-center gap-2">
              <Book size={16} />
              COLLECTION
            </h2>
            <span className="font-pixel text-[8px] text-retro-blue">
              {words.length} ITEMS FOUND
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {words.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border-2 border-dashed border-retro-border rounded-lg"
              >
                <Sparkles className="mx-auto mb-4 text-retro-border" size={32} />
                <p className="font-pixel text-[10px] text-retro-border uppercase">
                  Your collection is empty...
                </p>
              </motion.div>
            ) : (
              words.map((word) => (
                <motion.div
                  key={word.id}
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="bg-retro-surface p-4 flex items-center justify-between group hover:border-retro-yellow transition-colors border-2 border-transparent"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-retro-bg flex items-center justify-center text-3xl font-bold text-retro-yellow">
                      {word.character}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[10px] text-white uppercase">{word.pinyin}</span>
                        <button 
                          onClick={() => speak(word.character)}
                          className="text-retro-blue hover:text-retro-yellow opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                      <p className="text-retro-blue text-sm">{word.meaning}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="p-2 text-retro-border hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>

        {/* Footer */}
        <footer className="mt-20 text-center border-t border-retro-border pt-8">
          <p className="font-pixel text-[8px] text-retro-border uppercase tracking-widest">
            © 2026 ChineseCatto • System v1.0.0
          </p>
        </footer>
      </div>
    </div>
  );
}
