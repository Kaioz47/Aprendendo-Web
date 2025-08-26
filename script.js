// ==========================
// Helpers
// ==========================
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

// ==========================
// MENU MOBILE (hamburger)
// ==========================
(() => {
  const menuBtn = qs(".hamburger");
  const menu = qs(".menu");
  if (!menuBtn || !menu) return;

  menuBtn.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    menu.classList.toggle("open");
  });

  // Fechar menu ao clicar em um link (mobile)
  qsa(".menu a").forEach(a =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    })
  );
})();

// ==========================
// DARK/LIGHT THEME TOGGLE
// ==========================
(() => {
  const toggleDark = qs("#toggleDark");
  if (!toggleDark) return;

  const applyTheme = (t) => {
    document.body.classList.toggle("dark", t === "dark");
    toggleDark.setAttribute("aria-pressed", String(t === "dark"));
  };

  const stored = localStorage.getItem("theme");
  if (stored) applyTheme(stored);

  toggleDark.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    const theme = isDark ? "dark" : "light";
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  });
})();

// ==========================
// TEXT-TO-SPEECH (toggle geral)
// ==========================
const speech = (() => {
  let enabled = false;
  const btn = qs("#speakBtn");

  const speak = (text) => {
    if (!enabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // tentar voz pt-BR
    const voices = window.speechSynthesis.getVoices();
    const br = voices.find(v => /pt-BR/i.test(v.lang)) || voices.find(v => /pt/i.test(v.lang));
    if (br) u.voice = br;
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  if (btn) {
    btn.addEventListener("click", () => {
      enabled = !enabled;
      btn.setAttribute("aria-pressed", String(enabled));
      btn.title = enabled ? "Narração ligada" : "Narração desligada";
    });

    // Em alguns navegadores, as vozes carregam async:
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }

  return { speak, get enabled() { return enabled; } };
})();

// ==========================
// CONCEITOS (com digitação)
// ==========================
(() => {
  const conceptBox = qs("#conceptBox");
  const buttons = qsa(".btn.tag[data-concept]");
  if (!conceptBox || !buttons.length) return;

  const texts = {
    html: `HTML é a linguagem de marcação que estrutura o conteúdo da web.
Você define títulos, parágrafos, links, imagens e a hierarquia da página.
Pense no HTML como o esqueleto da sua aplicação.`,
    css: `CSS é a linguagem de estilo que dá aparência ao seu site.
Cores, fontes, espaçamento, layout responsivo e animações: tudo com CSS.
Ele é o "visual" em cima do HTML.`,
    js: `JavaScript adiciona lógica e interatividade.
Validar formulários, buscar dados, reagir a cliques e atualizar a tela sem recarregar.
É o cérebro da sua aplicação web.`,
    dom: `DOM é a representação do documento na memória do navegador.
Com JavaScript, você lê e altera o DOM para mudar conteúdo, estilos e eventos em tempo real.
É a ponte entre o HTML e o JS.`
  };

  // Efeito de digitação com cancelamento entre cliques
  let typingToken = 0;

  function typeText(el, fullText, speed = 12) {
    typingToken++;
    const token = typingToken;
    el.innerHTML = "";
    el.setAttribute("aria-busy", "true");

    const lines = fullText.split("\n");
    let line = 0, idx = 0;

    function tick() {
      if (token !== typingToken) return; // cancelado
      if (line >= lines.length) {
        el.setAttribute("aria-busy", "false");
        el.focus({ preventScroll: true });
        return;
      }
      const current = lines[line];
      if (idx <= current.length) {
        const content =
          lines.slice(0, line).map(l => l).join("<br>") +
          (line > 0 ? "<br>" : "") +
          current.slice(0, idx);
        el.innerHTML = content;
        idx++;
        setTimeout(tick, speed);
      } else {
        line++;
        idx = 0;
        setTimeout(tick, speed * 4);
      }
    }
    tick();
  }

  // Estado ativo e persistência
  function setActive(btn) {
    buttons.forEach(b => b.classList.toggle("active", b === btn));
  }

  function showConcept(key, fromBtn = null) {
    const text = texts[key] || "Conteúdo não encontrado.";
    typeText(conceptBox, text);
    conceptBox.setAttribute("tabindex", "-1");
    localStorage.setItem("lastConcept", key);
    if (speech.enabled) speech.speak(text);
    if (fromBtn) setActive(fromBtn);
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-concept");
      showConcept(key, btn);
    });
  });

  // carregar último conceito ou HTML por padrão
  const initial = localStorage.getItem("lastConcept") || "html";
  const initialBtn = buttons.find(b => b.getAttribute("data-concept") === initial) || buttons[0];
  setActive(initialBtn);
  showConcept(initial, initialBtn);
})();

// ==========================
// EDITOR DE CÓDIGO
// ==========================
(() => {
  const runBtn = qs("#runCode");
  const resetBtn = qs("#resetCode");
  const copyAllBtn = qs("#copyAll");

  const htmlCode = qs("#htmlCode");
  const cssCode = qs("#cssCode");
  const jsCode = qs("#jsCode");
  const preview = qs("#preview");

  if (!runBtn || !resetBtn || !copyAllBtn || !htmlCode || !cssCode || !jsCode || !preview) return;

  const initial = {
    html: htmlCode.value,
    css: cssCode.value,
    js: jsCode.value
  };

  function runCode() {
    const code = `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>${cssCode.value}</style>
</head>
<body>
${htmlCode.value}
<script>
${jsCode.value}
<\/script>
</body></html>`;
    preview.srcdoc = code;
  }

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    htmlCode.value = initial.html;
    cssCode.value = initial.css;
    jsCode.value = initial.js;
    runCode();
  });

  copyAllBtn.addEventListener("click", async () => {
    const allCode =
`HTML:
${htmlCode.value}

CSS:
${cssCode.value}

JS:
${jsCode.value}`;
    try {
      await navigator.clipboard.writeText(allCode);
      alert("Códigos copiados!");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = allCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Códigos copiados!");
    }
  });

  // Pré-rodar para mostrar algo no iframe
  runCode();
})();

// ==========================
// QUIZ INTERATIVO + PROGRESSO
// ==========================
(() => {
  const quizData = [
    { q: "O que significa HTML?", 
      options: ["Hyper Trainer Markup Language", "Hyper Text Markup Language", "High Text Machine Language"], 
      answer: 1 },
    { q: "CSS serve para:", 
      options: ["Estilizar páginas", "Criar bancos de dados", "Executar lógica"], 
      answer: 0 },
    { q: "JavaScript é usado para:", 
      options: ["Estilizar páginas", "Interatividade e lógica", "Hospedar sites"], 
      answer: 1 },
    { q: "O que é DOM?", 
      options: ["Banco de dados do navegador", "Árvore do documento manipulável", "Servidor de páginas"], 
      answer: 1 }
  ];

  const quizBox = qs("#quizBox");
  const restartQuiz = qs("#restartQuiz");
  const progress = qs("#quizProgress");
  if (!quizBox || !restartQuiz) return;

  let answered = 0;

  function updateProgress() {
    if (!progress) return;
    const pct = Math.round((answered / quizData.length) * 100);
    progress.value = pct;
    progress.textContent = `${pct}%`;
  }

  function loadQuiz() {
    answered = 0;
    quizBox.innerHTML = "";
    quizData.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "quiz-item";
      const questionId = `q${i}`;
      div.innerHTML = `
        <p class="quiz-q"><strong>${i + 1}.</strong> ${item.q}</p>
        <div class="quiz-opts" role="group" aria-labelledby="${questionId}">
          ${item.options.map((opt, j) => 
            `<button class="btn quiz-opt" data-q="${i}" data-a="${j}">${opt}</button>`
          ).join("")}
        </div>
        <p class="quiz-feedback" aria-live="polite"></p>
      `;
      quizBox.appendChild(div);
    });
    updateProgress();
  }

  function lockQuestion(container) {
    qsa(".quiz-opt", container).forEach(b => b.disabled = true);
  }

  quizBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".quiz-opt");
    if (!btn) return;
    const q = Number(btn.getAttribute("data-q"));
    const a = Number(btn.getAttribute("data-a"));
    const item = quizData[q];
    const container = btn.closest(".quiz-item");
    const feedback = qs(".quiz-feedback", container);

    const correct = item.answer === a;
    if (correct) {
      btn.classList.add("is-correct");
      feedback.textContent = "✅ Resposta correta!";
    } else {
      btn.classList.add("is-wrong");
      feedback.textContent = "❌ Tente novamente. A resposta correta foi destacada.";
      // destacar correta
      const correctBtn = qs(`.quiz-opt[data-q="${q}"][data-a="${item.answer}"]`, container);
      if (correctBtn) correctBtn.classList.add("is-correct");
    }
    lockQuestion(container);
    answered++;
    updateProgress();
  });

  restartQuiz.addEventListener("click", loadQuiz);

  loadQuiz();
})();

// ==========================
// FORMULÁRIO DE CONTATO
// ==========================
(() => {
  const form = qs("#contactForm");
  const feedback = qs("#formFeedback");
  if (!form || !feedback) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validação simples
    const data = new FormData(form);
    const nome = (data.get("nome") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const mensagem = (data.get("mensagem") || "").toString().trim();

    if (nome.length < 2 || mensagem.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = "Verifique os campos: preencha corretamente antes de enviar.";
      feedback.classList.remove("ok");
      feedback.classList.add("err");
      return;
    }

    // Sucesso (simulado)
    feedback.textContent = "Mensagem enviada com sucesso ✅";
    feedback.classList.remove("err");
    feedback.classList.add("ok");
    form.reset();
  });
})();

// ==========================
// VOLTAR AO TOPO
// ==========================
(() => {
  const backToTop = qs("#backToTop");
  if (!backToTop) return;

  const toggle = () => {
    backToTop.style.display = window.scrollY > 300 ? "block" : "none";
  };
  window.addEventListener("scroll", toggle);
  toggle();

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ==========================
// DESAFIO RELÂMPAGO (30s)
// ==========================
// ==========================
// DESAFIO RELÂMPAGO (30s)
// ==========================
(() => {
  const startBtn = document.querySelector("#startChallenge");
  const timerEl = document.querySelector("#timer");

  if (!startBtn || !timerEl) return; // evita erro se não existir

  let intId = null;

  startBtn.addEventListener("click", () => {
    let t = 30;
    timerEl.textContent = `${t}s`;
    startBtn.disabled = true; // desabilita o botão durante a contagem
    clearInterval(intId);

    intId = setInterval(() => {
      t--;
      timerEl.textContent = `${t}s`;

      if (t <= 0) {
        clearInterval(intId);
        timerEl.textContent = "⏱️ Tempo esgotado!";
        startBtn.disabled = false; // reativa o botão
        if (window.speech && window.speech.enabled) {
          window.speech.speak("Tempo esgotado!");
        }
      }
    }, 1000);
  });
})();


