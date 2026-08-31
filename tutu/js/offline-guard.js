;(function () {
	'use strict'

	window.__tutuPromoStartedAt = window.__tutuPromoStartedAt || performance.now()
	if (!window.__tutuPromoScriptRequested) {
		window.__tutuPromoScriptRequested = true
		var promoScript = document.createElement('script')
		promoScript.src = 'js/jubilee-promo.js?v=20260831-3'
		promoScript.async = true
		document.head.appendChild(promoScript)
	}

	// Для статичного экрана не нужна тяжёлая Next.js-гидратация (~2.5 МБ).
	// Оставляем только небольшие сценарии оформления и промо-блока.
	function isUnusedStaticScript(node) {
		if (!(node instanceof HTMLScriptElement) || !node.src) return false
		try {
			var url = new URL(node.src, location.href)
			if (url.origin !== location.origin || url.pathname.indexOf('/tutu/js/') === -1) return false
			var file = url.pathname.split('/').pop() || ''
			return !/^(?:offline-guard|env|theme-switcher|jubilee-promo)\.js$/i.test(file)
		} catch (_error) {
			return false
		}
	}

	new MutationObserver(function (records) {
		records.forEach(function (record) {
			record.addedNodes.forEach(function (node) {
				if (!isUnusedStaticScript(node)) return
				node.type = 'application/x-tutu-static'
				node.remove()
			})
		})
	}).observe(document.documentElement, { childList: true, subtree: true })

	function isExternal(url) {
		try {
			var u = new URL(url, location.href)
			if (u.protocol === 'data:' || u.protocol === 'blob:') return false
			return u.origin !== location.origin
		} catch (_e) {
			return true
		}
	}

	function mockBodyFor(url) {
		var mocks = window.__OFFLINE_MOCKS__ || {}
		try {
			var u = new URL(url, location.href)
			var hostPath = u.host + u.pathname.replace(/\/$/, '')
			if (mocks[hostPath] !== undefined) return JSON.stringify(mocks[hostPath])
			// prefix match: api-x.example.com/v2/data
			for (var key in mocks) {
				if (!Object.prototype.hasOwnProperty.call(mocks, key)) continue
				if (hostPath === key || hostPath.indexOf(key) === 0) {
					return JSON.stringify(mocks[key])
				}
			}
			if (u.host === 'api-x.example.com' && u.pathname.indexOf('/v2/data') === 0) {
				if (mocks['api-x.example.com/v2/data'] !== undefined) {
					return JSON.stringify(mocks['api-x.example.com/v2/data'])
				}
			}
		} catch (_e) {
			/* fall through */
		}
		return JSON.stringify({ ok: true, data: null, result: null, items: [] })
	}

	function stubResponse(url) {
		return new Response(mockBodyFor(url), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	window.dataLayer = window.dataLayer || { push: function () {} }

	var nativeFetch = window.fetch
	if (typeof nativeFetch === 'function') {
		window.fetch = function (input, init) {
			var url = typeof input === 'string' ? input : input && input.url
			if (isExternal(url)) return Promise.resolve(stubResponse(url))
			return nativeFetch.apply(this, arguments)
		}
	}

	var xhrOpen = XMLHttpRequest.prototype.open
	var xhrSend = XMLHttpRequest.prototype.send

	XMLHttpRequest.prototype.open = function (method, url) {
		this.__offlineExternal = isExternal(url)
		this.__offlineUrl = url
		// Не открываем реальный внешний URL — иначе запрос всё равно виден в Network.
		if (this.__offlineExternal) {
			return xhrOpen.call(this, method || 'GET', 'data:application/json,{}', true)
		}
		return xhrOpen.apply(this, arguments)
	}

	XMLHttpRequest.prototype.send = function (_body) {
		if (this.__offlineExternal) {
			var xhr = this
			var body = mockBodyFor(xhr.__offlineUrl || '')
			queueMicrotask(function () {
				Object.defineProperties(xhr, {
					readyState: { configurable: true, get: function () { return 4 } },
					status: { configurable: true, get: function () { return 200 } },
					statusText: { configurable: true, get: function () { return 'OK' } },
					responseText: { configurable: true, get: function () { return body } },
					response: { configurable: true, get: function () { return body } },
				})
				xhr.dispatchEvent(new Event('readystatechange'))
				xhr.dispatchEvent(new Event('load'))
				xhr.dispatchEvent(new Event('loadend'))
			})
			return
		}
		return xhrSend.apply(this, arguments)
	}

	if (navigator.sendBeacon) {
		var nativeBeacon = navigator.sendBeacon.bind(navigator)
		navigator.sendBeacon = function (url, data) {
			if (isExternal(url)) return true
			return nativeBeacon(url, data)
		}
	}

	function blockExternalUrl(value) {
		return typeof value === 'string' && value && isExternal(value)
	}

	var scriptSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')
	if (scriptSrc && scriptSrc.set) {
		Object.defineProperty(HTMLScriptElement.prototype, 'src', {
			configurable: true,
			get: scriptSrc.get,
			set: function (value) {
				if (blockExternalUrl(value)) return
				scriptSrc.set.call(this, value)
			},
		})
	}

	var iframeSrc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src')
	if (iframeSrc && iframeSrc.set) {
		Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
			configurable: true,
			get: iframeSrc.get,
			set: function (value) {
				if (blockExternalUrl(value)) return
				iframeSrc.set.call(this, value)
			},
		})
	}

	var origSetAttribute = Element.prototype.setAttribute
	Element.prototype.setAttribute = function (name, value) {
		if (
			(name === 'src' || name === 'href') &&
			(this.tagName === 'SCRIPT' || this.tagName === 'IFRAME') &&
			blockExternalUrl(value)
		) {
			return
		}
		return origSetAttribute.call(this, name, value)
	}
})()
