import { state, getSelectedTemplate } from '../state.js';
import { resetCamera } from './camera.js';
// Импортируем все наши чистые функции отрисовки гизмосов
import * as draw from './draw-helper.js';

const workspace = document.getElementById('workspace');
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const zoomOverlay = document.getElementById('zoomOverlay');
const fileInput = document.getElementById('fileInput');
const imgInfo = document.getElementById('imgInfo');

let renderRequested = false;

export function initRenderer() {
    function resizeCanvas() {
        canvas.width = workspace.clientWidth;
        canvas.height = workspace.clientHeight;
        requestRender();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; // Наш исправленный ранее фикс индекса
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            state.img = new Image();
            state.img.onload = () => {
                state.imgName = `${file.name} (${state.img.width}x${state.img.height}px)`;
                imgInfo.textContent = state.imgName;
                resetCamera(state.img.width, state.img.height, canvas.width, canvas.height);
            };
            state.img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    requestRender();
}

export function requestRender() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(renderScene);
    }
}

// ГЛАВНЫЙ КОМПАКТНЫЙ МЕТОД РЕНДЕРА
function renderScene01() {
    renderRequested = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zoomOverlay.textContent = `Зум: ${Math.round(state.camera.scale * 100)}%`;

    ctx.save();
    // Применяем глобальную матрицу камеры
    ctx.translate(state.camera.panX, state.camera.panY);
    ctx.scale(state.camera.scale, state.camera.scale);

    if (state.img) {
        // Отрисовка базового атласа
        draw.drawCheckeredBackground(ctx, state.img.width, state.img.height);
        ctx.drawImage(state.img, 0, 0);
        
        // Синяя рамка вокруг текстуры
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 1 / state.camera.scale;
        ctx.strokeRect(0, 0, state.img.width, state.img.height);

        // Вызываем изолированные блоки рендера в зависимости от режима
        if (state.currentMode === 'templates') {
            renderTemplateMode();
        } else if (state.currentMode === 'sprites') {
            renderSpritesMode();
        }
    } else {
        // Отрисовка дефолтного перекрестия, если картинка не загружена
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2 / state.camera.scale;
        ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke();
    }

    ctx.restore();
}
function renderScene() {
    renderRequested = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zoomOverlay.textContent = `Зум: ${Math.round(state.camera.scale * 100)}%`;

    ctx.save();
    // Применяем глобальную матрицу камеры
    ctx.translate(state.camera.panX, state.camera.panY);
    ctx.scale(state.camera.scale, state.camera.scale);

    // ЕСЛИ МЫ В РЕЖИМЕ 1 ИЛИ 2 — РИСУЕМ АТЛАС
    if (state.currentMode !== 'skeletons') {
        if (state.img) {
            // Отрисовка базового атласа
            draw.drawCheckeredBackground(ctx, state.img.width, state.img.height);
            ctx.drawImage(state.img, 0, 0);
            
            // Синяя рамка вокруг текстуры
            ctx.strokeStyle = '#007acc';
            ctx.lineWidth = 1 / state.camera.scale;
            ctx.strokeRect(0, 0, state.img.width, state.img.height);

            if (state.currentMode === 'templates') {
                renderTemplateMode();
            } else if (state.currentMode === 'sprites') {
                renderSpritesMode();
            }
        } else {
            // Заглушка, если картинка не загружена
            ctx.strokeStyle = '#333333'; ctx.lineWidth = 2 / state.camera.scale;
            ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke();
        }
    } 
    // =======================================================
    // НОВАЯ ЛОГИКА — РЕЖИМ 3: КОНСТРУКТОР МОДЕЛИ (SKELETONS)
    // =======================================================
    else {
        const scale = state.camera.scale;

        // 1. Рисуем бесконечные пунктирные координатные оси X / Y
        draw.drawGlobalAxes(ctx, canvas.width, canvas.height, scale);

        // 2. Рисуем точку ROOT прямо по центру координат (0, 0) мира
        const isRootSelected = state.selectedSlotId === 'root';
        draw.drawRootMarker(ctx, scale, isRootSelected);
        
        // Подписываем маркер
        draw.drawLabel(ctx, 15 / scale, 5 / scale, "⭐ ROOT", scale, isRootSelected ? '#4caf50' : '#888888');

        // 3. Сюда мы на следующем шаге добавим вызов функции рендера собранной куклы
         renderDollMode();
    }
    // =======================================================

    ctx.restore();
}

// ИЗОЛИРОВАННЫЙ РЕНДЕР РЕЖИМА 1 (ШАБЛОНЫ)
function renderTemplateMode() {
    const activeTemplate = getSelectedTemplate();
    if (!activeTemplate || activeTemplate.points.length === 0) return;

    const scale = state.camera.scale;
    const pts = activeTemplate.points;
    const originX = pts[0].x;
    const originY = pts[0].y;

    // 1. Контур и заливка полигона
    draw.drawPolygon(ctx, pts, scale, '#00ff00', 'rgba(0, 255, 0, 0.15)', 2);

    // 2. Вершины (точки)
    draw.drawVertices(ctx, pts, scale);

    // 3. Точка Pivot
    const pivotX = originX + (activeTemplate.pivot?.x || 0);
    const pivotY = originY + (activeTemplate.pivot?.y || 0);
    draw.drawPivot(ctx, pivotX, pivotY, scale);

    // 4. Суставы (Joints)
    if (activeTemplate.joints) {
        activeTemplate.joints.forEach(j => {
            draw.drawJoint(ctx, originX + j.x, originY + j.y, j.name, scale);
        });
    }
}

// ИЗОЛИРОВАННЫЙ РЕНДЕР РЕЖИМА 2 (СПРАЙТЫ / ШТАМПЫ)
// НАЙДИТЕ И ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В ВАШЕМ js/viewport/renderer.js
function renderSpritesMode() {
    const scale = state.camera.scale;

    // =======================================================
    // 1. ОТРИСОВКА ФАНТОМНОГО ПРЕДПРОСМОТРА ШТАМПА ПОД КУРСОРOM
    // =======================================================
    if (state.selectedTemplateId && state.mouseImgX !== undefined) {
        const tpl = state.project.templates.find(t => t.id === state.selectedTemplateId);
        if (tpl && tpl.points.length > 0) {
            // Смещаем точки шаблона так, чтобы первая точка совпала с курсором мыши
            const fX = state.mouseImgX - tpl.points[0].x;
            const fY = state.mouseImgY - tpl.points[0].y;
            const previewPoints = tpl.points.map(pt => ({ x: pt.x + fX, y: pt.y + fY }));

            // Рисуем полупрозрачный оранжево-желтый фантомный контур
            draw.drawPolygon(ctx, previewPoints, scale, 'rgba(255, 152, 0, 0.6)', 'rgba(255, 152, 0, 0.1)', 1.5);
            
            // Легкий маркер центра штампа под мышкой
            ctx.beginPath();
            ctx.arc(state.mouseImgX, state.mouseImgY, 3 / scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ff9800';
            ctx.fill();
        }
    }

    if (state.project.sprites.length === 0) return;

    // 2. ОТРИСОВКА РЕАЛЬНО ПОСТАВЛЕННЫХ ШТАМПОВ
    state.project.sprites.forEach(sprite => {
        const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
        if (!tpl || tpl.points.length === 0) return;

        const isSelected = sprite.id === state.selectedSpriteId;
        
        const offsetX = sprite.x - tpl.points[0].x;
        const offsetY = sprite.y - tpl.points[0].y;

        const shiftedPoints = tpl.points.map(pt => ({ x: pt.x + offsetX, y: pt.y + offsetY }));

        const strokeColor = isSelected ? '#ffeb3b' : 'rgba(255, 255, 255, 0.3)';
        const fillColor = isSelected ? 'rgba(255, 235, 59, 0.15)' : 'rgba(255, 255, 255, 0.03)';
        draw.drawPolygon(ctx, shiftedPoints, scale, strokeColor, fillColor, isSelected ? 2 : 1);

        if (isSelected) {
            draw.drawPivot(ctx, sprite.x + (tpl.pivot?.x || 0), sprite.y + (tpl.pivot?.y || 0), scale);

            if (tpl.joints) {
                tpl.joints.forEach(j => {
                    draw.drawJoint(ctx, sprite.x + j.x, sprite.y + j.y, j.name, scale);
                });
            }

            draw.drawLabel(ctx, sprite.x - 20 / scale, sprite.y - 15 / scale, `🆔 ${sprite.name}`, scale);
        }
    });
}

// ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В САМОМ НИЗУ ВАШЕГО js/viewport/renderer.js
/* function renderDollMode() {
    const scale = state.camera.scale;
    
    const activeDoll = state.project.dolls.find(d => d.id === state.selectedDollId);
    if (!activeDoll || activeDoll.attachments.length === 0) return;

    const sortedAttachments = [...activeDoll.attachments].sort((a, b) => a.zLevel - b.zLevel);

    sortedAttachments.forEach(attach => {
        const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
        if (!sprite) return;

        const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
        if (!tpl || tpl.points.length === 0) return;

        const isSelected = attach.sprite_id === state.selectedSlotId;

        const localX = attach.localX || 0;
        const localY = attach.localY || 0;

        // ИСПРАВЛЕНО: Добавили индексы, чтобы брать координаты первой точки контура шаблона!
        const offsetX = localX - tpl.points[0].x;
        const offsetY = localY - tpl.points[0].y;

        const dollPoints = tpl.points.map(pt => ({ x: pt.x + offsetX, y: pt.y + offsetY }));

        ctx.save();

        const strokeColor = isSelected ? '#4caf50' : '#007acc';
        const fillColor = isSelected ? 'rgba(76, 175, 80, 0.15)' : 'rgba(0, 122, 204, 0.08)';
        draw.drawPolygon(ctx, dollPoints, scale, strokeColor, fillColor, isSelected ? 2 : 1);

        if (tpl.joints) {
            tpl.joints.forEach(j => {
                draw.drawJoint(ctx, localX + j.x, localY + j.y, j.name, scale);
            });
        }

        if (isSelected) {
            draw.drawPivot(ctx, localX + (tpl.pivot?.x || 0), localY + (tpl.pivot?.y || 0), scale);
            draw.drawLabel(ctx, localX - 20 / scale, localY - 15 / scale, `📦 ${sprite.name}`, scale, '#4caf50');
        }

        ctx.restore();
    });
} */


    // ПОЛНОСТЬЮ ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В js/viewport/renderer.js
function renderDollMode() {
    const scale = state.camera.scale;
    
    const activeDoll = state.project.dolls.find(d => d.id === state.selectedDollId);
    if (!activeDoll || activeDoll.attachments.length === 0) return;

    // Сортируем узлы по Z-Level, чтобы нижние слои рисовались первыми
    const sortedAttachments = [...activeDoll.attachments].sort((a, b) => a.zLevel - b.zLevel);

    // Вспомогательная функция для рекурсивного расчета мировых координат узла с учетом иерархии
    function getAbsolutePosition(attach) {
        if (!attach.parent_slot || attach.parent_slot === 'root') {
            return { x: attach.localX || 0, y: attach.localY || 0 };
        }

        const parentAttach = activeDoll.attachments.find(a => a.id === attach.parent_slot);
        if (!parentAttach) {
            return { x: attach.localX || 0, y: attach.localY || 0 };
        }

        const parentPos = getAbsolutePosition(parentAttach);

        const parentSprite = state.project.sprites.find(s => s.id === parentAttach.sprite_id);
        const parentTpl = parentSprite ? state.project.templates.find(t => t.id === parentSprite.template_ref) : null;
        
        let jointOffsetX = 0;
        let jointOffsetY = 0;

        if (parentTpl && parentTpl.joints && attach.parent_joint) {
            const joint = parentTpl.joints.find(j => j.name === attach.parent_joint);
            if (joint) {
                jointOffsetX = joint.x;
                jointOffsetY = joint.y;
            }
        }

        return {
            x: parentPos.x + jointOffsetX + (attach.localX || 0),
            y: parentPos.y + jointOffsetY + (attach.localY || 0)
        };
    }

    // Рендерим каждую деталь
    sortedAttachments.forEach(attach => {
        const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
        if (!sprite) return;

        const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
        if (!tpl || tpl.points.length === 0) return;

        const isSelected = attach.id === state.selectedSlotId;

        // ВЫЧИСЛЯЕМ МИРОВЫЕ КООРДИНАТЫ (Теперь они объявлены в самом начале!)
        const worldPos = getAbsolutePosition(attach);
        const worldX = worldPos.x;
        const worldY = worldPos.y;

        // Вектор смещения меша относительно первой точки контура шаблона
        const offsetX = worldX - tpl.points[0].x;
        const offsetY = worldY - tpl.points[0].y;

        const dollPoints = tpl.points.map(pt => ({ x: pt.x + offsetX, y: pt.y + offsetY }));

        ctx.save();

        // 1. Рисуем контур детали
        const strokeColor = isSelected ? '#4caf50' : '#007acc';
        const fillColor = isSelected ? 'rgba(76, 175, 80, 0.15)' : 'rgba(0, 122, 204, 0.08)';
        draw.drawPolygon(ctx, dollPoints, scale, strokeColor, fillColor, isSelected ? 2 : 1);

        // 2. Рисуем джоинты этой детали (в мировых координатах)
        if (tpl.joints) {
            tpl.joints.forEach(j => {
                draw.drawJoint(ctx, worldX + j.x, worldY + j.y, j.name, scale);
            });
        }

        // 3. Рисуем Pivot (ИСПРАВЛЕНО: Теперь worldX и worldY железно существуют выше!)
        const currentPivotX = worldX + (tpl.pivot?.x || 0);
        const currentPivotY = worldY + (tpl.pivot?.y || 0);

        if (isSelected) {
            draw.drawPivot(ctx, currentPivotX, currentPivotY, scale);
            draw.drawLabel(ctx, worldX - 20 / scale, worldY - 15 / scale, `📦 ${sprite.name}`, scale, '#4caf50');
        } else {
            // Для невыбранных деталей рисуем аккуратный тусклый прицел Pivot
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1 / scale;
            ctx.beginPath();
            ctx.moveTo(currentPivotX - 8 / scale, currentPivotY); ctx.lineTo(currentPivotX + 8 / scale, currentPivotY);
            ctx.moveTo(currentPivotX, currentPivotY - 8 / scale); ctx.lineTo(currentPivotX, currentPivotY + 8 / scale);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    });
}



