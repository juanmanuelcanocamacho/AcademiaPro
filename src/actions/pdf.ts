"use server";

// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function parseMoodlePDF(formData: FormData) {
    try {
        const files = formData.getAll("file") as File[];
        if (!files || files.length === 0) return { success: false, error: "No files uploaded" };

        const allResults: { fileName: string, questions: any[] }[] = [];

        // Procesamos todos los PDFs concurrentemente para mayor velocidad
        await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const render_page = async (pageData: any) => {
                    const render_options = { normalizeWhitespace: false, disableCombineTextItems: false };
                    const textContent = await pageData.getTextContent(render_options);
                    let lastY, text = '';
                    for (let item of textContent.items) {
                        let fontPrefix = `[${item.fontName}]`;
                        let str = item.str;

                        if (lastY == item.transform[5] || !lastY) {
                            text += str;
                        } else {
                            text += '\n' + fontPrefix + ' ' + str;
                        }
                        lastY = item.transform[5];
                    }
                    return text;
                };

                // Parsing the raw text from the PDF with our custom renderer
                const data = await pdfParse(buffer, { pagerender: render_page });
                let text = data.text;

                // Pre-procesador determinista: Buscar de forma matemática cuál es la fuente que se usa para la respuesta correcta 
                // (la fuente en negrita aparece muchas menos veces en las opciones que la fuente normal).
                const optionFontRegex = /\[(.*?)\]\s*[a-d]\./ig;
                let match;
                const fontCounts: Record<string, number> = {};

                while ((match = optionFontRegex.exec(text)) !== null) {
                    const font = match[1];
                    fontCounts[font] = (fontCounts[font] || 0) + 1;
                }

                // La fuente normal será la que tiene muchos matches. La fuente de las correctas será la que tiene menos.
                const fonts = Object.keys(fontCounts).sort((a, b) => fontCounts[a] - fontCounts[b]);
                if (fonts.length >= 2) {
                    const rareFont = fonts[0]; // The font used the least for options (bold)
                    // Reemplazamos esa etiqueta específica por un chivato explícito para la IA
                    text = text.replace(new RegExp(`\\[${rareFont}\\]`, 'g'), '[ESTA ES LA RESPUESTA CORRECTA]');
                }

                console.log("=== EXTRACTION PREVIEW ===");
                console.log(text.substring(0, 1500));
                console.log(`=== TOTAL TEXT LENGTH: ${text.length} characters ===`);

                // Procesamos el PDF en chunks para soportar exámenes grandes sin perder preguntas.
                // gpt-4o-mini soporta 128k tokens (~500k chars), usamos chunks de 80k con
                // solapamiento de 2k para no cortar preguntas a mitad.
                const CHUNK_SIZE = 80000;
                const OVERLAP = 2000;
                const chunks: string[] = [];

                if (text.length <= CHUNK_SIZE) {
                    chunks.push(text);
                } else {
                    let start = 0;
                    while (start < text.length) {
                        chunks.push(text.substring(start, start + CHUNK_SIZE));
                        start += CHUNK_SIZE - OVERLAP;
                    }
                }

                console.log(`=== PROCESSING IN ${chunks.length} CHUNK(S) ===`);

                const questionSchema = z.object({
                    questions: z.array(z.object({
                        statement: z.string().describe("El enunciado de la pregunta, limpio y sin metadata del sistema Moodle (sin textos como 'Pregunta 1', 'Se puntúa como 0', 'Sin contestar', 'Incorrecta')."),
                        optionA: z.string().describe("El texto exclusivo de la opción A, sin incluir la letra 'A.' y SIN la etiqueta '[ESTA ES LA RESPUESTA CORRECTA]'."),
                        optionB: z.string().describe("El texto exclusivo de la opción B, sin incluir la letra 'B.' y SIN la etiqueta '[ESTA ES LA RESPUESTA CORRECTA]'."),
                        optionC: z.string().describe("El texto exclusivo de la opción C, sin incluir la letra 'C.' y SIN la etiqueta '[ESTA ES LA RESPUESTA CORRECTA]'. Si no hay, usa '-'."),
                        optionD: z.string().describe("El texto exclusivo de la opción D, sin incluir la letra 'D.' y SIN la etiqueta '[ESTA ES LA RESPUESTA CORRECTA]'. Si no hay, usa '-'."),
                        correctOption: z.number().describe("Un número entre 0 y 3 que representa la opción correcta (0 para A, 1 para B, 2 para C, 3 para D).")
                    }))
                });

                const chunkResults = await Promise.all(
                    chunks.map(async (chunk, idx) => {
                        const { object } = await generateObject({
                            model: openai('gpt-4o-mini'),
                            schema: questionSchema,
                            prompt: `
                            Aquí tienes el texto en bruto extraído de la exportación a PDF de un test/examen realizado en la plataforma Moodle.
                            ${chunks.length > 1 ? `Este es el fragmento ${idx + 1} de ${chunks.length} del documento completo.` : ''}
                            Tu trabajo es limpiar analíticamente este texto y devolverme un array con las preguntas perfectas.
                            Ignora absolutamente todo el texto que no pertenezca estrictamente al enunciado de una pregunta o a sus respuestas.
                            IMPORTANTE: Solo incluye preguntas COMPLETAS (con enunciado y sus 4 opciones). Si una pregunta está cortada al inicio o al final del fragmento, ignórala.
                            
                            ¡INSTRUCCIONES VITALES PARA LA RESPUESTA CORRECTA!:
                            1. El pre-procesador puede haber inyectado la etiqueta literal "[ESTA ES LA RESPUESTA CORRECTA]" junto a la opción que estaba en negrita. Si la ves, es un indicio muy fuerte de que esa es la respuesta.
                            2. SIN EMBARGO, Moodle a veces añade un texto de retroalimentación explícito (ej: "La respuesta correcta es: Bajo"). Si ves este texto explícito confirmando cuál es la respuesta, PRIORIZA EL TEXTO EXPLÍCITO por encima de la etiqueta inyectada.
                            3. LIMPIEZA OBLIGATORIA: Tienes totalmente PROHIBIDO incluir la etiqueta "[ESTA ES LA RESPUESTA CORRECTA]" en el texto final de las opciones (optionA, optionB, etc). Elimínala por completo para que el texto quede limpio.
                            
                            TEXTO BRUTO DEL PDF:
                            ${chunk}
                            `,
                        });
                        return object.questions || [];
                    })
                );

                // Combinar resultados de todos los chunks y deduplicar por enunciado
                const seenStatements = new Set<string>();
                const allQuestions: any[] = [];
                for (const chunkQuestions of chunkResults) {
                    for (const q of chunkQuestions) {
                        const key = q.statement.substring(0, 80).trim().toLowerCase();
                        if (!seenStatements.has(key)) {
                            seenStatements.add(key);
                            allQuestions.push(q);
                        }
                    }
                }

                const object = { questions: allQuestions };

                if (object.questions && object.questions.length > 0) {
                    allResults.push({
                        fileName: file.name,
                        questions: object.questions
                    });
                }
            })
        );

        if (allResults.length === 0) {
            return { success: false, error: "La IA no ha podido encontrar ninguna pregunta con opciones válido en estos documentos." };
        }

        // Sort by file name to keep it consistent
        allResults.sort((a, b) => a.fileName.localeCompare(b.fileName));

        return { success: true, results: allResults };

    } catch (error) {
        console.error("AI PDF Parse error", error);
        return { success: false, error: "Error procesando el PDF con IA. Asegúrate de tener la variable OPENAI_API_KEY configurada." };
    }
}

export async function parsePDFWithVision(images: string[]) {
    try {
        if (!images || images.length === 0) return { success: false, error: "No se proporcionaron imágenes del PDF." };

        const chunkResults: any[] = [];
        const CHUNK_SIZE = 3;

        // Partimos en grupos de 3 páginas para evitar límites de tokens / payload
        const chunks: string[][] = [];
        for (let i = 0; i < images.length; i += CHUNK_SIZE) {
            chunks.push(images.slice(i, i + CHUNK_SIZE));
        }

        console.log(`=== PROCESSING PDF WITH VISION IN ${chunks.length} CHUNKS ===`);

        const questionSchema = z.object({
            questions: z.array(z.object({
                statement: z.string().describe(
                    "El enunciado de la pregunta. Limpio y sin metadatos. " +
                    "IMPORTANTE: Si en la imagen de la página hay algún código de programación, diagrama, tabla, gráfica o " +
                    "esquema dentro de la pregunta, debes transcribir o describir detalladamente esa información y añadirla al final de la pregunta. " +
                    "Si es código, formatéalo como bloque de código markdown (ej: ```javascript ... ```). Si es un diagrama, descríbelo en detalle."
                ),
                optionA: z.string().describe("El texto de la opción A, sin incluir la letra 'A.'"),
                optionB: z.string().describe("El texto de la opción B, sin incluir la letra 'B.'"),
                optionC: z.string().describe("El texto de la opción C, sin incluir la letra 'C.' (si no hay, usa '-')"),
                optionD: z.string().describe("El texto de la opción D, sin incluir la letra 'D.' (si no hay, usa '-')"),
                correctOption: z.number().describe(
                    "Índice de la respuesta correcta (0 para A, 1 para B, 2 para C, 3 para D). " +
                    "Identifícala buscando la marca visual de correcto en la imagen (por ejemplo, check verde, " +
                    "opción en negrita, retroalimentación explícita 'La respuesta correcta es...', etc.)"
                )
            }))
        });

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            const imageParts = chunk.map(base64Str => {
                const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                return {
                    type: 'image' as const,
                    image: buffer
                };
            });

            const { object } = await generateObject({
                model: openai('gpt-4o-mini'),
                schema: questionSchema,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analiza estas páginas de un examen de Moodle. Extrae todas las preguntas tipo test que veas completas.
                                
                                INSTRUCCIONES CLAVE:
                                1. Si la pregunta contiene una captura de pantalla, diagrama, tabla, gráfica o un bloque de código, DEBES transcribir/describir su contenido fielmente e inyectarlo dentro del campo 'statement' (enunciado) usando formato markdown limpio (ej: bloques de código \`\`\`javascript ... \`\`\`).
                                2. Determina con precisión la respuesta correcta (correctOption) identificando las marcas visuales de Moodle (como el check verde, la cruz roja en las incorrectas, el sombreado de la respuesta correcta, o el texto de retroalimentación 'La respuesta correcta es: ...').
                                3. Ignora metadatos irrelevantes como 'Pregunta 1', 'Sin responder', 'Puntúa como 1,00' o textos de navegación.`
                            },
                            ...imageParts
                        ]
                    }
                ]
            });

            if (object.questions && object.questions.length > 0) {
                chunkResults.push(...object.questions);
            }
        }

        // Deduplicar por enunciado por si acaso
        const seenStatements = new Set<string>();
        const allQuestions: any[] = [];
        for (const q of chunkResults) {
            const key = q.statement.substring(0, 80).trim().toLowerCase();
            if (!seenStatements.has(key)) {
                seenStatements.add(key);
                allQuestions.push(q);
            }
        }

        return { success: true, questions: allQuestions };
    } catch (error) {
        console.error("parsePDFWithVision error:", error);
        return { success: false, error: "Error al procesar el PDF con visión artificial de OpenAI." };
    }
}
