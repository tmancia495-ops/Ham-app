const arranqueSplash = document.documentElement;
if (arranqueSplash.classList.contains('splash-activo')) {
  const splash = document.querySelector('.splash');
  const logo = splash.querySelector('.splash__logo');
  const acceso = document.querySelector('#acceso-ham');
  const enlace = splash.querySelector('.splash__link');
  let terminando = false;
  splash.hidden = false;
  acceso.inert = true;
  const duracion = parseFloat(getComputedStyle(splash).getPropertyValue('--duracion-splash'));

  async function terminarSplash() {
    if (terminando) return;
    terminando = true;
    clearTimeout(salida);
    await transicionArranqueHam(logo, acceso, () => {
      splash.hidden = true;
      arranqueSplash.classList.remove('splash-activo');
      if (location.hash === '#arranque') history.replaceState(history.state, '', location.pathname + location.search);
    });
    acceso.inert = false;
    window.dispatchEvent(new Event('ham:fin-arranque'));
  }

  const salida = setTimeout(terminarSplash, duracion);
  enlace.addEventListener('click', (evento) => {
    if (evento.ctrlKey || evento.altKey || evento.shiftKey || evento.metaKey) return;
    evento.preventDefault();
    terminarSplash();
  });
}
