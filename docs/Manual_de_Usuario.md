# Manual de Usuario - Sistema de Gestión Médica

## Tabla de Contenidos
1. [Instalación del Programa](#instalación-del-programa)
2. [Inicio de Sesión](#inicio-de-sesión)
3. [Módulo de Pacientes](#módulo-de-pacientes)
4. [Módulo de Médicos](#módulo-de-médicos)
5. [Módulo de Servicios](#módulo-de-servicios)
6. [Módulo de Inventario](#módulo-de-inventario)
7. [Módulo de Facturación](#módulo-de-facturación)
8. [Dashboard y Reportes](#dashboard-y-reportes)
9. [Cierre de Caja](#cierre-de-caja)

---

## Instalación del Programa

### Requisitos del Sistema
- Windows 10 o superior
- 4 GB de RAM mínimo
- 500 MB de espacio disponible en disco

### Pasos de Instalación
1. Ejecute el archivo `Setup.exe`
2. Siguiente > Siguiente > Siguiente
3. El programa se instalará automáticamente y creará un acceso directo en el escritorio
4. Al finalizar, el programa se iniciará automáticamente

---

## Inicio de Sesión

1. Al iniciar el programa, aparecerá la pantalla de login
2. Ingrese su usuario y contraseña
3. Haga clic en "Iniciar Sesión"
4. El sistema lo redirigirá al Dashboard principal

**Nota:** Si es la primera vez que usa el sistema, contacte al administrador para obtener sus credenciales de acceso.

---

## Módulo de Pacientes

### Crear Nuevo Paciente
1. En el menú principal, haga clic en "Pacientes"
2. Haga clic en el botón "+ Nuevo Paciente"
3. Complete los siguientes campos:
   - Cédula/RIF (obligatorio)
   - Nombre completo (obligatorio)
   - Sexo
   - Fecha de nacimiento
   - Teléfono
   - Correo electrónico
   - Dirección
4. Haga clic en "Guardar"

### Buscar Pacientes
- Utilice el campo de búsqueda en la parte superior
- Puede buscar por nombre o cédula
- Los resultados se muestran en tiempo real

### Modificar Paciente
1. Haga clic en el paciente deseado en la lista
2. Modifique la información necesaria
3. Haga clic en "Actualizar"

---

## Módulo de Médicos

### Registrar Médico
1. En el menú principal, haga clic en "Médicos"
2. Haga clic en "+ Registrar Médico"
3. Complete los datos:
   - Nombre completo
   - Cédula profesional
   - Teléfono
   - Correo
   - Especialidad
   - Porcentaje de comisión
4. Haga clic en "Guardar"

### Configuración de Comisiones
- El porcentaje de comisión se usa para calcular automáticamente el pago a cada médico
- Puede modificar el porcentaje en cualquier momento
- Los cambios afectan futuras facturaciones

---

## Módulo de Servicios

### Crear Servicio
1. En el menú principal, haga clic en "Servicios"
2. Haga clic en "+ Nuevo Servicio"
3. Complete la información:
   - Nombre del servicio
   - Precio en USD
   - Si está exento de IVA
   - Médico asignado por defecto
   - Insumos requeridos (opcional)
4. Haga clic en "Guardar"

### Asociar Insumos
- Al crear un servicio, puede asociar materiales del inventario
- Al facturar el servicio, estos insumos se descontarán automáticamente del stock
- Use esta función para servicios que requieren materiales específicos

---

## Módulo de Inventario

### Registrar Insumo
1. En el menú principal, haga clic en "Inventario"
2. Haga clic en "+ Nuevo Insumo"
3. Complete los datos:
   - Código (SKU)
   - Nombre
   - Descripción
   - Categoría
   - Stock actual
   - Stock mínimo
   - Unidad de medida
   - Costo unitario en USD
4. Haga clic en "Guardar"

### Gestión de Stock
- El sistema alerta automáticamente cuando el stock llega al mínimo
- Puede ver insumos con stock bajo en el Dashboard
- Al registrar compras, el stock se actualiza automáticamente

### Categorías de Insumos
- Material Médico
- Medicamentos
- Limpieza
- Oficina
- Otras categorías personalizadas

---

## Módulo de Facturación

### Crear Factura
1. En el menú principal, haga clic en "Facturación"
2. Haga clic en "Nueva Factura"
3. Seleccione:
   - Paciente
   - Médico
   - Tasa de cambio actual
4. Agregue servicios:
   - Seleccione los servicios prestados
   - Especifique cantidades
   - El sistema calcula montos automáticamente
5. Seleccione método de pago
6. Haga clic en "Procesar Factura"

### Características de Facturación
- Cálculo automático de comisiones médicas
- Descuento automático de insumos del inventario
- Generación de asientos contables en USD y VES
- Soporte para múltiples métodos de pago

### Métodos de Pago
- Efectivo USD
- Transferencia USD
- Punto de venta
- Otros (personalizable)

---

## Dashboard y Reportes

### Vista Principal del Dashboard
- Resumen del día (caja teórica vs. declarada)
- Insumos con stock bajo
- Facturas del día
- Comisiones pendientes de pago

### Reportes Disponibles
1. **Reporte de Caja por Fecha**
   - Ingresos totales
   - Métodos de pago
   - Diferencias de caja

2. **Reporte de Comisiones Médicas**
   - Comisiones generadas
   - Pagos realizados
   - Saldo pendiente por médico

3. **Reporte de Inventario**
   - Estado actual del stock
   - Movimientos del mes
   - Valor total del inventario

---

## Cierre de Caja

### Proceso de Cierre
1. En el Dashboard, haga clic en "Cierre de Caja"
2. Ingrese el monto declarado en caja
3. El sistema mostrará:
   - Monto teórico (basado en facturas del día)
   - Diferencia real
4. Haga clic en "Registrar Cierre"

### Importancia del Cierre
- Registra la diferencia entre lo teórico y lo real
- Genera un registro contable formal
- Es obligatorio para la auditoría diaria

---

## Soporte Técnico

Para problemas con el sistema:
1. Revise este manual
2. Contacte al administrador del sistema
3. No modifique archivos del programa manualmente

**Nota:** Este programa funciona 100% sin internet. Todos los datos se guardan localmente en su computadora.