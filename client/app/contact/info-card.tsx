import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const InfoCard = ({ icon, title, description }: InfoCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
