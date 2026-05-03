"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpen,
    GraduationCap,
    LayoutGrid,
    Settings,
    ChevronDown,
    Upload,
    Plus,
    Database,
    ClipboardList,
    LogOut,
    DownloadCloud,
    Share2
} from "lucide-react";
import { logout } from "@/actions/auth";
import { useTransition } from "react";
import type { Session } from "next-auth";

export default function Sidebar({ session, settings }: { session: Session | null, settings?: any }) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const userRole = session?.user?.role || "STUDENT";

    const navItems = [
        {
            section: "Estudiante",
            links: [
                { name: "Asignaturas", icon: BookOpen, href: "/exam", roles: ["STUDENT", "ADMIN"] },
                ...(settings?.allowPublicBank !== false ? [{ name: "Banco Oficial (Copiar)", icon: DownloadCloud, href: "/public-bank", roles: ["STUDENT"] }] : []),
                ...(settings?.allowStudentImport === true ? [{ name: "Añadir / Importar", icon: Plus, href: "/admin/import", roles: ["STUDENT"] }] : []),
            ],
        },
        {
            section: "Administración",
            links: [
                { name: "Banco de Preguntas", icon: Database, href: "/admin", roles: ["ADMIN"] },
                { name: "Añadir / Importar", icon: Plus, href: "/admin/import", roles: ["ADMIN"] },
                { name: "Compartir Asignaturas", icon: Share2, href: "/admin/share", roles: ["ADMIN"] },
                { name: "Ajustes Globales", icon: Settings, href: "/admin/settings", roles: ["ADMIN"] },
            ],
        },
    ];



    const isActive = (href: string) => {
        if (href === "/exam") return pathname.startsWith("/exam");
        if (href === "/admin") return pathname === "/admin";
        if (href === "/admin/import") return pathname.startsWith("/admin/import") || pathname.startsWith("/admin/new");
        if (href === "/admin/share") return pathname.startsWith("/admin/share");
        if (href === "/admin/settings") return pathname.startsWith("/admin/settings");
        return pathname.startsWith(href);
    };

    return (
        <aside className="sticky top-0 h-screen shrink-0 w-60 bg-white border-r border-gray-100 flex flex-col z-50 select-none">
            {/* Logo */}
            <Link href="/" className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <span className="font-black text-gray-900 text-base tracking-tight leading-none">Testly</span>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Estudia con Testly</p>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
                {navItems.map((group) => {
                    const filteredLinks = group.links.filter((item) => !item.roles || item.roles.includes(userRole));

                    if (filteredLinks.length === 0) return null;

                    return (
                        <div key={group.section}>
                            <p className="px-2 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {group.section}
                            </p>
                            <div className="flex flex-col gap-0.5">
                                {filteredLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive(item.href)
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 shrink-0 ${isActive(item.href) ? "text-indigo-600" : ""}`} />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User footer */}
            {session?.user && (
                <div className="p-3 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700 shrink-0 uppercase">
                            {session.user.name?.[0] || session.user.email?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{session.user.name || session.user.email}</p>
                            <p className="text-[10px] text-gray-400 truncate">{session.user.role === "ADMIN" ? "Administrador" : "Estudiante"}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => startTransition(() => logout())}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors text-left text-gray-500 font-medium group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">Cerrar sesión</p>
                        </div>
                    </button>
                </div>
            )}
        </aside>
    );
}
