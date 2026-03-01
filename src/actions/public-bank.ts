"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";
import { revalidatePath } from "next/cache";

/**
 * Gets questions that belong to ANY ADMIN user.
 */
export async function getPublicBankQuestions(page: number = 1, limit: number = 50, search?: string, subject?: string, topic?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const sharedSubjects = await prisma.sharedSubject.findMany({
            select: { subject: true, adminId: true }
        });

        if (sharedSubjects.length === 0) {
            return { success: true, questions: [], total: 0, totalPages: 0 };
        }

        const orFilters = sharedSubjects.map(s => ({
            subject: s.subject,
            userId: s.adminId
        }));

        const baseWhere = { OR: orFilters };
        const additionalFilters: any[] = [];

        if (search) additionalFilters.push({ statement: { contains: search } });
        if (subject) additionalFilters.push({ subject });
        if (topic) additionalFilters.push({ topic });

        const finalWhere = additionalFilters.length > 0
            ? { AND: [baseWhere, ...additionalFilters] }
            : baseWhere;

        const questions = await prisma.question.findMany({
            where: finalWhere,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.question.count({ where: finalWhere });

        return {
            success: true,
            questions,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        return { success: false, error: "Error fetch public queries" };
    }
}

/**
 * Gets stats for questions that belong to ANY ADMIN user.
 */
export async function getPublicSubjectStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const sharedSubjects = await prisma.sharedSubject.findMany({
            select: { subject: true, adminId: true }
        });

        if (sharedSubjects.length === 0) {
            return { success: true, stats: [] };
        }

        const orFilters = sharedSubjects.map(s => ({
            subject: s.subject,
            userId: s.adminId
        }));

        const stats = await prisma.question.groupBy({
            by: ['subject'],
            where: { OR: orFilters },
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
        return { success: false, error: "Failed to fetch public stats" };
    }
}

/**
 * Copies all questions from the specified subjects from the ADMIN to the current user.
 */
export async function cloneSubjectsToUser(subjects: string[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        if (!subjects || subjects.length === 0) {
            return { success: false, error: "No subjects selected." };
        }

        // 1. Verify these subjects are actually shared by admins
        const sharedSubjects = await prisma.sharedSubject.findMany({
            where: { subject: { in: subjects } },
            select: { subject: true, adminId: true }
        });

        if (sharedSubjects.length === 0) {
            return { success: false, error: "None of the selected subjects are currently public." };
        }

        const validSubjects = sharedSubjects.map(s => s.subject);

        // 2. Fetch the exact source questions for those subjects
        const questionsToClone = await prisma.question.findMany({
            where: {
                subject: { in: validSubjects },
                user: { role: "ADMIN" }
            }
        });

        if (questionsToClone.length === 0) {
            return { success: false, error: "No questions found in the selected subjects." };
        }

        // 3. Prevent duplicate cloning by checking what the user already has
        // We look at the unique combination of statement + subject for this user
        // (This prevents the student from clicking "clone" twice and doubling their questions)
        const myExistingQuestions = await prisma.question.findMany({
            where: {
                userId: session.user.id,
                subject: { in: validSubjects }
            },
            select: { statement: true }
        });

        const myExistingStatements = new Set(myExistingQuestions.map(q => q.statement));

        // Filter out questions the user already cloned
        const newQuestionsToClone = questionsToClone.filter(q => !myExistingStatements.has(q.statement));

        if (newQuestionsToClone.length === 0) {
            return { success: false, error: "These subjects are already fully imported into your profile." };
        }

        // 4. Strip IDs and assign the current user's ID
        const clonedData = newQuestionsToClone.map(({ id, createdAt, updatedAt, ...rest }) => ({
            ...rest,
            userId: session.user.id
        }));

        // 5. Insert them
        await prisma.question.createMany({
            data: clonedData
        });

        revalidatePath("/public-bank");
        revalidatePath("/admin"); // Revalidate admin in case they are viewing their cloned list

        return { success: true, count: clonedData.length };
    } catch (error) {
        console.error("Clone error: ", error);
        return { success: false, error: "Failed to clone subjects" };
    }
}
