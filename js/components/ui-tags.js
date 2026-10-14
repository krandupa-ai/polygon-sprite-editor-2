import { state, addJointTag } from '../state.js';

// Добавляем слово export перед функцией, чтобы сделать её доступной извне
export function renderJointTags() {
    const jointTagListUI = document.getElementById('jointTagList');
    if (!jointTagListUI) return;
    
    jointTagListUI.innerHTML = '';
    state.project.jointTags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.cursor = 'default';
        div.innerHTML = `<span>🏷️ ${tag}</span>`;
        jointTagListUI.appendChild(div);
    });
}

export function initTags() {
    const newTagInput = document.getElementById('newTagInput');
    const btnAddTag = document.getElementById('btnAddTag');

    btnAddTag.addEventListener('click', () => {
        const tagName = newTagInput.value.trim();
        if (tagName) {
            const success = addJointTag(tagName);
            if (success) {
                newTagInput.value = '';
                renderJointTags();
            } else {
                alert('Такой тег уже существует!');
            }
        }
    });

    newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnAddTag.click();
    });

    renderJointTags();
}
