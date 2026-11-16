import { Logo } from "~/components/common/logo";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "~/components/ui/card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background to-secondary/20">
      <Card className="w-100 shadow-lg">
        <CardHeader className="w-full text-center">
          <CardTitle className="text-xl w-full flex justify-center">
            <Logo />
          </CardTitle>
          <CardDescription className="sm:tracking-wide">
            Sign in to keep conversations alive
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
