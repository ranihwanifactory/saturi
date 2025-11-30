import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MapPin, 
  Brain, 
  Trophy, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ChevronRight,
  Sparkles,
  Share2,
  Home,
  AlertCircle,
  LogOut,
  Copy,
  BookOpen,
  Bot,
  Download,
  PlusSquare,
  Smartphone,
  Timer
} from "lucide-react";

declare global {
  interface Window {
    kakao: any;
  }
}

// --- Types ---
type Region = '경상도' | '전라도' | '충청도' | '강원도' | '제주도';
type Difficulty = '순한맛' | '중간맛' | '매운맛';
type GameMode = 'AI' | 'BASIC';

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizConfig {
  region: Region;
  difficulty: Difficulty;
}

type AppState = 'MENU' | 'LOADING' | 'QUIZ' | 'RESULT' | 'ERROR';
type FeedbackType = 'CORRECT' | 'WRONG' | null;

// --- Static Data ---
const STATIC_QUESTIONS: Record<Region, Record<Difficulty, Question[]>> = {
  '경상도': {
    '순한맛': [
      {
        question: "'밥 묵었나?'에 대한 적절한 대답은?",
        options: ["아니오, 아직 식사 전입니다.", "어.", "밥은 먹지 않았습니다.", "네, 진지 드셨습니까?"],
        correctAnswerIndex: 1,
        explanation: "경상도에서 '밥 묵었나?'는 단순한 안부 인사로, 친한 사이에서는 짧게 '어' 또는 '아직'으로 대답합니다."
      },
      {
        question: "경상도 사투리 '파이다'의 뜻은?",
        options: ["땅을 파다", "별로다/좋지 않다", "파가 있다", "팔이다"],
        correctAnswerIndex: 1,
        explanation: "'파이다'는 상태나 품질이 좋지 않다, 별로다는 뜻으로 쓰입니다. 예: '그 옷은 좀 파이다.'"
      },
      {
        question: "'머라카노'의 뜻은?",
        options: ["뭐라고 하니?", "머리카락이네", "말을 하세요", "조용히 해라"],
        correctAnswerIndex: 0,
        explanation: "상대방의 말이 잘 들리지 않거나 이해가 안 될 때, 또는 어이없을 때 쓰는 말입니다."
      }
    ],
    '중간맛': [
      {
        question: "'단디 해라'의 뜻은?",
        options: ["단단하게 해라", "제대로/확실하게 해라", "빨리 해라", "천천히 해라"],
        correctAnswerIndex: 1,
        explanation: "'단디'는 '단단히'에서 온 말로, 실수 없이 야무지고 확실하게 하라는 뜻입니다."
      },
      {
        question: "'공가라'의 의미는?",
        options: ["공을 차라", "물건을 밑에 받쳐라", "공평하게 해라", "숨겨라"],
        correctAnswerIndex: 1,
        explanation: "무거운 물건 밑에 돌이나 나무 등을 받쳐서 고정하거나 높이를 맞추라는 뜻입니다."
      },
      {
        question: "다음 중 '친척'을 뜻하는 경상도 말은?",
        options: ["가매", "살피", "일가", "남"],
        correctAnswerIndex: 2,
        explanation: "경상도 어르신들은 친척을 '일가' 또는 '일가친척'이라고 자주 부릅니다."
      }
    ],
    '매운맛': [
      {
        question: "'널짜뿌다'의 뜻은?",
        options: ["널을 뛰다", "떨어뜨리다", "넓게 펴다", "날려버리다"],
        correctAnswerIndex: 1,
        explanation: "실수로 물건을 아래로 떨어뜨렸을 때 '널짜뿌따'라고 합니다."
      },
      {
        question: "'시그럽다'의 뜻은?",
        options: ["시끄럽다", "시다(신맛)", "시원하다", "서글프다"],
        correctAnswerIndex: 1,
        explanation: "레몬처럼 맛이 실 때 '아이구 시그러버라'라고 표현합니다."
      },
      {
        question: "'짜구 났다'는 무슨 뜻일까요?",
        options: ["자국이 났다", "배가 너무 부르다", "친구가 왔다", "짜증이 났다"],
        correctAnswerIndex: 1,
        explanation: "음식을 너무 많이 먹어서 배가 터질 듯이 부를 때 '배에 짜구 났다'고 합니다."
      }
    ]
  },
  '전라도': {
    '순한맛': [
      {
        question: "'아따'의 쓰임새로 적절하지 않은 것은?",
        options: ["감탄사", "추임새", "부정의 의미", "형 이름"],
        correctAnswerIndex: 3,
        explanation: "'아따'는 상황에 따라 기쁨, 짜증, 답답함 등 다양한 감정을 표현하는 만능 감탄사입니다."
      },
      {
        question: "'거시기'의 뜻은?",
        options: ["그것/저것 (대명사)", "거절하다", "거칠다", "거울"],
        correctAnswerIndex: 0,
        explanation: "말하려는 단어가 금방 생각나지 않거나 굳이 말하지 않아도 알 때 쓰는 대명사입니다."
      },
      {
        question: "'시방'의 뜻은?",
        options: ["욕설", "지금", "사방", "가방"],
        correctAnswerIndex: 1,
        explanation: "'시방'은 '지금(now)'을 뜻하는 표준어이기도 하지만 전라도 사투리에서 매우 자주 쓰입니다."
      }
    ],
    '중간맛': [
      {
        question: "'뽀짝 붙어라'에서 '뽀짝'의 뜻은?",
        options: ["바짝/가까이", "천천히", "살살", "멀리"],
        correctAnswerIndex: 0,
        explanation: "거리를 매우 좁혀서 가까이 붙으라는 뜻입니다."
      },
      {
        question: "'귄있다'의 칭찬 의미는?",
        options: ["귀가 크다", "매력 있고 예쁘게 생겼다", "권위가 있다", "귀찮게 한다"],
        correctAnswerIndex: 1,
        explanation: "단순히 예쁜 것보다 볼수록 매력 있고 호감 가는 얼굴을 칭찬할 때 '귄있다'고 합니다."
      },
      {
        question: "'해야'의 의미는?",
        options: ["태양", "해야 한다", "아이(Child)", "해(Year)"],
        correctAnswerIndex: 2,
        explanation: "전라도 사투리에서 '해야'는 '어린 아이'를 부르는 말로 쓰이기도 합니다."
      }
    ],
    '매운맛': [
      {
        question: "'몽니'를 부리다의 뜻은?",
        options: ["잠을 자다", "심술/욕심을 부리다", "돈을 쓰다", "멍을 때리다"],
        correctAnswerIndex: 1,
        explanation: "정당한 대우를 받지 못했다고 느껴 심술을 부리는 성질을 뜻합니다."
      },
      {
        question: "'가실'의 뜻은?",
        options: ["거실", "가을", "가시다", "과실"],
        correctAnswerIndex: 1,
        explanation: "전라도 방언으로 '가을'을 '가실'이라고 합니다. '가실걷이(가을걷이)' 등으로 쓰입니다."
      },
      {
        question: "'솔찬하다'의 뜻은?",
        options: ["소나무가 많다", "제법 많다/상당하다", "솔직하다", "차갑다"],
        correctAnswerIndex: 1,
        explanation: "양이나 정도가 생각보다 많거나 꽤 될 때 '솔찬하다', '솔찬히'라고 합니다."
      }
    ]
  },
  '충청도': {
    '순한맛': [
      {
        question: "'괜찮아유'의 진짜 속마음은?",
        options: ["정말 괜찮다", "상황에 따라 거절일 수도 긍정일 수도 있다", "무조건 싫다", "무조건 좋다"],
        correctAnswerIndex: 1,
        explanation: "충청도의 '괜찮아유'는 문맥과 뉘앙스를 잘 파악해야 합니다. 거절의 의미일 때도 많습니다."
      },
      {
        question: "'그려'의 뜻은?",
        options: ["그림을 그려라", "그래(긍정)", "그립다", "그렇지 않다"],
        correctAnswerIndex: 1,
        explanation: "상대방의 말에 동의하거나 긍정할 때 '그려~'라고 합니다."
      }
    ],
    '중간맛': [
      {
        question: "'개구락지'는 무엇일까요?",
        options: ["강아지", "개구리", "구렁이", "낙지"],
        correctAnswerIndex: 1,
        explanation: "충청도에서는 개구리를 '개구락지'라고 부릅니다."
      },
      {
        question: "돌을 뜻하는 충청도 사투리는?",
        options: ["독", "돌맹", "도꾸", "독짝"],
        correctAnswerIndex: 3,
        explanation: "작은 돌을 '독짝' 또는 '독'이라고 부르기도 합니다."
      }
    ],
    '매운맛': [
      {
        question: "'탑세기'는 무엇일까요?",
        options: ["탑", "먼지", "쓰레기", "모래"],
        correctAnswerIndex: 1,
        explanation: "충청도 방언으로 '먼지'를 '탑세기'라고 합니다."
      },
      {
        question: "'산가이'의 뜻은?",
        options: ["산속에", "살가이(친하게)", "산토끼", "몰래"],
        correctAnswerIndex: 3,
        explanation: "'산가이'는 남들 모르게 슬그머니, 혹은 몰래라는 뜻으로 쓰입니다."
      }
    ]
  },
  '강원도': {
    '순한맛': [
      {
        question: "어미 '-드래요'는 어느 지역 사투리일까요?",
        options: ["강원도", "제주도", "서울", "부산"],
        correctAnswerIndex: 0,
        explanation: "강원도 사투리의 대표적인 특징 중 하나가 말끝을 '-드래요'로 맺는 것입니다."
      },
      {
        question: "'감자바우'는 누구를 지칭하나요?",
        options: ["감자 농사꾼", "강원도 사람", "바보", "요리사"],
        correctAnswerIndex: 1,
        explanation: "강원도 사람을 순박하고 친근하게 부르는 별명입니다."
      }
    ],
    '중간맛': [
      {
        question: "'옥수수'의 강원도 사투리는?",
        options: ["강냉이", "옥시기", "수수", "노랭이"],
        correctAnswerIndex: 1,
        explanation: "강원도에서는 옥수수를 '옥시기' 또는 '강냉이'라고 많이 부릅니다."
      }
    ],
    '매운맛': [
      {
        question: "'꼴뚜국수'는 무엇일까요?",
        options: ["꼴뚜기 국수", "메밀 국수(콧등치기)", "칼국수", "라면"],
        correctAnswerIndex: 1,
        explanation: "메밀로 만든 국수로, 먹을 때 면발이 콧등을 친다고 해서 '콧등치기' 또는 '꼴뚜국수'라고 합니다."
      }
    ]
  },
  '제주도': {
    '순한맛': [
      {
        question: "'혼저옵서예'의 뜻은?",
        options: ["혼자 오세요", "어서 오세요", "앉으세요", "집에 가세요"],
        correctAnswerIndex: 1,
        explanation: "'혼저(어서) 옵서예(오세요)'라는 뜻의 환영 인사입니다."
      },
      {
        question: "'맨도롱 또똣'의 뜻은?",
        options: ["맨발로 뛰어라", "기분 좋게 따뜻하다", "매우 뜨겁다", "차갑다"],
        correctAnswerIndex: 1,
        explanation: "먹기 좋을 만큼 알맞게 따뜻하다는 뜻의 예쁜 제주말입니다."
      }
    ],
    '중간맛': [
      {
        question: "'가시어멍'은 누구일까요?",
        options: ["친정 엄마", "장모님", "시어머니", "이모"],
        correctAnswerIndex: 1,
        explanation: "제주도에서 장모님을 '가시어멍', 장인어른을 '가시아방'이라고 합니다."
      }
    ],
    '매운맛': [
      {
        question: "'폭낭'은 무슨 나무일까요?",
        options: ["소나무", "팽나무", "대나무", "감나무"],
        correctAnswerIndex: 1,
        explanation: "제주도 마을 입구에 자주 보이는 큰 팽나무를 '폭낭'이라고 부릅니다."
      },
      {
        question: "'비바리'는 누구를 뜻할까요?",
        options: ["결혼하지 않은 처녀", "해녀", "바리스타", "비가 오는 날"],
        correctAnswerIndex: 0,
        explanation: "제주도에서 바다에서 일하는 처녀나 미혼 여성을 '비바리'라고 불렀습니다."
      }
    ]
  }
};

// Helper to get random questions from static DB
const getStaticQuestions = (region: Region, difficulty: Difficulty): Question[] => {
  const regionData = STATIC_QUESTIONS[region];
  let pool = regionData?.[difficulty] || [];
  
  if (pool.length === 0) {
    pool = Object.values(regionData).flat();
  }
  
  if (pool.length === 0) {
    return [{
      question: `${region} ${difficulty} 문제는 아직 준비중입니다!`,
      options: ["알겠습니다", "넘어가기", "홈으로", "기다리기"],
      correctAnswerIndex: 0,
      explanation: "데이터 업데이트를 기다려주세요."
    }];
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
};

// --- API Key Helper for Client-Side Deployments ---
const getApiKey = (): string | undefined => {
  try {
    // Priority 1: Modern Vite/Framework Prefixes
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY.trim();
    }
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_KEY) {
      return process.env.NEXT_PUBLIC_API_KEY.trim();
    }
    if (typeof process !== 'undefined' && process.env?.REACT_APP_API_KEY) {
      return process.env.REACT_APP_API_KEY.trim();
    }
    // Priority 2: Direct Keys
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY.trim();
    }
    // Fallbacks
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.API_KEY) {
      // @ts-ignore
      return import.meta.env.API_KEY.trim();
    }
  } catch (e) {
    console.warn("Failed to read environment variables", e);
  }
  return undefined;
};

// --- Components ---

const BackgroundMap = ({ region }: { region: Region }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  
  // Coordinates mapping - Center points of each province
  const REGION_COORDS: Record<Region, { lat: number, lng: number, level: number }> = {
    '경상도': { lat: 35.566, lng: 128.566, level: 11 }, // Around Daegu/Changnyeong
    '전라도': { lat: 35.159, lng: 126.852, level: 11 }, // Around Gwangju
    '충청도': { lat: 36.635, lng: 127.491, level: 11 }, // Around Cheongju/Daejeon
    '강원도': { lat: 37.600, lng: 128.500, level: 11 }, // Pyeongchang area
    '제주도': { lat: 33.361, lng: 126.529, level: 10 }, // Hallasan center
  };

  useEffect(() => {
    // Retry mechanism if kakao is not loaded yet (though script in head should be fast enough)
    const initMap = () => {
        if (window.kakao && window.kakao.maps && mapRef.current) {
            const startRegion = REGION_COORDS[region];
            const options = {
                center: new window.kakao.maps.LatLng(startRegion.lat, startRegion.lng),
                level: startRegion.level
            };
            const map = new window.kakao.maps.Map(mapRef.current, options);
            
            // Disable interactions for background feel
            map.setZoomable(false);
            map.setDraggable(false);
            
            mapInstance.current = map;
        } else {
            setTimeout(initMap, 200);
        }
    };

    initMap();
  }, []); // Run once on mount

  useEffect(() => {
    if (mapInstance.current && window.kakao) {
        const target = REGION_COORDS[region];
        const moveLatLon = new window.kakao.maps.LatLng(target.lat, target.lng);
        
        // Smooth pan
        mapInstance.current.panTo(moveLatLon);
        // Optionally adjust zoom level if they differ significantly
        // mapInstance.current.setLevel(target.level);
    }
  }, [region]);

  return (
    <div className="fixed inset-0 w-full h-full -z-20 pointer-events-none">
        <div ref={mapRef} className="w-full h-full opacity-50 transition-opacity duration-1000 ease-in-out" /> 
        {/* Overlay to make text readable */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] -z-10" />
    </div>
  );
};

const App = () => {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [config, setConfig] = useState<QuizConfig>({ region: '경상도', difficulty: '중간맛' });
  const [gameMode, setGameMode] = useState<GameMode>('AI'); 
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("문제를 준비하고 있습니다...");
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [showToast, setShowToast] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // iOS & PWA States
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const regions: Region[] = ['경상도', '전라도', '충청도', '강원도', '제주도'];
  const difficulties: Difficulty[] = ['순한맛', '중간맛', '매운맛'];

  useEffect(() => {
    // Check for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (!isStandalone) {
      if (ios) {
         // Auto-show iOS instructions after 2 seconds if not installed
         const timer = setTimeout(() => setShowIOSPrompt(true), 2000);
         return () => clearTimeout(timer);
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Automatically show the install modal when the browser is ready
      setShowInstallModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (appState === 'QUIZ' && !isAnswerRevealed) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Time Over logic
        handleAnswer(-1); 
      }
    }
  }, [timeLeft, appState, isAnswerRevealed]);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
          setShowInstallModal(false);
        }
      });
    } else if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      alert("브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.");
    }
  };

  const onInstallClickFromModal = () => {
      handleInstallClick();
      setShowInstallModal(false);
  };

  const shareApp = async () => {
    const url = window.location.href;
    const text = "니 사투리 쫌 치나? 전국 사투리 능력고사 도전해봐라!\nAI가 내는 무한 사투리 퀴즈!";
    try {
      if (navigator.share) {
        await navigator.share({
          title: '전국 사투리 능력고사',
          text: text,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShowToast(true);
      }
    } catch (e) {
      console.log('Sharing failed', e);
    }
  };

  useEffect(() => {
    if (appState === 'LOADING') {
      const messages = gameMode === 'AI' 
        ? [
            `${config.region} 토박이 AI 섭외 중...`,
            "사투리 족보 실시간 분석 중...",
            "할머니께 전화로 물어보는 중...",
            "난이도 조절을 위해 고심 중...",
            "세상에 없던 문제 생성 중..."
          ]
        : [
            "시험지 인쇄 중...",
            "기출 문제집 펴는 중...",
            "컴퓨터용 사인펜 준비 중...",
            "족집게 문제 고르는 중..."
          ];
      
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[i % messages.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [appState, config.region, gameMode]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const generateQuiz = async () => {
    setAppState('LOADING');
    setLastError("");
    
    if (gameMode === 'BASIC') {
      setTimeout(() => {
        try {
          const staticQ = getStaticQuestions(config.region, config.difficulty);
          setQuestions(staticQ);
          setScore(0);
          setCurrentQIndex(0);
          setSelectedAnswer(null);
          setIsAnswerRevealed(false);
          setFeedback(null);
          setTimeLeft(30);
          setAppState('QUIZ');
        } catch (e) {
          console.error(e);
          setLastError("기본 문제를 불러오는데 실패했습니다.");
          setAppState('ERROR');
        }
      }, 1500);
      return;
    }

    setLoadingMessage(`${config.region} 사투리 ${config.difficulty} 문제를 만들고 있어요...`);
    
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = `
        한국의 ${config.region} 사투리에 대한 재미있는 4지선다 퀴즈 5개를 만들어주세요.
        난이도는 '${config.difficulty}'입니다.
        
        '순한맛': 대중 매체에서 접해본 쉬운 사투리.
        '중간맛': 해당 지역 사람이 아니면 헷갈릴 수 있는 표현.
        '매운맛': 해당 지역 토박이만 알 수 있는 매우 어려운 고유어.

        문제 스타일:
        1. 단어의 뜻 맞추기 (예: '정구지'는 무엇일까요?)
        2. 문장 해석하기 (예: '가가 가가?'의 뜻은?)
        3. 상황에 맞는 대답 고르기
        
        설명(explanation)은 친근한 말투(해요체)로 작성해주시고, 정답인 이유와 함께 해당 사투리의 유래나 재미있는 활용 예시를 덧붙여주세요.
        결과는 반드시 JSON 형식을 준수해주세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "The quiz question text" },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "4 multiple choice options" 
                },
                correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
                explanation: { type: Type.STRING, description: "Fun explanation of the answer" }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          }
        }
      });

      if (response.text) {
        const generatedQuestions = JSON.parse(response.text) as Question[];
        if (generatedQuestions.length === 0) throw new Error("No questions generated");
        
        setQuestions(generatedQuestions);
        setScore(0);
        setCurrentQIndex(0);
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);
        setFeedback(null);
        setTimeLeft(30);
        setAppState('QUIZ');
      } else {
        throw new Error("No data returned from AI");
      }

    } catch (error: any) {
      console.error("Error generating quiz:", error);
      let msg = error.message || String(error);
      
      if (msg.includes("400")) msg = "잘못된 요청입니다 (400). API 키 형식을 확인해주세요.\n(Google AI Studio에서 발급받은 키인지 확인)";
      else if (msg.includes("403")) msg = "권한이 없습니다 (403). API 키가 유효하지 않거나 삭제되었을 수 있습니다.";
      else if (msg.includes("429")) msg = "사용량이 초과되었습니다 (429). 잠시 후 다시 시도해주세요.";
      else if (msg.includes("500") || msg.includes("503")) msg = "Google AI 서버 일시적 오류 (5xx). 잠시 후 다시 시도해주세요.";
      else if (msg.includes("API_KEY_MISSING")) msg = "API 키를 찾을 수 없습니다.";
      else if (msg.includes("fetch")) msg = "네트워크 연결을 확인해주세요. (인터넷 접속 불안정)";
      
      setLastError(msg);
      setAppState('ERROR');
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswerRevealed) return;
    
    setSelectedAnswer(index);
    // If index is -1 (timeout), it is treated as wrong.
    const isCorrect = index === questions[currentQIndex].correctAnswerIndex;
    
    setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
    
    setTimeout(() => {
      setFeedback(null);
      setIsAnswerRevealed(true);
      if (isCorrect) {
        setScore(s => s + 1);
      }
    }, 800);
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setTimeLeft(30);
    } else {
      setAppState('RESULT');
    }
  };

  const getRankTitle = (score: number, total: number) => {
    const percentage = score / total;
    if (percentage === 1) return "🏆 사투리 인간문화재";
    if (percentage >= 0.8) return "🥇 현지인 그 자체";
    if (percentage >= 0.6) return "🥈 명예 도민";
    if (percentage >= 0.4) return "🥉 사투리 조무사";
    if (percentage >= 0.2) return "🥜 관광객 모드";
    return "👶 서울 촌놈";
  };

  const shareResult = async () => {
    const title = getRankTitle(score, questions.length);
    const url = window.location.href;
    const text = `[전국 사투리 능력고사]\n\n나의 ${config.region} ${config.difficulty} 등급은?\n👉 ${title} (${score * 20}점)\n\n당신도 도전해보세요!\n${url}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: '전국 사투리 능력고사',
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setShowToast(true);
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  // --- Renders ---

  const renderToast = () => (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg transition-opacity duration-300 flex items-center gap-2 z-50 ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <Copy className="w-4 h-4" />
      <span className="text-sm font-bold">클립보드에 복사되었습니다!</span>
    </div>
  );

  const renderFeedbackOverlay = () => {
    if (!feedback) return null;
    const isTimeout = selectedAnswer === -1;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]">
        <div className={`transform transition-all duration-300 ${feedback === 'CORRECT' ? 'scale-100' : 'scale-100'}`}>
          {feedback === 'CORRECT' ? (
             <div className="bg-white rounded-full p-4 shadow-2xl animate-pop">
               <CheckCircle2 className="w-32 h-32 text-green-500" />
             </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-2xl animate-pop flex flex-col items-center gap-2">
              <XCircle className="w-24 h-24 text-red-500" />
              {isTimeout && <span className="text-red-500 font-bold text-xl font-jua animate-shake">시간 초과!</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInstallModal = () => {
    if (!showInstallModal || !installPrompt) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl text-center relative">
                <button 
                  onClick={() => setShowInstallModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">앱을 설치할까요?</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  앱을 설치하면 전체 화면으로 더 편하게<br/>사투리 능력고사를 즐길 수 있습니다!
                </p>
                <div className="flex gap-3">
                    <button 
                      onClick={() => setShowInstallModal(false)} 
                      className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200"
                    >
                      나중에
                    </button>
                    <button 
                      onClick={onInstallClickFromModal} 
                      className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-600"
                    >
                      설치하기
                    </button>
                </div>
            </div>
        </div>
    )
  }

  const renderIOSPrompt = () => {
    if (!showIOSPrompt) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 bg-black/60 backdrop-blur-sm animate-fade-in-up" onClick={() => setShowIOSPrompt(false)}>
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl text-center relative" onClick={e => e.stopPropagation()}>
           <button onClick={() => setShowIOSPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
             <XCircle className="w-6 h-6" />
           </button>
           <h3 className="text-lg font-bold text-gray-800 mb-2">홈 화면에 추가하기</h3>
           <p className="text-gray-600 text-sm mb-4">
             앱을 설치하면 전체 화면으로 더 편하게 즐길 수 있어요!
           </p>
           <div className="space-y-3 text-left bg-gray-50 p-4 rounded-xl">
             <div className="flex items-center gap-3">
               <Share2 className="w-5 h-5 text-blue-500" />
               <span className="text-sm">1. 브라우저 하단의 <b>공유 버튼</b>을 누르세요.</span>
             </div>
             <div className="flex items-center gap-3">
               <PlusSquare className="w-5 h-5 text-gray-700" />
               <span className="text-sm">2. <b>'홈 화면에 추가'</b>를 찾아 선택하세요.</span>
             </div>
           </div>
           <div className="mt-4 animate-bounce">
             <span className="text-xs text-gray-400">▼ 아래쪽을 확인해보세요!</span>
           </div>
        </div>
      </div>
    );
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto relative z-10">
      {renderToast()}
      {renderIOSPrompt()}
      {renderInstallModal()}
      <div className="text-center mb-6 animate-fade-in-down">
        <div className="inline-block p-4 rounded-full bg-green-100/90 mb-4 shadow-inner ring-4 ring-green-50">
          <MapPin className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-5xl font-jua text-gray-800 mb-2 tracking-wide drop-shadow-sm leading-tight text-shadow-sm">전국 사투리<br/><span className="text-green-600">능력고사</span></h1>
        <p className="text-gray-600 font-medium bg-white/70 backdrop-blur inline-block px-4 py-1 rounded-full shadow-sm">니 사투리 쫌 치나?</p>
      </div>

      <div className="w-full space-y-6 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50">
        
        {/* Game Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-blue-500" /> 출제 방식
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGameMode('BASIC')}
              className={`p-3 rounded-xl text-sm font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                gameMode === 'BASIC'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-500 ring-offset-2'
                  : 'bg-white/90 text-gray-500 hover:bg-blue-50 border border-gray-100'
              }`}
            >
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> 기출 문제</span>
              <span className="text-xs font-normal opacity-80">안정적 • API 불필요</span>
            </button>
            <button
              onClick={() => setGameMode('AI')}
              className={`p-3 rounded-xl text-sm font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                gameMode === 'AI'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 ring-2 ring-purple-500 ring-offset-2'
                  : 'bg-white/90 text-gray-500 hover:bg-purple-50 border border-gray-100'
              }`}
            >
              <span className="flex items-center gap-1"><Bot className="w-4 h-4" /> AI 생성</span>
              <span className="text-xs font-normal opacity-80">무한 문제 • API 필요</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-green-500" /> 도전할 지역
          </label>
          <div className="grid grid-cols-3 gap-2">
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setConfig({ ...config, region: r })}
                className={`p-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  config.region === r 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 transform scale-105 ring-2 ring-green-500 ring-offset-2' 
                    : 'bg-white/90 text-gray-500 hover:bg-green-50 border border-gray-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2 px-1">
            <Brain className="w-4 h-4 text-orange-500" /> 매운맛 정도
          </label>
          <div className="grid grid-cols-3 gap-2">
            {difficulties.map(d => (
              <button
                key={d}
                onClick={() => setConfig({ ...config, difficulty: d })}
                className={`p-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  config.difficulty === d 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 transform scale-105 ring-2 ring-orange-500 ring-offset-2' 
                    : 'bg-white/90 text-gray-500 hover:bg-orange-50 border border-gray-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateQuiz}
          className={`w-full py-4 rounded-2xl font-bold text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 relative overflow-hidden group ${
            gameMode === 'AI' ? 'bg-purple-900 hover:bg-purple-800' : 'bg-gray-900 hover:bg-gray-800'
          } text-white`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${
            gameMode === 'AI' ? 'from-purple-800 to-purple-900' : 'from-gray-800 to-gray-900'
          }`}></div>
          <span className="relative flex items-center gap-2">
            {gameMode === 'AI' ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            시험 시작하기
          </span>
        </button>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstallClick}
            className={`flex-1 py-3 rounded-xl font-bold text-sm hover:bg-green-200 transition-colors flex items-center justify-center gap-2 border border-green-200/50 ${installPrompt || isIOS ? 'bg-green-100/90 text-green-700' : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'}`}
          >
            <Download className="w-4 h-4" />
            앱 설치
          </button>
          <button
            onClick={shareApp}
            className={`flex-1 py-3 rounded-xl font-bold text-sm bg-blue-50/90 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200/50`}
          >
            <Share2 className="w-4 h-4" />
            앱 공유
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-green-600 animate-spin relative z-10" />
      </div>
      <div className="bg-white/80 backdrop-blur px-6 py-4 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-jua text-gray-800 animate-fade-in-up text-center mb-2 min-h-[3rem]">{loadingMessage}</h2>
        <p className="text-gray-500 text-sm text-center">잠시만 기다려주세요...</p>
      </div>
    </div>
  );

  const renderError = () => {
    const isApiKeyError = gameMode === 'AI' && !getApiKey();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">문제가 생겼어요!</h2>
          <div className="text-gray-600 mb-6 text-sm text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
             {isApiKeyError ? (
               <div className="space-y-2">
                 <p className="font-bold text-red-500">API 키가 확인되지 않습니다.</p>
                 <p className="text-xs">배포된 앱(Vercel 등)은 보안상의 이유로 <code>API_KEY</code> 변수를 차단합니다.</p>
                 <hr className="border-gray-300"/>
                 <p className="font-bold text-blue-600">해결 방법:</p>
                 <ol className="list-decimal list-inside text-xs space-y-1">
                   <li>Vercel 대시보드(Settings)로 이동</li>
                   <li>변수명을 <b><code>VITE_API_KEY</code></b>로 변경하여 추가</li>
                   <li><b>Redeploy(재배포)</b> 버튼 클릭 (필수)</li>
                 </ol>
               </div>
             ) : (
               <div className="space-y-2 text-left">
                 <p className="font-bold text-red-600">⚠ 오류 상세 내용</p>
                 <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all text-gray-700 whitespace-pre-wrap">
                   {lastError || "알 수 없는 오류가 발생했습니다."}
                 </div>
                 <p className="text-xs text-gray-500 mt-2">
                   * 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.
                 </p>
               </div>
             )}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setGameMode('BASIC');
                setAppState('MENU');
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> 기출 문제로 하기 (API 불필요)
            </button>
            <button
              onClick={() => setAppState('MENU')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              설정 화면으로
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const question = questions[currentQIndex];
    return (
      <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto py-6 relative z-10">
        {renderFeedbackOverlay()}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 bg-white/70 backdrop-blur p-2 rounded-full border border-white/50 shadow-sm">
          <button 
            onClick={() => {
              if(confirm('시험을 중단하고 홈으로 돌아가시겠습니까?')) setAppState('MENU');
            }}
            className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            aria-label="그만두기"
          >
            <LogOut className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
             {gameMode === 'AI' && (
              <span className="px-2 py-1 bg-purple-100/90 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
            <span className="px-3 py-1 bg-green-100/90 text-green-700 rounded-full text-xs font-bold">
              {config.region}
            </span>
            <span className="px-3 py-1 bg-orange-100/90 text-orange-700 rounded-full text-xs font-bold">
              {config.difficulty}
            </span>
          </div>
          
          <div className="px-3 font-mono font-black text-lg flex items-center">
            <span className="text-green-700">{currentQIndex + 1}</span>
            <span className="text-gray-400 text-sm mx-1">/</span>
            <span className="text-gray-500 text-sm">{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200/50 h-2 rounded-full mb-4 overflow-hidden backdrop-blur-sm">
          <div 
            className="bg-green-500 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-3 mb-6 bg-white/60 backdrop-blur p-2 rounded-xl">
          <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
          <div className="flex-1 h-2 bg-gray-200/50 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : timeLeft <= 10 ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
          <span className={`font-mono font-bold text-sm w-8 text-right ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-xl mb-6 min-h-[180px] flex items-center justify-center border border-white/50 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-teal-500 to-blue-500"></div>
          <h2 className="text-2xl font-bold text-center text-gray-800 leading-relaxed font-jua break-keep">
            {question.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {question.options.map((option, idx) => {
            let btnClass = "w-full p-4 rounded-xl text-left border-2 font-medium transition-all duration-200 relative overflow-hidden group ";
            let icon = <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-green-400 transition-colors"></div>;
            
            if (!isAnswerRevealed) {
              btnClass += "bg-white/90 border-white/50 hover:border-green-300 hover:bg-green-50/90 text-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95";
            } else {
              if (idx === question.correctAnswerIndex) {
                btnClass += "bg-green-100/90 border-green-500 text-green-800 shadow-none ring-2 ring-green-500 ring-offset-2";
                icon = <CheckCircle2 className="w-6 h-6 text-green-600" />;
              } else if (idx === selectedAnswer) {
                btnClass += "bg-red-100/90 border-red-500 text-red-800 shadow-none opacity-80";
                icon = <XCircle className="w-6 h-6 text-red-600" />;
              } else {
                btnClass += "bg-gray-50/50 border-transparent text-gray-400 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerRevealed}
                onClick={() => handleAnswer(idx)}
                className={btnClass}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-lg">{option}</span>
                  {icon}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswerRevealed && (
          <div className="mt-6 animate-fade-in-up">
            <div className="bg-blue-50/90 backdrop-blur p-5 rounded-2xl border border-blue-100 mb-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">정답 해설</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {question.explanation}
              </p>
            </div>
            <button
              onClick={nextQuestion}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-gray-800 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {currentQIndex < questions.length - 1 ? "다음 문제 도전" : "성적표 확인하기"} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    const title = getRankTitle(score, questions.length);
    const percentage = (score / questions.length) * 100;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto relative z-10 animate-fade-in-down">
        {renderToast()}
        <div className="bg-white/95 backdrop-blur w-full rounded-3xl shadow-2xl overflow-hidden text-center relative">
          {/* Top Banner */}
          <div className={`p-10 ${percentage >= 80 ? 'bg-gradient-to-b from-yellow-300 to-yellow-100' : 'bg-gradient-to-b from-green-300 to-green-100'}`}>
            <div className="absolute top-4 right-4 opacity-20 animate-pulse">
              <Trophy className="w-24 h-24" />
            </div>
            <Trophy className="w-20 h-20 text-white mx-auto drop-shadow-md mb-4 transform hover:scale-110 transition-transform" />
            <h2 className="text-4xl font-jua text-gray-900 mb-2 drop-shadow-sm">{title}</h2>
            <div className="inline-block px-4 py-1 bg-white/50 backdrop-blur rounded-full text-sm font-bold text-gray-700 mt-2">
              {config.region} • {config.difficulty}
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex justify-center items-end gap-2 mb-6">
              <span className="text-7xl font-black text-gray-900 font-mono tracking-tighter">
                {score * 20}
              </span>
              <span className="text-2xl text-gray-400 font-bold mb-4">점</span>
            </div>

            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8 shadow-inner relative">
               <div className="absolute top-0 left-0 w-full h-full bg-gray-200/50"></div>
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${percentage >= 80 ? 'bg-yellow-400' : 'bg-green-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <p className="text-gray-600 mb-8 leading-relaxed font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
              {percentage >= 80 
                ? "와! 진짜 사투리 고수시네요!\n혹시 고향이... 그쪽 아니십니꺼?" 
                : percentage >= 40 
                  ? "오 조금 아시네요!\n조금만 더 배우면 현지인 흉내 가능!"
                  : "아이고, 아직은 좀 어렵지예?\n더 공부하고 오이소!"}
            </p>

            <div className="flex gap-3">
              <button
                onClick={shareResult}
                className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 className="w-5 h-5" />
                결과 공유
              </button>
              <button
                onClick={() => setAppState('MENU')}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                다시하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <BackgroundMap region={config.region} />
      {appState === 'MENU' && renderMenu()}
      {appState === 'LOADING' && renderLoading()}
      {appState === 'QUIZ' && renderQuiz()}
      {appState === 'RESULT' && renderResult()}
      {appState === 'ERROR' && renderError()}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);