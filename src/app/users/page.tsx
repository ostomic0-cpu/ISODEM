import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UsersClient } from "@/app/users/users-client";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "Admin") redirect("/");

  return <UsersClient currentUserId={session.id} />;
}
