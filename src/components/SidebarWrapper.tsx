"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, GraduationCap } from "lucide-react";
import type { Session } from "next-auth";

export default function SidebarWrapper({ session, settings }: { session: Session | null; settings?: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 w-full h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-extrabold text-gray-900 text-sm tracking-tight text-center">Testly</span>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -mr-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Core */}
            <Sidebar session={session} settings={settings} isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
    );
}
