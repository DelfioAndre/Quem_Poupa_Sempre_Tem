
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
    const round = x => Math.round((x + Number.EPSILON) * 100) / 100;
    const money = n => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(round(n)) + ' MT';
    const trim = id => {
      const el = $(id);
      return String((el && el.value) || '').trim();
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
    function calculatePork() {
      const q = parseAmount(trim('kg'));
      const ok = Number.isFinite(q) && q > 0 && q <= 100000;
      const delivery = $('modo') ? $('modo').value === 'entrega' : false;
      const s = ok ? round(q * 210) : 0;
      const fee = ok && delivery && q <= 10 ? 100 : 0;
      setText('q-kg', ok ? q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg' : '—');
      setText('subtotal', ok ? money(s) : '—');
      setText('taxa', ok ? (delivery ? (fee === 0 ? 'Grátis' : money(fee)) : 'Sem entrega') : '—');
      setText('total-carne', ok ? money(s + fee) : '—');
      setText('live-kg', ok ? q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg' : '—');
      setText('live-pork', ok ? money(s + fee) : '—');
      setText('status-carne', ok ? 'Total actualizado automaticamente: ' + money(s + fee) : 'Introduz uma quantidade válida, maior que zero.');
      setText('carne-formula', ok ?
        q.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' kg × 210 MT = ' + money(s) + (delivery ? ' + ' + money(fee) + ' de entrega' : ' (levantamento)') + ' → ' + money(s + fee) :
        'Valor = quilogramas × 210 MT + entrega, quando aplicável.');
      setText('erro-carne', '');
      return ok ? { q, s, fee, delivery, total: round(s + fee) } : null;
    }
    function updatePork() {
      const r = calculatePork();
      if (!r) { setHref('enviar-carne', '#painel-carne'); return null; }
      setHref('enviar-carne', whatsUrl([
        'Olá! Quero consultar a disponibilidade de carne de porco nacional.', '',
        'Quantidade: ' + r.q + ' kg', 'Preço por kg: 210 MT',
        'Subtotal: ' + money(r.s),
        'Modalidade: ' + (r.delivery ? 'Entrega' : 'Levantamento a combinar'),
        'Taxa de entrega: ' + (r.delivery ? (r.fee === 0 ? 'Grátis' : money(r.fee)) : 'Sem entrega'),
        'Total estimado: ' + money(r.total),
        'Bairro/local: ' + (trim('bairro') || 'A informar'),
        'Data pretendida: ' + (trim('data') || 'A combinar'),
        'Observações: ' + (trim('obs') || 'Nenhuma'), '', 'Aguardo confirmação de disponibilidade e do valor final.'
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
        const errorEl = $('erro-carne');
        if (errorEl) errorEl.textContent = 'Indica uma quantidade válida em quilogramas antes de enviar.';
        const kgEl = $('kg');
        if (kgEl) kgEl.focus();
      }
    });

    function updateStamp() {
      const produto = $('produto') ? $('produto').value : '';
      const qty = $('qtd') ? Number($('qtd').value) : 0;
      const qok = Number.isInteger(qty) && qty > 0 && qty <= 100000;
      const modelo = trim('modelo'), arte = trim('arte');
      $('estampa-produto').textContent = produto;
      $('estampa-quantidade').textContent = qok ? qty + ' unidade' + (qty === 1 ? '' : 's') : '—';
      $('estampa-modelo').textContent = modelo || 'A informar';
      $('estampa-arte').textContent = arte ? (arte.length > 85 ? arte.slice(0, 85) + '…' : arte) : 'A informar';
      $('estampa-total').textContent = 'Sob orçamento';
      $('status-estampa').textContent = qok ? 'Resumo actualizado para ' + qty + ' unidade' + (qty === 1 ? '' : 's') + '. Preço a confirmar.' : 'Introduz uma quantidade válida.';
      $('erro-estampa').textContent = '';
      if (!qok) { $('enviar-estampa').href = '#painel-estampa'; return null; }
      $('enviar-estampa').href = whatsUrl([
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
        const errorEl = $('erro-estampa');
        if (errorEl) {
          errorEl.textContent = 'Indica uma quantidade válida, o modelo/tamanho e a descrição da personalização.';
          errorEl.scrollIntoView({ block: 'center' });
        }
      }
    });

    function calculateMEI() {
      const c = parseAmount(trim('capital'));
      const m = Number(trim('meses'));
      const ok = Number.isFinite(c) && c > 0 && c <= 100000000 && Number.isInteger(m) && m > 0 && m <= 120;
      const rate = .30;
      const perMonth = ok ? round(c * rate) : 0;
      const j = ok ? round(c * rate * m) : 0;
      $('sim-capital').textContent = ok ? money(c) : '—';
      $('sim-juros').textContent = ok ? money(j) : '—';
      $('sim-juros-mes').textContent = ok ? money(perMonth) : '—';
      $('sim-formula').textContent = ok ?
        money(c) + ' × 30% × ' + m + (m === 1 ? ' mês' : ' meses') + ' = ' + money(j) + ' de juros; capital + juros = ' + money(c + j) + '.' :
        'Insere o valor pretendido para veres os juros e o total.';
      $('sim-prazo').textContent = ok ? m + (m === 1 ? ' mês' : ' meses') : '—';
      $('sim-total').textContent = ok ? money(c + j) : '—';
      $('live-interest').textContent = ok ? money(j) : '—';
      $('live-loan-total').textContent = ok ? money(c + j) : '—';
      $('status-mei').textContent = ok ? 'Simulação automática: ' + money(j) + ' de juros e ' + money(c + j) + ' de total.' : 'Indica um montante positivo e prazo de 1 a 120 meses.';
      $('erro-mei').textContent = '';
      return ok ? { c, m, j, total: round(c + j) } : null;
    }
    function updateMEI() {
      const r = calculateMEI();
      if (!r) { $('enviar-mei').href = '#painel-mei'; return null; }
      const msg = [
        'Olá! Gostaria de apresentar um PRÉ-PEDIDO DE INFORMAÇÃO sobre empréstimo à MEI – Juros & Dívidas.', '',
        'Nome completo: ' + (trim('mei-nome') || 'A informar'),
        'Idade: ' + ($('mei-maior').checked ? '18 anos ou mais confirmado' : 'A confirmar'),
        'BI válido: ' + ($('mei-bi').checked ? 'Confirmado (sem envio de documento)' : 'A confirmar'),
        'Zona de residência: ' + (trim('mei-residencia') || 'A informar'),
        'Comprovativo de residência: ' + ($('mei-comprovativo').value || 'A informar'),
        'Situação de rendimento: ' + ($('mei-rendimento').value || 'A informar'),
        'Valor pretendido: ' + money(r.c),
        'Prazo pretendido: ' + r.m + (r.m === 1 ? ' mês' : ' meses'),
        'Garantia que poderia apresentar: ' + (trim('mei-garantia') || 'A avaliar com o responsável'),
        'Simulação ilustrativa de juros simples (30% ao mês): ' + money(r.j),
        'Total matemático simulado: ' + money(r.total),
        'Observações: ' + (trim('mei-observacoes') || 'Nenhuma'), '', 'Esta mensagem não corresponde a uma oferta nem aprovação de crédito. Solicito informações sobre condições futuras.'
      ].join('\n');
      $('enviar-mei').href = whatsUrl(msg);
      return r;
    }
    watch(['capital', 'meses', 'mei-nome', 'mei-residencia', 'mei-comprovativo', 'mei-rendimento', 'mei-garantia', 'mei-observacoes', 'mei-maior', 'mei-bi', 'mei-consente'], updateMEI);
    document.querySelectorAll('[data-capital]').forEach(btn => btn.addEventListener('click', function () {
      $('capital').value = this.dataset.capital;
      updateMEI();
    }));
    bindClick('atualizar-mei', updateMEI);
    bindClick('enviar-mei', function (e) {
      const r = updateMEI(); let missing = [];
      if (trim('mei-nome').length < 3) missing.push('nome completo');
      if (!r) missing.push('valor e prazo válidos');
      if (!trim('mei-residencia')) missing.push('bairro/zona');
      if (!$('mei-comprovativo').value) missing.push('comprovativo');
      if (!$('mei-rendimento').value) missing.push('rendimento');
      if (!$('mei-maior').checked) missing.push('idade mínima');
      if (!$('mei-bi').checked) missing.push('BI válido');
      if (!$('mei-consente').checked) missing.push('autorização de envio');
      if (missing.length) {
        e.preventDefault();
        const errorEl = $('erro-mei');
        if (errorEl) {
          errorEl.textContent = 'Falta preencher ou confirmar: ' + missing.join(', ') + '.';
          errorEl.scrollIntoView({ block: 'center' });
        }
      }
    });

    // Serviço digital: manter a escolha dos cartões e os métodos de pagamento já aprovados.
    const digitalPrices = { 'Netflix': 280, 'Amazon Prime Video': 200, 'Spotify': 120, 'Crunchyroll': 180 };
    function selectedDigital() { const radio = document.querySelector('input[name="digital-plataforma"]:checked'); return radio ? radio.value : ''; }
    function updateDigitalLink() {
      const platform = selectedDigital();
      const months = $('digital-periodo') ? Number($('digital-periodo').value) || 0 : 0;
      const unit = digitalPrices[platform];
      const payRadio = document.querySelector('input[name="digital-pagamento-radio"]:checked');
      const payment = payRadio ? payRadio.value : '';
      const total = unit && months ? unit * months : null;
      const obs = trim('digital-obs');
      if (!platform) { $('digital-total').textContent = 'Escolhe uma plataforma para veres o resumo.'; $('digital-total-aviso').textContent = 'Selecciona Netflix, Prime Video, Spotify ou Crunchyroll.'; }
      else if (!months) { $('digital-total').textContent = platform + ' — ' + unit + ' MT por mês'; $('digital-total-aviso').textContent = 'Escolhe a quantidade de meses para calcular o total.'; }
      else { $('digital-total').textContent = platform + ' · ' + months + (months === 1 ? ' mês' : ' meses') + ' · ' + money(total); $('digital-total-aviso').textContent = 'Preço indicado: ' + unit + ' MT/mês × ' + months + '.'; }
      const msg = ['Olá! Gostaria de consultar um serviço digital da Quem Poupa, Sempre Tem.',
        'Plataforma: ' + (platform || 'A escolher'),
        'Período: ' + (months ? months + (months === 1 ? ' mês' : ' meses') : 'A escolher'),
        'Preço indicado por mês: ' + (unit ? money(unit) : 'A confirmar'),
        'Total estimado: ' + (total === null ? 'A calcular' : money(total)),
        'Pagamento preferido: ' + (payment || 'A escolher'),
        'Observações: ' + (obs || 'Nenhuma'),
        'Aguardo confirmação de disponibilidade, modalidade autorizada e preço final antes de pagar.'
      ].join('\n');
      $('enviar-digital').href = whatsUrl(msg);
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
        const errorEl = $('digital-erro');
        if (errorEl) {
          errorEl.textContent = 'Escolhe plataforma, meses e método de pagamento.';
          errorEl.scrollIntoView({ block: 'center' });
        }
      } else {
        const errorEl = $('digital-erro');
        if (errorEl) errorEl.textContent = '';
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target && (e.target.id === 'kg' || e.target.id === 'modo')) updatePork();
      if (e.target && (e.target.id === 'capital' || e.target.id === 'meses')) updateMEI();
    });
    document.addEventListener('change', function (e) {
      if (e.target && (e.target.id === 'kg' || e.target.id === 'modo')) updatePork();
      if (e.target && (e.target.id === 'capital' || e.target.id === 'meses')) updateMEI();
    });
    updatePork(); updateStamp(); updateMEI(); updateDigitalLink();
    $('calc-browser-warning').hidden = true;
  
