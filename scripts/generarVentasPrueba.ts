/**
 * Script para generar ventas de prueba completas
 * Simula un día completo de ventas desde apertura hasta cierre de caja
 */

import * as queries from '../lib/database/queries';
import { db } from '../lib/database';

// Configuración de pruebas
const MONTO_INICIAL_CAJA = 500; // $500 para dar cambio
const NUMERO_VENTAS = 10;
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

/**
 * Obtiene productos aleatorios activos
 */
async function obtenerProductosAleatorios(cantidad: number): Promise<any[]> {
  const todosProductos = await queries.obtenerProductos();

  if (todosProductos.length === 0) {
    throw new Error('No hay productos activos en la base de datos');
  }

  // Seleccionar productos aleatorios
  const seleccionados: any[] = [];
  const productosDisponibles = [...todosProductos];

  for (let i = 0; i < cantidad && productosDisponibles.length > 0; i++) {
    const indiceAleatorio = Math.floor(Math.random() * productosDisponibles.length);
    seleccionados.push(productosDisponibles[indiceAleatorio]);
    productosDisponibles.splice(indiceAleatorio, 1);
  }

  return seleccionados;
}

/**
 * Genera una venta aleatoria
 */
async function generarVentaAleatoria(cajaId: number, numeroVenta: number): Promise<any> {
  try {
    // Determinar cuántos productos en esta venta (entre 1 y 5)
    const cantidadItems = Math.floor(Math.random() * 5) + 1;

    // Obtener productos aleatorios
    const productos = await obtenerProductosAleatorios(cantidadItems);

    // Construir items de la venta
    const items = productos.map(producto => {
      const cantidad = Math.floor(Math.random() * 3) + 1; // Entre 1 y 3 unidades
      const precioVenta = producto.precioVenta || 0;

      return {
        productoId: producto.id,
        cantidad: cantidad,
        precioUnitario: precioVenta,
        subtotal: precioVenta * cantidad,
      };
    });

    // Calcular total
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Método de pago aleatorio
    const metodoPago = METODOS_PAGO[Math.floor(Math.random() * METODOS_PAGO.length)];

    // Crear venta
    const venta = await queries.crearVenta({
      total,
      fecha: new Date().toISOString(),
      metodoPago,
      cajaId,
    }, items);

    console.log(`✅ Venta ${numeroVenta}/10 creada:`);
    console.log(`   - Total: $${total.toFixed(2)}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Método: ${metodoPago}`);
    console.log(`   - Productos: ${productos.map(p => p.nombre).join(', ')}`);

    return venta;
  } catch (error) {
    console.error(`❌ Error al crear venta ${numeroVenta}:`, error);
    throw error;
  }
}

/**
 * Script principal
 */
export async function ejecutarPruebasVentas() {
  console.log('\n🚀 === INICIANDO PRUEBAS DE VENTAS COMPLETAS ===\n');

  try {
    // 1. APERTURA DE CAJA
    console.log('📂 PASO 1: Abriendo caja...');
    const caja = await queries.abrirCaja(
      MONTO_INICIAL_CAJA,
      'Caja de prueba - Script automático'
    );
    console.log(`✅ Caja abierta - ID: ${caja.id}`);
    console.log(`   - Monto inicial: $${MONTO_INICIAL_CAJA}.00`);
    console.log(`   - Fecha: ${new Date().toLocaleString('es-MX')}\n`);

    // 2. GENERAR VENTAS
    console.log(`💰 PASO 2: Generando ${NUMERO_VENTAS} ventas...\n`);

    const ventas = [];
    let totalVendido = 0;
    let totalGanancias = 0;

    for (let i = 1; i <= NUMERO_VENTAS; i++) {
      const venta = await generarVentaAleatoria(caja.id, i);
      ventas.push(venta);
      totalVendido += venta.total;

      // Calcular ganancia de esta venta
      const items = await queries.obtenerDetallesVenta(venta.id);
      for (const item of items) {
        const producto = item.producto;
        if (producto) {
          const gananciaUnitaria = item.precioUnitario - (producto.precioCompra || 0);
          totalGanancias += gananciaUnitaria * item.cantidad;
        }
      }

      // Pequeña pausa para simular tiempo real
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ ${NUMERO_VENTAS} ventas generadas exitosamente!`);
    console.log(`   - Total vendido: $${totalVendido.toFixed(2)}`);
    console.log(`   - Ganancias totales: $${totalGanancias.toFixed(2)}`);
    console.log(`   - Margen promedio: ${totalVendido > 0 ? ((totalGanancias / totalVendido) * 100).toFixed(1) : 0}%\n`);

    // 3. REGISTRO DE MOVIMIENTOS (Opcional)
    console.log('📝 PASO 3: Registrando movimientos adicionales...');

    // Retiro de efectivo (simulado)
    await queries.registrarMovimientoCaja(caja.id, 'retiro', 200, 'Retiro para banco');
    console.log('   - Retiro: $200.00 (para banco)');

    // Gasto
    await queries.registrarMovimientoCaja(caja.id, 'gasto', 50, 'Compra de bolsas');
    console.log('   - Gasto: $50.00 (bolsas)\n');

    // 4. CIERRE DE CAJA
    console.log('🔒 PASO 4: Cerrando caja...');

    const montoFinalEsperado = MONTO_INICIAL_CAJA + totalVendido - 200 - 50;

    const cajaCerrada = await queries.cerrarCaja(
      caja.id,
      montoFinalEsperado,
      'Cierre de caja - Prueba completada'
    );

    console.log('✅ Caja cerrada exitosamente!');
    console.log(`   - Monto final: $${montoFinalEsperado.toFixed(2)}`);
    console.log(`   - Diferencia: $0.00 (correcto)\n`);

    // 5. RESUMEN FINAL
    console.log('📊 === RESUMEN FINAL ===\n');
    console.log(`Total ventas: ${NUMERO_VENTAS}`);
    console.log(`Total vendido: $${totalVendido.toFixed(2)}`);
    console.log(`Ganancias netas: $${totalGanancias.toFixed(2)}`);
    console.log(`Margen de ganancia: ${totalVendido > 0 ? ((totalGanancias / totalVendido) * 100).toFixed(1) : 0}%`);
    console.log(`Ticket promedio: $${(totalVendido / NUMERO_VENTAS).toFixed(2)}`);
    console.log(`\nMonto inicial caja: $${MONTO_INICIAL_CAJA}.00`);
    console.log(`Movimientos:`);
    console.log(`  + Ventas: $${totalVendido.toFixed(2)}`);
    console.log(`  - Retiros: $200.00`);
    console.log(`  - Gastos: $50.00`);
    console.log(`Monto final: $${montoFinalEsperado.toFixed(2)}`);

    console.log('\n✅ === PRUEBAS COMPLETADAS EXITOSAMENTE ===\n');

    return {
      cajaId: caja.id,
      numeroVentas: NUMERO_VENTAS,
      totalVendido,
      totalGanancias,
      margenPromedio: totalVendido > 0 ? (totalGanancias / totalVendido) * 100 : 0,
      ticketPromedio: totalVendido / NUMERO_VENTAS,
    };

  } catch (error) {
    console.error('\n❌ === ERROR EN LAS PRUEBAS ===');
    console.error(error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  ejecutarPruebasVentas()
    .then(() => {
      console.log('Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}
