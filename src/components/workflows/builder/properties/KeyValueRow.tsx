"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props =
  | { label: string; type: 'input'; placeholder?: string; value?: string; readOnly?: boolean }
  | { label: string; type: 'select'; placeholder?: string; options: string[]; value?: string }

export default function KeyValueRow(props: Props) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5 text-[12px] text-gray-600 truncate" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>{props.label}</div>
      <div className="col-span-7">
        {props.type === 'input' ? (
          <Input value={props.value} placeholder={props.placeholder} readOnly={props.readOnly} className="h-8" />
        ) : (
          <Select defaultValue={props.value}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((op) => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

