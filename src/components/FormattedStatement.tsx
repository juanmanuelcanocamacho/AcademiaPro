import React from 'react';

interface FormattedStatementProps {
    text: string;
    className?: string;
}

export default function FormattedStatement({ text, className = "" }: FormattedStatementProps) {
    if (!text) return null;

    // Split text by fenced code block boundaries: ```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className={`space-y-2 text-gray-800 leading-relaxed ${className}`}>
            {parts.map((part, index) => {
                if (part.startsWith("```") && part.endsWith("```")) {
                    // Extract language and code content
                    const match = part.match(/^```(\w*)\n([\s\S]*?)```$/);
                    const lang = match ? match[1] : "";
                    const code = match ? match[2].trim() : part.slice(3, -3).trim();

                    return (
                        <div 
                            key={index} 
                            className="my-3 rounded-xl overflow-hidden border border-slate-800 shadow-md font-mono text-xs bg-slate-900 text-slate-100 max-w-full"
                        >
                            <div className="bg-slate-950 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none border-b border-slate-800/80 flex justify-between items-center">
                                <span>{lang || "código"}</span>
                                <span className="text-[9px] opacity-60 font-semibold px-2 py-0.5 bg-slate-800 rounded-md">transcripción ia</span>
                            </div>
                            <pre className="p-4 overflow-x-auto whitespace-pre font-mono leading-relaxed scrollbar-thin">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }

                // Render normal inline styles (bold text) and keep line breaks
                const lines = part.split("\n");
                return (
                    <div key={index} className="space-y-1">
                        {lines.map((line, li) => {
                            if (!line.trim()) return <div key={li} className="h-1.5" />;
                            
                            // Bold parser: **bold**
                            const boldParts = line.split(/(\*\*.*?\*\*)/g);
                            const renderedLine = boldParts.map((bPart, bi) => {
                                if (bPart.startsWith("**") && bPart.endsWith("**")) {
                                    return (
                                        <strong key={bi} className="font-extrabold text-gray-900">
                                            {bPart.slice(2, -2)}
                                        </strong>
                                    );
                                }
                                return bPart;
                            });

                            return (
                                <p key={li} className="leading-snug">
                                    {renderedLine}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
