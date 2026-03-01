import { getQuestions, getSubjectStats } from "@/actions/question";
import QuestionList from "@/components/QuestionList";
import Link from "next/link";
import { Plus, Upload, Database, BookOpen, Search, Filter } from "lucide-react";

export const metadata = {
    title: "Panel de Administración",
};

export default async function AdminPage(
    props: {
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
) {
    const searchParams = await props.searchParams;
    const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const subject = typeof searchParams.subject === 'string' ? searchParams.subject : undefined;

    const [questionsRes, statsRes] = await Promise.all([
        getQuestions(page, 1000, search, subject),
        getSubjectStats()
    ]);

    const { questions = [], totalPages = 1, total = 0 } = questionsRes;
    const stats = statsRes.stats || [];
    const uniqueSubjects = stats.length;
    const totalQuestionsGlobal = stats.reduce((acc, curr) => acc + ((curr._count as any).id || 0), 0);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Administración</h1>
                    <p className="text-gray-400 text-sm mt-1">Gestiona el banco de preguntas y asignaturas.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/import"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 transition shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir o Importar
                    </Link>
                </div>
            </div>

            {/* Metrics & Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Preguntas</p>
                            <p className="text-2xl font-black text-gray-900">{totalQuestionsGlobal}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
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
                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Distribución Base de Datos</p>
                    <div className="flex gap-1 h-8 items-end">
                        {stats.slice(0, 10).map((s, i) => {
                            const max = (stats[0]?._count as any)?.id || 1;
                            const count = (s._count as any).id || 0;
                            const height = Math.max((count / max) * 100, 10);
                            return (
                                <div key={s.subject} title={`${s.subject}: ${count}`} className="flex-1 bg-indigo-100 hover:bg-indigo-500 rounded-t-sm transition-all cursor-crosshair group relative" style={{ height: `${height}%` }}>
                                    <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-10 pointer-events-none">
                                        {s.subject}: {count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form method="GET" className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col sm:flex-row gap-2 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Buscar preguntas por texto..."
                        className="w-full pl-11 pr-4 py-2 bg-gray-50 hover:bg-gray-100 border border-transparent focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-lg outline-none transition text-sm font-medium"
                    />
                </div>
                <div className="relative w-full sm:w-64 shrink-0">
                    <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select
                        name="subject"
                        defaultValue={subject || ""}
                        className="w-full pl-11 pr-8 py-2 bg-gray-50 hover:bg-gray-100 border border-transparent focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-lg outline-none transition text-sm font-medium appearance-none cursor-pointer"
                    >
                        <option value="">Todas las asignaturas</option>
                        {stats.map(s => <option key={s.subject} value={s.subject}>{s.subject} ({(s._count as any).id || 0})</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-gray-900 hover:bg-indigo-600 text-white font-bold rounded-lg text-sm transition">
                    Filtrar
                </button>
            </form>

            {/* Questions list */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-700">Banco de Preguntas</h2>
                    <div className="flex gap-2 text-sm text-gray-500">
                        {page > 1 && (
                            <Link href={`/admin?page=${page - 1}`} className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                Anterior
                            </Link>
                        )}
                        <span className="px-3 py-1 bg-gray-50 border border-transparent rounded-lg font-medium">Página {page} de {Math.max(1, totalPages)}</span>
                        {page < totalPages && (
                            <Link href={`/admin?page=${page + 1}`} className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                Siguiente
                            </Link>
                        )}
                    </div>
                </div>
                <QuestionList questions={questions} />
            </div>
        </div>
    );
}
