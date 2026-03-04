import { getPublicSubjectStats } from "@/actions/public-bank";
import PublicSubjectList from "@/components/PublicSubjectList";
import { Database, BookOpen } from "lucide-react";
import { auth } from "@/../auth";
import { getSystemSettings } from "@/actions/settings";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Banco Maestro Oficial",
};

export default async function PublicBankPage(
    props: {
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const settings = await getSystemSettings();

    if (session?.user?.role !== "ADMIN" && !settings.allowPublicBank) {
        redirect("/exam");
    }

    const statsRes = await getPublicSubjectStats();

    const stats = statsRes.stats || [];
    const uniqueSubjects = stats.length;
    const totalQuestionsGlobal = stats.reduce((acc, curr) => acc + ((curr._count as any).id || 0), 0);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Banco Maestro Oficial</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Explora las preguntas verificadas por los profesores y clónalas a tu perfil personal para crear exámenes a medida.
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Oficiales</p>
                            <p className="text-2xl font-black text-gray-900">{totalQuestionsGlobal}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asignaturas</p>
                            <p className="text-2xl font-black text-gray-900">{uniqueSubjects}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Grid */}
            <div className="pt-4">
                <PublicSubjectList subjects={stats} />
            </div>
        </div>
    );
}
