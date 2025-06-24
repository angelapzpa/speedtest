// Variables de estado
let testInProgress = false;
let downloadStartTime, uploadStartTime;
let downloadBytes = 0, uploadBytes = 0;
const testDuration = 5000; // 5 segundos de prueba
const testDataSize = 10 * 1024 * 1024; // 10MB de datos de prueba

// Función para mostrar notificaciones
function showNotification(type, message, duration = 3000) {
  const container = document.getElementById('notificationContainer');
  const icons = {
    success: 'fa-check-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle'
  };
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => container.removeChild(notification), 300);
  }, duration);
}

// Función para crear partículas
function createParticles() {
  const container = document.getElementById('particles-container');
  container.innerHTML = '';
  const particleCount = Math.min(Math.floor(window.innerWidth / 15), 60);
  const colors = ['#13ccd9', '#00ff88', '#0062ff', '#ffcc00', '#ff00aa'];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.width = `${Math.random() * 3 + 1}px`;
    particle.style.height = `${Math.random() * 3 + 1}px`;
    particle.style.opacity = `${Math.random() * 0.6 + 0.2}`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 150}px`);
    particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 150}px`);
    particle.style.animationDelay = `${Math.random() * 5}s`;
    particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
    container.appendChild(particle);
  }
}

// Función para animar valores
function animateValue(id, target) {
  const element = document.getElementById(id);
  const current = parseFloat(element.textContent) || 0;
  const duration = 700;
  const start = Date.now();
  
  const update = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = current + (target - current) * progress;
    element.textContent = value.toFixed(1);
    if (progress < 1) requestAnimationFrame(update);
  };
  update();
}

// Función para actualizar resultados
function updateResults(dl, ul, ping, jitter) {
  const avg = (dl + ul) / 2;
  animateValue("dlSpeed", dl);
  animateValue("ulSpeed", ul);
  animateValue("pingText", ping);
  animateValue("jitterText", jitter);
  animateValue("avgSpeed", avg);

  const progress = Math.min(avg, 500) / 500 * 100;
  document.querySelector(".gauge-mask").style.setProperty("--progress", progress);
  const degrees = (Math.min(avg, 500) * 0.54) - 90;
  document.getElementById("speedNeedle").style.transform = `translate(-50%, -100%) rotate(${degrees}deg)`;
  
  localStorage.setItem('lastSpeedTest', JSON.stringify({
    dlStatus: dl.toFixed(1),
    ulStatus: ul.toFixed(1),
    ping: ping.toFixed(1),
    jitter: jitter.toFixed(1),
    timestamp: new Date().toISOString()
  }));
}

// Medir ping y jitter
async function measurePing() {
  document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-bullseye"></i> Probando latencia...';
  const times = [];
  
  try {
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await fetch('/ping?' + Date.now(), {cache: 'no-store'});
      times.push(performance.now() - start);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const ping = times.reduce((a, b) => a + b, 0) / times.length;
    let jitter = 0;
    for (let i = 1; i < times.length; i++) {
      jitter += Math.abs(times[i] - times[i - 1]);
    }
    jitter /= (times.length - 1);
    
    return { ping, jitter };
  } catch (error) {
    console.error("Error measuring ping:", error);
    return { ping: 0, jitter: 0 };
  }
}

// Prueba de descarga
async function testDownload() {
  document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-tachometer-alt"></i> Probando descarga...';
  downloadStartTime = performance.now();
  downloadBytes = 0;
  
  try {
    const response = await fetch('/download?' + Date.now(), {cache: 'no-store'});
    const reader = response.body.getReader();
    
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      downloadBytes += value.length;
      
      const currentTime = performance.now();
      const speedMbps = (downloadBytes * 8) / ((currentTime - downloadStartTime) * 1024 * 1024 / 1000);
      document.getElementById('dlSpeed').textContent = speedMbps.toFixed(1);
      
      if (currentTime - downloadStartTime > testDuration) break;
    }
    
    const speedMbps = (downloadBytes * 8) / (testDuration * 1024 * 1024 / 1000);
    return speedMbps;
  } catch (error) {
    console.error("Download test error:", error);
    throw error;
  }
}

// Prueba de subida
async function testUpload() {
  document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-upload"></i> Probando subida...';
  uploadStartTime = performance.now();
  uploadBytes = 0;
  
  try {
    const chunkSize = 512 * 1024; // 512KB chunks
    const chunks = Math.ceil(testDataSize / chunkSize);
    let uploaded = 0;
    
    const response = await fetch('/upload', {
      method: 'POST',
      headers: {'Content-Type': 'application/octet-stream'},
      body: new ReadableStream({
        async start(controller) {
          while (uploaded < testDataSize && performance.now() - uploadStartTime < testDuration) {
            const chunk = new Uint8Array(Math.min(chunkSize, testDataSize - uploaded));
            crypto.getRandomValues(chunk);
            controller.enqueue(chunk);
            uploaded += chunk.length;
            uploadBytes += chunk.length;
            
            const speedMbps = (uploadBytes * 8) / ((performance.now() - uploadStartTime) * 1024 * 1024 / 1000);
            document.getElementById('ulSpeed').textContent = speedMbps.toFixed(1);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          controller.close();
        }
      })
    });
    
    const speedMbps = (uploadBytes * 8) / (testDuration * 1024 * 1024 / 1000);
    return speedMbps;
  } catch (error) {
    console.error("Upload test error:", error);
    throw error;
  }
}

// Función principal para iniciar la prueba
async function startTest() {
  if (testInProgress) return;
  testInProgress = true;
  const startBtn = document.getElementById('startBtn');
  
  startBtn.disabled = true;
  startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROBANDO...';
  
  // Resetear valores
  document.getElementById("dlSpeed").textContent = "0";
  document.getElementById("ulSpeed").textContent = "0";
  document.getElementById("pingText").textContent = "0";
  document.getElementById("jitterText").textContent = "0";
  document.getElementById("avgSpeed").textContent = "0";
  document.querySelector(".gauge-mask").style.setProperty("--progress", "0");
  document.getElementById("speedNeedle").style.transform = "translate(-50%, -100%) rotate(-90deg)";
  
  try {
    const { ping, jitter } = await measurePing();
    document.getElementById('pingText').textContent = ping.toFixed(1);
    document.getElementById('jitterText').textContent = jitter.toFixed(1);
    
    const downloadSpeed = await testDownload();
    const uploadSpeed = await testUpload();
    
    updateResults(downloadSpeed, uploadSpeed, ping, jitter);
    showNotification('success', 'Prueba completada', 3000);
    document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-check-circle"></i> Prueba completada';
  } catch (error) {
    console.error("Test error:", error);
    document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error en la prueba';
    showNotification('error', 'Error en la prueba de velocidad', 4000);
  } finally {
    testInProgress = false;
    startBtn.disabled = false;
    startBtn.innerHTML = '<i class="fas fa-sync-alt"></i> REPETIR PRUEBA';
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  createParticles();
  window.addEventListener('resize', createParticles);
  document.getElementById('startBtn').addEventListener('click', startTest);
  
  // Cargar resultados anteriores
  const lastTest = localStorage.getItem('lastSpeedTest');
  if (lastTest) {
    try {
      const testData = JSON.parse(lastTest);
      document.getElementById("dlSpeed").textContent = testData.dlStatus;
      document.getElementById("ulSpeed").textContent = testData.ulStatus;
      document.getElementById("pingText").textContent = testData.ping;
      document.getElementById("jitterText").textContent = testData.jitter;
      
      const avg = (parseFloat(testData.dlStatus) + parseFloat(testData.ulStatus)) / 2;
      document.getElementById("avgSpeed").textContent = avg.toFixed(1);
      const progress = Math.min(avg, 500) / 500 * 100;
      document.querySelector(".gauge-mask").style.setProperty("--progress", progress);
      const degrees = (Math.min(avg, 500) * 0.54) - 90;
      document.getElementById("speedNeedle").style.transform = `translate(-50%, -100%) rotate(${degrees}deg)`;
      
      document.getElementById('detailedStatus').innerHTML = '<i class="fas fa-history"></i> Últimos resultados cargados';
    } catch (e) {
      console.log("No se pudieron cargar resultados previos");
    }
  }
});