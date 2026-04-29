# Plan de Simulacro Contable (QA End-to-End)

**Objetivo:** Validar que el módulo de "Contabilidad" (Dashboard/Panel de Inteligencia de Negocio) refleja con total precisión las métricas en tiempo real luego de realizar las operaciones típicas que un usuario haría en su clínica a diario (registro de datos, ventas, compras y consumo de stock).

## 1. Análisis de Impacto y Estrategia
Este plan tiene un impacto nulo en el código funcional de base (a menos que se hallen bugs). Consiste en un test de flujo E2E (End-to-End) usando el entorno local activo. Modificaremos la base de datos `sqlite` insertando información de un "simulacro", para luego interrogar visual y lógicamente el Dashboard de Contabilidad.

## 2. Definición del Flujo "Día a Día"

### Fase A: Preparación del Terreno (Maestros y Entidades)
Se emulará a la secretaria/administrador creando el sustrato necesario:
1. **Médico:** Creación del "Dr. Simulacro QA" con un % de comisión.
2. **Paciente:** Creación de "Carlos Prueba".
3. **Insumos:** Creación de un insumo "Gasas QA" con alerta de Stock Mínimo = `10` y comprar una cantidad baja inicial (ej. `12` unidades) para provocar un egreso contable.
4. **Servicio:** Creación del servicio "Consulta General QA" ligado al "Dr. Simulacro QA" e insumo "Gasas QA".

### Fase B: Operaciones y Flujo de Dinero
El sistema debe procesar "actividad comercial":
1. **Facturación 1:** Venta del servicio en USD en efectivo.
2. **Facturación 2:** Venta del mismo servicio, pero pagado en Bolívares (VES), para comprobar los cálculos multimoneda y la tasa de cambio vigente.

Al realizar estas facturas, se generarán Ingresos de dinero, se deducirá stock desencadenando alertas y se calcularán deudas al médico (Egresos en comisiones).

### Fase C: Verificación Exhaustiva en `Contabilidad`
Navegaremos al módulo y validaremos:
1. **KPI Panel:** Que los `Ingresos USD` y `Ingresos VES` correspondan a los montos exactos facturados. Que los `Egresos` correspondan al gasto en compras y a la provisión de las comisiones médicas. Comprobar que el cálculo de `Ganancia Neta` es el correcto (Ingresos - Egresos).
2. **Stock Alert Widget:** Verificar que, luego de la venta, el insumo "Gasas QA" haya bajado por debajo de 10 unidades, y por ende, *aparezca* en el tablero de Alertas Rojas mostrando su stock crítico.
3. **Top Services (Pareto):** Constatar que "Consulta General QA" figura en la lista de rentabilidad y sus cifras muestran `Ingreso Bruto - Costos` reales.
4. **Gráfico de Ingresos (Revenue Chart):** Asegurar que las barras/líneas del día actual proyectan la facturación correctamente a lo largo del tiempo.
5. **Historial de Tasas:** Confirmar que aparece el listado de las conversiones manejadas internamente.

### Fase D: Pruebas Lógicas
Opcionalmente, validaremos internamente ejecutando los servicios a nivel de lógica (`reportService.js`) si la interfaz no brinda la asertividad matemática suficiente, comparando ambos mundos (Frontend vs Backend).

## 3. Condiciones de Detención
- Detenernos si ocurre un reinicio inesperado de la aplicación (crash).
- Frenar el test si el Balance o Semáforo presenta montos irreales como `NaN` o valores negativos incorrectos.
- Registrar un sub-ticket de corrección de bug por cada fallo detectado y solventarlo de forma atómica antes de seguir con la prueba.

---
**Nota para el Usuario:** Quedo a la espera de que usted apruebe este plan diciendo **"Plan aprobado, procede con la implementación"**, conforme a nuestras reglas operativas (Fase A), para así ejecutar la simulación de forma automatizada mediante mi gente interno del navegador.
