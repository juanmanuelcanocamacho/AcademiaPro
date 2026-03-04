import type { NextAuthConfig } from "next-auth";

export default {
    providers: [],
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
