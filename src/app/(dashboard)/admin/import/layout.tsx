import { auth } from "@/../auth";
import { getSystemSettings } from "@/actions/settings";
import { redirect } from "next/navigation";

export default async function ImportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const settings = await getSystemSettings();

    // If the user is neither an Admin nor a student with import permissions, block access
    if (session?.user?.role !== "ADMIN" && !settings.allowStudentImport) {
        redirect("/exam");
    }

    return <>{children}</>;
}
