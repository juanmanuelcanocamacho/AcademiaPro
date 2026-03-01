import Sidebar from "@/components/Sidebar";
import { auth } from "@/../auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <div className="flex min-h-screen">
            <Sidebar session={session} />
            <main className="flex-1 min-h-screen overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
