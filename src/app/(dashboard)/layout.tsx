import SidebarWrapper from "@/components/SidebarWrapper";
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
        <div className="flex h-[100dvh] overflow-hidden bg-gray-50/30">
            <SidebarWrapper session={session} settings={settings} />
            <main className="flex-1 overflow-y-auto w-full relative pt-14 md:pt-0">
                {children}
            </main>
        </div>
    );
}
