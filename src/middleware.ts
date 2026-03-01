import NextAuth from "next-auth";
import authConfig from "../auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
    // Mathers for which routes to invoke middleware on
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
