/**
 * Jubilee promo modal on static tutu landing.
 * Shows shortly after the static page appears; CTA returns to the survey application.
 */
(function () {
	'use strict'

	if (window.__tutuPromoInstalled) return
	window.__tutuPromoInstalled = true

	var DELAY_MS = 1800
	var startedAt = window.__tutuPromoStartedAt || performance.now()
	var ASSET = 'images/jubilee-promo/'
	var surveyBase = new URL('../', window.location.href)

	function asset(name) {
		return ASSET + name
	}

	function lockScroll(lock) {
		if (lock) {
			document.documentElement.style.overflow = 'hidden'
			document.body.style.overflow = 'hidden'
		} else {
			document.documentElement.style.overflow = ''
			document.body.style.overflow = ''
		}
	}

	function buildModal() {
		var root = document.createElement('div')
		root.className = 'tutu-promo-overlay'
		root.id = 'tutu-jubilee-promo'
		root.setAttribute('role', 'dialog')
		root.setAttribute('aria-modal', 'true')
		root.setAttribute('aria-labelledby', 'tutu-promo-title')
		root.setAttribute('aria-hidden', 'true')

		root.innerHTML =
			'<div class="tutu-promo-wrap">' +
			'<span class="tutu-promo-spark tutu-promo-spark--a" aria-hidden="true"></span>' +
			'<span class="tutu-promo-spark tutu-promo-spark--b" aria-hidden="true"></span>' +
			'<span class="tutu-promo-spark tutu-promo-spark--c" aria-hidden="true"></span>' +
			'<span class="tutu-promo-spark tutu-promo-spark--d" aria-hidden="true"></span>' +
			'<span class="tutu-promo-spark tutu-promo-spark--e" aria-hidden="true"></span>' +
			'<span class="tutu-promo-spark tutu-promo-spark--f" aria-hidden="true"></span>' +
			'<div class="tutu-promo-glow" aria-hidden="true"></div>' +
			'<div class="tutu-promo-badge" aria-hidden="true">' +
			'<div class="tutu-promo-badge__ring"></div>' +
			'<div class="tutu-promo-badge__fill"></div>' +
			'<div class="tutu-promo-badge__stroke"></div>' +
			'<img class="tutu-promo-badge__logo" src="' +
			asset('tutu-logo.svg') +
			'" alt="">' +
			'<span class="tutu-promo-badge__dot tutu-promo-badge__dot--y"></span>' +
			'<span class="tutu-promo-badge__dot tutu-promo-badge__dot--p"></span>' +
			'</div>' +
			'<div class="tutu-promo-card">' +
			'<div class="tutu-promo-card__tint" aria-hidden="true"></div>' +
			'<div class="tutu-promo-content">' +
			'<div class="tutu-promo-pill">' +
			'<img src="' +
			asset('badge-icon.svg') +
			'" alt="">' +
			'<span>Празднуем вместе</span>' +
			'</div>' +
			'<h2 class="tutu-promo-title" id="tutu-promo-title">Юбилейная акция</h2>' +
			'<div class="tutu-promo-years">' +
			'<span>Нам 22 года</span>' +
			'<img src="' +
			asset('tutu-sparks.svg') +
			'" alt="">' +
			'</div>' +
			'<p class="tutu-promo-lead">Ответь на 5 лёгких вопросов</p>' +
			'<p class="tutu-promo-sub">и получи возможность выиграть</p>' +
			'<div class="tutu-promo-prize">' +
			'<span class="tutu-promo-prize__blob tutu-promo-prize__blob--tl" aria-hidden="true"></span>' +
			'<span class="tutu-promo-prize__blob tutu-promo-prize__blob--br" aria-hidden="true"></span>' +
			'<span class="tutu-promo-prize__star tutu-promo-prize__star--y" aria-hidden="true"></span>' +
			'<span class="tutu-promo-prize__star tutu-promo-prize__star--p" aria-hidden="true"></span>' +
			'<p class="tutu-promo-prize__label">Выигрыш от</p>' +
			'<p class="tutu-promo-prize__amount">6&nbsp;500&nbsp;₽</p>' +
			'</div>' +
			'<div class="tutu-promo-check">' +
			'<img src="' +
			asset('check-icon.svg') +
			'" alt="">' +
			'<span>Всего 5 простых вопросов</span>' +
			'</div>' +
			'<button type="button" class="tutu-promo-cta" data-tutu-promo-cta>' +
			'<span>Пройти опрос</span>' +
			'<span class="tutu-promo-cta__arrow"><img src="' +
			asset('cta-arrow.svg') +
			'" alt=""></span>' +
			'</button>' +
			'<p class="tutu-promo-hint">Нажми кнопку, чтобы начать</p>' +
			'<div class="tutu-promo-route" aria-hidden="true">' +
			'<img class="tutu-promo-route__dash" src="' +
			asset('footer-dash.svg') +
			'" alt="">' +
			'<span class="tutu-promo-route__dot"></span>' +
			'<img class="tutu-promo-route__plane" src="' +
			asset('footer-plane.svg') +
			'" alt="">' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>'

		return root
	}

	function openModal(root) {
		root.classList.add('is-open')
		root.setAttribute('aria-hidden', 'false')
		lockScroll(true)
	}

	function addPreload(href, relation, as) {
		if (document.querySelector('link[href="' + href + '"]')) return
		var link = document.createElement('link')
		link.rel = relation
		link.href = href
		if (as) link.as = as
		document.head.appendChild(link)
	}

	function warmSurveyApp() {
		addPreload(new URL('assets/index-JnVuQhkd.js', surveyBase).href, 'modulepreload')
		addPreload(new URL('assets/audio-sync.js?v=20260831-3', surveyBase).href, 'preload', 'script')
		addPreload(new URL('assets/index-8neEUSzV.css', surveyBase).href, 'preload', 'style')

		if (typeof window.fetch !== 'function') return
		;[
			'muzic/official.wav',
			'muzic/spin2.wav',
			'muzic/ui_click.wav',
			'muzic/finalWin.wav',
			'muzic/lose.wav',
			'muzic/3rep.wav',
			'cards/survey-promo.png',
			'prise/nothing.png',
			'prise/notPrize.png',
			'prise/finalPrize.png',
			'prise/photo.png',
			'prise/money.png',
			'prise/bonus.png',
			'linz.png',
			'loader.png',
		].forEach(
			function (path) {
				window
					.fetch(new URL(path, surveyBase).href, { cache: 'force-cache' })
					.catch(function () {})
			},
		)
	}

	function init() {
		if (document.getElementById('tutu-jubilee-promo')) return

		var root = buildModal()
		document.body.appendChild(root)

		var cta = root.querySelector('[data-tutu-promo-cta]')
		if (cta) {
			cta.addEventListener('click', function () {
				cta.disabled = true
				try {
					window.sessionStorage.setItem('tutu_entry_passed_v1', '1')
				} catch {
					// Параметр URL подтвердит переход, если storage недоступен.
				}

				var surveyUrl = new URL('../', window.location.href)
				surveyUrl.searchParams.set('tutu', 'passed')
				surveyUrl.searchParams.set('build', '20260831-3')
				window.location.replace(surveyUrl.href)
			})
		}

		openModal(root)
	}

	window.setTimeout(warmSurveyApp, 200)

	function initWhenBodyExists() {
		if (!document.body) {
			window.requestAnimationFrame(initWhenBodyExists)
			return
		}
		init()
	}

	window.setTimeout(initWhenBodyExists, Math.max(0, startedAt + DELAY_MS - performance.now()))
})()
