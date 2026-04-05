import { NextResponse } from "next/server"

export async function GET() {
  try {
    // EM PRODUÇÃO: Substitua por chamadas reais ao Supabase/Firebase
    const mockData = {
      mrr: {
        brl: 42500.70,
        usd: 3200.50,
      },
      subscribers: {
        br: 1250,
        us: 320,
      },
      newScans24h: 873,
      revenueGrowth: [
        { month: "Jan", brl: 22000, usd: 1500 },
        { month: "Fev", brl: 25000, usd: 1800 },
        { month: "Mar", brl: 28000, usd: 2200 },
        { month: "Abr", brl: 31000, usd: 2500 },
        { month: "Mai", brl: 35000, usd: 2800 },
        { month: "Jun", brl: 42500, usd: 3200 },
      ],
      recentUpgrades: [
        { id: 1, name: "Ana Silva", email: "ana.s@example.com", country: "BR" },
        { id: 2, name: "John Smith", email: "john.s@example.com", country: "US" },
        { id: 3, name: "Carlos Souza", email: "carlos.s@example.com", country: "BR" },
        { id: 4, name: "Maria Garcia", email: "maria.g@example.com", country: "BR" },
        { id: 5, name: "Emily White", email: "emily.w@example.com", country: "US" },
      ],
      conversionRate: 5.45, // USD to BRL
    }

    const totalRevenueBRL = mockData.mrr.brl + (mockData.mrr.usd * mockData.conversionRate);

    return NextResponse.json({
      revenue: {
        totalBRL: totalRevenueBRL,
        growth: mockData.revenueGrowth,
      },
      subscribers: mockData.subscribers,
      newScans24h: mockData.newScans24h,
      recentUpgrades: mockData.recentUpgrades,
      conversionRate: mockData.conversionRate,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[Admin Stats API] Error:", errorMessage)
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}