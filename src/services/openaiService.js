import "dotenv/config";
import OpenAI from "openai";
import Feedback from "../models/Feedback.js";

// Configurar el cliente de DeepSeek
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateOpenAIFeedback = async (repo, readme, code, grade) => {
  try {
    const prompt = `
    🎓 **Evaluación Automática de Código en C++**
Eres un asistente especializado en evaluar código en C++. A continuación, se presentan los datos del estudiante:

📌 **Enunciado del ejercicio**:
${readme}

📝 **Código enviado por el estudiante**:
\`\`\`cpp
${code}
\`\`\`

📊 **Nota obtenida en GitHub Classroom**: ${grade}/10  
*(Esta nota refleja la evaluación automática basada en pruebas unitarias y ejecución de código.)*

💡 **Objetivo de la Evaluación**:
1. **Análisis de calidad del código**:
   - ✅ **Eficiencia y optimización**: ¿El código es eficiente en términos de complejidad computacional?
   - ✅ **Corrección**: ¿El código cumple con los requisitos del enunciado?
   - ✅ **Legibilidad y buenas prácticas**: ¿Sigue convenciones como Google C++ Style Guide?
   - ✅ **Pruebas unitarias**: ¿Por qué pudo haber fallado en las pruebas? Si hay errores, proporciona contraejemplos.

2. **Retroalimentación Constructiva**:
   - 🟢 **Puntos fuertes**: ¿Qué hizo bien el estudiante en su código?
   - 🟡 **Oportunidades de mejora**: ¿Qué aspectos del código pueden mejorarse?
   - 🔴 **Errores y correcciones**: Explica los errores encontrados con ejemplos claros y una versión corregida del código si es necesario.

📜 **Nota**: Si generas código corregido, asegúrate de que sea limpio, eficiente y cumpla con las convenciones de **Google C++ Style Guide**. 
   No uses \`using namespace std;\`. Este feedback es para estudiantes de **Programación de Estructuras Dinámicas**, por lo que las explicaciones deben ser claras y didácticas.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", //"gpt-4o-mini" | "gpt-4o" | "gpt-4-turbo,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content:
            "Por favor, proporciona una evaluación detallada del código proporcionado.",
        },
      ],
      temperature: 0.7,
      top_p: 0.95,
    });

    const feedback = response?.choices?.[0]?.message?.content || "No se pudo generar feedback.";

    //Guardar en MongoDB
    const feedbackData = new Feedback({
      repo,
      feedback,
    });

    await feedbackData.save();
    console.log("✅ Feedback guardado en MongoDB");

    return feedback;
  } catch (error) {
    console.error("Error al generar la retroalimentación:", error);
    throw new Error("No se pudo generar la retroalimentación.");
  }
};
