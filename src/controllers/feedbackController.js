import { generateOpenAIFeedback } from "../services/openaiService.js";
import Feedback from "../models/Feedback.js";

//Generar feedback con gemini
export const generateFeedback = async (req, res) => {
    try {
        const { repo } = req.params;
        const { readme, code, grade} = req.body;

        const feedback = await generateOpenAIFeedback(repo, readme, code, grade );
        res.json({ feedback });
    } catch (error) {
        res.status(500).json({ error: "Error generando feedback con OpenAI", details: error.message });
    }
};

//Obtener feedback por nombre de repositorio
export const getFeedbackByRepo = async (req, res) => {
    try {
        const { repo } = req.params;
        const feedbackData = await Feedback.findOne({ repo });

        if (!feedbackData) {
            return res.status(404).json({ error: "No se encontró feedback para este repositorio" });
        }

        res.json(feedbackData);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo feedback", details: error.message });
    }
};