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

                // Parsing the raw text from the PDF
                const data = await pdfParse(buffer);
                let text = data.text;

                // Give the AI only the first 15000 characters just in case it's a massive PDF
                text = text.substring(0, 15000);

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
                            correctOption: z.number().describe("Un número entre 0 y 3 que representa la opción correcta (0 para A, 1 para B, 2 para C, 3 para D). Basado en el texto 'La respuesta correcta es: ' que suele aparecer al final de cada bloque.")
                        }))
                    }),
                    prompt: `
                    Aquí tienes el texto en bruto extraído de la exportación a PDF de un test/examen realizado en la plataforma Moodle.
                    El texto está lleno de basura de formato (como saltos de línea donde no tocan, menciones de "Se puntúa 0", "Incorrecta", "Sin contestar", etc.).
                    
                    Tu trabajo es limpiar analíticamente este texto y devolverme un array con las preguntas perfectas.
                    Ignora absolutamente todo el texto que no pertenezca estrictamente al enunciado de una pregunta o a sus respuestas.
                    Si el formato carece de algunas opciones C o D, utiliza el carácter '-' como placeholder literal.
                    Identifica cuál es la respuesta correcta usando la pista de Moodle, y mapea la correcta traduciéndolo a su índice numérico exacto (0-3).
                    
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
