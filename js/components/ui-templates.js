import { state, createTemplate } from '../state.js';
import { requestRender } from '../viewport/renderer.js';

// Добавляем слово export перед функцией
export function renderTemplates() {
    const templateListUI = document.getElementById('templateList');
    if (!templateListUI) return;

    templateListUI.innerHTML = '';
    state.project.templates.forEach(t => {
        const div = document.createElement('div');
        div.className = `list-item ${t.id === state.selectedTemplateId ? 'selected' : ''}`;
        div.innerHTML = `<span>${t.name}</span> <span style="font-size:10px; opacity:0.6;">(${t.points.length} т.)</span>`;
        
        div.addEventListener('click', () => {
            state.selectedTemplateId = t.id;
            renderTemplates();
            requestRender();
        });
        
        templateListUI.appendChild(div);
    });
}

export function initTemplates() {
    const btnCreateTemplate = document.getElementById('btnCreateTemplate');
    const toolDraw = document.getElementById('toolDraw');
    const toolPivot = document.getElementById('toolPivot');
    const toolJoint = document.getElementById('toolJoint');
    const activeTagContainer = document.getElementById('activeTagContainer');
    const activeTagSelect = document.getElementById('activeTagSelect');

    function updateActiveTagSelect() {
        activeTagSelect.innerHTML = '';
        state.project.jointTags.forEach(tag => {
            const opt = document.createElement('option');
            opt.value = tag;
            opt.textContent = tag;
            activeTagSelect.appendChild(opt);
        });
    }

    function setTool(toolName) {
        state.activeTool = toolName;
        toolDraw.classList.toggle('selected', toolName === 'draw');
        toolPivot.classList.toggle('selected', toolName === 'pivot');
        toolJoint.classList.toggle('selected', toolName === 'joint');
        
        activeTagContainer.style.display = toolName === 'joint' ? 'flex' : 'none';
        if (toolName === 'joint') updateActiveTagSelect();
    }

    toolDraw.addEventListener('click', () => setTool('draw'));
    toolPivot.addEventListener('click', () => setTool('pivot'));
    toolJoint.addEventListener('click', () => setTool('joint'));

    btnCreateTemplate.addEventListener('click', () => {
        const name = prompt("Введите имя нового шаблона:", `Шаблон ${state.project.templates.length + 1}`);
        if (name) {
            createTemplate(name);
            renderTemplates();
            requestRender();
        }
    });

    renderTemplates();
}
