"use client"
import { ScanDashboard } from "@/components/scan-dashboard"
export default function ScanPage() {
  return <ScanDashboard onScan={()=>{}} isScanning={false} onBarcodeProduct={()=>{}} />
}
