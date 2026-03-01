"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";
import { revalidatePath } from "next/cache";

/**
 * Gets all subjects belonging to the current ADMIN and their shared status.
 */
export async function getAdminSubjectsWithShareStatus() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const adminId = session.user.id;

        // 1. Get all unique subjects this admin has questions for
        const rawSubjects = await prisma.question.findMany({
            where: { userId: adminId },
            select: { subject: true },
            distinct: ["subject"],
        });

        // 2. Get the currently shared subjects by this admin
        const shared = await prisma.sharedSubject.findMany({
            where: { adminId },
        });

        const sharedSet = new Set(shared.map(s => s.subject));

        const result = rawSubjects.map(r => ({
            name: r.subject,
            isShared: sharedSet.has(r.subject)
        })).sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, subjects: result };
    } catch (error) {
        return { success: false, error: "Failed to fetch subjects" };
    }
}

/**
 * Toggles a subject's shared status for the current ADMIN.
 */
export async function toggleSubjectShare(subject: string, isShared: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            throw new Error("Unauthorized");
        }

        const adminId = session.user.id;

        if (isShared) {
            // Check if already exists to avoid unique constraint errors
            const existing = await prisma.sharedSubject.findUnique({
                where: {
                    subject_adminId: {
                        subject,
                        adminId
                    }
                }
            });

            if (!existing) {
                await prisma.sharedSubject.create({
                    data: { subject, adminId }
                });
            }
        } else {
            await prisma.sharedSubject.deleteMany({
                where: { subject, adminId }
            });
        }

        revalidatePath("/admin/share");
        revalidatePath("/public-bank");
        return { success: true };
    } catch (error) {
        console.error("Toggle error: ", error);
        return { success: false, error: "Failed to toggle subject share status." };
    }
}
