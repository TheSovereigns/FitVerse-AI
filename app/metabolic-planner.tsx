"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface MetabolicPlannerProps {
  onPlanCreated: (plan: any, profile: any) => void;
}

export function MetabolicPlanner({ onPlanCreated }: MetabolicPlannerProps) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('lose_weight');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    // Validação Pré-Envio no frontend
    if (!weight || !height || !age || !gender || !activityLevel || !goal) {
      alert('Por favor, preencha todos os campos do formulário.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const profileData = {
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      gender,
      activityLevel,
      goal,
    };

    try {
      console.log("Enviando dados para /api/generate-metabolic-plan:", profileData);

      const response = await fetch('/api/generate-metabolic-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro na API: ${response.statusText}`);
      }

      const plan = await response.json();
      onPlanCreated(plan, profileData); // Passa o plano e o perfil para o componente pai

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      console.error("Erro ao calcular plano:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Gerador de Dieta com IA</CardTitle>
        <CardDescription>Preencha seus dados para que nossa IA crie um plano alimentar personalizado para você.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input id="weight" type="number" placeholder="Ex: 75" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input id="height" type="number" placeholder="Ex: 180" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Idade</Label>
          <Input id="age" type="number" placeholder="Ex: 30" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gênero</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Feminino</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activityLevel">Nível de Atividade</Label>
          <Select value={activityLevel} onValueChange={setActivityLevel}>
            <SelectTrigger id="activityLevel"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent><SelectItem value="sedentary">Sedentário</SelectItem><SelectItem value="light">Leve (1-3x/sem)</SelectItem><SelectItem value="moderate">Moderado (3-5x/sem)</SelectItem><SelectItem value="active">Ativo (6-7x/sem)</SelectItem><SelectItem value="very_active">Muito Ativo</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Objetivo Principal</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger id="goal"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent><SelectItem value="lose_weight">Perder Peso</SelectItem><SelectItem value="maintain">Manter Peso</SelectItem><SelectItem value="gain_muscle">Ganhar Massa</SelectItem></SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando plano...</> : 'Gerar Plano com IA'}
        </Button>
      </CardFooter>
    </Card>
  );
}