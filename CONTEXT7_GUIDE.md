# Context7 & MCP Configuration Guide

## ¿Qué es Context7?

**Context7** es un servidor MCP que proporciona acceso a documentación oficial y actualizada de librerías, frameworks, APIs y SDKs. Elimina la necesidad de confiar en datos de entrenamiento potencialmente desactualizados.

## 📋 Configuración Completada

### 1. MCP Server (`.mcp.json`)

El servidor Context7 está configurado para ejecutarse vía MCP. Claude Code puede consultar documentación en tiempo real:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["context7", "--mcp"],
      "env": {
        "CONTEXT7_CACHE_DIR": ".context7"
      }
    }
  }
}
```

### 2. CLI Global

Context7 CLI está instalado globalmente:

```bash
context7 --version  # Check version
context7 docs next.js  # Search Next.js docs
context7 search "React hooks" --lib react  # Search React docs
```

### 3. Configuración de Proyecto (`.context7rc.json`)

Archivo de configuración con:
- **Librerías preconfiguradas:** Next.js, React, TypeScript, Tailwind, Supabase, OpenRouter, HighLevel, YCloud
- **Cache local:** `.context7/` (ignorado en .gitignore)
- **Autoload:** Las 5 librerías principales se cargan automáticamente

## 🚀 Cómo Usarlo

### Con Claude Code (MCP automático)

Claude Code usa Context7 automáticamente cuando pregunta sobre:

```
"¿Cómo configuro Supabase Auth en Next.js?"
→ Context7 busca docs de Supabase + Next.js
→ Claude responde con info actualizada

"¿Cuál es la syntax de Tailwind v4 para gradientes?"
→ Context7 busca docs de Tailwind 4
→ Claude da la respuesta correcta
```

**No necesitas hacer nada** — Context7 se ejecuta automáticamente en background.

### Desde CLI (manual)

```bash
# Buscar docs específicas
context7 docs tailwindcss --query "responsive design"
context7 docs supabase --query "auth configuration"
context7 docs openrouter --query "model selection"

# Listar librerías configuradas
context7 list

# Limpiar cache
context7 cache clear

# Ver info de version específica
context7 info react@19
```

## 📚 Librerías Configuradas

| Librería | Versión | Documentación |
|----------|---------|---------------|
| Next.js | 16.2.9 / latest | https://nextjs.org/docs |
| React | 19.2.4 / latest | https://react.dev |
| TypeScript | 5.x / latest | https://www.typescriptlang.org/docs |
| Tailwind CSS | 4.x / latest | https://tailwindcss.com/docs |
| Supabase | latest | https://supabase.com/docs |
| OpenRouter | latest | https://openrouter.ai/docs |
| HighLevel | latest | https://developers.gohighlevel.com/docs |
| YCloud | latest | https://docs.ycloud.com |

## 🔄 Cómo Funciona con Claude Code

1. **Request:** Preguntas sobre una librería
   ```
   "¿Cómo creo un middleware en Next.js 16?"
   ```

2. **Context7 MCP:** Se activa automáticamente
   - Busca en docs de Next.js v16
   - Trae ejemplos y explicación oficial

3. **Claude:** Responde con info actualizada
   - Incluye cambios recientes
   - Cita la documentación oficial
   - Evita información deprecated

## 🛠️ Configuración de Caché

- **Ubicación:** `.context7/` (en el root del proyecto)
- **TTL (Time to Live):** 24 horas por defecto
- **Limpiar caché:** `context7 cache clear`
- **Ignorado en git:** Ya está en `.gitignore`

## 🎯 Casos de Uso Principales

### Desarrollo

```
"Necesito crear una API route en Next.js que consulte Supabase"
→ Context7 trae docs de ambas librerías
→ Claude Code proporciona código actualizado
```

### Debugging

```
"¿Por qué falla esta query de Supabase?"
→ Context7 verifica sintaxis correcta en docs
→ Identifica issues vs implementación
```

### Refactoring

```
"¿Cómo migramos de OpenRouter a otro proveedor LLM?"
→ Context7 busca APIs de ambos
→ Claude proporciona mapeo correcto
```

### Compliance

```
"¿Cómo asegurar que los templates WhatsApp cumplen con Meta?"
→ Context7 busca docs de YCloud + Meta API
→ Proporciona validaciones correctas
```

## ⚙️ Troubleshooting

### Error: "Context7 command not found"

```bash
# Reinstalar global
npm install -g context7

# Verificar instalación
context7 --version
```

### Cache corrompido

```bash
# Limpiar caché local
rm -rf .context7/

# Reiniciar dev server
npm run dev
```

### MCP no se conecta

1. Verifica que `.mcp.json` está bien formado (valid JSON)
2. Revisa que Context7 CLI está instalado: `context7 --version`
3. Reinicia Claude Code
4. Chequea logs: `npm run dev` (output puede mostrar MCP errors)

## 📖 Referencia Rápida

| Tarea | Comando |
|-------|---------|
| Ver versión | `context7 --version` |
| Listar librerías | `context7 list` |
| Buscar en docs | `context7 search "query" --lib nextjs` |
| Obtener doc | `context7 docs tailwindcss --query "gradient"` |
| Limpiar caché | `context7 cache clear` |
| Ver config | `context7 config` |

## 🔗 Integración con CLAUDE.md

El archivo CLAUDE.md usa Context7 automáticamente cuando menciona:

- APIs de Next.js → busca docs oficiales
- Configuración de Supabase → trae info actualizada
- Tailwind utilities → consulta v4 docs
- Tipos de TypeScript → verifica sintaxis actual

**No es necesario actualizar CLAUDE.md manualmente** — Context7 siempre proporciona info fresca.

## 📝 Próximos Pasos

1. Ejecuta `npm run dev` para iniciar el MCP
2. Haz preguntas a Claude Code sobre las librerías configuradas
3. Context7 funcionará automáticamente en background
4. Si necesitas info específica, usa CLI: `context7 docs nextjs --query "your-question"`

---

**Context7 está activo y listo para usar.** ✨
