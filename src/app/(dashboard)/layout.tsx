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
        <div className="flex min-h-screen">
            <Sidebar session={session} settings={settings} />
            <main className="flex-1 min-h-screen overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
