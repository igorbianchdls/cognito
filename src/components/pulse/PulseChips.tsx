"use client"

type Chip = 'unusual' | 'normal' | 'all'

type Counts = { unusual: number; normal: number; all: number }

type PulseChipsProps = {
  value: Chip
  counts: Counts
  onChange: (v: Chip) => void
}

export function PulseChips({ value, counts, onChange }: PulseChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('unusual')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
            value === 'unusual'
              ? 'bg-emerald-100 text-emerald-900 ring-emerald-200'
              : 'bg-emerald-50/60 text-emerald-700 ring-emerald-200/60 hover:bg-emerald-100'
          }`}
        >
          Unusual <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-emerald-700">{counts.unusual}</span>
        </button>

        <button
          onClick={() => onChange('normal')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
            value === 'normal'
              ? 'bg-indigo-100 text-indigo-900 ring-indigo-200'
              : 'bg-indigo-50/60 text-indigo-700 ring-indigo-200/60 hover:bg-indigo-100'
          }`}
        >
          Normal <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-indigo-700">{counts.normal}</span>
        </button>

        <button
          onClick={() => onChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur ring-1 transition ${
            value === 'all'
              ? 'bg-gray-100 text-gray-900 ring-gray-200'
              : 'bg-gray-50/60 text-gray-700 ring-gray-200/60 hover:bg-gray-100'
          }`}
        >
          All <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/70 text-gray-700">{counts.all}</span>
        </button>
      </div>
    </div>
  )
}

export default PulseChips

