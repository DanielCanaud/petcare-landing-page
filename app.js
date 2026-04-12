// ...existing code...
// ====================================
// 1. VALIDAÇÃO EM TEMPO REAL
// ====================================
const form = document.getElementById("form-agendamento");
const inputs = form?.querySelectorAll("input, select") || [];

function validarCampo(field) {
  const errorSpan = document.querySelector(`[data-error-for="${field.name}"]`);
  if (!errorSpan) return true;

  let valido = true;
  let mensagem = "";

  if (field.name === "servico" && !field.value) {
    valido = false;
    mensagem = "Selecione um serviço";
  } else if (field.name === "nomePet" && !field.value.trim()) {
    valido = false;
    mensagem = "Nome do pet obrigatório";
  } else if (field.name === "tutor" && !field.value.trim()) {
    valido = false;
    mensagem = "Nome do tutor obrigatório";
  } else if (field.name === "telefone" && !validarTelefone(field.value)) {
    valido = false;
    mensagem = "Telefone inválido";
  } else if (field.name === "data" && !field.value) {
    valido = false;
    mensagem = "Data obrigatória";
  } else if (field.name === "data" && field.value) {
    const dataSelecionada = new Date(field.value + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataSelecionada < hoje) {
      valido = false;
      mensagem = "Data não pode ser no passado";
    }
  } else if (field.name === "hora" && !field.value) {
    valido = false;
    mensagem = "Hora obrigatória";
  }

  errorSpan.textContent = valido ? "" : mensagem;
  field.style.borderColor = valido ? "" : "rgba(239,68,68,.55)";
  return valido;
}

// Listeners de validação em tempo real
inputs.forEach(input => {
  input.addEventListener("blur", () => validarCampo(input));
  input.addEventListener("change", () => validarCampo(input));
});

// ====================================
// 2. MÁSCARA DE TELEFONE
// ====================================
function validarTelefone(valor) {
  const apenas = valor.replace(/\D/g, "");
  return apenas.length === 11;
}

function formatarTelefone(valor) {
  const apenas = valor.replace(/\D/g, "").slice(0, 11);
  if (!apenas) return "";
  if (apenas.length <= 2) return `(${apenas}`;
  if (apenas.length <= 6) return `(${apenas.slice(0,2)}) ${apenas.slice(2)}`;
  if (apenas.length <= 10)
    return `(${apenas.slice(0,2)}) ${apenas.slice(2,6)}-${apenas.slice(6)}`;
  return `(${apenas.slice(0,2)}) ${apenas.slice(2,7)}-${apenas.slice(7)}`;
}

const telInput = document.getElementById("telefone");
if (telInput) {
  telInput.addEventListener("input", (e) => {
    const valor = telInput.value;
    const cursorAntes = telInput.selectionStart;
    
    // Contar quantos números tinha antes do cursor
    const numerosAntes = valor.slice(0, cursorAntes).replace(/\D/g, "").length;
    
    // Formatar o telefone
    telInput.value = formatarTelefone(valor);
    
    // Calcular nova posição do cursor baseado no número de dígitos
    let novaPosicao = 0;
    let contNumeros = 0;
    
    for (let i = 0; i < telInput.value.length; i++) {
      if (/\d/.test(telInput.value[i])) {
        contNumeros++;
        if (contNumeros === numerosAntes) {
          novaPosicao = i + 1;
          break;
        }
      }
    }
    
    // Se chegou ao final dos números, posiciona após o último dígito
    if (contNumeros < numerosAntes) {
      novaPosicao = telInput.value.length;
    }
    
    telInput.setSelectionRange(novaPosicao, novaPosicao);
  });
}

// ====================================
// 3. HORÁRIOS DINÂMICOS
// ====================================
const dataInput = document.getElementById("data");
const horaSelect = document.getElementById("hora");

function preencherHoras() {
  if (!horaSelect) return;
  const horarios = [
    "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
    "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"
  ];
  horaSelect.innerHTML = '<option value="">Selecione um horário</option>' + 
    horarios.map(h => `<option value="${h}">${h}</option>`).join("");
}

function ajustarHorasParaHoje() {
  if (!dataInput || !horaSelect) return;
  preencherHoras();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const selecionada = new Date(dataInput.value + "T00:00:00");
  if (isNaN(selecionada)) return;
  
  if (selecionada.getTime() === hoje.getTime()) {
    const agora = new Date();
    const opcoes = Array.from(horaSelect.options);
    opcoes.forEach(opt => {
      const [hh, mm] = opt.value.split(":").map(Number);
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      opt.disabled = d <= agora;
    });
  } else {
    Array.from(horaSelect.options).forEach(opt => opt.disabled = false);
  }
}

if (dataInput && horaSelect) {
  dataInput.addEventListener("change", ajustarHorasParaHoje);
  preencherHoras();
  ajustarHorasParaHoje();
}

// ====================================
// 4. SALVAR AGENDAMENTO (localStorage)
// ====================================
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const elementos = Array.from(form.querySelectorAll("input, select"));
    const todosValidos = elementos.map(el => validarCampo(el)).every(v => v);
    if (!todosValidos) return;

    const novo = {
      id: Date.now().toString(36),
      servico: form.querySelector("[name=servico]")?.value || "",
      nomePet: form.querySelector("[name=nomePet]")?.value || "",
      tutor: form.querySelector("[name=tutor]")?.value || "",
      telefone: form.querySelector("[name=telefone]")?.value || "",
      data: form.querySelector("[name=data]")?.value || "",
      hora: form.querySelector("[name=hora]")?.value || "",
      status: "analise",
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
    agendamentos.unshift(novo);
    localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
    localStorage.setItem("ultimoAgendamento", JSON.stringify(novo));

    if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {
      window.location.href = "confirmação.html";
    } else {
      renderizarAgendamentos();
    }
  });
}

// ====================================
// 5. EXIBIR ÚLTIMO AGENDAMENTO (confirmação.html)
// ====================================
const ultimoAgendamentoDiv = document.getElementById("ultimo-agendamento");
if (ultimoAgendamentoDiv) {
  const ultimo = JSON.parse(localStorage.getItem("ultimoAgendamento"));
  if (ultimo) {
    ultimoAgendamentoDiv.innerHTML = `
      <div class="last-card">
        <h3>${ultimo.nomePet} — ${ultimo.tutor}</h3>
        <p class="muted">${ultimo.servico}</p>
        <div class="meta">
          <div class="t">Data</div>
          <div class="v">${new Date(ultimo.data + "T00:00:00").toLocaleDateString("pt-BR")} às ${ultimo.hora}</div>
        </div>
        <div class="meta">
          <div class="t">Telefone</div>
          <div class="v">${ultimo.telefone}</div>
        </div>
      </div>
    `;
  } else {
    ultimoAgendamentoDiv.textContent = "Nenhum agendamento recente encontrado.";
  }
}

// ====================================
// 6. DASHBOARD - LISTAR & FILTRAR (agenda.html)
// ====================================
const listaAgendamentos = document.getElementById("lista-agendamentos");
const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const emptyState = document.getElementById("empty-state");
const statsDiv = document.getElementById("stats");

function atualizarStats() {
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
  const total = agendamentos.length;
  const analise = agendamentos.filter(a => a.status === "analise").length;
  const confirmado = agendamentos.filter(a => a.status === "confirmado").length;
  const cancelado = agendamentos.filter(a => a.status === "cancelado").length;

  if (!statsDiv) return;
  statsDiv.innerHTML = `
    <div class="stat">
      <div class="kpi">${total}</div>
      <div class="label">Total</div>
    </div>
    <div class="stat">
      <div class="kpi">${analise}</div>
      <div class="label">Em análise</div>
    </div>
    <div class="stat">
      <div class="kpi">${confirmado}</div>
      <div class="label">Confirmados</div>
    </div>
    <div class="stat">
      <div class="kpi">${cancelado}</div>
      <div class="label">Cancelados</div>
    </div>
  `;
}

function atualizarStatus(id, novoStatus) {
  const agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];
  const idx = agendamentos.findIndex(a => a.id === id);
  if (idx === -1) return;
  agendamentos[idx].status = novoStatus;
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  renderizarAgendamentos(filterStatus?.value || "all", searchInput?.value || "");
}

function renderizarAgendamentos(filtro = "all", busca = "") {
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || [];

  // Filtrar por status
  if (filtro !== "all") {
    agendamentos = agendamentos.filter(a => a.status === filtro);
  }

  // Buscar por texto
 if (busca) {
    const b = busca.toLowerCase();
    agendamentos = agendamentos.filter(a =>
      (a.nomePet || "").toLowerCase().includes(b) ||
      (a.tutor || "").toLowerCase().includes(b) ||
      (a.servico || "").toLowerCase().includes(b)
    );
  }

  // Mostrar/ocultar empty state
  if (agendamentos.length === 0) {
    if (emptyState) emptyState.hidden = false;
  } else {
    if (emptyState) emptyState.hidden = true;
  }

  if (listaAgendamentos) {
    listaAgendamentos.innerHTML = agendamentos.map(a => `
      <div class="item">
        <div class="item__top">
          <h3>${a.nomePet} <small class="muted">(${a.tutor})</small></h3>
          <span class="badge ${a.status === 'analise' ? 'badge--analise' : a.status === 'confirmado' ? 'badge--confirmado' : 'badge--cancelado'}">
            ${a.status === 'analise' ? 'Em análise' : a.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}
          </span>
        </div>
        <div class="item__meta">
          <div class="meta"><div class="t">Serviço</div><div class="v">${a.servico}</div></div>
          <div class="meta"><div class="t">Data</div><div class="v">${new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}</div></div>
          <div class="meta"><div class="t">Hora</div><div class="v">${a.hora}</div></div>
          <div class="meta"><div class="t">Telefone</div><div class="v">${a.telefone}</div></div>
          <div class="meta"><div class="t">Criado em</div><div class="v">${a.criadoEm}</div></div>
        </div>
        <div class="item__actions">
          <button class="btn btn--ghost btn-confirmar" data-id="${a.id}" ${a.status === "confirmado" ? "disabled" : ""}>✓ Confirmar</button>
          <button class="btn btn--danger btn-cancelar" data-id="${a.id}" ${a.status === "cancelado" ? "disabled" : ""}>✕ Cancelar</button>
          ${a.status === "cancelado" ? `<button class="btn btn--danger btn-remover" data-id="${a.id}">🗑 Remover</button>` : ''}
        </div>
      </div>
    `).join("");

    // Atualizar stats
    atualizarStats();

    // ADICIONAR listeners (APÓS renderizar elementos)
    document.querySelectorAll(".btn-confirmar").forEach(btn => {
      btn.addEventListener("click", () => atualizarStatus(btn.dataset.id, "confirmado"));
    });
    document.querySelectorAll(".btn-cancelar").forEach(btn => {
      btn.addEventListener("click", () => atualizarStatus(btn.dataset.id, "cancelado"));
    });
    document.querySelectorAll(".btn-remover").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!confirm("Deseja remover este agendamento permanentemente?")) return;
        const ags = JSON.parse(localStorage.getItem("agendamentos")) || [];
        const atualizado = ags.filter(a => a.id !== btn.dataset.id);
        localStorage.setItem("agendamentos", JSON.stringify(atualizado));
        renderizarAgendamentos(filterStatus?.value || "all", searchInput?.value || "");
        atualizarStats();
      });
    });
  }
}
// Listeners agenda
if (searchInput) {
  searchInput.addEventListener("input", () => 
    renderizarAgendamentos(filterStatus?.value || "all", searchInput.value)
  );
}

if (filterStatus) {
  filterStatus.addEventListener("change", () => 
    renderizarAgendamentos(filterStatus.value, searchInput?.value || "")
  );
}

// Renderizar ao carregar agenda
if (listaAgendamentos) {
  renderizarAgendamentos();
}

// BOTÃO: limpar histórico de agendamentos (agenda.html)
const btnClearHistory = document.getElementById("btn-clear-history");
if (btnClearHistory) {
  btnClearHistory.addEventListener("click", (e) => {
    e.preventDefault();
    const ok = confirm('Deseja limpar todo o histórico de agendamentos?');
    if (!ok) return;
    localStorage.removeItem('agendamentos');
    localStorage.removeItem('ultimoAgendamento');
    renderizarAgendamentos();
    if (listaAgendamentos) listaAgendamentos.innerHTML = '';
    atualizarStats();
  });
}

// ====================================
// 7. RODAPÉ - ANO ATUAL
// ====================================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ====================================
// 8. BOTÃO WHATSAPP (FLUTUANTE)
// ====================================
// CONFIGURAÇÃO: substitua WHATSAPP_NUMBER pelo seu número com código do país sem sinais.
// Exemplo para Brasil: "5511999998888" (55 = BR, 11 = DDD, resto = número).
// Se preferir direcionar a uma página externa em vez do chat, preencha EXTERNAL_URL.

(function initWhatsAppButton(){
  const WHATSAPP_NUMBER = "351968208602"; // ex: "5511999998888"
  const WHATSAPP_MESSAGE = "Olá, gostaria de tirar uma dúvida.";
  const EXTERNAL_URL = "https://api.whatsapp.com/send/?phone=351968208602&text=Olá%2C+gostaria+de+tirar+uma+dúvida.&type=phone_number&app_absent=0"; // ex: "https://exemplo.com/duvidas"  (se preenchido, o botão abre essa URL)

  function createButton() {
    const href = EXTERNAL_URL || `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

    const style = document.createElement("style");
    style.textContent = `
      .whatsapp-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;background:#25D366;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;text-decoration:none}
      .whatsapp-btn svg{width:28px;height:28px;fill:#fff}
      .whatsapp-btn:hover{transform:translateY(-3px);transition:transform .15s ease}
    `;
    document.head.appendChild(style);

    const a = document.createElement("a");
    a.className = "whatsapp-btn";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = "Tirar dúvidas";
    a.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white"><path d="M20.52 3.48A11.9 11.9 0 0 0 12 .08C6.06.08 1.08 5.06 1.08 11c0 1.93.5 3.8 1.47 5.45L.09 23l6.7-1.76A11.92 11.92 0 0 0 12 22c5.94 0 10.92-4.98 10.92-11 0-1.99-.56-3.86-1.4-5.52zM12 20.2c-1.6 0-3.16-.42-4.52-1.22l-.33-.2-3.98 1.05 1.06-3.9-.21-.34A8.8 8.8 0 0 1 3.2 11c0-4.87 3.95-8.82 8.8-8.82 2.36 0 4.57.92 6.24 2.6A8.75 8.75 0 0 1 20.8 11c0 4.86-3.95 8.82-8.8 8.82z"/><path d="M17.1 14.2c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15s-.78.97-.95 1.17c-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.28-.02-.43.13-.57.13-.13.3-.34.45-.5.15-.17.2-.28.3-.47.1-.18 0-.34-.05-.48-.05-.15-.68-1.64-.93-2.25-.24-.6-.48-.52-.66-.53l-.56-.01c-.18 0-.47.07-.72.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.68 1.13 2.87.15.2 1.95 3 4.74 4.2 3.3 1.4 3.3 0 3.9-.06.6-.07 1.97-.8 2.25-1.57.28-.77.28-1.43.2-1.57-.08-.15-.28-.24-.58-.39z"/></svg>`;

    document.body.appendChild(a);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createButton);
  } else {
    createButton();
  }
})();
// ...existing code...