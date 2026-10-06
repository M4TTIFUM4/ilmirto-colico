/* Il Mirto — script principale (nessuna dipendenza esterna, Leaflet caricato solo quando serve) */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var CFG = window.SITE_CONFIG || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Configurazione: link e contatti ---------- */
  function hrefFor(key) {
    var v = CFG[key];
    if (!v) return "";
    if (key === "email" || key === "formEmail") return "mailto:" + v;
    if (key === "telefono") return "tel:" + v.replace(/[^\d+]/g, "");
    if (key === "whatsapp") return "https://wa.me/" + v.replace(/\D/g, "");
    if (key === "airbnb") return CFG.airbnbUrl || "";
    if (key === "booking") return CFG.bookingUrl || "";
    return v;
  }
  function has(key) {
    if (key === "airbnb") return !!CFG.airbnbUrl;
    if (key === "booking") return !!CFG.bookingUrl;
    if (key === "contatto") return !!(CFG.email || CFG.whatsapp || CFG.telefono);
    return !!CFG[key];
  }
  $$("[data-requires]").forEach(function (el) {
    var ok = el.getAttribute("data-requires").split(" ").some(has);
    if (!ok) el.hidden = true;
  });
  $$("[data-requires-not]").forEach(function (el) {
    if (has(el.getAttribute("data-requires-not"))) el.hidden = true;
  });
  $$("[data-href]").forEach(function (el) {
    var h = hrefFor(el.getAttribute("data-href"));
    if (h) el.setAttribute("href", h);
  });
  $$("[data-text]").forEach(function (el) {
    var v = CFG[el.getAttribute("data-text")];
    if (v) el.textContent = v;
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header e menu mobile ---------- */
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  var hero = $(".hero");
  function onScroll() {
    if (!header || header.classList.contains("site-header--solid")) return;
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Barra prenotazione mobile ---------- */
  var mobileCta = $(".mobile-cta");
  if (mobileCta && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      mobileCta.classList.toggle("is-visible", !entries[0].isIntersecting);
    }, { threshold: 0.05 }).observe(hero);
  } else if (mobileCta) {
    mobileCta.classList.add("is-visible");
  }

  /* ---------- Animazioni di comparsa ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Galleria + lightbox ---------- */
  var gallery = $(".gallery");
  if (gallery) {
    var items = $$(".gallery__item", gallery);
    var moreBtn = $("#gallery-more");
    var chips = $$(".gallery-filters .chip");

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        items.forEach(function (it) { it.hidden = f !== "tutte" && it.getAttribute("data-cat") !== f; });
        gallery.classList.toggle("is-collapsed", f === "tutte" && !gallery.dataset.expanded);
        if (moreBtn) moreBtn.parentElement.hidden = f !== "tutte" || !!gallery.dataset.expanded;
      });
    });
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        gallery.dataset.expanded = "1";
        gallery.classList.remove("is-collapsed");
        moreBtn.parentElement.hidden = true;
      });
    }

    var lb = $("#lightbox");
    var lbImg = $(".lightbox__stage img", lb);
    var lbCap = $(".lightbox__caption", lb);
    var lbCount = $(".lb-count", lb);
    var current = 0, list = [], lastFocus = null;

    function visibleItems() { return items.filter(function (it) { return !it.hidden; }); }
    function show(i) {
      current = (i + list.length) % list.length;
      var it = list[current];
      var img = $("img", it);
      lbImg.src = it.getAttribute("data-full");
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lbCount.textContent = (current + 1) + " / " + list.length;
      var next = list[(current + 1) % list.length];
      if (next) { var pre = new Image(); pre.src = next.getAttribute("data-full"); }
    }
    function open(it) {
      list = visibleItems();
      lastFocus = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      show(list.indexOf(it));
      $(".lb-close", lb).focus();
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { lb.hidden = true; lbImg.removeAttribute("src"); }, 300);
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (it) { it.addEventListener("click", function () { open(it); }); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { show(current - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") { // trappola del focus semplice
        var f = $$("button", lb);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var touchX = null;
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ---------- Mappa (Leaflet + OpenStreetMap, gratuita e senza API key) ---------- */
  var mapEl = $("#map");
  if (mapEl) {
    var mapLoaded = false;
    var loadMap = function () {
      if (mapLoaded) return; mapLoaded = true;
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = initMap;
      s.onerror = function () { $(".map__placeholder", mapEl).textContent = "Impossibile caricare la mappa. Colico (LC), Lago di Como."; };
      document.head.appendChild(s);
    };
    var initMap = function () {
      var L = window.L;
      var home = [CFG.lat || 46.1355, CFG.lng || 9.377];
      var map = L.map(mapEl, { scrollWheelZoom: false, tap: true }).setView(home, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      var ph = $(".map__placeholder", mapEl); if (ph) ph.remove();
      var icon = function (label, cls) {
        return L.divIcon({ className: "pin " + (cls || ""), html: "<span><i>" + label + "</i></span>", iconSize: [34, 34] });
      };
      L.marker(home, { icon: icon("★", "pin--home"), zIndexOffset: 1000 }).addTo(map)
        .bindPopup("<b>" + (CFG.nome || "Il Mirto") + "</b>Casa vacanze in centro a Colico");
      var bounds = [home];
      $$(".poi").forEach(function (li, idx) {
        var ll = [parseFloat(li.dataset.lat), parseFloat(li.dataset.lng)];
        if (isNaN(ll[0])) return;
        var m = L.marker(ll, { icon: icon(idx + 1) }).addTo(map)
          .bindPopup("<b>" + $("b", li).textContent + "</b>" + $(".dist", li).textContent);
        if (li.dataset.near) bounds.push(ll);
        var focus = function () { map.flyTo(ll, 15, { duration: .8 }); m.openPopup(); if (window.innerWidth < 960) mapEl.scrollIntoView({ behavior: "smooth", block: "center" }); };
        li.addEventListener("click", focus);
        li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focus(); } });
      });
      map.fitBounds(bounds, { padding: [40, 40] });
    };
    if ("IntersectionObserver" in window) {
      var mo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: "300px" });
      mo.observe(mapEl);
    } else { loadMap(); }
  }

  /* ---------- Calendario disponibilità ---------- */
  var MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var key = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parse = function (s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var fmt = function (d) { return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }); };
  var today = new Date(); today.setHours(0, 0, 0, 0);

  var busy = {};           // notti occupate: "YYYY-MM-DD" -> true
  var calReady = false;

  function isRangeFree(a, b) { // notti da a (incluso) a b (escluso)
    for (var d = new Date(a); d < b; d = addDays(d, 1)) if (busy[key(d)]) return false;
    return true;
  }

  var cal = $("#calendar");
  var state = { start: null, end: null, guests: 2, offset: 0 };
  var MAX_OFFSET = 12;

  function render() {
    if (!cal) return;
    var wrap = $(".cal-months", cal);
    wrap.innerHTML = "";
    for (var m = 0; m < 2; m++) {
      var first = new Date(today.getFullYear(), today.getMonth() + state.offset + m, 1);
      var box = document.createElement("div");
      box.className = "cal-month";
      box.innerHTML = "<h3>" + MONTHS[first.getMonth()] + " " + first.getFullYear() + "</h3>";
      var grid = document.createElement("div");
      grid.className = "cal-grid";
      grid.setAttribute("role", "grid");
      ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"].forEach(function (d) {
        var h = document.createElement("div"); h.className = "cal-dow"; h.textContent = d; h.setAttribute("aria-hidden", "true"); grid.appendChild(h);
      });
      var lead = (first.getDay() + 6) % 7;
      for (var i = 0; i < lead; i++) { var e = document.createElement("div"); e.className = "cal-empty"; grid.appendChild(e); }
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        var date = new Date(first.getFullYear(), first.getMonth(), d);
        var k = key(date);
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cal-day";
        b.textContent = d;
        b.dataset.date = k;
        var label = date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        var past = date < today;
        var isBusy = !!busy[k];
        var canCheckout = state.start && !state.end && date > state.start && isRangeFree(state.start, date);
        if (past) { b.classList.add("is-past"); b.disabled = true; label += ", data passata"; }
        else if (isBusy) {
          b.classList.add("is-busy");
          if (canCheckout) { b.classList.remove("is-busy"); b.classList.add("is-checkout-only"); label += ", disponibile solo per il check-out"; }
          else { b.disabled = true; label += ", non disponibile"; }
        } else { label += ", disponibile"; }
        if (+date === +today) b.classList.add("is-today");
        if (state.start && +date === +state.start) b.classList.add("is-start");
        if (state.end && +date === +state.end) b.classList.add("is-end");
        if (state.start && state.end && date > state.start && date < state.end) b.classList.add("in-range");
        b.setAttribute("aria-label", label);
        grid.appendChild(b);
      }
      box.appendChild(grid);
      wrap.appendChild(box);
    }
    $(".cal-prev", cal).disabled = state.offset <= 0;
    $(".cal-next", cal).disabled = state.offset >= MAX_OFFSET;
    updateSummary();
  }

  function pick(date) {
    if (!state.start || state.end) {
      if (busy[key(date)]) return;
      state.start = date; state.end = null;
    } else if (date <= state.start) {
      if (!busy[key(date)]) state.start = date;
    } else if (isRangeFree(state.start, date)) {
      state.end = date;
    } else if (!busy[key(date)]) {
      state.start = date; state.end = null;
    }
    render();
  }

  var summary = $("#summary");
  function nights() { return state.start && state.end ? Math.round((state.end - state.start) / 864e5) : 0; }
  function updateSummary() {
    if (!summary) return;
    $("#sum-in").textContent = state.start ? fmt(state.start) : "Seleziona";
    $("#sum-out").textContent = state.end ? fmt(state.end) : "Seleziona";
    $("#sum-guests").textContent = state.guests + (state.guests === 1 ? " ospite" : " ospiti");
    $("#g-minus").disabled = state.guests <= 1;
    $("#g-plus").disabled = state.guests >= (CFG.maxOspiti || 3);
    var msg = $("#sum-msg");
    var n = nights();
    var ready = false;
    msg.className = "summary-msg";
    if (!state.start) msg.textContent = "Seleziona sul calendario la data di arrivo.";
    else if (!state.end) msg.textContent = "Ora seleziona la data di partenza.";
    else if (n < (CFG.minNotti || 1)) { msg.className += " is-error"; msg.textContent = "Il soggiorno minimo è di " + CFG.minNotti + " notti."; }
    else { msg.className += " is-ok"; msg.textContent = n + (n === 1 ? " notte" : " notti") + " · le date risultano libere ✓"; ready = true; }

    var air = $("#btn-airbnb");
    if (air && CFG.airbnbUrl) {
      var u = CFG.airbnbUrl + (CFG.airbnbUrl.indexOf("?") > -1 ? "&" : "?") + "adults=" + state.guests;
      if (ready) u += "&check_in=" + key(state.start) + "&check_out=" + key(state.end);
      air.href = u;
    }
    var bk = $("#btn-booking");
    if (bk && CFG.bookingUrl) {
      var ub = CFG.bookingUrl + (CFG.bookingUrl.indexOf("?") > -1 ? "&" : "?") + "group_adults=" + state.guests + "&no_rooms=1";
      if (ready) ub += "&checkin=" + key(state.start) + "&checkout=" + key(state.end);
      bk.href = ub;
    }
    var dir = $("#btn-direct");
    if (dir) dir.dataset.ready = ready ? "1" : "";
  }

  if (cal) {
    cal.addEventListener("click", function (e) {
      var b = e.target.closest(".cal-day");
      if (b && !b.disabled) pick(parse(b.dataset.date));
    });
    $(".cal-prev", cal).addEventListener("click", function () { if (state.offset > 0) { state.offset--; render(); } });
    $(".cal-next", cal).addEventListener("click", function () { if (state.offset < MAX_OFFSET) { state.offset++; render(); } });
    $("#g-minus").addEventListener("click", function () { state.guests = Math.max(1, state.guests - 1); updateSummary(); });
    $("#g-plus").addEventListener("click", function () { state.guests = Math.min(CFG.maxOspiti || 3, state.guests + 1); updateSummary(); });
    $("#cal-reset").addEventListener("click", function () { state.start = state.end = null; render(); });
    $("#btn-direct").addEventListener("click", function () {
      var f = $("#booking-form");
      if (!f) return;
      if (state.start) f.checkin.value = key(state.start);
      if (state.end) f.checkout.value = key(state.end);
      f.ospiti.value = String(state.guests);
    });

    var status = $(".cal-status", cal);
    fetch("data/availability.json?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        (data.busy || []).forEach(function (r) {
          for (var d = parse(r.start), end = parse(r.end); d < end; d = addDays(d, 1)) busy[key(d)] = true;
        });
        calReady = true;
        if (data.updated) {
          var up = new Date(data.updated);
          var src = (data.sources || []).join(" e ") || "le piattaforme";
          $("span:last-child", status).textContent = "Sincronizzato con " + src + " · ultimo aggiornamento " +
            up.toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
          if (Date.now() - up > 36 * 3600e3) status.classList.add("is-warn");
        } else {
          status.classList.add("is-warn");
          $("span:last-child", status).textContent = "Calendario in attesa della prima sincronizzazione: conferma sempre le date su Airbnb o contattaci.";
        }
        render();
      })
      .catch(function () {
        status.classList.add("is-warn");
        $("span:last-child", status).textContent = "Impossibile caricare le disponibilità aggiornate: verifica le date su Airbnb o contattaci.";
        render();
      });
    render();
  }

  /* ---------- Modulo richiesta di prenotazione diretta ---------- */
  var form = $("#booking-form");
  if (form) {
    var fb = $(".form-feedback", form);
    var minDate = key(today);
    form.checkin.min = minDate;
    form.checkout.min = key(addDays(today, 1));
    form.checkin.addEventListener("change", function () {
      if (form.checkin.value) form.checkout.min = key(addDays(parse(form.checkin.value), 1));
    });
    var maxG = CFG.maxOspiti || 3;
    for (var g = 1; g <= maxG; g++) {
      var o = document.createElement("option"); o.value = g; o.textContent = g + (g === 1 ? " ospite" : " ospiti");
      if (g === 2) o.selected = true;
      form.ospiti.appendChild(o);
    }

    var feedback = function (type, text) { fb.hidden = false; fb.className = "form-feedback " + type; fb.textContent = text; };
    var validate = function () {
      if (!form.reportValidity()) return null;
      var a = parse(form.checkin.value), b = parse(form.checkout.value);
      if (b <= a) { feedback("err", "La data di partenza deve essere successiva a quella di arrivo."); return null; }
      if (calReady && !isRangeFree(a, b)) { feedback("err", "Attenzione: alcune notti selezionate risultano già occupate. Controlla il calendario qui sopra."); return null; }
      var n = Math.round((b - a) / 864e5);
      return {
        nome: form.nome.value.trim(), email: form.email.value.trim(), telefono: form.telefono.value.trim(),
        arrivo: a.toLocaleDateString("it-IT"), partenza: b.toLocaleDateString("it-IT"), notti: n,
        ospiti: form.ospiti.value, animali: form.animali.value, messaggio: form.messaggio.value.trim()
      };
    };
    var text = function (d) {
      return "Ciao! Vorrei richiedere un soggiorno a " + (CFG.nome || "Il Mirto") + ".\n" +
        "Arrivo: " + d.arrivo + "\nPartenza: " + d.partenza + " (" + d.notti + " notti)\n" +
        "Ospiti: " + d.ospiti + "\nAnimali: " + d.animali + "\n" +
        "Nome: " + d.nome + "\nEmail: " + d.email + (d.telefono ? "\nTelefono: " + d.telefono : "") +
        (d.messaggio ? "\n\n" + d.messaggio : "");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._gotcha && form._gotcha.value) return;
      var d = validate(); if (!d) return;
      var btn = $("button[type=submit]", form);
      if (CFG.formEmail) {
        btn.disabled = true; btn.textContent = "Invio in corso…";
        fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CFG.formEmail), {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(Object.assign({
            _subject: "Richiesta prenotazione " + d.arrivo + " → " + d.partenza + " — " + d.nome,
            _template: "table", _replyto: d.email, _captcha: "false"
          }, d))
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (String(res.success) !== "true") throw new Error(res.message);
          feedback("ok", "Grazie " + d.nome + "! Abbiamo ricevuto la tua richiesta: ti risponderemo al più presto con conferma e prezzo. La prenotazione sarà valida solo dopo la nostra conferma.");
          form.reset();
        }).catch(function () {
          feedback("err", "Invio non riuscito. Riprova oppure scrivici su WhatsApp o via email.");
        }).then(function () { btn.disabled = false; btn.textContent = "Invia richiesta"; });
      } else if (CFG.whatsapp) {
        window.open("https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(text(d)), "_blank", "noopener");
      } else if (CFG.email) {
        location.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent("Richiesta prenotazione " + d.arrivo) + "&body=" + encodeURIComponent(text(d));
      } else if (CFG.airbnbUrl) {
        feedback("ok", "Per ora puoi contattarci tramite Airbnb: ti stiamo reindirizzando…");
        setTimeout(function () { location.href = CFG.airbnbUrl; }, 1200);
      }
    });

    $$("[data-send]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var d = validate(); if (!d) return;
        if (b.dataset.send === "whatsapp") window.open("https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(text(d)), "_blank", "noopener");
        else location.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent("Richiesta prenotazione " + d.arrivo) + "&body=" + encodeURIComponent(text(d));
      });
    });
  }
})();
