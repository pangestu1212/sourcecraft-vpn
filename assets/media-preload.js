;(function () {
	'use strict'

	if (window.__tutuMediaPreloadInstalled) return
	window.__tutuMediaPreloadInstalled = true

	var criticalMedia = [
		'cards/survey-promo.png',
		'prise/nothing.png',
		'prise/notPrize.png',
		'prise/finalPrize.png',
		'prise/photo.png',
		'prise/money.png',
		'prise/bonus.png',
		'prise/bonus-red.png',
		'linz.png',
		'loader.png',
		'prize.png',
		'prizeA.png',
		'prizeMain.png',
		'surveyCompletePrize.png',
	]
	var warmImages = []

	function optimizedSource(value) {
		if (typeof value !== 'string') return value
		return value.replace(/\/cards\/survey-promo\.svg(?=([?#]|$))/, '/cards/survey-promo.png')
	}

	var srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
	if (srcDescriptor && srcDescriptor.set) {
		Object.defineProperty(HTMLImageElement.prototype, 'src', {
			configurable: true,
			enumerable: srcDescriptor.enumerable,
			get: srcDescriptor.get,
			set: function (value) {
				srcDescriptor.set.call(this, optimizedSource(value))
			},
		})
	}

	var nativeSetAttribute = Element.prototype.setAttribute
	Element.prototype.setAttribute = function (name, value) {
		if (this instanceof HTMLImageElement && String(name).toLowerCase() === 'src') {
			return nativeSetAttribute.call(this, name, optimizedSource(value))
		}
		return nativeSetAttribute.apply(this, arguments)
	}

	function watchImage(img) {
		if (!(img instanceof HTMLImageElement) || img.dataset.tutuMediaReady === '1') return
		img.dataset.tutuMediaReady = '1'
		img.decoding = 'async'

		var optimized = optimizedSource(img.getAttribute('src') || '')
		if (optimized && optimized !== img.getAttribute('src')) img.setAttribute('src', optimized)

		img.addEventListener('error', function () {
			if (img.dataset.tutuMediaRetried === '1') return
			var current = img.currentSrc || img.src
			if (!current) return
			try {
				var retryUrl = new URL(current, window.location.href)
				if (retryUrl.origin !== window.location.origin) return
				img.dataset.tutuMediaRetried = '1'
				retryUrl.searchParams.set('media_retry', String(Date.now()))
				img.src = retryUrl.href
			} catch (_error) {
				// Некорректный внешний URL оставляем без повторного запроса.
			}
		})
	}

	function scanImages(root) {
		if (root instanceof HTMLImageElement) watchImage(root)
		if (root && root.querySelectorAll) root.querySelectorAll('img').forEach(watchImage)
	}

	new MutationObserver(function (records) {
		records.forEach(function (record) {
			record.addedNodes.forEach(scanImages)
		})
	}).observe(document.documentElement, { childList: true, subtree: true })

	function preloadCriticalMedia() {
		criticalMedia.forEach(function (path) {
			var image = new Image()
			image.decoding = 'async'
			image.src = new URL(path, document.baseURI).href
			warmImages.push(image)
		})
		window.setTimeout(function () {
			warmImages.length = 0
		}, 30000)
	}

	if (document.readyState === 'complete') {
		window.setTimeout(preloadCriticalMedia, 0)
	} else {
		window.addEventListener('load', function () {
			window.setTimeout(preloadCriticalMedia, 0)
		}, { once: true })
	}
})()
