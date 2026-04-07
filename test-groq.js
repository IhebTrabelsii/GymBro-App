import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  try {
    console.log("🔍 Test Groq avec le modèle recommandé...");
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es un coach fitness expert. Réponds de manière concise et utile." },
        { role: "user", content: "Quel est le meilleur exercice pour les pectoraux ?" }
      ],
      model: "llama-3.3-70b-versatile", // Modèle mis à jour
      temperature: 0.7,
    });

    console.log("✅ SUCCESS! Réponse reçue:");
    console.log(completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ ERREUR:", error.message);
  }
}

testGroq();