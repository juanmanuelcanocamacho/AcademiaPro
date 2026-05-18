"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function uploadTheory(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        // Check permissions: admin always can, student only if allowed
        if (session.user.role !== "ADMIN") {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
            if (!settings?.allowStudentTheory) {
                return { success: false, error: "No tienes permiso para subir teoría" };
            }
        }

        const files = formData.getAll("files") as File[];
        const subject = formData.get("subject") as string;
        const singleTopic = formData.get("topic") as string;

        if (!files || files.length === 0 || !subject) {
            return { success: false, error: "Faltan datos: archivos y asignatura son obligatorios" };
        }

        let totalChars = 0;
        const uploadResults: { fileName: string; success: boolean; error?: string }[] = [];

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const data = await pdfParse(buffer);
                const content = data.text;

                if (!content || content.trim().length < 50) {
                    uploadResults.push({
                        fileName: file.name,
                        success: false,
                        error: "Texto insuficiente en el PDF."
                    });
                    continue;
                }

                // If multiple files are uploaded, use the file's name (without extension) as topic.
                // If single file, use the custom topic inputted by the user if present, otherwise file's name.
                const topic = files.length === 1 && singleTopic?.trim()
                    ? singleTopic.trim()
                    : file.name.replace(/\.pdf$/i, "").trim();

                await prisma.theoryDocument.create({
                    data: {
                        subject,
                        topic: topic || null,
                        fileName: file.name,
                        content,
                        userId: session.user.id,
                    },
                });

                totalChars += content.length;
                uploadResults.push({ fileName: file.name, success: true });
            } catch (fileErr) {
                console.error(`Error processing file ${file.name}:`, fileErr);
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error: "Error al analizar el archivo PDF."
                });
            }
        }

        const successCount = uploadResults.filter(r => r.success).length;
        if (successCount === 0) {
            return { success: false, error: "No se pudo extraer texto válido de ningún archivo PDF subido." };
        }

        return { 
            success: true, 
            count: successCount, 
            total: files.length,
            chars: totalChars,
            results: uploadResults 
        };
    } catch (error) {
        console.error("Error uploading theory:", error);
        return { success: false, error: "Error al procesar la teoría." };
    }
}

export async function getTheoryDocuments(subject?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, documents: [] };

        const where: any = {};

        if (session.user.role === "ADMIN") {
            // Admin sees their own theory
            where.userId = session.user.id;
            if (subject) where.subject = subject;
        } else {
            // Students see theory shared by admins (whose subjects are shared) + their own
            if (subject) where.subject = subject;
            where.OR = [
                { userId: session.user.id },
                {
                    user: { role: "ADMIN" },
                    subject: {
                        in: (await prisma.sharedSubject.findMany({
                            select: { subject: true }
                        })).map(s => s.subject)
                    }
                }
            ];
        }

        const documents = await prisma.theoryDocument.findMany({
            where,
            select: {
                id: true,
                subject: true,
                topic: true,
                fileName: true,
                userId: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return { success: true, documents };
    } catch (error) {
        console.error("Error fetching theory documents:", error);
        return { success: false, documents: [] };
    }
}

export async function deleteTheoryDocument(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const doc = await prisma.theoryDocument.findUnique({ where: { id } });
        if (!doc) return { success: false, error: "Documento no encontrado" };

        // Only the owner can delete
        if (doc.userId !== session.user.id) {
            return { success: false, error: "No puedes eliminar documentos de otros usuarios" };
        }

        await prisma.theoryDocument.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting theory document:", error);
        return { success: false, error: "Error al eliminar el documento." };
    }
}

/**
 * Gets the theory content for a subject (used by AI chat).
 * Students can access admin-shared theory + their own.
 */
export async function getTheoryContent(subject: string, topic?: string): Promise<string> {
    try {
        const session = await auth();
        if (!session?.user?.id) return "";

        const where: any = { subject };

        if (session.user.role === "ADMIN") {
            where.userId = session.user.id;
        } else {
            where.OR = [
                { userId: session.user.id },
                { user: { role: "ADMIN" } }
            ];
        }

        // If a specific topic (unit) is provided, try filtering by it first
        if (topic) {
            const topicWhere = { ...where, topic };
            const docs = await prisma.theoryDocument.findMany({
                where: topicWhere,
                select: { content: true, fileName: true, topic: true },
                orderBy: { createdAt: "asc" },
            });
            if (docs.length > 0) {
                return docs.map(d => `--- ${d.fileName} ${d.topic ? `(Unidad: ${d.topic})` : ''} ---\n${d.content}`).join("\n\n");
            }
        }

        // Fallback: get all theory docs for this subject
        const docs = await prisma.theoryDocument.findMany({
            where,
            select: { content: true, fileName: true, topic: true },
            orderBy: { createdAt: "asc" },
        });

        if (docs.length === 0) return "";

        return docs.map(d => `--- ${d.fileName} ${d.topic ? `(Unidad: ${d.topic})` : ''} ---\n${d.content}`).join("\n\n");
    } catch (error) {
        console.error("Error fetching theory content:", error);
        return "";
    }
}
