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
  Copy
} from "lucide-react";

// --- Types ---
type Region = '경상도' | '전라도' | '충청도' | '강원도' | '제주도';
type Difficulty = '순한맛' | '중간맛' | '매운맛';

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

// --- Components ---

const App = () => {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [config, setConfig] = useState<QuizConfig>({ region: '경상도', difficulty: '중간맛' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("AI가 문제를 출제하고 있습니다...");
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [showToast, setShowToast] = useState(false);

  const regions: Region[] = ['경상도', '전라도', '충청도', '강원도', '제주도'];
  const difficulties: Difficulty[] = ['순한맛', '중간맛', '매운맛'];

  // 로딩 메시지 로테이션
  useEffect(() => {
    if (appState === 'LOADING') {
      const messages = [
        `${config.region} 토박이 섭외 중...`,
        "사투리 족보 뒤지는 중...",
        "할머니께 전화로 물어보는 중...",
        "난이도 조절을 위해 고심 중...",
        "재미있는 문제 엄선 중..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[i % messages.length]);
        i++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [appState, config.region]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // --- Gemini API Logic ---
  const generateQuiz = async () => {
    setAppState('LOADING');
    setLoadingMessage(`${config.region} 사투리 ${config.difficulty} 문제를 만들고 있어요...`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
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
        setAppState('QUIZ');
      } else {
        throw new Error("No data returned");
      }

    } catch (error) {
      console.error("Error generating quiz:", error);
      setAppState('ERROR');
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswerRevealed) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQIndex].correctAnswerIndex;
    
    // 즉각적인 시각적 피드백
    setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
    
    // 잠시 후 해설 보여주기
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
    const text = `[전국 사투리 능력고사]\n\n나의 ${config.region} ${config.difficulty} 등급은?\n👉 ${title} (${score * 20}점)\n\n당신도 도전해보세요!`;
    
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
      // Fallback if share fails / is cancelled
    }
  };

  // --- Renders ---

  const renderToast = () => (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg transition-opacity duration-300 flex items-center gap-2 z-50 ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <Copy className="w-4 h-4" />
      <span className="text-sm font-bold">결과가 클립보드에 복사되었습니다!</span>
    </div>
  );

  const renderFeedbackOverlay = () => {
    if (!feedback) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]">
        <div className={`transform transition-all duration-300 ${feedback === 'CORRECT' ? 'scale-100' : 'scale-100'}`}>
          {feedback === 'CORRECT' ? (
             <div className="bg-white rounded-full p-4 shadow-2xl animate-pop">
               <CheckCircle2 className="w-32 h-32 text-green-500" />
             </div>
          ) : (
            <div className="bg-white rounded-full p-4 shadow-2xl animate-pop">
              <XCircle className="w-32 h-32 text-red-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto relative z-10">
      <div className="text-center mb-8 animate-fade-in-down">
        <div className="inline-block p-4 rounded-full bg-green-100 mb-4 shadow-inner ring-4 ring-green-50">
          <MapPin className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-5xl font-jua text-gray-800 mb-2 tracking-wide drop-shadow-sm leading-tight">전국 사투리<br/><span className="text-green-600">능력고사</span></h1>
        <p className="text-gray-500 font-medium bg-white/50 inline-block px-4 py-1 rounded-full">니 사투리 쫌 치나?</p>
      </div>

      <div className="w-full space-y-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50">
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
                    : 'bg-white text-gray-500 hover:bg-green-50 border border-gray-100'
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
                    : 'bg-white text-gray-500 hover:bg-orange-50 border border-gray-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateQuiz}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900"></div>
          <span className="relative flex items-center gap-2"><Sparkles className="w-5 h-5" /> 시험 시작하기</span>
        </button>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-green-600 animate-spin relative z-10" />
      </div>
      <h2 className="text-2xl font-jua text-gray-800 animate-fade-in-up text-center mb-2 min-h-[3rem]">{loadingMessage}</h2>
      <p className="text-gray-500 text-sm">AI가 문제를 생성하고 있습니다...</p>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-xs w-full">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">문제가 생겼어요!</h2>
        <p className="text-gray-600 mb-6 text-sm">
           API 키 설정을 확인하거나<br/>잠시 후 다시 시도해주세요.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setAppState('MENU')}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            홈으로
          </button>
          <button
            onClick={generateQuiz}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg"
          >
            재시도
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const question = questions[currentQIndex];
    return (
      <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto py-6 relative z-10">
        {renderFeedbackOverlay()}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur p-2 rounded-full border border-white/50 shadow-sm">
          <button 
            onClick={() => {
              if(confirm('시험을 중단하고 홈으로 돌아가시겠습니까?')) setAppState('MENU');
            }}
            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            aria-label="그만두기"
          >
            <LogOut className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              {config.region}
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
              {config.difficulty}
            </span>
          </div>
          
          <div className="px-3 font-mono font-black text-lg flex items-center">
            <span className="text-green-600">{currentQIndex + 1}</span>
            <span className="text-gray-300 text-sm mx-1">/</span>
            <span className="text-gray-400 text-sm">{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-green-500 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-xl mb-6 min-h-[180px] flex items-center justify-center border border-white/50 relative overflow-hidden animate-fade-in-up">
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
              btnClass += "bg-white border-white hover:border-green-300 hover:bg-green-50 text-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95";
            } else {
              if (idx === question.correctAnswerIndex) {
                btnClass += "bg-green-100 border-green-500 text-green-800 shadow-none ring-2 ring-green-500 ring-offset-2";
                icon = <CheckCircle2 className="w-6 h-6 text-green-600" />;
              } else if (idx === selectedAnswer) {
                btnClass += "bg-red-100 border-red-500 text-red-800 shadow-none opacity-80";
                icon = <XCircle className="w-6 h-6 text-red-600" />;
              } else {
                btnClass += "bg-gray-50 border-transparent text-gray-400 opacity-50";
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
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-4 shadow-sm relative overflow-hidden">
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
        <div className="bg-white w-full rounded-3xl shadow-2xl overflow-hidden text-center relative">
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
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

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