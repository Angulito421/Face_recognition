// import {
//   FaceLandmarker,
//   FilesetResolver
// } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
// FPS tracking
let lastFpsTime = performance.now();
let frameCount = 0;

let lastDetectionTime = performance.now();
let detectionCount = 0;

let currentFPS = 0;
let currentDetectionFPS = 0;

const fpsText = document.getElementById("fpsText");

import {
  FaceLandmarker,
  FilesetResolver
} from "./mediapipe/vision_bundle.mjs";

// ================================
// Referencias al DOM
// ================================
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const emptyState = document.getElementById("emptyState");

const cameraStatus = document.getElementById("cameraStatus");
const faceStatus = document.getElementById("faceStatus");
const statusMessage = document.getElementById("statusMessage");

const ctx = overlay.getContext("2d");

// ================================
// Estado global de la app
// ================================
let faceLandmarker = null;
let stream = null;
let animationFrameId = null;
let cameraRunning = false;
let lastVideoTime = -1;

// URL del modelo oficial usada en el ejemplo de MediaPipe.
// Puedes reemplazarla por un archivo local si después quieres
// trabajar completamente offline.
// const MODEL_ASSET_URL =
//   "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const MODEL_ASSET_URL = "./face_landmarker.task";

// ================================
// Utilidades de UI
// ================================
function setChip(element, text, className) {
  element.textContent = text;
  element.className = `status-chip ${className}`;
}

function setMessage(message) {
  statusMessage.textContent = message;
}

function clearCanvas() {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function showEmptyState(message) {
  emptyState.textContent = message;
  emptyState.style.display = "grid";
}

function hideEmptyState() {
  emptyState.style.display = "none";
}

// ================================
// Inicialización de MediaPipe
// ================================
// async function createFaceLandmarker() {
//   if (faceLandmarker) return faceLandmarker;

//   setMessage("Cargando modelo de detección facial...");

//   const vision = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//   );

//   faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
//     baseOptions: {
//       modelAssetPath: MODEL_ASSET_URL,
//       delegate: "GPU"
//     },
//     runningMode: "VIDEO",
//     numFaces: 1,
//     minFaceDetectionConfidence: 0.5,
//     minFacePresenceConfidence: 0.5,
//     minTrackingConfidence: 0.5,
//     outputFaceBlendshapes: false,
//     outputFacialTransformationMatrixes: false
//   });

//   return faceLandmarker;
// }
async function createFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks("./mediapipe/wasm");

  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_URL,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false
  });

  return faceLandmarker;
}


// ================================
// Sincroniza el canvas con el video
// ================================
function syncCanvasSize() {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) return;

  // Tamaño interno del canvas para dibujar con buena precisión.
  overlay.width = videoWidth;
  overlay.height = videoHeight;
}

// ================================
// Dibujo de landmarks
// ================================
function drawLandmarks(landmarksList) {
  clearCanvas();

  if (!landmarksList || landmarksList.length === 0) {
    setChip(faceStatus, "Sin rostro", "status-danger");
    return;
  }

  setChip(faceStatus, "Rostro detectado", "status-success");

  // Estilo simple: puntos faciales pequeños.
  // Para esta prueba es suficiente y muy claro visualmente.
  for (const faceLandmarks of landmarksList) {
    for (const landmark of faceLandmarks) {
      const x = landmark.x * overlay.width;
      const y = landmark.y * overlay.height;

      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = "#39d98a";
      ctx.fill();
    }
  }
}

// ================================
// Loop de detección en tiempo real
// ================================
// async function detectLoop() {
//   if (!cameraRunning || !faceLandmarker) return;

//   syncCanvasSize();

//   if (video.readyState >= 2) {
//     // Procesar solo si el video avanzó de frame.
//     if (video.currentTime !== lastVideoTime) {
//       lastVideoTime = video.currentTime;

//       const startTimeMs = performance.now();
//       const result = faceLandmarker.detectForVideo(video, startTimeMs);

//       drawLandmarks(result.faceLandmarks);

//       if (result.faceLandmarks && result.faceLandmarks.length > 0) {
//         // Detección de rostro
//         setMessage("Rostro detectado correctamente en tiempo real.");
//       } else {
//         }setMessage("Cámara activa, pero aún no se detecta un rostro.");
//       }
//     }
//   }

//   animationFrameId = requestAnimationFrame(detectLoop);
// }

async function detectLoop() {
  if (!cameraRunning || !faceLandmarker) return;

  const now = performance.now();

  syncCanvasSize();

  // =========================
  // FPS GLOBAL (render loop)
  // =========================
  frameCount++;

  if (now - lastFpsTime >= 1000) {
    currentFPS = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }

  // =========================
  // DETECCIÓN (solo si frame cambia)
  // =========================
  if (video.readyState >= 2) {
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;

      const startTimeMs = performance.now();

      const result = faceLandmarker.detectForVideo(video, startTimeMs);

      // contar detección
      detectionCount++;

      drawLandmarks(result.faceLandmarks);

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        setMessage("Rostro detectado correctamente en tiempo real.");
      } else {
        setMessage("Cámara activa, pero aún no se detecta un rostro.");
      }
    }
  }

  // =========================
  // FPS DE DETECCIÓN
  // =========================
  if (now - lastDetectionTime >= 1000) {
    currentDetectionFPS = detectionCount;
    detectionCount = 0;
    lastDetectionTime = now;
  }

  // =========================
  // Mostrar en UI
  // =========================
  fpsText.textContent = `FPS: ${currentFPS} | Detección: ${currentDetectionFPS}`;

  animationFrameId = requestAnimationFrame(detectLoop);
}

// ================================
// Iniciar cámara
// ================================
async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Este navegador no soporta getUserMedia o no está en un contexto seguro."
      );
    }
// holi :b
    startBtn.disabled = true;
    setChip(cameraStatus, "Iniciando...", "status-waiting");
    setChip(faceStatus, "Buscando...", "status-waiting");
    setMessage("Solicitando permiso de cámara...");

    faceLandmarker = await createFaceLandmarker();

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    video.srcObject = stream;

    // Esperar a que el video tenga metadatos y empiece a reproducirse.
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    await video.play();

    syncCanvasSize();

    cameraRunning = true;
    hideEmptyState();

    setChip(cameraStatus, "Activa", "status-success");
    setChip(faceStatus, "Buscando...", "status-waiting");
    setMessage("Cámara activa. Coloca tu rostro frente a la cámara.");
    stopBtn.disabled = false;

    lastVideoTime = -1;
    detectLoop();
  } catch (error) {
    console.error("Error al iniciar cámara:", error);

    cameraRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;

    setChip(cameraStatus, "Error", "status-danger");
    setChip(faceStatus, "Sin iniciar", "status-idle");

    const message =
      error && error.message
        ? error.message
        : "No se pudo iniciar la cámara.";

    setMessage(`Error: ${message}`);
    showEmptyState("No se pudo iniciar la cámara.");
  }
}

// ================================
// Detener cámara
// ================================
function stopCamera() {
  cameraRunning = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.pause();
  video.srcObject = null;
  lastVideoTime = -1;

  clearCanvas();

  setChip(cameraStatus, "Inactiva", "status-idle");
  setChip(faceStatus, "Sin iniciar", "status-waiting");
  setMessage("La cámara fue detenida.");
  showEmptyState("La cámara está detenida.");

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// ================================
// Eventos
// ================================
startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);

window.addEventListener("resize", syncCanvasSize);
window.addEventListener("beforeunload", stopCamera);