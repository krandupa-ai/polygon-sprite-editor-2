 
import { resetCamera } from './camera.js';
import { state, getSelectedTemplate } from '../state.js';

const workspace = document.getElementById('workspace');
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const zoomOverlay = document.getElementById('zoomOverlay');
const fileInput = document.getElementById('fileInput');
const imgInfo = document.getElementById('imgInfo');

let renderRequested = false;

export function initRenderer() {
    // 1. Следим за размерами окна браузера
    function resizeCanvas() {
        canvas.width = workspace.clientWidth;
        canvas.height = workspace.clientHeight;
        requestRender();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Первичный расчет размеров

    // 2. Обработка загрузки файла изображения
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            state.img = new Image();
            state.img.onload = () => {
                state.imgName = `${file.name} (${state.img.width}x${state.img.height}px)`;
                imgInfo.textContent = state.imgName;
                
                // Автоматически вписываем загруженный атлас по центру экрана
                resetCamera(state.img.width, state.img.height, canvas.width, canvas.height);
            };
            state.img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Запускаем первый пустой кадр
    requestRender();
}

/**
 * Оптимизированный вызов отрисовки кадра.
 * Предотвращает дублирование вызовов рендера внутри одного кадра процессора (FPS Drop).
 */
export function requestRender() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(renderScene);
    }
}

// Главная функция рендеринга геометрии и текстур
function renderScene() {
    renderRequested = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zoomOverlay.textContent = `Зум: ${Math.round(state.camera.scale * 100)}%`;

    ctx.save();
    ctx.translate(state.camera.panX, state.camera.panY);
    ctx.scale(state.camera.scale, state.camera.scale);

    if (state.img) {
        // 1. Отрисовка текстуры атласа
        drawCheckeredBackground(0, 0, state.img.width, state.img.height);
        ctx.drawImage(state.img, 0, 0);
        
        ctx.strokeStyle = '#309fe9';
        ctx.lineWidth = 1 / state.camera.scale;
        ctx.strokeRect(0, 0, state.img.width, state.img.height);

        // =======================================================
        // ОТРИСОВКА РЕЖИМА 1: КОНТУР ТЕКУЩЕГО ШАБЛОНА
        // (Показываем его только когда мы находимся в режиме конструирования шаблонов)
        // =======================================================
        const activeTemplate = getSelectedTemplate();
        if (state.currentMode === 'templates' && activeTemplate && activeTemplate.points.length > 0) {
            const pts = activeTemplate.points;

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            if (pts.length > 2) {
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
                ctx.fill();
            }
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2 / state.camera.scale;
            ctx.stroke();

            // Рисуем вершины шаблона
            pts.forEach((pt, index) => {
                ctx.beginPath();
                const radius = 5 / state.camera.scale;
                ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = index === 0 ? '#ff5722' : '#007acc';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1 / state.camera.scale;
                ctx.stroke();
            });

            // Рисуем Pivot шаблона
            const originX = pts[0].x;
            const originY = pts[0].y;
            const pivotX = originX + (activeTemplate.pivot?.x || 0);
            const pivotY = originY + (activeTemplate.pivot?.y || 0);

            ctx.save();
            ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 2 / state.camera.scale;
            ctx.beginPath(); ctx.moveTo(pivotX - 15 / state.camera.scale, pivotY); ctx.lineTo(pivotX + 15 / state.camera.scale, pivotY); ctx.stroke();
            ctx.strokeStyle = '#007aff'; ctx.lineWidth = 2 / state.camera.scale;
            ctx.beginPath(); ctx.moveTo(pivotX, pivotY - 15 / state.camera.scale); ctx.lineTo(pivotX, pivotY + 15 / state.camera.scale); ctx.stroke();
            ctx.beginPath(); ctx.arc(pivotX, pivotY, 4 / state.camera.scale, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
            ctx.restore();

            // Рисуем Джоинты шаблона
            if (activeTemplate.joints) {
                activeTemplate.joints.forEach(joint => {
                    const jointX = originX + joint.x;
                    const jointY = originY + joint.y;
                    const jRadius = 6 / state.camera.scale;

                    ctx.save();
                    ctx.beginPath(); ctx.arc(jointX, jointY, jRadius, 0, Math.PI * 2); ctx.fillStyle = '#ff00ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 / state.camera.scale; ctx.stroke();
                    ctx.fillStyle = '#ffffff'; ctx.font = `${Math.max(10, 12 / state.camera.scale)}px sans-serif`;
                    ctx.fillText(joint.name, jointX + jRadius + 4 / state.camera.scale, jointY + 4 / state.camera.scale);
                    ctx.restore();
                });
            }
        }

        // =======================================================
        // НОВАЯ ЛОГИКА - ОТРИСОВКА РЕЖИМА 2: РАЗМЕЩЕННЫЕ СПРАЙТЫ (ШТАМПЫ)
        // (Показываем их всегда, когда мы находимся в режиме нарезки спрайтов)
        // =======================================================
        if (state.currentMode === 'sprites' && state.project.sprites.length > 0) {
            state.project.sprites.forEach(sprite => {
                // Ищем шаблон, по которому был сделан этот штамп
                const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
                if (!tpl || tpl.points.length === 0) return;

                const isSelected = sprite.id === state.selectedSpriteId;
                
                // Рассчитываем вектор смещения для этого спрайта.
                // Точка клика штампа (sprite.x, sprite.y) сопоставляется с первой точкой шаблона (tpl.points[0])
                const offsetX = sprite.x - tpl.points[0].x;
                const offsetY = sprite.y - tpl.points[0].y;

                ctx.save();

                // 1. Рисуем контур штампа
                ctx.beginPath();
                ctx.moveTo(tpl.points[0].x + offsetX, tpl.points[0].y + offsetY);
                for (let i = 1; i < tpl.points.length; i++) {
                    ctx.lineTo(tpl.points[i].x + offsetX, tpl.points[i].y + offsetY);
                }
                ctx.closePath();

                // Если спрайт выбран — подсвечиваем его ярким желто-золотым цветом, иначе — нейтральным серым
                ctx.fillStyle = isSelected ? 'rgba(255, 235, 59, 0.32)' : 'rgba(253, 253, 253, 0.22)';
                ctx.fill();
                
                ctx.strokeStyle = isSelected ? '#ffeb3b' : 'rgba(255, 255, 255, 0.64)';
                ctx.lineWidth = (isSelected ? 2 : 2) / state.camera.scale;
                ctx.stroke();

                // 2. Рисуем Pivot и Джоинты этого штампа (только для выбранного спрайта, чтобы не перегружать экран)
                if (isSelected) {
                    // Отрисовка смещенного Pivot
                    const pivotX = sprite.x + (tpl.pivot?.x || 0);
                    const pivotY = sprite.y + (tpl.pivot?.y || 0);
                    
                    ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 1.5 / state.camera.scale;
                    ctx.beginPath(); ctx.moveTo(pivotX - 10 / state.camera.scale, pivotY); ctx.lineTo(pivotX + 10 / state.camera.scale, pivotY); ctx.stroke();
                    ctx.strokeStyle = '#007aff'; ctx.lineWidth = 1.5 / state.camera.scale;
                    ctx.beginPath(); ctx.moveTo(pivotX, pivotY - 10 / state.camera.scale); ctx.lineTo(pivotX, pivotY + 10 / state.camera.scale); ctx.stroke();

                    // Отрисовка смещенных Джоинтов
                    if (tpl.joints) {
                        tpl.joints.forEach(joint => {
                            const jointX = sprite.x + joint.x;
                            const jointY = sprite.y + joint.y;
                            const jRadius = 4 / state.camera.scale;

                            ctx.beginPath(); ctx.arc(jointX, jointY, jRadius, 0, Math.PI * 2); ctx.fillStyle = '#ff00ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1 / state.camera.scale; ctx.stroke();
                            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = `${Math.max(9, 10 / state.camera.scale)}px sans-serif`;
                            ctx.fillText(joint.name, jointX + jRadius + 3 / state.camera.scale, jointY + 3 / state.camera.scale);
                        });
                    }
                    
                    // Подписываем имя самого спрайта над его геометрическим центром
                    ctx.fillStyle = '#ffeb3b';
                    ctx.font = `bold ${Math.max(10, 12 / state.camera.scale)}px sans-serif`;
                    ctx.fillText(`🆔 ${sprite.name}`, sprite.x - 20 / state.camera.scale, sprite.y - 15 / state.camera.scale);
                }

                ctx.restore();
            });
        }
        // =======================================================

    } else {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2 / state.camera.scale;
        ctx.beginPath(); 
        ctx.moveTo(-40, 0); ctx.lineTo(40, 0); 
        ctx.moveTo(0, -40); ctx.lineTo(0, 40); 
        ctx.stroke();
    }

    ctx.restore();
}



// Генерация шахматного бэкграунда для альфа-канала текстуры
function drawCheckeredBackground(x, y, w, h) {
    const size = 12; // Размер ячейки сетки в пикселях
    ctx.fillStyle = '#222222'; 
    ctx.fillRect(x, y, w, h);
    
    ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < w; i += size * 2) {
        for (let j = 0; j < h; j += size * 2) {
            ctx.fillRect(i, j, size, size);
            ctx.fillRect(i + size, j + size, size, size);
        }
    }
}
