# OpenRouter Configuration

## API Key Configurada ✅

Tu API key de OpenRouter está configurada en `.env.local`:
```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3-8b-instruct:free
OPENROUTER_FALLBACK_MODEL=mistralai/mistral-7b-instruct:free
```

## Modelos Free Disponibles

OpenRouter ofrece modelos **completamente gratuitos** sin límite de tokens:

### Recomendados para este proyecto

| Modelo | Características | Caso de Uso |
|--------|-----------------|------------|
| **meta-llama/llama-3-8b-instruct:free** | 8B, rápido, muy capaz | Default (recomendado) |
| **mistralai/mistral-7b-instruct:free** | 7B, rápido, buena calidad | Fallback / alternativa |
| **gpt-3.5-turbo** (limited free) | Bien balanceado | Testing (limitado) |

### Otros modelos free

```
- teknium/openhermes-2.5-mistral-7b:free
- meta-llama/llama-2-70b-chat:free
- meta-llama/llama-3-70b-instruct:free
- openchat/openchat-7b:free
- nousresearch/nous-hermes-2-mistral-7b-dpo:free
```

## Cómo Usarlo en el Código

### En API routes
```typescript
// src/app/api/agent/route.ts
import axios from 'axios';

const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
  model: process.env.OPENROUTER_DEFAULT_MODEL,
  messages: [
    {
      role: 'user',
      content: 'Tu pregunta aquí'
    }
  ]
}, {
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'WhatsApp AI Inbox'
  }
});
```

### Con fallback
```typescript
async function callLLM(prompt: string) {
  const models = [
    process.env.OPENROUTER_DEFAULT_MODEL,
    process.env.OPENROUTER_FALLBACK_MODEL
  ];
  
  for (const model of models) {
    try {
      return await callOpenRouter(model, prompt);
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`);
    }
  }
  throw new Error('All models failed');
}
```

## Límites & Consideraciones

### Free Tier (Actual)
- ✅ Sin límite de tokens
- ✅ Todos los modelos free listados arriba
- ⚠️ Tiempo de respuesta puede ser más lento que pagado
- ⚠️ Si hay sobrecarga, puede haber rate limiting

### Rate Limiting
- Máximo recomendado: 10 req/segundo
- Si necesitas más: considera pagar ($5-50/mes típicamente)

### Para Producción
1. Monitorear uso de tokens
2. Implementar queueing si necesario
3. Tener modelo fallback (ya configurado)
4. Considerar upgrade a pagado si crece uso

## Verificar Disponibilidad

```bash
# Listar modelos disponibles
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.data[] | select(.id | contains(":free"))'
```

## Cambiar Modelo por Defecto

En `.env.local`:
```bash
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-7b-instruct:free
```

Opciones en `.context7rc.json` para casos específicos:
```json
{
  "models": {
    "classification": "mistralai/mistral-7b-instruct:free",
    "response": "meta-llama/llama-3-8b-instruct:free",
    "summary": "meta-llama/llama-3-8b-instruct:free"
  }
}
```

## Troubleshooting

### Error: "Invalid API key"
```bash
# Verifica la key en .env.local
echo $OPENROUTER_API_KEY
# Debe empezar con sk-or-v1-
```

### Error: "Model not found"
- Revisa que el modelo está en la lista de free
- Ve a https://openrouter.ai/models para ver disponibles

### Rate limit exceeded
- Espera 1-5 minutos
- Implementa retry con backoff exponencial
- Considera upgrade a plan pagado

## Links Útiles

- **OpenRouter Dashboard:** https://openrouter.ai
- **API Docs:** https://openrouter.ai/docs
- **Modelos Disponibles:** https://openrouter.ai/models
- **Pricing:** https://openrouter.ai/pricing

---

**Estado:** ✅ Configurado con modelos free  
**Modelos:** Llama 3-8B (default) + Mistral 7B (fallback)  
**Cost:** Free (sin límite de tokens)
