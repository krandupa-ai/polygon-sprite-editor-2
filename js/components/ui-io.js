import { state } from '../state.js';
import { requestRender } from '../viewport/renderer.js';
import { renderTemplates } from './ui-templates.js'; // Импортируем функцию напрямую
import { renderJointTags } from './ui-tags.js';      // Импортируем функцию напрямую
import { renderSprites } from './ui-sprites.js';


export function initIO() {
    const btnExport = document.getElementById('btnExport');
    const importInput = document.getElementById('importInput');

    // 1. ЛОГИКА ЭКСПОРТА (СОХРАНЕНИЕ НА ДИСК)
    btnExport.addEventListener('click', () => {
        const savePackage = {
            project_name: "Polygon_Editor_Project",
            jointTags: state.project.jointTags,
            templates: state.project.templates,
            sprites: state.project.sprites
        };

        const jsonString = JSON.stringify(savePackage, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `sprite_project_${Date.now()}.json`;
        
        link.click();
        URL.revokeObjectURL(link.href);
    });

    // 2. ЛОГИКА ИМПОРТА (ЗАГРУЗКА С ДИСКА)
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedData = JSON.parse(event.target.result);
                
                if (!loadedData.templates || !loadedData.jointTags) {
                    throw new Error("Неверный формат файла проекта");
                }

                // Переносим данные в стейт
                state.project.jointTags = loadedData.jointTags;
                state.project.templates = loadedData.templates;
                state.project.sprites = loadedData.sprites || [];
                
                // Выбираем первый шаблон активным, чтобы сразу пошла отрисовка контура
                if (state.project.templates.length > 0) {
                    state.selectedTemplateId = state.project.templates[0].id;
                } else {
                    state.selectedTemplateId = null;
                }

                // ЖЕСТКО ОБНОВЛЯЕМ ИНТЕРФЕЙС ПРЯМЫМИ ВЫЗОВАМИ
                renderTemplates();
                renderJointTags();
                
                // Сбрасываем значение инпута
                importInput.value = '';
                
                // Перерисовываем холст с новыми полигонами
                requestRender();
                alert("Проект успешно загружен!");

            } catch (err) {
                alert(`Ошибка импорта: ${err.message}`);
            }
        };
        reader.readAsText(file);
    });
}
