# Plan Tarea: Indicador de Ingresos Totales en Módulo de Consultorios

## 1. Análisis de impacto en archivos existentes
El usuario desea visualizar el total de ingresos acumulados por alquiler de consultorios directamente en la pantalla de historial.

Archivos afectados:
- `src/components/Rentals/RentalList.jsx`: Modificar para calcular la suma de `precio_usd` de los registros cargados y mostrarlo en un componente visual premium antes de la tabla.

## 2. Nuevos archivos a crear
No se requieren archivos nuevos.

## 3. Lógica de negocio a implementar
- En `RentalList.jsx`, calcular una constante `totalIngresos` utilizando `rentals.reduce`.
- Formatear el resultado a dos decimales y moneda USD.
- Asegurar que el total se actualice automáticamente al cargar o eliminar registros.

## 4. Definición de los tests de Vitest necesarios
Se puede actualizar un test existente o crear uno sencillo para verificar que el componente renderiza el total correcto basado en un set de datos de prueba.
Sin embargo, dado que es un cambio puramente de UI en un componente React ya existente, validaremos visualmente y mediante la lógica del reduce.

## 5. Diseño Visual (Estética Premium)
Se utilizará un contenedor con efecto glassmorphism, bordes redondeados y un acento de color (cian/neón) para que resalte como un KPI importante, siguiendo la línea estética del proyecto.
