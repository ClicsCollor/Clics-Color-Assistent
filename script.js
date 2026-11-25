/*
// Fundamentals Pipeline — starter script
// Delete whichever branch (Teachable Machine / Roboflow) you are not using.

const startBtn = document.getElementById("start-btn");
const labelContainer = document.getElementById("label-container");
const webcam = document.getElementById("webcam");

// ---------- OPTION A: Teachable Machine ----------
// Export via "Export Model > Download my model" (TensorFlow.js tab),
// unzip, and commit model.json + weights.bin + metadata.json into a
// /model folder in this repo (see the worksheet for exact steps).
// Keeping your own copy means your interface doesn't depend on Google's
// hosting staying up.
const MODEL_URL = "./model/";
// Alternative: point at your Teachable Machine hosted shareable link
// instead of local files, e.g.:
// const MODEL_URL = "https://teachablemachine.withgoogle.com/models/XXXXXXXXX/";

async function initTeachableMachine() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";

  const model = await tmImage.load(modelURL, metadataURL);
  const maxPredictions = model.getTotalClasses();

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcam.srcObject = stream;
  await webcam.play();

  window.requestAnimationFrame(loop);

  async function loop() {
    const prediction = await model.predict(webcam);
    labelContainer.innerHTML = prediction
      .map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`)
      .join("<br>");
    window.requestAnimationFrame(loop);
  }
}

// ---------- OPTION B: Roboflow ----------
// NEVER hardcode your API key here. Prompt for it client-side, or read it
// from a config.js file that is listed in .gitignore.
const ROBOFLOW_MODEL_ENDPOINT = "https://detect.roboflow.com/YOUR_PROJECT/YOUR_VERSION";

async function initRoboflow() {
  const apiKey = prompt("Enter your Roboflow API key (not stored, session only):");

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcam.srcObject = stream;
  await webcam.play();

  setInterval(async () => {
    const canvas = document.getElementById("output-canvas");
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    canvas.getContext("2d").drawImage(webcam, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg").split(",")[1];

    const res = await fetch(`${ROBOFLOW_MODEL_ENDPOINT}?api_key=${apiKey}`, {
      method: "POST",
      body: base64,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const result = await res.json();
    labelContainer.innerText = JSON.stringify(result.predictions, null, 2);
  }, 1000);
}

startBtn.addEventListener("click", () => {
  // Call whichever function matches your pipeline:
  initTeachableMachine();
  // initRoboflow();
});
*/


// ======================================
// CLICS COLOR ASSISTANT
// Continuous scanning + manual confirmation
// Camera start/stop with the same button
// ======================================


// ======================================
// HTML ELEMENTS
// ======================================

const startBtn = document.getElementById("start-btn");
const identifyBtn = document.getElementById("identify-btn");

const labelContainer = document.getElementById("label-container");
const webcam = document.getElementById("webcam");
const scanStatus = document.getElementById("scan-status");


// ======================================
// TEACHABLE MACHINE MODEL
// ======================================

const MODEL_URL = "./model/";

let model = null;
let isRunning = false;
let isLoading = false;
let latestPrediction = null;
let animationFrameId = null;


// ======================================
// COLOR INFORMATION
// ======================================

const colorInfo = {

  blue: {
    name: "BLUE",
    symbol: "◆",
    message: "You found a blue block!",
    cssClass: "result-blue"
  },

  green: {
    name: "GREEN",
    symbol: "●",
    message: "You found a green block!",
    cssClass: "result-green"
  },

  yellow: {
    name: "YELLOW",
    symbol: "▲",
    message: "You found a yellow block!",
    cssClass: "result-yellow"
  },

  red: {
    name: "RED",
    symbol: "■",
    message: "You found a red block!",
    cssClass: "result-red"
  }

};


// ======================================
// UPDATE CAMERA BUTTON
// ======================================

function updateCameraButton(active) {

  if (active) {

    startBtn.innerHTML =
      '<span class="button-icon">■</span> Stop camera';

  } else {

    startBtn.innerHTML =
      '<span class="button-icon">▶</span> Start camera';

  }

}


// ======================================
// GET THE MOST LIKELY COLOR
// ======================================

function getBestPrediction(predictions) {

  return predictions.reduce((best, current) =>
    current.probability > best.probability
      ? current
      : best
  );

}


// ======================================
// DISPLAY THE FINAL RESULT
// ======================================

function displayPrediction(prediction) {

  const className = prediction.className.toLowerCase();

  const detectedColor = Object.keys(colorInfo).find(color =>
    className.includes(color)
  );

  const info = detectedColor
    ? colorInfo[detectedColor]
    : {
        name: prediction.className.toUpperCase(),
        symbol: "●",
        message: "Your block has been detected!",
        cssClass: "result-default"
      };

  const confidence =
    (prediction.probability * 100).toFixed(1);

  const resultCard = document.createElement("div");

  resultCard.className =
    `prediction-card ${info.cssClass}`;

  const symbol = document.createElement("span");
  symbol.className = "prediction-symbol";
  symbol.textContent = info.symbol;

  const colorName = document.createElement("h2");
  colorName.className = "prediction-name";
  colorName.textContent = info.name;

  const message = document.createElement("p");
  message.className = "prediction-message";
  message.textContent = info.message;

  const confidenceText = document.createElement("p");
  confidenceText.className = "prediction-confidence";
  confidenceText.textContent =
    `${confidence}% confidence`;

  resultCard.appendChild(symbol);
  resultCard.appendChild(colorName);
  resultCard.appendChild(message);
  resultCard.appendChild(confidenceText);

  labelContainer.replaceChildren(resultCard);

}


// ======================================
// START CAMERA AND MODEL
// ======================================

async function initTeachableMachine() {

  if (isRunning || isLoading) return;

  isLoading = true;

  startBtn.disabled = true;
  identifyBtn.disabled = true;

  startBtn.textContent = "Loading camera...";

  scanStatus.textContent =
    "Loading the camera and color assistant...";

  try {

    // Load the AI model only once
    if (!model) {

      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      model = await tmImage.load(modelURL, metadataURL);

    }

    // Ask permission to use the camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    // Connect the camera to the video element
    webcam.srcObject = stream;

    await webcam.play();

    // Activate camera
    isRunning = true;
    latestPrediction = null;

    // Update buttons
    updateCameraButton(true);

    startBtn.disabled = false;
    identifyBtn.disabled = false;

    // Update status
    scanStatus.textContent =
      "Camera is ready! Place one block on the scanner.";

    // Reset result area
    labelContainer.innerHTML =
      '<p class="result-placeholder">Your color result will appear here when you identify your block.</p>';

    // Start continuous scanning
    animationFrameId = requestAnimationFrame(loop);

  } catch (error) {

    console.error("Scanner error:", error);

    // Stop any camera stream that may have started
    if (webcam.srcObject) {

      webcam.srcObject.getTracks().forEach(track => track.stop());

      webcam.srcObject = null;

    }

    isRunning = false;
    latestPrediction = null;

    updateCameraButton(false);

    identifyBtn.disabled = true;

    scanStatus.textContent =
      "Could not start the camera. Please check your camera permissions and model.";

  } finally {

    isLoading = false;
    startBtn.disabled = false;

  }

}


// ======================================
// STOP CAMERA
// ======================================

function stopCamera() {

  // Stop the scanning process
  isRunning = false;

  latestPrediction = null;

  // Cancel the next animation frame
  if (animationFrameId !== null) {

    cancelAnimationFrame(animationFrameId);

    animationFrameId = null;

  }

  // Stop the actual camera stream
  if (webcam.srcObject) {

    webcam.srcObject.getTracks().forEach(track => {
      track.stop();
    });

    webcam.srcObject = null;

  }

  // Stop the video element
  webcam.pause();

  // Reset buttons
  updateCameraButton(false);

  startBtn.disabled = false;
  identifyBtn.disabled = true;

  // Update status
  scanStatus.textContent =
    "Camera stopped. Press Start camera to begin again.";

  // Clear the previous result
  labelContainer.innerHTML =
    '<p class="result-placeholder">Your color is waiting to be discovered!</p>';

}


// ======================================
// CONTINUOUS SCANNING
// ======================================

async function loop() {

  if (!isRunning) return;

  try {

    // Analyse the current camera image
    const predictions = await model.predict(webcam);

    // Check whether the camera was stopped during prediction
    if (!isRunning) return;

    // Save the most recent prediction
    latestPrediction = getBestPrediction(predictions);

    // Update the scanning status
    scanStatus.textContent =
      "Block detected? Press Identify my block to confirm the color.";

  } catch (error) {

    console.error("Scanning error:", error);

    // Stop the camera if scanning fails
    stopCamera();

    scanStatus.textContent =
      "Scanning stopped. Please try again.";

    return;

  }

  // Continue scanning while the camera is active
  if (isRunning) {

    animationFrameId = requestAnimationFrame(loop);

  }

}


// ======================================
// IDENTIFY THE BLOCK
// ======================================

identifyBtn.addEventListener("click", () => {

  if (!latestPrediction || !isRunning) return;

  // Display the latest AI prediction
  displayPrediction(latestPrediction);

  scanStatus.textContent =
    "Color identified! Place another block and scan again.";

});


// ======================================
// CAMERA BUTTON
// Start and stop with the same button
// ======================================

startBtn.addEventListener("click", () => {

  if (isLoading) return;

  if (isRunning) {

    // Camera is active: stop it
    stopCamera();

  } else {

    // Camera is inactive: start it
    initTeachableMachine();

  }

});

