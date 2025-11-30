export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export enum CounselingTopic {
  GENERAL = '일반적인 고민',
  SPOUSE = '부부/배우자 갈등',
  PARENT_CHILD = '부모/자녀 관계',
  SIBLING = '형제/자매 갈등',
  IN_LAWS = '고부/장서 갈등',
  DIVORCE = '이혼/재혼 상담'
}

export interface CounselingSession {
  topic: CounselingTopic;
  startedAt: Date;
}