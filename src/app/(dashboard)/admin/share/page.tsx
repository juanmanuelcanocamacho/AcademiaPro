import { getAdminSubjectsWithShareStatus } from "@/actions/admin-share";
import { Share2, Globe, Lock } from "lucide-react";
import ShareSubjectToggle from "./ShareSubjectToggle";

export const metadata = {
    title: "Compartir Asignaturas",
};

export default async function AdminSharePage() {
    const res = await getAdminSubjectsWithShareStatus();
    const subjects = res.subjects || [];

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Share2 className="w-6 h-6 text-indigo-600" /> Compartir Asignaturas
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Controla qué asignaturas de tu banco privado quieres hacer públicas en el Banco Oficial para que los estudiantes puedan clonarlas.
                    </p>
                </div>
            </div>

            <div className="bg-white border md:border-t-4 border-t-indigo-500 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {subjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Todavía no tienes preguntas creadas o importadas en ninguna asignatura.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {subjects.map((s) => (
                            <div key={s.name} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${s.isShared ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {s.isShared ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-bold text-base">{s.name}</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">
                                            {s.isShared
                                                ? "Disponible en el Banco Oficial para todos los estudiantes."
                                                : "Privada. Solo tú puedes ver y examinarte de estas preguntas."}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-4 shrink-0">
                                    <ShareSubjectToggle subject={s.name} initialIsShared={s.isShared} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
