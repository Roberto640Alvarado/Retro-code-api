import axios from "axios";
import { Octokit } from "@octokit/rest";
import "dotenv/config";

const GITHUB_HEADERS = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
};
const ORG_NAME = process.env.ORG_NAME;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const FEEDBACK_BRANCH = "feedback"; 
const FEEDBACK_FILE_PATH = "feedback.md";

//Traer todos los classroom de una organizacion
export const fetchClassrooms = async () => {
    const url = `https://api.github.com/classrooms`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo classrooms:", error.response?.data || error.message);
        throw error;
    }
};

//Traer todas las tareas de una classroom
export const fetchAssignments = async (classroomId) => {
    const url = `https://api.github.com/classrooms/${classroomId}/assignments`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo tareas del aula:", error.response?.data || error.message);
        throw error;
    }
};

//Traer todos los repositorios de una tarea
export const fetchAssignmentRepos = async (assignmentId) => {
    const url = `https://api.github.com/assignments/${assignmentId}/accepted_assignments`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo los repositorios de la tarea:", error.response?.data || error.message);
        throw error;
    }
};

//Obtener todas las calificaciones de una tarea
export const fetchAssignmentGrades = async (assignmentId) => {
    const url = `https://api.github.com/assignments/${assignmentId}/grades`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo calificaciones de la tarea:", error.response?.data || error.message);
        throw error;
    }
};

//Función para obtener el último run de un workflow
export const fetchLatestWorkflowRun = async (repo) => {
    const url = `https://api.github.com/repos/${ORG_NAME}/${repo}/actions/runs`;
    const response = await axios.get(url, { headers: GITHUB_HEADERS });

    if (!response.data.workflow_runs.length) return null;

    //Obtener el último run
    return response.data.workflow_runs[0];
};

//Función para obtener los detalles de un workflow
export const fetchWorkflowJobs = async (repo, runId) => {
    const url = `https://api.github.com/repos/${ORG_NAME}/${repo}/actions/runs/${runId}/jobs`;
    const response = await axios.get(url, { headers: GITHUB_HEADERS });

    return response.data.jobs;
};

//Función para obtener el contenido de un repositorio
export const fetchRepoContent = async (repo) => {
    try {
        //Obtener el listado de archivos en el repositorio
        const repoContentsUrl = `https://api.github.com/repos/${ORG_NAME}/${repo}/contents/`;
        const contentsResponse = await axios.get(repoContentsUrl, { headers: GITHUB_HEADERS });

        //Filtrar archivos con terminación .cpp
        const cppFiles = contentsResponse.data.filter(file => file.name.endsWith(".cpp"));

        if (cppFiles.length === 0) {
            throw new Error("No se encontró ningún archivo .cpp en el repositorio.");
        }

        // Seleccionar el primer archivo .cpp encontrado
        const codeUrl = cppFiles[0].download_url;

        //Obtener el contenido del README.md
        const readmeUrl = `https://api.github.com/repos/${ORG_NAME}/${repo}/contents/README.md`;
        const readmeResponse = await axios.get(readmeUrl, { headers: GITHUB_HEADERS });

        //Obtener el contenido del archivo .cpp seleccionado
        const codeResponse = await axios.get(codeUrl);

        return {
            readme: Buffer.from(readmeResponse.data.content, "base64").toString(),
            code: codeResponse.data,

        };
    } catch (error) {
        console.error("Error obteniendo contenido del repositorio:", error.message);
        return null;
    }
};

//Función para actualizar o crear el feedback en la rama feedback
export const updateFeedbackInPR = async (repo, feedbackText) => {
    try {
        //Verificar si el archivo feedback.md ya existe en la rama feedback
        let fileSha = null;
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: ORG_NAME,
                repo: repo,
                path: FEEDBACK_FILE_PATH,
                ref: FEEDBACK_BRANCH,
            });
            fileSha = fileData.sha; // Guardamos el SHA del archivo existente
        } catch (error) {
            console.log("📌 No se encontró feedback.md. Se creará uno nuevo.");
        }

        //Formatear el feedback en Markdown
        const formattedFeedback = `# 📌 Retroalimentación del Código\n\n${feedbackText}`;

        //Crear o actualizar el archivo en la rama feedback
        await octokit.repos.createOrUpdateFileContents({
            owner: ORG_NAME,
            repo: repo,
            path: FEEDBACK_FILE_PATH,
            message: "🔄 Actualizando feedback del código",
            content: Buffer.from(formattedFeedback).toString("base64"),
            sha: fileSha, 
            branch: FEEDBACK_BRANCH, 
        });

        console.log(`✅ Feedback actualizado en el PR de ${repo}`);
        return { success: true, message: "Feedback actualizado en la rama feedback." };
    } catch (error) {
        console.error(`❌ Error actualizando feedback en ${repo}:`, error.response?.data || error);
        return { success: false, error: error.message };
    }
};

//Función para obtener el número de un Pull Request abierto
export const getOpenPullRequest = async (owner, repo) => {
    try {
        const response = await octokit.request(`GET /repos/{owner}/{repo}/pulls`, {
            owner,
            repo,
            state: "open",
            headers: GITHUB_HEADERS
        });

        if (response.data.length === 0) {
            console.warn(`⚠ No hay Pull Requests abiertos en ${repo}`);
            return null;
        }

        return response.data[0].number; //Retorna el número del primer PR abierto
    } catch (error) {
        console.error(`❌ Error obteniendo PRs de ${repo}:`, error.response?.data || error.message);
        throw error;
    }
};

//Función para agregar un comentario a un Pull Request
export const addCommentToPullRequest = async (owner, repo, pull_number, feedback) => {
    try {
        const response = await octokit.request(`POST /repos/{owner}/{repo}/issues/{issue_number}/comments`, {
            owner,
            repo,
            issue_number: pull_number,  
            body: feedback,
            headers: GITHUB_HEADERS
        });

        console.log(`✅ Comentario agregado en el PR #${pull_number} de ${repo}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error agregando comentario en el PR ${pull_number}:`, error.response?.data || error.message);
        throw error;
    }
};

//Función para enviar feedback a un Pull Request
export const postFeedbackToPR = async (owner, repo, feedback) => {
    try {
        const pull_number = await getOpenPullRequest(owner, repo);
        if (!pull_number) {
            throw new Error(`No se encontró un Pull Request abierto en ${repo}`);
        }

        return await addCommentToPullRequest(owner, repo, pull_number, feedback);
    } catch (error) {
        console.error("❌ Error procesando el feedback:", error.message);
        throw error;
    }
};
