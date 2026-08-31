const ENTRY_SESSION_KEY = 'tutu_entry_passed_v1'
const AUDIO_SCRIPT_PATH = 'assets/audio-sync.js?v=20260831-3'
const APP_SCRIPT_PATH = '/v/assets/index-JnVuQhkd.js'

let appLoadStarted = false

function readParams() {
	return new URLSearchParams(window.location.search)
}

function replaceCurrentQuery(params) {
	const query = params.toString()
	const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
	window.history.replaceState(window.history.state, '', cleanUrl)
}

function clearLocalState() {
	try {
		window.localStorage.clear()
		window.sessionStorage.clear()
	} catch {
		// Хранилище может быть недоступно в приватном режиме.
	}
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
		// Параметр URL остаётся запасным подтверждением перехода.
	}
}

function prepareEntryState() {
	const params = readParams()
	const forceEntry = params.get('clean') === 'all'
	const returnedFromTutu = params.get('tutu') === 'passed'

	if (forceEntry) clearLocalState()
	if (returnedFromTutu) rememberEntryPassed()

	if (forceEntry || returnedFromTutu) {
		params.delete('clean')
		params.delete('tutu')
		params.delete('build')
		replaceCurrentQuery(params)
	}

	return { forceEntry, returnedFromTutu }
}

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

function openTutuPage() {
	const tutuUrl = new URL('tutu/index.html', document.baseURI)
	tutuUrl.searchParams.set('entry', '1')
	tutuUrl.searchParams.set('build', '20260831-3')
	window.location.replace(tutuUrl.href)
}

const { forceEntry, returnedFromTutu } = prepareEntryState()

if (!forceEntry && (returnedFromTutu || hasPassedEntry())) {
	loadApp()
} else {
	openTutuPage()
}
