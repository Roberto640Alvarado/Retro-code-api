# 🚀 Backend de Retro-Code  
**Trabajo de Graduación - Ingeniería Informática UCA 2025**  

## 📌 Descripción  
Este backend proporciona una API REST para un **sistema de calificación automática y retroalimentación** enfocado en materias de **Programación de Estructuras Dinámicas**.  

### 🎯 Características principales:  
- 📂 **Gestión de repositorios y versionamiento** mediante la API de GitHub.  
- 🤖 **Retroalimentación automática** generada con **Inteligencia Artificial**.  
- ⚙️ **Integración con GitHub Classroom** para facilitar la evaluación de código.  

---

## ⚙️ Configuración del Entorno  

Para que el sistema funcione correctamente, debes crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:  

```plaintext
# 🔑 Token de GitHub con los permisos necesarios para acceder a repositorios, commits y PRs.
GITHUB_TOKEN=

# 🔑 API Key de Gemini para la generación de feedback con IA.
GEMINI_API_KEY=

# 🚀 Puerto en el que correrá el backend (por defecto 3000).
PORT=3000

# 🏫 Nombre de la organización en GitHub Classroom.
ORG_NAME=ProyectoGraduacionUCA

# 🗄️ URI de conexión a la base de datos MongoDB.
MONGO_URI=
```

## ⚠️ Importante:
- Asegúrar que GITHUB_TOKEN tenga los permisos adecuados para leer, escribir y administrar repositorios y Pull Requests.

## 🚀 Instalación y Uso

### 1️⃣ Clonar el repositorio
```plaintext
git clone https://github.com/ProyectoGraduacionUCA/retro-code-api.git
```

```plaintext
cd retro-code-api
```

### 2️⃣ Instalar dependencias
```plaintext
npm install
```

### 3️⃣ Iniciar el servidor 
```plaintext
node server.js
```
