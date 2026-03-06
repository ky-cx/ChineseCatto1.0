import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Book, Sparkles, Volume2, Github, LogOut, User as UserIcon, Map as MapIcon, Settings as SettingsIcon, Home as HomeIcon, ChevronRight, Lock, MessageSquare, Send, Loader2, Sun, Moon, ArrowLeft, CheckCircle2, Cat, ShoppingBag, Timer, Play, Pause, Square, Coins, Heart, Flame } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type View = 'home' | 'map' | 'settings' | 'level' | 'library' | 'shop' | 'vocabulary';
type HomeSubView = 'chat' | 'collector';
type Theme = 'dark' | 'light' | 'colorful';

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
  animalType: string;
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
  cat_coins?: number;
  inventory?: string;
  mood?: number;
  current_map_level?: number;
  passive_earned?: number;
  timer_start_time?: number;
  streak_count?: number;
}

interface Word {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  createdAt: number;
}

const PixelAnimalHouse = ({ type, color, status, className = "" }: { type: string; color: string; status: string; className?: string }) => {
  const isLocked = status === 'locked';
  const fillColor = isLocked ? '#9ca3af' : color;
  
  return (
    <div className={`relative ${className}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-md">
        {/* House Base */}
        <rect x="12" y="28" width="40" height="32" fill={fillColor} />
        {/* Roof */}
        <path d="M8 32 L32 8 L56 32" stroke={isLocked ? '#4b5563' : 'white'} strokeWidth="4" fill="none" />
        
        {/* Animal Features */}
        {type === 'cat' && (
          <g>
            <rect x="16" y="16" width="12" height="12" fill={fillColor} /> {/* Left Ear */}
            <rect x="36" y="16" width="12" height="12" fill={fillColor} /> {/* Right Ear */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="30" y="46" width="4" height="2" fill="#f472b6" /> {/* Nose */}
            {/* Whiskers */}
            <rect x="14" y="46" width="6" height="1" fill="white" opacity="0.5" />
            <rect x="14" y="50" width="6" height="1" fill="white" opacity="0.5" />
            <rect x="44" y="46" width="6" height="1" fill="white" opacity="0.5" />
            <rect x="44" y="50" width="6" height="1" fill="white" opacity="0.5" />
          </g>
        )}
        {type === 'dog' && (
          <g>
            <rect x="8" y="24" width="8" height="16" fill={fillColor} /> {/* Ear L */}
            <rect x="48" y="24" width="8" height="16" fill={fillColor} /> {/* Ear R */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="28" y="44" width="8" height="6" fill="#1f2937" /> {/* Muzzle */}
            <rect x="31" y="45" width="2" height="2" fill="black" /> {/* Nose */}
          </g>
        )}
        {type === 'rabbit' && (
          <g>
            <rect x="18" y="4" width="8" height="24" fill={fillColor} /> {/* Ear L */}
            <rect x="38" y="4" width="8" height="24" fill={fillColor} /> {/* Ear R */}
            <rect x="20" y="8" width="4" height="16" fill="#fbcfe8" opacity="0.5" /> {/* Inner Ear L */}
            <rect x="40" y="8" width="4" height="16" fill="#fbcfe8" opacity="0.5" /> {/* Inner Ear R */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="30" y="46" width="4" height="4" fill="#f472b6" /> {/* Nose */}
          </g>
        )}
        {type === 'panda' && (
          <g>
            <rect x="12" y="18" width="12" height="12" fill="#1f2937" /> {/* Ear L */}
            <rect x="40" y="18" width="12" height="12" fill="#1f2937" /> {/* Ear R */}
            <rect x="18" y="36" width="12" height="12" fill="#1f2937" /> {/* Eye Patch L */}
            <rect x="34" y="36" width="12" height="12" fill="#1f2937" /> {/* Eye Patch R */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="30" y="48" width="4" height="2" fill="black" /> {/* Nose */}
          </g>
        )}
        {type === 'fox' && (
          <g>
            <rect x="12" y="16" width="12" height="12" fill={fillColor} /> {/* Ear L */}
            <rect x="40" y="16" width="12" height="12" fill={fillColor} /> {/* Ear R */}
            <rect x="14" y="18" width="8" height="8" fill="white" opacity="0.3" /> {/* Inner Ear L */}
            <rect x="42" y="18" width="8" height="8" fill="white" opacity="0.3" /> {/* Inner Ear R */}
            <rect x="12" y="48" width="40" height="12" fill="white" opacity="0.5" /> {/* White Muzzle Area */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="30" y="46" width="4" height="4" fill="#1f2937" /> {/* Nose */}
          </g>
        )}
        {type === 'bear' && (
          <g>
            <rect x="14" y="20" width="10" height="10" fill={fillColor} /> {/* Ear L */}
            <rect x="40" y="20" width="10" height="10" fill={fillColor} /> {/* Ear R */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="26" y="46" width="12" height="10" fill="white" opacity="0.3" /> {/* Muzzle */}
            <rect x="30" y="48" width="4" height="2" fill="black" /> {/* Nose */}
          </g>
        )}
        {type === 'frog' && (
          <g>
            <rect x="14" y="20" width="12" height="12" fill={fillColor} /> {/* Eye Bump L */}
            <rect x="38" y="20" width="12" height="12" fill={fillColor} /> {/* Eye Bump R */}
            <rect x="18" y="24" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="42" y="24" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="20" y="48" width="24" height="2" fill="#166534" /> {/* Mouth */}
            <rect x="16" y="44" width="6" height="4" fill="#f472b6" opacity="0.4" /> {/* Cheek L */}
            <rect x="42" y="44" width="6" height="4" fill="#f472b6" opacity="0.4" /> {/* Cheek R */}
          </g>
        )}
        {type === 'pig' && (
          <g>
            <rect x="12" y="24" width="8" height="8" fill={fillColor} /> {/* Ear L */}
            <rect x="44" y="24" width="8" height="8" fill={fillColor} /> {/* Ear R */}
            <rect x="22" y="40" width="4" height="4" fill="white" /> {/* Eye L */}
            <rect x="38" y="40" width="4" height="4" fill="white" /> {/* Eye R */}
            <rect x="26" y="46" width="12" height="8" fill="#f472b6" /> {/* Snout */}
            <rect x="29" y="49" width="2" height="2" fill="#be185d" /> {/* Nostril L */}
            <rect x="33" y="49" width="2" height="2" fill="#be185d" /> {/* Nostril R */}
          </g>
        )}
        
        {/* Door */}
        <rect x="28" y="48" width="8" height="12" fill="rgba(0,0,0,0.2)" />
      </svg>
    </div>
  );
};

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

const TOPICS = [
  { title: 'Numbers', desc: '1-10', content: [{ char: '一', pinyin: 'yī', meaning: 'One' }, { char: '二', pinyin: 'èr', meaning: 'Two' }, { char: '三', pinyin: 'sān', meaning: 'Three' }, { char: '四', pinyin: 'sì', meaning: 'Four' }, { char: '五', pinyin: 'wǔ', meaning: 'Five' }, { char: '六', pinyin: 'liù', meaning: 'Six' }, { char: '七', pinyin: 'qī', meaning: 'Seven' }, { char: '八', pinyin: 'bā', meaning: 'Eight' }, { char: '九', pinyin: 'jiǔ', meaning: 'Nine' }, { char: '十', pinyin: 'shí', meaning: 'Ten' }] },
  { title: 'Greetings', desc: 'Basic hellos', content: [{ char: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello' }, { char: '谢谢', pinyin: 'xièxie', meaning: 'Thank you' }, { char: '不客气', pinyin: 'bú kèqi', meaning: "You're welcome" }, { char: '再见', pinyin: 'zàijiàn', meaning: 'Goodbye' }] },
  { title: 'Family', desc: 'Mom and Dad', content: [{ char: '爸爸', pinyin: 'bàba', meaning: 'Dad' }, { char: '妈妈', pinyin: 'māma', meaning: 'Mom' }, { char: '哥哥', pinyin: 'gēge', meaning: 'Older Brother' }, { char: '姐姐', pinyin: 'jiějie', meaning: 'Older Sister' }] },
  { title: 'Food', desc: 'Common dishes', content: [{ char: '米饭', pinyin: 'mǐfàn', meaning: 'Rice' }, { char: '面条', pinyin: 'miàntiáo', meaning: 'Noodles' }, { char: '水', pinyin: 'shuǐ', meaning: 'Water' }, { char: '茶', pinyin: 'chá', meaning: 'Tea' }] },
  { title: 'Animals', desc: 'Pets and more', content: [{ char: '猫', pinyin: 'māo', meaning: 'Cat' }, { char: '狗', pinyin: 'gǒu', meaning: 'Dog' }, { char: '鸟', pinyin: 'niǎo', meaning: 'Bird' }, { char: '鱼', pinyin: 'yú', meaning: 'Fish' }] },
  { title: 'Colors', desc: 'Rainbow colors', content: [{ char: '红', pinyin: 'hóng', meaning: 'Red' }, { char: '蓝', pinyin: 'lán', meaning: 'Blue' }, { char: '绿', pinyin: 'lǜ', meaning: 'Green' }, { char: '黄', pinyin: 'huáng', meaning: 'Yellow' }] },
  { title: 'Nature', desc: 'Sun and Moon', content: [{ char: '日', pinyin: 'rì', meaning: 'Sun' }, { char: '月', pinyin: 'yuè', meaning: 'Moon' }, { char: '山', pinyin: 'shān', meaning: 'Mountain' }, { char: '水', pinyin: 'shuǐ', meaning: 'Water' }] },
];

const VOCABULARY_LIST = [
  { char: '猫', pinyin: 'māo', meaning: 'Cat' },
  { char: '狗', pinyin: 'gǒu', meaning: 'Dog' },
  { char: '鱼', pinyin: 'yú', meaning: 'Fish' },
  { char: '鸟', pinyin: 'niǎo', meaning: 'Bird' },
  { char: '苹果', pinyin: 'píngguǒ', meaning: 'Apple' },
  { char: '香蕉', pinyin: 'xiāngjiāo', meaning: 'Banana' },
  { char: '水', pinyin: 'shuǐ', meaning: 'Water' },
  { char: '火', pinyin: 'huǒ', meaning: 'Fire' },
  { char: '山', pinyin: 'shān', meaning: 'Mountain' },
  { char: '月', pinyin: 'yuè', meaning: 'Moon' },
  { char: '日', pinyin: 'rì', meaning: 'Sun' },
  { char: '书', pinyin: 'shū', meaning: 'Book' },
  { char: '家', pinyin: 'jiā', meaning: 'Home' },
  { char: '人', pinyin: 'rén', meaning: 'Person' },
  { char: '大', pinyin: 'dà', meaning: 'Big' },
  { char: '小', pinyin: 'xiǎo', meaning: 'Small' },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [homeSubView, setHomeSubView] = useState<HomeSubView>('chat');
  const [showLanding, setShowLanding] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<{ question: string; options: string[]; answer: string } | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
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
  const generateLevel = (index: number): Level => {
    const topic = TOPICS[index % TOPICS.length];
    const animalTypes = ['cat', 'dog', 'rabbit', 'panda', 'fox', 'bear', 'frog', 'pig'];
    return {
      id: `level-${index + 1}`,
      title: `${topic.title} ${Math.floor(index / TOPICS.length) + 1}`,
      description: topic.desc,
      status: index === 0 ? 'current' : 'locked',
      animalType: animalTypes[index % animalTypes.length],
      content: topic.content,
      order: index
    };
  };

  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem('catto-levels');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse levels', e);
      }
    }
    const initialLevels = [];
    for (let i = 0; i < 10; i++) {
      initialLevels.push(generateLevel(i));
    }
    return initialLevels;
  });

  const [mapCats, setMapCats] = useState<MapCat[]>(() => {
    const saved = localStorage.getItem('catto-cats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cats', e);
      }
    }
    return [
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
    ];
  });

  const [activeCatIndex, setActiveCatIndex] = useState<number>(() => {
    const saved = localStorage.getItem('catto-active-cat');
    return saved ? parseInt(saved) : 0;
  });
  const [catCoins, setCatCoins] = useState<number>(() => {
    const saved = localStorage.getItem('catto-coins');
    return saved ? parseInt(saved) : 0;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('catto-inventory');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mood, setMood] = useState<number>(100);
  const [currentMapLevel, setCurrentMapLevel] = useState<number>(1);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [streak, setStreak] = useState<number>(0);

  const shopItems: ShopItem[] = [
    { id: 'food-1', name: 'Premium Tuna', price: 50, description: 'Delicious tuna for your cat.', icon: '🐟' },
    { id: 'toy-1', name: 'Laser Pointer', price: 100, description: 'Endless fun for any cat.', icon: '🔦' },
    { id: 'toy-2', name: 'Catnip Mouse', price: 80, description: 'A classic toy cats love.', icon: '🐭' },
    { id: 'bed-1', name: 'Luxury Bed', price: 300, description: 'A soft bed for royal naps.', icon: '🛏️' },
    { id: 'groom-1', name: 'Golden Brush', price: 150, description: 'Keep that fur shiny!', icon: '🖌️' },
    { id: 'treat-1', name: 'Cat Treat', price: 20, description: 'A small snack to boost mood (+10).', icon: '🍪' },
    { id: 'toy-3', name: 'Feather Wand', price: 60, description: 'Interactive play (+20 mood).', icon: '🪶' },
    { id: 'catnip-1', name: 'Pure Catnip', price: 120, description: 'Ultimate happiness (+50 mood).', icon: '🌿' },
  ];

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Sync coins and inventory from DB
        setCatCoins(prev => Math.max(prev, data.user.cat_coins || 0));
        setMood(data.user.mood || 100);
        setCurrentMapLevel(data.user.current_map_level || 1);
        setTimerStartTime(data.user.timer_start_time || null);
        setStreak(data.user.streak_count || 0);
        
        if (data.user.timer_start_time) {
          const elapsed = Math.floor((Date.now() - data.user.timer_start_time) / 1000);
          setTimerSeconds(elapsed);
          setIsTimerRunning(true);
        }

        if (data.streak && data.streak.streak_updated) {
          setMessages(prev => [...prev, { 
            role: 'cat', 
            text: `Meow! Your learning streak is now ${data.streak.new_streak} days! I've awarded you ${data.streak.reward_coins} Cat Coins and +${data.streak.reward_mood}% mood boost! Keep it up! Purr~` 
          }]);
        }

        if (data.user.passive_earned && data.user.passive_earned > 0) {
          setMessages(prev => [...prev, { 
            role: 'cat', 
            text: `Meow! While you were away, I worked hard and earned ${data.user.passive_earned} Cat Coins for you! Purr-fect!` 
          }]);
        }

        if (data.user.inventory) {
          try {
            const dbInv = JSON.parse(data.user.inventory);
            setInventory(prev => dbInv.length > prev.length ? dbInv : prev);
          } catch (e) {
            console.error('Failed to parse DB inventory', e);
          }
        }
      }
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
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setWords(data);
        }
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

  useEffect(() => {
    localStorage.setItem('catto-levels', JSON.stringify(levels));
    localStorage.setItem('catto-cats', JSON.stringify(mapCats));
    localStorage.setItem('catto-active-cat', activeCatIndex.toString());
    localStorage.setItem('catto-coins', catCoins.toString());
    localStorage.setItem('catto-inventory', JSON.stringify(inventory));
    localStorage.setItem('catto-mood', mood.toString());
    localStorage.setItem('catto-current-map-level', currentMapLevel.toString());
    if (timerStartTime) localStorage.setItem('catto-timer-start', timerStartTime.toString());
    else localStorage.removeItem('catto-timer-start');

    // Sync with backend if logged in
    if (user) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cat_coins: catCoins, 
          inventory: inventory,
          mood: mood,
          current_map_level: currentMapLevel,
          timer_start_time: timerStartTime
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.streak && data.streak.streak_updated) {
          setStreak(data.streak.new_streak);
          // Update coins and mood from backend rewards
          setCatCoins(prev => prev + data.streak.reward_coins);
          setMood(prev => Math.min(100, prev + data.streak.reward_mood));
          setMessages(prev => [...prev, { 
            role: 'cat', 
            text: `Meow! Your learning streak is now ${data.streak.new_streak} days! I've awarded you ${data.streak.reward_coins} Cat Coins and +${data.streak.reward_mood}% mood boost! Keep it up! Purr~` 
          }]);
        }
      })
      .catch(e => console.error('Failed to sync with backend', e));
    }
  }, [levels, mapCats, activeCatIndex, catCoins, inventory, mood, currentMapLevel, timerStartTime, user]);

  // Real-time Passive Income Tick & Mood Decay
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setCatCoins(prev => prev + 1);
      // Slow mood decay: 1% every 5 minutes
      setMood(prev => Math.max(0, prev - 0.2)); // 0.2% per minute = 1% per 5 mins
    }, 60000); // 1 tick per minute
    return () => clearInterval(interval);
  }, [user]);

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
      const now = Date.now();
      const elapsed = timerStartTime ? Math.floor((now - timerStartTime) / 1000) : timerSeconds;
      const coinsToAward = Math.floor(elapsed / 10); // 1 coin per 10 seconds of active study
      
      if (coinsToAward > 0) {
        setCatCoins(prev => prev + coinsToAward);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setMessages(prev => [...prev, { 
          role: 'cat', 
          text: `Meow! You studied for ${minutes}m ${seconds}s and earned ${coinsToAward} Cat Coins! Purr-fect!` 
        }]);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);
      setTimerStartTime(null);
    } else {
      const now = Date.now();
      setTimerStartTime(now);
      setIsTimerRunning(true);
      setTimerSeconds(0);
    }
  };

  const buyItem = (item: ShopItem) => {
    if (catCoins >= item.price) {
      setCatCoins(prev => prev - item.price);
      
      let moodBoost = 0;
      let feedback = "";

      // Apply mood boost if it's a mood item
      if (item.id === 'treat-1') {
        moodBoost = 10;
        feedback = "Mmm... Delicious cat treat! I feel 10% happier! Purr~";
      } else if (item.id === 'toy-3') {
        moodBoost = 20;
        feedback = "Wow! A feather wand! Let's play! I feel 20% more energetic! Meow!";
      } else if (item.id === 'catnip-1') {
        moodBoost = 50;
        feedback = "OH MY CAT! PURE CATNIP! I'M FLYING! +50% MOOD! PURRRRRRRRR!";
      } else {
        feedback = `Meow! You bought ${item.name}! I'll keep it safe in your inventory!`;
      }

      if (moodBoost > 0) {
        setMood(prev => Math.min(100, prev + moodBoost));
      }

      setInventory(prev => {
        const existing = prev.find(i => i.itemId === item.id);
        if (existing) {
          return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { id: crypto.randomUUID(), itemId: item.id, quantity: 1 }];
      });
      
      setMessages(prev => [...prev, { role: 'cat', text: feedback }]);
    } else {
      setMessages(prev => [...prev, { role: 'cat', text: `Meow... You don't have enough coins for ${item.name}. Keep studying to earn more!` }]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goToMap = useCallback(() => {
    setCurrentView('map');
    // We'll use a timeout to ensure the DOM is updated before scrolling
    setTimeout(() => {
      if (mapContainerRef.current) {
        const currentLevelElement = mapContainerRef.current.querySelector(`[data-level-order="${currentMapLevel - 1}"]`);
        if (currentLevelElement) {
          currentLevelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to current status
          const statusElement = mapContainerRef.current.querySelector('[data-current="true"]');
          if (statusElement) statusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }, [currentMapLevel]);

  const startLevel = (level: Level) => {
    if (level.status === 'locked') return;
    setSelectedLevel(level);
    setLevelProgress(0);
    setCurrentView('level');
    setCurrentMapLevel(level.order + 1); // Focus on this level in map
    // Auto-start timer when level begins
    const now = Date.now();
    setTimerStartTime(now);
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const generateQuiz = (level: Level) => {
    const randomWord = level.content[Math.floor(Math.random() * level.content.length)];
    const quizType = Math.random() > 0.5 ? 'meaning' : 'pinyin';
    
    let question = "";
    let answer = "";
    let options: string[] = [];
    
    if (quizType === 'meaning') {
      question = `What does "${randomWord.char}" mean?`;
      answer = randomWord.meaning;
      const otherMeanings = level.content
        .filter(w => w.char !== randomWord.char)
        .map(w => w.meaning);
      options = [answer, ...otherMeanings.slice(0, 3)];
    } else {
      question = `What is the pinyin for "${randomWord.char}"?`;
      answer = randomWord.pinyin;
      const otherPinyins = level.content
        .filter(w => w.char !== randomWord.char)
        .map(w => w.pinyin);
      options = [answer, ...otherPinyins.slice(0, 3)];
    }
    
    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);
    
    setQuizData({ question, options, answer });
    setQuizFeedback(null);
    setShowQuiz(true);
  };

  const handleQuizAnswer = (selectedOption: string) => {
    if (!quizData) return;
    
    if (selectedOption === quizData.answer) {
      setQuizFeedback('correct');
      setTimeout(() => {
        completeLevel();
      }, 1500);
    } else {
      setQuizFeedback('incorrect');
      setTimeout(() => {
        setQuizFeedback(null);
      }, 1500);
    }
  };

  const completeLevel = () => {
    if (!selectedLevel) return;
    
    const currentLevelId = selectedLevel.id;
    const currentOrder = selectedLevel.order;
    
    const now = Date.now();
    const elapsed = timerStartTime ? Math.floor((now - timerStartTime) / 1000) : timerSeconds;
    const coinsToAward = Math.floor(elapsed / 10);
    
    if (coinsToAward > 0) {
      setCatCoins(prev => prev + coinsToAward);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setMessages(prev => [...prev, { 
        role: 'cat', 
        text: `Meow! You finished the level in ${minutes}m ${seconds}s and earned ${coinsToAward} Cat Coins! Purr-fect!` 
      }]);
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    setCurrentMapLevel(currentOrder + 2); // Set next level as persistent focus

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

    setShowQuiz(false);
    setQuizData(null);
    goToMap();
    setSelectedLevel(null);
  };

  const nextStep = () => {
    if (selectedLevel && levelProgress < selectedLevel.content.length - 1) {
      setLevelProgress(prev => prev + 1);
    } else if (selectedLevel) {
      // Level content finished, show quiz
      generateQuiz(selectedLevel);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'colorful';
      return 'light';
    });
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

  useEffect(() => {
    if (currentView === 'map') {
      // Scroll to current level when entering map
      setTimeout(() => {
        if (mapContainerRef.current) {
          const currentLevelElement = mapContainerRef.current.querySelector('[data-current="true"]');
          if (currentLevelElement) {
            currentLevelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    }
  }, [currentView]);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const { url } = await res.json();
        window.open(url, 'github_oauth', 'width=600,height=700');
      } else {
        setMessages(prev => [...prev, { role: 'cat', text: "Meow... GitHub login is currently unavailable. Try again later!" }]);
      }
    } catch (e) {
      console.error('Login error', e);
      setMessages(prev => [...prev, { role: 'cat', text: "Meow... Connection error. Check your internet!" }]);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setShowLanding(true);
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      console.log(`Attempting ${isRegistering ? 'registration' : 'login'} for ${email}`);
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log(`Auth response status: ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          console.log('Auth successful', data.user);
          setUser(data.user);
          setCatCoins(data.user.cat_coins || 0);
          setMood(data.user.mood || 100);
          setCurrentMapLevel(data.user.current_map_level || 1);
          setTimerStartTime(data.user.timer_start_time || null);
          setStreak(data.user.streak_count || 0);
          setInventory(data.user.inventory ? JSON.parse(data.user.inventory) : []);
          
          if (data.user.timer_start_time) {
            const elapsed = Math.floor((Date.now() - data.user.timer_start_time) / 1000);
            setTimerSeconds(elapsed);
            setIsTimerRunning(true);
          }

          if (data.user.passive_earned && data.user.passive_earned > 0) {
            setMessages(prev => [...prev, { 
              role: 'cat', 
              text: `Meow! While you were away, I earned ${data.user.passive_earned} Cat Coins for you! Purr-fect!` 
            }]);
          }

          setShowLanding(false);
          setMessages(prev => [...prev, { role: 'cat', text: `Meow! Welcome ${data.user.username}! I'm so happy you're here. Let's start learning!` }]);
        } else {
          console.warn('Auth failed', data.error);
          const isDuplicate = data.error?.includes('already registered');
          setMessages(prev => [...prev, { 
            role: 'cat', 
            text: `Meow... ${data.error || 'Auth failed'}. ${isDuplicate ? 'Try switching to the Sign In tab!' : 'Try again!'}` 
          }]);
          if (isDuplicate) {
            setIsRegistering(false);
          }
        }
      } else {
        const text = await res.text();
        console.error('Auth server error (non-JSON)', text);
        setMessages(prev => [...prev, { role: 'cat', text: "Meow... Server error. Please try again later!" }]);
      }
    } catch (e) {
      console.error('Auth connection error', e);
      setMessages(prev => [...prev, { role: 'cat', text: "Meow... Connection error. Check your internet!" }]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-bg">
        <div className="font-pixel text-retro-accent animate-pulse">LOADING SYSTEM...</div>
      </div>
    );
  }

  if (!user && showLanding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-bg p-4 relative overflow-hidden">
        <div className="crt-overlay" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -1000],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute text-2xl"
              style={{ left: `${Math.random() * 100}%`, bottom: '-50px' }}
            >
              {['🌸', '⭐', '☁️', '🐾'][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-retro-surface pixel-border p-8 relative z-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <PixelCat animated={true} />
            </motion.div>
            <h1 className="font-pixel text-2xl text-retro-accent mb-2">CHINESECATTO</h1>
            <p className="font-sans font-bold text-[10px] text-retro-primary uppercase tracking-widest">Your Infinite Journey Starts Here</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block font-sans font-bold text-[10px] text-retro-primary uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="catto@example.com"
                  className="w-full pixel-input text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-sans font-bold text-[10px] text-retro-primary uppercase">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pixel-input text-sm"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full pixel-button py-3 flex items-center justify-center gap-2 group"
            >
              <Sparkles size={16} className="group-hover:animate-spin" />
              <span className="font-sans font-bold text-xs">{isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="font-sans font-bold text-[10px] text-retro-primary hover:text-retro-accent transition-colors underline"
            >
              {isRegistering ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' : 'NEED AN ACCOUNT? REGISTER'}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-retro-border"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-retro-surface px-2 text-retro-border font-sans font-bold">Or continue with</span></div>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full bg-retro-bg pixel-border py-2 flex items-center justify-center gap-2 hover:bg-retro-surface transition-colors"
            >
              <Github size={14} className="text-retro-primary" />
              <span className="font-pixel text-[8px] text-retro-primary">GITHUB_OAUTH</span>
            </button>
          </div>

          <p className="mt-8 text-center font-sans font-bold text-[8px] text-retro-border uppercase">
            By joining, you agree to our pixel-perfect terms.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 relative">
      <div className="crt-overlay" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* User Profile Bar (Mini) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-retro-surface px-2 py-1 pixel-border">
              <Coins size={10} className="text-yellow-500" />
              <span className="font-sans text-[10px] font-bold text-retro-accent">{catCoins}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-2 bg-retro-surface px-2 py-1 pixel-border">
                <Flame size={10} className="text-orange-500" />
                <span className="font-sans text-[10px] font-bold text-retro-accent">{streak} DAY STREAK</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Study Timer Mini */}
            <div className={`flex items-center gap-2 bg-retro-surface px-2 py-1 pixel-border ${isTimerRunning ? 'border-retro-accent animate-pulse' : ''}`}>
              <Timer size={10} className={isTimerRunning ? 'text-retro-accent' : 'text-retro-primary'} />
              <span className="font-sans text-[10px] font-bold text-retro-accent">{formatTime(timerSeconds)}</span>
              <button onClick={toggleTimer} className="text-retro-primary hover:text-retro-accent">
                {isTimerRunning ? <Square size={10} /> : <Play size={10} />}
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 bg-retro-surface p-1 pixel-border">
                <img src={user.avatar_url} alt={user.username} className="w-6 h-6 pixel-border border-retro-primary" />
                <span className="font-sans font-bold text-[10px] text-retro-accent uppercase">{user.username}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLogin}
                  className="font-sans font-bold text-[10px] text-retro-primary hover:text-retro-accent transition-colors"
                >
                  [ LOGIN ]
                </button>
                <span className="text-retro-border text-[10px]">|</span>
                <button 
                  onClick={handleLogin}
                  className="font-sans font-bold text-[10px] text-retro-primary hover:text-retro-accent transition-colors"
                >
                  [ REGISTER ]
                </button>
              </div>
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
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-retro-surface p-4 pixel-border flex items-center gap-3 shadow-[4px_4px_0_0_var(--color-1)]">
                  <div className="p-2 bg-yellow-100 pixel-border">
                    <Coins className="text-yellow-600" size={16} />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Cat Coins</p>
                    <p className="font-sans font-bold text-[10px] text-retro-accent">{catCoins}</p>
                  </div>
                </div>
                <div className="bg-retro-surface p-4 pixel-border flex items-center gap-3 shadow-[4px_4px_0_0_var(--color-2)]">
                  <div className="p-2 bg-pink-100 pixel-border">
                    <Heart className="text-pink-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Cat Mood</p>
                    <div className="w-full h-2 bg-retro-bg pixel-border mt-1 overflow-hidden">
                      <motion.div 
                        animate={{ width: `${mood}%` }}
                        className={`h-full ${mood > 50 ? 'bg-green-500' : mood > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-retro-surface p-4 pixel-border flex items-center gap-3 shadow-[4px_4px_0_0_var(--color-3)]">
                  <div className="p-2 bg-orange-100 pixel-border">
                    <Flame className="text-orange-600" size={16} />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Streak</p>
                    <p className="font-sans font-bold text-[10px] text-retro-accent">{streak} DAYS</p>
                  </div>
                </div>
                <div className="bg-retro-surface p-4 pixel-border flex items-center gap-3 shadow-[4px_4px_0_0_var(--color-4)]">
                  <div className="p-2 bg-blue-100 pixel-border">
                    <Timer className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Study Time</p>
                    <p className="font-sans font-bold text-[10px] text-retro-accent">{formatTime(timerSeconds)}</p>
                  </div>
                </div>
              </div>

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
                  className={`flex-1 py-2 font-sans font-bold text-[10px] pixel-border transition-colors ${homeSubView === 'chat' ? 'bg-retro-primary text-white' : 'bg-retro-surface text-retro-primary'}`}
                >
                  CHAT
                </button>
                <button 
                  onClick={() => setHomeSubView('collector')}
                  className={`flex-1 py-2 font-sans font-bold text-[10px] pixel-border transition-colors ${homeSubView === 'collector' ? 'bg-retro-primary text-white' : 'bg-retro-surface text-retro-primary'}`}
                >
                  COLLECTOR
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
                    <div className="bg-retro-surface p-4 pixel-border h-[300px] overflow-y-auto space-y-4 scrollbar-hide relative">
                      {/* Mood Indicator */}
                      <div className="sticky top-0 right-0 flex justify-end z-20 pointer-events-none">
                        <div className="bg-retro-surface/80 backdrop-blur-sm pixel-border p-1 flex items-center gap-1 shadow-lg">
                          <span className="font-pixel text-[6px] text-retro-primary uppercase">Mood</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <motion.div
                                key={i}
                                animate={mood > i * 20 ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              >
                                <Heart 
                                  size={8} 
                                  className={mood > i * 20 ? 'text-red-500 fill-red-500' : 'text-retro-border'} 
                                />
                              </motion.div>
                            ))}
                          </div>
                          <span className="font-pixel text-[6px] text-retro-accent ml-1">{mood}%</span>
                        </div>
                      </div>

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
              
              <div ref={mapContainerRef} className="flex-1 bg-[#4ade80]/20 relative overflow-y-auto overflow-x-hidden scrollbar-hide p-8 rounded-3xl">
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
                        const y = i * 266 + 100;
                        return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#166534"
                      strokeWidth="4"
                      strokeDasharray="8 8"
                      className="opacity-20"
                    />
                  </svg>

                  {levels.map((level, i) => {
                    const xOffset = Math.sin(i * 0.8) * 30;
                    const isMilestone = (i + 1) % 5 === 0;
                    const milestoneCat = isMilestone ? mapCats[Math.floor(i / 5) % mapCats.length] : null;
                    const isCurrent = level.status === 'current';
                    
                    const houseColors = [
                      'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 
                      'bg-sky-400', 'bg-violet-400', 'bg-fuchsia-400',
                      'bg-orange-400', 'bg-lime-400', 'bg-cyan-400'
                    ];
                    const houseColor = houseColors[i % houseColors.length];

                    return (
                      <div key={level.id} className="relative w-full flex flex-col items-center">
                        {/* Milestone Background Cat */}
                        {isMilestone && milestoneCat && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 0.5, scale: 1 }}
                            className="absolute -z-10 w-64 h-64 overflow-hidden grayscale-0"
                            style={{ 
                              left: i % 2 === 0 ? '5%' : '60%',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          >
                            <div className="relative w-full h-full p-2 bg-white/10 border-4 border-retro-accent/20 rounded-xl backdrop-blur-sm">
                              <img 
                                src={milestoneCat.imageUrl} 
                                alt="milestone" 
                                className="w-full h-full object-cover pixel-border opacity-70"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/cat/200/200';
                                }}
                              />
                              <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/50 to-transparent">
                                <span className="font-pixel text-[10px] text-white uppercase tracking-widest">{milestoneCat.name}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          style={{ 
                            marginLeft: `${xOffset}%`,
                            marginTop: i === 0 ? 0 : 170
                          }}
                          data-current={isCurrent}
                          data-level-order={i}
                          className="relative z-10"
                        >
                          {/* Flying Cat Following Current Level */}
                          {isCurrent && (
                            <motion.div
                              initial={{ x: -100, opacity: 0 }}
                              animate={{ 
                                x: -70, 
                                opacity: 1,
                                y: [0, -10, 0]
                              }}
                              transition={{
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                x: { duration: 0.5 },
                                opacity: { duration: 0.5 }
                              }}
                              className="absolute top-0 left-0 z-40 pointer-events-none"
                            >
                              <PixelCat animated={true} className="scale-[0.4] origin-right" />
                            </motion.div>
                          )}

                          <div className="relative group/node">
                            <button
                              onClick={() => startLevel(level)}
                              disabled={level.status === 'locked'}
                              className={`w-24 h-24 flex flex-col items-center justify-center transition-all relative p-2 rounded-2xl ${
                                isCurrent ? 'animate-bounce border-4 border-retro-accent bg-white/10 shadow-[0_0_20px_rgba(244,114,182,0.4)]' : ''
                              } hover:scale-110 active:scale-95`}
                            >
                              <PixelAnimalHouse 
                                type={level.animalType || 'cat'} 
                                color={
                                  houseColor === 'bg-rose-400' ? '#fb7185' :
                                  houseColor === 'bg-amber-400' ? '#fbbf24' :
                                  houseColor === 'bg-emerald-400' ? '#34d399' :
                                  houseColor === 'bg-sky-400' ? '#38bdf8' :
                                  houseColor === 'bg-violet-400' ? '#a78bfa' :
                                  houseColor === 'bg-fuchsia-400' ? '#e879f9' :
                                  houseColor === 'bg-orange-400' ? '#fb923c' :
                                  houseColor === 'bg-lime-400' ? '#a3e635' :
                                  '#22d3ee'
                                }
                                status={level.status}
                                className={isCurrent ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}
                              />
                              
                              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                <div className="flex items-center gap-1 bg-black/20 px-1 rounded-full">
                                  <span className="font-pixel text-[10px] text-white drop-shadow-md">{i + 1}</span>
                                  {level.status === 'completed' && <CheckCircle2 size={10} className="text-green-300" />}
                                </div>
                              </div>

                              {isMilestone && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 p-1 pixel-border animate-pulse">
                                  <Sparkles size={10} className="text-white" />
                                </div>
                              )}
                            </button>

                            {/* Level Info Tooltip */}
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                              <div className="bg-retro-surface pixel-border p-3 shadow-xl max-w-[150px]">
                                <p className="font-sans font-bold text-xs text-retro-accent mb-1">{level.title}</p>
                                <p className="font-sans text-[10px] text-retro-primary font-medium uppercase leading-tight">{level.description}</p>
                                {isMilestone && <p className="font-sans font-bold text-[8px] text-yellow-500 mt-1">✨ CAT UNLOCK MILESTONE ✨</p>}
                                {level.status === 'completed' && (
                                  <div className="mt-2 flex items-center gap-1 text-green-500">
                                    <CheckCircle2 size={10} />
                                    <span className="font-sans font-bold text-[8px]">MASTERED</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <span className={`font-sans font-bold text-[10px] uppercase tracking-tighter ${
                                isCurrent ? 'text-retro-accent' : 'text-retro-primary opacity-60'
                              }`}>
                                {level.title}
                              </span>
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
                <button 
                  onClick={() => {
                    // Stop timer and award coins when leaving manually
                    const now = Date.now();
                    const elapsed = timerStartTime ? Math.floor((now - timerStartTime) / 1000) : timerSeconds;
                    const coinsToAward = Math.floor(elapsed / 10);
                    if (coinsToAward > 0) {
                      setCatCoins(prev => prev + coinsToAward);
                      const minutes = Math.floor(elapsed / 60);
                      const seconds = elapsed % 60;
                      setMessages(prev => [...prev, { 
                        role: 'cat', 
                        text: `Meow! You studied for ${minutes}m ${seconds}s. Good job!` 
                      }]);
                    }
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                    setTimerStartTime(null);
                    setShowQuiz(false);
                    setQuizData(null);
                    setCurrentView('map');
                  }} 
                  className="pixel-button p-2"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="font-sans font-bold text-xs text-retro-accent">
                  {selectedLevel.title}
                </div>
              </div>

              {/* Lesson Progress Bar */}
              <div className="space-y-2 bg-retro-surface p-4 pixel-border">
                <div className="flex justify-between items-end">
                  <span className="font-sans font-bold text-[10px] text-retro-primary uppercase">Lesson Progress</span>
                  <span className="font-sans font-bold text-[10px] text-retro-accent">
                    {showQuiz ? selectedLevel.content.length : levelProgress + 1} / {selectedLevel.content.length} Words
                  </span>
                </div>
                <div className="w-full h-3 bg-retro-bg pixel-border overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((showQuiz ? selectedLevel.content.length : levelProgress + 1) / selectedLevel.content.length) * 100}%` }}
                    className="h-full bg-retro-accent"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-sans font-bold text-[8px] text-retro-primary opacity-60 uppercase">
                    {showQuiz ? 0 : selectedLevel.content.length - (levelProgress + 1)} Remaining
                  </span>
                  {showQuiz && (
                    <span className="font-sans font-bold text-[8px] text-yellow-500 animate-pulse uppercase">
                      Final Challenge!
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-retro-surface p-12 pixel-border text-center space-y-8 min-h-[400px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {showQuiz && quizData ? (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="font-sans font-bold text-xs text-retro-accent uppercase tracking-widest">Knowledge Check</div>
                        <h3 className="text-3xl font-bold text-retro-text">{quizData.question}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                        {quizData.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(option)}
                            disabled={quizFeedback !== null}
                            className={`pixel-button p-4 text-sm transition-all ${
                              quizFeedback === 'correct' && option === quizData.answer ? 'bg-green-500 border-green-700 text-white' :
                              quizFeedback === 'incorrect' && option !== quizData.answer ? 'bg-red-500 border-red-700 text-white opacity-50' :
                              'hover:bg-retro-accent hover:text-white'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      {quizFeedback === 'correct' && (
                        <motion.div 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="font-sans font-bold text-green-500 text-xs animate-bounce"
                        >
                          PURR-FECT! +10 BONUS COINS!
                        </motion.div>
                      )}
                      {quizFeedback === 'incorrect' && (
                        <motion.div 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="font-sans font-bold text-red-500 text-xs"
                        >
                          MEOW... TRY AGAIN!
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={levelProgress}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="text-8xl font-bold text-retro-accent mb-4">
                          {selectedLevel.content[levelProgress].char}
                        </div>
                        <div className="font-pixel text-xl text-retro-primary uppercase tracking-widest">
                          {selectedLevel.content[levelProgress].pinyin}
                        </div>
                        <div className="text-2xl text-retro-text opacity-80">
                          {selectedLevel.content[levelProgress].meaning}
                        </div>
                      </div>

                      <div className="flex justify-center gap-4">
                        <button onClick={() => speak(selectedLevel.content[levelProgress].char)} className="pixel-button">
                          <Volume2 size={20} />
                        </button>
                        <button onClick={nextStep} className="pixel-button flex items-center gap-2">
                          <span>{levelProgress === selectedLevel.content.length - 1 ? 'FINISH' : 'NEXT'}</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <h3 className="font-sans font-bold text-sm text-retro-accent mb-6 flex items-center gap-2">
                  <UserIcon size={16} />
                  USER PROFILE
                </h3>
                <div className="flex items-center gap-4 p-4 bg-retro-bg pixel-border">
                  <div className="w-12 h-12 bg-retro-primary pixel-border flex items-center justify-center">
                    <Github size={24} />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-xs text-retro-text uppercase">CATTO_USER_01</p>
                    <p className="font-sans font-bold text-[10px] text-retro-primary uppercase">Status: Online</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto p-2 text-retro-border hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                  </button>
                </div>
              </section>

              <section className="bg-retro-surface p-6 pixel-border">
                <h3 className="font-sans font-bold text-sm text-retro-accent mb-6 flex items-center gap-2">
                  <SettingsIcon size={16} />
                  SYSTEM CONFIG
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-sans font-bold text-xs text-retro-text flex items-center gap-2">
                      {theme === 'dark' ? <Moon size={12} /> : theme === 'light' ? <Sun size={12} /> : <Sparkles size={12} />}
                      THEME: {theme.toUpperCase()}
                    </span>
                    <button 
                      onClick={toggleTheme}
                      className="pixel-button text-[10px] py-1"
                    >
                      CYCLE
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-sans font-bold text-xs text-retro-text">CRT_SCANLINES</span>
                    <div className="w-12 h-6 bg-retro-primary pixel-border relative">
                      <div className="absolute top-0 right-1 w-4 h-2 bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-retro-bg pixel-border">
                    <span className="font-sans font-bold text-xs text-retro-text">AUTO_SYNC</span>
                    <div className="w-12 h-6 bg-retro-primary pixel-border relative">
                      <div className="absolute top-0 right-1 w-4 h-2 bg-white" />
                    </div>
                  </div>
                </div>
              </section>

              <div className="text-center">
                <p className="font-sans font-bold text-[10px] text-retro-border">CHINESECATTO ENGINE V2.1.0</p>
                <p className="font-sans font-bold text-[10px] text-retro-border mt-2">© 2024 PIXELCAT STUDIOS</p>
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
                <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Buy treats and toys for your cat</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shopItems.map((item) => (
                  <div key={item.id} className="bg-retro-surface pixel-border p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-retro-bg pixel-border flex items-center justify-center text-2xl">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-sm text-retro-accent">{item.name}</h3>
                        <p className="font-sans text-[10px] text-retro-primary opacity-80 font-medium">{item.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyItem(item)}
                      disabled={catCoins < item.price}
                      className={`pixel-button px-4 py-2 flex items-center gap-2 ${catCoins < item.price ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      <Coins size={12} className="text-yellow-500" />
                      <span className="font-sans font-bold text-xs">{item.price}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-retro-surface p-6 pixel-border">
                <h3 className="font-sans font-bold text-sm text-retro-accent mb-4 flex items-center gap-2">
                  <ShoppingBag size={16} />
                  YOUR INVENTORY
                </h3>
                {inventory.length === 0 ? (
                  <p className="font-sans text-[10px] text-retro-primary opacity-60 text-center py-4 uppercase font-bold">Inventory is empty</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {inventory.map((inv) => {
                      const item = shopItems.find(si => si.id === inv.itemId);
                      return (
                        <div key={inv.id} className="bg-retro-bg p-2 pixel-border flex items-center gap-2">
                          <span className="text-lg">{item?.icon}</span>
                          <div className="flex-1">
                            <p className="font-sans font-bold text-[10px] text-retro-accent truncate">{item?.name}</p>
                            <p className="font-sans font-bold text-[8px] text-retro-primary">QTY: {inv.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'vocabulary' && (
            <motion.div
              key="vocabulary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pb-20"
            >
              <div className="text-center mb-8">
                <h2 className="font-pixel text-sm text-retro-accent uppercase tracking-widest mb-2">Word Library</h2>
                <p className="font-sans text-[10px] font-bold text-retro-primary opacity-60 uppercase">Master your Chinese vocabulary</p>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {VOCABULARY_LIST.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    className="bg-retro-surface pixel-border p-1.5 flex items-center gap-3 group cursor-pointer hover:bg-retro-bg transition-colors"
                    onClick={() => speak(item.char)}
                  >
                    <span className="text-xl font-bold text-retro-text w-8 text-center">{item.char}</span>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <span className="font-sans font-bold text-sm text-retro-text">{item.pinyin}</span>
                      <span className="font-sans text-[10px] text-retro-primary font-medium opacity-80 uppercase tracking-tight truncate">{item.meaning}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(item.char);
                      }}
                      className="p-1 hover:bg-retro-accent rounded transition-colors"
                    >
                      <Volume2 size={14} className="text-retro-primary" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="bg-retro-surface p-6 pixel-border text-center">
                <Sparkles className="mx-auto mb-3 text-retro-primary" size={24} />
                <h3 className="font-sans font-bold text-sm text-retro-accent mb-1">Daily Challenge</h3>
                <p className="font-sans text-xs text-retro-primary leading-relaxed mb-4">
                  Learn 5 new words today to earn a special Cat Badge!
                </p>
                <button 
                  onClick={goToMap}
                  className="pixel-button w-full"
                >
                  START LEARNING
                </button>
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
                <p className="font-sans font-bold text-[10px] text-retro-primary opacity-60 uppercase">Collected Map Cats</p>
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
                      <div className={`absolute top-1 right-1 px-1 py-0.5 font-sans font-bold text-[8px] text-white ${
                        cat.rarity === 'Legendary' ? 'bg-yellow-500' :
                        cat.rarity === 'Rare' ? 'bg-purple-500' : 'bg-retro-primary'
                      }`}>
                        {cat.rarity}
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-xs text-retro-accent mb-1">{cat.name}</h3>
                    <p className="font-sans text-[10px] text-retro-primary leading-tight font-medium">
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
                          goToMap();
                        }}
                        className="mt-3 w-full pixel-button text-[10px] py-1"
                      >
                        {cat.unlocked ? 'USE THIS CAT' : 'START QUEST'}
                      </button>
                    )}
                    {activeCatIndex === idx && (
                      <div className="mt-3 w-full bg-green-500 text-white font-sans font-bold text-[10px] py-1 text-center pixel-border border-green-700">
                        ACTIVE
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="bg-retro-surface p-4 pixel-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans font-bold text-[10px] text-retro-primary uppercase">Collection Progress</span>
                  <span className="font-sans font-bold text-[10px] text-retro-accent">
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
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'home' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <HomeIcon size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Home</span>
            </button>
            <button 
              onClick={() => setCurrentView('vocabulary')}
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'vocabulary' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <Book size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Vocab</span>
            </button>
            <button 
              onClick={goToMap}
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'map' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <MapIcon size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Map</span>
            </button>
            <button 
              onClick={() => setCurrentView('library')}
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'library' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <Cat size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Library</span>
            </button>
            <button 
              onClick={() => setCurrentView('shop')}
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'shop' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <ShoppingBag size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Shop</span>
            </button>
            <button 
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'settings' ? 'text-retro-accent' : 'text-retro-primary'}`}
            >
              <SettingsIcon size={20} />
              <span className="font-sans text-[10px] font-bold uppercase">Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
