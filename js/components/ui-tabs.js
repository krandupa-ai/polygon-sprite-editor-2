import { state } from '../state.js';
import { requestRender } from '../viewport/renderer.js';
import { renderSprites } from './ui-sprites.js';
import { renderDollTree } from './ui-doll.js';

export function initTabs() {
    const tabTemplates = document.getElementById('tabTemplates');
    const tabSprites = document.getElementById('tabSprites');
    const tabSkeletons = document.getElementById('tabSkeletons');
    
    // Верхняя панель шаблонов
    const panelGlobalTemplates = document.getElementById('panelGlobalTemplates');
    
    // Нижние блоки панелей
    const panelTemplates = document.getElementById('panelModeTemplates');
    const panelSprites = document.getElementById('panelModeSprites');
    const panelSkeletons = document.getElementById('panelModeSkeletons');

    const btnCreateTemplate = document.getElementById('btnCreateTemplate');
    const templateToolsContainer = document.getElementById('templateToolsContainer');
    const toolDraw = document.getElementById('toolDraw');
    const toolPivot = document.getElementById('toolPivot');
    const toolJoint = document.getElementById('toolJoint');
    const activeTagSelect = document.getElementById('activeTagSelect');

    function switchMode(mode) {
        state.currentMode = mode;
        
        tabTemplates.classList.toggle('active', mode === 'templates');
        tabSprites.classList.toggle('active', mode === 'sprites');
        tabSkeletons.classList.toggle('active', mode === 'skeletons');

        // По умолчанию показываем верхний блок шаблонов (для 1 и 2 режимов)
        panelGlobalTemplates.style.display = 'block';
        panelTemplates.style.display = 'none';
        panelSprites.style.display = 'none';
        panelSkeletons.style.display = 'none';

        if (mode === 'templates') {
            panelTemplates.style.display = 'flex';
            state.activeTool = 'draw';

            btnCreateTemplate.removeAttribute('disabled');
            toolDraw.removeAttribute('disabled'); toolPivot.removeAttribute('disabled'); toolJoint.removeAttribute('disabled');
            activeTagSelect.removeAttribute('disabled');
            btnCreateTemplate.style.opacity = '1'; templateToolsContainer.style.opacity = '1';
        } 
        else if (mode === 'sprites') {
            panelSprites.style.display = 'flex';
            renderSprites();
            state.activeTool = 'stamp';

            // Замораживаем кнопки рисования геометрии во 2-м режиме
            btnCreateTemplate.setAttribute('disabled', 'true');
            toolDraw.setAttribute('disabled', 'true'); toolPivot.setAttribute('disabled', 'true'); toolJoint.setAttribute('disabled', 'true');
            activeTagSelect.setAttribute('disabled', 'true');
            btnCreateTemplate.style.opacity = '0.3'; templateToolsContainer.style.opacity = '0.3';
        } 
        else if (mode === 'skeletons') {
            // ВАЖНО: В 3-м режиме полностью убираем панель шаблонов с экрана!
            panelGlobalTemplates.style.display = 'none';
            
            // Растягиваем дерево куклы на всю высоту сайдбара
            panelSkeletons.style.display = 'flex';
            renderDollTree();
            state.activeTool = 'assemble';
        }
        
        requestRender();
    }

    tabTemplates.addEventListener('click', () => switchMode('templates'));
    tabSprites.addEventListener('click', () => switchMode('sprites'));
    tabSkeletons.addEventListener('click', () => switchMode('skeletons'));
}
