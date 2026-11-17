/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Reglas compartidas: periodos de metas (Periodos.cs), avance,
   bandejas (ReglasBandejas.cs) y qué ve cada rol.
   ============================================================ */
(function () {
  'use strict';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const iso = (a, m, d) => a + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const diasMes = (a, m) => new Date(a, m, 0).getDate();

  /* ---------- Periodos ---------- */
  function periodoDe(anio, mes, corte) {
    if (corte === 1) return { anio, mes, inicio: iso(anio, mes, 1), fin: iso(anio, mes, diasMes(anio, mes)) };
    const ma = mes === 1 ? 12 : mes - 1, aa = mes === 1 ? anio - 1 : anio;
    return { anio, mes, inicio: iso(aa, ma, corte), fin: iso(anio, mes, corte - 1) };
  }
  function periodoQueContiene(dia, corte) {
    let [a, m, d] = dia.split('-').map(Number);
    if (corte > 1 && d >= corte) { m++; if (m > 12) { m = 1; a++; } }
    return periodoDe(a, m, corte);
  }
  function periodoAnterior(p, corte) { return p.mes === 1 ? periodoDe(p.anio - 1, 12, corte) : periodoDe(p.anio, p.mes - 1, corte); }
  function periodoSiguiente(p, corte) { return p.mes === 12 ? periodoDe(p.anio + 1, 1, corte) : periodoDe(p.anio, p.mes + 1, corte); }
  const nombrePeriodo = (p) => MESES[p.mes - 1].charAt(0).toUpperCase() + MESES[p.mes - 1].slice(1) + ' ' + p.anio;
  const textoDia = (d) => { const [, m, dd] = d.split('-').map(Number); return dd + ' de ' + MESES[m - 1]; };
  const rangoPeriodo = (p) => 'del ' + textoDia(p.inicio) + ' al ' + textoDia(p.fin);
  function diasRestantes(p, hoy) {
    if (hoy > p.fin) return 0;
    return C.fechas.diasEntre(hoy < p.inicio ? p.inicio : hoy, p.fin) + 1;
  }
  function faltanPorDia(meta, enviadas, dias) {
    const faltan = meta - enviadas;
    if (faltan <= 0 || dias <= 0) return 0;
    return Math.ceil(faltan / dias);
  }
  const clavePeriodo = (p) => p.anio + '-' + String(p.mes).padStart(2, '0');

  /* ---------- Metas (con valores de ejemplo para el periodo actual y el anterior) ---------- */
  function sembrarMetas() {
    const d = D.datos;
    if (d.metas.sembradas) return;
    d.campanas.filter((c) => c.activa).forEach(function (c) {
      const actual = periodoQueContiene(C.fechas.hoy(), c.corte);
      [periodoAnterior(actual, c.corte), actual].forEach(function (p) {
        const k = clavePeriodo(p);
        const agentes = d.usuarios.filter((u) => u.campanaId === c.id && (u.rol === 'Agente' || u.rol === 'Afiliado') && u.activo);
        const sups = d.usuarios.filter((u) => u.campanaId === c.id && u.rol === 'Supervisor');
        let totalCampana = 0;
        sups.forEach(function (s) {
          const suyos = agentes.filter((a) => a.supervisorId === s.id);
          let suma = 0;
          suyos.forEach((a) => { const m = c.id === 1 ? (a.rol === 'Afiliado' ? 30 : 42) : 38; d.metas.agente[a.id + '|' + k] = m; suma += m; });
          d.metas.supervisor[s.id + '|' + k] = suma + (s.id === 4 ? 10 : 0);
          totalCampana += suma + (s.id === 4 ? 10 : 0);
        });
        d.metas.campana[c.id + '|' + k] = totalCampana + 10;
      });
    });
    d.metas.sembradas = true;
    D.guardar();
  }

  const metaCampana = (campanaId, p) => D.datos.metas.campana[campanaId + '|' + clavePeriodo(p)];
  const metaSupervisor = (id, p) => D.datos.metas.supervisor[id + '|' + clavePeriodo(p)];
  const metaAgente = (id, p) => D.datos.metas.agente[id + '|' + clavePeriodo(p)];

  /* ---------- Capturas ---------- */
  const enviadas = () => D.datos.capturas.filter((c) => c.estado === 'Enviada');
  const diaDe = (c) => C.fechas.dia(c.enviada);
  const enPeriodo = (lista, p) => lista.filter((c) => { const d = diaDe(c); return d >= p.inicio && d <= p.fin; });
  const deHoy = (lista) => { const h = C.fechas.hoy(); return lista.filter((c) => diaDe(c) === h); };

  /* ---------- Bandejas ---------- */
  const BANDEJAS = [
    { clave: 'validacion', nombre: 'Validación', etapa: 'Validacion' },
    { clave: 'rechazadas-validacion', nombre: 'Rechazadas por validación', etapa: 'Validacion' },
    { clave: 'backoffice', nombre: 'BackOffice', etapa: 'BackOffice' },
    { clave: 'rechazadas-backoffice', nombre: 'Rechazadas por BackOffice', etapa: 'BackOffice' },
  ];
  function bandejaDe(c) {
    if (c.estatusBackOffice === 'rechazada') return 'rechazadas-backoffice';
    if (!c.estatusValidacion) return 'validacion';
    if (c.estatusValidacion === 'rechazada') return 'rechazadas-validacion';
    if (c.estatusValidacion === 'aprobada' && c.validadorId && !c.estatusBackOffice) return 'backoffice';
    return null;
  }

  /* Estado de una venta para quien no ve la sección de BackOffice (EstadoVenta.razor). */
  function estadoVenta(c) {
    if (!D.campana(c.campanaId).usaBackOffice) return null;
    if (c.estatusBackOffice === 'cobrada') return { clase: 'etiqueta-exito', texto: 'Cobrada' };
    if (c.estatusBackOffice === 'rechazada') return { clase: 'etiqueta-error', texto: 'Rechazada en cobro' };
    if (c.estatusValidacion === 'aprobada') return { clase: 'etiqueta-aviso', texto: 'Por cobrar' };
    if (c.estatusValidacion === 'rechazada') return { clase: 'etiqueta-error', texto: 'Rechazada en validación' };
    return { clase: 'etiqueta-neutra', texto: 'Por validar' };
  }

  /* ---------- Meta personal (Periodos.RangoPersonal y ReglasMetas) ---------- */
  const FRECUENCIAS = { Diaria: 'por día', Semanal: 'por semana', Quincenal: 'por quincena', Mensual: 'por mes' };
  function rangoPersonal(frecuencia, hoy, corte) {
    const [a, m, d] = hoy.split('-').map(Number);
    if (frecuencia === 'Diaria') return { inicio: hoy, fin: hoy };
    if (frecuencia === 'Semanal') {
      const dow = new Date(hoy + 'T12:00:00Z').getUTCDay();
      const lunes = C.fechas.sumarDias(hoy, -((dow + 6) % 7));
      return { inicio: lunes, fin: C.fechas.sumarDias(lunes, 6) };
    }
    if (frecuencia === 'Quincenal') return d <= 15 ? { inicio: iso(a, m, 1), fin: iso(a, m, 15) } : { inicio: iso(a, m, 16), fin: iso(a, m, diasMes(a, m)) };
    const p = periodoQueContiene(hoy, corte);
    return { inicio: p.inicio, fin: p.fin };
  }
  const describirMeta = (frecuencia, meta) => C.numero(meta) + ' ' + FRECUENCIAS[frecuencia];

  /* ---------- Quién ve qué ---------- */
  function catalogosDe(campanaId) {
    return function (clave) { const cat = D.catalogo(campanaId, clave); return cat ? cat.registros : []; };
  }

  function rolCss(rol) {
    return { Afiliado: 'agente', BackOffice: 'supervisor', 'Supervisor BackOffice': 'supervisor', Gerente: 'administrador' }[rol] || rol.toLowerCase();
  }

  window.R = {
    periodoDe, periodoQueContiene, periodoAnterior, periodoSiguiente, nombrePeriodo, rangoPeriodo, textoDia, diasRestantes, faltanPorDia, clavePeriodo,
    sembrarMetas, metaCampana, metaSupervisor, metaAgente,
    enviadas, diaDe, enPeriodo, deHoy, BANDEJAS, bandejaDe, estadoVenta, catalogosDe, rolCss, MESES,
    FRECUENCIAS, rangoPersonal, describirMeta,
  };
})();
