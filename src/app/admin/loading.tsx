import { Plus, Upload, Database, BookOpen, ChevronRight } from "lucide-react";

export default function LoadingAdminDashboard() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
                    <div className="h-4 w-48 bg-slate-100 rounded"></div>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2.5 bg-slate-100 w-36 h-10 rounded-xl"></div>
                    <div className="px-4 py-2.5 bg-indigo-100 w-40 h-10 rounded-xl"></div>
                </div>
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl"></div>
                    <div>
                        <div className="h-3 w-24 bg-slate-100 rounded mb-2"></div>
                        <div className="h-6 w-12 bg-slate-200 rounded"></div>
                    </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl"></div>
                    <div>
                        <div className="h-3 w-24 bg-slate-100 rounded mb-2"></div>
                        <div className="h-6 w-12 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Questions list Skeleton */}
            <div>
                <div className="h-5 w-40 bg-slate-200 rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-transparent">
                                <div className="flex items-center gap-3">
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-6 w-24 bg-indigo-50 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
