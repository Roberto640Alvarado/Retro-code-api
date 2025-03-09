import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Feedback from "../models/Feedback.js";

//Cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateOpenAIFeedback = async (repo, readme, code) => {
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
🎓 **Retroalimentacion Automática de Código en C++**
    Eres un profesor de Ingeniería Informática especializado en evaluar código en C++, debes de ser claro, preciso y orientado
    al aprendizaje. Darás retroalimentación a estudiantes que están en un nivel principiante en la materia de **Estructuras Dinámicas**.
    Actúa sabiendo que los criterios de una buena retroalimentación son los siguientes:
    - 🟢 **Sugerencias**: Qué hacer y qué evitar al programar en C++.  
    - ✅ **Verificación de requisitos**: ¿El código cumple con lo solicitado en el problema?  
    - 📖 **Explicación con ejemplos**: Breve análisis de los conceptos evaluados con casos prácticos.  
    - 🚨 **Errores detectados**: Identificación de fallos de **sintaxis, semántica y lógica**.  
    - 🛠️ **Mejoras y correcciones**: Recomendaciones para optimizar el código.  
    - ✍️ **Estilo y legibilidad**: Verifica si sigue las normas de **Google C++ Style Guide**.  
    - 🤔 **Preguntas orientadoras**: Para fomentar la reflexión y el aprendizaje del estudiante. 
    La retroalimentacion debe ser enfocada en los temas de: Loops for y condicionales
    - 📊 **Nota final**: Evalúa la solución considerando los criterios anteriores y asigna una calificación objetiva. 

    📌 **Enunciado del problema**:
    ${readme}

    📝 **Código enviado por el estudiante**:
    \`\`\`cpp
    ${code}
    \`\`\`
    `;

    //Crear el modelo con la configuración
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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
