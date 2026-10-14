import { state } from '../state.js';
import { requestRender } from '../viewport/renderer.js';

export function renderSprites() {
    const spriteListUI = document.getElementById('spriteList');
    const inspector = document.getElementById('spriteInspector');
    const spriteHint = document.getElementById('spriteHint');
    
    if (!spriteListUI) return;
    spriteListUI.innerHTML = '';

    // Если спрайтов нет, показываем подсказку
    if (state.project.sprites.length === 0) {
        inspector.style.display = 'none';
        if (spriteHint) spriteHint.style.display = 'block';
        return;
    }

    // Рендерим список
    state.project.sprites.forEach(sprite => {
        const div = document.createElement('div');
        div.className = `list-item ${sprite.id === state.selectedSpriteId ? 'selected' : ''}`;
        
        // Находим имя шаблона для красивого отображения в списке
        const template = state.project.templates.find(t => t.id === sprite.template_ref);
        const templateName = template ? template.name : 'Неизвестно';

        div.innerHTML = `<span>${sprite.name}</span> <span style="font-size:10px; opacity:0.5;">[${templateName}]</span>`;
        
        div.addEventListener('click', () => {
            state.selectedSpriteId = sprite.id;
            renderSprites();
            updateInspector();
            requestRender();
        });
        
        spriteListUI.appendChild(div);
    });

    updateInspector();
}

// Функция обновления данных внутри инспектора свойств
function updateInspector() {
    const inspector = document.getElementById('spriteInspector');
    const spriteHint = document.getElementById('spriteHint');
    const inputName = document.getElementById('inspectorSpriteName');
    const inputTemplate = document.getElementById('inspectorTemplateRef');

    const selectedSprite = state.project.sprites.find(s => s.id === state.selectedSpriteId);

    if (!selectedSprite) {
        inspector.style.display = 'none';
        if (spriteHint) spriteHint.style.display = 'block';
        return;
    }

    // Показываем инспектор, скрываем общую подсказку
    inspector.style.display = 'block';
    if (spriteHint) spriteHint.style.display = 'none';

    // Заполняем поля данными
    inputName.value = selectedSprite.name;
    
    const template = state.project.templates.find(t => t.id === selectedSprite.template_ref);
    inputTemplate.value = template ? template.name : 'Ошибка ссылки';
}

export function initSprites() {
    const inputName = document.getElementById('inspectorSpriteName');
    const btnDeleteSprite = document.getElementById('btnDeleteSprite');

    console.log("initSprites() called");

    // Следим за вводом текста: меняем имя спрайта в памяти на лету при наборе букв
    inputName.addEventListener('input', () => {
        const selectedSprite = state.project.sprites.find(s => s.id === state.selectedSpriteId);
        if (selectedSprite) {
            selectedSprite.name = inputName.value.trim() || 'unnamed_sprite';
            
            // Перерисовываем ТОЛЬКО текст в списке спрайтов, чтобы не сбивать фокус ввода (инпут)
            const activeItem = document.querySelector('#spriteList .list-item.selected span');
            if (activeItem) activeItem.textContent = selectedSprite.name;
        }

       
    });

    // Удаление спрайта из проекта
    btnDeleteSprite.addEventListener('click', () => {
        console.log("Delete Sprite button clicked");
        if (!state.selectedSpriteId) return;
        
        state.project.sprites = state.project.sprites.filter(s => s.id !== state.selectedSpriteId);
        state.selectedSpriteId = state.project.sprites.length > 0 ? state.project.sprites[0].id : null;
        
        renderSprites();
        requestRender();
        console.log(  state.project.sprites.length + " sprites remaining after deletion.");
    });

        // Добавить в самый конец функции initSprites() в js/components/ui-sprites.js:
    window.addEventListener('spritesUpdated', () => {
        renderSprites();
    });

}
