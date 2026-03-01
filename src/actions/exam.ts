"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";

export async function getSubjects() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const raw = await prisma.question.findMany({
            where: { userId: session.user.id },
            select: { subject: true, topic: true },
            distinct: ["subject", "topic"],
        });

        const map = new Map<string, Set<string>>();
        raw.forEach(r => {
            if (!map.has(r.subject)) map.set(r.subject, new Set());
            if (r.topic) map.get(r.subject)!.add(r.topic);
        });

        const subjectsWithTopics = Array.from(map.entries()).map(([sub, tops]) => ({
            subject: sub,
            topics: Array.from(tops).sort(),
        })).sort((a, b) => a.subject.localeCompare(b.subject));

        return {
            success: true,
            subjects: subjectsWithTopics.map((s) => s.subject), // For backwards compatibility
            subjectsWithTopics,
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch subjects" };
    }
}

export async function generateExamBySubject(subject: string, limit: number = 20, randomQ: boolean = true, topic?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const whereClause: any = { subject, userId: session.user.id };
        if (topic) whereClause.topic = topic;

        const questions = await prisma.question.findMany({
            where: whereClause,
        });

        let selected = questions;

        if (randomQ) {
            // Barajar aleatoriamente usando algoritmo de Fisher-Yates (o sort random simplificado)
            const shuffled = questions.sort(() => 0.5 - Math.random());
            selected = shuffled.slice(0, limit);
        } else {
            // Orden original (por ID o fecha, que es como las devuelve Prisma por defecto, pero explícito limit)
            selected = questions.slice(0, limit);
        }

        // Ocultar la `correctOption` para enviarlo al cliente de forma segura si hacemos la validación en el servidor,
        // pero para este MVP, es más sencillo enviarlo completo, ya que la aplicación calcula la nota en el front
        // Para entornos reales -> nunca enviar correctOption al cliente

        return { success: true, questions: selected };
    } catch (error) {
        return { success: false, error: "Failed to generate exam" };
    }
}
