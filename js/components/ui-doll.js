import { state, getSelectedDoll } from '../state.js';
import { requestRender } from '../viewport/renderer.js';

let localSelectedSpriteId = null; // Храним, какой спрайт выбран для призыва

export function renderDollTree() {
    renderDollList();            // 1. Обновляем список кукол
    renderAvailableSprites();    // 2. Обновляем список спрайтов для призыва
    renderActiveDollTree();      // 3. Обновляем иерархию слотов
}

// 1. РЕНДЕР СПИСКА КУКОЛ
function renderDollList() {
    const dollListUI = document.getElementById('dollList');
    if (!dollListUI) return;
    dollListUI.innerHTML = '';

    state.project.dolls.forEach(doll => {
        const div = document.createElement('div');
        div.className = `list-item ${doll.id === state.selectedDollId ? 'selected' : ''}`;
        div.innerHTML = `<span>🎭 ${doll.name}</span> <span style="font-size:10px; opacity:0.5;">(${doll.attachments.length} дет.)</span>`;
        
        div.addEventListener('click', () => {
            state.selectedDollId = doll.id;
            state.selectedSlotId = 'root'; // Сброс на корень куклы
            renderDollTree();
            requestRender();
        });
        dollListUI.appendChild(div);
    });
}

// 2. РЕНДЕР СПРАЙТОВ, ДОСТУПНЫХ ДЛЯ ПРИЗЫВА
/* function renderAvailableSprites() {
    const selectListUI = document.getElementById('dollAvailableSpritesList');
    const btnAttach = document.getElementById('btnAttachSelectedSprite');
    if (!selectListUI) return;
    selectListUI.innerHTML = '';

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;

    // Фильтруем спрайты, которых еще нет в ЭТОЙ кукле
    const usedSpriteIds = activeDoll.attachments.map(a => a.sprite_id);
    const freeSprites = state.project.sprites.filter(s => !usedSpriteIds.includes(s.id));

    if (freeSprites.length === 0) {
        selectListUI.innerHTML = '<div style="padding:10px; color:#666; font-size:12px; text-align:center;">Нет свободных спрайтов.<br>Нарежьте их в Режиме 2!</div>';
        btnAttach.setAttribute('disabled', 'true');
        return;
    }

    btnAttach.removeAttribute('disabled');

    freeSprites.forEach(sprite => {
        const div = document.createElement('div');
        div.className = `list-item ${sprite.id === localSelectedSpriteId ? 'selected' : ''}`;
        div.innerHTML = `<span>📦 ${sprite.name}</span>`;
        
        div.addEventListener('click', () => {
            localSelectedSpriteId = sprite.id;
            renderAvailableSprites();
        });
        selectListUI.appendChild(div);
    });
} */

    // 1. НАЙДИТЕ И ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В ВАШЕМ js/components/ui-doll.js
function renderAvailableSprites() {
    const selectListUI = document.getElementById('dollAvailableSpritesList');
    const btnAttach = document.getElementById('btnAttachSelectedSprite');
    if (!selectListUI) return;
    selectListUI.innerHTML = '';

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;

    // УБРАЛИ ФИЛЬТРАЦИЮ: Теперь показываем ВШЕ нарезанные спрайты без исключения!
    const allSprites = state.project.sprites;

    if (allSprites.length === 0) {
        selectListUI.innerHTML = '<div style="padding:10px; color:#666; font-size:11px; text-align:center;">Нет нарезанных спрайтов.<br>Создайте их в Режиме 2!</div>';
        btnAttach.setAttribute('disabled', 'true');
        return;
    }

    btnAttach.removeAttribute('disabled');

    allSprites.forEach(sprite => {
        const div = document.createElement('div');
        div.className = `list-item ${sprite.id === localSelectedSpriteId ? 'selected' : ''}`;
        div.innerHTML = `<span>📦 ${sprite.name}</span>`;
        
        div.addEventListener('click', () => {
            localSelectedSpriteId = sprite.id;
            renderAvailableSprites();
        });
        selectListUI.appendChild(div);
    });
}


// 3. РЕНДЕР ИЕРАРХИИ СЛОТОВ ТЕКУЩЕЙ КУКЛЫ
/* function renderActiveDollTree() {
    const treeUI = document.getElementById('dollTreeList');
    if (!treeUI) return;
    treeUI.innerHTML = '';

    // Всегда выводим ROOT куклы
    const rootDiv = document.createElement('div');
    rootDiv.className = `list-item ${state.selectedSlotId === 'root' ? 'selected' : ''}`;
    rootDiv.innerHTML = `<span>⭐ ROOT (Позиция на полу)</span>`;
    rootDiv.addEventListener('click', () => {
        state.selectedSlotId = 'root';
        renderActiveDollTree();
        updateDollInspector();
        requestRender();
    });
    treeUI.appendChild(rootDiv);

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;

    // Выводим элементы куклы
    activeDoll.attachments.forEach(attach => {
        const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
        const name = sprite ? sprite.name : "Неизвестный спрайт";

        const div = document.createElement('div');
        div.className = `list-item ${attach.sprite_id === state.selectedSlotId ? 'selected' : ''}`;
        div.style.paddingLeft = '24px';
        div.innerHTML = `<span>↳ 📦 ${name}</span> <span style="font-size:10px; color:#888;">(Z: ${attach.zLevel})</span>`;
        
        div.addEventListener('click', () => {
            state.selectedSlotId = attach.sprite_id;
            renderActiveDollTree();
            updateDollInspector();
            requestRender();
        });
        treeUI.appendChild(div);
    });

    updateDollInspector();
} */

    // ЗАМЕНИТЕ ЭТУ ФУНКЦИЮ В js/components/ui-doll.js
function renderActiveDollTree() {
    const treeUI = document.getElementById('dollTreeList');
    if (!treeUI) return;
    treeUI.innerHTML = '';

    // Всегда выводим ROOT куклы
    const rootDiv = document.createElement('div');
    rootDiv.className = `list-item ${state.selectedSlotId === 'root' ? 'selected' : ''}`;
    rootDiv.innerHTML = `<span>⭐ ROOT (Позиция на полу)</span>`;
    rootDiv.addEventListener('click', () => {
        state.selectedSlotId = 'root';
        renderActiveDollTree();
        updateDollInspector();
        requestRender();
    });
    treeUI.appendChild(rootDiv);

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;

    // Выводим элементы куклы
    activeDoll.attachments.forEach(attach => {
        const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
        const name = sprite ? sprite.name : "Неизвестный спрайт";

        const div = document.createElement('div');
        
        // ИСПРАВЛЕНО: Сравниваем уникальный ID узла сборки (attach.id), а не sprite_id!
        div.className = `list-item ${attach.id === state.selectedSlotId ? 'selected' : ''}`;
        
        div.style.paddingLeft = '24px';
        div.innerHTML = `<span>↳ 📦 ${name}</span> <span style="font-size:10px; color:#888;">(Z: ${attach.zLevel})</span>`;
        
        div.addEventListener('click', () => {
            // ИСПРАВЛЕНО: Записываем в стейт уникальный ID узла куклы
            state.selectedSlotId = attach.id; 
            renderActiveDollTree();
            updateDollInspector();
            requestRender();
        });
        treeUI.appendChild(div);
    });

    updateDollInspector();
}




/* function updateDollInspector() {
    const inspector = document.getElementById('dollInspector');
    const inputSlotName = document.getElementById('dollSlotName');
    const inputZLevel = document.getElementById('dollZLevel');

    if (state.selectedSlotId === 'root') {
        inspector.style.display = 'block';
        inputSlotName.value = "ROOT"; inputSlotName.setAttribute('readonly', 'true');
        inputZLevel.value = 0; inputZLevel.setAttribute('readonly', 'true');
        document.getElementById('btnDeleteSlot').style.display = 'none';
        return;
    }

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;
    const attach = activeDoll.attachments.find(a => a.sprite_id === state.selectedSlotId);

    if (!attach) {
        inspector.style.display = 'none'; return;
    }

    inspector.style.display = 'block';
    const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
    inputSlotName.value = sprite ? sprite.name : "Ошибка";
    inputSlotName.removeAttribute('readonly');
    
    inputZLevel.value = attach.zLevel;
    inputZLevel.removeAttribute('readonly');
    document.getElementById('btnDeleteSlot').style.display = 'block';
} */


    function updateDollInspector() {
    const inspector = document.getElementById('dollInspector');
    const inputSlotName = document.getElementById('dollSlotName');
    const inputZLevel = document.getElementById('dollZLevel');

    if (state.selectedSlotId === 'root') {
        inspector.style.display = 'block';
        inputSlotName.value = "ROOT"; 
        inputSlotName.setAttribute('readonly', 'true');
        inputZLevel.value = 0; 
        inputZLevel.setAttribute('readonly', 'true');
        document.getElementById('btnDeleteSlot').style.display = 'none';
        return;
    }

    const activeDoll = getSelectedDoll();
    if (!activeDoll) return;
    
    // ИСПРАВЛЕННАЯ СТРОКА: Ищем деталь по её собственному уникальному id в кукле
    const attach = activeDoll.attachments.find(a => a.id === state.selectedSlotId);

    if (!attach) {
        inspector.style.display = 'none'; 
        return;
    }

    inspector.style.display = 'block';
    const sprite = state.project.sprites.find(s => s.id === attach.sprite_id);
    inputSlotName.value = sprite ? sprite.name : "Ошибка";
    inputSlotName.removeAttribute('readonly');
    
    inputZLevel.value = attach.zLevel;
    inputZLevel.removeAttribute('readonly');
    document.getElementById('btnDeleteSlot').style.display = 'block';
}



export function initDoll() {


    console.log("initDoll() called");

    const btnCreateDoll = document.getElementById('btnCreateDoll');
    const btnAttach = document.getElementById('btnAttachSelectedSprite');
    const inputSlotName = document.getElementById('dollSlotName');
    const inputZLevel = document.getElementById('dollZLevel');
    const btnDeleteSlot = document.getElementById('btnDeleteSlot');

    // Создание новой куклы персонажа
    btnCreateDoll.addEventListener('click', () => {
        const name = prompt("Введите имя нового персонажа/куклы:", `Персонаж ${state.project.dolls.length + 1}`);
        if (name) {
            const id = 'd_' + Date.now();
            state.project.dolls.push({ id, name, attachments: [] });
            state.selectedDollId = id;
            state.selectedSlotId = 'root';
            renderDollTree();
            requestRender();
        }
    });

    // Добавление выбранного спрайта в ТЕКУЩУЮ КУКЛЫ по кнопке [+]
 btnAttach.addEventListener('click', () => {
            const activeDoll = getSelectedDoll();
            if (!activeDoll || !localSelectedSpriteId) {
                alert("Сначала выберите спрайт в списке выше!");
                return;
            }

            // Генерируем уникальный ID для этого конкретного узла куклы
            // Благодаря этому мы можем вызвать один спрайт крыла 10 раз, и это будут 10 разных деталей на холсте!
            const instanceId = 'slot_' + Date.now();

            activeDoll.attachments.push({
                id: instanceId, // Уникальный ID узла сборки
                sprite_id: localSelectedSpriteId, // Ссылка на исходный кадр атласа
                parent_slot: 'root', 
                zLevel: activeDoll.attachments.length, // Автоматом увеличиваем слой, чтобы новые детали были сверху
                localX: 0,
                localY: 0
            });

            state.selectedSlotId = instanceId; // Фокусируемся на уникальном ID экземпляра
            
            renderDollTree();
            requestRender();
        });

    // Изменение Z-Level внутри куклы
    inputZLevel.addEventListener('input', () => {
        if (state.selectedSlotId === 'root') return;
        const activeDoll = getSelectedDoll();
        if (!activeDoll) return;
        const attach = activeDoll.attachments.find(a => a.sprite_id === state.selectedSlotId);
        if (attach) {
            attach.zLevel = parseInt(inputZLevel.value) || 0;
            renderActiveDollTree();
            requestRender();
        }
    });

    // Убрать из сборки куклы
    btnDeleteSlot.addEventListener('click', () => {
        const activeDoll = getSelectedDoll();
        if (!activeDoll || state.selectedSlotId === 'root') return;

        activeDoll.attachments = activeDoll.attachments.filter(a => a.sprite_id !== state.selectedSlotId);
        state.selectedSlotId = 'root';
        renderDollTree();
        requestRender();
    });
}
// Добавить в самый конец функции initDoll() в js/components/ui-doll.js
window.addEventListener('spritesUpdated', () => {
    renderDollTree();
});
