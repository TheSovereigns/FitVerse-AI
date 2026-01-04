import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface OnboardingCardProps {
  onCTAClick: () => void;
}

export function OnboardingCard({ onCTAClick }: OnboardingCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 text-center animate-in fade-in-50 duration-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Bem-vindo ao FitVerse AI!</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Sua jornada para uma vida mais saudável começa agora.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <p>Para personalizar sua experiência, precisamos primeiro definir suas metas nutricionais.</p>
        <Button onClick={onCTAClick} size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <Zap className="w-5 h-5" />
          Calcular minhas Metas Agora
        </Button>
      </CardContent>
    </Card>
  );
}