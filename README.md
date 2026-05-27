# Generador de Portadas ADAS

Aplicación web en TypeScript para generar portadas de Actividades de Aprendizaje, prácticas de laboratorio y productos finales de la Preparatoria Siglo XXI.

## Uso local

```bash
npm install
npm run dev
```

## Catálogos editables

Las materias y maestros se modifican en `src/data/subjects.json`. El archivo tiene un catálogo de materias con maestro asignado y listas por semestre/grupo:

```json
{
  "subjects": {
    "diseno-multimedia": {
      "name": "Diseño multimedia",
      "teacher": "Oscar Ivan Huh Carvajal"
    }
  },
  "semesters": {
    "2": {
      "B": ["diseno-multimedia"]
    }
  }
}
```

## Scripts

```bash
npm run build
npm run preview
```
