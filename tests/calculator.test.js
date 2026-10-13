import test from 'node:test'
import assert from 'node:assert/strict'
import { calculate, previousMonth } from '../src/lib/calculator.js'

const base = {
  price: 245, quota: 50, activation: '2026-10-16', activationTime: '12:00',
  renewal: '2026-11-12', cycleStart: '2026-10-12', operation: 'activation',
  oldPrice: 100, dataMode: 'proportional',
}

test('retomada usa a fração exata do ciclo para valor e dados', () => {
  const result = calculate(base)
  assert.equal(result.cycleDays, 31)
  assert.equal(result.remainingDays, 26.5)
  assert.ok(Math.abs(result.amount - 245 * 26.5 / 31) < 0.001)
  assert.ok(Math.abs(result.dataGB - 50 * 26.5 / 31) < 0.001)
})

test('troca de plano cobra apenas a diferença e permite franquia integral', () => {
  const result = calculate({ ...base, operation: 'change', dataMode: 'full' })
  assert.ok(Math.abs(result.amount - 145 * 26.5 / 31) < 0.001)
  assert.equal(result.dataGB, 50)
})

test('plano ilimitado e redução de preço não geram cobrança adicional', () => {
  const result = calculate({ ...base, price: 80, quota: 0, operation: 'change', dataMode: 'unlimited' })
  assert.equal(result.amount, 0)
  assert.equal(result.dataGB, null)
  assert.equal(result.isDecrease, true)
})

test('datas inválidas e preços ausentes geram orientação', () => {
  assert.match(calculate({ ...base, renewal: '' }).error, /próxima renovação \/ fatura/)
  assert.match(calculate({ ...base, activation: '2026-11-12' }).error, /antes da renovação/)
  assert.match(calculate({ ...base, price: '' }).error, /mensalidade/)
  assert.match(calculate({ ...base, cycleStart: '2026-02-30' }).error, /datas/)
})

test('ciclo automático respeita meses curtos', () => {
  assert.equal(previousMonth('2026-03-31'), '2026-02-28')
})
