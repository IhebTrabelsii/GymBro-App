// Simple guardrail to keep AI focused on fitness
export const fitnessGuardrail = (req, res, next) => {
  const { message } = req.body;
  
  console.log("\n🛡️ [GUARDRAIL] ========== DÉBUT ==========");
  console.log("🛡️ [GUARDRAIL] Message reçu:", message);
  
  if (!message || typeof message !== 'string') {
    console.log("🛡️ [GUARDRAIL] ❌ REJETÉ: message invalide");
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid message'
    });
  }

  const lowerMessage = message.toLowerCase().trim();
  console.log("🛡️ [GUARDRAIL] Message normalisé:", lowerMessage);
  
  // ===== 1. SALUTATIONS ET EXPRESSIONS AMICALES (TOUJOURS ACCEPTÉES) =====
  const greetings = [
    'hi', 'hey', 'hello', 'hola', 'salut', 'bonjour', 'yo', 'wassup', 
    'sup', 'good morning', 'good afternoon', 'good evening', 'greetings',
    'howdy', 'what\'s up', 'whats up', 'hey there', 'hi there'
  ];
  
  const isGreeting = greetings.some(greeting => 
    lowerMessage.includes(greeting) && lowerMessage.length < 20
  );
  
  if (isGreeting) {
    console.log("🛡️ [GUARDRAIL] ✅ ACCEPTÉ: salutation");
    return next();
  }
  
  // ===== 2. EXPRESSIONS SOCIALES (AUSSI ACCEPTÉES) =====
  const socialExpressions = [
    'how are you', 'how r u', 'how are u', 'how do you do',
    'nice to meet you', 'pleased to meet you', 'good to see you',
    'what\'s good', 'whats good', 'how\'s it going', 'hows it going',
    'how are things', 'how’s everything', 'hows everything'
  ];
  
  const isSocial = socialExpressions.some(expr => 
    lowerMessage.includes(expr)
  );
  
  if (isSocial) {
    console.log("🛡️ [GUARDRAIL] ✅ ACCEPTÉ: expression sociale");
    return next();
  }
  
  // ===== 3. DÉTECTION APPROXIMATIVE DES MOTS FITNESS (tolérante) =====
  // On utilise des extraits de mots pour gérer les fautes de frappe
  const fitnessPatterns = [
    'workout', 'exercise', 'gym', 'muscle', 'fat', 'weight',
    'protein', 'calories', 'diet', 'nutrition', 'training', 'lifting',
    'bench', 'squat', 'deadlift', 'cardio', 'abs', 'chest',
    'back', 'legs', 'shoulder', 'biceps', 'triceps', 'strength',
    'endurance', 'stretching', 'form', 'technique', 'routine',
    'plan', 'goal', 'bulk', 'cut', 'supplement', 'pre-workout',
    'post-workout', 'recovery', 'rest', 'motivation', 'fit',
    'health', 'body', 'pump', 'burn', 'gain', 'lose', 'muscle',
    'fat loss', 'weight loss', 'muscle gain', 'work out'
  ];
  
  const isFitnessRelated = fitnessPatterns.some(pattern => 
    lowerMessage.includes(pattern)
  );
  
  console.log("🛡️ [GUARDRAIL] Fitness-related?", isFitnessRelated);
  
  // ===== 4. THÈMES CLAIREMENT HORS-SUJET À BLOQUER =====
  const offTopicKeywords = [
    'weather', 'politics', 'election', 'president', 'movie', 'film', 'game', 
    'joke', 'distance', 'earth', 'moon', 'sun', 'planet', 'history', 'math', 
    'code', 'programming', 'javascript', 'python', 'computer', 'car',
    'travel', 'vacation', 'holiday', 'news', 'crypto', 'bitcoin', 'stock', 
    'invest', 'sing', 'dance', 'cook', 'recipe (non-fitness)', 'celebrity',
    'actor', 'actress', 'singer', 'song', 'music', 'movie star'
  ];

  const isOffTopic = offTopicKeywords.some(word => 
    lowerMessage.includes(word)
  );
  
  console.log("🛡️ [GUARDRAIL] Hors-sujet détecté?", isOffTopic);

  // ===== 5. RÈGLES DE DÉCISION =====
  
  // Blocage des messages clairement hors-sujet
  if (isOffTopic && !isFitnessRelated && !isGreeting && !isSocial) {
    console.log("🛡️ [GUARDRAIL] ❌ REJETÉ: hors-sujet");
    return res.status(400).json({
      success: false,
      error: "I'm your GymBro fitness coach, so I can only help with workout and nutrition questions! Got any fitness goals I can help with? 💪"
    });
  }

  // Blocage des messages trop courts (sauf salutations déjà gérées)
  if (message.length < 3 && !isFitnessRelated) {
    console.log("🛡️ [GUARDRAIL] ❌ REJETÉ: message trop court");
    return res.status(400).json({
      success: false,
      error: "Please ask me something specific about fitness, workouts, or nutrition! 💪"
    });
  }

  // TOUT LE RESTE EST ACCEPTÉ !
  console.log("🛡️ [GUARDRAIL] ✅ ACCEPTÉ");
  console.log("🛡️ [GUARDRAIL] ========== FIN ==========\n");
  next();
};