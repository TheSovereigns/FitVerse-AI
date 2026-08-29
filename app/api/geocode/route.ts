import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FitVerse-AI/1.0 (contact@fitverse.ai)",
        "Accept-Language": "pt-BR",
        "Accept": "application/json",
      },
      // Cache on server side for 1h
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Geocode upstream error" }, { status: res.status })
    }

    const data = await res.json()
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || null
    return NextResponse.json({ city, address: data.address, raw: data }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 })
  }
}
