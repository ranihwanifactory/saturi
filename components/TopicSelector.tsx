import React from 'react';
import { CounselingTopic } from '../types';
import Button from './Button';
import { HeartHandshake, Users, Baby, Component, Scale, MessageCircleHeart } from 'lucide-react';

interface TopicSelectorProps {
  onSelect: (topic: CounselingTopic) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelect }) => {
  const topics = [
    { id: CounselingTopic.GENERAL, icon: <MessageCircleHeart className="w-6 h-6"/>, label: "일반적인 고민", desc: "가족 관계 전반에 대한 이야기" },
    { id: CounselingTopic.SPOUSE, icon: <HeartHandshake className="w-6 h-6"/>, label: "부부 갈등", desc: "배우자와의 소통 및 관계 문제" },
    { id: CounselingTopic.PARENT_CHILD, icon: <Baby className="w-6 h-6"/>, label: "자녀/육아", desc: "양육 스트레스 및 자녀와의 갈등" },
    { id: CounselingTopic.SIBLING, icon: <Users className="w-6 h-6"/>, label: "형제/자매", desc: "형제간의 비교나 다툼" },
    { id: CounselingTopic.IN_LAWS, icon: <Component className="w-6 h-6"/>, label: "고부/장서", desc: "배우자의 가족과의 관계" },
    { id: CounselingTopic.DIVORCE, icon: <Scale className="w-6 h-6"/>, label: "이혼/재혼", desc: "가족 형태의 변화와 적응" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 animate-fade-in">
      <div className="max-w-3xl w-full text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          마음이음 <span className="text-teal-600">가족 상담소</span>
        </h1>
        <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
          어떤 고민으로 찾아오셨나요? <br className="hidden md:inline"/>
          당신의 이야기를 들어줄 준비가 되어 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.id)}
            className="flex flex-col items-center p-6 bg-white border border-slate-200 rounded-xl hover:border-teal-500 hover:shadow-md transition-all duration-200 group text-left"
          >
            <div className="p-3 rounded-full bg-teal-50 text-teal-600 mb-4 group-hover:scale-110 transition-transform">
              {topic.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{topic.label}</h3>
            <p className="text-sm text-slate-500 text-center">{topic.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-12 text-center text-xs text-slate-400 max-w-lg">
        <p className="mb-2">주의사항</p>
        <p>본 서비스는 AI 기반 상담으로, 의학적 진단을 대체할 수 없습니다. 심각한 정신건강 문제나 위급 상황의 경우 반드시 전문가나 응급기관의 도움을 받으시기 바랍니다.</p>
      </div>
    </div>
  );
};

export default TopicSelector;