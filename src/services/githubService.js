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

// Función para crear un nuevo Pull Request
export const createPullRequest = async (owner, repo, feedback) => {
    try {
        const branchName = `auto-feedback-${Date.now()}`; 
        const baseBranch = "main"; 

        // Obtener el último commit de la rama base
        const { data: baseRef } = await octokit.request(`GET /repos/{owner}/{repo}/git/ref/heads/${baseBranch}`, {
            owner,
            repo
        });

        const baseSha = baseRef.object.sha;

        //Crear una nueva rama desde el último commit de la rama base
        await octokit.request(`POST /repos/{owner}/{repo}/git/refs`, {
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: baseSha
        });

        console.log(`✅ Rama ${branchName} creada en ${repo}`);

        //Crear un nuevo archivo `feedback.md` con el contenido del feedback
        const feedbackContent = Buffer.from(feedback, "utf-8").toString("base64");

        const { data: newFile } = await octokit.request(`PUT /repos/{owner}/{repo}/contents/feedback.md`, {
            owner,
            repo,
            path: "feedback.md",
            message: "Añadiendo archivo de feedback",
            content: feedbackContent,
            branch: branchName,
            headers: GITHUB_HEADERS
        });

        //Crear el Pull Request
        const response = await octokit.request(`POST /repos/{owner}/{repo}/pulls`, {
            owner,
            repo,
            title: "Auto-generated Feedback PR",
            head: branchName,
            base: baseBranch,
            body: "Este PR ha sido creado automáticamente para la retroalimentación.",
            headers: GITHUB_HEADERS
        });

        console.log(`✅ Pull Request #${response.data.number} creado en ${repo}`);
        return response.data.number;
    } catch (error) {
        console.error(`❌ Error creando PR en ${repo}:`, error.response?.data || error.message);
        throw error;
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
        let pull_number = await getOpenPullRequest(owner, repo);
        
        //Si no hay PR abierto, creamos uno nuevo
        if (!pull_number) {
            console.log(`No hay PR abierto en ${repo}. Creando uno nuevo...`);
            pull_number = await createPullRequest(owner, repo, feedback);
        }

        //Agregar comentario con el feedback al PR
        return await addCommentToPullRequest(owner, repo, pull_number, feedback);
    } catch (error) {
        console.error("❌ Error procesando el feedback:", error.message);
        throw error;
    }
};
