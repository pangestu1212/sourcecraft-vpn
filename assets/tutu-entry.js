const ENTRY_SESSION_KEY = 'tutu_entry_passed_v1'
const START_MESSAGE = 'tutu-entry:start-survey'
const INTERACTIVE_DELAY_MS = 4800

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
	const params = new URLSearchParams(window.location.search)
	if (params.get('clean') === 'all') return false
	return hasPassedEntry()
}

function mountTutuEntry() {
	if (shouldSkipEntry() || document.querySelector('.tutu-entry-overlay')) return

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
		window.setTimeout(() => overlay.remove(), 430)
	}

	window.addEventListener('message', finish)
}

mountTutuEntry()
