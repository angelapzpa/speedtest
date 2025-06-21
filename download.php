<?php
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="speedtest.dat"');

// Tamaño del archivo de prueba (10MB)
$size = 10 * 1024 * 1024;
$chunk = 1 * 1024 * 1024; // 1MB por chunk

// Generar datos aleatorios
for ($i = 0; $i < $size; $i += $chunk) {
    echo random_bytes(min($chunk, $size - $i));
    ob_flush();
    flush();
}
?>