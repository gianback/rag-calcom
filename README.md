## 🧠 Explicación Técnica

La aplicación usa una arquitectura **RAG (Retrieval-Augmented Generation)** para evitar enviar al modelo grandes porciones del repositorio de Cal.com. En lugar de intentar meter todo el contenido en el prompt, se indexa el código de forma inteligente y solo se envían los fragmentos realmente relevantes.

> 💡 **Nota sobre el modelo:**  
> Actualmente se utiliza **`gpt-5.1-mini`** por motivos de **coste**. Esto implica que:
> - No se envía **todo** el historial de conversación en cada request, sino solo un historial limitado.
> - La **calidad de las respuestas** puede mejorar si se usa un modelo más caro y potente (por ejemplo, un modelo “full” de la familia GPT-5.1) y/o si se envía más contexto en cada llamada.

---

### 1. Indexación del repositorio (pre-proceso)

- Se clona el repo público `cal.com`.  
- Con **Tree-sitter** se parsean archivos de varias extensiones (TS/JS/JSON, etc.) para extraer unidades lógicas como:
  - funciones  
  - clases  
  - componentes  
  - imports/exports  
- Para cada fragmento se genera una **descripción compacta** mediante el modelo, usando la estructura detectada como insumo.  
- Esa descripción se convierte en un **embedding** y se almacena en un índice vectorial junto con su metadata, que incluye:
  - el **path** del archivo origen  
  - la **descripción generada** del fragmento  
- Este preprocesamiento se ejecuta una sola vez; en tiempo de consulta no se vuelven a generar embeddings del repositorio.

---

### 2. Flujo de consulta

1) El usuario envía un mensaje.  
2) El modelo analiza la consulta y decide si necesita hacer una búsqueda externa.  
   - Si requiere contexto del repositorio, genera el embedding de la consulta y puede invocar el **descriptionFileTool** para obtener fragmentos relevantes mediante búsqueda semántica.
   - Si la pregunta exige leer un archivo, listar una carpeta o buscar coincidencias exactas, puede elegir **contentFileTool**, **readFolderTool** o **findInRepoTool**.
   - Si no necesita información del repositorio, responde directamente sin usar herramientas.
3) Con la información recuperada (si la hay), el modelo construye un **prompt reducido**, que incluye solo los fragmentos esenciales y un resumen breve del historial reciente (no se envía la conversación completa para optimizar costes).
4) El modelo responde en **streaming**, manteniendo un contexto liviano y evitando cargar contenido innecesario del repositorio.

Este diseño permite que el agente consulte el repo únicamente cuando la tarea lo demanda, combinando RAG semántico con herramientas de exploración directa del código sin saturar el límite de tokens ni disparar los costes de uso del modelo.
