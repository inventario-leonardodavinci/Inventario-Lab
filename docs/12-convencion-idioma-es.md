# Convencion de idioma (espanol)

## Objetivo
Mantener el proyecto consistente en espanol en documentacion, mensajes y comentarios para facilitar mantenimiento del equipo.

## Reglas
- Escribir en espanol: documentacion funcional y tecnica, comentarios de codigo y mensajes visibles al usuario.
- Mantener terminos tecnicos estandar cuando sea necesario (`endpoint`, `middleware`, `build`, `lint`, `seed`).
- Evitar mezclar idiomas en una misma frase.
- Usar tildes solo si el archivo ya contiene UTF-8 con tildes; en scripts y configuracion, priorizar ASCII para evitar problemas de entorno.

## Alcance
- **Si debe estar en espanol**
  - Archivos de `docs/`
  - Textos de interfaz en `FrontEnd/app/src/pages` y componentes de layout
  - Mensajes de error/respuesta en controladores y middlewares
  - Comentarios creados por el equipo
- **Puede mantenerse en ingles**
  - Nombres tecnicos de librerias y claves de configuracion
  - Rutas API ya acordadas
  - Codigo de terceros generado automaticamente

## Revision en cada PR
- [ ] Textos nuevos en espanol.
- [ ] Comentarios nuevos en espanol.
- [ ] Mensajes backend nuevos en espanol.
- [ ] Documentacion actualizada en espanol.
