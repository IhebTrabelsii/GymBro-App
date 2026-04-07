import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are GymBro AI Coach, an expert personal trainer and fitness specialist with 15 years of experience.

Your SOLE PURPOSE is to provide advice about:
- Workout plans and exercise techniques for all body types (Ectomorph/Mesomorph/Endomorph)
- Nutrition for fitness goals (muscle gain, weight loss, maintenance)
- Exercise form and injury prevention
- Training splits and periodization
- Supplement basics (creatine, protein, pre-workout)
- Motivation and mindset for fitness

STRICT RULES:
1. ONLY answer questions related to fitness, exercise, nutrition, and health/wellness IN THE CONTEXT OF WORKING OUT
2. If asked about ANY topic outside fitness (weather, politics, astronomy, coding, etc.), politely refuse
3. Never give medical advice - always recommend consulting a doctor for injuries
4. Keep responses helpful, concise, and encouraging
5. Use the user's fitness data when provided to personalize advice

Be enthusiastic and motivating - you're helping people transform their lives!`;

export async function getAICoachResponse(userMessage, userContext = {}) {
  try {
    console.log("🤖 [AI SERVICE] Début - Message:", userMessage);
    console.log("🤖 GROQ_API_KEY existe:", !!process.env.GROQ_API_KEY);
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let contextMessage = userMessage;
    if (userContext.fitnessLevel || userContext.goal || userContext.bodyType) {
      contextMessage = `[User Context: 
- Fitness Level: ${userContext.fitnessLevel || "Not specified"}
- Primary Goal: ${userContext.goal || "Not specified"}
- Body Type: ${userContext.bodyType || "Not specified"}
- Height: ${userContext.height ? userContext.height + "cm" : "Not specified"}
- Weight: ${userContext.weight ? userContext.weight + "kg" : "Not specified"}
]

User Question: ${userMessage}`;
    }
    
    console.log("🤖 Envoi à Groq avec modèle: llama-3.3-70b-versatile");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: contextMessage }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 800,
    });

    console.log("🤖 Réponse reçue de Groq");
    return {
      success: true,
      reply: completion.choices[0]?.message?.content || "I'm here to help!",
    };
  } catch (error) {
    console.error("❌ [AI SERVICE] Erreur détaillée:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return {
      success: false,
      error: error.message || "Failed to get AI response",
    };
  }
}