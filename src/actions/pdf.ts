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

        const allQuestions: any[] = [];

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

                // Give the AI only the first 15000 characters just in case it's a massive PDF
                text = text.substring(0, 15000);

                console.log("=== EXTRACTION PREVIEW ===");
                console.log(text.substring(0, 1500)); // Log the first 1500 chars to see what it looks like

                // Using OpenAI to intelligently extract the questions
                const { object } = await generateObject({
                    model: openai('gpt-4o-mini'),
                    schema: z.object({
                        questions: z.array(z.object({
                            statement: z.string().describe("El enunciado de la pregunta, limpio y sin metadata del sistema Moodle (sin textos como 'Pregunta 1', 'Se puntúa como 0', 'Sin contestar', 'Incorrecta')."),
                            optionA: z.string().describe("El texto exclusivo de la opción A, sin incluir la letra 'A.'."),
                            optionB: z.string().describe("El texto exclusivo de la opción B, sin incluir la letra 'B.'."),
                            optionC: z.string().describe("El texto exclusivo de la opción C, sin incluir la letra 'C.'. Si no hay, usa '-'."),
                            optionD: z.string().describe("El texto exclusivo de la opción D, sin incluir la letra 'D.'. Si no hay, usa '-'."),
                            correctOption: z.number().describe("Un número entre 0 y 3 que representa la opción correcta (0 para A, 1 para B, 2 para C, 3 para D). Localiza cuál de las opciones tiene la etiqueta [ESTA ES LA RESPUESTA CORRECTA] al principio.")
                        }))
                    }),
                    prompt: `
                    Aquí tienes el texto en bruto extraído de la exportación a PDF de un test/examen realizado en la plataforma Moodle.
                    El texto está lleno de basura de formato (como saltos de línea donde no tocan, menciones de "Se puntúa 0", "Incorrecta", "Sin contestar", etc.).
                    
                    Tu trabajo es limpiar analíticamente este texto y devolverme un array con las preguntas perfectas.
                    Ignora absolutamente todo el texto que no pertenezca estrictamente al enunciado de una pregunta o a sus respuestas.
                    Si el formato carece de algunas opciones C o D, utiliza el carácter '-' como placeholder literal.
                    
                    ¡MUY IMPORTANTE PARA LA RESPUESTA CORRECTA!:
                    El pre-procesador ha inyectado el tag literal "[ESTA ES LA RESPUESTA CORRECTA]" justo en la línea de la opción que estaba en negrita en el PDF.
                    La opción correcta será obligatoria y matemáticamente aquella que contenga o vaya precedida por ese tag.
                    Mapea la correcta traduciéndolo a su índice numérico exacto (0-3).
                    
                    TEXTO BRUTO DEL PDF:
                    ${text}
                    `,
                });

                if (object.questions && object.questions.length > 0) {
                    allQuestions.push(...object.questions);
                }
            })
        );

        if (allQuestions.length === 0) {
            return { success: false, error: "La IA no ha podido encontrar ninguna pregunta con opciones válido en estos documentos." };
        }

        return { success: true, questions: allQuestions };

    } catch (error) {
        console.error("AI PDF Parse error", error);
        return { success: false, error: "Error procesando el PDF con IA. Asegúrate de tener la variable OPENAI_API_KEY configurada." };
    }
}
