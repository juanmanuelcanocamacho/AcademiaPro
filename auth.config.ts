import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export default {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (passwordsMatch) {
                    return { id: user.id, email: user.email, name: user.name, role: user.role };
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            // "user" is only passed in the very first time (on sign in)
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;

            const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
            const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
            const isAdminRoute = nextUrl.pathname.startsWith("/admin");
            const isPublicRoute = nextUrl.pathname === "/";

            if (isApiAuthRoute || isPublicRoute) return true;

            if (isAuthRoute) {
                if (isLoggedIn) {
                    const redirectUrl = "/exam";
                    return Response.redirect(new URL(redirectUrl, nextUrl));
                }
                return true; // allow access to login/register for unauthenticated users
            }

            // Protect all other routes
            if (!isLoggedIn) {
                return false; // Redirects to sign-in page, which is /login
            }

            // Both Roles have full access for now per user request. 
            // Future: Premium features will be restricted based on role here.

            return true;
        }
    }
} satisfies NextAuthConfig;
