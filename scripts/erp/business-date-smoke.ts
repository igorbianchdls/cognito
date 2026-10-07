import assert from 'node:assert/strict'
import { addDays, businessDay, DEFAULT_ERP_TIME_ZONE, isValidTimeZone, monthBounds, normalizeTimeZone } from '../../src/products/erp/shared/businessDate'
import { dashboardToday } from '../../src/products/erp/shared/dashboardContracts'
import { erpToday } from '../../src/products/erp/server/erpBusinessDate'
import { getErpDatabaseContext, runWithErpDatabaseContext } from '../../src/lib/erpDatabaseContext'

// Data comercial do ERP com relógio fixo; sem banco, rede ou credenciais.
const checks: string[] = []
function check(name: string, fn: () => void) { fn(); checks.push(name) }
// 23h30 de 07/10 em Brasília = 02h30 UTC de 08/10.
const lateNight = new Date('2026-10-08T02:30:00Z')

check('Padrão é America/Sao_Paulo', () => assert.equal(DEFAULT_ERP_TIME_ZONE, 'America/Sao_Paulo'))
check('23h30 em Brasília continua sendo o mesmo dia', () => {
  assert.equal(lateNight.toISOString().slice(0, 10), '2026-10-08')
  assert.equal(businessDay(undefined, lateNight), '2026-10-07')
  assert.equal(businessDay('America/Sao_Paulo', lateNight), '2026-10-07')
})
check('Empresa em Manaus (UTC-4) e no Acre (UTC-5)', () => {
  const instant = new Date('2026-10-08T03:30:00Z')
  assert.equal(businessDay('America/Sao_Paulo', instant), '2026-10-08')
  assert.equal(businessDay('America/Manaus', instant), '2026-10-07')
  assert.equal(businessDay('America/Rio_Branco', new Date('2026-10-08T04:30:00Z')), '2026-10-07')
})
check('Virada de mês e de ano no fuso da empresa', () => {
  assert.equal(businessDay('America/Sao_Paulo', new Date('2026-11-01T02:00:00Z')), '2026-10-31')
  assert.equal(businessDay('America/Sao_Paulo', new Date('2027-01-01T02:59:00Z')), '2026-12-31')
  assert.equal(businessDay('America/Sao_Paulo', new Date('2027-01-01T03:00:00Z')), '2027-01-01')
})
check('Fuso inválido ou malicioso usa o padrão', () => {
  for (const value of ['', 'Mars/Olympus', "America/Sao_Paulo'; DROP TABLE x;--", null, 42, 'UTC OR 1=1']) {
    assert.equal(isValidTimeZone(value), false, String(value))
    assert.equal(normalizeTimeZone(value), DEFAULT_ERP_TIME_ZONE)
  }
  assert.equal(normalizeTimeZone('America/Manaus'), 'America/Manaus')
})
check('Somar dias e limites de mês sem efeito de fuso', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2024-03-01', -1), '2024-02-29')
  assert.deepEqual(monthBounds('2024-02-10'), { start: '2024-02-01', end: '2024-02-29' })
  assert.deepEqual(monthBounds('2026-12-15', 1), { start: '2027-01-01', end: '2027-01-31' })
})
check('erpToday usa o fuso do contexto autenticado', () => {
  assert.equal(getErpDatabaseContext(), null)
  assert.equal(erpToday(lateNight), '2026-10-07')
  runWithErpDatabaseContext({ tenantId: 1, userId: 1, timeZone: 'America/Manaus' }, () => {
    assert.equal(getErpDatabaseContext()?.timeZone, 'America/Manaus')
    assert.equal(erpToday(new Date('2026-10-08T03:30:00Z')), '2026-10-07')
  })
  runWithErpDatabaseContext({ tenantId: 1, userId: 1, timeZone: "x'; DROP" }, () => {
    assert.equal(getErpDatabaseContext()?.timeZone, DEFAULT_ERP_TIME_ZONE)
  })
})
check('Referência dos dashboards no fuso da empresa', () => {
  assert.equal(dashboardToday(lateNight), '2026-10-07')
  assert.equal(dashboardToday(new Date('2026-10-08T03:30:00Z'), 'America/Manaus'), '2026-10-07')
})
console.log(JSON.stringify({ status: 'passed', checks: checks.length, names: checks }))
