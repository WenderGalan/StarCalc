const DAY_MS = 86_400_000

export function parseUtcDate(value, time = '00:00') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !/^\d{2}:\d{2}$/.test(time)) return NaN
  const [year, month, day] = value.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute) return NaN
  return date.getTime()
}

export function previousMonth(value) {
  if (!Number.isFinite(parseUtcDate(value))) return ''
  const [year, month, day] = value.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 2, Math.min(day, lastDay))).toISOString().slice(0, 10)
}

export function localDate(today = new Date()) {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function calculate({ price, quota, activation, activationTime, renewal, cycleStart, operation, oldPrice, dataMode }) {
  if (!renewal) return { error: 'Informe a data da próxima renovação / fatura na sua conta Starlink.' }
  const start = parseUtcDate(cycleStart)
  const end = parseUtcDate(renewal)
  const active = parseUtcDate(activation, activationTime)
  if (![start, end, active].every(Number.isFinite)) return { error: 'Confira as datas do ciclo e da ativação.' }
  const cycleDays = (end - start) / DAY_MS
  const remainingDays = (end - active) / DAY_MS
  if (cycleDays <= 0) return { error: 'A renovação deve ocorrer depois do início do ciclo.' }
  if (remainingDays <= 0 || remainingDays > cycleDays) return { error: 'A ativação deve ocorrer dentro do ciclo, antes da renovação.' }
  if (price === '' || price === null || !Number.isFinite(Number(price)) || Number(price) < 0) return { error: 'Informe a mensalidade mostrada na sua conta.' }
  if (quota === '' || quota === null || !Number.isFinite(Number(quota)) || Number(quota) < 0) return { error: 'Informe uma franquia válida em GB.' }
  if (operation === 'change' && (oldPrice === '' || oldPrice === null || !Number.isFinite(Number(oldPrice)) || Number(oldPrice) < 0)) return { error: 'Informe a mensalidade do plano anterior.' }

  const fraction = remainingDays / cycleDays
  const monthlyPrice = Number(price)
  const previousPrice = Number(oldPrice)
  const limited = dataMode !== 'unlimited' && Number(quota) > 0
  const dataGB = !limited ? null : dataMode === 'full' ? Number(quota) : Number(quota) * fraction
  const difference = operation === 'change' ? Math.max(0, monthlyPrice - previousPrice) : monthlyPrice

  return {
    amount: difference * fraction,
    monthlyPrice,
    previousPrice,
    quotaGB: Number(quota),
    dataGB,
    fraction,
    cycleDays,
    remainingDays,
    operation,
    dataMode,
    isDecrease: operation === 'change' && monthlyPrice < previousPrice,
  }
}
