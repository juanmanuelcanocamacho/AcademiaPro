import Sidebar from "@/components/Sidebar";
import { auth } from "@/../auth";
import { getSystemSettings } from "@/actions/settings";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();
    const settings = await getSystemSettings();

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full max-w-[100vw] overflow-x-hidden">
            <Sidebar session={session} settings={settings} />
            <main className="flex-1 h-screen md:min-h-screen overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
