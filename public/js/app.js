document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const dlSpeedElement = document.getElementById('dlSpeed');
    const ulSpeedElement = document.getElementById('ulSpeed');
    const pingTextElement = document.getElementById('pingText');
    const jitterTextElement = document.getElementById('jitterText');
    const avgSpeedElement = document.getElementById('avgSpeed');
    const speedNeedle = document.getElementById('speedNeedle');
    const gauge = document.querySelector('.gauge');
    const detailedStatus = document.getElementById('detailedStatus');
    
    // Configurar partículas de fondo
    createParticles();
    
    startBtn.addEventListener('click', startSpeedTest);
    
    async function startSpeedTest() {
        try {
            // Cambiar estado
            startBtn.disabled = true;
            detailedStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando velocidad de descarga...';
            
            // 1. Prueba de descarga
            const downloadStart = performance.now();
            const response = await fetch('/speedtest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: new ArrayBuffer(10 * 1024 * 1024) // Envía 10MB para la prueba
            });
            
            const data = await response.json();
            const downloadEnd = performance.now();
            
            // Actualizar UI con los resultados
            updateResults(data);
            
            // Mostrar notificación
            showNotification('success', 'Prueba completada con éxito');
            
        } catch (error) {
            console.error('Error en la prueba:', error);
            detailedStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error en la prueba de velocidad';
            showNotification('error', 'Error en la prueba de velocidad');
        } finally {
            startBtn.disabled = false;
        }
    }
    
    function updateResults(data) {
        // Actualizar valores
        dlSpeedElement.textContent = data.download;
        ulSpeedElement.textContent = data.upload;
        pingTextElement.textContent = data.ping;
        jitterTextElement.textContent = data.jitter;
        
        // Calcular velocidad promedio (entre descarga y subida)
        const avgSpeed = ((parseFloat(data.download) + parseFloat(data.upload)) / 2).toFixed(2);
        avgSpeedElement.textContent = avgSpeed;
        
        // Actualizar velocímetro
        updateSpeedometer(avgSpeed);
        
        // Actualizar estado
        detailedStatus.innerHTML = `
            <i class="fas fa-check-circle"></i> Prueba completada - 
            Descarga: ${data.download} Mbps | 
            Subida: ${data.upload} Mbps | 
            Ping: ${data.ping} ms
        `;
    }
    
    function updateSpeedometer(speed) {
        // Convertir velocidad a porcentaje (0-100)
        const speedValue = Math.min(parseFloat(speed), 100);
        const percentage = (speedValue / 100) * 270; // 270 grados del velocímetro
        
        // Actualizar aguja
        const rotation = -135 + percentage; // -135° a +135°
        speedNeedle.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
        
        // Actualizar máscara del medidor
        gauge.style.setProperty('--progress', speedValue);
    }
    
    function showNotification(type, message) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }
    
    function createParticles() {
        const container = document.getElementById('particles-container');
        const particleCount = Math.floor(window.innerWidth / 10);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Tamaño y posición aleatorios
            const size = Math.random() * 3 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            // Estilos de partícula
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            particle.style.background = `rgba(19, 204, 217, ${Math.random() * 0.5 + 0.1})`;
            particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 20}px`);
            particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 20}px`);
            particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            container.appendChild(particle);
        }
    }
});