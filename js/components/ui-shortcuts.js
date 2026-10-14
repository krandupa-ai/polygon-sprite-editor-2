import { state, getSelectedTemplate } from '../state.js';
import { requestRender } from '../viewport/renderer.js';

export function initShortcuts() {
    window.addEventListener('keydown', (e) => {
        // ЗАЩИТА: Если пользователь сейчас пишет имя тега в текстовом поле,
        // игнорируем горячие клавиши, чтобы не сбросить контур при нажатии Backspace/Escape
        if (document.activeElement.tagName === 'INPUT') {
            return;
        }

        const activeTemplate = getSelectedTemplate();
        if (!activeTemplate || activeTemplate.points.length === 0) return;

        // Переменная для фиксации — изменились ли данные
        let updated = false;

        // 1. Способ А: Нажатие Ctrl + Z
        const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z';
        
        // 2. Способ Б: Нажатие Escape, Delete или Backspace
        const isDeleteKey = e.key === 'Escape' || e.key === 'Delete' || e.key === 'Backspace';

        if (isCtrlZ || isDeleteKey) {
            e.preventDefault(); // Отменяем стандартное действие браузера (например, шаг назад)
            
            // Удаляем самую последнюю точку из массива
            activeTemplate.points.pop();
            updated = true;
        }

        // Если контур изменился, обновляем UI и холст
        if (updated) {
            // Оповещаем список шаблонов, чтобы обновилось количество точек на кнопке
            const event = new CustomEvent('templateUpdated');
            window.dispatchEvent(event);
            
            requestRender();
        }
    });
}
