## 🧠 Explicación Técnica

La aplicación usa una arquitectura **RAG (Retrieval-Augmented Generation)** para evitar enviar al modelo grandes porciones del repositorio de Cal.com. En lugar de intentar meter todo el contenido en el prompt, se indexa el código de forma inteligente y solo se envían los fragmentos realmente relevantes.

### 1. Indexación del repositorio (pre-proceso)
- Se clona el repo público `cal.com`.
- Usando **Tree-sitter**, se parsean archivos de múltiples extensiones (TS/JS/JSON, etc.) para extraer:
  - funciones  
  - clases  
  - imports/exports  
  - componentes y estructura  
- Cada fragmento significativo se convierte a **embedding** y se almacena en un **índice vectorial**.
- Esto se ejecuta una sola vez → no se recalculan embeddings en tiempo de consulta.

### 2. Flujo de consulta

1) El usuario envía un mensaje.  
2) El modelo analiza la consulta y decide si necesita hacer una búsqueda externa.  
   - Si requiere contexto del repositorio, genera el embedding de la consulta y puede invocar el **descriptionFileTool** para obtener fragmentos relevantes mediante búsqueda semántica.
   - Si la pregunta exige leer un archivo, listar una carpeta o buscar coincidencias exactas, puede elegir **contentFileTool**, **readFolderTool** o **findInRepoTool**.
   - Si no necesita información del repositorio, responde directamente sin usar herramientas.
3) Con la información recuperada (si la hay), el modelo construye un **prompt reducido**, que incluye solo los fragmentos esenciales y un resumen breve del historial reciente.
4) El modelo responde en **streaming**, manteniendo un contexto liviano y evitando cargar contenido innecesario del repositorio.

Este diseño permite que el agente consulte el repo únicamente cuando la tarea lo demanda, combinando RAG semántico con herramientas de exploración directa del código sin saturar el límite de tokens.
