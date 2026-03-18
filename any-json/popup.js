class AnyJsonManager {
    constructor() {
        this.fields = [];
        this.fieldsContainer = document.getElementById('fieldsContainer');
        this.statusElement = document.getElementById('saveStatus');
        this.importFileElement = document.getElementById('importFile');
        this.debouncedSave = this.debounce(() => this.saveData(true), 600);

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
    }

    setupEventListeners() {
        this.fieldsContainer.addEventListener('click', (event) => {
            const copyButton = event.target.closest('.copy-btn');
            if (!copyButton) return;

            const index = Number(copyButton.dataset.index);
            this.copyFieldValue(index, copyButton);
        });

        this.fieldsContainer.addEventListener('input', (event) => {
            const input = event.target.closest('.field-input');
            if (!input) return;

            const index = Number(input.dataset.index);
            if (Number.isNaN(index) || !this.fields[index]) return;

            this.fields[index].value = input.value;
            this.debouncedSave();
        });

        this.fieldsContainer.addEventListener('focusin', (event) => {
            const input = event.target.closest('.field-input');
            if (!input) return;
            input.select();
        });

        this.fieldsContainer.addEventListener('click', (event) => {
            const input = event.target.closest('.field-input');
            if (!input) return;
            input.select();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            if (this.fields.length > 0) {
                const shouldContinue = window.confirm(
                    'Importing a new file will overwrite your current panel data. Continue?'
                );
                if (!shouldContinue) {
                    return;
                }
            }
            this.importFileElement.click();
        });

        this.importFileElement.addEventListener('change', (event) => {
            this.importData(event.target.files[0]);
        });
    }

    renderFields() {
        if (this.fields.length === 0) {
            this.fieldsContainer.innerHTML = '<div class="empty-state">No data loaded yet. Click Import JSON to begin.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        this.fields.forEach((field, index) => {
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'field-group';

            const fieldRow = document.createElement('div');
            fieldRow.className = 'field-row';

            const label = document.createElement('label');
            label.textContent = field.path;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'field-input';
            input.value = field.value;
            input.dataset.index = String(index);
            input.placeholder = 'Value';

            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.dataset.index = String(index);
            copyButton.textContent = 'Copy';

            fieldRow.appendChild(label);
            fieldRow.appendChild(input);
            fieldRow.appendChild(copyButton);
            fieldGroup.appendChild(fieldRow);
            fragment.appendChild(fieldGroup);
        });

        this.fieldsContainer.innerHTML = '';
        this.fieldsContainer.appendChild(fragment);
    }

    async copyFieldValue(index, buttonElement) {
        const field = this.fields[index];
        if (!field) {
            this.showCopyFeedback(buttonElement, 'Failed', 'error');
            return;
        }

        const text = field.value ?? '';
        if (text.trim().length === 0) {
            this.showCopyFeedback(buttonElement, 'Empty!', 'error');
            return;
        }

        let autoPasted = false;
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'autoPaste',
                    text: text
                });
                autoPasted = response?.success || false;
            }
        } catch (err) {
            console.log('Auto-paste not available:', err.message);
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(buttonElement, autoPasted ? 'Pasted!' : 'Copied!', 'success');
        } catch (err) {
            console.error('Clipboard write failed:', err);
            this.fallbackCopy(text, buttonElement, autoPasted);
        }
    }

    fallbackCopy(text, buttonElement, autoPasted = false) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showCopyFeedback(buttonElement, autoPasted ? 'Pasted!' : 'Copied!', 'success');
        } catch (err) {
            this.showCopyFeedback(buttonElement, 'Failed', 'error');
        }

        document.body.removeChild(textArea);
    }

    showCopyFeedback(buttonElement, message, type) {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = message;
        buttonElement.classList.add('copied');

        if (type === 'error') {
            buttonElement.style.backgroundColor = '#dc3545';
        }

        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
            if (type === 'error') {
                buttonElement.style.backgroundColor = '';
            }
        }, 1500);
    }

    showStatus(message, type) {
        this.statusElement.textContent = message;
        this.statusElement.className = `save-status ${type}`;

        setTimeout(() => {
            this.statusElement.textContent = '';
            this.statusElement.className = 'save-status';
        }, 3000);
    }

    async saveData(silent = false) {
        try {
            await chrome.storage.sync.set({
                anyJsonState: {
                    fields: this.fields,
                    updatedAt: new Date().toISOString()
                }
            });

            if (!silent) {
                this.showStatus('Data saved', 'success');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (!silent) {
                this.showStatus('Failed to save data', 'error');
            }
        }
    }

    async loadData() {
        try {
            const result = await chrome.storage.sync.get('anyJsonState');
            const savedFields = result?.anyJsonState?.fields;

            if (Array.isArray(savedFields)) {
                this.fields = savedFields
                    .filter((item) => item && typeof item.path === 'string')
                    .map((item) => ({
                        path: item.path,
                        value: typeof item.value === 'string' ? item.value : String(item.value ?? '')
                    }));
            }

            this.renderFields();
        } catch (error) {
            console.error('Load error:', error);
            this.renderFields();
        }
    }

    async exportData() {
        if (this.fields.length === 0) {
            this.showStatus('No data to export', 'warning');
            return;
        }

        try {
            const exportPayload = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    extensionName: 'Any JSON Quick Copy',
                    format: 'flat-fields-v1'
                },
                fields: this.fields
            };

            const jsonString = JSON.stringify(exportPayload, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `any-json-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);

            this.showStatus('Exported JSON successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showStatus('Export failed', 'error');
        }
    }

    async importData(file) {
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showStatus('Please select a JSON file', 'error');
            this.importFileElement.value = '';
            return;
        }

        try {
            const rawText = await file.text();
            const parsed = JSON.parse(rawText);

            let importedFields;

            if (parsed && Array.isArray(parsed.fields) && parsed.metadata) {
                importedFields = parsed.fields
                    .filter((item) => item && typeof item.path === 'string')
                    .map((item) => ({
                        path: item.path,
                        value: typeof item.value === 'string' ? item.value : String(item.value ?? '')
                    }));
            } else {
                importedFields = this.flattenJson(parsed);
            }

            if (importedFields.length === 0) {
                this.showStatus('JSON did not produce any fields', 'warning');
                this.importFileElement.value = '';
                return;
            }

            this.fields = importedFields;
            this.renderFields();
            await this.saveData(true);
            this.showStatus(`Imported ${importedFields.length} fields`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            this.showStatus('Invalid JSON file', 'error');
        }

        this.importFileElement.value = '';
    }

    flattenJson(data) {
        const fields = [];

        const walk = (value, path) => {
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    fields.push({
                        path: path || '(root)',
                        value: '[]'
                    });
                    return;
                }

                value.forEach((item, index) => {
                    const nextPath = path ? `${path}[${index}]` : `[${index}]`;
                    walk(item, nextPath);
                });
                return;
            }

            if (value !== null && typeof value === 'object') {
                const keys = Object.keys(value);
                if (keys.length === 0) {
                    fields.push({
                        path: path || '(root)',
                        value: '{}'
                    });
                    return;
                }

                keys.forEach((key) => {
                    const nextPath = path ? `${path}.${key}` : key;
                    walk(value[key], nextPath);
                });
                return;
            }

            const textValue = typeof value === 'string' ? value : JSON.stringify(value);
            fields.push({
                path: path || '(root)',
                value: textValue === undefined ? '' : textValue
            });
        };

        walk(data, '');
        return fields;
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnyJsonManager();
});
