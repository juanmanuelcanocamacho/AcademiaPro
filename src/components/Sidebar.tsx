"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    BookOpen,
    GraduationCap,
    Settings,
    Upload,
    Plus,
    Database,
    LogOut,
    DownloadCloud,
    Share2,
    Menu,
    X
} from "lucide-react";
import { logout } from "@/actions/auth";
import { useTransition } from "react";
import type { Session } from "next-auth";

export default function Sidebar({ session, settings }: { session: Session | null, settings?: any }) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const userRole = session?.user?.role || "STUDENT";

    // Cierra el menú al navegar en móvil
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Evita el scroll del body cuando el menú móvil está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

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
        <>
            {/* Mobile Header */}
            <div className="md:hidden w-full bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-sm">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-gray-900 text-lg tracking-tight">Testly</span>
                </Link>
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors active:bg-gray-200"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-gray-900/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] shrink-0 w-[280px] md:w-60 bg-white border-r border-gray-100 flex flex-col z-50 select-none transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between min-h-[72px] md:min-h-0">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-black text-gray-900 text-base tracking-tight leading-none">Testly</span>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Estudia con Testly</p>
                        </div>
                    </Link>
                    
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="md:hidden p-2 -mr-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-5 px-4 flex flex-col gap-6 scrollbar-thin">
                    {navItems.map((group) => {
                        const filteredLinks = group.links.filter((item) => !item.roles || item.roles.includes(userRole));

                        if (filteredLinks.length === 0) return null;

                        return (
                            <div key={group.section}>
                                <p className="px-2 mb-2 text-[10px] font-bold text-gray-400/80 uppercase tracking-widest">
                                    {group.section}
                                </p>
                                <div className="flex flex-col gap-1">
                                    {filteredLinks.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive(item.href)
                                                ? "bg-indigo-50/80 text-indigo-700 shadow-sm shadow-indigo-100/50"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive(item.href) ? "text-indigo-600" : "text-gray-400"}`} />
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
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                        <div className="flex items-center gap-3 px-2 py-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700 shrink-0 uppercase border border-indigo-200/50 shadow-sm">
                                {session.user.name?.[0] || session.user.email?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-gray-800 truncate leading-tight mb-0.5">{session.user.name || session.user.email}</p>
                                <p className="text-[10px] text-gray-500 font-medium truncate">{session.user.role === "ADMIN" ? "Administrador" : "Estudiante"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => startTransition(() => logout())}
                            disabled={isPending}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent transition-all text-left text-gray-500 font-bold group"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-rose-50 flex items-center justify-center shrink-0 transition-colors">
                                <LogOut className="w-3.5 h-3.5 group-hover:text-rose-600 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs truncate group-hover:text-rose-600 transition-colors">Cerrar sesión</p>
                            </div>
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
