# 🖼️ Configuración de Unsplash para Zion Cast

## Obtener tu API Key de Unsplash

1. **Crear cuenta en Unsplash**
   - Ve a https://unsplash.com/join
   - Crea una cuenta gratuita

2. **Registrar tu aplicación**
   - Ve a https://unsplash.com/oauth/applications
   - Click en "New Application"
   - Acepta los términos de uso
   - Llena el formulario:
     - **Application name**: Zion Cast
     - **Description**: Church presentation software with background images
     - **Callback URL**: http://localhost:3000 (o tu URL)

3. **Obtener Access Key**
   - Una vez creada la app, copia tu **Access Key**
   - Se ve algo así: `YOUR_ACCESS_KEY_HERE_1234567890abcdef`

4. **Configurar en Zion Cast**
   - Abre `zion_panel.html`
   - Busca la línea (aprox. línea 1087):
     ```javascript
     const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY';
     ```
   - Reemplaza `'YOUR_UNSPLASH_ACCESS_KEY'` con tu Access Key:
     ```javascript
     const UNSPLASH_ACCESS_KEY = 'tu_access_key_aqui';
     ```

5. **Guardar y probar**
   - Guarda el archivo
   - Recarga Zion Cast
   - Click en el botón "Fondo" en el header
   - Busca imágenes (ej: "worship", "nature", "abstract")

## Límites de la API Gratuita

- **50 requests por hora** (suficiente para uso normal)
- Si necesitas más, puedes aplicar para Production (5,000 requests/hora)

## Notas Importantes

- ✅ Los fondos se guardan en localStorage
- ✅ Persisten entre recargas
- ✅ Se muestra crédito al fotógrafo (requerido por Unsplash)
- ✅ El crédito desaparece automáticamente después de 10 segundos

## Troubleshooting

**Error "403 Forbidden"**: Tu API key es inválida o no está configurada
**Error "Rate Limit"**: Has excedido las 50 búsquedas por hora
**No aparecen imágenes**: Verifica tu conexión a internet

---

¡Disfruta de fondos profesionales en tus presentaciones! 🎨
