import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Feedback from "../models/Feedback.js";

//Cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateOpenAIFeedback = async (repo, readme, code, grade) => {
  try {

    const generationConfig = {
      temperature: 1,
      top_p: 0.95,
      top_k: 40,
      max_output_tokens: 8192,
      response_mime_type: "text/plain",
    };

    //Prompt mejorado con la nota obtenida
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

📜 **Nota**: Si generas código corregido, asegúrate de que sea limpio, eficiente y cumpla con las convenciones de **Google C++ Style Guide**. No uses \`using namespace std;\`. Este feedback es para estudiantes de **Programación de Estructuras Dinámicas**, por lo que las explicaciones deben ser claras y didácticas.
`;

    //Crear el modelo con la configuración
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig,
    });

    //Enviar el mensaje al modelo
    const response = await model.generateContent(prompt);

    //Extraer el contenido de la respuesta
    const feedback = response?.response?.text();

    //Guardar en MongoDB
    const feedbackData = new Feedback({
      repo,
      feedback: feedback,
    });

    await feedbackData.save();
    console.log("✅ Feedback guardado en MongoDB");

    return feedback || "No se pudo generar feedback.";
  } catch (error) {
    throw new Error("No se pudo generar la retroalimentación.");
  }
};
