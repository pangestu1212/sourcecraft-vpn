/**
 * Jubilee promo modal on static tutu landing.
 * Shows after 5s; CTA goes to React app at /home.
 */
(function () {
	'use strict'

	var DELAY_MS = 5000
	var ASSET = 'images/jubilee-promo/'
	var TARGET = '/home'

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

	function init() {
		if (document.getElementById('tutu-jubilee-promo')) return

		var root = buildModal()
		document.body.appendChild(root)

		var cta = root.querySelector('[data-tutu-promo-cta]')
		if (cta) {
			cta.addEventListener('click', function () {
				if (window.parent && window.parent !== window) {
					window.parent.postMessage({ type: 'tutu-entry:start-survey' }, window.location.origin)
					return
				}
				window.location.href = TARGET
			})
		}

		window.setTimeout(function () {
			openModal(root)
		}, DELAY_MS)
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init)
	} else {
		init()
	}
})()
