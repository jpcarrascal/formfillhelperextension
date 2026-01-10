// Band Info Quick Copy Extension
class BandInfoManager {
    constructor() {
        this.fields = [
            'bandName', 'website', 'contactEmail',
            'shortBio', 'longBio', 
            'instagram', 'facebook', 'youtube',
            'spotify', 'soundcloud', 'bandcamp', 'song1', 'song2',
            'youtube1', 'youtube2', 'photo1', 'photo2',
            'bookingContact', 'genre', 'country', 'stateProvince', 'city',
            'other1', 'other2', 'other3', 'other4', 'other5',
            'other6', 'other7', 'other8', 'other9', 'other10'
        ];
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Copy button listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldName = e.target.dataset.field;
                this.copyToClipboard(fieldName, e.target);
            });
        });

        // Save button listener
        document.getElementById('saveData').addEventListener('click', () => {
            this.saveData();
        });

        // Export button listener
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Import button listener
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import file listener
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Import button listener
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import file listener
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Auto-save on input change (with debounce)
        this.fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                element.addEventListener('input', this.debounce(() => {
                    this.saveData(true); // Silent save
                }, 1000));
                
                // Auto-select text on click for easy drag and drop
                element.addEventListener('click', () => {
                    element.select();
                });
                
                // Also select on focus for keyboard navigation
                element.addEventListener('focus', () => {
                    element.select();
                });
            }
        });
    }

    async copyToClipboard(fieldName, buttonElement) {
        const element = document.getElementById(fieldName);
        const text = element.value.trim();
        
        if (!text) {
            this.showCopyFeedback(buttonElement, 'Empty!', 'error');
            return;
        }

        // Try to auto-paste into focused field on the webpage
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
            // Content script might not be loaded yet, or we're on a restricted page
            console.log('Auto-paste not available:', err.message);
        }

        // Always copy to clipboard regardless of auto-paste success
        try {
            await navigator.clipboard.writeText(text);
            // Show different feedback based on whether auto-paste worked
            if (autoPasted) {
                this.showCopyFeedback(buttonElement, 'Pasted!', 'success');
            } else {
                this.showCopyFeedback(buttonElement, 'Copied!', 'success');
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
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
            if (autoPasted) {
                this.showCopyFeedback(buttonElement, 'Pasted!', 'success');
            } else {
                this.showCopyFeedback(buttonElement, 'Copied!', 'success');
            }
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

    async saveData(silent = false) {
        const data = {};
        
        this.fields.forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                data[fieldName] = element.value;
            }
        });

        try {
            await chrome.storage.sync.set({ bandInfo: data });
            
            if (!silent) {
                this.showSaveStatus('✅ Data saved successfully!', 'success');
            }
        } catch (err) {
            console.error('Failed to save data: ', err);
            this.showSaveStatus('❌ Failed to save data', 'error');
        }
    }

    async exportData() {
        try {
            const result = await chrome.storage.sync.get('bandInfo');
            const data = result.bandInfo || {};
            
            // Add metadata
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: "1.0",
                    extensionName: "Band Info Quick Copy"
                },
                bandData: data
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `band-info-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSaveStatus('✅ Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showSaveStatus('❌ Error exporting data', 'error');
        }
    }

    async importData(file) {
        if (!file) {
            this.showSaveStatus('❌ No file selected', 'error');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showSaveStatus('❌ Please select a JSON file', 'error');
            return;
        }

        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            // Check if it's our format with metadata
            let bandData;
            if (importData.metadata && importData.bandData) {
                bandData = importData.bandData;
            } else {
                // Assume it's raw band data
                bandData = importData;
            }
            
            // Validate and populate fields
            let importedCount = 0;
            this.fields.forEach(fieldName => {
                const element = document.getElementById(fieldName);
                if (element && bandData[fieldName]) {
                    element.value = bandData[fieldName];
                    importedCount++;
                }
            });
            
            if (importedCount > 0) {
                // Save the imported data
                await this.saveData(true);
                this.showSaveStatus(`✅ Imported ${importedCount} fields successfully!`, 'success');
            } else {
                this.showSaveStatus('⚠️ No valid band data found in file', 'warning');
            }
            
        } catch (error) {
            console.error('Import error:', error);
            this.showSaveStatus('❌ Error importing data. Invalid JSON format.', 'error');
        }
        
        // Reset file input
        document.getElementById('importFile').value = '';
    }

    async loadData() {
        try {
            const result = await chrome.storage.sync.get('bandInfo');
            const data = result.bandInfo || {};
            
            this.fields.forEach(fieldName => {
                const element = document.getElementById(fieldName);
                if (element && data[fieldName]) {
                    element.value = data[fieldName];
                }
            });
        } catch (err) {
            console.error('Failed to load data: ', err);
        }
    }

    showSaveStatus(message, type) {
        const statusElement = document.getElementById('saveStatus');
        statusElement.textContent = message;
        statusElement.className = `save-status ${type}`;
        
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'save-status';
        }, 3000);
    }

    // Utility function to debounce input events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BandInfoManager();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('saveData').click();
    }
});