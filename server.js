// 1. นำเข้าเครื่องมือที่จำเป็น
const express = require('express');
const cors = require('cors'); // ตัวช่วยให้หน้าเว็บเราเรียกเซิร์ฟเวอร์นี้ได้
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. ดึง API Key จากไฟล์ .env ที่ซ่อนไว้
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("ไม่พบ API_KEY ในไฟล์ .env");
  process.exit(1); // ออกจากโปรแกรมถ้าไม่เจอคีย์
}

// 3. ตั้งค่า AI
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 4. ตั้งค่า Express Server
const app = express();
app.use(cors()); // อนุญาตให้ทุกเว็บ (เช่นหน้าเว็บกฎหมายของคุณ) เรียกมาได้
app.use(express.json()); // ทำให้เซิร์ฟเวอร์อ่าน JSON ที่ส่งมาใน body ได้

// 5. สร้าง "ทางเข้า" หรือ Endpoint ชื่อ /chat
// หน้าเว็บของเราจะยิงมาที่นี่
app.post('/chat', async (req, res) => {
  try {
    // req.body.history คือประวัติแชทที่หน้าเว็บส่งมาให้
    const history = req.body.history || [];

    // เอาข้อความล่าสุดที่ผู้ใช้พิมพ์
    const userMessage = history.pop(); // ดึงข้อความล่าสุด (role: "user") ออกมา

    if (!userMessage || userMessage.role !== 'user') {
      return res.status(400).json({ error: 'ไม่มีข้อความจากผู้ใช้' });
    }

    // เริ่มแชทใหม่โดยใช้ประวัติเก่า
    const chat = model.startChat({
      history: history 
    });

    // ส่งข้อความล่าสุดไปให้ AI
    const result = await chat.sendMessage(userMessage.parts);
    const response = await result.response;
    const text = response.text();

    // 6. ส่งคำตอบของ AI กลับไปให้หน้าเว็บ
    res.json({ reply: text });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสื่อสารกับ AI' });
  }
});

// 7. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('เซิร์ฟเวอร์ Proxy พร้อมทำงานที่พอร์ต ' + listener.address().port);
});