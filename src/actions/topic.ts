"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";

export async function renameTopic(subject: string, oldTopic: string, newTopic: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autorizado" };
        }

        const userId = session.user.id;
        const trimmedOld = oldTopic.trim();
        const trimmedNew = newTopic.trim();

        if (!trimmedNew) {
            return { success: false, error: "El nombre de la unidad no puede estar vacío" };
        }

        if (trimmedOld === trimmedNew) {
            return { success: true };
        }

        // Perform all updates inside a transaction for atomicity and data safety
        await prisma.$transaction(async (tx) => {
            // 1. Update all matching questions
            await tx.question.updateMany({
                where: {
                    subject,
                    topic: trimmedOld,
                    userId
                },
                data: {
                    topic: trimmedNew
                }
            });

            // 2. Update all matching theory documents
            await tx.theoryDocument.updateMany({
                where: {
                    subject,
                    topic: trimmedOld,
                    userId
                },
                data: {
                    topic: trimmedNew
                }
            });

            // 3. Update all matching exam attempts
            await tx.examAttempt.updateMany({
                where: {
                    subject,
                    topic: trimmedOld,
                    userId
                },
                data: {
                    topic: trimmedNew
                }
            });
        });

        // Revalidate cache to reflect changes dynamically
        revalidatePath("/admin");
        revalidatePath("/exam");
        revalidatePath(`/exam/${encodeURIComponent(subject)}`);
        revalidatePath("/progress");

        return { success: true };
    } catch (error: any) {
        console.error("Error renaming topic:", error);
        return { success: false, error: error.message || "Error al renombrar la unidad" };
    }
}
