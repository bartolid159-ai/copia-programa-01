# Guía de Instalación - Sistema de Gestión Médica

## Requisitos del Sistema

### Hardware Mínimo
- Procesador: Intel Core i3 o equivalente
- Memoria RAM: 4 GB
- Espacio en disco: 500 MB disponibles
- Sistema Operativo: Windows 10 o superior

### Software Requerido
- El programa incluye todos los componentes necesarios
- No requiere instalación de Node.js, Python, u otros frameworks
- No requiere conexión a internet para su funcionamiento

## Pasos de Instalación

### Paso 1: Descarga y Ejecución
1. Localice el archivo `Setup.exe` en la carpeta de descargas
2. Haga doble clic en el archivo para iniciar el instalador
3. Si aparece un mensaje de control de usuario, haga clic en "Sí"

### Paso 2: Bienvenida
- Aparecerá la pantalla de bienvenida del instalador
- Haga clic en "Siguiente" para continuar

### Paso 3: Acuerdo de Licencia
- Lea el acuerdo de licencia
- Marque "Acepto los términos del acuerdo"
- Haga clic en "Siguiente"

### Paso 4: Directorio de Instalación
- El directorio de instalación se autoselecciona automáticamente
- **No modifique esta ubicación** - el programa requiere una ruta específica para funcionar correctamente
- Haga clic en "Siguiente"

### Paso 5: Creación de Accesos Directos
- Se crearán automáticamente:
  - Acceso directo en el escritorio
  - Acceso directo en el menú de Inicio
- Haga clic en "Siguiente"

### Paso 6: Instalación
- El instalador copiará los archivos del programa
- Este proceso puede tomar de 1 a 3 minutos
- No cierre la ventana durante la instalación

### Paso 7: Finalización
- Aparecerá un mensaje indicando que la instalación fue exitosa
- **Marque la casilla "Iniciar el programa al finalizar"**
- Haga clic en "Finalizar"

## Primer Inicio del Programa

### Pantalla de Inicio
- El programa se iniciará automáticamente
- Aparecerá la pantalla de bienvenida durante 5-10 segundos
- Luego mostrará la pantalla de inicio de sesión

### Configuración Inicial
1. **Login Administrador**
   - Usuario: `admin`
   - Contraseña: `admin`
   - **Importante:** Cambie la contraseña inmediatamente después del primer inicio

2. **Cambiar Contraseña**
   - Haga clic en "Mi Perfil" en el menú superior
   - Ingrese la contraseña actual: `admin`
   - Cree una nueva contraseña segura
   - Confirme la nueva contraseña
   - Haga clic en "Guardar"

## Verificación de la Instalación

### Prueba de Funcionamiento
1. Inicie sesión con sus credenciales
2. Verifique que aparece el Dashboard principal
3. Haga clic en cada módulo para asegurarse de que cargan correctamente:
   - Pacientes
   - Médicos
   - Servicios
   - Inventario
   - Facturación
   - Dashboard

### Base de Datos
- El programa crea automáticamente la base de datos SQLite en:
  `C:\Users\[Usuario]\AppData\Roaming\Sistema de Gestión Médica\data.sqlite`
- **No modifique ni elimine este archivo**

## Solución de Problemas Comunes

### El programa no inicia
1. Verifique que tiene permisos de administrador
2. Asegúrese de que no hay otra instancia del programa ejecutándose
3. Reinicie su computadora e intente nuevamente

### Pantalla negra o en blanco
1. Espere 30 segundos para que el programa cargue completamente
2. Si persiste, cierre el programa e inícielo nuevamente
3. Verifique que su pantalla no esté en modo de ahorro de energía

### Error de base de datos
1. El programa detectará y reparará automáticamente errores menores
2. Si aparece un error grave, contacte soporte técnico
3. **No elimine la carpeta de datos**

## Desinstalación

### Para Desinstalar el Programa
1. Vaya al Panel de Control > Programas y características
2. Busque "Sistema de Gestión Médica"
3. Haga clic en "Desinstalar"
4. Siga las instrucciones del desinstalador

### Nota sobre Datos
- La desinstalación **NO** elimina sus datos
- Los datos se mantienen en `AppData\Roaming\Sistema de Gestión Médica`
- Si desea eliminar los datos, debe eliminar manualmente esa carpeta

## Soporte Técnico

### Contacto
- Para problemas de instalación, contacte al administrador del sistema
- No modifique archivos del programa manualmente
- No instale versiones actualizadas sin consultar primero

### Horarios de Soporte
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 9:00 AM - 1:00 PM
- Domingos: Cerrado

---

**Importante:** Este programa funciona 100% sin conexión a internet. Todos sus datos están almacenados localmente en su computadora.