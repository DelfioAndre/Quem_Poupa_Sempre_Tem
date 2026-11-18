
    'use strict';
    const $ = id => document.getElementById(id);
    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };
    const setHref = (id, value) => {
      const el = $(id);
      if (el) el.href = value;
    };
    const WAPP = '258856812121';
    const PRICING = {
      porkPerKg: 210,
      deliveryFee: 100,
      freeDeliveryAboveKg: 10,
      meiMonthlyRate: .30,
      digital: {
        'Netflix': 280,
        'Amazon Prime Video': 200,
        'Spotify': 120,
        'Crunchyroll': 180
      }
    };
    const round = x => Math.round((x + Number.EPSILON) * 100) / 100;
    const money = n => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(round(n)) + ' MT';
    function renderCatalogValues() {
      const values = {
        porkPerKg: money(PRICING.porkPerKg),
        deliveryFee: money(PRICING.deliveryFee),
        deliveryLimitKg: String(PRICING.freeDeliveryAboveKg),
        meiMonthlyRate: Math.round(PRICING.meiMonthlyRate * 100) + '%',
        netflix: money(PRICING.digital.Netflix),
        primeVideo: money(PRICING.digital['Amazon Prime Video']),
        spotify: money(PRICING.digital.Spotify),
        crunchyroll: money(PRICING.digital.Crunchyroll)
      };
      document.querySelectorAll('[data-catalog-value]').forEach(el => {
        const value = values[el.dataset.catalogValue];
        if (value !== undefined) el.textContent = value;
      });
    }
    const trim = id => {
      const el = $(id);
      return el ? String(el.value || '').trim() : '';
    };
    const whatsUrl = msg => 'https://wa.me/' + WAPP + '?text=' + encodeURIComponent(msg);
    function parseAmount(raw) {
      let v = String(raw || '').trim().replace(/[\s\u00a0]/g, '');
      if (!v) return NaN;
      if (!/^[0-9.,]+$/.test(v)) return NaN;
      if (v.indexOf(',') !== -1 && v.indexOf('.') !== -1) {
        if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.');
        else v = v.replace(/,/g, '');
      } else if (v.indexOf(',') !== -1) {
        v = v.replace(',', '.');
      } else if (/^\d{1,3}(\.\d{3})+$/.test(v)) {
        v = v.replace(/\./g, '');
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    }
    function watch(ids, callback) {
      ids.forEach(id => {
        const el = $(id);
        if (!el) return;
        ['input', 'change', 'keyup', 'blur'].forEach(ev => el.addEventListener(ev, callback));
      });
    }
    const bindClick = (id, callback) => {
      const el = $(id);
      if (el) el.addEventListener('click', callback);
    };
    const formErrorTargets = new Map();
    function clearFormError(id) {
      const target = formErrorTargets.get(id);
      if (target) {
        target.removeAttribute('aria-invalid');
        const descriptions = (target.getAttribute('aria-describedby') || '')
          .split(/\s+/).filter(descriptionId => descriptionId && descriptionId !== id);
        if (descriptions.length) target.setAttribute('aria-describedby', descriptions.join(' '));
        else target.removeAttribute('aria-describedby');
        formErrorTargets.delete(id);
      }
      setText(id, '');
    }
    function showFormError(id, message, target) {
      clearFormError(id);
      const errorEl = $(id);
      if (errorEl) errorEl.textContent = message;
      if (target && errorEl) {
        target.setAttribute('aria-invalid', 'true');
        const descriptions = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (!descriptions.includes(id)) descriptions.push(id);
        target.setAttribute('aria-describedby', descriptions.join(' '));
        formErrorTargets.set(id, target);
      }
      if (target) {
        target.scrollIntoView({ block: 'center' });
        target.focus();
      } else if (errorEl) {
        errorEl.scrollIntoView({ block: 'center' });
      }
    }
    function calculatePork() {
      const q = parseAmount(trim('kg'));
      const ok = Number.isFinite(q) && q > 0 && q <= 100000;
      const delivery = $('modo') ? $('modo').value === 'entrega' : false;
      const s = ok ? round(q * PRICING.porkPerKg) : 0;
      const fee = ok && delivery && q <= PRICING.freeDeliveryAboveKg ? PRICING.deliveryFee : 0;
      setText('q-kg', ok ? q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg' : '—');
      setText('subtotal', ok ? money(s) : '—');
      setText('taxa', ok ? (delivery ? (fee === 0 ? 'Grátis' : money(fee)) : 'Sem entrega') : '—');
      setText('total-carne', ok ? money(s + fee) : '—');
      setText('live-kg', ok ? q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg' : '—');
      setText('live-pork', ok ? money(s + fee) : '—');
      setText('status-carne', ok ? 'Total actualizado automaticamente: ' + money(s + fee) : 'Introduz uma quantidade válida, maior que zero.');
      setText('carne-formula', ok ?
        q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg × ' + money(PRICING.porkPerKg) + ' = ' + money(s) + (delivery ? ' + ' + money(fee) + ' de entrega' : ' (levantamento)') + ' → ' + money(s + fee) :
        'Valor = quilogramas × ' + money(PRICING.porkPerKg) + ' + entrega, quando aplicável.');
      clearFormError('erro-carne');
      return ok ? { q, s, fee, delivery, total: round(s + fee) } : null;
    }
    function updatePork() {
      const r = calculatePork();
      if (!r) { setHref('enviar-carne', '#painel-carne'); return null; }
      setHref('enviar-carne', whatsUrl([
        'Olá! Quero consultar a disponibilidade de carne de porco nacional.', '',
        'Quantidade: ' + r.q + ' kg', 'Preço por kg: ' + money(PRICING.porkPerKg),
        'Subtotal: ' + money(r.s),
        'Modalidade: ' + (r.delivery ? 'Entrega' : 'Levantamento a combinar'),
        'Taxa de entrega: ' + (r.delivery ? (r.fee === 0 ? 'Grátis' : money(r.fee)) : 'Sem entrega'),
        'Total estimado: ' + money(r.total),
        'Bairro/local: ' + (trim('bairro') || 'A informar'),
        'Data pretendida: ' + (trim('data') || 'A combinar'),
        'Observações: ' + (trim('obs') || 'Nenhuma')
      ].join('\n')));
      return r;
    }
    watch(['kg', 'modo', 'bairro', 'data', 'obs'], updatePork);
    document.querySelectorAll('[data-kg]').forEach(btn => btn.addEventListener('click', function () {
      $('kg').value = this.dataset.kg;
      updatePork();
    }));
    bindClick('atualizar-carne', updatePork);
    bindClick('enviar-carne', function (e) {
      if (!updatePork()) {
        e.preventDefault();
        showFormError('erro-carne', 'Indica uma quantidade válida em quilogramas antes de enviar.', $('kg'));
      }
    });

    function updateStamp() {
      const produto = $('produto') ? $('produto').value : '';
      const qty = $('qtd') ? Number($('qtd').value) : 0;
      const qok = Number.isInteger(qty) && qty > 0 && qty <= 100000;
      const modelo = trim('modelo'), arte = trim('arte');
      const produtoEl = $('estampa-produto');
      const quantidadeEl = $('estampa-quantidade');
      const modeloEl = $('estampa-modelo');
      const arteEl = $('estampa-arte');
      const totalEl = $('estampa-total');
      const statusEl = $('status-estampa');
      const enviarEl = $('enviar-estampa');
      if (produtoEl) produtoEl.textContent = produto;
      if (quantidadeEl) quantidadeEl.textContent = qok ? qty + ' unidade' + (qty === 1 ? '' : 's') : '—';
      if (modeloEl) modeloEl.textContent = modelo || 'A informar';
      if (arteEl) arteEl.textContent = arte ? (arte.length > 85 ? arte.slice(0, 85) + '…' : arte) : 'A informar';
      if (totalEl) totalEl.textContent = 'Sob orçamento';
      if (statusEl) statusEl.textContent = qok ? 'Resumo actualizado para ' + qty + ' unidade' + (qty === 1 ? '' : 's') + '. Preço a confirmar.' : 'Introduz uma quantidade válida.';
      clearFormError('erro-estampa');
      if (!qok) { if (enviarEl) enviarEl.href = '#painel-estampa'; return null; }
      if (enviarEl) enviarEl.href = whatsUrl([
        'Olá! Gostaria de pedir orçamento de estampagem.', '',
        'Produto: ' + produto, 'Quantidade: ' + qty,
        'Modelo/tamanho: ' + (modelo || 'A informar'),
        'Imagem, frase ou ideia: ' + (arte || 'A informar'),
        'Preço: a confirmar pela empresa', '',
        'Aguardo confirmação de disponibilidade, preço e prazo. Posso enviar uma imagem na conversa.'
      ].join('\n'));
      return { qty, produto, modelo, arte };
    }
    watch(['produto', 'qtd', 'modelo', 'arte'], updateStamp);
    bindClick('atualizar-estampa', updateStamp);
    bindClick('enviar-estampa', function (e) {
      const r = updateStamp();
      if (!r || !r.modelo || !r.arte) {
        e.preventDefault();
        const missing = [];
        if (!r) missing.push('quantidade válida');
        if (!trim('modelo')) missing.push('modelo ou tamanho');
        if (!trim('arte')) missing.push('descrição da personalização');
        const target = !r ? $('qtd') : (!trim('modelo') ? $('modelo') : $('arte'));
        showFormError('erro-estampa', 'Completa os dados em falta: ' + missing.join(', ') + '.', target);
      }
    });

    function calculateMEI() {
      const c = parseAmount(trim('capital'));
      const m = Number(trim('meses'));
      const ok = Number.isFinite(c) && c > 0 && c <= 100000000 && Number.isInteger(m) && m > 0 && m <= 120;
      const rate = PRICING.meiMonthlyRate;
      const perMonth = ok ? round(c * rate) : 0;
      const j = ok ? round(c * rate * m) : 0;
      const simCapitalEl = $('sim-capital');
      const simJurosEl = $('sim-juros');
      const simJurosMesEl = $('sim-juros-mes');
      const simFormulaEl = $('sim-formula');
      const simPrazoEl = $('sim-prazo');
      const simTotalEl = $('sim-total');
      const liveInterestEl = $('live-interest');
      const liveLoanTotalEl = $('live-loan-total');
      const statusMeiEl = $('status-mei');
      if (simCapitalEl) simCapitalEl.textContent = ok ? money(c) : '—';
      if (simJurosEl) simJurosEl.textContent = ok ? money(j) : '—';
      if (simJurosMesEl) simJurosMesEl.textContent = ok ? money(perMonth) : '—';
      if (simFormulaEl) simFormulaEl.textContent = ok ?
        money(c) + ' × ' + (rate * 100) + '% × ' + m + (m === 1 ? ' mês' : ' meses') + ' = ' + money(j) + ' de juros; capital + juros = ' + money(c + j) + '.' :
        'Insere o valor pretendido para veres os juros e o total.';
      if (simPrazoEl) simPrazoEl.textContent = ok ? m + (m === 1 ? ' mês' : ' meses') : '—';
      if (simTotalEl) simTotalEl.textContent = ok ? money(c + j) : '—';
      if (liveInterestEl) liveInterestEl.textContent = ok ? money(j) : '—';
      if (liveLoanTotalEl) liveLoanTotalEl.textContent = ok ? money(c + j) : '—';
      if (statusMeiEl) statusMeiEl.textContent = ok ? 'Simulação automática: ' + money(j) + ' de juros e ' + money(c + j) + ' de total.' : 'Indica um montante positivo e prazo de 1 a 120 meses.';
      clearFormError('erro-mei');
      return ok ? { c, m, j, total: round(c + j) } : null;
    }
    function updateMEI() {
      const r = calculateMEI();
      const enviarMei = $('enviar-mei');
      if (!r) { if (enviarMei) enviarMei.href = '#painel-mei'; return null; }
      const msg = [
        'Olá! Gostaria de apresentar um PRÉ-PEDIDO DE INFORMAÇÃO sobre empréstimo à MEI – Juros & Dívidas.', '',
        'Nome completo: ' + (trim('mei-nome') || 'A informar'),
        'Idade: ' + ($('mei-maior') && $('mei-maior').checked ? '18 anos ou mais confirmado' : 'A confirmar'),
        'BI válido: ' + ($('mei-bi') && $('mei-bi').checked ? 'Confirmado (sem envio de documento)' : 'A confirmar'),
        'Zona de residência: ' + (trim('mei-residencia') || 'A informar'),
        'Comprovativo de residência: ' + (($('mei-comprovativo') && $('mei-comprovativo').value) || 'A informar'),
        'Situação de rendimento: ' + (($('mei-rendimento') && $('mei-rendimento').value) || 'A informar'),
        'Valor pretendido: ' + money(r.c),
        'Prazo pretendido: ' + r.m + (r.m === 1 ? ' mês' : ' meses'),
        'Garantia que poderia apresentar: ' + (trim('mei-garantia') || 'A avaliar com o responsável'),
        'Simulação ilustrativa de juros simples (' + (PRICING.meiMonthlyRate * 100) + '% ao mês): ' + money(r.j),
        'Total matemático simulado: ' + money(r.total),
        'Esta mensagem não corresponde a uma oferta nem aprovação de crédito. Solicito informações sobre condições futuras.',
        'Observações: ' + (trim('mei-observacoes') || 'Nenhuma')
      ].join('\n');
      if (enviarMei) enviarMei.href = whatsUrl(msg);
      return r;
    }
    watch(['capital', 'meses', 'mei-nome', 'mei-residencia', 'mei-comprovativo', 'mei-rendimento', 'mei-garantia', 'mei-observacoes', 'mei-maior', 'mei-bi', 'mei-consente'], updateMEI);
    document.querySelectorAll('[data-capital]').forEach(btn => btn.addEventListener('click', function () {
      $('capital').value = this.dataset.capital;
      updateMEI();
    }));
    bindClick('atualizar-mei', updateMEI);
    bindClick('enviar-mei', function (e) {
      const r = updateMEI();
      const missing = [];
      let firstMissingField = null;
      const addMissing = (label, id) => {
        missing.push(label);
        if (!firstMissingField) firstMissingField = $(id);
      };
      if (trim('mei-nome').length < 3) addMissing('nome completo', 'mei-nome');
      if (!r) {
        const capital = parseAmount(trim('capital'));
        const months = Number(trim('meses'));
        if (!(Number.isFinite(capital) && capital > 0 && capital <= 100000000)) {
          addMissing('valor positivo válido', 'capital');
        }
        if (!(Number.isInteger(months) && months > 0 && months <= 120)) {
          addMissing('prazo entre 1 e 120 meses', 'meses');
        }
      }
      if (!trim('mei-residencia')) addMissing('bairro/zona', 'mei-residencia');
      if (!$('mei-comprovativo').value) addMissing('comprovativo', 'mei-comprovativo');
      if (!$('mei-rendimento').value) addMissing('situação de rendimento', 'mei-rendimento');
      if (!$('mei-maior').checked) addMissing('confirmação de idade mínima', 'mei-maior');
      if (!$('mei-bi').checked) addMissing('confirmação de BI válido', 'mei-bi');
      if (!$('mei-consente').checked) addMissing('autorização de envio', 'mei-consente');
      if (missing.length) {
        e.preventDefault();
        showFormError('erro-mei', 'Completa ou confirma: ' + missing.join(', ') + '.', firstMissingField);
      }
    });

    // Serviço digital: manter a escolha dos cartões e os métodos de pagamento já aprovados.
    const digitalPaymentDetails = {
      'M-Pesa': 'Titular: Munvera Nunes\nNúmero M-Pesa: 85 681 2121',
      'e-Mola': 'Titular: Munvera Nunes\nNúmero e-Mola: 86 957 5041',
      'Millennium bim': 'Titular: Munvera Dias\nConta: 1097527744\nNIB: 000100000109752774457',
      'Dinheiro': 'Pagamento presencial. Local e horário a confirmar com a empresa.'
    };
    function selectedDigital() { const radio = document.querySelector('input[name="digital-plataforma"]:checked'); return radio ? radio.value : ''; }
    function applyFastDigitalDefaults() {
      const platformInputs = document.querySelectorAll('input[name="digital-plataforma"]');
      if (platformInputs.length && !document.querySelector('input[name="digital-plataforma"]:checked')) {
        platformInputs[0].checked = true;
      }
      const paymentInputs = document.querySelectorAll('input[name="digital-pagamento-radio"]');
      if (paymentInputs.length && !document.querySelector('input[name="digital-pagamento-radio"]:checked')) {
        paymentInputs[0].checked = true;
      }
      const periodEl = $('digital-periodo');
      if (periodEl && !periodEl.value) periodEl.value = '1';
    }
    function updateDigitalLink() {
      applyFastDigitalDefaults();
      const platform = selectedDigital();
      const months = $('digital-periodo') ? Number($('digital-periodo').value) || 0 : 0;
      const unit = PRICING.digital[platform];
      const payRadio = document.querySelector('input[name="digital-pagamento-radio"]:checked');
      const payment = payRadio ? payRadio.value : '';
      const paymentDetails = digitalPaymentDetails[payment] || 'Dados a confirmar com a empresa.';
      const total = unit && months ? unit * months : null;
      const obs = trim('digital-obs');
      const totalEl = $('digital-total');
      const totalAvisoEl = $('digital-total-aviso');
      const enviarDigitalEl = $('enviar-digital');
      clearFormError('digital-erro');
      if (!platform) {
        if (totalEl) totalEl.textContent = 'Escolhe uma plataforma para veres o resumo.';
        if (totalAvisoEl) totalAvisoEl.textContent = 'Selecciona Netflix, Prime Video, Spotify ou Crunchyroll.';
      } else if (!months) {
        if (totalEl) totalEl.textContent = platform + ' — ' + unit + ' MT por mês';
        if (totalAvisoEl) totalAvisoEl.textContent = 'Escolhe a quantidade de meses para calcular o total.';
      } else {
        if (totalEl) totalEl.textContent = platform + ' · ' + months + (months === 1 ? ' mês' : ' meses') + ' · ' + money(total);
        if (totalAvisoEl) totalAvisoEl.textContent = 'Preço indicado: ' + unit + ' MT/mês × ' + months + '.';
      }
      const msg = ['Olá! Gostaria de consultar um serviço digital da Quem Poupa, Sempre Tem.',
        'Plataforma: ' + (platform || 'A escolher'),
        'Período: ' + (months ? months + (months === 1 ? ' mês' : ' meses') : 'A escolher'),
        'Preço indicado por mês: ' + (unit ? money(unit) : 'A confirmar'),
        'Total estimado: ' + (total === null ? 'A calcular' : money(total)),
        'Pagamento preferido: ' + (payment || 'A escolher'),
        'Dados do método de pagamento:\n' + paymentDetails,
        'Aguardo confirmação de disponibilidade, modalidade autorizada e preço final. Vou confirmar os dados com a empresa antes de transferir dinheiro.',
        'Observações: ' + (obs || 'Nenhuma')
      ].join('\n');
      if (enviarDigitalEl) enviarDigitalEl.href = whatsUrl(msg);
      return { platform, months, payment };
    }
    document.querySelectorAll('input[name="digital-plataforma"],input[name="digital-pagamento-radio"]').forEach(el => {
      ['input', 'change', 'click'].forEach(ev => el.addEventListener(ev, updateDigitalLink));
    });
    watch(['digital-periodo', 'digital-obs'], updateDigitalLink);
    bindClick('enviar-digital', function (e) {
      const r = updateDigitalLink();
      if (!r.platform || !r.months || !r.payment) {
        e.preventDefault();
        const missing = [];
        let firstMissingField = null;
        if (!r.platform) {
          missing.push('plataforma');
          firstMissingField = document.querySelector('input[name="digital-plataforma"]');
        }
        if (!r.months) {
          missing.push('período');
          if (!firstMissingField) firstMissingField = $('digital-periodo');
        }
        if (!r.payment) {
          missing.push('método de pagamento');
          if (!firstMissingField) firstMissingField = document.querySelector('input[name="digital-pagamento-radio"]');
        }
        showFormError('digital-erro', 'Escolhe ou confirma: ' + missing.join(', ') + '.', firstMissingField);
      }
    });
    function bindWhatsAppPreview() {
      const links = ['enviar-carne', 'enviar-estampa', 'enviar-mei', 'enviar-digital']
        .map($).filter(Boolean);
      if (!links.length) return;

      const dialog = document.createElement('dialog');
      dialog.className = 'whatsapp-preview';
      dialog.setAttribute('aria-labelledby', 'whatsapp-preview-title');
      dialog.innerHTML = '<h2 id="whatsapp-preview-title">Confirma o teu pedido</h2>' +
        '<p class="whatsapp-preview-intro">Revê a mensagem antes de continuar. O WhatsApp abrirá noutra aba e terás de confirmar o envio.</p>' +
        '<pre class="whatsapp-preview-message"></pre>' +
        '<p class="whatsapp-preview-error" role="alert" hidden></p>' +
        '<div class="whatsapp-preview-actions">' +
        '<button class="whatsapp-preview-back" type="button">Voltar para editar</button>' +
        '<a class="solidbtn whatsapp-preview-continue" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>' +
        '</div>';
      document.body.appendChild(dialog);

      const messageEl = dialog.querySelector('.whatsapp-preview-message');
      const errorEl = dialog.querySelector('.whatsapp-preview-error');
      const closeButton = dialog.querySelector('.whatsapp-preview-back');
      const continueLink = dialog.querySelector('.whatsapp-preview-continue');
      dialog.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && dialog.open) {
          e.preventDefault();
          dialog.close();
        }
      });
      closeButton.addEventListener('click', function () { dialog.close(); });
      continueLink.addEventListener('click', function () {
        window.setTimeout(function () {
          if (dialog.open) dialog.close();
        }, 100);
      });

      links.forEach(link => link.addEventListener('click', function (e) {
        if (e.defaultPrevented || typeof dialog.showModal !== 'function') return;
        e.preventDefault();
        let requestUrl;
        try {
          requestUrl = new URL(link.href);
        } catch (error) {
          errorEl.textContent = 'Não foi possível preparar a mensagem. Actualiza o pedido e tenta novamente.';
          errorEl.hidden = false;
          messageEl.hidden = true;
          continueLink.hidden = true;
          dialog.showModal();
          closeButton.focus();
          return;
        }
        const message = requestUrl.searchParams.get('text');
        if (requestUrl.hostname !== 'wa.me' || !message) {
          errorEl.textContent = 'Não foi possível preparar a mensagem. Actualiza o pedido e tenta novamente.';
          errorEl.hidden = false;
          messageEl.hidden = true;
          continueLink.hidden = true;
        } else {
          messageEl.textContent = message;
          messageEl.hidden = false;
          errorEl.hidden = true;
          continueLink.href = requestUrl.href;
          continueLink.hidden = false;
        }
        dialog.showModal();
        closeButton.focus();
      }));
    }
    bindWhatsAppPreview();
    function updateActiveTab() {
      const hash = window.location.hash || '#painel-carne';
      const activeTab = document.querySelector('.pilltab[href="' + hash + '"]') || document.querySelector('.pilltab[href="#painel-carne"]');
      document.querySelectorAll('.pilltab').forEach(tab => {
        const isActive = tab === activeTab;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }
    document.addEventListener('input', function (e) {
      if (e.target && (e.target.id === 'kg' || e.target.id === 'modo')) updatePork();
      if (e.target && (e.target.id === 'capital' || e.target.id === 'meses')) updateMEI();
    });
    document.addEventListener('change', function (e) {
      if (e.target && (e.target.id === 'kg' || e.target.id === 'modo')) updatePork();
      if (e.target && (e.target.id === 'capital' || e.target.id === 'meses')) updateMEI();
    });
    window.addEventListener('hashchange', updateActiveTab);
    renderCatalogValues();
    applyFastDigitalDefaults();
    updatePork(); updateStamp(); updateMEI(); updateDigitalLink();
    updateActiveTab();
    const calcBrowserWarning = $('calc-browser-warning');
    if (calcBrowserWarning) calcBrowserWarning.hidden = true;
  
