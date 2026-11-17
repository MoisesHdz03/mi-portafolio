/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Motor de formularios (versión en JavaScript del motor del
   servidor): condiciones, obligatoriedad, fórmulas, datos de
   catálogo, normalización y validación con los mismos mensajes.
   ============================================================ */
(function () {
  'use strict';

  const ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México',
    'Coahuila de Zaragoza', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán de Ocampo',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
    'Tamaulipas', 'Tlaxcala', 'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas'];

  const NUMERICOS = ['Entero', 'Decimal', 'Moneda', 'Porcentaje'];
  const SIN_CAPTURA = ['Calculado', 'Informativo', 'DatoCatalogo', 'Usuario', 'NombreUsuario', 'Validador', 'Cobrador', 'Nip'];

  /* ---------- Recorrer la definición ---------- */
  function campos(def) {
    const lista = [];
    def.secciones.forEach((s) => s.filas.forEach((f) => f.forEach((c) => lista.push(Object.assign({ seccion: s }, c)))));
    return lista;
  }
  function campo(def, clave) {
    return campos(def).find((c) => c.clave === clave);
  }

  /* ---------- Validadores mexicanos ---------- */
  const CARACTERES_CURP = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const RX_CURP = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
  function fechaValida(a, m, d) { return m >= 1 && m <= 12 && d >= 1 && d <= new Date(a, m, 0).getDate(); }
  function esCurp(c) {
    if (!RX_CURP.test(c)) return false;
    const siglo = /\d/.test(c[16]) ? 1900 : 2000;
    if (!fechaValida(siglo + Number(c.substr(4, 2)), Number(c.substr(6, 2)), Number(c.substr(8, 2)))) return false;
    let suma = 0;
    for (let i = 0; i < 17; i++) suma += CARACTERES_CURP.indexOf(c[i]) * (18 - i);
    return Number(c[17]) === (10 - suma % 10) % 10;
  }

  /* ---------- Normalizar lo que escribe el agente ---------- */
  function normalizar(c, valor) {
    if (valor == null) return null;
    if (Array.isArray(valor)) return valor.length ? valor : null;
    let v = String(valor).trim();
    if (v === '') return null;
    if (c.validador === 'Curp' || c.validador === 'Rfc') v = v.toUpperCase();
    if (c.validador === 'Telefono') v = v.replace(/[\s\-().]/g, '');
    if (NUMERICOS.includes(c.tipo)) v = v.replace(/,/g, '').replace(/^\$/, '').replace(/%$/, '');
    return v;
  }

  function numero(v) {
    if (v == null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  /* ---------- Fórmulas ---------- */
  function analizarFormula(texto) {
    const tokens = [];
    let i = 0;
    while (i < texto.length) {
      const ch = texto[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '{') {
        const fin = texto.indexOf('}', i);
        if (fin < 0) throw new Error('Falta cerrar la llave en la posición ' + (i + 1) + '.');
        tokens.push({ t: 'ref', v: texto.slice(i + 1, fin).trim(), p: i });
        i = fin + 1;
      } else if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < texto.length && /[0-9.]/.test(texto[j])) j++;
        tokens.push({ t: 'num', v: Number(texto.slice(i, j)), p: i });
        i = j;
      } else if (/[A-Za-zÁÉÍÓÚÑ]/.test(ch)) {
        let j = i;
        while (j < texto.length && /[A-Za-zÁÉÍÓÚÑ_]/.test(texto[j])) j++;
        tokens.push({ t: 'fn', v: texto.slice(i, j).toUpperCase(), p: i });
        i = j;
      } else if ('+-*/(),<>=!'.includes(ch)) {
        const dos = texto.substr(i, 2);
        if (['<=', '>=', '<>', '!='].includes(dos)) { tokens.push({ t: 'op', v: dos, p: i }); i += 2; }
        else { tokens.push({ t: 'op', v: ch, p: i }); i++; }
      } else {
        throw new Error('Carácter no válido "' + ch + '" en la posición ' + (i + 1) + '.');
      }
    }
    let k = 0;
    const ver = () => tokens[k];
    const tomar = (v) => { const x = tokens[k]; if (!x || (v && x.v !== v)) throw new Error('Se esperaba "' + v + '" en la posición ' + (x ? x.p + 1 : texto.length + 1) + '.'); k++; return x; };
    function comparacion() {
      let izq = suma();
      while (ver() && ['<', '>', '<=', '>=', '=', '<>', '!='].includes(ver().v)) { const op = tomar().v; izq = { op, a: izq, b: suma() }; }
      return izq;
    }
    function suma() {
      let izq = producto();
      while (ver() && (ver().v === '+' || ver().v === '-')) { const op = tomar().v; izq = { op, a: izq, b: producto() }; }
      return izq;
    }
    function producto() {
      let izq = unario();
      while (ver() && (ver().v === '*' || ver().v === '/')) { const op = tomar().v; izq = { op, a: izq, b: unario() }; }
      return izq;
    }
    function unario() {
      if (ver() && ver().v === '-') { tomar(); return { op: 'neg', a: unario() }; }
      return primario();
    }
    function primario() {
      const x = ver();
      if (!x) throw new Error('La fórmula termina antes de tiempo.');
      if (x.t === 'num') { k++; return { num: x.v }; }
      if (x.t === 'ref') { k++; return { ref: x.v }; }
      if (x.t === 'fn') {
        k++; tomar('(');
        const args = [];
        if (!(ver() && ver().v === ')')) { args.push(comparacion()); while (ver() && ver().v === ',') { tomar(); args.push(comparacion()); } }
        tomar(')');
        if (!['SUMA', 'REDONDEAR', 'MIN', 'MAX', 'SI', 'EDAD'].includes(x.v)) throw new Error('La función ' + x.v + ' no existe. Las disponibles son SUMA, REDONDEAR, MIN, MAX, SI y EDAD.');
        return { fn: x.v, args };
      }
      if (x.v === '(') { k++; const n = comparacion(); tomar(')'); return n; }
      throw new Error('No se esperaba "' + x.v + '" en la posición ' + (x.p + 1) + '.');
    }
    const arbol = comparacion();
    if (k < tokens.length) throw new Error('No se esperaba "' + tokens[k].v + '" en la posición ' + (tokens[k].p + 1) + '.');
    return arbol;
  }

  function redondear(n, d) {
    const f = Math.pow(10, d || 0);
    return Math.sign(n) * Math.round(Math.abs(n) * f + 1e-9) / f; // comercial: 2.5 → 3
  }

  function evaluarFormula(arbol, obtener, obtenerFilas, hoy) {
    function ev(n) {
      if ('num' in n) return n.num;
      if ('ref' in n) return obtener(n.ref) || 0;
      if (n.fn) {
        const a = n.args;
        switch (n.fn) {
          case 'SUMA': return obtenerFilas(a[0].ref).reduce((s, v) => s + (v || 0), 0);
          case 'REDONDEAR': { const v = ev(a[0]); return v == null ? null : redondear(v, ev(a[1])); }
          case 'MIN': return Math.min(...a.map(ev));
          case 'MAX': return Math.max(...a.map(ev));
          case 'SI': return ev(a[0]) ? ev(a[1]) : ev(a[2]);
          case 'EDAD': {
            const fecha = obtener(a[0].ref, true);
            if (!fecha) return null;
            const [y, m, d] = fecha.split('-').map(Number);
            const [hy, hm, hd] = hoy.split('-').map(Number);
            return hy - y - ((hm < m || (hm === m && hd < d)) ? 1 : 0);
          }
        }
      }
      const a = ev(n.a);
      if (n.op === 'neg') return a == null ? null : -a;
      const b = ev(n.b);
      if (a == null || b == null) return null;
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? null : a / b;
        case '<': return a < b ? 1 : 0;
        case '>': return a > b ? 1 : 0;
        case '<=': return a <= b ? 1 : 0;
        case '>=': return a >= b ? 1 : 0;
        case '=': return a === b ? 1 : 0;
        default: return a !== b ? 1 : 0;
      }
    }
    return ev(arbol);
  }

  /* ---------- Condiciones ---------- */
  function cumple(regla, valor) {
    const vacio = valor == null || valor === '' || (Array.isArray(valor) && !valor.length);
    switch (regla.operador) {
      case 'Vacio': return vacio;
      case 'NoVacio': return !vacio;
    }
    if (vacio) return regla.operador === 'Distinto' || regla.operador === 'NoContiene';
    const lista = Array.isArray(valor) ? valor.map(String) : [String(valor)];
    const a = Number(valor), b = Number(regla.valor);
    switch (regla.operador) {
      case 'Igual': return lista.includes(String(regla.valor));
      case 'Distinto': return !lista.includes(String(regla.valor));
      case 'Contiene': return lista.some((x) => x.toLowerCase().includes(String(regla.valor).toLowerCase()));
      case 'NoContiene': return !lista.some((x) => x.toLowerCase().includes(String(regla.valor).toLowerCase()));
      case 'Mayor': return a > b;
      case 'MayorOIgual': return a >= b;
      case 'Menor': return a < b;
      case 'MenorOIgual': return a <= b;
    }
    return false;
  }

  function evaluarCondicion(cond, valorDe) {
    if (!cond || !cond.reglas || !cond.reglas.length) return true;
    const r = cond.reglas.map((g) => cumple(g, valorDe(g.campo)));
    return cond.union === 'Alguna' ? r.some(Boolean) : r.every(Boolean);
  }

  /*
   * Evalúa el formulario: qué se ve, qué es obligatorio, los calculados y los datos
   * de catálogo. "opciones": { hoy, catalogos(clave) → registros, copia (datos guardados),
   * usuario: {usuario, nombre}, incluirBackOffice }.
   */
  function evaluar(def, respuestas, opciones) {
    opciones = opciones || {};
    const hoy = opciones.hoy || C.fechas.hoy();
    const g = respuestas.generales || (respuestas.generales = {});
    const rep = respuestas.repeticiones || (respuestas.repeticiones = {});
    const todos = campos(def);
    const porClave = Object.fromEntries(todos.map((c) => [c.clave, c]));
    const estado = { secciones: {}, campos: {}, filas: {}, calculados: {}, datosCatalogo: {} };

    function registroCatalogo(clave) {
      const c = porClave[clave];
      const elegido = g[clave];
      if (!elegido) return null;
      if (opciones.conservarCopia && opciones.copia && opciones.copia[clave] && opciones.copia[clave].clave === elegido) return opciones.copia[clave];
      const registros = opciones.catalogos ? opciones.catalogos(c.catalogo) : [];
      const reg = registros.find((x) => String(x.valores.clave) === String(elegido));
      return reg ? reg.valores : (opciones.copia && opciones.copia[clave]) || null;
    }

    function valorDe(clave, comoTexto) {
      const c = porClave[clave];
      if (!c) return null;
      if (c.tipo === 'Calculado') return estado.calculados[clave] != null ? estado.calculados[clave] : null;
      if (c.tipo === 'DatoCatalogo') {
        const reg = registroCatalogo(c.campoCatalogo);
        return reg ? reg[c.columna] : null;
      }
      const v = normalizar(c, g[clave]);
      if (comoTexto) return v;
      return NUMERICOS.includes(c.tipo) ? numero(v) : v;
    }

    // Calculados (en orden: se repite hasta que no cambie nada, sin ciclos en la demo)
    const calculados = todos.filter((c) => c.tipo === 'Calculado');
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      calculados.forEach(function (c) {
        try {
          const arbol = analizarFormula(c.formula);
          const v = evaluarFormula(arbol,
            (ref, texto) => (texto ? valorDe(ref, true) : (numero(valorDe(ref)))),
            (ref) => (rep[(porClave[ref] || {}).seccion ? porClave[ref].seccion.clave : ''] || []).map((f) => numero(normalizar(porClave[ref], f[ref]))),
            hoy);
          estado.calculados[c.clave] = v == null || isNaN(v) ? null : redondear(v, 2);
        } catch (err) {
          estado.calculados[c.clave] = null;
        }
      });
    }

    def.secciones.forEach(function (s) {
      const visible = (!s.soloBackOffice || opciones.incluirBackOffice) && evaluarCondicion(s.condicion, valorDe);
      estado.secciones[s.clave] = visible;
      s.filas.forEach((f) => f.forEach(function (c) {
        const v = visible && !c.desactivado && evaluarCondicion(c.condicion, valorDe);
        const obligatorio = v && !SIN_CAPTURA.includes(c.tipo) &&
          (c.obligatorio === 'Siempre' || (c.obligatorio === 'ConCondicion' && evaluarCondicion(c.condicionObligatorio, valorDe)));
        estado.campos[c.clave] = { visible: v, obligatorio };
        if (c.tipo === 'DatoCatalogo') estado.datosCatalogo[c.clave] = valorDe(c.clave);
      }));
    });

    // Usuario y nombre de usuario: siempre los pone "el servidor"
    todos.filter((c) => c.tipo === 'Usuario' || c.tipo === 'NombreUsuario').forEach(function (c) {
      if (opciones.usuario) g[c.clave] = c.tipo === 'Usuario' ? opciones.usuario.usuario : opciones.usuario.nombre;
    });

    return estado;
  }

  /* ---------- Validación (la misma que hace el servidor al guardar) ---------- */
  function validarValor(c, valor, obligatorio) {
    if (c.tipo === 'OpcionMultiple') {
      if (!valor || !valor.length) return obligatorio ? 'Elige al menos una opción.' : null;
      return valor.every((v) => (c.opciones || []).some((o) => o.valor === v)) ? null : 'Elige opciones de la lista.';
    }
    if (c.tipo === 'Archivo') {
      return (!valor || !valor.length) && obligatorio ? 'Este campo es obligatorio.' : null;
    }
    const v = normalizar(c, valor);
    if (v == null) return obligatorio ? 'Este campo es obligatorio.' : null;
    switch (c.tipo) {
      case 'Correo': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Escribe un correo válido.';
      case 'Fecha': return /^\d{4}-\d{2}-\d{2}$/.test(v) ? null : 'Escribe una fecha válida.';
      case 'Hora': return /^\d{2}:\d{2}$/.test(v) ? null : 'Escribe una hora válida.';
      case 'Lista': case 'OpcionUnica': return (c.opciones || []).some((o) => o.valor === v) ? null : 'Elige una opción de la lista.';
      case 'SiNo': return v === 'si' || v === 'no' ? null : 'Elige sí o no.';
      case 'Estado': return ESTADOS.includes(v) ? null : 'Elige un estado de la lista.';
      case 'Catalogo': return null;
    }
    if (NUMERICOS.includes(c.tipo)) {
      const n = numero(v);
      if (n == null) return 'Escribe un número válido.';
      if (c.tipo === 'Entero' && !Number.isInteger(n)) return 'Escribe un número sin decimales.';
      if ((c.tipo === 'Moneda' || c.tipo === 'Porcentaje') && /\.\d{3,}/.test(v)) return 'Escribe como máximo 2 decimales.';
      if (c.minimo != null && n < c.minimo) return 'El valor mínimo es ' + c.minimo + '.';
      if (c.maximo != null && n > c.maximo) return 'El valor máximo es ' + c.maximo + '.';
      return null;
    }
    const maximo = c.longitudMaxima || (c.tipo === 'TextoLargo' ? 4000 : 250);
    if (v.length > maximo) return 'Escribe como máximo ' + maximo.toLocaleString('es-MX') + ' caracteres.';
    if (c.validador === 'Curp') return esCurp(v) ? null : 'La CURP no es válida.';
    if (c.validador === 'CodigoPostal') return /^\d{5}$/.test(v) ? null : 'El código postal debe tener 5 dígitos.';
    if (c.validador === 'Telefono') return /^\d{10}$/.test(v) ? null : 'El teléfono debe tener 10 dígitos.';
    return null;
  }

  /*
   * Valida lo visible. Devuelve { campos: {clave: msg}, secciones: {clave: msg}, filas: {seccion: [{clave: msg}]}, total }.
   * "soloEstos": si se indica, solo valida esas claves (corrección del supervisor o BackOffice).
   */
  function validar(def, respuestas, opciones) {
    const estado = evaluar(def, respuestas, opciones);
    const err = { campos: {}, secciones: {}, filas: {}, total: 0 };
    const g = respuestas.generales;
    const soloEstos = opciones && opciones.soloEstos;
    def.secciones.forEach(function (s) {
      if (!estado.secciones[s.clave]) return;
      if (s.repetible) {
        const filas = respuestas.repeticiones[s.clave] || [];
        if (!soloEstos) {
          if (s.minimo && filas.length < s.minimo) { err.secciones[s.clave] = s.minimo === 1 ? 'Agrega al menos 1 fila en "' + s.titulo + '".' : 'Agrega al menos ' + s.minimo + ' filas en "' + s.titulo + '".'; err.total++; }
          if (s.maximo != null && filas.length > s.maximo) { err.secciones[s.clave] = '"' + s.titulo + '" admite como máximo ' + s.maximo + ' filas.'; err.total++; }
        }
        err.filas[s.clave] = filas.map(function (f) {
          const e = {};
          s.filas.forEach((fila) => fila.forEach(function (c) {
            if (soloEstos && !soloEstos.includes(c.clave)) return;
            if (SIN_CAPTURA.includes(c.tipo)) return;
            const m = validarValor(c, f[c.clave], c.obligatorio === 'Siempre');
            if (m) { e[c.clave] = m; err.total++; }
          }));
          return e;
        });
        return;
      }
      s.filas.forEach((fila) => fila.forEach(function (c) {
        const st = estado.campos[c.clave];
        if (!st || !st.visible || SIN_CAPTURA.includes(c.tipo)) return;
        if (soloEstos && !soloEstos.includes(c.clave)) return;
        let m = validarValor(c, g[c.clave], st.obligatorio);
        if (!m && c.tipo === 'Catalogo' && g[c.clave]) {
          const regs = opciones.catalogos ? opciones.catalogos(c.catalogo) : [];
          const reg = regs.find((x) => String(x.valores.clave) === String(normalizar(c, g[c.clave])));
          if (!reg) m = 'Elige una opción de la lista.';
          else if (!reg.activo && !(opciones.copia && opciones.copia[c.clave] && opciones.copia[c.clave].clave === reg.valores.clave)) m = 'Esta opción ya no está disponible. Elige otra.';
        }
        if (m) { err.campos[c.clave] = m; err.total++; }
      }));
    });
    return { errores: err, estado };
  }

  /* Respuestas "limpias": sin lo oculto, normalizadas y con calculados (lo que guarda el servidor). */
  function limpiar(def, respuestas, estado) {
    const g = {};
    campos(def).forEach(function (c) {
      if (c.seccion.repetible) return;
      const st = estado.campos[c.clave];
      if (!st || !st.visible) return;
      if (c.tipo === 'Calculado') { if (estado.calculados[c.clave] != null) g[c.clave] = estado.calculados[c.clave]; return; }
      if (c.tipo === 'DatoCatalogo') { if (estado.datosCatalogo[c.clave] != null) g[c.clave] = estado.datosCatalogo[c.clave]; return; }
      const v = Array.isArray(respuestas.generales[c.clave]) ? respuestas.generales[c.clave] : normalizar(c, respuestas.generales[c.clave]);
      if (v != null && !(Array.isArray(v) && !v.length)) g[c.clave] = v;
    });
    const rep = {};
    def.secciones.filter((s) => s.repetible).forEach(function (s) {
      if (!estado.secciones[s.clave]) return;
      rep[s.clave] = (respuestas.repeticiones[s.clave] || []).map(function (f) {
        const limpia = {};
        s.filas.forEach((fila) => fila.forEach((c) => { const v = normalizar(c, f[c.clave]); if (v != null) limpia[c.clave] = v; }));
        return limpia;
      });
    });
    return { generales: g, repeticiones: rep };
  }

  /* Texto para mostrar un valor guardado (listas con su etiqueta, monedas, etc.). */
  function texto(c, valor) {
    if (valor == null || valor === '' || (Array.isArray(valor) && !valor.length)) return '';
    if (c.tipo === 'Lista' || c.tipo === 'OpcionUnica') { const o = (c.opciones || []).find((x) => x.valor === valor); return o ? o.etiqueta : valor; }
    if (c.tipo === 'OpcionMultiple') return valor.map((v) => { const o = (c.opciones || []).find((x) => x.valor === v); return o ? o.etiqueta : v; }).join(', ');
    if (c.tipo === 'SiNo') return valor === 'si' ? 'Sí' : 'No';
    if (c.tipo === 'Moneda' || c.formato === 'Moneda' || c.tipoColumna === 'Moneda') return C.moneda(valor);
    if (c.tipo === 'Porcentaje') return valor + '%';
    if (c.tipo === 'Fecha') { const [y, m, d] = String(valor).split('-'); return d + '/' + m + '/' + y; }
    if (c.tipo === 'Archivo') return valor.map((a) => a.nombre).join(', ');
    return String(valor);
  }

  window.Motor = { campos, campo, evaluar, validar, limpiar, normalizar, texto, analizarFormula, evaluarCondicion, ESTADOS, NUMERICOS, SIN_CAPTURA };
})();
