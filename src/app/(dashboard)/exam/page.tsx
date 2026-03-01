import { getSubjects } from "@/actions/exam";
import ExamModeSelector from "@/components/ExamModeSelector";
import { LayoutGrid } from "lucide-react";

export default async function ExamIndexPage() {
    const { subjectsWithTopics = [] } = await getSubjects();

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-8">
                <LayoutGrid className="w-6 h-6 text-gray-400" />
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Asignaturas</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Elige una asignatura y el modo de realización.</p>
                </div>
            </div>

            <ExamModeSelector subjectsWithTopics={subjectsWithTopics} />
        </div>
    );
}
