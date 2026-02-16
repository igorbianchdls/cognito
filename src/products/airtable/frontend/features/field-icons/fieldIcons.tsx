import type { ReactNode } from "react"
import {
  Building2,
  Calendar,
  Code2,
  FileText,
  Hash,
  Mail,
  Phone,
  ToggleLeft,
  Type,
  User,
} from "lucide-react"

export function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function getFieldTypeIcon(meta: { type: string; name?: string; slug?: string }): ReactNode {
  const iconClass = "h-3.5 w-3.5 text-muted-foreground"
  const t = String(meta.type || "").toLowerCase()

  if (t === "number") return <Hash className={iconClass} />
  if (t === "bool") return <ToggleLeft className={iconClass} />
  if (t === "date") return <Calendar className={iconClass} />
  if (t === "json") return <Code2 className={iconClass} />

  if (t === "text") {
    const semantic = `${normalizeText(meta.name || "")} ${normalizeText(meta.slug || "")}`

    if (semantic.includes("telefone") || semantic.includes("celular") || semantic.includes("whatsapp") || semantic.includes("fone")) {
      return <Phone className={iconClass} />
    }
    if (semantic.includes("email") || semantic.includes("e-mail")) {
      return <Mail className={iconClass} />
    }
    if (semantic.includes("cnpj") || semantic.includes("empresa") || semantic.includes("razao social") || semantic.includes("fornecedor")) {
      return <Building2 className={iconClass} />
    }
    if (semantic.includes("cpf") || semantic.includes("cliente") || semantic.includes("pessoa") || semantic.includes("nome")) {
      return <User className={iconClass} />
    }
    if (semantic.includes("documento") || semantic.includes("protocolo")) {
      return <FileText className={iconClass} />
    }
  }

  return <Type className={iconClass} />
}
