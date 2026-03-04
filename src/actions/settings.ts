"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    let settings = await prisma.systemSettings.findUnique({
        where: { id: 1 }
    });

    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: {
                id: 1,
                allowPublicBank: true,
                allowStudentImport: false
            }
        });
    }

    return settings;
}

export async function updateSystemSettings(data: { allowPublicBank?: boolean, allowStudentImport?: boolean }) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return { success: false, error: "No autorizado" };
    }

    try {
        await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: {
                id: 1,
                allowPublicBank: data.allowPublicBank ?? true,
                allowStudentImport: data.allowStudentImport ?? false
            }
        });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, error: "Error al actualizar los ajustes" };
    }
}
