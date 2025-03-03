import OpenAI from "openai"; 
import Feedback from "../models/Feedback.js";

// Configurar cliente de Ollama para usar CodeLlama:13b
const ollama = new OpenAI({
  baseURL: "http://localhost:11434/v1",  
  apiKey: "ollama",
});

export const generateOpenAIFeedback = async (repo, readme, code, grade) => {
  try {
    const prompt = `
    🎓 **Evaluación Automática de Código en C++**
Eres un asistente experto en C++ encargado de evaluar código de estudiantes. Analiza el código enviado y proporciona retroalimentación detallada basada en:

✅ **Corrección:** ¿El código cumple con los requisitos del enunciado?  
✅ **Eficiencia:** ¿Se puede optimizar en términos de rendimiento?  
✅ **Legibilidad:** ¿Sigue buenas prácticas de estilo (Google C++ Style Guide)?  
✅ **Errores:** Si hay errores, explica el problema y proporciona una versión corregida.  

📌 **Enunciado del ejercicio:**  
${readme}

📝 **Código del estudiante:**  
\`\`\`cpp
${code}
\`\`\`

📊 **Nota en pruebas unitarias:** ${grade}/10

💡 **Importante:** No generes código nuevo si no es necesario. Solo analiza y da retroalimentación clara y concisa.
`;

    const response = await ollama.chat.completions.create({
      model: "codellama:13b", 
      messages: [{ role: "system", content: prompt }],
      temperature: 0.3, 
      max_tokens: 1024,
    });

    const feedback = response?.choices?.[0]?.message?.content || "No se pudo generar feedback.";

    // Guardar en MongoDB
    const feedbackData = new Feedback({ repo, feedback });
    await feedbackData.save();
    console.log("✅ Feedback guardado en MongoDB");

    return feedback;
  } catch (error) {
    console.error("Error al generar la retroalimentación:", error);
    throw new Error("No se pudo generar la retroalimentación.");
  }
};

