"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    Trophy,
    Target,
    Flame,
    CheckCircle2,
    AlertTriangle,
    Circle,
    Loader2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { getGlobalStats, getProgressBySubject, type SubjectProgress } from "@/actions/progress";

// --- Activity Heatmap Component ---
function ActivityHeatmap({ heatmap }: { heatmap: Record<string, number> }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 365 days of cells
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        days.push({
            date: key,
            count: heatmap[key] || 0,
            dayOfWeek: d.getDay(),
        });
    }

    // Group by weeks (columns)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];
    days.forEach((day, idx) => {
        currentWeek.push(day);
        if (day.dayOfWeek === 6 || idx === days.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    const getColor = (count: number) => {
        if (count === 0) return "bg-gray-100";
        if (count === 1) return "bg-emerald-200";
        if (count <= 3) return "bg-emerald-400";
        if (count <= 5) return "bg-emerald-500";
        return "bg-emerald-600";
    };

    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                Actividad de Estudio
            </h3>
            <div className="overflow-x-auto">
                <div className="flex gap-[3px] min-w-[720px]">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] mr-1 shrink-0">
                        <div className="h-[11px]"></div>
                        {["", "Lun", "", "Mié", "", "Vie", ""].map((label, i) => (
                            <div key={i} className="h-[11px] flex items-center">
                                <span className="text-[8px] text-gray-400 font-medium leading-none">{label}</span>
                            </div>
                        ))}
                    </div>

                    {weeks.map((week, wi) => {
                        // Show month label on first week of each month
                        const firstDay = week[0];
                        const d = new Date(firstDay.date);
                        const showMonth = wi === 0 || d.getDate() <= 7;

                        return (
                            <div key={wi} className="flex flex-col gap-[3px]">
                                <div className="h-[11px] flex items-end">
                                    {showMonth && (
                                        <span className="text-[8px] text-gray-400 font-medium leading-none">
                                            {monthLabels[d.getMonth()]}
                                        </span>
                                    )}
                                </div>
                                {/* Pad the first week if it doesn't start on Sunday */}
                                {wi === 0 && week[0].dayOfWeek > 0 && (
                                    Array.from({ length: week[0].dayOfWeek }).map((_, pi) => (
                                        <div key={`pad-${pi}`} className="w-[11px] h-[11px]" />
                                    ))
                                )}
                                {week.map((day) => (
                                    <div
                                        key={day.date}
                                        className={`w-[11px] h-[11px] rounded-[2px] ${getColor(day.count)} transition-colors`}
                                        title={`${day.date}: ${day.count} test${day.count !== 1 ? "s" : ""}`}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[9px] text-gray-400 font-medium">Menos</span>
                <div className="w-[11px] h-[11px] rounded-[2px] bg-gray-100" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-200" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-600" />
                <span className="text-[9px] text-gray-400 font-medium">Más</span>
            </div>
        </div>
    );
}

// --- Stats Card ---
function StatCard({ icon: Icon, label, value, subtext, color }: { icon: any; label: string; value: string | number; subtext?: string; color: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
                {subtext && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtext}</p>}
            </div>
        </div>
    );
}

// --- Topic Status Badge ---
function TopicStatusBadge({ status, bestScore }: { status: string; bestScore: number }) {
    if (status === "passed") {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" />
                {Math.round(bestScore)}%
            </span>
        );
    }
    if (status === "failed") {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                <AlertTriangle className="w-3 h-3" />
                {Math.round(bestScore)}%
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
            <Circle className="w-3 h-3" />
            Pendiente
        </span>
    );
}

// --- Main Dashboard ---
export default function ProgressDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [progress, setProgress] = useState<SubjectProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [statsRes, progressRes] = await Promise.all([
                getGlobalStats(),
                getProgressBySubject(),
            ]);
            if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
            if (progressRes.success && progressRes.progress) setProgress(progressRes.progress);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                <span className="text-sm font-medium">Cargando tu progreso...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mi Progreso</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Seguimiento completo de tu rendimiento y actividad de estudio.</p>
                </div>
            </div>

            {/* Stats Cards Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Target}
                        label="Tests completados"
                        value={stats.totalAttempts}
                        subtext="Total de intentos realizados"
                        color="bg-indigo-50 text-indigo-600"
                    />
                    <StatCard
                        icon={Trophy}
                        label="Nota media"
                        value={`${stats.avgScore}%`}
                        subtext="Media de mejores notas"
                        color="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Temas dominados"
                        value={`${stats.passedCount} / ${stats.totalTopics}`}
                        subtext="Con nota ≥ 50%"
                        color="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                        icon={Flame}
                        label="Racha de estudio"
                        value={`${stats.streak} día${stats.streak !== 1 ? "s" : ""}`}
                        subtext="Días consecutivos estudiando"
                        color="bg-rose-50 text-rose-600"
                    />
                </div>
            )}

            {/* Activity Heatmap */}
            {stats?.heatmap && <ActivityHeatmap heatmap={stats.heatmap} />}

            {/* Subject Breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    Desglose por Asignatura
                </h3>

                {progress.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-400">No hay datos de progreso todavía. ¡Completa tu primer test!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {progress.map((sp) => {
                            const isExpanded = expandedSubject === sp.subject;
                            const progressPct = sp.totalTopics > 0 ? Math.round((sp.passedTopics / sp.totalTopics) * 100) : 0;

                            return (
                                <div key={sp.subject} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSubject(isExpanded ? null : sp.subject)}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{sp.subject}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden max-w-[200px]">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 shrink-0">
                                                    {sp.passedTopics}/{sp.totalTopics} temas · {sp.totalAttempts} intentos
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-sm font-black ${sp.overallBestScore >= 50 ? "text-emerald-600" : sp.totalAttempts > 0 ? "text-amber-600" : "text-gray-300"}`}>
                                                {sp.totalAttempts > 0 ? `${Math.round(sp.overallBestScore)}%` : "—"}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                            {sp.topics.map((tp) => (
                                                <div key={tp.topic || "__all__"} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{tp.topic || "Todo el temario"}</p>
                                                        {tp.attempts > 0 && (
                                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                                {tp.attempts} intento{tp.attempts !== 1 ? "s" : ""} · Última: {tp.lastAttemptAt ? new Date(tp.lastAttemptAt).toLocaleDateString("es-ES") : "—"}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <TopicStatusBadge status={tp.status} bestScore={tp.bestScore} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
