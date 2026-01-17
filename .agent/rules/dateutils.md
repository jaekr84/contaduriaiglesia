---
trigger: always_on
---

ESTÁNDAR DE MANEJO DE FECHAS (Argentina):

Prohibición: Queda terminantemente prohibido usar new Date().toLocaleDateString(), new Date().toLocaleTimeString() o llamadas directas a Intl.DateTimeFormat dentro de componentes o páginas.

Obligación: Para cualquier visualización de fechas o horas en la interfaz, DEBES importar y utilizar exclusivamente las funciones de @/lib/dateUtils.

Formato Local: El formato siempre debe ser DD/MM/YYYY y zona horaria America/Argentina/Buenos_Aires.

Consistencia: Si necesitas formatear una fecha en un nuevo componente, verifica primero si existe la función necesaria en lib/dateUtils.ts. Si no existe, propón su creación en ese archivo antes de implementarla.

Base de Datos: Recuerda que para enviar datos a Supabase o realizar cálculos lógicos (como cierres de mes), se debe seguir usando el objeto Date nativo o strings ISO (UTC). La utilidad es solo para la capa de presentación (UI).