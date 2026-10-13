<script setup>
import { computed, reactive, ref, watch } from 'vue'
import plansData from './data/plans.json'
import { calculate, localDate, previousMonth } from './lib/calculator.js'

const STORAGE_KEY = 'starcalc.simulation.v2'
const LEGACY_STORAGE_KEY = 'starcalc.simulation.v1'
const plans = plansData.plans
const categories = [...new Set(plans.map((plan) => plan.category))]
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function initialState() {
  return {
    planId: 'lp50', price: 245, quota: 50, activation: typeof window === 'undefined' ? '' : localDate(), renewal: '',
    activationTime: '12:00', cycleStart: '',
    operation: 'activation', oldPrice: 245, dataMode: 'proportional',
  }
}

function readState() {
  const defaults = initialState()
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    const legacy = current ? null : JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || 'null')
    const saved = current || legacy
    if (!saved || typeof saved !== 'object') return defaults
    const state = Object.fromEntries(Object.keys(defaults).map((key) => [key, saved[key] ?? defaults[key]]))
    if (!plans.some((plan) => plan.id === state.planId)) return defaults
    // A versão anterior sugeria o dia 12 sem confirmação. Remova só essa sugestão.
    if (legacy && /^\d{4}-\d{2}-12$/.test(state.renewal)) {
      state.renewal = ''
      state.cycleStart = ''
    }
    return state
  } catch {
    return defaults
  }
}

const form = reactive(readState())
const advancedOpen = ref(false)
const selectedPlan = computed(() => plans.find((plan) => plan.id === form.planId) || plans[0])
const result = computed(() => calculate(form))
const isValid = computed(() => !result.value.error)
const cyclePercentage = computed(() => isValid.value ? Math.max(0, Math.min(100, result.value.fraction * 100)) : 0)
const nextData = computed(() => !isValid.value ? '—' : result.value.dataGB === null ? 'Ilimitado' : result.value.quotaGB === 0 ? 'Ilimitado' : `${number.format(result.value.quotaGB)} GB`)
const currentData = computed(() => !isValid.value ? '—' : result.value.dataGB === null ? 'Ilimitado' : `${number.format(result.value.dataGB)} GB`)
const github = 'https://github.com/WenderGalan/StarCalc'

watch(form, (value) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* armazenamento indisponível */ }
}, { deep: true })

function changePlan() {
  const plan = selectedPlan.value
  form.price = plan.monthlyPrice ?? ''
  form.quota = plan.quotaGB
  form.dataMode = plan.dataPolicy === 'unlimited' ? 'unlimited' : form.operation === 'change' && plan.category === 'Viagem' ? 'full' : 'proportional'
}

function changeRenewal(event) {
  form.renewal = event.target.value
  form.cycleStart = previousMonth(form.renewal)
}

function changeOperation() {
  form.dataMode = selectedPlan.value.dataPolicy === 'unlimited' ? 'unlimited' : form.operation === 'change' && selectedPlan.value.category === 'Viagem' ? 'full' : 'proportional'
}

function resetForm() {
  Object.assign(form, initialState())
  advancedOpen.value = false
}

function readableDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '—'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <div class="site-shell min-h-screen overflow-hidden text-zinc-100">
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>

    <div class="relative mx-auto max-w-[1220px] px-5 sm:px-8 lg:px-10">
      <header class="flex items-center justify-between border-b border-white/10 py-6">
        <a href="#inicio" class="brand flex items-center gap-3" aria-label="StarCalc, início">
          <span class="brand-mark" aria-hidden="true"><span></span></span>
          <span class="text-[19px] font-semibold tracking-[-.055em]">STAR<span class="text-lime-300">CALC</span><span class="text-lime-300">.</span></span>
        </a>
        <a :href="github" target="_blank" rel="noopener noreferrer" class="nav-link inline-flex items-center gap-2 text-xs font-medium tracking-[.12em] uppercase sm:text-[13px]">
          Ver no GitHub
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="h-4 w-4"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </header>

      <main id="inicio">
        <section class="hero relative grid gap-10 pb-12 pt-15 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center lg:gap-10 lg:pb-17">
          <div class="relative z-10 max-w-[700px]">
            <div class="eyebrow mb-5 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[.21em] uppercase text-lime-300">
              <span class="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_#bef264]"></span>
              Simulador independente de ciclo
            </div>
            <h1 class="hero-title max-w-[780px] text-[clamp(3.15rem,6vw,5.3rem)] leading-[.94] font-medium tracking-[-.075em]">
              Retome a Starlink.<br /><span class="text-zinc-500">Saiba o valor.</span>
            </h1>
            <p class="mt-7 max-w-[600px] text-[16px] leading-7 text-zinc-400 sm:text-[18px] sm:leading-8">
              Descubra quanto pode custar reativar sua Starlink e quantos dados estarão disponíveis até a próxima fatura. Planeje viagens e períodos curtos de uso antes de retomar o plano.
            </p>
            <div class="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-medium tracking-wide text-zinc-400 sm:text-[13px]">
              <span class="flex items-center gap-2"><span class="check-icon">✓</span> Cálculo instantâneo</span>
              <span class="flex items-center gap-2"><span class="check-icon">✓</span> Sem cadastro</span>
              <span class="flex items-center gap-2"><span class="check-icon">✓</span> Dados salvos neste navegador</span>
            </div>
          </div>
          <div class="orbit-art relative hidden h-[315px] lg:block" aria-hidden="true">
            <div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div>
            <div class="orbit-core"><div class="orbit-core-inner"><span class="text-[10px] tracking-[.22em] text-lime-300">STAR</span><span class="text-[32px] font-semibold tracking-[-.08em] text-white">CALC<span class="text-lime-300">.</span></span></div></div>
            <div class="orbit-dot orbit-dot-one"></div><div class="orbit-dot orbit-dot-two"></div>
            <span class="orbit-caption orbit-caption-one">01 / ATIVAÇÃO</span><span class="orbit-caption orbit-caption-two">02 / FATURA</span>
          </div>
        </section>

        <section aria-labelledby="simulator-title" class="grid gap-5 pb-11 lg:grid-cols-[minmax(0,1fr)_minmax(0,.95fr)] lg:items-start lg:gap-6">
          <div class="panel form-panel">
            <div class="mb-8 flex items-start justify-between gap-4">
              <div><span class="section-index">01 / CONFIGURAÇÃO</span><h2 id="simulator-title" class="mt-2 text-[25px] font-medium tracking-[-.045em] sm:text-[29px]">Monte sua simulação</h2></div>
              <button type="button" class="reset-button" @click="resetForm">Limpar</button>
            </div>

            <div class="mb-7">
              <span class="field-label mb-3 block">O que você quer fazer?</span>
              <div class="segmented" role="group" aria-label="Tipo de operação">
                <button type="button" :class="['segment', { active: form.operation === 'activation' }]" :aria-pressed="form.operation === 'activation'" @click="form.operation = 'activation'; changeOperation()">Retomar assinatura</button>
                <button type="button" :class="['segment', { active: form.operation === 'change' }]" :aria-pressed="form.operation === 'change'" @click="form.operation = 'change'; changeOperation()">Mudar de plano</button>
              </div>
            </div>

            <div class="space-y-5">
              <div>
                <div class="plan-price-grid">
                  <div class="min-w-0">
                    <label class="field-label" for="plan">Seu plano</label>
                    <div class="select-wrap"><select id="plan" v-model="form.planId" class="field-input" @change="changePlan"><optgroup v-for="category in categories" :key="category" :label="category"><option v-for="plan in plans.filter((item) => item.category === category)" :key="plan.id" :value="plan.id">{{ plan.name }}</option></optgroup></select></div>
                  </div>
                  <div class="min-w-0">
                    <label class="field-label" for="price">Mensalidade</label>
                    <div class="input-with-prefix"><span>R$</span><input id="price" v-model="form.price" class="field-input" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" /></div>
                  </div>
                </div>
                <p class="field-hint">{{ selectedPlan.priceStatus === 'not-available' ? 'Sem preço de referência: digite a mensalidade mostrada na sua conta.' : 'Valor de referência preenchido automaticamente. Ajuste conforme sua conta.' }}</p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div><label class="field-label" for="activation">Data da ativação</label><input id="activation" v-model="form.activation" class="field-input" type="date" /><p class="field-hint">Hoje, por padrão</p></div>
                <div><label class="field-label" for="renewal">Próxima renovação / fatura</label><input id="renewal" v-model="form.renewal" class="field-input" type="date" @input="changeRenewal" /><p class="field-hint">Consulte a data na sua conta Starlink.</p></div>
              </div>

              <div v-if="form.operation === 'change'"><label class="field-label" for="oldPrice">Mensalidade do plano anterior</label><div class="input-with-prefix"><span>R$</span><input id="oldPrice" v-model="form.oldPrice" class="field-input" type="number" min="0" step="0.01" inputmode="decimal" /></div></div>
            </div>

            <div class="mt-8 border-t border-white/10 pt-5">
              <button type="button" class="advanced-toggle flex w-full items-center justify-between gap-4 text-left" :aria-expanded="advancedOpen" aria-controls="advanced-fields" @click="advancedOpen = !advancedOpen">
                <span class="flex flex-col"><span class="text-[14px] font-medium text-zinc-100">Ajustes avançados</span><span class="mt-1 text-[12px] text-zinc-500">Franquia, horário e início do ciclo</span></span>
                <span class="plus-icon" :class="{ open: advancedOpen }" aria-hidden="true">+</span>
              </button>
              <div v-show="advancedOpen" id="advanced-fields" class="grid gap-5 pt-6 sm:grid-cols-2">
                <div><label class="field-label" for="quota">Franquia mensal (GB)</label><input id="quota" v-model="form.quota" class="field-input" type="number" min="0" step="0.1" inputmode="decimal" /><p class="field-hint">0 significa ilimitado.</p></div>
                <div><label class="field-label" for="dataMode">Regra da franquia</label><div class="select-wrap"><select id="dataMode" v-model="form.dataMode" class="field-input"><option value="proportional">Proporcional</option><option value="full">Integral</option><option value="unlimited">Ilimitada</option></select></div></div>
                <div><label class="field-label" for="activationTime">Hora da ativação (UTC)</label><input id="activationTime" v-model="form.activationTime" class="field-input" type="time" /><p class="field-hint">Fatura considerada às 00:00 UTC.</p></div>
                <div><label class="field-label" for="cycleStart">Início do ciclo</label><input id="cycleStart" v-model="form.cycleStart" class="field-input" type="date" /><p class="field-hint">Atualizado ao mudar a próxima fatura.</p></div>
              </div>
            </div>
          </div>

          <div class="panel result-panel lg:sticky lg:top-5">
            <div class="flex items-start justify-between gap-4"><div><span class="section-index">02 / ESTIMATIVA</span><h2 class="mt-2 text-[25px] font-medium tracking-[-.045em] sm:text-[29px]">Seu resultado</h2></div><span class="live-badge"><span></span> AO VIVO</span></div>

            <div class="amount-block mt-8 rounded-[18px] p-6 sm:p-7">
              <p class="text-[12px] font-medium tracking-[.07em] uppercase text-lime-200/80">{{ form.operation === 'change' ? 'Cobrança adicional estimada' : 'Cobrança proporcional estimada' }}</p>
              <p aria-live="polite" class="mt-3 text-[clamp(2.8rem,6vw,4.65rem)] leading-none font-medium tracking-[-.075em] text-white">{{ isValid ? currency.format(result.amount) : '—' }}</p>
              <p class="mt-4 text-[13px] text-zinc-300/80">{{ isValid ? `Até a próxima fatura em ${readableDate(form.renewal)}` : 'Preencha os campos para calcular' }}</p>
              <div class="mt-7 flex items-center justify-between text-[11px] text-zinc-400"><span>INÍCIO DO CICLO</span><span>FATURA</span></div>
              <div class="progress-track mt-2"><div class="progress-fill" :style="{ width: `${cyclePercentage}%` }"></div></div>
              <div class="mt-2 flex items-center justify-between text-[11px] text-zinc-400"><span>{{ readableDate(form.cycleStart) }}</span><span>{{ readableDate(form.renewal) }}</span></div>
            </div>

            <div class="result-grid mt-4 grid grid-cols-2 gap-3">
              <div class="result-tile"><span class="tile-label">Dados neste ciclo</span><strong class="tile-value">{{ currentData }}</strong><span class="tile-caption">{{ form.dataMode === 'full' ? 'Franquia integral' : form.dataMode === 'unlimited' || Number(form.quota) === 0 ? 'Sem limite de GB' : 'Franquia proporcional' }}</span></div>
              <div class="result-tile"><span class="tile-label">Tempo restante</span><strong class="tile-value">{{ isValid ? `${number.format(result.remainingDays)} dias` : '—' }}</strong><span class="tile-caption">Até a próxima fatura</span></div>
              <div class="result-tile"><span class="tile-label">Ciclo restante</span><strong class="tile-value">{{ isValid ? `${percent.format(result.fraction * 100)}%` : '—' }}</strong><span class="tile-caption">{{ isValid ? `De ${number.format(result.cycleDays)} dias` : 'Do período total' }}</span></div>
              <div class="result-tile"><span class="tile-label">Franquia no novo ciclo</span><strong class="tile-value">{{ nextData }}</strong><span class="tile-caption">Mensalidade cheia: {{ isValid ? currency.format(result.monthlyPrice) : '—' }}</span></div>
            </div>

            <div :class="['explanation mt-5', { 'explanation-error': !isValid }]">
              <span class="explanation-icon" aria-hidden="true">{{ isValid ? '↗' : '!' }}</span>
              <div v-if="!isValid" role="status" class="text-[13px] leading-6">{{ result.error }}</div>
              <div v-else class="text-[13px] leading-6">
                <strong class="font-semibold text-zinc-100">Como chegamos a esse valor</strong>
                <p class="mt-1 text-zinc-400">{{ form.operation === 'change' ? `Diferença de ${currency.format(Math.max(0, result.monthlyPrice - result.previousPrice))}` : currency.format(result.monthlyPrice) }} × {{ number.format(result.remainingDays) }} ÷ {{ number.format(result.cycleDays) }} dias.</p>
                <p v-if="result.isDecrease" class="mt-2 text-amber-200/90">Um plano mais barato pode começar apenas no próximo ciclo, sem crédito imediato.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="border-t border-white/10 py-10 sm:py-12">
          <div class="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-15">
            <div><span class="section-index">ANTES DE RETOMAR</span><h2 class="mt-2 text-[24px] font-medium tracking-[-.04em]">Uma estimativa clara.<br /><span class="text-zinc-500">A decisão é sua.</span></h2></div>
            <div class="grid gap-5 text-[13px] leading-6 text-zinc-400 sm:grid-cols-2 sm:gap-8">
              <p>O cálculo usa o tempo exato entre a ativação e a próxima fatura, dividido pela duração do ciclo. O horário considerado é <strong class="font-medium text-zinc-200">00:00 UTC</strong>.</p>
              <p>Preços, tributos, créditos e regras de migração podem variar. Confira os dados e a cobrança final no <a class="inline-link" href="https://starlink.com/br/service-plans" target="_blank" rel="noopener noreferrer">site da Starlink ↗</a> ou na sua conta antes de confirmar.</p>
            </div>
          </div>
          <p class="mt-8 text-[12px] leading-6 text-zinc-500">Planos e preços de referência em {{ readableDate(plansData.referenceDate) }}, migrados do simulador original. Esta ferramenta não é afiliada à Starlink.</p>
        </section>

        <section aria-labelledby="faq-title" class="border-t border-white/10 py-10 sm:py-12">
          <span class="section-index">DÚVIDAS FREQUENTES</span>
          <h2 id="faq-title" class="mt-2 text-[24px] font-medium tracking-[-.04em] sm:text-[28px]">Antes de reativar sua Starlink</h2>
          <div class="mt-7 grid gap-4 md:grid-cols-3">
            <article class="faq-card"><h3>Como é calculado o valor proporcional?</h3><p>A mensalidade é multiplicada pela fração do ciclo que resta entre a ativação e a próxima fatura. O resultado é uma estimativa.</p></article>
            <article class="faq-card"><h3>Onde encontro a próxima fatura?</h3><p>Confira a data na sua conta Starlink. Ela varia de pessoa para pessoa e fica salva neste navegador depois que você a informa.</p></article>
            <article class="faq-card"><h3>Posso simular só alguns dias de uso?</h3><p>Sim. Escolha a data em que pretende reativar o serviço para uma viagem e veja a estimativa até a próxima fatura.</p></article>
          </div>
        </section>
      </main>

      <footer class="flex flex-col gap-5 border-t border-white/10 py-7 text-[12px] leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ new Date().getFullYear() }} <a href="https://github.com/WenderGalan" target="_blank" rel="noopener noreferrer" class="footer-link">Wender Galan</a>. Direitos reservados, exceto os concedidos pela licença MIT.</p>
        <a :href="`${github}/issues/new`" target="_blank" rel="noopener noreferrer" class="footer-link inline-flex items-center gap-2">Tem uma sugestão? Abra uma issue <span aria-hidden="true">↗</span></a>
      </footer>
    </div>
  </div>
</template>
