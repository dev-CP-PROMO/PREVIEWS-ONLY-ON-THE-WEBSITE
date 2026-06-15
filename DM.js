// ================================================
// MUDE APENAS ESTAS DUAS LINHAS
// ================================================
var TELEGRAM_USER = 'Big_Oldsellerx';
var PRODUCT_NAME  = 'novo1';
// ================================================
// Detecção do produto (por prioridade):
//   1. data-product="Nome"  no elemento ou num pai
//   2. title="" ou aria-label="" do elemento
//   3. ?text= do href original do link Telegram
//   4. Texto visível do botão (se não for genérico)
//   5. Alt da imagem dentro do botão
//   6. Heading/título mais próximo no DOM
//   7. Título da página (sem sufixo do site)
//   8. Fallback → PRODUCT_NAME acima
// ================================================

(function () {
    'use strict';

    var TG_PATTERN = /t\.me|telegram\.me|tg\.me/i;

    var IGNORE_LABELS = /^(get|get now|get it|get access|click|click here|aqui|here|buy|buy now|purchase|comprar|join|join now|entrar|telegram|t\.me|access|acessar|obter|download|ver|view|open|abrir|order|order now|subscribe|yes|sim|continue|continuar|proceed|next|start|começar|link|button|botão|cta|action|act now|shop now|add to cart)$/i;

    function buildLink(label) {
        var product = cleanLabel(label) || PRODUCT_NAME;
        var line1 = '\uD83D\uDC4B Hello!';
        var line2 = '\uD83D\uDCAB I\u2019m interested in \u201C' + product + '\u201D';
        var line3 = '\uD83D\uDCB0 Could you tell me the price?';
        var line4 = '\uD83C\uDF81 Are there any bonuses available?';
        var line5 = '\uD83D\uDCB3 What payment methods do you accept?';
        var line6 = '\uD83D\uDE4F Thank you! I await your reply.';
        var msg = line1 + '\n' + line2 + '\n' + line3 + '\n' + line4 + '\n' + line5 + '\n' + line6;
        var url = 'https://t.me/' + TELEGRAM_USER + '?text=' + encodeURIComponent(msg);

        try {
            var clicks = JSON.parse(localStorage.getItem('telegram_clicks') || '[]');
            clicks.push({
                timestamp: new Date().toISOString(),
                buttonLabel: cleanLabel(label) || '(sem label)',
                product: product,
                link: url,
                page: window.location.href
            });
            localStorage.setItem('telegram_clicks', JSON.stringify(clicks));
        } catch(e) {}

        return url;
    }

    function cleanLabel(txt) {
        if (!txt) return null;
        txt = txt.trim().replace(/\s+/g, ' ');
        if (!txt || txt.length < 3 || txt.length > 120) return null;
        if (IGNORE_LABELS.test(txt)) return null;
        return txt;
    }

    function extractTextFromHref(href) {
        if (!href) return null;
        try {
            var match = href.match(/[?&]text=([^&]+)/i);
            if (!match) return null;
            var decoded = decodeURIComponent(match[1].replace(/\+/g, ' '));
            decoded = decoded
                .replace(/^hello[,.]?\s*/i, '')
                .replace(/^hi[,.]?\s*/i, '')
                .replace(/^how much (is|for|does)?\s*/i, '')
                .replace(/^i.?m interested in (purchasing|buying)?\s*/i, '')
                .replace(/^interested in\s*/i, '')
                .replace(/^(purchase|buy|order|get|i want)\s*/i, '')
                .trim();
            return cleanLabel(decoded);
        } catch(e) { return null; }
    }

    function getLabelFromContext(el) {
        if (!el || !el.parentElement) return null;

        var node = el;
        for (var depth = 0; depth < 8; depth++) {
            var parent = node.parentElement;
            if (!parent) break;

            var headings = parent.querySelectorAll('h1,h2,h3,h4,[class*="title"],[class*="heading"],[class*="product-name"],[class*="item-name"]');
            for (var h = 0; h < headings.length; h++) {
                var htxt = (headings[h].innerText || headings[h].textContent || '').trim().replace(/\s+/g, ' ');
                if (cleanLabel(htxt)) return htxt;
            }

            var sibling = parent.previousElementSibling;
            for (var s = 0; s < 5 && sibling; s++, sibling = sibling.previousElementSibling) {
                if (sibling.querySelector && sibling.querySelector('a[href*="t.me"]')) continue;

                var sibHeading = sibling.querySelector && sibling.querySelector('h1,h2,h3,h4,[class*="title"],[class*="heading"]');
                if (sibHeading) {
                    var sht = (sibHeading.innerText || sibHeading.textContent || '').trim().replace(/\s+/g, ' ');
                    if (cleanLabel(sht)) return sht;
                }

                var items = sibling.querySelectorAll && sibling.querySelectorAll('li, p, span, strong, b');
                for (var ii = 0; ii < items.length; ii++) {
                    var itxt = (items[ii].innerText || items[ii].textContent || '').trim().replace(/\s+/g, ' ');
                    if (cleanLabel(itxt) && /ebook|pack|course|video|bundle|collection|content|foto|photo|pic|clip|set|vol|part|series|premium|vip|exclusive/i.test(itxt)) {
                        return itxt;
                    }
                }
            }

            node = parent;
        }

        var pageTitle = document.title && document.title.trim().replace(/\s+/g, ' ');
        if (cleanLabel(pageTitle) && pageTitle !== document.location.hostname) {
            pageTitle = pageTitle.replace(/\s*[|\-\u2013\u2014].*$/, '').trim();
            if (cleanLabel(pageTitle)) return pageTitle;
        }

        return null;
    }

    function getLabel(el) {
        if (!el) return null;

        // 1. data-product
        var dp = el.getAttribute && el.getAttribute('data-product');
        if (!dp && el.closest) {
            var p = el.closest('[data-product]');
            if (p) dp = p.getAttribute('data-product');
        }
        if (dp && dp.trim()) return dp.trim();

        // 2. title ou aria-label
        var titleAttr = (el.getAttribute && (el.getAttribute('title') || el.getAttribute('aria-label'))) || '';
        if (cleanLabel(titleAttr)) return titleAttr.trim();

        // 3. ?text= do href original
        var anchor = el.tagName === 'A' ? el : (el.closest ? el.closest('a') : null);
        var rawHref = anchor && (anchor.__dmOriginalHref || anchor.getAttribute('href') || '');
        if (rawHref && TG_PATTERN.test(rawHref) && rawHref.indexOf(TELEGRAM_USER + '?text=') === -1) {
            var fromHref = extractTextFromHref(rawHref);
            if (fromHref) return fromHref;
        }
        var rawId = anchor && (anchor.getAttribute('id') || '');
        if (rawId && TG_PATTERN.test(rawId)) {
            var fromId = extractTextFromHref(rawId);
            if (fromId) return fromId;
        }

        // 4. Texto do botão (se não for genérico)
        if (anchor) {
            var anchorTxt = (anchor.innerText || anchor.textContent || '').trim().replace(/\s+/g, ' ');
            if (cleanLabel(anchorTxt)) return anchorTxt;
        }
        var selfTxt = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
        if (cleanLabel(selfTxt)) return selfTxt;

        // 5. Alt da imagem
        var img = el.querySelector && el.querySelector('img[alt]');
        if (img && cleanLabel(img.getAttribute('alt'))) return img.getAttribute('alt').trim();

        // 6. Contexto ao redor
        var contextLabel = getLabelFromContext(anchor || el);
        if (contextLabel) return contextLabel;

        return null;
    }

    function replaceLinks() {
        document.querySelectorAll('a[href]').forEach(function (a) {
            if (!TG_PATTERN.test(a.getAttribute('href'))) return;
            if (!a.__dmOriginalHref) a.__dmOriginalHref = a.getAttribute('href');
            var label = getLabel(a);
            a.href   = buildLink(label);
            a.target = '_blank';
            a.rel    = 'noopener noreferrer';
            a.removeAttribute('onclick');
            console.log('[DM.js] Link substituido -> produto:', cleanLabel(label) || '(fallback: ' + PRODUCT_NAME + ')');
        });

        document.querySelectorAll('[onclick]').forEach(function (el) {
            var oc = el.getAttribute('onclick') || '';
            if (!TG_PATTERN.test(oc)) return;
            el.removeAttribute('onclick');
            el.style.cursor = 'pointer';
            (function(captured) {
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(buildLink(getLabel(captured)), '_blank');
                });
            })(el);
        });

        document.querySelectorAll('[data-href],[data-url],[data-link]').forEach(function (el) {
            ['data-href','data-url','data-link'].forEach(function (attr) {
                var v = el.getAttribute(attr);
                if (v && TG_PATTERN.test(v)) {
                    el.setAttribute(attr, buildLink(getLabel(el)));
                }
            });
        });

        document.querySelectorAll('.telegram-button, .tg-button, [class*="tg-btn"], [class*="tg_btn"]').forEach(function (el) {
            if (el.__dmPatched) return;
            el.__dmPatched = true;
            el.style.cursor = 'pointer';
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.open(buildLink(getLabel(el)), '_blank');
            });
        });
    }

    document.addEventListener('click', function (e) {
        var el = e.target;
        var anchor = null;
        for (var i = 0; i < 8 && el; i++, el = el.parentElement) {
            if (el.tagName === 'A' && TG_PATTERN.test(el.getAttribute('href') || '')) {
                anchor = el;
                break;
            }
        }
        if (!anchor) return;
        if (anchor.href && anchor.href.indexOf('t.me/' + TELEGRAM_USER + '?text=') !== -1) return;
        e.preventDefault();
        e.stopPropagation();
        if (!anchor.__dmOriginalHref) anchor.__dmOriginalHref = anchor.getAttribute('href');
        var label = getLabel(anchor);
        window.open(buildLink(label), '_blank');
    }, true);

    if (window.MutationObserver) {
        new MutationObserver(function (mutations) {
            if (mutations.some(function (m) { return m.addedNodes.length > 0; })) replaceLinks();
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    function init() {
        replaceLinks();
        [500, 1500, 3000, 6000].forEach(function (ms) {
            setTimeout(replaceLinks, ms);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.dmGetLink  = buildLink;
    window.dmReplace  = replaceLinks;
    window.dmGetLabel = getLabel;

    console.log('[DM.js] Carregado. Telegram:', TELEGRAM_USER, '| Produto padrao:', PRODUCT_NAME);
    console.log('[DM.js] Exemplo:', buildLink(null));
})();