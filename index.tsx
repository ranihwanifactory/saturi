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
  Download
} from "lucide-react";

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
        question: "'아