'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatGHS, formatDateTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

type ScanAction = 'checkout' | 'checkin' | 'lookup'

interface ScanResult {
  barcode: string
  unit?: {
    id: string
    unit_number: string | null
    barcode: string | null
    status: string
    condition: string
    serial_number: string | null
    inventory_items: { id: string; name: string; category: string | null } | null
  }
  error?: string
}

interface ScanLogEntry {
  id: string
  scanned_at: string
  barcode: string
  action: string
  result: string | null
  inventory_units: { unit_number: string | null; inventory_items: { name: string } | null } | null
}

const ACTION_COLORS: Record<string, 'success' | 'danger' | 'info'> = {
  checkout: 'danger',
  checkin: 'success',
  lookup: 'info',
}

export default function BarcodeScanner() {
  const [mode, setMode] = useState<ScanAction>('lookup')
  const [scanning, setScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [log, setLog] = useState<ScanLogEntry[]>([])
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<any>(null)
  const scannerDivId = 'html5-qrscanner'

  useEffect(() => {
    loadRecentLog()
  }, [])

  async function loadRecentLog() {
    const { data } = await supabase
      .from('barcode_scan_log')
      .select('id, scanned_at, barcode, action, result, inventory_units(unit_number, inventory_items(name))')
      .order('scanned_at', { ascending: false })
      .limit(20)
    if (data) setLog(data as unknown as ScanLogEntry[])
  }

  async function startCamera() {
    setCameraError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(scannerDivId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          await scanner.stop()
          setScanning(false)
          await handleBarcode(decodedText)
        },
        undefined
      )
      setScanning(true)
    } catch (err: any) {
      setCameraError(err?.message ?? 'Camera access denied. Use manual entry below.')
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function handleBarcode(barcode: string) {
    setProcessing(true)
    setScanResult(null)

    try {
      // Look up the unit by barcode
      const { data: unit } = await supabase
        .from('inventory_units')
        .select('id, unit_number, barcode, status, condition, serial_number, inventory_items(id, name, category)')
        .eq('barcode', barcode)
        .maybeSingle()

      if (!unit) {
        // Log not found
        await supabase.from('barcode_scan_log').insert({
          barcode,
          action: mode,
          result: 'not_found',
        })
        setScanResult({ barcode, error: `No unit found for barcode: ${barcode}` })
        await loadRecentLog()
        return
      }

      // For checkout/checkin actually update the unit
      if (mode === 'checkout' || mode === 'checkin') {
        const newStatus = mode === 'checkout' ? 'out' : 'available'
        const alreadyCorrect =
          (mode === 'checkout' && unit.status === 'out') ||
          (mode === 'checkin' && unit.status === 'available')

        if (alreadyCorrect) {
          await supabase.from('barcode_scan_log').insert({
            barcode,
            unit_id: unit.id,
            item_id: (unit.inventory_items as any)?.id,
            action: mode,
            result: mode === 'checkout' ? 'already_out' : 'already_available',
          })
          setScanResult({ barcode, unit: unit as any, error: `Item is already ${newStatus === 'out' ? 'checked out' : 'available'}.` })
        } else {
          // The trigger process_barcode_scan() fires on insert to barcode_scan_log
          await supabase.from('barcode_scan_log').insert({
            barcode,
            unit_id: unit.id,
            item_id: (unit.inventory_items as any)?.id,
            action: mode,
            result: 'success',
          })
          // Refresh unit status
          const { data: updatedUnit } = await supabase
            .from('inventory_units')
            .select('id, unit_number, barcode, status, condition, serial_number, inventory_items(id, name, category)')
            .eq('id', unit.id)
            .single()
          setScanResult({ barcode, unit: updatedUnit as any })
        }
      } else {
        // Lookup only — log it
        await supabase.from('barcode_scan_log').insert({
          barcode,
          unit_id: unit.id,
          item_id: (unit.inventory_items as any)?.id,
          action: 'lookup',
          result: 'success',
        })
        setScanResult({ barcode, unit: unit as any })
      }

      await loadRecentLog()
    } catch (err: any) {
      setScanResult({ barcode, error: err.message })
    } finally {
      setProcessing(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    await handleBarcode(manualBarcode.trim())
    setManualBarcode('')
  }

  const statusVariant = (s: string) =>
    s === 'available' ? 'success' : s === 'out' ? 'danger' : s === 'maintenance' ? 'warning' : 'default'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      {/* Scanner panel */}
      <div className="space-y-4">
        {/* Mode selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Scan Action</p>
          <div className="flex gap-2">
            {(['lookup', 'checkout', 'checkin'] as ScanAction[]).map(a => (
              <button key={a} onClick={() => setMode(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  mode === a
                    ? a === 'checkout' ? 'bg-red-600 text-white' : a === 'checkin' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {a === 'checkout' ? 'Check Out' : a === 'checkin' ? 'Check In' : 'Lookup'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {mode === 'checkout' && 'Marks unit as OUT — removed from available inventory'}
            {mode === 'checkin' && 'Marks unit as AVAILABLE — returned to inventory'}
            {mode === 'lookup' && 'Shows unit info without changing status'}
          </p>
        </div>

        {/* Camera */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Camera Scanner</p>
            {!scanning ? (
              <button onClick={startCamera}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Start Camera
              </button>
            ) : (
              <button onClick={stopCamera}
                className="px-4 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                Stop
              </button>
            )}
          </div>

          <div id={scannerDivId} className={scanning ? 'rounded-lg overflow-hidden' : 'hidden'} />

          {!scanning && !cameraError && (
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              Click "Start Camera" to scan barcodes
            </div>
          )}
          {cameraError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">{cameraError}</div>
          )}
        </div>

        {/* Manual entry */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Manual Barcode Entry</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value)}
              placeholder="Type or paste barcode..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={processing || !manualBarcode.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {processing ? '...' : 'Scan'}
            </button>
          </form>
        </div>

        {/* Result card */}
        {scanResult && (
          <div className={`bg-white rounded-xl border-2 p-4 ${scanResult.error ? 'border-red-200' : 'border-green-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-gray-400 font-mono">{scanResult.barcode}</p>
              <button onClick={() => setScanResult(null)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">&times;</button>
            </div>

            {scanResult.error && (
              <div className="flex items-center gap-2 text-red-600">
                <span className="text-xl">⚠</span>
                <p className="text-sm font-medium">{scanResult.error}</p>
              </div>
            )}

            {scanResult.unit && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{(scanResult.unit.inventory_items as any)?.name}</p>
                  <Badge variant={statusVariant(scanResult.unit.status)} className="capitalize text-xs">
                    {scanResult.unit.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                  {scanResult.unit.unit_number && <div><span className="text-gray-400">Unit:</span> {scanResult.unit.unit_number}</div>}
                  {scanResult.unit.serial_number && <div><span className="text-gray-400">Serial:</span> {scanResult.unit.serial_number}</div>}
                  <div><span className="text-gray-400">Condition:</span> <span className="capitalize">{scanResult.unit.condition}</span></div>
                  {(scanResult.unit.inventory_items as any)?.category && (
                    <div><span className="text-gray-400">Category:</span> {(scanResult.unit.inventory_items as any).category}</div>
                  )}
                </div>
                {!scanResult.error && (
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${mode === 'checkout' ? 'text-red-600' : mode === 'checkin' ? 'text-green-600' : 'text-blue-600'}`}>
                    <span>✓</span>
                    <span>{mode === 'checkout' ? 'Checked out' : mode === 'checkin' ? 'Checked in' : 'Lookup complete'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-800">Recent Scans</span>
          <button onClick={loadRecentLog} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Refresh</button>
        </div>
        {log.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No scans yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {log.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                <Badge variant={ACTION_COLORS[entry.action] ?? 'default'} className="capitalize text-xs mt-0.5 shrink-0">
                  {entry.action}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {entry.inventory_units?.inventory_items?.name ?? entry.barcode}
                  </p>
                  {entry.inventory_units?.unit_number && (
                    <p className="text-xs text-gray-400">{entry.inventory_units.unit_number}</p>
                  )}
                  {entry.result && entry.result !== 'success' && (
                    <p className="text-xs text-amber-600 capitalize">{entry.result.replace(/_/g, ' ')}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDateTime(entry.scanned_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
