// Content script for auto-pasting into focused form fields
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoPaste') {
        const success = autoPasteToFocusedField(request.text);
        sendResponse({ success: success });
    }
    return true;
});

function autoPasteToFocusedField(text) {
    const activeElement = document.activeElement;

    if (!activeElement || !isTextInput(activeElement)) {
        return false;
    }

    try {
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const currentValue = activeElement.value;

            activeElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);

            const newCursorPos = start + text.length;
            activeElement.selectionStart = newCursorPos;
            activeElement.selectionEnd = newCursorPos;

            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));

            return true;
        }

        if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));

                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);

                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));

                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Auto-paste error:', error);
        return false;
    }
}

function isTextInput(element) {
    if (!element) return false;

    if (element.isContentEditable) {
        return true;
    }

    if (element.tagName === 'TEXTAREA') {
        return true;
    }

    if (element.tagName === 'INPUT') {
        const type = (element.type || 'text').toLowerCase();
        const textInputTypes = [
            'text', 'email', 'url', 'tel', 'search',
            'password', 'number', 'date', 'datetime-local',
            'month', 'time', 'week'
        ];
        return textInputTypes.includes(type);
    }

    return false;
}
