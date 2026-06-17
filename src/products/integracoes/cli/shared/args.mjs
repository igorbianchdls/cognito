function readValue(argv, index, name) {
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Valor ausente para ${name}.`)
  }
  return value
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const parsed = {
    flags: new Set(),
    values: new Map(),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) {
      throw new Error(`Argumento invalido: ${item}`)
    }

    const equalsIndex = item.indexOf('=')
    if (equalsIndex > -1) {
      const name = item.slice(0, equalsIndex)
      const value = item.slice(equalsIndex + 1)
      if (!value) throw new Error(`Valor ausente para ${name}.`)
      parsed.values.set(name, value)
      continue
    }

    if (item === '--wait' || item === '--help') {
      parsed.flags.add(item)
      continue
    }

    parsed.values.set(item, readValue(argv, index, item))
    index += 1
  }

  return parsed
}

export function getRequiredPositiveInt(args, name) {
  const value = args.values.get(name)
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`)
  }
  return parsed
}

export function getOptionalPositiveInt(args, name, fallback) {
  const value = args.values.get(name)
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`)
  }
  return parsed
}

export function getOptionalId(args, name) {
  const value = args.values.get(name)
  if (value == null || value === '') return undefined
  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${name} deve ser um id numerico.`)
  }
  return String(value)
}

export function getOptionalStringArray(args, name) {
  const value = args.values.get(name)
  if (!value) return undefined
  const items = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length ? items : undefined
}

export function hasFlag(args, name) {
  return args.flags.has(name)
}
