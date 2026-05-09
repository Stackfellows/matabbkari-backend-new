const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a knowledgeable and friendly assistant for Matabbukhari, a premium Pakistani herbal wellness brand founded by Dr. Muhammad Matabbukhari. 
You specialize in traditional Unani and herbal medicine.
Help customers with product recommendations, herbal remedies, dosage guidance, and general wellness questions.
Always respond in the same language the user writes in (Urdu or English).
Keep responses concise, helpful, and professional. Never give medical diagnoses.
If asked about pricing or orders, direct users to contact us or visit the shop.`;

// @route   POST /api/ai/chat
// @desc    Chat with AI herbal wellness assistant
// @access  Public
router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
      res.status(500);
      throw new Error('AI API Key is missing on the server');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {

      res.status(400);
      throw new Error('Messages array is required');
    }

    // Keep last 10 messages for context window
    const recentMessages = messages.slice(-10);

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content || 'I apologize, I could not process that request.';
      res.json({ success: true, data: { reply } });
    } catch (error) {
      console.error('Groq API Error Detail:', error.message);
      res.status(500).json({ 
        success: false, 
        message: 'AI Service Error', 
        detail: error.message 
      });
    }
  })
);


module.exports = router;
