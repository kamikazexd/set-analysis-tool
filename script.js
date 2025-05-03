let texts = {
  tr: {
    title: "Cebirsel Küme Analiz Aracı",
    inputLabel: "Koşul gir (örnek: x % 2 == 0 && x > 0 veya {1, 2, 3}):",
    button: "Kümeyi Hesapla ve Analiz Et",
    emptySet: "Boş küme.",
    error: "Hata",
    closed: "Kapalı mı",
    associative: "Örtüşmeli mi",
    identity: "Birim eleman var mı",
    inverses: "Ters elemanlar var mı",
    commutative: "Değişmeli mi",
    distributive: "Dağılmalı mı",
    idempotent: "İdempotan mı",
    cyclic: "Çevrimsel mi",
    group: "Grup mu",
    ring: "Halkalı yapı mı"
  },
  en: {
    title: "Algebraic Set Analysis Tool",
    inputLabel: "Enter condition (e.g., x % 2 == 0 && x > 0 or {1, 2, 3}):",
    button: "Evaluate and Analyze Set",
    emptySet: "Empty set.",
    error: "Error",
    closed: "Closed",
    associative: "Associative",
    identity: "Has identity element",
    inverses: "Has inverse elements",
    commutative: "Commutative",
    distributive: "Distributive",
    idempotent: "Idempotent",
    cyclic: "Cyclic",
    group: "Group",
    ring: "Ring structure"
  }
};

document.getElementById("darkModeToggle").addEventListener("change", function () {
  document.body.classList.toggle("dark");
});

document.getElementById("languageToggle").addEventListener("change", function () {
  const lang = this.checked ? "en" : "tr";
  setLanguage(lang);
});

function setLanguage(lang) {
  document.getElementById("title").innerText = texts[lang].title;
  document.getElementById("inputLabel").innerText = texts[lang].inputLabel;
  document.getElementById("evaluateButton").innerText = texts[lang].button;
}

function evaluateInput() {
  const input = document.getElementById("setInput").value;
  const setOutput = document.getElementById("setOutput");
  const analysisOutput = document.getElementById("analysisOutput");

  try {
    const elements = getElementsFromCondition(input, -50, 50);
    setOutput.innerText = `${texts["en"].title}: {${elements.join(", ")}}`;

    if (elements.length === 0) {
      analysisOutput.innerText = texts["en"].emptySet;
      return;
    }

    const op1 = (a, b) => a + b;
    const op2 = (a, b) => a * b;
    const structure = new SetStructure(elements, op1, op2);
    const analysis = structure.analyzeAlgebraic();

    const translations = {
      is_closed: texts["en"].closed,
      is_associative: texts["en"].associative,
      has_identity: texts["en"].identity,
      has_inverses: texts["en"].inverses,
      is_commutative: texts["en"].commutative,
      is_distributive: texts["en"].distributive,
      is_idempotent: texts["en"].idempotent,
      is_cyclic: texts["en"].cyclic,
      is_group: texts["en"].group,
      is_ring: texts["en"].ring
    };

    analysisOutput.innerText = Object.entries(analysis).map(
      ([key, val]) => `${translations[key] || key}: ${val ? "Yes" : "No"}`
    ).join("\n");

  } catch (err) {
    setOutput.innerText = `${texts["en"].error}: ${err.message}`;
    analysisOutput.innerText = "";
  }
}

function getElementsFromCondition(condition, min, max) {
  condition = condition.trim();
  if (condition.startsWith("{") && condition.endsWith("}")) {
    return condition.slice(1, -1).split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  const elements = [];
  for (let x = min; x <= max; x++) {
    try {
      if (eval(condition)) elements.push(x);
    } catch {}
  }
  return elements;
}

class SetStructure {
  constructor(elements, op1, op2) {
    this.elements = elements;
    this.op1 = op1;
    this.op2 = op2;
  }

  analyzeAlgebraic() {
    const isClosed = this.isClosed(this.op1);
    const isAssoc = this.isAssociative(this.op1);
    const [hasId, identity] = this.hasIdentity(this.op1);
    const hasInv = hasId ? this.hasInverses(this.op1, identity) : false;
    const isComm = this.isCommutative(this.op1);
    const isDistrib = this.op2 ? this.isDistributive(this.op1, this.op2) : null;
    const isIdemp = this.isIdempotent(this.op1);
    const isCyclic = this.isCyclic(this.op1);
    const isGroup = isClosed && isAssoc && hasId && hasInv;
    const isRing = isGroup && this.op2 && this.isAssociative(this.op2);

    return {
      is_closed: isClosed,
      is_associative: isAssoc,
      has_identity: hasId,
      has_inverses: hasInv,
      is_commutative: isComm,
      is_distributive: isDistrib,
      is_idempotent: isIdemp,
      is_cyclic: isCyclic,
      is_group: isGroup,
      is_ring: isRing
    };
  }

  isClosed(op) {
    return this.elements.every(a => this.elements.every(b => this.elements.includes(op(a, b))));
  }

  isAssociative(op) {
    return this.elements.every(a => this.elements.every(b => this.elements.every(c => op(op(a, b), c) === op(a, op(b, c)))));
  }

  hasIdentity(op) {
    for (let e of this.elements) {
      if (this.elements.every(x => op(e, x) === x && op(x, e) === x)) return [true, e];
    }
    return [false, null];
  }

  hasInverses(op, identity) {
    return this.elements.every(a => this.elements.some(b => op(a, b) === identity && op(b, a) === identity));
  }

  isCommutative(op) {
    return this.elements.every(a => this.elements.every(b => op(a, b) === op(b, a)));
  }

  isDistributive(op1, op2) {
    return this.elements.every(a => this.elements.every(b => this.elements.every(c =>
      op1(op2(a, b), c) === op2(op1(a, c), op1(b, c))
    )));
  }

  isIdempotent(op) {
    return this.elements.every(a => op(a, a) === a);
  }

  isCyclic(op) {
    for (let a of this.elements) {
      let generated = new Set();
      let current = a;
      for (let i = 0; i < this.elements.length * 2; i++) { 
        generated.add(current);
        current = op(current, a);
        if (!this.elements.includes(current)) break;
      }
      if (this.elements.every(e => generated.has(e))) return true;
    }
    return false;
  }
}

// Varsayılan dil
setLanguage("tr");
