import { state } from './state.js';
import { initTabs } from './components/ui-tabs.js';
import { initTags } from './components/ui-tags.js';
import { initTemplates } from './components/ui-templates.js';
import { initShortcuts } from './components/ui-shortcuts.js';
import { initIO } from './components/ui-io.js'; // Импортируем модуль сохранения
import { initCamera } from './viewport/camera.js';
import { initRenderer } from './viewport/renderer.js';
// Вверху js/app.js добавляем импорт:
import { initSprites } from './components/ui-sprites.js';
import { initDoll } from './components/ui-doll.js'; 


document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем модули интерфейса
    initTabs();
    initTags();
    initTemplates();
    initShortcuts();
    initIO(); // Запускаем сохранение/загрузку
    initSprites();
    // Инициализируем холст и камеру
    initCamera();
    initRenderer();
    initDoll(); // Инициализируем модуль куклы
    
    // ЗАЩИТА: Запрещаем кликам по UI проваливаться на холст
    const uiElements = document.querySelectorAll('.toolbar, .sidebar');
    uiElements.forEach(element => {
        element.addEventListener('mousedown', (e) => e.stopPropagation());
        element.addEventListener('mouseup', (e) => e.stopPropagation());
        element.addEventListener('click', (e) => e.stopPropagation());
    });
    
    console.log("Polygon Sprite Editor успешно инициализирован модульно!");
});





// Внизу js/app.js добавляем обработку события изменения размера окна
window.addEventListener('resize', () => {
    // Обновляем размеры холста и камеры при изменении размера окна     
    const canvas = document.getElementById('viewport');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }       

    // Обновляем камеру
    if (state.camera) {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
    }

    // Обновляем рендерер
    if (state.renderer) {
        state.renderer.setSize(window.innerWidth, window.innerHeight);
    }

});



// 1212121212

if(1==1){
    console.log("1212121212");
}