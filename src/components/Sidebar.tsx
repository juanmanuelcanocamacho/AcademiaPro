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
} from "lucide-react";

const navItems = [
    {
        section: "Estudiante",
        links: [
            { name: "Asignaturas", icon: BookOpen, href: "/exam" },
        ],
    },
    {
        section: "Administración",
        links: [
            { name: "Banco de Preguntas", icon: Database, href: "/admin" },
            { name: "Añadir / Importar", icon: Plus, href: "/admin/import" },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/exam") return pathname.startsWith("/exam");
        if (href === "/admin") return pathname === "/admin";
        if (href === "/admin/import") return pathname.startsWith("/admin/import") || pathname.startsWith("/admin/new");
        return pathname.startsWith(href);
    };

    return (
        <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex flex-col z-50 select-none">
            {/* Logo */}
            <Link href="/" className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <span className="font-black text-gray-900 text-base tracking-tight leading-none">AcademiaPro</span>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Portal del Estudiante</p>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
                {navItems.map((group) => (
                    <div key={group.section}>
                        <p className="px-2 mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {group.section}
                        </p>
                        <div className="flex flex-col gap-0.5">
                            {group.links.map((item) => (
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
                ))}
            </nav>

            {/* User footer */}
            <div className="p-3 border-t border-gray-100">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700 shrink-0">
                        JM
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">Juan Manuel Cano</p>
                        <p className="text-[10px] text-gray-400 truncate">Estudiante</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
            </div>
        </aside>
    );
}
