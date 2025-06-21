<?php
header('Content-Type: application/json');

// Medir el tiempo de inicio
$start = microtime(true);

// Leer los datos de entrada
$data = file_get_contents('php://input');
$bytes = strlen($data);

// Calcular velocidad
$duration = microtime(true) - $start;
$speed = ($bytes * 8) / ($duration * 1024 * 1024); // Mbps

echo json_encode([
    'speed_mbps' => round($speed, 2),
    'bytes_received' => $bytes,
    'duration_sec' => round($duration, 4)
]);
?>