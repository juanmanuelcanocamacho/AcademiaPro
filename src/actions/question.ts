"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Question } from "@/types";
import { auth } from "@/../auth";

export async function getQuestions(page: number = 1, limit: number = 50, search?: string, subject?: string, topic?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const whereClause: any = { userId: session.user.id };

        if (search) {
            whereClause.statement = { contains: search };
        }
        if (subject) {
            whereClause.subject = subject;
        }
        if (topic) {
            whereClause.topic = topic;
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.question.count({ where: whereClause });

        return {
            success: true,
            questions,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        return { success: false, error: "Error fetch queries" };
    }
}

export async function createQuestion(data: Omit<Question, "id" | "userId">) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        await prisma.question.create({
            data: {
                ...data,
                userId: session.user.id
            },
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create question" };
    }
}

export async function deleteQuestion(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        await prisma.question.deleteMany({
            where: { id, userId: session.user.id },
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete question" };
    }
}

export async function updateQuestion(id: string, data: Partial<Omit<Question, "id" | "userId">>) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const result = await prisma.question.updateMany({
            where: { id, userId: session.user.id },
            data,
        });

        if (result.count === 0) throw new Error("Not found or unauthorized");

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update question" };
    }
}

export async function deleteQuestions(ids: string[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        await prisma.question.deleteMany({
            where: {
                id: { in: ids },
                userId: session.user.id
            }
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error deleting questions" };
    }
}

export async function importQuestions(questions: Omit<Question, "id" | "userId">[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const dataWithUser = questions.map(q => ({
            ...q,
            userId: session.user.id
        }));

        await prisma.question.createMany({
            data: dataWithUser,
        });
        revalidatePath("/admin");
        return { success: true, count: questions.length };
    } catch (error) {
        return { success: false, error: "Failed to import questions" };
    }
}

export async function getSubjectStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const stats = await prisma.question.groupBy({
            by: ['subject'],
            where: { userId: session.user.id },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });
        return { success: true, stats };
    } catch (error) {
        return { success: false, error: "Failed to fetch stats" };
    }
}
