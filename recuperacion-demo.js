const correoRecuperacionDemo = 'recuperacion@ham.example';
const claveInicialRecuperacionDemo = 'HamDemo2026!';
const llaveClaveDemo = 'ham.recuperacion-demo.verificador';
const vidaCodigoDemo = 600000;
const esperaReenvioDemo = 60000;
let solicitudDemo;

function iniciarSolicitudDemo(correo) {
  const destino = correoCuenta(correo);
  if (solicitudDemo?.correo === destino && Date.now() < solicitudDemo.reenviarEn) throw new Error('Espera a que termine la cuenta regresiva.');
  let numero;
  do { numero = crypto.getRandomValues(new Uint32Array(1))[0]; } while (numero >= 4294000000 || String(numero % 1000000).padStart(6, '0') === solicitudDemo?.ultimoCodigo);
  const ahora = Date.now();
  const codigo = String(numero % 1000000).padStart(6, '0');
  solicitudDemo = { correo: destino, codigo, ultimoCodigo: codigo, vence: ahora + vidaCodigoDemo,
    reenviarEn: ahora + esperaReenvioDemo, intentos: 5, autorizadaHasta: 0 };
  return solicitudDemo;
}

function verificarCodigoDemo(codigo) {
  if (!solicitudDemo || Date.now() >= solicitudDemo.vence) throw new Error('El código expiró. Solicita otro.');
  if (solicitudDemo.autorizadaHasta) throw new Error('El código ya se utilizó. Solicita otro.');
  if (solicitudDemo.intentos <= 0) throw new Error('Agotaste los intentos. Solicita otro código.');
  if (codigo !== solicitudDemo.codigo) {
    solicitudDemo.intentos--;
    throw new Error(solicitudDemo.intentos ? 'El código es incorrecto. Intentos restantes: ' + solicitudDemo.intentos + '.'
      : 'Agotaste los intentos. Solicita otro código.');
  }
  solicitudDemo.codigo = null;
  solicitudDemo.autorizadaHasta = Date.now() + vidaCodigoDemo;
}

function autorizacionDemoValida() {
  return Boolean(solicitudDemo && Date.now() < solicitudDemo.autorizadaHasta);
}

async function derivarClaveDemo(clave, sal) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 600000, salt: sal }, material, 256);
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function validarClaveAccesoDemo(clave) {
  const anterior = JSON.parse(localStorage.getItem(llaveClaveDemo) || 'null');
  if (!anterior) return clave === claveInicialRecuperacionDemo;
  return await derivarClaveDemo(clave, Uint8Array.from(anterior.sal)) === anterior.verificador;
}

function finalizarRecuperacionDemo() {
  if (!autorizacionDemoValida()) throw new Error('La autorización DEMO expiró. Solicita otro código.');
  solicitudDemo = undefined;
}
