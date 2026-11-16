import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center p-3 justify-center text-center">
      <h1
        className="font-bold text-primary"
        style={{ fontSize: "60px" }}
        aria-label="Page not found"
      >
        404
      </h1>
      <p className="mt-2 text-muted-foreground">
        Oops! The page you are looking for does not exist.
      </p>
      <Button asChild className="mt-6" aria-label="Go back to home page">
        <Link href="/">
          <ArrowLeftIcon className="mr-2 h-5 w-5" aria-hidden="true" />
          Go Home
        </Link>
      </Button>
    </div>
  );
}
