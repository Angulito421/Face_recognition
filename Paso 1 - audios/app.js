// ================================
// Referencias a elementos del DOM
// ================================
const statusText = document.getElementById("status-text");
const validationText = document.getElementById("validation-text");

const btnSoft = document.getElementById("btn-soft");
const btnMedium = document.getElementById("btn-medium");
const btnStrong = document.getElementById("btn-strong");
const btnStop = document.getElementById("btn-stop");

const btnHeard = document.getElementById("btn-heard");
const btnVolume = document.getElementById("btn-volume");

// ================================
// Carga de audios locales
// Deben existir en la misma carpeta
// ================================
const audioSoft = new Audio("alarm_soft.mp3");
const audioMedium = new Audio("alarm_medium.mp3");
const audioStrong = new Audio("alarm_strong.mp3");

// Opcional: ayuda a que el navegador prepare el recurso.
// No garantiza reproducción automática, porque en móvil
// sigue siendo necesaria una interacción del usuario.
audioSoft.preload = "auto";
audioMedium.preload = "auto";
audioStrong.preload = "auto";

// Variable para saber qué audio está activo actualmente.
let currentAudio = null;

// ================================
// Funciones auxiliares
// ================================

/**
 * Actualiza el mensaje visual principal.
 * @param {string} message
 */
function setStatus(message) {
  statusText.textContent = message;
}

/**
 * Actualiza el mensaje del bloque de validación guiada.
 * @param {string} message
 */
function setValidation(message) {
  validationText.textContent = message;
}

/**
 * Detiene el audio actual si existe.
 * También reinicia el tiempo a 0 para que vuelva a empezar
 * desde el inicio cuando se reproduzca otra vez.
 */
function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Reproduce un audio deteniendo cualquier otro anterior.
 * Esta función debe ejecutarse desde una acción del usuario
 * como un click, para cumplir con políticas móviles de audio.
 *
 * @param {HTMLAudioElement} audioElement
 * @param {string} successMessage
 */
async function playAlarm(audioElement, successMessage) {
  try {
    // Detener cualquier audio que ya se esté reproduciendo.
    stopCurrentAudio();

    // Guardar el nuevo audio como actual.
    currentAudio = audioElement;

    // Reiniciar el audio por si ya se reprodujo antes.
    currentAudio.currentTime = 0;

    // Intentar reproducir.
    await currentAudio.play();

    setStatus(successMessage);
    setValidation("Ahora confirma si escuchaste claramente la alarma.");
  } catch (error) {
    console.error("Error al reproducir audio:", error);
    setStatus("Error al reproducir audio");
    setValidation(
      "No se pudo reproducir la alarma. Verifica permisos, formato del audio o interacción del navegador."
    );
  }
}

// ================================
// Eventos de botones de alarmas
// ================================
btnSoft.addEventListener("click", () => {
  playAlarm(audioSoft, "Alarma suave reproducida");
});

btnMedium.addEventListener("click", () => {
  playAlarm(audioMedium, "Alarma media reproducida");
});

btnStrong.addEventListener("click", () => {
  playAlarm(audioStrong, "Alarma fuerte reproducida");
});

// ================================
// Evento para detener audio
// ================================
btnStop.addEventListener("click", () => {
  stopCurrentAudio();
  setStatus("Audio detenido");
  setValidation("Puedes reproducir otra alarma cuando quieras.");
});

// ================================
// Validación guiada de volumen percibido
// ================================
btnHeard.addEventListener("click", () => {
  setValidation("Perfecto, el audio está listo para futuras alertas.");
});

btnVolume.addEventListener("click", () => {
  setValidation(
    "Sube el volumen del celular y del dispositivo Bluetooth antes de continuar."
  );
});

// ================================
// Eventos extra del audio
// Sirven para mantener el estado consistente
// ================================
[audioSoft, audioMedium, audioStrong].forEach((audio) => {
  audio.addEventListener("ended", () => {
    // Solo limpiar si el audio que terminó es el actual.
    if (currentAudio === audio) {
      currentAudio = null;
      setStatus("Audio finalizado");
    }
  });

  audio.addEventListener("error", () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    setStatus("Error al reproducir audio");
    setValidation(
      "Hubo un problema con el archivo de audio. Revisa que el nombre y formato sean correctos."
    );
  });
});