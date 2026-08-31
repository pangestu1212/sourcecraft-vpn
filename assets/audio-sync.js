(() => {
	'use strict'

	if (window.__tutuFastAudioInstalled || typeof window.Audio !== 'function') return
	window.__tutuFastAudioInstalled = true

	const NativeAudio = window.Audio
	const nativePlay = window.HTMLMediaElement.prototype.play
	const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null
	const soundBase = `${window.location.origin}/v/muzic/`
	const poolSizes = {
		'spin2.wav': 14,
		'ui_click.wav': 4,
		'lose.wav': 2,
		'finalWin.wav': 2,
		'3rep.wav': 2,
	}
	const knownSoundNames = [...Object.keys(poolSizes), 'official.wav']
	const pools = new Map()
	const cursors = new Map()

	function soundName(value) {
		if (!value) return ''
		try {
			const pathname = new URL(String(value), window.location.href).pathname
			for (const name of knownSoundNames) {
				if (pathname.endsWith(`/muzic/${name}`)) return name
			}
		} catch {
			// Обычный Audio обработает неизвестный или некорректный адрес.
		}
		return ''
	}

	if (nativeFetch) {
		const fastPreloadFetch = (input, init) => {
			const url = typeof input === 'string' ? input : input?.url
			if (init?.cache === 'force-cache' && soundName(url)) {
				nativeFetch(input, init).catch(() => {})
				return Promise.resolve(new Response('', { status: 200 }))
			}
			return nativeFetch(input, init)
		}
		window.fetch = fastPreloadFetch
		window.setTimeout(() => {
			if (window.fetch === fastPreloadFetch) window.fetch = nativeFetch
		}, 5000)
	}

	function makeQuickReady(audio) {
		if (audio.__tutuQuickReady) return audio
		audio.__tutuQuickReady = true
		const nativeLoad = audio.load.bind(audio)
		audio.load = function quickLoad() {
			nativeLoad()
			queueMicrotask(() => audio.dispatchEvent(new Event('canplay')))
		}
		return audio
	}

	function makeAudio(name) {
		const audio = new NativeAudio(`${soundBase}${name}`)
		audio.preload = 'auto'
		const nativeLoad = audio.load.bind(audio)
		makeQuickReady(audio)
		nativeLoad()
		return audio
	}

	for (const [name, size] of Object.entries(poolSizes)) {
		pools.set(name, Array.from({ length: size }, () => makeAudio(name)))
		cursors.set(name, 0)
	}

	function takePooledAudio(name) {
		const pool = pools.get(name)
		if (!pool?.length) return null
		const start = cursors.get(name) || 0
		let selected = pool[start % pool.length]

		for (let offset = 0; offset < pool.length; offset += 1) {
			const candidate = pool[(start + offset) % pool.length]
			if (candidate.paused || candidate.ended) {
				selected = candidate
				cursors.set(name, start + offset + 1)
				return selected
			}
		}

		cursors.set(name, start + 1)
		return selected
	}

	function FastAudio(src) {
		const name = soundName(src)
		if (name) {
			const pooled = takePooledAudio(name)
			if (pooled) return pooled
		}
		return src === undefined ? new NativeAudio() : new NativeAudio(src)
	}

	FastAudio.prototype = NativeAudio.prototype
	Object.setPrototypeOf(FastAudio, NativeAudio)
	window.Audio = FastAudio

	window.HTMLMediaElement.prototype.play = function playWithoutDelay() {
		const src = this.currentSrc || this.src || ''
		const name = soundName(src)

		// В исходном spin2.wav первые ~121 мс — тишина.
		if (name === 'spin2.wav' && this.readyState >= 1 && this.currentTime < 0.1) {
			try {
				this.currentTime = 0.115
			} catch {
				// На отдельных версиях Safari позиция станет доступна чуть позже.
			}
		}

		const result = nativePlay.call(this)
		if (String(src).startsWith('data:audio/wav;base64,') && result?.catch) {
			result.catch(() => {})
			return Promise.resolve()
		}
		return result
	}

	let gestureUnlocked = false
	function unlockOnGesture() {
		if (gestureUnlocked) return
		gestureUnlocked = true

		const silent = new NativeAudio()
		silent.volume = 0.001
		silent.src =
			'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
		try {
			const result = nativePlay.call(silent)
			result?.then(() => silent.pause()).catch(() => {})
		} catch {
			// Следующий пользовательский жест повторно разблокирует звук в приложении.
		}
	}

	document.addEventListener('pointerdown', unlockOnGesture, { capture: true, passive: true })
	document.addEventListener('touchend', unlockOnGesture, { capture: true, passive: true })
})()
