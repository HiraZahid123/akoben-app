'use client'

import { useState } from 'react'

interface Step { title: string; body: string }
interface Props {
  id: string
  title: string
  content?: string
  steps?: Step[]
}

export default function HelpAccordion({ id, title, content, steps }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div id={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        <span className={`text-gray-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
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
