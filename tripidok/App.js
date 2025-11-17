import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

// ==== ICONS ====
const UserIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-6 w-6',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 2
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    })
  );

const SparklesIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-6 w-6',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 2
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293-1.293a1 1 0 010-1.414L14 7m5 5l2.293 2.293a1 1 0 010 1.414L19 19l-1.293-1.293a1 1 0 010-1.414L20 14m-4-13h.01M17 21h.01'
    })
  );

const PaperAirplaneIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-6 w-6',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 2
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
    })
  );

const LinkIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-4 w-4 inline-block mr-2',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: 2
    },
    React.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    })
  );

const ExclamationTriangleIcon = () =>
  React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'h-5 w-5 text-red-500 mr-3',
      viewBox: '0 0 20 20',
      fill: 'currentColor'
    },
    React.createElement('path', {
      fillRule: 'evenodd',
      d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      clipRule: 'evenodd'
    })
  );

// ==== APP ====
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const ai = new GoogleGenAI({
    apiKey: window.GOOGLE_API_KEY
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const systemInstruction = `คุณคือ "ผู้ช่วยพระไตรปิฏก AI" ซึ่งเชี่ยวชาญพระไตรปิฏก อรรถกถา ฎีกา
- ตอบเป็นภาษาไทยเสมอ
- อ้างอิงเล่ม หน้า สูตร (ถ้ามี)
- งดให้คำทำนาย/ความเชื่อผิดจากพระไตรปิฏก
`;

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: String(Date.now()),
      role: 'user',
      text: input.trim()
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
        config: { tools: [{ googleSearch: {} }] }
      });

      const modelResponse = response.text;
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources =
        (groundingMetadata?.groundingChunks || []).filter(
          c => c.web && c.web.uri
        ) || [];

      const modelMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: modelResponse,
        sources
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';
      setError('API Error: ' + msg);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'model',
          text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล: ' + msg
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return React.createElement(
    'div',
    { className: 'flex flex-col h-screen bg-gray-100' },

    // HEADER
    React.createElement(
      'header',
      { className: 'bg-white shadow-md p-4 z-10' },
      React.createElement(
        'div',
        { className: 'max-w-4xl mx-auto flex items-center' },
        React.createElement(
          'div',
          { className: 'bg-blue-600 p-2 rounded-full mr-3' },
          React.createElement(SparklesIcon)
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            { className: 'text-xl font-bold text-gray-800' },
            'Thai Law AI'
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-gray-500' },
            'ผู้ช่วยกฎหมายอัจฉริยะ พร้อมข้อมูลอัพเดท'
          )
        )
      )
    ),

    // MAIN
    React.createElement(
      'main',
      { className: 'flex-1 overflow-y-auto p-4' },
      React.createElement(
        'div',
        { className: 'max-w-4xl mx-auto space-y-6' },

        messages.length === 0 &&
          !isLoading &&
          React.createElement(
            'div',
            { className: 'text-center py-16 px-4' },
            React.createElement(
              'div',
              {
                className:
                  'inline-block bg-white p-4 rounded-full shadow-sm mb-4'
              },
              React.createElement(SparklesIcon)
            ),
            React.createElement(
              'h2',
              { className: 'text-2xl font-semibold text-gray-700 mb-2' },
              'สวัสดีครับ, ให้ผมช่วยอะไรครับ?'
            ),
            React.createElement(
              'p',
              { className: 'text-gray-500' },
              'คุณสามารถสอบถามเกี่ยวกับข้อกฎหมาย, ระเบียบ, หรือกระบวนการทางกฎหมายในประเทศไทยได้เลย'
            ),
            React.createElement(
              'p',
              { className: 'text-xs text-gray-400 mt-4' },
              'ตัวอย่าง: "การลาออกต้องแจ้งล่วงหน้ากี่วัน?" หรือ "PDPA คืออะไร?"'
            )
          ),

        ...messages.map(msg =>
          React.createElement(
            'div',
            {
              key: msg.id,
              className: `flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`
            },

            msg.role === 'model' &&
              React.createElement(
                'div',
                { className: 'bg-gray-200 p-2 rounded-full self-start' },
                React.createElement(SparklesIcon)
              ),

            React.createElement(
              'div',
              {
                className: `relative max-w-xl ${
                  msg.role === 'user' ? 'order-2' : 'order-1'
                }`
              },
              React.createElement(
                'div',
                {
                  className: `px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white chat-bubble chat-bubble-user'
                      : 'bg-white text-gray-800 chat-bubble chat-bubble-model'
                  }`
                },
                React.createElement('p', { className: 'whitespace-pre-wrap' }, msg.text)
              ),
              msg.role === 'model' &&
                msg.sources &&
                msg.sources.length > 0 &&
                React.createElement(
                  'div',
                  { className: 'mt-3' },
                  React.createElement(
                    'h3',
                    {
                      className:
                        'text-xs font-semibold text-gray-500 mb-2 uppercase'
                    },
                    'แหล่งข้อมูลอ้างอิง'
                  ),
                  React.createElement(
                    'div',
                    { className: 'space-y-2' },
                    ...msg.sources.map(
                      (s, i) =>
                        s.web &&
                        React.createElement(
                          'a',
                          {
                            key: i,
                            href: s.web.uri,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className:
                              'flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors duration-200'
                          },
                          React.createElement(LinkIcon),
                          React.createElement(
                            'span',
                            { className: 'truncate' },
                            s.web.title || s.web.uri
                          )
                        )
                    )
                  )
                )
            ),

            msg.role === 'user' &&
              React.createElement(
                'div',
                {
                  className: 'bg-gray-200 p-2 rounded-full self-start order-1'
                },
                React.createElement(UserIcon)
              )
          )
        ),

        React.createElement('div', { ref: chatEndRef })
      )
    ),

    // LOADING BAR
    isLoading &&
      React.createElement(
        'div',
        { className: 'flex items-start gap-3 justify-start' },
        React.createElement(
          'div',
          { className: 'bg-gray-200 p-2 rounded-full self-start' },
          React.createElement(SparklesIcon)
        ),
        React.createElement(
          'div',
          { className: 'max-w-xl w-full' },
          React.createElement(
            'div',
            { className: 'px-4 py-3 rounded-2xl shadow-sm bg-white' },
            React.createElement(
              'p',
              { className: 'text-gray-500 text-sm mb-2' },
              'กำลังประมวลผล...'
            ),
            React.createElement('div', { className: 'gemini-thinking-bar' })
          )
        )
      ),

    // FOOTER
    React.createElement(
      'footer',
      { className: 'bg-white p-4 border-t border-gray-200' },
      React.createElement(
        'div',
        { className: 'max-w-4xl mx-auto' },
        error &&
          React.createElement(
            'div',
            {
              className:
                'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 flex items-center',
              role: 'alert'
            },
            React.createElement(ExclamationTriangleIcon),
            React.createElement('span', { className: 'block sm:inline' }, error)
          ),
        React.createElement(
          'form',
          { onSubmit: handleSendMessage, className: 'flex items-center gap-3' },
          React.createElement('input', {
            type: 'text',
            value: input,
            onChange: e => setInput(e.target.value),
            placeholder: 'พิมพ์คำถามของคุณที่นี่...',
            'aria-label': 'Chat input',
            disabled: isLoading,
            className:
              'flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          }),
          React.createElement(
            'button',
            {
              type: 'submit',
              disabled: isLoading || !input.trim(),
              'aria-label': 'Send message',
              className:
                'bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200'
            },
            React.createElement(PaperAirplaneIcon)
          )
        )
      )
    )
  );
}
