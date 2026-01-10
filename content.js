// Content script for auto-pasting into focused form fields
// This script runs on all web pages and listens for messages from the extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoPaste') {
        const success = autoPasteToFocusedField(request.text);
        sendResponse({ success: success });
    }
    return true; // Keep the message channel open for async response
});

/**
 * Attempts to paste text into the currently focused input field
 * @param {string} text - The text to paste
 * @returns {boolean} - True if paste was successful, false otherwise
 */
function autoPasteToFocusedField(text) {
    const activeElement = document.activeElement;
    
    // Check if the active element is a text-accepting input
    if (!activeElement || !isTextInput(activeElement)) {
        return false;
    }
    
    try {
        // For regular input and textarea elements
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const currentValue = activeElement.value;
            
            // Replace selected text or insert at cursor position
            activeElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
            
            // Set cursor position after the inserted text
            const newCursorPos = start + text.length;
            activeElement.selectionStart = newCursorPos;
            activeElement.selectionEnd = newCursorPos;
            
            // Trigger input event so the page knows the value changed
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            return true;
        }
        
        // For contenteditable elements
        if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                
                // Move cursor to end of inserted text
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger input event
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

/**
 * Checks if an element is a text-accepting input field
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - True if the element accepts text input
 */
function isTextInput(element) {
    if (!element) return false;
    
    // Check for contenteditable elements
    if (element.isContentEditable) {
        return true;
    }
    
    // Check for textarea
    if (element.tagName === 'TEXTAREA') {
        return true;
    }
    
    // Check for input elements with text-accepting types
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
