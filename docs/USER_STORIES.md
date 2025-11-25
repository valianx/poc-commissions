# Historias de Usuario - Zippy Dashboard

## Índice

1. [Módulo de Canales y Providers](#módulo-de-canales-y-providers)
2. [Módulo de Merchants](#módulo-de-merchants)
3. [Módulo de Comisiones](#módulo-de-comisiones)
4. [Simulador de Pagos](#simulador-de-pagos)

---

## Módulo de Canales y Providers

### HU-CAN-001: Visualización de Canales de Pago

**Como** administrador del sistema
**Quiero** ver la lista de todos los canales de pago disponibles
**Para** gestionar los métodos de pago que ofrece Zippy

#### Criterios de Aceptación

- [ ] Se muestra una tabla con todos los canales registrados
- [ ] La tabla incluye las columnas: Nombre, Código, Estado, Acciones
- [ ] El estado se muestra con un badge de color (verde=Activo, rojo=Inactivo)
- [ ] Se puede acceder a los detalles de cada canal
- [ ] Se puede editar cada canal
- [ ] Se puede eliminar cada canal (con confirmación)

#### Campos del Canal

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Nombre | Texto | Sí | Mín. 3 caracteres |
| Código | Texto | Sí | snake_case (ej: credit_card, pix) |
| Descripción | Texto | No | Máx. 500 caracteres |
| Estado | Boolean | Sí | Activo/Inactivo |

---

### HU-CAN-002: Crear Nuevo Canal

**Como** administrador del sistema
**Quiero** crear un nuevo canal de pago
**Para** ampliar las opciones de pago disponibles para los merchants

#### Criterios de Aceptación

- [ ] Formulario con campos: Nombre, Código, Descripción, Estado
- [ ] Validación de código único (no puede repetirse)
- [ ] El código debe estar en formato snake_case
- [ ] Al guardar, redirige a la lista de canales
- [ ] Mensaje de éxito al crear correctamente

---

### HU-CAN-003: Asignación de Providers por País

**Como** administrador del sistema
**Quiero** asignar providers (PSPs) a cada canal por país
**Para** definir qué provider procesa las transacciones de cada canal en cada país

#### Criterios de Aceptación

- [ ] Al entrar al detalle de un canal, se muestra la sección "Asignación de Providers por País"
- [ ] Botón "Asignar Provider" abre formulario con selects de País y Provider
- [ ] Solo se pueden seleccionar providers activos
- [ ] La lista de providers se ordena: activos primero, inactivos después

#### Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| RN-CAN-001 | Solo puede haber UN provider activo por país en cada canal |
| RN-CAN-002 | Si ya existe un provider activo para ese país, se muestra diálogo con opciones |
| RN-CAN-003 | La información nunca se elimina, solo se desactiva |
| RN-CAN-004 | Al cambiar el provider activo, se sincronizan automáticamente las configuraciones de los merchants |

#### Flujo de Asignación con Conflicto

Cuando se intenta asignar un provider a un país que ya tiene uno activo:

```
Opciones:
1 = Reemplazar (provider existente será desactivado, nuevo será activo)
2 = Agregar como inactivo (provider existente permanece activo)
Vacío/Otro = Cancelar operación
```

---

### HU-CAN-004: Activar/Desactivar Provider por País

**Como** administrador del sistema
**Quiero** activar o desactivar un provider asignado a un canal/país
**Para** controlar qué provider procesa las transacciones sin eliminar la configuración

#### Criterios de Aceptación

- [ ] Botón "Activar" visible para providers inactivos
- [ ] Botón "Desactivar" visible para providers activos
- [ ] Al activar, si ya hay otro activo, se muestra confirmación
- [ ] Al confirmar activación, el provider anterior se desactiva automáticamente
- [ ] Al desactivar, no se requiere confirmación

---

### HU-CAN-005: Gestión de Payment Service Providers

**Como** administrador del sistema
**Quiero** gestionar los Payment Service Providers (Providers)
**Para** mantener actualizada la lista de proveedores de servicios de pago

#### Criterios de Aceptación

- [ ] Tab "Providers" en la página de Canales
- [ ] Tabla con columnas: Nombre, Código, Comisiones Configuradas, Estado, Acciones
- [ ] Se puede crear, editar, ver y eliminar providers
- [ ] Se muestra el conteo de comisiones configuradas por canal/país

#### Campos del Provider

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Nombre | Texto | Sí | Mín. 3 caracteres |
| Código | Texto | Sí | MAYÚSCULAS_SNAKE_CASE |
| Estado | Boolean | Sí | Activo/Inactivo |

---

### HU-CAN-006: Configuración de Comisiones del Provider

**Como** administrador del sistema
**Quiero** configurar las comisiones que cobra cada provider por canal y país
**Para** calcular correctamente el costo de procesamiento de cada transacción

#### Criterios de Aceptación

- [ ] En el detalle del provider, sección "Comisiones por Canal/País"
- [ ] Se puede agregar comisión especificando: Canal, País, Tipo, Valores
- [ ] Tipos de comisión: Porcentaje, Fijo, Mixto

#### Estructura de Comisión del Provider

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Canal | Select | Sí | Lista de canales activos |
| País | Select | Sí | Código ISO 2 letras (CL, BR, PE, etc.) |
| Tipo de Comisión | Select | Sí | PERCENTAGE, FIXED, MIXED |
| Valor Porcentual | Número | Condicional | 0.00 a 1.00 (ej: 0.029 = 2.9%) |
| Valor Fijo | Número | Condicional | >= 0 |

---

## Módulo de Merchants

### HU-MER-001: Visualización de Merchants

**Como** administrador del sistema
**Quiero** ver la lista de todos los merchants registrados
**Para** gestionar las empresas que utilizan Zippy para procesar pagos

#### Criterios de Aceptación

- [ ] Tabla con columnas: Nombre, Código, Países, Estado, Acciones
- [ ] Los países se muestran como badges
- [ ] El estado se muestra con badge de color
- [ ] Acciones: Ver, Editar, Eliminar

---

### HU-MER-002: Crear Nuevo Merchant

**Como** administrador del sistema
**Quiero** registrar un nuevo merchant
**Para** permitir que una nueva empresa procese pagos a través de Zippy

#### Criterios de Aceptación

- [ ] Formulario completo de registro
- [ ] Validación de código único
- [ ] Al menos un país debe ser seleccionado

#### Campos del Merchant

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Nombre | Texto | Sí | Mín. 3 caracteres |
| Código | Texto | Sí | MAYÚSCULAS_NÚMEROS_GUIONES |
| Países | Multi-select | Sí | Al menos 1 país |
| Estado | Boolean | Sí | Activo/Inactivo |
| Evaluación de Balance | Boolean | No | Activo/Inactivo |
| URL Callback Depósito | URL | No | URL válida con HTTPS |
| URL Callback Retiro | URL | No | URL válida con HTTPS |
| Ref. API Key | Texto | No | Referencia al secret manager |
| Ref. Secret Key | Texto | No | Referencia al secret manager |

#### Países Disponibles

| Código | Nombre |
|--------|--------|
| CL | Chile |
| BR | Brasil |
| PE | Perú |
| CO | Colombia |
| MX | México |
| AR | Argentina |

---

### HU-MER-003: Configuración de Canales del Merchant

**Como** administrador del sistema
**Quiero** configurar qué canales tiene habilitados cada merchant por país
**Para** controlar los métodos de pago disponibles para cada merchant

#### Criterios de Aceptación

- [ ] En el detalle del merchant, sección "Configuración de Canales"
- [ ] Filtros por País y Canal
- [ ] Tabla con columnas: Canal, Provider, País, Estado, Acciones
- [ ] Solo se muestran canales de países donde opera el merchant
- [ ] El provider se hereda de la configuración del canal

#### Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| RN-MER-001 | El merchant solo puede tener canales en países donde opera |
| RN-MER-002 | El provider del canal se sincroniza automáticamente desde la configuración del canal |
| RN-MER-003 | Si el canal no tiene provider activo para ese país, no se puede agregar |

---

### HU-MER-004: Agregar Canal al Merchant

**Como** administrador del sistema
**Quiero** agregar un canal a la configuración de un merchant
**Para** habilitar un nuevo método de pago para ese merchant

#### Criterios de Aceptación

- [ ] Botón "Agregar Canal" abre formulario
- [ ] Selects: País, Canal
- [ ] El provider se asigna automáticamente según la configuración del canal
- [ ] Validación: no se puede duplicar combinación merchant-país-canal

---

## Módulo de Comisiones

### HU-COM-001: Visualización de Comisiones por Merchant

**Como** administrador del sistema
**Quiero** ver las comisiones configuradas para cada merchant
**Para** gestionar lo que Zippy cobra a cada merchant por sus transacciones

#### Criterios de Aceptación

- [ ] Lista de merchants con indicador de comisiones configuradas
- [ ] Al hacer clic, se muestran las comisiones del merchant
- [ ] Agrupación por País y Canal
- [ ] Se muestra: Tipo, Valor Base, Comisión Mínima, Tier 2, VAT, Estado, Vigencia

---

### HU-COM-002: Crear Configuración de Comisión

**Como** administrador del sistema
**Quiero** crear una nueva configuración de comisión para un merchant
**Para** definir lo que Zippy cobrará por procesar sus transacciones

#### Criterios de Aceptación

- [ ] Formulario con secciones claramente separadas
- [ ] Validación de campos requeridos
- [ ] Vista previa de la configuración antes de guardar

#### Sección 1: Configuración Base

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| País | Select | Sí | Solo países donde opera el merchant |
| Canal | Select | Sí | Solo canales configurados para ese país |
| Descripción | Texto | No | Máx. 500 caracteres |
| VAT/IVA | Número | No | 0-100 (se convierte a decimal) |
| Fecha Inicio | Fecha | Sí | >= Hoy |
| Fecha Fin | Fecha | No | > Fecha Inicio |
| Asignado Por | Email | Sí | Email válido |

#### Sección 2: Comisión Base

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Comisión Porcentual | Número | Condicional* | 0-100 (se convierte a decimal) |
| Comisión Fija | Número | Condicional* | >= 0 |

*Al menos uno de los dos debe tener valor

#### Sección 3: Comisión Mínima (Opcional)

Aplica cuando el monto de la transacción está dentro de un rango específico.

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Habilitar | Checkbox | No | - |
| Monto Mínimo Transacción | Número | Si habilitado | >= 0 |
| Monto Máximo Transacción | Número | Si habilitado | > Monto Mínimo |
| Comisión Porcentual | Número | Condicional* | 0-100 |
| Comisión Fija | Número | Condicional* | >= 0 |

*Al menos uno si está habilitado

**Ejemplo:** Si rango es 0-10,000 con 2% fijo, las transacciones <= 10,000 aplican esta comisión en lugar de la base.

#### Sección 4: Comisión Tier 2 (Opcional)

Se activa cuando el merchant alcanza un monto acumulado de transacciones en el canal/país.

| Campo | Tipo | Requerido | Formato/Validación |
|-------|------|-----------|-------------------|
| Habilitar | Checkbox | No | - |
| Umbral Acumulado | Número | Si habilitado | > 0 |
| Comisión Porcentual | Número | Condicional* | 0-100 |
| Comisión Fija | Número | Condicional* | >= 0 |

*Al menos uno si está habilitado

**Ejemplo:** Si umbral es 1,000,000 y el merchant ya procesó esa cantidad, se aplica Tier 2.

---

### HU-COM-003: Estados de Comisión

**Como** administrador del sistema
**Quiero** que las comisiones tengan estados automáticos basados en fechas
**Para** gestionar la vigencia de las comisiones sin intervención manual

#### Estados

| Estado | Condición | Descripción |
|--------|-----------|-------------|
| SCHEDULED | Fecha inicio > Hoy | Programada para el futuro |
| ACTIVE | Fecha inicio <= Hoy AND (Fecha fin es null OR Fecha fin >= Hoy) | Vigente |
| EXPIRED | Fecha fin < Hoy | Expirada |
| CANCELLED | Manual | Cancelada manualmente |

---

### HU-COM-004: Cálculo de Comisiones

**Como** sistema
**Quiero** calcular la comisión correcta para cada transacción
**Para** cobrar lo correcto al merchant

#### Flujo de Cálculo

```
1. Obtener comisión activa para merchant-país-canal
2. Verificar si aplica Comisión Mínima (monto dentro del rango)
   - SI: Usar comisión mínima
   - NO: Continuar
3. Verificar si aplica Tier 2 (monto acumulado >= umbral)
   - SI: Usar comisión Tier 2
   - NO: Usar comisión base
4. Calcular comisión bruta = (porcentaje × monto) + fijo
5. Obtener comisión del provider para canal-país
6. Calcular VAT sobre comisión bruta
7. Total = comisión bruta + comisión provider + VAT
```

#### Fórmulas

| Concepto | Fórmula |
|----------|---------|
| Comisión Porcentual | `monto × porcentaje` |
| Comisión Bruta | `comisión_porcentual + comisión_fija` |
| VAT | `comisión_bruta × vat_porcentaje` |
| Comisión Provider | Según configuración del provider |
| Total Cobrado | `comisión_bruta + vat + comisión_provider` |
| Merchant Recibe | `monto - total_cobrado` |

---

## Simulador de Pagos

### HU-SIM-001: Simular Transacción

**Como** administrador del sistema
**Quiero** simular una transacción de pago
**Para** verificar el cálculo de comisiones antes de procesar pagos reales

#### Criterios de Aceptación

- [ ] Formulario con: Merchant, País, Canal, Monto, Moneda
- [ ] Validación de que el merchant tenga comisión configurada
- [ ] Resultado detallado del cálculo

#### Resultado de Simulación

| Campo | Descripción |
|-------|-------------|
| Monto Transacción | Monto ingresado |
| Comisión Merchant | Desglose de la comisión |
| Comisión Provider | Nombre del provider y comisión |
| VAT | Porcentaje y monto |
| Total Cobrado | Suma de todas las comisiones |
| Merchant Recibe | Monto - Total Cobrado |
| Ganancia Zippy | Total Cobrado - Provider - VAT |

---

## Gestión de Datos

### HU-DAT-001: Restablecer Datos de Ejemplo

**Como** administrador del sistema
**Quiero** restablecer los datos a su estado inicial
**Para** volver a los datos de ejemplo cuando necesite hacer pruebas

#### Criterios de Aceptación

- [ ] Página accesible en `/clear-storage`
- [ ] Botón "Restablecer Seed" elimina todo y carga datos de ejemplo
- [ ] Confirmación visual antes de ejecutar
- [ ] Redirección al inicio después de completar

---

### HU-DAT-002: Eliminar Todos los Datos

**Como** administrador del sistema
**Quiero** eliminar todos los datos de la aplicación
**Para** comenzar desde cero sin datos de ejemplo

#### Criterios de Aceptación

- [ ] Botón "Eliminar Todos los Datos" en `/clear-storage`
- [ ] Confirmación visual antes de ejecutar
- [ ] La aplicación queda vacía (sin seed)
- [ ] Se puede volver a cargar el seed más adelante

---

## Restricciones Globales

### Validaciones de Formato

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Código de País | 2 letras mayúsculas ISO | CL, BR, PE |
| Código de Canal | snake_case | credit_card, pix |
| Código de Provider | MAYÚSCULAS_SNAKE_CASE | PAYU, MERCADOPAGO |
| Código de Merchant | MAYÚSCULAS_NÚMEROS_GUIÓN | 1XBET_001 |
| Porcentaje (entrada) | Número 0-100 | 3.5 |
| Porcentaje (almacenado) | Decimal 0-1 | 0.035 |
| Email | Formato email válido | admin@zippy.com |
| URL | HTTPS válida | https://api.example.com |
| Moneda | 3 letras mayúsculas ISO | CLP, BRL, USD |

### Principios de Datos

| Principio | Descripción |
|-----------|-------------|
| No eliminación | Los datos nunca se eliminan, solo se desactivan |
| Unicidad | Códigos deben ser únicos por entidad |
| Integridad referencial | No se puede eliminar entidad con dependencias |
| Auditoría | Se registra fecha de creación y actualización |
| Sincronización | Los cambios en canales se propagan a merchants |

---

## Glosario

| Término | Definición |
|---------|------------|
| Canal | Método de pago (PIX, Tarjeta de Crédito, WebPay, etc.) |
| Provider/PSP | Payment Service Provider - empresa que procesa pagos |
| Merchant | Empresa cliente que usa Zippy para recibir pagos |
| Comisión Base | Comisión estándar que se cobra por transacción |
| Comisión Mínima | Comisión especial para transacciones en un rango de monto |
| Tier 2 | Nivel de comisión preferencial por volumen acumulado |
| VAT/IVA | Impuesto al valor agregado aplicado a la comisión |
| Umbral Acumulado | Monto total de transacciones para desbloquear Tier 2 |
