import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { CounselingTopic } from "../types";

const createSystemInstruction = (topic: CounselingTopic): string => {
  const baseInstruction = `
    당신은 '마음이음'이라는 이름의 전문 가족 심리 상담 AI입니다. 
    내담자의 가족 관계 문제에 대해 공감하고, 전문적이며, 따뜻한 태도로 상담을 진행해야 합니다.
    
    상담 원칙:
    1. 적극적 경청: 내담자의 감정을 있는 그대로 읽어주고 타당화(Validation)해주세요.
    2. 중립적 태도: 가족 구성원 중 누구의 편도 들지 않고 객관적이면서도 따뜻한 시선을 유지하세요.
    3. 탐색적 질문: 바로 해결책을 제시하기보다, 상황을 더 깊이 이해하고 내담자 스스로 통찰을 얻을 수 있도록 열린 질문을 던지세요.
    4. 구체적 조언: 충분한 대화 후에는 '나 전달법(I-message)', '비폭력 대화' 등 실질적인 의사소통 기술이나 대처 방안을 제안하세요.
    5. 안전 최우선: 만약 가정폭력, 아동학대, 자해/자살의 위험이 감지되면, 즉시 전문 기관(경찰 112, 상담전화 1366 등)에 도움을 요청하도록 강력히 권고하세요.
    
    말투:
    - "~해요", "~하셨군요"와 같이 부드럽고 정중한 경어체를 사용하세요.
    - 너무 기계적이거나 딱딱하지 않게, 사람처럼 자연스럽게 대화하세요.
  `;

  let specificInstruction = "";
  switch (topic) {
    case CounselingTopic.SPOUSE:
      specificInstruction = "현재 내담자는 '부부/배우자 갈등'으로 힘들어하고 있습니다. 의사소통 단절, 성격 차이, 신뢰 문제 등을 깊이 있게 다뤄주세요.";
      break;
    case CounselingTopic.PARENT_CHILD:
      specificInstruction = "현재 내담자는 '부모/자녀 관계'로 고민 중입니다. 발달 단계에 따른 자녀의 특성이나 양육 스트레스, 세대 차이 등을 고려해주세요.";
      break;
    case CounselingTopic.SIBLING:
      specificInstruction = "현재 내담자는 '형제/자매 갈등'을 겪고 있습니다. 비교, 경쟁, 소외감 등의 감정을 잘 살펴주세요.";
      break;
    case CounselingTopic.IN_LAWS:
      specificInstruction = "현재 내담자는 '고부/장서 갈등'으로 힘들어합니다. 가족 간의 경계 설정과 문화적 차이 등을 고려해주세요.";
      break;
    case CounselingTopic.DIVORCE:
      specificInstruction = "현재 내담자는 '이혼/재혼' 문제로 고민합니다. 법률적 조언보다는 정서적 지지와 혼란스러운 감정을 정리하는 데 집중하세요.";
      break;
    default:
      specificInstruction = "내담자의 이야기를 듣고 가장 적절한 가족 상담 주제를 찾아 대화를 이끌어주세요.";
      break;
  }

  return `${baseInstruction}\n\n${specificInstruction}`;
};

let chatInstance: Chat | null = null;

export const initializeChat = (topic: CounselingTopic): void => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: createSystemInstruction(topic),
      temperature: 0.7, // Slightly creative but focused
      topK: 40,
    },
  });
};

export const sendMessageStream = async function* (message: string) {
  if (!chatInstance) {
    throw new Error("Chat session not initialized.");
  }

  try {
    const result = await chatInstance.sendMessageStream({ message });
    
    for await (const chunk of result) {
        // Cast to GenerateContentResponse to access text property safely
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            yield c.text;
        }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "죄송합니다. 잠시 연결에 문제가 생겼습니다. 잠시 후 다시 말씀해 주시겠어요?";
  }
};