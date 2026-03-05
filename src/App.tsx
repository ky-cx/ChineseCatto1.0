import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Book, Sparkles, Volume2, Github, LogOut, User as UserIcon, Map as MapIcon, Settings as SettingsIcon, Home as HomeIcon, ChevronRight, Lock, MessageSquare, Send, Loader2, Sun, Moon, ArrowLeft, CheckCircle2, Cat, ShoppingBag, Timer, Play, Pause, Square, Coins } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type View = 'home' | 'map' | 'settings' | 'level' | 'library' | 'shop';
type HomeSubView = 'chat' | 'collector';
type Theme = 'dark' | 'light';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
}

interface MapCat {
  id: string;
  name: string;
  imageUrl: string;
  unlocked: boolean;
  rarity: 'Common' | 'Rare' | 'Legendary';
  description: string;
}

interface Level {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'current' | 'completed';
  content: { char: string; pinyin: string; meaning: string }[];
  order: number;
}

interface Message {
  role: 'user' | 'cat';
  text: string;
}

interface User {
  id: string;
  github_id: number;
  username: string;
  avatar_url: string;
}

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  createdAt: number;
}

const PixelCat = ({ className = "", animated = true }: { className?: string; animated?: boolean }) => (
  <motion.div
    animate={animated ? {
      y: [0, -4, 0],
      scaleY: [1, 0.95, 1],
    } : {}}
    transition={{
      duration: 0.4,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    <svg width="80" height="80" viewBox="0 0 120 120" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
      {/* Body - Blue */}
      <rect x="30" y="40" width="60" height="60" fill="#2563eb" />
      <rect x="20" y="50" width="10" height="40" fill="#2563eb" />
      <rect x="90" y="50" width="10" height="40" fill="#2563eb" />
      
      {/* Belly - Lighter Blue */}
      <rect x="45" y="60" width="30" height="40" fill="#60a5fa" />
      
      {/* Wings - Yellow/Cyan */}
      <motion.g
        animate={animated ? {
          rotate: [-5, 10, -5],
          y: [0, -2, 0]
        } : {}}
        transition={{ duration: 0.2, repeat: Infinity }}
        style={{ originX: '60px', originY: '40px' }}
      >
        <rect x="10" y="30" width="20" height="10" fill="#fbbf24" />
        <rect x="5" y="20" width="15" height="10" fill="#22d3ee" />
        <rect x="90" y="30" width="20" height="10" fill="#fbbf24" />
        <rect x="100" y="20" width="15" height="10" fill="#22d3ee" />
      </motion.g>

      {/* Ears */}
      <rect x="30" y="20" width="20" height="20" fill="#1e40af" />
      <rect x="70" y="20" width="20" height="20" fill="#1e40af" />
      
      {/* Eyes - Yellow */}
      <rect x="40" y="50" width="10" height="10" fill="#facc15" />
      <rect x="70" y="50" width="10" height="10" fill="#facc15" />
      
      {/* Pupils */}
      <rect x="43" y="53" width="4" height="4" fill="#000" />
      <rect x="73" y="53" width="4" height="4" fill="#000" />
      
      {/* Nose - Pink */}
      <rect x="55" y="65" width="10" height="5" fill="#f472b6" />
      
      {/* Tail */}
      <motion.rect 
        x="100" y="60" width="10" height="10" fill="#2563eb"
        animate={animated ? { rotate: [-10, 10, -10] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <rect x="110" y="50" width="10" height="10" fill="#2563eb" />
      
      {/* Feet - Walking Animation */}
      <motion.rect 
        x="35" y="100" width="15" height="10" fill="#1e40af" 
        animate={animated ? { y: [0, -5, 0], x: [35, 30, 35] } : {}}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
      <motion.rect 
        x="70" y="100" width="15" height="10" fill="#1e40af" 
        animate={animated ? { y: [0, -5, 0], x: [70, 75, 70] } : {}}
        transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
      />
    </svg>
  </motion.div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [homeSubView, setHomeSubView] = useState<HomeSubView>('chat');
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'cat', text: 'Meow! I am Catto. Want to learn some Chinese today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [character, setCharacter] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [loading, setLoading] = useState(true);
  const [mapCats, setMapCats] = useState<MapCat[]>([
    {
      id: 'cat-1',
      name: 'Classic Ginger',
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=80',
      unlocked: true,
      rarity: 'Common',
      description: 'A friendly ginger cat that loves sunshine.'
    },
    {
      id: 'cat-2',
      name: 'Midnight Shadow',
      imageUrl: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Rare',
      description: 'A mysterious black cat that disappears in the night.'
    },
    {
      id: 'cat-3',
      name: 'Snowball',
      imageUrl: 'https://images.unsplash.com/photo-1573865668131-973177e81a4e?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Legendary',
      description: 'A fluffy white cat as soft as a cloud.'
    },
    {
      id: 'cat-4',
      name: 'Sakura Neko',
      imageUrl: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Rare',
      description: 'A cat that loves cherry blossoms.'
    },
    {
      id: 'cat-5',
      name: 'Calico Dream',
      imageUrl: 'https://images.unsplash.com/photo-1533733358354-2e1603f7a203?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Common',
      description: 'A colorful cat with a playful spirit.'
    },
    {
      id: 'cat-6',
      name: 'Tuxedo Gent',
      imageUrl: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Rare',
      description: 'Always dressed for a fancy occasion.'
    },
    {
      id: 'cat-7',
      name: 'Azure Guardian',
      imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=80',
      unlocked: false,
      rarity: 'Legendary',
      description: 'A mystical blue cat with shimmering wings that protects the ancient scrolls.'
    }
  ]);
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [catCoins, setCatCoins] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const shopItems: ShopItem[] = [
    { id: 'food-1', name: 'Premium Tuna', price: 50, description: 'Delicious tuna for your cat.', icon: '🐟' },
    { id: 'toy-1', name: 'Laser Pointer', price: 100, description: 'Endless fun for any cat.', icon: '🔦' },
    { id: 'toy-2', name: 'Catnip Mouse', price: 80, description: 'A classic toy cats love.', icon: '🐭' },
    { id: 'bed-1', name: 'Luxury Bed', price: 300, description: 'A soft bed for royal naps.', icon: '🛏️' },
    { id: 'groom-1', name: 'Golden Brush', price: 150, description: 'Keep that fur shiny!', icon: '🖌️' },
  ];

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (e) {
      console.error('Failed to fetch user', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWords = useCallback(async () => {
    if (!user) {
      const saved = localStorage.getItem('chinese-catto-words');
      if (saved) {
        try {
          setWords(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load words', e);
        }
      } else {
        setWords([]);
      }
      return;
    }

    try {
      const res = await fetch('/api/words');
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      }
    } catch (e) {
      console.error('Failed to fetch words from API', e);
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('catto-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('catto-theme', theme);
  }, [theme]);

  const TOPICS = [
    { title: 'Numbers', desc: '1-10', content: [{ char: '一', pinyin: 'yī', meaning: '1' }, { char: '二', pinyin: 'èr', meaning: '2' }, { char: '三', pinyin: 'sān', meaning: '3' }, { char: '四', pinyin: 'sì', meaning: '4' }, { char: '五', pinyin: 'wǔ', meaning: '5' }, { char: '六', pinyin: 'liù', meaning: '6' }, { char: '七', pinyin: 'qī', meaning: '7' }, { char: '八', pinyin: 'bā', meaning: '8' }, { char: '九', pinyin: 'jiǔ', meaning: '9' }, { char: '十', pinyin: 'shí', meaning: '10' }] },
    { title: 'Greetings', desc: 'Basic hellos', content: [{ char: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello' }, { char: '谢谢', pinyin: 'xièxie', meaning: 'Thank you' }, { char: '不客气', pinyin: 'bú kèqi', meaning: "You're welcome" }, { char: '再见', pinyin: 'zàijiàn', meaning: 'Goodbye' }] },
    { title: 'Family', desc: 'Mom and Dad', content: [{ char: '爸爸', pinyin: 'bàba', meaning: 'Dad' }, { char: '妈妈', pinyin: 'māma', meaning: 'Mom' }, { char: '哥哥', pinyin: 'gēge', meaning: 'Older Brother' }, { char: '姐姐', pinyin: 'jiějie', meaning: 'Older Sister' }] },
    { title: 'Food', desc: 'Common dishes', content: [{ char: '米饭', pinyin: 'mǐfàn', meaning: 'Rice' }, { char: '面条', pinyin: 'miàntiáo', meaning: 'Noodles' }, { char: '水', pinyin: 'shuǐ', meaning: 'Water' }, { char: '茶', pinyin: 'chá', meaning: 'Tea' }] },
    { title: 'Animals', desc: 'Pets and more', content: [{ char: '猫', pinyin: 'māo', meaning: 'Cat' }, { char: '狗', pinyin: 'gǒu', meaning: 'Dog' }, { char: '鸟', pinyin: 'niǎo', meaning: 'Bird' }, { char: '鱼', pinyin: 'yú', meaning: 'Fish' }] },
    { title: 'Colors', desc: 'Rainbow colors', content: [{ char: '红', pinyin: 'hóng', meaning: 'Red' }, { char: '蓝', pinyin: 'lán', meaning: 'Blue' }, { char: '绿', pinyin: 'lǜ', meaning: 'Green' }, { char: '黄', pinyin: 'huáng', meaning: 'Yellow' }] },
    { title: 'Nature', desc: 'Sun and Moon', content: [{ char: '日', pinyin: 'rì', meaning: 'Sun' }, { char: '月', pinyin: 'yuè', meaning: 'Moon' }, { char: '山', pinyin: 'shān', meaning: 'Mountain' }, { char: '水', pinyin: 'shuǐ', meaning: 'Water' }] },
  ];

  const generateLevel = (index: number): Level => {
    const topic = TOPICS[index % TOPICS.length];
    return {
      id: `level-${index + 1}`,
      title: `${topic.title} ${Math.floor(index / TOPICS.length) + 1}`,
      description: topic.desc,
      status: index === 0 ? 'current' : 'locked',
      content: topic.content,
      order: index
    };
  };

  const [levels, setLevels] = useState<Level[]>(() => {
    const initialLevels = [];
    for (let i = 0; i < 10; i++) {
      initialLevels.push(generateLevel(i));
    }
    return initialLevels;
  });

  useEffect(() => {
    const savedLevels = localStorage.getItem('catto-levels');
    if (savedLevels) {
      try {
        setLevels(JSON.parse(savedLevels));
      } catch (e) {
        console.error('Failed to load levels', e);
      }
    }
    const savedCats = localStorage.getItem('catto-cats');
    if (savedCats) {
      try {
        setMapCats(JSON.parse(savedCats));
      } catch (e) {
        console.error('Failed to load cats', e);
      }
    }
    const savedActiveCat = localStorage.getItem('catto-active-cat');
    if (savedActiveCat) setActiveCatIndex(parseInt(savedActiveCat));

    const savedCoins = localStorage.getItem('catto-coins');
    if (savedCoins) setCatCoins(parseInt(savedCoins));

    const savedInventory = localStorage.getItem('catto-inventory');
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (e) {
        console.error('Failed to load inventory', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('catto-levels', JSON.stringify(levels));
    localStorage.setItem('catto-cats', JSON.stringify(mapCats));
    localStorage.setItem('catto-active-cat', activeCatIndex.toString());
    localStorage.setItem('catto-coins', catCoins.toString());
    localStorage.setItem('catto-inventory', JSON.stringify(inventory));
  }, [levels, mapCats, activeCatIndex, catCoins, inventory]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop timer and award coins
      const minutes = Math.floor(timerSeconds / 60);
      const coinsEarned = minutes * 10; // 10 coins per minute
      if (coinsEarned > 0) {
        setCatCoins(prev => prev + coinsEarned);
        setMessages(prev => [...prev, { role: 'cat', text: `Meow! You studied for ${minutes} minutes and earned ${coinsEarned} Cat Coins! Purr-fect!` }]);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);
    } else {
      setIsTimerRunning(true);
    }
  };

  const buyItem = (item: ShopItem) => {
    if (catCoins >= item.price) {
      setCatCoins(prev => prev - item.price);
      setInventory(prev => {
        const existing = prev.find(i => i.itemId === item.id);
        if (existing) {
          return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { id: crypto.randomUUID(), itemId: item.id, quantity: 1 }];
      });
      setMessages(prev => [...prev, { role: 'cat', text: `Meow! You bought ${item.name}! Your cat will love it!` }]);
    } else {
      setMessages(prev => [...prev, { role: 'cat', text: `Meow... You don't have enough coins for ${item.name}. Keep studying!` }]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startLevel = (level: Level) => {
    if (level.status === 'locked') return;
    setSelectedLevel(level);
    setLevelProgress(0);
    setCurrentView('level');
  };

  const nextStep = () => {
    if (selectedLevel && levelProgress < selectedLevel.content.length - 1) {
      setLevelProgress(prev => prev + 1);
    } else if (selectedLevel) {
      // Level completed
      const currentLevelId = selectedLevel.id;
      const currentOrder = selectedLevel.order;
      
      setLevels(prevLevels => {
        const newLevels = prevLevels.map((lvl) => {
          if (lvl.id === currentLevelId) {
            return { ...lvl, status: 'completed' as const };
          }
          if (lvl.order === currentOrder + 1 && lvl.status === 'locked') {
            return { ...lvl, status: 'current' as const };
          }
          return lvl;
        });

        // Unlock a cat every 5 levels (order 4, 9, 14...)
        if ((currentOrder + 1) % 5 === 0) {
          setMapCats(prevCats => {
            const lockedCats = prevCats.filter(c => !c.unlocked);
            if (lockedCats.length > 0) {
              const catToUnlock = lockedCats[0];
              return prevCats.map(c => c.id === catToUnlock.id ? { ...c, unlocked: true } : c);
            }
            return prevCats;
          });
          setMessages(prev => [...prev, { role: 'cat', text: `Meow! You reached a milestone! A new cat has been added to your library! Purr-fect!` }]);
        }

        // If we completed the last available level, generate more
        if (currentOrder === prevLevels.length - 1) {
          const nextLevel = generateLevel(currentOrder + 1);
          nextLevel.status = 'current';
          return [...newLevels.map(l => l.id === currentLevelId ? {...l, status: 'completed' as const} : l), nextLevel];
        }
        
        // Always ensure we have at least 5 levels ahead of the current one
        const lastOrder = newLevels[newLevels.length - 1].order;
        if (lastOrder - currentOrder < 5) {
          const extraLevels = [];
          for (let i = 1; i <= 5; i++) {
            extraLevels.push(generateLevel(lastOrder + i));
          }
          return [...newLevels, ...extraLevels];
        }

        return newLevels;
      });

      setCurrentView('map');
      setSelectedLevel(null);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchUser]);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (e) {
      console.error('Login error', e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    fetchWords();
  };

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !pinyin || !meaning) return;

    if (user) {
      try {
        const res = await fetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character, pinyin, meaning }),
        });
        if (res.ok) {
          const newWord = await res.json();
          setWords([newWord, ...words]);
        }
      } catch (e) {
        console.error('Failed to add word to API', e);
      }
    } else {
      const newWord: Word = {
        id: crypto.randomUUID(),
        character,
        pinyin,
        meaning,
        createdAt: Date.now(),
      };
      const updated = [newWord, ...words];
      setWords(updated);
      localStorage.setItem('chinese-catto-words', JSON.stringify(updated));
    }

    setCharacter('');
    setPinyin('');
    setMeaning('');
  };

  const deleteWord = async (id: string) => {
    if (user) {
      try {
        const res = await fetch(`/api/words/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setWords(words.filter(w => w.id !== id));
        }
      } catch (e) {
        console.error('Failed to delete word from API', e);
      }
    } else {
      const updated = words.filter(w => w.id !== id);
      setWords(updated);
      localStorage.setItem('chinese-catto-words', JSON.stringify(updated));
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are 'Catto', a helpful and cute blue pixel cat who helps users learn Chinese. Keep your responses short, encouraging, and use a bit of cat-like personality (meows, purrs). If the user asks about words, encourage them to add them to the collector.",
        },
      });

      const catText = response.text || "Meow... I got distracted by a laser pointer. Can you say that again?";
      setMessages(prev => [...prev, { role: 'cat', text: catText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'cat', text: "Meow... My brain is fuzzy. Check your connection!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-bg">
        <div className="font-pixel text-retro-accent animate-pulse">LOADING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 relative">
      <div className="crt-overlay" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* User Profile Bar (Mini) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-1">
            <div className="font-pixel text-[8px] text-retro-accent">
              SYSTEM_STATUS: <span className="text-green-500">ONLINE</span>
            </div>
            <div className="flex items-center gap-2 bg-retro-surface px-2 py-1 pixel-border">
              <Coins size={10} className="text-yellow-500" />
              <span className="font-pixel text-[8px] text-retro-accent">{catCoins}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Study Timer Mini */}
            <div className={`flex items-center gap-2 bg-retro-surface px-2 py-1 pixel-border ${isTimerRunning ? 'border-retro-accent animate-pulse' : ''}`}>
              <Timer size={10} className={isTimerRunning ? 'text-retro-accent' : 'text-retro-primary'} />
              <span className="font-pixel text-[8px] text-retro-accent">{formatTime(timerSeconds)}</span>
              <button onClick={toggleTimer} className="text-retro-primary hover:text-retro-accent">
                {isTimerRunning ? <Square size={10} /> : <Play size={10} />}
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 bg-retro-surface p-1 pixel-border">
                <img src={user.avatar_url} alt={user.username} className="w-6 h-6 pixel-border border-retro-primary" />
                <span className="font-pixel text-[6px] text-retro-accent uppercase">{user.username}</span>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="font-pixel text-[8px] text-retro-primary hover:text-retro-accent transition-colors"
              >
                [ CONNECT_GITHUB ]
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Header */}
              <header className="text-center mb-8">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block mb-4"
                >
                  <PixelCat />
                </motion.div>
                <h1 className="font-pixel text-xl text-retro-accent tracking-tighter">
                  CHINESECATTO
                </h1>
              </header>

              {/* Home Sub-Navigation */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setHomeSubView('chat')}
                  className={`flex-1 py-2 font-pixel text-[8px] pixel-border transition-colors ${homeSubView === 'chat' ? 'bg-retro-primary text-white' : 'bg-retro-surface text-retro-primary'}`}
                >
                  CHAT_WITH_CATTO
                </button>
                <button 
                  onClick={() => setHomeSubView('collector')}
                  className={`flex-1 py-2 font-pixel text-[8px] pixel-border transition-colors ${homeSubView === 'collector' ? 'bg-retro-primary text-white' : 'bg-retro-surface text-retro-primary'}`}
                >
                  WORD_COLLECTOR
                </button>
              </div>

              <AnimatePresence mode="wait">
                {homeSubView === 'chat' ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-retro-surface p-4 pixel-border h-[300px] overflow-y-auto space-y-4 scrollbar-hide">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 pixel-border ${msg.role === 'user' ? 'bg-retro-primary text-white' : 'bg-retro-bg border-retro-primary'}`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-retro-bg border-retro-primary p-3 pixel-border flex items-center gap-2">
                            <Loader2 size={12} className="animate-spin text-retro-primary" />
                            <span className="font-pixel text-[8px] text-retro-primary">CATTO_IS_THINKING...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Say something to Catto..."
                        className="flex-1 pixel-input text-sm"
                      />
                      <button type="submit" className="pixel-button px-4">
                        <Send size={16} />
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collector"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Input Form */}
                    <section className="bg-retro-surface p-6 pixel-border mb-8">
                      <form onSubmit={addWord} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block font-pixel text-[8px] text-retro-primary uppercase">Character</label>
                            <input
                              type="text"
                              value={character}
                              onChange={(e) => setCharacter(e.target.value)}
                              placeholder="汉字"
                              className="w-full pixel-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block font-pixel text-[8px] text-retro-primary uppercase">Pinyin</label>
                            <input
                              type="text"
                              value={pinyin}
                              onChange={(e) => setPinyin(e.target.value)}
                              placeholder="pīnyīn"
                              className="w-full pixel-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block font-pixel text-[8px] text-retro-primary uppercase">Meaning</label>
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
                    </section>

                    {/* List Section */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between mb-6 border-b-2 border-retro-border pb-2">
                        <h2 className="font-pixel text-sm text-retro-accent flex items-center gap-2">
                          <Book size={16} />
                          COLLECTION
                        </h2>
                        <span className="font-pixel text-[8px] text-retro-primary">
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
                              className="bg-retro-surface p-4 flex items-center justify-between group hover:border-retro-accent transition-colors border-2 border-transparent"
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-retro-bg flex items-center justify-center text-3xl font-bold text-retro-accent">
                                  {word.character}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-pixel text-[10px] text-retro-text uppercase">{word.pinyin}</span>
                                    <button 
                                      onClick={() => speak(word.character)}
                                      className="text-retro-primary hover:text-retro-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Volume2 size={12} />
                                    </button>
                                  </div>
                                  <p className="text-retro-primary text-sm">{word.meaning}</p>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-180px)] flex flex-col"
            >
              <div className="text-center mb-4">
                <h2 className="font-pixel text-sm text-retro-accent uppercase tracking-widest mb-1">Infinite Journey</h2>
                <p className="font-pixel text-[6px] text-retro-primary opacity-60">CLIMB THE ENDLESS PATH OF KNOWLEDGE</p>
              </div>
              
              <div className="flex-1 bg-[#4ade80]/20 relative overflow-y-auto overflow-x-hidden scrollbar-hide p-8 rounded-3xl">
                {/* Meadow Decorations */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                      className="absolute text-[10px]"
                      style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 2000}px` 
                      }}
                    >
                      {['🌱', '🌸', '🌼', '🍀'][Math.floor(Math.random() * 4)]}
                    </motion.div>
                  ))}
                </div>

                {/* The Path */}
                <div className="relative min-h-[2000px] w-full flex flex-col items-center py-20">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                    <path
                      d={levels.map((l, i) => {
                        const x = 50 + Math.sin(i * 0.8) * 30;
                        const y = i * 200 + 100;
                        return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#166534"
                      strokeWidth="4"
                      strokeDasharray="8 8"
                      className="opacity-30"
                    />
                  </svg>

                  {/* Walking Cat on Map */}
                  {(() => {
                    const currentLvlIdx = levels.findIndex(l => l.status === 'current');
                    const targetLvl = levels[currentLvlIdx] || levels[0];
                    const xOffset = Math.sin(currentLvlIdx * 0.8) * 30;
                    const yPos = currentLvlIdx * 200 + 100;

                    return (
                      <motion.div
                        animate={{ 
                          x: xOffset * 2, // Scale offset for visual better placement
                          y: yPos - 60
                        }}
                        transition={{ type: 'spring', stiffness: 50 }}
                        className="absolute z-30 pointer-events-none"
                      >
                        <PixelCat animated={true} className="scale-50" />
                      </motion.div>
                    );
                  })()}

                  {levels.map((level, i) => {
                    const xOffset = Math.sin(i * 0.8) * 30;
                    const isMilestone = (i + 1) % 5 === 0;
                    const milestoneCat = isMilestone ? mapCats[Math.floor(i / 5) % mapCats.length] : null;

                    return (
                      <div key={level.id} className="relative w-full flex flex-col items-center">
                        {/* Milestone Background Cat */}
                        {isMilestone && milestoneCat && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 0.25, scale: 1 }}
                            className="absolute -z-10 w-48 h-48 overflow-hidden grayscale-0 opacity-30"
                            style={{ 
                              left: i % 2 === 0 ? '5%' : '65%',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          >
                            <img 
                              src={milestoneCat.imageUrl} 
                              alt="milestone" 
                              className="w-full h-full object-cover pixel-border"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Fallback if image fails
                                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/cat/200/200';
                              }}
                            />
                            <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-black/40 to-transparent">
                              <span className="font-pixel text-[8px] text-white uppercase">{milestoneCat.name}</span>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          style={{ 
                            marginLeft: `${xOffset}%`,
                            marginTop: i === 0 ? 0 : 150
                          }}
                          className="relative z-10"
                        >
                          <div className="relative group/node">
                            <button
                              onClick={() => startLevel(level)}
                              disabled={level.status === 'locked'}
                              className={`w-16 h-16 pixel-border flex flex-col items-center justify-center transition-all relative ${
                                level.status === 'completed' ? 'bg-green-500 border-green-700' :
                                level.status === 'current' ? 'bg-retro-primary border-rose-700 animate-bounce' :
                                'bg-retro-surface border-retro-border grayscale cursor-not-allowed'
                              } hover:scale-110 active:scale-95 shadow-lg`}
                            >
                              {level.status === 'locked' ? (
                                <Lock size={20} className="text-retro-border" />
                              ) : (
                                <>
                                  <span className="font-pixel text-[12px] text-white drop-shadow-md">{i + 1}</span>
                                  <div className="absolute -bottom-6 whitespace-nowrap">
                                    <span className="font-pixel text-[6px] text-retro-accent uppercase">{level.title}</span>
                                  </div>
                                  {isMilestone && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 p-1 pixel-border animate-pulse">
                                      <Sparkles size={10} className="text-white" />
                                    </div>
                                  )}
                                </>
                              )}
                            </button>

                            {/* Level Info Tooltip */}
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                              <div className="bg-retro-surface pixel-border p-3 shadow-xl max-w-[150px]">
                                <p className="font-pixel text-[8px] text-retro-accent mb-1">{level.title}</p>
                                <p className="font-pixel text-[6px] text-retro-primary uppercase leading-tight">{level.description}</p>
                                {isMilestone && <p className="font-pixel text-[5px] text-yellow-500 mt-1">✨ CAT UNLOCK MILESTONE ✨</p>}
                                {level.status === 'completed' && (
                                  <div className="mt-2 flex items-center gap-1 text-green-500">
                                    <CheckCircle2 size={10} />
                                    <span className="font-pixel text-[5px]">MASTERED</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  }).reverse()}
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 py-4 bg-retro-surface border-t-2 border-retro-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 pixel-border border-green-700" />
                  <span className="font-pixel text-[6px] text-retro-primary uppercase">Mastered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-retro-primary pixel-border border-rose-700" />
                  <span className="font-pixel text-[6px] text-retro-primary uppercase">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-retro-surface pixel-border border-retro-border" />
                  <span className="font-pixel text-[6px] text-retro-primary uppercase">Locked</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'level' && selectedLevel && (
            <motion.div
              key="level"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentView('map')} className="pixel-button p-2">
                  <ArrowLeft size={16} />
                </button>
                <div className="font-pixel text-[10px] text-retro-accent">
                  {selectedLevel.title} - {levelProgress + 1}/{selectedLevel.content.length}
                </div>
              </div>

              <div className="bg-retro-surface p-12 pixel-border text-center space-y-8">
                <motion.div
                  key={levelProgress}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-8xl font-bold text-retro-accent mb-4">
                    {selectedLevel.content[levelProgress].char}
                  </div>
                  <div className="font-pixel text-xl text-retro-primary uppercase tracking-widest">
                    {selectedLevel.content[levelProgress].pinyin}
                  </div>
                  <div className="text-2xl text-retro-text opacity-80">
                    {selectedLevel.content[levelProgress].meaning}
                  </div>
                </motion.div>

                <div className="flex justify-center gap-4">
                  <button onClick={() => speak(selectedLevel.content[levelProgress].char)} className="pixel-button">
                    <Volume2 size={20} />
                  </button>
                  <button onClick={nextStep} className="pixel-button flex items-center gap-2">
                    <span>{levelProgress === selectedLevel.content.length - 1 ? 'FINISH' : 'NEXT'}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <section className="bg-retro-surface p-6 pixel-border">
                <h3 className="font-pixel text-[10px] text-retro-accent mb-6 flex items-center gap-2">
                  <UserIcon size={16} />
                  USER_PROFILE
                </h3>
                <div className="flex items-center gap-4 p-4 bg-retro-bg pixel-border">
                  <div className="w-12 h-12 bg-retro-primary pixel-border flex items-center justify-center">
                    <Github size={24} />
                  </div>
                  <div>
                    <p className="font-pixel text-[8px] text-retro-text uppercase">CATTO_USER_01</p>
                    <p className="text-[8px] text-retro-primary uppercase">Status: Online</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto p-2 text-retro-border hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                  </button>
                </div>
              </section>

              <section className="bg-retro-surface p-6 pixel-border">
                <h3 className="font-pixel text-[10px] text-retro-accent mb-6 flex items-center gap-2">
                  <SettingsIcon size={16} />
                  SYSTEM_CONFIG
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-pixel text-[8px] text-retro-text flex items-center gap-2">
                      {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                      THEME: {theme.toUpperCase()}
                    </span>
                    <button 
                      onClick={toggleTheme}
                      className={`w-12 h-6 pixel-border relative transition-colors ${theme === 'light' ? 'bg-retro-primary' : 'bg-retro-border'}`}
                    >
                      <motion.div 
                        animate={{ x: theme === 'light' ? 24 : 0 }}
                        className="absolute top-0 left-0 w-6 h-6 bg-white pixel-border" 
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-pixel text-[8px] text-retro-text">CRT_SCANLINES</span>
                    <div className="w-12 h-6 bg-retro-primary pixel-border relative">
                      <div className="absolute top-0 right-1 w-4 h-2 bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-pixel text-[8px] text-retro-text">AUTO_SYNC</span>
                    <div className="w-12 h-6 bg-retro-primary pixel-border relative">
                      <div className="absolute top-0 right-1 w-4 h-2 bg-white" />
                    </div>
                  </div>
                </div>
              </section>

              <div className="text-center">
                <p className="font-pixel text-[8px] text-retro-border">CHINESECATTO ENGINE V2.1.0</p>
                <p className="font-pixel text-[8px] text-retro-border mt-2">© 2024 PIXELCAT STUDIOS</p>
              </div>
            </motion.div>
          )}

          {currentView === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="font-pixel text-sm text-retro-accent uppercase tracking-widest mb-2">Cat Shop</h2>
                <p className="font-pixel text-[6px] text-retro-primary opacity-60">BUY TREATS AND TOYS FOR YOUR CAT</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shopItems.map((item) => (
                  <div key={item.id} className="bg-retro-surface pixel-border p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-retro-bg pixel-border flex items-center justify-center text-2xl">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-pixel text-[10px] text-retro-accent">{item.name}</h3>
                        <p className="font-pixel text-[6px] text-retro-primary opacity-80">{item.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyItem(item)}
                      disabled={catCoins < item.price}
                      className={`pixel-button px-4 py-2 flex items-center gap-2 ${catCoins < item.price ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      <Coins size={12} className="text-yellow-500" />
                      <span className="font-pixel text-[8px]">{item.price}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-retro-surface p-6 pixel-border">
                <h3 className="font-pixel text-[10px] text-retro-accent mb-4 flex items-center gap-2">
                  <ShoppingBag size={16} />
                  YOUR_INVENTORY
                </h3>
                {inventory.length === 0 ? (
                  <p className="font-pixel text-[6px] text-retro-primary opacity-60 text-center py-4">INVENTORY IS EMPTY</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {inventory.map((inv) => {
                      const item = shopItems.find(si => si.id === inv.itemId);
                      return (
                        <div key={inv.id} className="bg-retro-bg p-2 pixel-border flex items-center gap-2">
                          <span className="text-lg">{item?.icon}</span>
                          <div className="flex-1">
                            <p className="font-pixel text-[6px] text-retro-accent truncate">{item?.name}</p>
                            <p className="font-pixel text-[6px] text-retro-primary">QTY: {inv.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="font-pixel text-sm text-retro-accent uppercase tracking-widest mb-2">Cat Library</h2>
                <p className="font-pixel text-[6px] text-retro-primary opacity-60">COLLECTED MAP CATS</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mapCats.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    whileHover={{ y: -5 }}
                    className={`bg-retro-surface pixel-border p-3 relative overflow-hidden group ${!cat.unlocked && 'opacity-50'}`}
                  >
                    <div className="aspect-square mb-3 relative overflow-hidden pixel-border">
                      {cat.unlocked ? (
                        <img 
                          src={cat.imageUrl} 
                          alt={cat.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-retro-bg flex items-center justify-center">
                          <Lock size={24} className="text-retro-border" />
                        </div>
                      )}
                      <div className={`absolute top-1 right-1 px-1 py-0.5 font-pixel text-[4px] text-white ${
                        cat.rarity === 'Legendary' ? 'bg-yellow-500' :
                        cat.rarity === 'Rare' ? 'bg-purple-500' : 'bg-retro-primary'
                      }`}>
                        {cat.rarity}
                      </div>
                    </div>
                    <h3 className="font-pixel text-[8px] text-retro-accent mb-1">{cat.name}</h3>
                    <p className="font-pixel text-[5px] text-retro-primary leading-tight">
                      {cat.description}
                    </p>
                    
                    {activeCatIndex !== idx && (
                      <button 
                        onClick={() => {
                          setActiveCatIndex(idx);
                          // Reset levels for a new map with this cat
                          setLevels(prev => {
                            const reset = prev.map((l, i) => ({
                              ...l,
                              status: i === 0 ? 'current' : 'locked' as const
                            }));
                            // If we have many levels, maybe just keep the first few
                            return reset.slice(0, 10);
                          });
                          setCurrentView('map');
                        }}
                        className="mt-3 w-full pixel-button text-[6px] py-1"
                      >
                        {cat.unlocked ? 'USE THIS CAT' : 'START QUEST'}
                      </button>
                    )}
                    {activeCatIndex === idx && (
                      <div className="mt-3 w-full bg-green-500 text-white font-pixel text-[6px] py-1 text-center pixel-border border-green-700">
                        ACTIVE
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="bg-retro-surface p-4 pixel-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-pixel text-[6px] text-retro-primary uppercase">Collection Progress</span>
                  <span className="font-pixel text-[6px] text-retro-accent">
                    {mapCats.filter(c => c.unlocked).length} / {mapCats.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-retro-bg pixel-border overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(mapCats.filter(c => c.unlocked).length / mapCats.length) * 100}%` }}
                    className="h-full bg-retro-primary"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-retro-surface border-t-4 border-retro-border p-4 z-50">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <button 
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center gap-2 transition-colors ${currentView === 'home' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <HomeIcon size={20} />
              <span className="font-pixel text-[6px] uppercase">Home</span>
            </button>
            <button 
              onClick={() => setCurrentView('map')}
              className={`flex flex-col items-center gap-2 transition-colors ${currentView === 'map' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <MapIcon size={20} />
              <span className="font-pixel text-[6px] uppercase">Map</span>
            </button>
            <button 
              onClick={() => setCurrentView('library')}
              className={`flex flex-col items-center gap-2 transition-colors ${currentView === 'library' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <Cat size={20} />
              <span className="font-pixel text-[6px] uppercase">Library</span>
            </button>
            <button 
              onClick={() => setCurrentView('shop')}
              className={`flex flex-col items-center gap-2 transition-colors ${currentView === 'shop' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <ShoppingBag size={20} />
              <span className="font-pixel text-[6px] uppercase">Shop</span>
            </button>
            <button 
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center gap-2 transition-colors ${currentView === 'settings' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <SettingsIcon size={20} />
              <span className="font-pixel text-[6px] uppercase">Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
