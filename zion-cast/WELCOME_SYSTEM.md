# 🎉 Sistema de Modales de Bienvenida - ZionCast

## 📋 Descripción

Sistema modular de bienvenida y anuncios que muestra mensajes personalizados a los usuarios de ZionCast. Completamente desacoplado del código existente y fácil de personalizar.

## ✨ Características

### 1. **Bienvenida Diaria**
- Mensaje personalizado según la hora del día (mañana/tarde/noche)
- Versículo bíblico aleatorio
- Contador de días usando la aplicación
- Se muestra solo una vez al día

### 2. **Fechas Especiales**
- Navidad (25 de diciembre)
- Año Nuevo (1 de enero)
- Viernes Santo
- Domingo de Resurrección
- Fin de Año (31 de diciembre)

### 3. **Actualizaciones**
- Sistema para anunciar nuevas versiones
- Prioridad configurable (alta/media/baja)
- Mensajes que se pueden descartar

### 4. **Estadísticas**
- Tracking de días usando la aplicación
- Contador de veces que se ha abierto
- Fecha de primer uso

## 🎨 Diseño

El sistema mantiene **total consistencia** con el diseño existente de ZionCast:
- ✅ Glassmorphism
- ✅ Dark mode automático
- ✅ Gradientes de marca
- ✅ Animaciones suaves
- ✅ Responsive

## 🚀 Uso

### Configuración Automática

El sistema se activa automáticamente al cargar la aplicación. No requiere configuración adicional.

### Desactivar Bienvenida Diaria

Los usuarios pueden desactivar la bienvenida diaria marcando el checkbox "No mostrar bienvenida diaria" en el modal.

### Métodos Disponibles

```javascript
// Mostrar un mensaje personalizado
zionWelcome.showCustomMessage({
    type: 'special',
    title: '¡Anuncio Importante!',
    icon: '📢',
    message: 'Mensaje personalizado aquí',
    verse: {
        text: 'Texto del versículo',
        ref: 'Referencia'
    }
});

// Resetear el sistema (útil para pruebas)
zionWelcome.reset();

// Cerrar el modal programáticamente
zionWelcome.closeModal();
```

## 🔧 Personalización

### Agregar Nuevos Versículos

Edita el método `getVerses()` en `js/zion-welcome-system.js`:

```javascript
getVerses() {
    return [
        {
            text: "Tu versículo aquí",
            ref: "Referencia"
        },
        // Agregar más versículos...
    ];
}
```

### Agregar Fechas Especiales

Edita el método `getSpecialDates()` en `js/zion-welcome-system.js`:

```javascript
getSpecialDates() {
    return {
        'MM-DD': { 
            name: 'Nombre del evento', 
            icon: '🎉', 
            message: 'Mensaje especial' 
        },
        // Agregar más fechas...
    };
}
```

### Crear Anuncio de Actualización

Edita el método `checkCriticalUpdates()` en `js/zion-welcome-system.js`:

```javascript
checkCriticalUpdates() {
    const updates = [
        {
            id: 'update-v1.2', // ID único
            type: 'update',
            priority: 'high',
            title: '¡Nueva versión disponible!',
            message: 'ZionCast v1.2 incluye nuevas características...',
        }
    ];

    for (const update of updates) {
        if (!this.data.dismissedIds.includes(update.id)) {
            return update;
        }
    }
    return null;
}
```

## 📊 Datos Almacenados

El sistema guarda datos en `localStorage` bajo la clave `zion_welcome_data`:

```json
{
    "lastShown": "2026-01-18",
    "dismissedIds": ["update-v1.1"],
    "preferences": {
        "showDaily": true,
        "showUpdates": true,
        "showSpecial": true
    },
    "stats": {
        "firstUse": "2026-01-18T06:24:00.000Z",
        "totalOpens": 45
    }
}
```

## 🛡️ Seguridad y Reversibilidad

### Desactivar Temporalmente

```javascript
// En la consola del navegador:
localStorage.setItem('zion_welcome_disabled', 'true');
```

### Eliminar Completamente

1. Eliminar archivos:
   - `css/zion-welcome-modal.css`
   - `js/zion-welcome-system.js`

2. Comentar en `zion_panel.html`:
```html
<!-- <link rel="stylesheet" href="css/zion-welcome-modal.css"> -->
<!-- <script src="js/zion-welcome-system.js" defer></script> -->
```

3. Limpiar localStorage:
```javascript
localStorage.removeItem('zion_welcome_data');
```

## 🎯 Tipos de Mensajes

### Daily (Bienvenida Diaria)
- Badge verde
- Icono según hora del día
- Versículo aleatorio
- Estadísticas de uso

### Special (Ocasión Especial)
- Badge naranja
- Icono personalizado
- Mensaje especial
- Versículo opcional

### Update (Actualización)
- Badge azul
- Información de la actualización
- Botones de acción

### Critical (Crítico)
- Badge rojo pulsante
- Mensaje urgente
- No se puede descartar fácilmente

## 📱 Responsive

El sistema es completamente responsive y se adapta a:
- Desktop
- Tablet
- Mobile

## 🔄 Flujo de Ejecución

1. **Carga del DOM** → Inicializa el sistema
2. **Espera 2.5s** → Permite que el splash screen termine
3. **Verifica condiciones** → ¿Debe mostrar mensaje?
4. **Prioriza mensajes** → Crítico > Especial > Diario
5. **Muestra modal** → Con animación suave
6. **Guarda estado** → En localStorage

## 💡 Consejos

- Los mensajes críticos siempre se muestran, incluso si ya se mostró algo hoy
- Las fechas especiales tienen prioridad sobre la bienvenida diaria
- Los usuarios pueden desactivar la bienvenida diaria pero seguirán viendo anuncios importantes
- El sistema es completamente independiente y no afecta otras funcionalidades

## 🐛 Debugging

Para ver información del sistema en la consola:

```javascript
// Ver datos actuales
console.log(zionWelcome.data);

// Ver versículos disponibles
console.log(zionWelcome.verses);

// Ver fechas especiales
console.log(zionWelcome.specialDates);

// Forzar mostrar bienvenida
zionWelcome.data.lastShown = null;
zionWelcome.checkAndShow();
```

## 📝 Notas

- El sistema usa `defer` para cargar el script, asegurando que no bloquee el renderizado
- Las animaciones usan `cubic-bezier` para suavidad premium
- El backdrop usa `backdrop-filter: blur()` para efecto glassmorphism
- Compatible con todos los temas de ZionCast

---

**Desarrollado por:** Yael Gutierrez  
**Versión:** 1.0  
**Fecha:** Enero 2026
