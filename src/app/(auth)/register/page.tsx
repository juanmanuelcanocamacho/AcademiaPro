"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, KeyRound, ArrowRight, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { register } from "@/actions/auth";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminSecret, setAdminSecret] = useState("");
    const [showSecretField, setShowSecretField] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await register({ name, email, password, adminSecret });
            if (result?.error) {
                toast.error(result.error);
                if (result.details) {
                    console.error("Errores de validación:", result.details);
                }
            } else {
                toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
                router.push("/login");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />

                <div className="mb-8 text-center relative">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50 relative z-10">
                        <User className="w-8 h-8 text-emerald-600" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSecretField(!showSecretField)}
                        className="absolute right-0 top-0 p-2 text-gray-300 hover:text-indigo-500 transition-colors"
                        title="Tengo un código de invitación"
                    >
                        <KeyRound className="w-4 h-4" />
                    </button>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                        Crear Cuenta
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Regístrate para acceder a los simulacros
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Nombre Completo
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                placeholder="Juan Pérez"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Correo Electrónico
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>

                    {showSecretField && (
                        <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-2">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Acceso de Administrador</h3>
                                <p className="text-xs text-indigo-600 font-medium">Introduce el código maestro para obtener permisos de edición.</p>
                                <input
                                    type="password"
                                    value={adminSecret}
                                    onChange={(e) => setAdminSecret(e.target.value)}
                                    className="w-full mt-3 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-900 placeholder:text-indigo-300 placeholder:font-normal"
                                    placeholder="Código secreto..."
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3.5 px-6 bg-gray-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-gray-900/10 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Completar Registro
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm font-medium text-gray-500">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline underline-offset-4 transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
