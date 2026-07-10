'use client'

import { useState } from 'react'
import {
  ChevronDown, ClipboardList, MessageSquare, Package, Receipt, Calendar, Truck,
  PackageCheck, Container, Tag, Archive, BarChart3, CreditCard, Bookmark, Lightbulb,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  overview: ClipboardList,
  quotes: MessageSquare,
  orders: Package,
  invoices: Receipt,
  calendar: Calendar,
  pull: Truck,
  return: PackageCheck,
  delivery: Container,
  inventory: Tag,
  backoffice: Archive,
  reports: BarChart3,
  payments: CreditCard,
  statuses: Bookmark,
  tips: Lightbulb,
}

interface Step { title: string; body: string }
interface Props {
  id: string
  title: string
  content?: string
  steps?: Step[]
}

export default function HelpAccordion({ id, title, content, steps }: Props) {
  const [open, setOpen] = useState(false)
  const Icon = ICONS[id]

  return (
    <div id={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          {Icon && <Icon size={16} className="text-orange-500" />}
          {title}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {content && (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{content}</p>
          )}
          {steps && (
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
