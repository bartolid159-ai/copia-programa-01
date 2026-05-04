# Plan de Tarea: Refactorización Historial de Facturación (Tarea 13)

## 1. Análisis de Impacto
- **Archivos Existentes:** 
    - `src/components/Billing/InvoiceHistory.jsx`: Modificación mayor de la UI del modal de detalles.
    - `src/db/manager.js`: Verificar si `getFacturaById` devuelve el nombre del médico (join).
- **Nuevos Archivos:**
    - `public/images/logo_principal.png`: Incorporación del logo.

## 2. Cambios Técnicos
- Sustituir el modal de recibo actual por uno basado en el diseño estético de `LiquidacionPanel.jsx`.
- Integrar el logo centralizado en el encabezado del recibo.
- Asegurar que la impresión (`window.print()`) mantenga el estilo premium y el logo.
- Mapear correctamente los campos de paciente, médico, fecha y desglose financiero.

## 3. Lógica de Negocio
- Si una factura no tiene médico asignado (caso raro pero posible en registros antiguos), mostrar "Sin médico asignado" para evitar errores de renderizado.
- El cálculo de totales debe ser consistente con la lógica de `billingEngine.js`.

## 4. Definición de Tests
- Verificar que el modal abra correctamente al hacer clic en el botón de ver detalles.
- Validar que los montos mostrados coincidan con los datos de la base de datos.
- Confirmar que el logo se visualiza correctamente en el modal.

---
*Aprobado por el usuario: 2026-05-03*
