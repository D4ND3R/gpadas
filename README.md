# GPADAS

GPADAS es una aplicación web en TypeScript para crear portadas de Actividades de Aprendizaje, prácticas de laboratorio, productos finales y trabajos personalizados de la Preparatoria Siglo XXI, incorporada a la Universidad Autónoma de Yucatán.

La app está pensada para estudiantes que entregan varias actividades durante la semana y necesitan generar una portada consistente sin volver a escribir toda la información cada vez. Desde un formulario en español se elige el estilo de portada, orientación vertical u horizontal, fechas, tipo de trabajo, número de actividad, semestre, grupo, materia y participantes.

Las materias se cargan desde `src/data/subjects.json` por semestre y grupo. Cada materia tiene su maestro asignado, por lo que el campo de maestro se llena automáticamente al seleccionar la materia correspondiente.

GPADAS incluye cuatro diseños de portada:

- Base: una portada clásica similar al formato escolar original.
- Minimalista: una versión limpia y moderna con jerarquía visual más ligera.
- Detallado: una portada con tabla de datos y estructura formal.
- Moderno: una portada con composición editorial y etiquetas alineadas.

El generador conserva datos recurrentes mediante cookies del navegador, como estilo, orientación, fechas, semestre, grupo, materia, participantes y tipo de trabajo. También permite descargar la portada como PDF o imprimirla directamente.

Los recursos visuales de la institución se encuentran en `public/assets/`:

- `logo-strip.png`: franja superior con los logotipos escolares.
- `school-stamp.png`: sello escolar usado como marca de agua.

## Licencia

Este proyecto está protegido por copyright. Consulta `LICENSE` para conocer los términos de uso.
