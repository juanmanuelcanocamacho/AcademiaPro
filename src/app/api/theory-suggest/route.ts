import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTheoryContent } from "@/actions/theory";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { subject, currentQuestion } = await req.json();

        if (!subject || !currentQuestion) {
            return Response.json({ suggestions: [] });
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
            return Response.json({ suggestions: [] });
        }

        // Use only the first 50k chars for suggestions to keep it fast
        const snippet = theoryContent.substring(0, 50000);

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
                suggestions: z.array(z.string()).describe("3 preguntas cortas y útiles que el estudiante podría hacer sobre la teoría relacionada con la pregunta del examen.")
            }),
            prompt: `Dado que el estudiante está respondiendo esta pregunta de examen de la asignatura "${subject}":
"${currentQuestion}"

Y esta es parte de la teoría disponible:
${snippet.substring(0, 10000)}

Genera exactamente 3 preguntas cortas (máximo 10 palabras cada una) que el estudiante podría querer consultar para entender mejor el tema de la pregunta. Las preguntas deben ser en español y estar directamente relacionadas con el contenido teórico.`,
        });

        return Response.json(object);
    } catch (error) {
        console.error("Theory suggest error:", error);
        return Response.json({ suggestions: [] });
    }
}
