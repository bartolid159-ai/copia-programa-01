# Solución de Errores en Pruebas CI (ERR_DLOPEN_FAILED)

El objetivo de este plan es corregir el error crítico que está impidiendo que los tests unitarios de integración pasen en GitHub Actions y localmente.

## Análisis del Error

Los registros de Vitest muestran que el archivo `tests/unit/App.test.jsx` falla con el error `ERR_DLOPEN_FAILED` proveniente de la inicialización de `better-sqlite3`.

**¿Por qué sucede esto?**
1. El componente `<App />` carga por defecto la vista de Pacientes (`<PatientList />`).
2. Al montarse, `<PatientList />` hace una llamada a `patientService.getPatients()` para obtener la lista de pacientes.
3. Durante nuestra refactorización reciente de los tests, **olvidamos crear un "mock" (simulación)** para `patientService` dentro de `tests/unit/App.test.jsx`.
4. Al no estar simulado, el test ejecuta el código real de `patientService`, el cual intenta conectar con la base de datos real importando `db/manager.js`.
5. `manager.js` intenta cargar la librería nativa `better-sqlite3` (`.node`). Dado que las pruebas UI de Vitest corren en un entorno virtualizado que simula el navegador (`jsdom`), la carga de librerías nativas de C++ falla irremediablemente, provocando que el test se rompa (esto se agrava si la arquitectura de la librería es de 32 bits y el runner de CI de 64 bits).

Las pruebas que **sí** prueban la base de datos (como `tests/supplies.test.js`) pasan porque están configuradas explícitamente para correr en un entorno `node` (`/** @vitest-environment node */`), donde la carga nativa sí es permitida.

## Propuesta de Solución

Para que el test UI pase sin intentar tocar la base de datos, debemos aislar el componente `<App />` de los servicios que hacen peticiones reales.

### Modificaciones en `tests/unit/App.test.jsx`

#### [MODIFY] `tests/unit/App.test.jsx`
1. Añadir el mock de `patientService` para evitar llamadas a la base de datos:
```javascript
vi.mock('../../src/logic/patientService', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
  getPatients: vi.fn().mockResolvedValue([])
}));
```
2. Añadir también el mock de `backupService` (ya que `<App />` asigna un evento de "beforeunload" que interactúa con este servicio):
```javascript
vi.mock('../../src/logic/backupService', () => ({
  crearBackup: vi.fn().mockResolvedValue(true),
  limpiarBackupsAntiguos: vi.fn().mockResolvedValue(true)
}));
```

## User Review Required

> [!IMPORTANT]
> Requiero tu aprobación para aplicar estos mocks en el archivo `App.test.jsx` y así resolver de forma definitiva los problemas de carga de librerías nativas durante los tests de interfaz de usuario en el CI.

## Verification Plan

1. Actualizaré el código de `tests/unit/App.test.jsx` añadiendo las simulaciones.
2. Ejecutaré `npx vitest run tests/unit/App.test.jsx` localmente para confirmar que el test pasa en verde sin intentar cargar `better-sqlite3`.
3. Informaré para proceder con el `git push` a la rama del PR.
