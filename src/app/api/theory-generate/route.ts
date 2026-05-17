import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTheoryContent } from "@/actions/theory";
import { z } from "zod";

const questionSchema = z.object({
    questions: z.array(z.object({
        statement: z.string().describe("Enunciado de la pregunta tipo test"),
        optionA: z.string().describe("Opción A"),
        optionB: z.string().describe("Opción B"),
        optionC: z.string().describe("Opción C"),
        optionD: z.string().describe("Opción D"),
        correctOption: z.number().min(0).max(3).describe("Índice de la respuesta correcta: 0=A, 1=B, 2=C, 3=D"),
    })).describe("Array de preguntas tipo test generadas")
});

export async function POST(req: Request) {
    try {
        const { subject, topic, count = 10 } = await req.json();

        if (!subject) {
            return Response.json({ success: false, error: "Asignatura requerida" }, { status: 400 });
        }

        const theoryContent = await getTheoryContent(subject, topic);

        if (!theoryContent || theoryContent.trim().length < 100) {
            return Response.json({
                success: false,
                error: "No hay suficiente teoría disponible para esta asignatura/unidad. Sube primero un PDF de teoría."
            }, { status: 400 });
        }

        // Truncate theory to fit within context window
        const maxChars = 80000;
        const truncatedTheory = theoryContent.length > maxChars
            ? theoryContent.substring(0, maxChars) + "\n\n[... contenido truncado por longitud ...]"
            : theoryContent;

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: questionSchema,
            prompt: `Eres un profesor experto creando exámenes tipo test. A partir del siguiente material teórico de la asignatura "${subject}"${topic ? ` (Unidad: ${topic})` : ""}, genera exactamente ${count} preguntas tipo test de calidad profesional.

REGLAS:
1. Cada pregunta debe tener exactamente 4 opciones (A, B, C, D) y una sola respuesta correcta.
2. Las preguntas deben cubrir diferentes aspectos y niveles de dificultad del material.
3. Evita preguntas triviales o demasiado obvias. Incluye preguntas de comprensión, aplicación y análisis.
4. Las opciones incorrectas deben ser plausibles y estar relacionadas con el tema (no absurdas).
5. Varía la posición de la respuesta correcta (no siempre la A o la D).
6. Los enunciados deben ser claros, precisos y en español.
7. No repitas conceptos entre preguntas.
8. Basa TODAS las preguntas estrictamente en el contenido teórico proporcionado.

MATERIAL TEÓRICO:
${truncatedTheory}`,
        });

        return Response.json({
            success: true,
            questions: object.questions,
            count: object.questions.length,
        });
    } catch (error) {
        console.error("Theory generate error:", error);
        return Response.json({
            success: false,
            error: "Error al generar las preguntas. Inténtalo de nuevo."
        }, { status: 500 });
    }
}
