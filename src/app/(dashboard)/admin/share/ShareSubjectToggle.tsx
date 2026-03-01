"use client";

import { useTransition, useState } from "react";
import { toggleSubjectShare } from "@/actions/admin-share";
import { Loader2 } from "lucide-react";

export default function ShareSubjectToggle({ subject, initialIsShared }: { subject: string, initialIsShared: boolean }) {
    const [isShared, setIsShared] = useState(initialIsShared);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const nextState = !isShared;
        setIsShared(nextState);

        startTransition(async () => {
            const res = await toggleSubjectShare(subject, nextState);
            if (!res.success) {
                // Revert on failure
                setIsShared(!nextState);
                alert("Hubo un error al cambiar el estado de acceso de la asignatura.");
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            role="switch"
            aria-checked={isShared}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${isShared ? 'bg-indigo-500' : 'bg-gray-200'
                } disabled:opacity-50`}
        >
            <span className="sr-only">Compartir {subject}</span>
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${isShared ? 'translate-x-5' : 'translate-x-0'
                    }`}
            >
                {isPending && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
            </span>
        </button>
    );
}
