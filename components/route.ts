import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // TODO: Implement your AI generation logic here.
    // Example: Call OpenAI or another service with the 'body' data.
    
    // Mock response to fix the immediate error and verify connection
    const mockPlan = {
      macros: {
        protein: "180g",
        carbs: "200g",
        fats: "60g"
      },
      message: "Metabolic plan generated successfully based on " + body.focus
    };

    return NextResponse.json(mockPlan);
  } catch (error) {
    console.error("Error in generate-metabolic-plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}