# CLAUDE.MD - TiendaPOS Mobile

> Context file for Claude AI assistant sessions
> Last Updated: 2026-01-13

## 🎯 Project Overview

**TiendaPOS Mobile** is a React Native point-of-sale (POS) application built with Expo for small Mexican retail stores. This is a mobile counterpart to an existing Electron desktop application.

### Key Facts
- **Platform:** React Native + Expo SDK 54
- **Database:** SQLite with Drizzle ORM
- **State Management:** Zustand
- **UI Framework:** React Native Paper
- **Navigation:** Expo Router (migrating to React Navigation Drawer)
- **Target Market:** Mexican convenience stores (tiendas de abarrotes)

---

## 📂 Project Structure

```
TiendaPOS-Mobile/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab-based navigation
│   │   └── index.tsx             # ✅ Main POS screen (complete)
│   ├── (drawer)/                 # 🚧 Drawer navigation (in progress)
│   └── _layout.tsx               # App initialization & DB setup
│
├── lib/                          # Core application logic
│   ├── database/
│   │   ├── schema.ts             # ✅ Database schema (9 tables)
│   │   ├── index.ts              # 🚧 DB initialization (needs update)
│   │   └── queries.ts            # 🚧 Data queries (needs update)
│   │
│   ├── bluetooth/
│   │   ├── scanner.ts            # ✅ Barcode scanner hook
│   │   └── printer.ts            # ✅ Thermal printer system
│   │
│   ├── store/                    # Zustand state management
│   │   ├── useCartStore.ts       # ✅ Shopping cart
│   │   ├── useProductStore.ts    # ✅ Product management
│   │   └── useConfigStore.ts     # ✅ App configuration
│   │
│   └── utils/
│       ├── formatters.ts         # ✅ Currency, dates, etc.
│       └── seedData.ts           # 🚧 Initial data loader (needs update)
│
├── assets/
│   └── productos/
│       └── productos-mexico.json # ✅ 40 pre-loaded Mexican products
│
├── INSTRUCCIONES-PRUEBA.md      # Testing instructions
├── PLAN-MIGRACION-COMPLETO.md   # Migration plan
├── RESUMEN-PROYECTO.md          # Project summary
└── RESUMEN-ANALISIS-COMPLETO.md # Complete analysis
```

---

## 🗄️ Database Schema

### Tables (9 total)

1. **productos** - Product catalog
   - Fields: codigo_barras, nombre, precio, stock, categoria, marca, presentacion, descripcion, sku, unidad_medida
   - Pre-loaded: 40 Mexican products

2. **ventas** - Sales records
   - Fields: total, fecha, metodo_pago, caja_id
   - Simplified structure (no IVA breakdown)

3. **venta_items** - Sale line items
   - Fields: venta_id, producto_id, cantidad, precio_unitario

4. **cajas** - Cash register sessions
   - Fields: monto_inicial, monto_final, fecha_apertura, fecha_cierre, usuario_apertura

5. **movimientos_caja** - Cash movements
   - Fields: caja_id, tipo, monto, concepto, fecha, usuario

6. **proveedores** - Supplier management
   - Fields: nombre, contacto, telefono, email, direccion, rfc

7. **productos_proveedores** - Product-supplier relationship
   - Many-to-many linking table

8. **lista_compras** - Shopping/reorder list
   - Fields: producto_id, cantidad_sugerida, fecha_agregado

9. **configuracion** - App settings
   - 40+ configuration fields for store customization

---

## 🚨 Critical Issues & Status

### 🔴 URGENT - Database Schema Mismatch

**Problem:** Mobile app currently uses OLD schema, different from desktop app.

**Old Schema (currently in code):**
- productos: precio_compra, precio_venta, stock_minimo
- ventas: folio, subtotal, iva, descuento, forma_pago, monto_recibido, cambio
- detalle_ventas: (old table name)

**New Schema (needed):**
- productos: precio (single field), marca, presentacion, sku
- ventas: total, metodo_pago, caja_id
- venta_items: (new table name)

**Status:**
- ✅ schema.ts updated
- ❌ index.ts needs update (still creates old tables)
- ❌ queries.ts needs complete rewrite
- ❌ productos-mexico.json needs update (remove precio_compra/precio_venta)
- ❌ POS screen needs update to use new structure

---

## ✅ Completed Features (70%)

### 1. Point of Sale (POS) - 95% Complete
- ✅ Product search in real-time
- ✅ Barcode scanning (Bluetooth HID)
- ✅ Shopping cart with quantity adjustment
- ✅ Stock validation
- ✅ Multiple payment methods (cash, card, transfer)
- ✅ Change calculation
- ✅ Automatic IVA calculation (16%)
- ✅ PDF ticket generation
- ❌ Integration with cash register (caja) - PENDING

### 2. Database & Data
- ✅ SQLite setup with Drizzle ORM
- ✅ Schema defined (9 tables)
- ✅ 40 Mexican products pre-loaded
- ❌ Database initialization outdated
- ❌ Queries need updating

### 3. Hardware Integration
- ✅ Bluetooth barcode scanner (HID input)
- ✅ Thermal printer (PDF generation)
- ⚠️ Real Bluetooth printing requires bare workflow

### 4. UI/UX
- ✅ React Native Paper components
- ✅ Professional POS interface
- ✅ Responsive design
- ❌ Navigation incomplete (no drawer/tabs)

---

## 🚧 Pending Features (30%)

### Priority HIGH (Week 1-2)

1. **Fix Database Incompatibilities** 🔴 CRITICAL
   - Update index.ts initialization
   - Update all queries.ts functions
   - Update productos-mexico.json format
   - Create migration script

2. **Complete Navigation** 🔴 URGENT
   - Implement Drawer Navigator
   - Setup Bottom Tabs
   - Connect screens

3. **Product Management Module** 🔴 URGENT
   - Product list with search/filters
   - Add/Edit product forms
   - Category management
   - Import/Export

4. **Cash Register Module** 🟡 IMPORTANT
   - Open cash register (apertura de caja)
   - Record movements
   - Cash withdrawals
   - Close register
   - History

5. **Update POS Screen** 🟡 IMPORTANT
   - Link to active cash register
   - Use new sales structure
   - Update queries

### Priority MEDIUM (Week 3-4)

6. **Inventory Module**
   - Stock view
   - Low stock alerts
   - Inventory adjustments
   - Reorder list

7. **Suppliers Module**
   - Supplier CRUD
   - Link to products
   - Purchase recording

8. **Sales History**
   - Complete list with filters
   - Sale details
   - Reprint tickets

9. **Basic Reports**
   - Sales by period
   - Top products
   - Simple charts

10. **Settings**
    - Store information
    - POS preferences
    - Printer configuration

### Priority LOW (Week 5+)

11. Virtual assistant (optional)
12. Product catalog view
13. Advanced financial reports
14. Cloud sync
15. Push notifications

---

## 🛠️ Technology Stack

### Dependencies

**Core:**
- expo: ~54.0.0
- react-native: 0.74.0
- expo-router: ~3.5.0
- typescript: ^5.3.0

**Database:**
- expo-sqlite: ~14.0.0
- drizzle-orm: ^0.33.0

**UI:**
- react-native-paper: ^5.12.0
- react-native-safe-area-context
- @expo/vector-icons

**State:**
- zustand: ^4.5.0
- react-hook-form: ^7.51.0
- zod: ^3.23.0

**Utilities:**
- date-fns: ^3.0.0

**Hardware:**
- expo-barcode-scanner: ~13.0.0
- expo-print: ~13.0.0
- expo-sharing: ~12.0.0
- expo-file-system: ~17.0.0

---

## 📝 Coding Guidelines

### File Operations
- ALWAYS prefer editing existing files over creating new ones
- NEVER create markdown files unless explicitly requested
- Use Read tool before Edit/Write operations

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Clear variable/function names in Spanish (matching domain)
- Minimal comments (self-documenting code preferred)

### Database
- Use Drizzle ORM for all queries
- Always use transactions for multi-step operations
- Validate data with Zod schemas
- Handle SQLite errors gracefully

### State Management
- Zustand for global state
- React Hook Form for forms
- Keep stores focused and minimal

### UI/UX
- React Native Paper for consistency
- Safe area handling
- Responsive to different screen sizes
- Loading states and error handling

---

## 🎯 Current Sprint Focus

### Immediate Tasks (This Week)

1. ✅ Update CLAUDE.MD (this file)
2. 🚧 Fix database schema incompatibilities
   - Update lib/database/index.ts
   - Update lib/database/queries.ts
   - Update assets/productos/productos-mexico.json
3. 🚧 Implement navigation structure
4. 🚧 Create product management module

---

## 💡 Important Context

### Desktop App Reference
There's a companion Electron desktop app at `C:\Users\gaele\pos-tienda` with:
- 12 complete modules
- Same database schema (our target)
- Advanced features (financial reports, AI assistant)

**Goal:** Mobile app should match desktop functionality for offline stores.

### Business Context
- Target: Small Mexican retail stores
- Need: Offline-first POS system
- Hardware: Bluetooth scanner + thermal printer
- Users: Store owners with basic tech skills

### Technical Constraints
- Must work offline (no internet required)
- SQLite for data persistence
- No backend/cloud (for now)
- Expo for rapid development
- May need bare workflow for full Bluetooth printing

---

## 📞 Getting Help

- Issues: https://github.com/anthropics/claude-code/issues
- Command: /help for Claude Code assistance

---

## 🔄 Session Continuity

### For Next Session

**Current State:**
- Schema updated in schema.ts
- 40 products ready in JSON
- POS screen functional but using old schema
- No navigation structure yet

**Immediate Priorities:**
1. Fix database initialization (index.ts)
2. Update all queries (queries.ts)
3. Implement drawer navigation
4. Create product list screen

**Blocked By:**
- Database schema mismatch must be fixed first
- Navigation needed before adding more screens

---

## 📊 Progress Metrics

- Overall: 70% complete
- Database: 60% (schema ✅, init ❌, queries ❌)
- POS: 95% (works but needs schema update)
- Products: 10% (data ✅, UI ❌)
- Navigation: 20% (basic routing only)
- Reports: 0%
- Settings: 0%

**Estimated to v1.0:** 4-5 weeks

---

*This file should be read at the start of each Claude session for full context.*
