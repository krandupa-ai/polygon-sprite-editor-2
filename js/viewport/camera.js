import { state, getSelectedTemplate, getSelectedDoll } from '../state.js';
import { requestRender } from './renderer.js';

let isDragging = false;
let startX = 0;
let startY = 0;
let hasMoved = false;

// Ссылки на перетаскиваемые объекты
let draggedPoint = null; 
let draggedSprite = null; 
let draggedDollSlot = null; // НОВАЯ ПЕРЕМЕННАЯ: Ссылка на перетаскиваемый узел куклы

export function initCamera() {
    const workspace = document.getElementById('workspace');
    const canvas = document.getElementById('editorCanvas');

    // 1. НАЖАТИЕ МЫШИ
    workspace.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
        const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

        const activeTemplate = getSelectedTemplate();
        const activeDoll = getSelectedDoll();
        
        // Режим 1: Перетаскивание точек контура
        if (state.currentMode === 'templates' && state.activeTool === 'draw' && activeTemplate) {
            const hitRadius = 8 / state.camera.scale; 
            draggedPoint = activeTemplate.points.find(pt => Math.hypot(pt.x - imgX, pt.y - imgY) <= hitRadius);
        }

        // Режим 2: Перетаскивание штампов на атласе
        if (state.currentMode === 'sprites' && state.project.sprites.length > 0) {
            const hitRadius = 15 / state.camera.scale; 
            draggedSprite = state.project.sprites.find(s => Math.hypot(s.x - imgX, s.y - imgY) <= hitRadius);
            
            if (draggedSprite) {
                state.selectedSpriteId = draggedSprite.id;
                window.dispatchEvent(new CustomEvent('spritesUpdated'));
            }
        }

        // РЕЖИМ 3: Перетаскивание деталей куклы на холсте координат 🛠️
/*         if (state.currentMode === 'skeletons' && activeDoll && activeDoll.attachments.length > 0) {

            console.log("Attempting to find a doll slot to drag at image coordinates:", imgX, imgY);

            const hitRadius = 20 / state.camera.scale; // Радиус клика вокруг центра детали

            // Ищем узел куклы, по центру которого кликнули
            draggedDollSlot = activeDoll.attachments.find(attach => {
                const x = attach.localX || 0;
                const y = attach.localY || 0;
                return Math.hypot(x - imgX, y - imgY) <= hitRadius;
            });
            console.log("Dragged Doll Slot found:", draggedDollSlot);


            if (draggedDollSlot) {
                state.selectedSlotId = draggedDollSlot.id; // Фокусируемся на узле в иерархии
                window.dispatchEvent(new CustomEvent('spritesUpdated')); // Триггер обновления списков
            }

            console.log("Dragged Doll Slot found:", draggedDollSlot);
        } */


                    // НАЙДИТЕ ВНУТРИ ВАШЕГО ВЕРХНЕГО БЛОКА mousedown В js/viewport/camera.js:
        // Режим 3: Перетаскивание деталей куклы на холсте координат
        if (state.currentMode === 'skeletons' && activeDoll && activeDoll.attachments.length > 0) {
            const hitRadius = 15 / state.camera.scale; // Радиус захвата прицела Pivot

            // ИСПРАВЛЕНО: Теперь ищем узел куклы, наступив мышкой СТРОГО НА ЕГО PIVOT!
            draggedDollSlot = activeDoll.attachments.find(attach => {
                const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
                const tpl = sprite ? state.project.templates.find(t => t.id === sprite.template_ref) : null;
                
                // Вычисляем честную мировую позицию Pivot этого спрайта на холсте
                const pivotWorldX = (attach.localX || 0) + (tpl?.pivot?.x || 0);
                const pivotWorldY = (attach.localY || 0) + (tpl?.pivot?.y || 0);
                
                return Math.hypot(pivotWorldX - imgX, pivotWorldY - imgY) <= hitRadius;
            });

            if (draggedDollSlot) {
                state.selectedSlotId = draggedDollSlot.id;
                window.dispatchEvent(new CustomEvent('spritesUpdated'));
            }
        }




        // Блокируем панорамирование камеры, если схватили деталь, точку или штамп
        if (draggedPoint || draggedSprite || draggedDollSlot) {
            isDragging = false;
        } else {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX - state.camera.panX;
            startY = e.clientY - state.camera.panY;
        }
    });

    // 2. ДВИЖЕНИЕ МЫШИ
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
        const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

        state.mouseImgX = imgX;
        state.mouseImgY = imgY;

        if (draggedPoint) {
            draggedPoint.x = imgX; draggedPoint.y = imgY;
            requestRender(); return;
        }

        if (draggedSprite) {
            draggedSprite.x = imgX; draggedSprite.y = imgY;
            requestRender(); return;
        }

        // ЕСЛИ ТАЩИМ ДЕТАЛЬ КУКЛЫ В РЕЖИМЕ СБОРКИ 🧸
 /*        if (draggedDollSlot) {
            draggedDollSlot.localX = imgX;
            draggedDollSlot.localY = imgY;
            requestRender();
            return;
        } */

                    // НАЙДИТЕ ВНУТРИ БЛОКА mousemove В js/viewport/camera.js И ЗАМЕНИТЕ:
        if (draggedDollSlot) {
            const mySprite = state.project.sprites.find(s => s.id === draggedDollSlot.sprite_id);
            const myTpl = mySprite ? state.project.templates.find(t => t.id === mySprite.template_ref) : null;
            const myPivotX = myTpl?.pivot?.x || 0;
            const myPivotY = myTpl?.pivot?.y || 0;

            // Мышка теперь плавно тащит САМ ПРИЦЕЛ Pivot, а локальные координаты первой точки считаются автоматически!
            draggedDollSlot.localX = imgX - myPivotX;
            draggedDollSlot.localY = imgY - myPivotY;
            
            requestRender();
            return;
        }

        

        if (!isDragging) {
            if (state.currentMode === 'sprites') requestRender();
            return;
        }
        
        if (Math.abs(e.clientX - (startX + state.camera.panX)) > 0 || 
            Math.abs(e.clientY - (startY + state.camera.panY)) > 0) {
            hasMoved = true;
        }

        state.camera.panX = e.clientX - startX;
        state.camera.panY = e.clientY - startY;
        requestRender();
    });

    // 3. ОТПУСКАНИЕ МЫШИ
    /* workspace.addEventListener('mouseup', (e) => {
        if (draggedPoint || draggedSprite || draggedDollSlot) {
            draggedPoint = null; draggedSprite = null; draggedDollSlot = null;
            return;
        }

        if (isDragging && !hasMoved) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
            const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

            const activeTemplate = getSelectedTemplate();

            if (state.currentMode === 'templates' && activeTemplate) {
                if (state.activeTool === 'draw') {
                    activeTemplate.points.push({ x: imgX, y: imgY });
                    window.dispatchEvent(new CustomEvent('templateUpdated'));
                    requestRender();
                } 
                else if (state.activeTool === 'pivot') {
                    if (activeTemplate.points.length === 0) {
                        activeTemplate.points.push({ x: imgX, y: imgY });
                        activeTemplate.pivot = { x: 0, y: 0 };
                    } else {
                        activeTemplate.pivot.x = imgX - activeTemplate.points[0].x;
                        activeTemplate.pivot.y = imgY - activeTemplate.points[0].y;
                    }
                    requestRender();
                }
                else if (state.activeTool === 'joint') {
                    if (activeTemplate.points.length === 0) return;
                    const selectedTag = document.getElementById('activeTagSelect').value;
                    if (!selectedTag) return;

                    const existingJoint = activeTemplate.joints.find(j => j.name === selectedTag);
                    if (existingJoint) {
                        existingJoint.x = imgX - activeTemplate.points[0].x;
                        existingJoint.y = imgY - activeTemplate.points[0].y;
                    } else {
                        activeTemplate.attachments.push({ name: selectedTag, x: imgX - activeTemplate.points[0].x, y: imgY - activeTemplate.points[0].y });
                    }
                    requestRender();
                }
            } 
            else if (state.currentMode === 'sprites') {
                if (!state.selectedTemplateId) { alert("Выберите шаблон!"); return; }

                const hitRadius = 15 / state.camera.scale;
                const clickOnExisting = state.project.sprites.some(s => Math.hypot(s.x - imgX, s.y - imgY) <= hitRadius);

                if (!clickOnExisting) {
                    const spriteIndex = state.project.sprites.length;
                    const newSpriteId = 's_' + Date.now();

                    state.project.sprites.push({
                        id: newSpriteId, name: `sprite_${spriteIndex}`,
                        template_ref: state.selectedTemplateId,
                        x: imgX, y: imgY, scaleX: 1.0, scaleY: 1.0
                    });

                    state.selectedSpriteId = newSpriteId;
                    window.dispatchEvent(new CustomEvent('spritesUpdated'));
                    requestRender();
                }
            }
        }
    }); */

    // НАЙДИТЕ И ЗАМЕНИТЕ ЭТОТ БЛОК В САМОМ НИЗУ js/viewport/camera.js:
        // ЗАМЕНИТЕ ВЕСЬ БЛОК window.addEventListener('mouseup', ...) В КОНЦЕ ФАЙЛА js/viewport/camera.js

    window.addEventListener('mouseup', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Переводим экранные координаты в пиксели атласа/конструктора
        const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
        const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

        // =======================================================
        // ЧАСТЬ А: ЕСЛИ МЫ ТОЛЬКО ЧТО ЗАВЕРШИЛИ ПЕРЕТАСКИВАНИЕ ДЕТАЛИ КУКЛЫ (РЕЖИМ 3)
        // =======================================================
       /*  if (draggedDollSlot && state.currentMode === 'skeletons') {
            console.log("Логика прилипания запущена для узла:", draggedDollSlot.id);
            const activeDoll = getSelectedDoll();
            if (activeDoll) {
                const snapRadius = 15 / state.camera.scale; 
                let foundSnap = false;

                for (let attach of activeDoll.attachments) {
                    if (attach.id === draggedDollSlot.id) continue;

                    const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
                    if (!sprite) continue;

                    const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
                    if (!tpl || !tpl.joints) continue;

                    for (let joint of tpl.joints) {
                        const parentJointWorldX = (attach.localX || 0) + joint.x;
                        const parentJointWorldY = (attach.localY || 0) + joint.y;

                        const mySprite = state.project.sprites.find(s => s.id === draggedDollSlot.sprite_id);
                        const myTpl = mySprite ? state.project.templates.find(t => t.id === mySprite.template_ref) : null;
                        
                        const myPivotX = draggedDollSlot.localX + (myTpl?.pivot?.x || 0);
                        const myPivotY = draggedDollSlot.localY + (myTpl?.pivot?.y || 0);

                        const dist = Math.hypot(parentJointWorldX - myPivotX, parentJointWorldY - myPivotY);

                        if (dist <= snapRadius) {
                            draggedDollSlot.localX = parentJointWorldX - (myTpl?.pivot?.x || 0);
                            draggedDollSlot.localY = parentJointWorldY - (myTpl?.pivot?.y || 0);
                            
                            draggedDollSlot.parent_slot = attach.id;
                            draggedDollSlot.parent_joint = joint.name;
                            
                            foundSnap = true;
                            break;
                        }
                    }
                    if (foundSnap) break;
                }

                if (!foundSnap) {
                    const distToRoot = Math.hypot(draggedDollSlot.localX, draggedDollSlot.localY);
                    if (distToRoot <= snapRadius) {
                        draggedDollSlot.localX = 0;
                        draggedDollSlot.localY = 0;
                    }
                    draggedDollSlot.parent_slot = 'root';
                    draggedDollSlot.parent_joint = null;
                }
            }
            window.dispatchEvent(new CustomEvent('spritesUpdated'));
        } */

                    // НАЙДИТЕ И ЗАМЕНИТЕ ТОЛЬКО ЧАСТЬ А ВНУТРИ window.addEventListener('mouseup') в js/viewport/camera.js

        // =======================================================
        // ЧАСТЬ А: МАГНИТНОЕ ПРИЛИПАНИЕ ПРИ ОТПУСКАНИИ ДЕТАЛИ (РЕЖИМ 3)
        // =======================================================
        if (draggedDollSlot && state.currentMode === 'skeletons') {
            const activeDoll = getSelectedDoll();
            
            if (activeDoll) {
                // Радиус захвата джоинта вокруг КУРСОРA мыши (30 пикселей)
                const snapRadius = 30; 
                let foundSnap = false;

                // Находим шаблон нашей перетаскиваемой детали, чтобы точно знать, где её Pivot
                const mySprite = state.project.sprites.find(s => s.id === draggedDollSlot.sprite_id);
                const myTpl = mySprite ? state.project.templates.find(t => t.id === mySprite.template_ref) : null;
                const myPivotX = myTpl?.pivot?.x || 0;
                const myPivotY = myTpl?.pivot?.y || 0;

                // Переводим текущие локальные координаты ПИВОТА перетаскиваемой детали в мировые пиксели холста
                // (Именно эту точку мы хотим совместить с джоинтом родителя)
                const myCurrentWorldPivotX = draggedDollSlot.localX + myPivotX;
                const myCurrentWorldPivotY = draggedDollSlot.localY + myPivotY;

                // Пробегаемся по всем остальным деталям куклы
                for (let attach of activeDoll.attachments) {
                    if (attach.id === draggedDollSlot.id) continue; // Пропускаем себя

                    const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
                    if (!sprite) continue;

                    const tpl = state.project.templates.find(t => t.id === sprite.template_ref);
                    if (!tpl || !tpl.joints) continue;

                    for (let joint of tpl.joints) {
                        // Вычисляем честную мировую позицию розового джоинта на холсте
                        const parentJointWorldX = (attach.localX || 0) + joint.x;
                        const parentJointWorldY = (attach.localY || 0) + joint.y;

                        // Считаем расстояние от ПИВОТА нашей детали до ДЖОИНТА родителя
                        const dist = Math.hypot(parentJointWorldX - myCurrentWorldPivotX, parentJointWorldY - myCurrentWorldPivotY);

                        if (dist <= snapRadius) {
                            // КРАСИВЫЙ МАГНИТНЫЙ ЩЕЛЧОК: 
                            // Так как наша деталь теперь иерархически сидит НА джоинте родителя, 
                            // её локальное смещение относительно этого джоинта становится равным РОВНО НУЛЮ!
                            draggedDollSlot.localX = 0;
                            draggedDollSlot.localY = 0;
                            
                            // Записываем жесткую иерархическую связь
                            draggedDollSlot.parent_slot = attach.id;
                            draggedDollSlot.parent_joint = joint.name;
                            
                            foundSnap = true;
                            console.log(`🎯 Спрайт успешно защелкнулся пивотом на джоинт: ${joint.name}`);
                            break;
                        }
                    }
                    if (foundSnap) break;
                }

                // Если бросили в пустом месте (не рядом с джоинтами)
                if (!foundSnap) {
                    // Проверяем привязку к ROOT (0,0) пола
                    const distToRoot = Math.hypot(myCurrentWorldPivotX, myCurrentWorldPivotY);
                    if (distToRoot <= snapRadius) {
                        // Сажаем Pivot ровно в ROOT (0,0), значит localX/localY гасятся под Pivot
                        draggedDollSlot.localX = 0 - myPivotX;
                        draggedDollSlot.localY = 0 - myPivotY;
                        draggedDollSlot.parent_slot = 'root';
                        draggedDollSlot.parent_joint = null;
                    } else {
                        // Оставляем деталь свободно лежать в воздухе, отвязав от иерархии родителя (крепим к root)
                        // Её координаты localX/localY в мире будут считаться от центра осей (0,0)
                        draggedDollSlot.localX = imgX - myPivotX;
                        draggedDollSlot.localY = imgY - myPivotY;
                        draggedDollSlot.parent_slot = 'root';
                        draggedDollSlot.parent_joint = null;
                    }
                }
            }
            window.dispatchEvent(new CustomEvent('spritesUpdated'));
        }


        // =======================================================
        // ЧАСТЬ Б: ЕСЛИ ЭТО БЫЛ ОБЫЧНЫЙ ОДИНОЧНЫЙ КЛИК (МЫШЬ НЕ ДВИГАЛАСЬ)
        // =======================================================
        if (isDragging && !hasMoved) {
            const activeTemplate = getSelectedTemplate();

            // Логика кликов в Режиме 1 (Шаблоны)
            if (state.currentMode === 'templates' && activeTemplate) {
                if (state.activeTool === 'draw') {
                    activeTemplate.points.push({ x: imgX, y: imgY });
                    window.dispatchEvent(new CustomEvent('templateUpdated'));
                } 
                else if (state.activeTool === 'pivot') {
                    if (activeTemplate.points.length === 0) {
                        activeTemplate.points.push({ x: imgX, y: imgY });
                        activeTemplate.pivot = { x: 0, y: 0 };
                    } else {
                        activeTemplate.pivot.x = imgX - activeTemplate.points[0].x;
                        activeTemplate.pivot.y = imgY - activeTemplate.points[0].y;
                    }
                }
                else if (state.activeTool === 'joint') {
                    if (activeTemplate.points.length > 0) {
                        const selectedTag = document.getElementById('activeTagSelect').value;
                        if (selectedTag) {
                            const existingJoint = activeTemplate.joints.find(j => j.name === selectedTag);
                            if (existingJoint) {
                                existingJoint.x = imgX - activeTemplate.points[0].x;
                                existingJoint.y = imgY - activeTemplate.points[0].y;
                            } else {
                                activeTemplate.joints.push({ name: selectedTag, x: imgX - activeTemplate.points[0].x, y: imgY - activeTemplate.points[0].y });
                            }
                        }
                    }
                }
            } 
            // Логика кликов в Режиме 2 (Штамповка спрайтов)
            else if (state.currentMode === 'sprites') {
                if (state.selectedTemplateId) {
                    const hitRadius = 15 / state.camera.scale;
                    const clickOnExisting = state.project.sprites.some(s => Math.hypot(s.x - imgX, s.y - imgY) <= hitRadius);

                    if (!clickOnExisting) {
                        const spriteIndex = state.project.sprites.length;
                        const newSpriteId = 's_' + Date.now();

                        state.project.sprites.push({
                            id: newSpriteId, name: `sprite_${spriteIndex}`,
                            template_ref: state.selectedTemplateId,
                            x: imgX, y: imgY, scaleX: 1.0, scaleY: 1.0
                        });

                        state.selectedSpriteId = newSpriteId;
                        window.dispatchEvent(new CustomEvent('spritesUpdated'));
                    }
                }
            }
        }

        // =======================================================
        // ЧАСТЬ В: СБРОС ФЛАГОВ И ПЕРЕРИСОВКА (Срабатывает в самом конце!)
        // =======================================================
        isDragging = false;
        draggedPoint = null;
        draggedSprite = null;
        draggedDollSlot = null; // Данные стираются ТОЛЬКО тут, после выполнения всех условий!
        
        requestRender();
    });



    workspace.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imageX = (mouseX - state.camera.panX) / state.camera.scale;
        const imageY = (mouseY - state.camera.panY) / state.camera.scale;

        if (e.deltaY < 0) { state.camera.scale = Math.min(state.camera.scale * zoomFactor, 40); } 
        else { state.camera.scale = Math.max(state.camera.scale / zoomFactor, 0.05); }

        state.camera.panX = mouseX - imageX * state.camera.scale;
        state.camera.panY = mouseY - imageY * state.camera.scale;
        requestRender();
    }, { passive: false });
}

export function resetCamera(imgWidth, imgHeight, canvasWidth, canvasHeight) {
    const padding = 60; const scaleX = (canvasWidth - padding) / imgWidth; const scaleY = (canvasHeight - padding) / imgHeight;
    state.camera.scale = Math.min(scaleX, scaleY, 1);
    state.camera.panX = (canvasWidth - imgWidth * state.camera.scale) / 2; state.camera.panY = (canvasHeight - imgHeight * state.camera.scale) / 2;
    requestRender();
}

























// ***********************************


/* import { state, getSelectedTemplate } from '../state.js';
import { requestRender } from './renderer.js';

let isDragging = false;
let startX = 0;
let startY = 0;
let hasMoved = false;

// Хранение перетаскиваемых объектов
let draggedPoint = null; 
let draggedSprite = null; // Ссылка на перетаскиваемый штамп спрайта

export function initCamera() {
    const workspace = document.getElementById('workspace');
    const canvas = document.getElementById('editorCanvas');

    // 1. НАЖАТИЕ МЫШИ
    workspace.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
        const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

        const activeTemplate = getSelectedTemplate();
        
        // Перетаскивание точек контура в режиме шаблонов
        if (state.currentMode === 'templates' && state.activeTool === 'draw' && activeTemplate) {
            const hitRadius = 8 / state.camera.scale; 
            draggedPoint = activeTemplate.points.find(pt => Math.hypot(pt.x - imgX, pt.y - imgY) <= hitRadius);
        }

        // ПРОВЕРКА: Нажали ли мы на существующий штамп в режиме спрайтов
        if (state.currentMode === 'sprites' && state.project.sprites.length > 0) {
            const hitRadius = 15 / state.camera.scale; // Зона захвата вокруг центра штампа
            
            // Ищем штамп, к которому кликнули ближе всего
            draggedSprite = state.project.sprites.find(s => Math.hypot(s.x - imgX, s.y - imgY) <= hitRadius);
            
            if (draggedSprite) {
                state.selectedSpriteId = draggedSprite.id;
                window.dispatchEvent(new CustomEvent('spritesUpdated'));
            }
        }

        // Если поймали точку или штамп, панорамирование (Pan) холста отключается
        if (draggedPoint || draggedSprite) {
            isDragging = false;
        } else {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX - state.camera.panX;
            startY = e.clientY - state.camera.panY;
        }
    });

    // 2. ДВИЖЕНИЕ МЫШИ
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
        const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

        // Сохраняем текущие координаты мыши в стейт ДЛЯ ПРЕДПРОСМОТРА ШТАМПА
        state.mouseImgX = imgX;
        state.mouseImgY = imgY;

        // Если тащим точку контура
        if (draggedPoint) {
            draggedPoint.x = imgX; draggedPoint.y = imgY;
            requestRender(); return;
        }

        // ЕСЛИ ТАЩИМ ШТАМП СПРАЙТА
        if (draggedSprite) {
            draggedSprite.x = imgX; draggedSprite.y = imgY;
            requestRender(); return;
        }

        // Обычное панорамирование камеры (Pan)
        if (!isDragging) {
            // Даже если мы просто водим мышкой без зажатия кнопок, 
            // просим обновить экран, чтобы фантомный превью-контур следовал за курсором
            if (state.currentMode === 'sprites') requestRender();
            return;
        }
        
        if (Math.abs(e.clientX - (startX + state.camera.panX)) > 0 || 
            Math.abs(e.clientY - (startY + state.camera.panY)) > 0) {
            hasMoved = true;
        }

        state.camera.panX = e.clientX - startX;
        state.camera.panY = e.clientY - startY;
        requestRender();
    });

    // 3. ОТПУСКАНИЕ МЫШИ (Логика одиночного клика)
    workspace.addEventListener('mouseup', (e) => {
        if (draggedPoint || draggedSprite) {
            draggedPoint = null; draggedSprite = null;
            return;
        }

        if (isDragging && !hasMoved) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const imgX = Math.round((mouseX - state.camera.panX) / state.camera.scale);
            const imgY = Math.round((mouseY - state.camera.panY) / state.camera.scale);

            const activeTemplate = getSelectedTemplate();

            if (state.currentMode === 'templates' && activeTemplate) {
                if (state.activeTool === 'draw') {
                    activeTemplate.points.push({ x: imgX, y: imgY });
                    window.dispatchEvent(new CustomEvent('templateUpdated'));
                    requestRender();
                } 
                else if (state.activeTool === 'pivot') {
                    if (activeTemplate.points.length === 0) {
                        activeTemplate.points.push({ x: imgX, y: imgY });
                        activeTemplate.pivot = { x: 0, y: 0 };
                    } else {
                        activeTemplate.pivot.x = imgX - activeTemplate.points[0].x;
                        activeTemplate.pivot.y = imgY - activeTemplate.points[0].y;
                    }
                    requestRender();
                }
                else if (state.activeTool === 'joint') {
                    if (activeTemplate.points.length === 0) return;
                    const selectedTag = document.getElementById('activeTagSelect').value;
                    if (!selectedTag) return;

                    const existingJoint = activeTemplate.joints.find(j => j.name === selectedTag);
                    if (existingJoint) {
                        existingJoint.x = imgX - activeTemplate.points[0].x;
                        existingJoint.y = imgY - activeTemplate.points[0].y;
                    } else {
                        activeTemplate.joints.push({ name: selectedTag, x: imgX - activeTemplate.points[0].x, y: imgY - activeTemplate.points[0].y });
                    }
                    requestRender();
                }
            } 
            // Клик в режиме спрайтов ставит штамп, ТОЛЬКО если мы не кликнули на существующий штамп (защита от дублирования при клике для выбора)
            else if (state.currentMode === 'sprites') {
                if (!state.selectedTemplateId) {
                    alert("Выберите шаблон!"); return;
                }

                // Проверяем, нет ли под мышкой уже штампа, чтобы не плодить их один на один при обычном клике выбора
                const hitRadius = 15 / state.camera.scale;
                const clickOnExisting = state.project.sprites.some(s => Math.hypot(s.x - imgX, s.y - imgY) <= hitRadius);

                if (!clickOnExisting) {
                    const spriteIndex = state.project.sprites.length;
                    const newSpriteId = 's_' + Date.now();

                    state.project.sprites.push({
                        id: newSpriteId, name: `sprite_${spriteIndex}`,
                        template_ref: state.selectedTemplateId,
                        x: imgX, y: imgY, scaleX: 1.0, scaleY: 1.0
                    });

                    state.selectedSpriteId = newSpriteId;
                    window.dispatchEvent(new CustomEvent('spritesUpdated'));
                    requestRender();
                }
            }
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false; draggedPoint = null; draggedSprite = null;
    });

    workspace.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imageX = (mouseX - state.camera.panX) / state.camera.scale;
        const imageY = (mouseY - state.camera.panY) / state.camera.scale;

        if (e.deltaY < 0) { state.camera.scale = Math.min(state.camera.scale * zoomFactor, 40); } 
        else { state.camera.scale = Math.max(state.camera.scale / zoomFactor, 0.05); }

        state.camera.panX = mouseX - imageX * state.camera.scale;
        state.camera.panY = mouseY - imageY * state.camera.scale;
        requestRender();
    }, { passive: false });
}

export function resetCamera(imgWidth, imgHeight, canvasWidth, canvasHeight) {
    const padding = 60; const scaleX = (canvasWidth - padding) / imgWidth; const scaleY = (canvasHeight - padding) / imgHeight;
    state.camera.scale = Math.min(scaleX, scaleY, 1);
    state.camera.panX = (canvasWidth - imgWidth * state.camera.scale) / 2; state.camera.panY = (canvasHeight - imgHeight * state.camera.scale) / 2;
    requestRender();
}
 */