import { fetchLatestWorkflowRun, fetchWorkflowJobs  , fetchRepoContent, 
    fetchClassrooms, fetchAssignments, fetchAssignmentRepos,fetchAssignmentGrades,
    postFeedbackToPR 
 } from "../services/githubService.js";

//Obtener los archivos de un repositorio
export const getRepoFiles = async (req, res) => {
    try {
        const { repo } = req.params;
        const files = await fetchRepoContent(repo);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo archivos del repositorio", details: error.message });
    }
};


//Obtener las aulas
export const getClassrooms = async (req, res) => {
    try {
        const classrooms = await fetchClassrooms();
        res.json(classrooms);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo las classrooms", details: error.message });
    }
};

//Obtener las tareas de un aula
export const getAssignments = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const assignments = await fetchAssignments(classroomId);
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo las tareas del aula", details: error.message });
    }
};

//Obtener los repositorios de una tarea
export const getAssignmentRepos = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const repos = await fetchAssignmentRepos(assignmentId);
        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo los repositorios de la tarea", details: error.message });
    }
};

//Obtener las calificaciones de una tarea
export const getAssignmentGrades = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const grades = await fetchAssignmentGrades(assignmentId);
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo las calificaciones de la tarea", details: error.message });
    }
};

//Obtener detalles del último workflow de un repositorio
export const getLatestWorkflowDetails = async (req, res) => {
    try {
        const { repo } = req.params;

        //Obtener el último workflow run
        const latestRun = await fetchLatestWorkflowRun(repo);
        if (!latestRun) {
            return res.status(404).json({ error: "No se encontró ningún workflow run para este repositorio." });
        }

        //Obtener los jobs de ese run
        const jobs = await fetchWorkflowJobs(repo, latestRun.id);
        if (!jobs.length) {
            return res.status(404).json({ error: "No se encontraron jobs en el workflow run." });
        }

        //Extraer los jobs relevantes (pruebas y autograding)
        const testResults = jobs[0].steps
            .filter(step => step.name.toLowerCase().includes("compilación") || step.name.toLowerCase().includes("prueba"))
            .map(step => ({
                test_name: step.name,
                status: step.status,
                conclusion: step.conclusion,
                started_at: step.started_at,
                completed_at: step.completed_at
            }));

        //Construir la respuesta final
        const formattedResponse = {
            repo,
            workflow_name: latestRun.name,
            run_url: latestRun.html_url,
            status: latestRun.status,
            conclusion: latestRun.conclusion,
            created_at: latestRun.created_at,
            completed_at: latestRun.updated_at,
            testResults
        };

        res.json(formattedResponse);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo la información del workflow", details: error.message });
    }
};

// Agregar feedback a un PR
export const addFeedbackToPR = async (req, res) => {
    try {
        const { repo } = req.params;
        const { feedback } = req.body; 

        if (!feedback) {
            return res.status(400).json({ error: "El feedback es obligatorio." });
        }

        const owner = process.env.ORG_NAME; 
        const response = await postFeedbackToPR(owner, repo, feedback);

        res.json({ message: "Feedback agregado correctamente.", data: response });
    } catch (error) {
        res.status(500).json({ error: "Error agregando feedback al PR.", details: error.message });
    }
};