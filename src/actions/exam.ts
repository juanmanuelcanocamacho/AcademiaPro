"use server";

import prisma from "@/lib/prisma";

export async function getSubjects() {
    try {
        const subjects = await prisma.question.findMany({
            select: { subject: true },
            distinct: ["subject"],
        });

        return {
            success: true,
            subjects: subjects.map((s) => s.subject).sort(),
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch subjects" };
    }
}

export async function generateExamBySubject(subject: string, limit: number = 20, randomQ: boolean = true) {
    try {
        const questions = await prisma.question.findMany({
            where: { subject },
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
