/**
 * Модуль DrawHelper для отрисовки графических элементов (Гизмосов)
 */

// Рисует шахматную сетку под текстурой
export function drawCheckeredBackground(ctx, w, h) {
    const size = 12;
    ctx.fillStyle = '#222222'; 
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < w; i += size * 2) {
        for (let j = 0; j < h; j += size * 2) {
            ctx.fillRect(i, j, size, size);
            ctx.fillRect(i + size, j + size, size, size);
        }
    }
}

// Рисует полигон (заливку и контур)
export function drawPolygon0(ctx, points, scale, strokeColor, fillColor, lineWidth = 1) {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (points.length > 2 && fillColor) {
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth / scale;
    ctx.stroke();
}

 


// НАЙДИТЕ И ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В js/viewport/draw-helper.js
export function drawPolygon(ctx, points, scale, strokeColor, fillColor, lineWidth = 1) {
 //   console.log("drawPolygon called with points:", points);
    if (!points || points.length === 0){
        console.warn("drawPolygon: points array is empty or undefined.");
return;
    }  

    ctx.beginPath();
    // ИСПРАВЛЕНО: Добавляем, чтобы взять координаты самой первой точки из массива
    ctx.moveTo(points[0].x, points[0].y); 
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (points.length > 2 && fillColor) {
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth / scale;
    ctx.stroke();
}




// Рисует вершины полигона (точки)
export function drawVertices(ctx, points, scale, activeIndexColor = '#ff5722', defaultColor = '#007acc') {
    const radius = 5 / scale;
    points.forEach((pt, index) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? activeIndexColor : defaultColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
    });
}

// Рисует красно-синее перекрестие Pivot Point
export function drawPivot(ctx, x, y, scale) {
    ctx.save();
    
    // Ось X (Красная)
    ctx.strokeStyle = '#ff3b30'; 
    ctx.lineWidth = 2 / scale;
    ctx.beginPath(); 
    ctx.moveTo(x - 15 / scale, y); 
    ctx.lineTo(x + 15 / scale, y); 
    ctx.stroke();

    // Ось Y (Синяя)
    ctx.strokeStyle = '#007aff'; 
    ctx.lineWidth = 2 / scale;
    ctx.beginPath(); 
    ctx.moveTo(x, y - 15 / scale); 
    ctx.lineTo(x, y + 15 / scale); 
    ctx.stroke();

    // Центральная точка
    ctx.beginPath(); 
    ctx.arc(x, y, 4 / scale, 0, Math.PI * 2); 
    ctx.fillStyle = '#ffffff'; 
    ctx.fill(); 
    ctx.stroke();

    ctx.restore();
}

// Рисует сустав (Joint) с текстовой подписью
export function drawJoint(ctx, x, y, name, scale) {
    const radius = 6 / scale;
    ctx.save();
    
    // Розовый кружок
    ctx.beginPath(); 
    ctx.arc(x, y, radius, 0, Math.PI * 2); 
    ctx.fillStyle = '#ff00ff'; 
    ctx.fill(); 
    ctx.strokeStyle = '#ffffff'; 
    ctx.lineWidth = 1.5 / scale; 
    ctx.stroke();

    // Текст-подпись
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 12 / scale)}px sans-serif`;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(name, x + radius + 4 / scale, y + 4 / scale);

    ctx.restore();
}

// Рисует текстовую метку объекта (например, ID спрайта)
export function drawLabel(ctx, x, y, text, scale, color = '#ffeb3b') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(10, 12 / scale)}px sans-serif`;
    ctx.fillText(text, x, y);
    ctx.restore();
}
// Добавить в самый конец js/viewport/draw-helper.js

// Рисует координатную разметку (Оси X и Y) по центру мира
export function drawGlobalAxes(ctx, width, height, scale) {
    ctx.save();
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]); // Пунктирная линия для осей

    // Горизонтальная ось X (серая)
    ctx.strokeStyle = '#555555';
    ctx.beginPath();
    ctx.moveTo(-10000, 0);
    ctx.lineTo(10000, 0);
    ctx.stroke();

    // Вертикальная ось Y (серая)
    ctx.beginPath();
    ctx.moveTo(0, -10000);
    ctx.lineTo(0, 10000);
    ctx.stroke();

    ctx.restore();
}

// Рисует графический маркер для точки ROOT (позиции на полу)
export function drawRootMarker(ctx, scale, isSelected) {
    ctx.save();
    
    // Рисуем стильный ромб или прицел основания
    ctx.strokeStyle = isSelected ? '#4caf50' : '#888888';
    ctx.lineWidth = 2 / scale;
    
    // Маленький внутренний кружок
    ctx.beginPath();
    ctx.arc(0, 0, 6 / scale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Внешние засечки
    ctx.beginPath();
    ctx.moveTo(-12 / scale, 0); ctx.lineTo(12 / scale, 0);
    ctx.moveTo(0, -12 / scale); ctx.lineTo(0, 12 / scale);
    ctx.stroke();

    // Белая центральная точка
    ctx.beginPath();
    ctx.arc(0, 0, 2 / scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
}
