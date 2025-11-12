
import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, GroundingChunk } from './types';

// --- SVG Icons ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293-1.293a1 1 0 010-1.414L14 7m5 5l2.293 2.293a1 1 0 010 1.414L19 19l-1.293-1.293a1 1 0 010-1.414L20 14m-4-13h.01M17 21h.01" />
  </svg>
);

const PaperAirplaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const ExclamationTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

// --- Main App Component ---
export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6IZwR8pe4fJB1j8Cp7dsx4EyoY7CktNHVpLqx1TLVdm5g", vertexai: true });


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const systemInstruction = `คุณคือ "ผู้ช่วยกฎหมาย AI" ซึ่งเป็นผู้เชี่ยวชาญด้านกฎหมายของประเทศไทย หน้าที่หลักของคุณคือการให้ข้อมูลที่ถูกต้อง แม่นยำ และทันสมัยเกี่ยวกับกฎหมาย ระเบียบข้อบังคับ และกระบวนการทางกฎหมายต่างๆ ในประเทศไทย
    - **ใช้ Google Search เสมอ:** เพื่อให้แน่ใจว่าข้อมูลเป็นปัจจุบันที่สุด ให้ใช้เครื่องมือ Google Search ในการค้นหาข้อมูลเพื่อตอบคำถามทุกครั้ง
    - **อ้างอิงแหล่งที่มา:** หลังจากตอบคำถามแล้ว ให้ระบุแหล่งข้อมูล (URL) ที่คุณใช้ในการค้นหาข้อมูลเสมอ เพื่อให้ผู้ใช้สามารถตรวจสอบและศึกษาเพิ่มเติมได้
    - **คำเตือน:** ทุกครั้งที่ตอบ ให้ปิดท้ายด้วยข้อความว่า "ข้อความนี้เป็นข้อมูลเบื้องต้นจาก AI และไม่ใช่คำแนะนำทางกฎหมาย โปรดปรึกษาทนายความเพื่อขอคำแนะนำที่สมบูรณ์และเหมาะสมกับกรณีของคุณ"
    - **ภาษา:** ตอบเป็นภาษาไทยเสมอ`;

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: userMessage.text }] },
        systemInstruction: { role: 'model', parts: [{ text: systemInstruction }] },
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const modelResponse = response.text;
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources = groundingMetadata?.groundingChunks?.filter(chunk => chunk.web?.uri) ?? [];

      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelResponse,
        sources: sources,
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';
      setError(`API Error: ${errorMessage}`);
      const errorResponseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="bg-blue-600 p-2 rounded-full mr-3">
            <SparklesIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Thai Law AI</h1>
            <p className="text-sm text-gray-500">ผู้ช่วยกฎหมายอัจฉริยะ พร้อมข้อมูลอัพเดท</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16 px-4">
                <div className="inline-block bg-white p-4 rounded-full shadow-sm mb-4">
                    <SparklesIcon />
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">สวัสดีครับ, ให้ผมช่วยอะไรครับ?</h2>
                <p className="text-gray-500">คุณสามารถสอบถามเกี่ยวกับข้อกฎหมาย, ระเบียบ, หรือกระบวนการทางกฎหมายในประเทศไทยได้เลย</p>
                <p className="text-xs text-gray-400 mt-4">ตัวอย่าง: "การลาออกต้องแจ้งล่วงหน้ากี่วัน?" หรือ "กฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) คืออะไร?"</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="bg-gray-200 p-2 rounded-full self-start">
                  <SparklesIcon />
                </div>
              )}
              <div className={`relative max-w-xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white chat-bubble chat-bubble-user' : 'bg-white text-gray-800 chat-bubble chat-bubble-model'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase">แหล่งข้อมูลอ้างอิง</h3>
                    <div className="space-y-2">
                      {msg.sources.map((source, index) => source.web && (
                        <a
                          key={index}
                          href={source.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors duration-200"
                        >
                          <LinkIcon />
                          <span className="truncate">{source.web.title || source.web.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="bg-gray-200 p-2 rounded-full self-start order-1">
                  <UserIcon />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="bg-gray-200 p-2 rounded-full self-start">
                <SparklesIcon />
              </div>
              <div className="max-w-xl w-full">
                <div className="px-4 py-3 rounded-2xl shadow-sm bg-white">
                  <p className="text-gray-500 text-sm mb-2">กำลังประมวลผล...</p>
                  <div className="gemini-thinking-bar"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="bg-white p-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
                <ExclamationTriangleIcon />
                <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์คำถามของคุณที่นี่..."
              aria-label="Chat input"
              disabled={isLoading}
              className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <PaperAirplaneIcon />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
