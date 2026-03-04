"use server";

import { signIn, signOut } from "@/../auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    adminSecret: z.string().optional(),
});

export async function login(data: any) {
    try {
        await signIn("credentials", {
            ...data,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciales inválidas" };
                default:
                    return { error: "Algo salió mal" };
            }
        }
        throw error;
    }
}

export async function register(data: any) {
    try {
        const validatedFields = RegisterSchema.safeParse(data);

        if (!validatedFields.success) {
            return { error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { name, email, password, adminSecret } = validatedFields.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: "El email ya está en uso" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check secret code for Admin role
        const ADMIN_SECRET = process.env.ADMIN_SECRET_CODE || "Testly2026";
        const role = adminSecret === ADMIN_SECRET ? "ADMIN" : "STUDENT";

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error("REGISTER ERROR:", error);
        return { error: `Error interno al registrar: ${error?.message || "Desconocido"}` };
    }
}

export async function logout() {
    await signOut();
}
