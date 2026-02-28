"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Question } from "@/types";

export async function getQuestions(page: number = 1, limit: number = 50, search?: string, subject?: string) {
    try {
        const whereClause: any = {};

        if (search) {
            whereClause.statement = { contains: search };
        }
        if (subject) {
            whereClause.subject = subject;
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

export async function createQuestion(data: Omit<Question, "id">) {
    try {
        await prisma.question.create({
            data,
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create question" };
    }
}

export async function deleteQuestion(id: string) {
    try {
        await prisma.question.delete({
            where: { id },
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete question" };
    }
}

export async function updateQuestion(id: string, data: Partial<Omit<Question, "id">>) {
    try {
        await prisma.question.update({
            where: { id },
            data,
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update question" };
    }
}

export async function deleteQuestions(ids: string[]) {
    try {
        await prisma.question.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error deleting questions" };
    }
}

export async function importQuestions(questions: Omit<Question, "id">[]) {
    try {
        await prisma.question.createMany({
            data: questions,
        });
        revalidatePath("/admin");
        return { success: true, count: questions.length };
    } catch (error) {
        return { success: false, error: "Failed to import questions" };
    }
}

export async function getSubjectStats() {
    try {
        const stats = await prisma.question.groupBy({
            by: ['subject'],
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
