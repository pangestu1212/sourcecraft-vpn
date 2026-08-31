const DEFAULT_GEO_ENDPOINT = 'https://api.country.is/'
const GEO_TIMEOUT_MS = 8000
const MIN_CHECK_ANIMATION_MS = 1850
const SUCCESS_REDIRECT_DELAY_MS = 1700

const root = document.getElementById('root')

let geoEndpoint = DEFAULT_GEO_ENDPOINT
let initialCheckPromise = null
let operatorDetected = false
let operatorWasPending = false
let overlay = null
let stage = null
let currentView = null
let transitionId = 0
let debugCheckIndex = 0

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

function iconX(size = 22) {
	return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`
}

function iconCheck(size = 22) {
	return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19.5 6.8" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

function iconRefresh() {
	return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19.4 8.5A8 8 0 1 0 20 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.5 4.5v4.7h-4.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}

function iconButtonCheck() {
	return `<svg width="25" height="25" viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="10.5" stroke="currentColor" stroke-width="2"/><path d="m8.5 13 3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

function shieldIcon() {
	return '<div class="vpn-gate-shield" aria-hidden="true"><svg viewBox="0 0 108 108" fill="none"><defs><linearGradient id="vpn-shield-gradient" x1="21" y1="12" x2="84" y2="95" gradientUnits="userSpaceOnUse"><stop stop-color="#4d45e7"/><stop offset="1" stop-color="#11106f"/></linearGradient></defs><path d="M54 7 95 23l-6.6 53.1L54 104 19.6 76.1 13 23 54 7Z" fill="url(#vpn-shield-gradient)"/><rect x="37" y="48" width="34" height="29" rx="5" stroke="white" stroke-width="3"/><path d="M43 48v-7.5a11 11 0 0 1 22 0V48" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="54" cy="62" r="2.7" fill="white"/></svg></div>'
}

function resultIcon(success = false) {
	return `<div class="vpn-gate-result-icon${success ? ' vpn-gate-result-icon--success' : ''}" aria-hidden="true">${success ? iconCheck(37) : iconX(42)}</div>`
}

function statusMarkup(kind, label) {
	const icon = kind === 'success' ? iconCheck(18) : kind === 'checking' ? '&hellip;' : iconX(18)
	return `<div class="vpn-gate-status vpn-gate-status--${kind}" role="status"><span class="vpn-gate-status-icon">${icon}</span><span>${label}</span></div>`
}

function stepsMarkup(secondLine) {
	return `<div class="vpn-gate-steps"><div class="vpn-gate-step"><span class="vpn-gate-step-mark">1</span><span>Включите VPN на устройстве</span></div><div class="vpn-gate-step"><span class="vpn-gate-step-mark">2</span><span>${secondLine}</span></div></div>`
}

function buttonMarkup(label, icon, disabled = false, spinning = disabled) {
	return `<button class="vpn-gate-button" type="button" data-vpn-action="check"${disabled ? ' disabled aria-disabled="true"' : ''}><span class="vpn-gate-button-icon${spinning ? ' vpn-gate-button-icon--spin' : ''}">${icon}</span><span class="vpn-gate-button-label">${label}</span><span aria-hidden="true"></span></button>`
}

function renderConnect() {
	return `<section class="vpn-gate-view" data-vpn-view="connect"><div class="vpn-gate-hero">${shieldIcon()}</div><h2 class="vpn-gate-title" id="vpn-gate-title">Подключите VPN</h2><p class="vpn-gate-copy">Для корректного продолжения получения выигрыша необходимо включить VPN.</p>${statusMarkup('error', 'VPN не подключён')}${stepsMarkup('Вернитесь и нажмите кнопку проверки подключения')}${buttonMarkup('Проверить подключение', iconButtonCheck())}<p class="vpn-gate-note">После успешной проверки переход к оператору произойдёт автоматически.</p></section>`
}

function renderChecking() {
	return `<section class="vpn-gate-view" data-vpn-view="checking"><div class="vpn-gate-hero"><div class="vpn-gate-check-orbit" aria-hidden="true"><span class="vpn-gate-check-orbit-center">${iconCheck(20)}</span></div></div><h2 class="vpn-gate-title" id="vpn-gate-title">Проверяем VPN</h2><p class="vpn-gate-copy">Определяем статус подключения.<br>Это займёт несколько секунд.</p>${statusMarkup('checking', 'Проверяем соединение…')}<div class="vpn-gate-progress" role="progressbar" aria-label="Проверка подключения" aria-valuemin="0" aria-valuemax="100" aria-valuenow="7"><div class="vpn-gate-progress-fill"></div></div><p class="vpn-gate-progress-label">Проверка подключения — <span data-vpn-progress-label>7%</span></p><div class="vpn-gate-steps"><div class="vpn-gate-step" data-vpn-check-step="connection"><span class="vpn-gate-step-mark vpn-gate-step-mark--pending"></span><span>Проверяем соединение</span></div><div class="vpn-gate-step" data-vpn-check-step="operator"><span class="vpn-gate-step-mark">2</span><span>Проверяем доступ к оператору</span></div></div>${buttonMarkup('Проверка подключения…', '<span class="vpn-gate-step-mark vpn-gate-step-mark--pending"></span>', true)}<p class="vpn-gate-note">Не закрывайте и не обновляйте страницу.</p></section>`
}

function renderFailed() {
	return `<section class="vpn-gate-view" data-vpn-view="failed"><div class="vpn-gate-hero">${resultIcon(false)}</div><h2 class="vpn-gate-title" id="vpn-gate-title">VPN не подключён</h2><p class="vpn-gate-copy">Проверка подключения не пройдена.<br>Включите VPN и повторите попытку.</p>${statusMarkup('error', 'Соединение не обнаружено')}${stepsMarkup('Вернитесь на эту страницу и повторите проверку')}${buttonMarkup('Проверить снова', iconRefresh())}<p class="vpn-gate-note">Переход к оператору станет доступен после успешной проверки соединения.</p></section>`
}

function renderError() {
	return `<section class="vpn-gate-view" data-vpn-view="error"><div class="vpn-gate-hero">${resultIcon(false)}</div><h2 class="vpn-gate-title" id="vpn-gate-title">Не удалось проверить VPN</h2><p class="vpn-gate-copy">Сервис проверки временно недоступен.<br>Проверьте интернет и повторите попытку.</p>${statusMarkup('error', 'Ошибка проверки соединения')}${stepsMarkup('Вернитесь на эту страницу и повторите проверку')}${buttonMarkup('Повторить проверку', iconRefresh())}<p class="vpn-gate-note">Без подтверждения геолокации переход к оператору недоступен.</p></section>`
}

function renderSuccess() {
	return `<section class="vpn-gate-view" data-vpn-view="success"><div class="vpn-gate-hero">${resultIcon(true)}</div><h2 class="vpn-gate-title" id="vpn-gate-title">VPN подключён</h2><p class="vpn-gate-copy">Проверка успешно пройдена.<br>Соединяем вас с оператором.</p>${statusMarkup('success', 'Соединение обнаружено')}<div class="vpn-gate-progress" role="progressbar" aria-label="Проверка завершена" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="vpn-gate-progress-fill" style="--vpn-progress: 100%"></div></div>${buttonMarkup('Переходим к оператору…', '<span class="vpn-gate-step-mark vpn-gate-step-mark--done">' + iconCheck(17) + '</span>', true, false)}<p class="vpn-gate-note">Переход произойдёт автоматически.</p></section>`
}

const renderers = {
	connect: renderConnect,
	checking: renderChecking,
	failed: renderFailed,
	error: renderError,
	success: renderSuccess,
}

function emitState(state, details = {}) {
	window.dispatchEvent(new CustomEvent('vpn-gate:state', { detail: { state, ...details } }))
}

function updateStageHeight(view) {
	if (!stage || !view) return
	stage.style.height = `${view.scrollHeight}px`
}

async function showView(name, immediate = false) {
	if (!stage || !renderers[name]) return
	const ownTransition = ++transitionId
	const previous = currentView

	if (previous && !immediate) {
		previous.classList.remove('is-entered')
		previous.classList.add('is-leaving')
		await wait(170)
		if (ownTransition !== transitionId) return
	}

	stage.innerHTML = renderers[name]()
	currentView = stage.firstElementChild
	updateStageHeight(currentView)
	emitState(name)

	window.requestAnimationFrame(() => {
		if (ownTransition !== transitionId || !currentView) return
		currentView.classList.add('is-entered')
		updateStageHeight(currentView)
	})
}

function createGate(initialView) {
	if (overlay) return
	clearPendingOperator()

	overlay = document.createElement('div')
	overlay.className = 'vpn-gate-overlay'
	overlay.setAttribute('role', 'dialog')
	overlay.setAttribute('aria-modal', 'true')
	overlay.setAttribute('aria-labelledby', 'vpn-gate-title')
	overlay.setAttribute('tabindex', '-1')
	overlay.innerHTML = '<div class="vpn-gate-card"><div class="vpn-gate-stage" aria-live="polite"></div></div>'
	stage = overlay.querySelector('.vpn-gate-stage')
	document.body.appendChild(overlay)
	document.documentElement.classList.add('vpn-gate-lock')
	if (root) {
		root.inert = true
		root.setAttribute('aria-hidden', 'true')
	}

	overlay.addEventListener('click', (event) => {
		const action = event.target.closest?.('[data-vpn-action="check"]')
		if (action && !action.disabled) runManualCheck()
	})

	showView(initialView, true)
	window.requestAnimationFrame(() => {
		overlay?.classList.add('is-visible')
		overlay?.focus({ preventScroll: true })
	})
}

function releaseGate() {
	clearPendingOperator()
	if (root) {
		root.inert = false
		root.removeAttribute('aria-hidden')
	}
	document.documentElement.classList.remove('vpn-gate-lock')
	if (!overlay) return
	overlay.classList.remove('is-visible')
	const oldOverlay = overlay
	overlay = null
	stage = null
	currentView = null
	window.setTimeout(() => oldOverlay.remove(), 380)
	emitState('operator')
}

function setProgress(percent) {
	if (!currentView) return
	const value = Math.max(0, Math.min(100, Math.round(percent)))
	const fill = currentView.querySelector('.vpn-gate-progress-fill')
	const progress = currentView.querySelector('[role="progressbar"]')
	const label = currentView.querySelector('[data-vpn-progress-label]')
	if (fill) fill.style.setProperty('--vpn-progress', `${value}%`)
	if (progress) progress.setAttribute('aria-valuenow', String(value))
	if (label) label.textContent = `${value}%`
}

function markConnectionStepDone() {
	if (!currentView) return
	const first = currentView.querySelector('[data-vpn-check-step="connection"]')
	const second = currentView.querySelector('[data-vpn-check-step="operator"]')
	if (first) {
		first.querySelector('.vpn-gate-step-mark').className = 'vpn-gate-step-mark vpn-gate-step-mark--done'
		first.querySelector('.vpn-gate-step-mark').innerHTML = iconCheck(17)
		first.querySelector('span:last-child').textContent = 'Соединение обнаружено'
	}
	if (second) {
		second.querySelector('.vpn-gate-step-mark').className = 'vpn-gate-step-mark vpn-gate-step-mark--pending'
	}
}

async function runManualCheck() {
	if (!overlay || currentView?.dataset.vpnView === 'checking') return
	const checkStartedAt = performance.now()
	const lookup = checkCountry()
	await showView('checking')

	window.requestAnimationFrame(() => setProgress(32))
	window.setTimeout(() => setProgress(58), 480)
	window.setTimeout(() => {
		markConnectionStepDone()
		setProgress(72)
	}, 880)
	window.setTimeout(() => setProgress(88), 1350)

	const result = await lookup
	const elapsed = performance.now() - checkStartedAt
	if (elapsed < MIN_CHECK_ANIMATION_MS) await wait(MIN_CHECK_ANIMATION_MS - elapsed)
	setProgress(100)
	await wait(240)

	if (result.ok && result.country !== 'RU') {
		await showView('success')
		emitState('success', { country: result.country })
		await wait(SUCCESS_REDIRECT_DELAY_MS)
		releaseGate()
		return
	}

	await showView(result.ok ? 'failed' : 'error')
	emitState(result.ok ? 'failed' : 'error', {
		country: result.country || null,
		reason: result.reason || null,
	})
}

function getDebugCountries() {
	if (!['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) return null
	const raw = new URLSearchParams(window.location.search).get('vpnTest')
	if (!raw) return null
	return raw.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean)
}

async function readGeoEndpoint() {
	try {
		const configUrl = new URL('site-config.json', document.baseURI)
		const response = await fetch(configUrl, { cache: 'no-store' })
		if (!response.ok) return
		const config = await response.json()
		const configured = String(config?.constants?.VPN_GEO_ENDPOINT || '').trim()
		if (!configured) return
		const url = new URL(configured, window.location.origin)
		if (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost')) {
			geoEndpoint = url.href
		}
	} catch {
		// Используем безопасный HTTPS-адрес по умолчанию.
	}
}

async function checkCountry() {
	const debugCountries = getDebugCountries()
	if (debugCountries?.length) {
		const value = debugCountries[Math.min(debugCheckIndex, debugCountries.length - 1)]
		debugCheckIndex += 1
		await wait(180)
		if (value === 'ERROR') return { ok: false, reason: 'debug-error' }
		return { ok: true, country: value, ip: '127.0.0.1' }
	}

	const controller = new AbortController()
	const timeoutId = window.setTimeout(() => controller.abort(), GEO_TIMEOUT_MS)
	try {
		const url = new URL(geoEndpoint)
		url.searchParams.set('_vpn_check', String(Date.now()))
		const response = await fetch(url, {
			method: 'GET',
			cache: 'no-store',
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		})
		if (!response.ok) return { ok: false, reason: `http-${response.status}` }
		const data = await response.json()
		const country = String(data?.country || data?.country_code || '').trim().toUpperCase()
		if (!/^[A-Z]{2}$/.test(country)) return { ok: false, reason: 'invalid-response' }
		return { ok: true, country, ip: String(data?.ip || '') }
	} catch (error) {
		return { ok: false, reason: error?.name === 'AbortError' ? 'timeout' : 'network' }
	} finally {
		window.clearTimeout(timeoutId)
	}
}

function ensureInitialCheck() {
	if (!initialCheckPromise) {
		initialCheckPromise = Promise.resolve(readGeoEndpoint()).then(checkCountry)
	}
	return initialCheckPromise
}

function showPendingOperator() {
	if (operatorWasPending) return
	operatorWasPending = true
	document.documentElement.classList.add('vpn-gate-operator-pending')
	if (root) root.inert = true
	const pending = document.createElement('div')
	pending.className = 'vpn-gate-pending'
	pending.setAttribute('aria-label', 'Проверяем доступ')
	pending.setAttribute('aria-busy', 'true')
	pending.innerHTML = '<span></span>'
	document.body.appendChild(pending)
}

function clearPendingOperator() {
	operatorWasPending = false
	document.documentElement.classList.remove('vpn-gate-operator-pending')
	document.querySelector('.vpn-gate-pending')?.remove()
	if (root && !overlay) root.inert = false
}

function hasText(selector, expected) {
	return [...document.querySelectorAll(selector)].some((element) => element.textContent?.trim() === expected)
}

function inspectApp() {
	if (!initialCheckPromise && hasText('h2', 'Соединение с оператором')) {
		ensureInitialCheck()
	}

	if (operatorDetected || !hasText('h1', 'Свяжитесь с оператором')) return
	operatorDetected = true
	const check = ensureInitialCheck()
	showPendingOperator()

	check.then((result) => {
		if (result.ok && result.country !== 'RU') {
			clearPendingOperator()
			emitState('operator', { country: result.country })
			return
		}
		createGate(result.ok ? 'connect' : 'error')
		emitState(result.ok ? 'connect' : 'error', {
			country: result.country || null,
			reason: result.reason || null,
		})
	})
}

const observer = new MutationObserver(inspectApp)
observer.observe(document.body, { childList: true, subtree: true })
inspectApp()
