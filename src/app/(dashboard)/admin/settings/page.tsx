import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { getSystemSettings } from "@/actions/settings";
import SettingsForm from "./SettingsForm";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    // Extra security: Only Admin
    if (session?.user?.role !== "ADMIN") {
        redirect("/exam");
    }

    const settings = await getSystemSettings();

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <header className="mb-8">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                    <Settings className="w-6 h-6" />
                    <span className="font-bold tracking-widest text-sm uppercase">Administración</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                    Ajustes Globales
                </h1>
                <p className="text-gray-500 text-lg mt-2 font-medium max-w-2xl">
                    Gestiona los permisos y funcionalidades disponibles para los estudiantes en toda la plataforma Testly.
                </p>
            </header>

            <SettingsForm initialSettings={settings} />
        </div>
    );
}
