const ENTRY_SESSION_KEY = 'tutu_entry_passed_v1'
const START_MESSAGE = 'tutu-entry:start-survey'
const INTERACTIVE_DELAY_MS = 4800
const AUDIO_SCRIPT_PATH = 'assets/audio-sync.js'
const APP_SCRIPT_PATH = '/v/assets/index-JnVuQhkd.js'

let appLoadStarted = false

function consumeCleanAllParam() {
	const params = new URLSearchParams(window.location.search)
	if (params.get('clean') !== 'all') return false

	try {
		window.localStorage.clear()
		window.sessionStorage.clear()
	} catch {
		// Хранилище может быть недоступно в приватном режиме.
	}

	params.delete('clean')
	const query = params.toString()
	const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
	window.history.replaceState(window.history.state, '', cleanUrl)
	return true
}

const forceEntry = consumeCleanAllParam()

function loadApp() {
	if (appLoadStarted) return
	appLoadStarted = true

	const startMainBundle = () => {
		if (document.querySelector('script[data-tutu-main-app]')) return
		const appScript = document.createElement('script')
		appScript.type = 'module'
		appScript.src = APP_SCRIPT_PATH
		appScript.crossOrigin = 'anonymous'
		appScript.dataset.tutuMainApp = 'true'
		document.head.appendChild(appScript)
	}

	const audioScript = document.createElement('script')
	audioScript.src = new URL(AUDIO_SCRIPT_PATH, document.baseURI).href
	audioScript.dataset.tutuAudioSync = 'true'
	audioScript.addEventListener('load', startMainBundle, { once: true })
	audioScript.addEventListener('error', startMainBundle, { once: true })
	document.head.appendChild(audioScript)
}

function hasPassedEntry() {
	try {
		return window.sessionStorage.getItem(ENTRY_SESSION_KEY) === '1'
	} catch {
		return false
	}
}

function rememberEntryPassed() {
	try {
		window.sessionStorage.setItem(ENTRY_SESSION_KEY, '1')
	} catch {
		// Продолжаем без сохранения состояния, если storage недоступен.
	}
}

function shouldSkipEntry() {
	return !forceEntry && hasPassedEntry()
}

function mountTutuEntry() {
	if (shouldSkipEntry()) {
		loadApp()
		return
	}
	if (document.querySelector('.tutu-entry-overlay')) return

	document.getElementById('bp-page-loader')?.remove()

	const overlay = document.createElement('div')
	overlay.className = 'tutu-entry-overlay'
	overlay.setAttribute('role', 'region')
	overlay.setAttribute('aria-label', 'Стартовая страница Tutu')

	const loader = document.createElement('div')
	loader.className = 'tutu-entry-loader'
	loader.setAttribute('aria-hidden', 'true')

	const frame = document.createElement('iframe')
	frame.className = 'tutu-entry-frame'
	frame.src = new URL('tutu/index.html', document.baseURI).href
	frame.title = 'Tutu — юбилейная акция'
	frame.setAttribute('allow', 'none')

	overlay.append(loader, frame)
	document.body.appendChild(overlay)
	document.documentElement.classList.add('tutu-entry-lock')

	frame.addEventListener('load', () => {
		overlay.classList.add('is-loaded')
	})

	window.setTimeout(() => {
		overlay.classList.add('is-interactive')
	}, INTERACTIVE_DELAY_MS)

	const finish = (event) => {
		if (event.origin !== window.location.origin) return
		if (event.source !== frame.contentWindow) return
		if (event.data?.type !== START_MESSAGE) return

		window.removeEventListener('message', finish)
		rememberEntryPassed()
		overlay.classList.add('is-leaving')
		document.documentElement.classList.remove('tutu-entry-lock')
		window.setTimeout(() => {
			overlay.remove()
			loadApp()
		}, 430)
	}

	window.addEventListener('message', finish)
}

mountTutuEntry()
