import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome to the CRUD App</h1>
        <Link href="/users">
          <Button>Manage Users</Button>
        </Link>
      </div>
    </main>
  );
}
