export const state = {
    currentMode: 'templates', // templates | sprites | skeletons
    img: null,
    imgName: "Изображение не загружено",
    activeTool: 'draw',
    
    project: {
        jointTags: ['root', 'head', 'weapon_slot'],
        templates: [
            { id: 't_1', name: 'Базовый Гуманоид', points: [], joints: [], pivot: {x:0, y:0} }
        ],
        sprites: [],
        dolls: [
            { 
                id: 'd_1', 
                name: 'Красный Дракон', 
                attachments: [] 
            }
        ]
    },

    selectedTemplateId: 't_1',
    selectedSpriteId: null,
    
    selectedDollId: 'd_1',   
    selectedSlotId: 'root',  

    camera: { scale: 1, panX: 0, panY: 0 },
    mouseImgX: 0, mouseImgY: 0
};

// ==========================================
// ФУНКЦИИ ИЗМЕНЕНИЯ СОСТОЯНИЯ (ЭКСПОРТЫ)
// ==========================================

export function getSelectedTemplate() {
    return state.project.templates.find(t => t.id === state.selectedTemplateId);
}

export function getSelectedDoll() {
    return state.project.dolls.find(d => d.id === state.selectedDollId);
}

// ВОТ ФУНКЦИЯ, КОТОРУЮ ТРЕБОВАЛ UI-TAGS.JS
export function addJointTag(tagName) {
    if (tagName && !state.project.jointTags.includes(tagName)) {
        state.project.jointTags.push(tagName);
        return true;
    }
    return false;
}

export function createTemplate(name) {
    const id = 't_' + Date.now();
    state.project.templates.push({ id, name, points: [], joints: [], pivot: {x:0, y:0} });
    state.selectedTemplateId = id;
    return id;
}
// Добавить в самый конец js/state.js

// Вычисляет абсолютные (мировые) координаты для любого узла куклы
export function getAttachmentWorldPos(attach, activeDoll) {
    if (!attach) return { x: 0, y: 0 };
    
    // Если привязано к ROOT или родителем является он сам (защита)
    if (!attach.parent_slot || attach.parent_slot === 'root' || attach.parent_slot === attach.id) {
        return { x: attach.localX || 0, y: attach.localY || 0 };
    }

    const parentAttach = activeDoll.attachments.find(a => a.id === attach.parent_slot);
    if (!parentAttach) {
        return { x: attach.localX || 0, y: attach.localY || 0 };
    }

    // Рекурсивно получаем позицию родителя
    const parentPos = getAttachmentWorldPos(parentAttach, activeDoll);

    // Находим джоинт родителя
    const parentSprite = state.project.sprites.find(s => s.id === parentAttach.sprite_id);
    const parentTpl = parentSprite ? state.project.templates.find(t => t.id === parentSprite.template_ref) : null;
    
    let jX = 0, jY = 0;
    if (parentTpl && parentTpl.joints && attach.parent_joint) {
        const joint = parentTpl.joints.find(j => j.name === attach.parent_joint);
        if (joint) { jX = joint.x; jY = joint.y; }
    }

    return {
        x: parentPos.x + jX + (attach.localX || 0),
        y: parentPos.y + jY + (attach.localY || 0)
    };
}

// Защитная функция: проверяет, является ли узел 'potentialParent' потомком для 'currentSlot'
export function isChildOf(potentialParentId, currentSlotId, activeDoll) {
    if (potentialParentId === 'root' || !potentialParentId) return false;
    if (potentialParentId === currentSlotId) return true;

    const parent = activeDoll.attachments.find(a => a.id === potentialParentId);
    if (!parent) return false;

    return isChildOf(parent.parent_slot, currentSlotId, activeDoll);
}



if(2==2) {
    console.log("2=2"   ); //asasasasas
}