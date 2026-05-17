import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTheoryContent } from "@/actions/theory";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { subject, question, currentQuestion } = await req.json();

        if (!subject || !question) {
            return new Response("Missing subject or question", { status: 400 });
        }

        // Try to find the topic/unit of the current question in database
        let topic: string | undefined = undefined;
        if (currentQuestion) {
            const questionRecord = await prisma.question.findFirst({
                where: {
                    statement: currentQuestion,
                    subject
                },
                select: { topic: true }
            });
            if (questionRecord?.topic) {
                topic = questionRecord.topic;
            }
        }

        const theoryContent = await getTheoryContent(subject, topic);

        if (!theoryContent) {
            return new Response(
                "No hay teoría disponible para esta asignatura. Sube PDFs de teoría desde el panel de administración.",
                { status: 200 }
            );
        }

        // Truncate theory if too long (GPT-4o-mini supports 128k tokens ~ 400k chars)
        const maxChars = 300000;
        const truncatedTheory = theoryContent.length > maxChars
            ? theoryContent.substring(0, maxChars) + "\n\n[... contenido truncado por longitud ...]"
            : theoryContent;

        const systemPrompt = `Eres un asistente de estudio experto para la asignatura "${subject}". Tu objetivo es ayudar al estudiante a comprender la teoría y resolver sus dudas sobre las preguntas del examen.

Instrucciones:
1. Explica los conceptos teóricos relacionados con la pregunta de examen del estudiante utilizando la teoría proporcionada a continuación.
2. Ayúdale a razonar la respuesta correcta basándote en la teoría.
3. Si el estudiante dice "no entiendo esta pregunta" o similar, analízale la pregunta y las opciones explicándole los conceptos que aparecen en la teoría.
4. Si la consulta del estudiante no tiene absolutamente ninguna relación con la teoría disponible o la asignatura, indícalo de manera amable.
5. Sé didáctico, claro y conciso. Usa listas y negritas para facilitar la lectura.
6. Responde siempre en español.

TEORÍA DISPONIBLE:
${truncatedTheory}`;

        const userMessage = currentQuestion
            ? `El estudiante está respondiendo esta pregunta de examen: "${currentQuestion}"\n\nSu consulta es: ${question}`
            : question;

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Theory chat error:", error);
        return new Response("Error interno del servidor", { status: 500 });
    }
}
