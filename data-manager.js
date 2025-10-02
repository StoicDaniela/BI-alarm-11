// data-manager.js - Business Logic for BI Anomaly Detection System

class DataManager {
    constructor() {
        this.storageKeys = {
            data: 'biSystemData',
            alerts: 'biSystemAlerts', 
            settings: 'biSystemSettings'
        };
        this.initializeSettings();
    }

    // Initialize default settings
    initializeSettings() {
        const defaultSettings = {
            sales: {
                minThreshold: 1000,
                maxThreshold: 50000,
                percentChange: 20
            },
            traffic: {
                minThreshold: 100,
                maxThreshold: 10000,
                percentChange: 30
            },
            production: {
                minThreshold: 50,
                maxThreshold: 1000,
                percentChange: 25
            },
            financial: {
                minThreshold: 5000,
                maxThreshold: 100000,
                percentChange: 15
            },
            autoScanInterval: 3600 // 1 hour in seconds
        };

        const existingSettings = this.getSettings();
        if (!existingSettings || Object.keys(existingSettings).length === 0) {
            this.saveSettings(defaultSettings);
        }
    }

    // Data Management Methods
    getAllData() {
        const data = localStorage.getItem(this.storageKeys.data);
        return data ? JSON.parse(data) : [];
    }

    addDataEntry(entry) {
        const data = this.getAllData();
        entry.id = entry.id || Date.now();
        entry.timestamp = entry.timestamp || new Date().toISOString();
        data.push(entry);
        localStorage.setItem(this.storageKeys.data, JSON.stringify(data));
        
        // Log the action
        console.log('Добавен запис:', entry);
        
        return entry;
    }

    deleteDataEntry(id) {
        const data = this.getAllData();
        const filteredData = data.filter(entry => entry.id !== id);
        localStorage.setItem(this.storageKeys.data, JSON.stringify(filteredData));
        
        console.log('Изтрит запис с ID:', id);
        
        return filteredData;
    }

    getDataByType(type) {
        const data = this.getAllData();
        return data.filter(entry => entry.type === type);
    }

    getDataByDateRange(startDate, endDate) {
        const data = this.getAllData();
        return data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
    }

    // Alert Management Methods
    getAllAlerts() {
        const alerts = localStorage.getItem(this.storageKeys.alerts);
        return alerts ? JSON.parse(alerts) : [];
    }

    addAlert(alert) {
        const alerts = this.getAllAlerts();
        alert.id = alert.id || Date.now();
        alert.timestamp = alert.timestamp || new Date().toISOString();
        alert.read = alert.read || false;
        alerts.unshift(alert); // Add to beginning
        localStorage.setItem(this.storageKeys.alerts, JSON.stringify(alerts));
        
        console.log('Добавен алерт:', alert);
        
        return alert;
    }

    markAlertAsRead(id) {
        const alerts = this.getAllAlerts();
        const alert = alerts.find(a => a.id === id);
        if (alert) {
            alert.read = true;
            localStorage.setItem(this.storageKeys.alerts, JSON.stringify(alerts));
        }
        return alerts;
    }

    markAllAlertsAsRead() {
        const alerts = this.getAllAlerts();
        alerts.forEach(alert => alert.read = true);
        localStorage.setItem(this.storageKeys.alerts, JSON.stringify(alerts));
        return alerts;
    }

    clearAllAlerts() {
        localStorage.setItem(this.storageKeys.alerts, JSON.stringify([]));
        console.log('Изчистени всички алерти');
        return [];
    }

    deleteAlert(id) {
        const alerts = this.getAllAlerts();
        const filteredAlerts = alerts.filter(alert => alert.id !== id);
        localStorage.setItem(this.storageKeys.alerts, JSON.stringify(filteredAlerts));
        return filteredAlerts;
    }

    // Settings Management Methods
    getSettings() {
        const settings = localStorage.getItem(this.storageKeys.settings);
        return settings ? JSON.parse(settings) : {};
    }

    saveSettings(settings) {
        localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
        console.log('Настройките са запазени:', settings);
        return settings;
    }

    resetSettings() {
        localStorage.removeItem(this.storageKeys.settings);
        this.initializeSettings();
        return this.getSettings();
    }

    // Anomaly Detection Methods
    runAnomalyCheck() {
        const data = this.getAllData();
        const settings = this.getSettings();
        const alerts = [];

        console.log('Започвам проверка за аномалии...');

        // Group data by type
        const dataByType = {};
        data.forEach(entry => {
            if (!dataByType[entry.type]) {
                dataByType[entry.type] = [];
            }
            dataByType[entry.type].push(entry);
        });

        // Check each data type
        Object.keys(dataByType).forEach(type => {
            const typeData = dataByType[type];
            const typeSettings = settings[type];

            if (!typeSettings) {
                console.warn(`Няма настройки за тип: ${type}`);
                return;
            }

            // Sort by date
            typeData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Check threshold violations
            typeData.forEach(entry => {
                if (entry.value < typeSettings.minThreshold) {
                    alerts.push({
                        type: 'threshold',
                        severity: 'high',
                        dataType: type,
                        message: `Стойността ${entry.value} е под минималния праг ${typeSettings.minThreshold}`,
                        data: entry,
                        date: entry.date
                    });
                }

                if (entry.value > typeSettings.maxThreshold) {
                    alerts.push({
                        type: 'threshold',
                        severity: 'high',
                        dataType: type,
                        message: `Стойността ${entry.value} е над максималния праг ${typeSettings.maxThreshold}`,
                        data: entry,
                        date: entry.date
                    });
                }
            });

            // Check percentage changes
            for (let i = 1; i < typeData.length; i++) {
                const current = typeData[i];
                const previous = typeData[i - 1];
                
                const change = ((current.value - previous.value) / previous.value) * 100;
                const absChange = Math.abs(change);

                if (absChange > typeSettings.percentChange) {
                    const direction = change > 0 ? 'увеличение' : 'намаление';
                    alerts.push({
                        type: 'percentage',
                        severity: absChange > typeSettings.percentChange * 2 ? 'high' : 'medium',
                        dataType: type,
                        message: `${direction.charAt(0).toUpperCase() + direction.slice(1)} от ${absChange.toFixed(1)}% между ${previous.date} и ${current.date}`,
                        data: { current, previous, change: absChange },
                        date: current.date
                    });
                }
            }
        });

        // Save alerts
        alerts.forEach(alert => this.addAlert(alert));

        console.log(`Открити ${alerts.length} аномалии`);
        
        return alerts;
    }

    // Statistical Methods
    getStatistics() {
        const data = this.getAllData();
        const alerts = this.getAllAlerts();

        return {
            totalRecords: data.length,
            totalAlerts: alerts.length,
            unreadAlerts: alerts.filter(a => !a.read).length,
            highSeverityAlerts: alerts.filter(a => a.severity === 'high').length,
            mediumSeverityAlerts: alerts.filter(a => a.severity === 'medium').length,
            lowSeverityAlerts: alerts.filter(a => a.severity === 'low').length,
            dataByType: this.getDataCountByType(),
            lastCheck: this.getLastCheckTime(),
            storageUsage: this.getStorageUsage()
        };
    }

    getDataCountByType() {
        const data = this.getAllData();
        const counts = {};
        
        data.forEach(entry => {
            counts[entry.type] = (counts[entry.type] || 0) + 1;
        });
        
        return counts;
    }

    getLastCheckTime() {
        const alerts = this.getAllAlerts();
        if (alerts.length === 0) return null;
        
        return new Date(alerts[0].timestamp).toLocaleString('bg-BG');
    }

    getStorageUsage() {
        const data = JSON.stringify(this.getAllData());
        const alerts = JSON.stringify(this.getAllAlerts());
        const settings = JSON.stringify(this.getSettings());
        
        const totalSize = data.length + alerts.length + settings.length;
        
        if (totalSize < 1024) {
            return `${totalSize} bytes`;
        } else if (totalSize < 1024 * 1024) {
            return `${(totalSize / 1024).toFixed(2)} KB`;
        } else {
            return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
        }
    }

    // Data Export/Import Methods
    exportAllData() {
        const exportData = {
            data: this.getAllData(),
            alerts: this.getAllAlerts(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `bi-system-backup-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        console.log('Данните са експортирани');
    }

    importData(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (importData.data) {
                localStorage.setItem(this.storageKeys.data, JSON.stringify(importData.data));
            }
            
            if (importData.alerts) {
                localStorage.setItem(this.storageKeys.alerts, JSON.stringify(importData.alerts));
            }
            
            if (importData.settings) {
                localStorage.setItem(this.storageKeys.settings, JSON.stringify(importData.settings));
            }

            console.log('Данните са успешно импортирани');
            return true;
        } catch (error) {
            console.error('Грешка при импорт на данни:', error);
            return false;
        }
    }

    clearAllData() {
        const confirmation = confirm('Сигурни ли сте, че искате да изтриете всички данни? Това действие е необратимо!');
        
        if (confirmation) {
            localStorage.removeItem(this.storageKeys.data);
            localStorage.removeItem(this.storageKeys.alerts);
            
            console.log('Всички данни са изчистени');
            
            // Reinitialize settings
            this.initializeSettings();
            
            return true;
        }
        
        return false;
    }

    // CSV Processing Methods
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const data = [];
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('дата') || lines[0].toLowerCase().includes('date') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (columns.length >= 3) {
                const entry = {
                    date: columns[0],
                    value: parseFloat(columns[1]),
                    type: columns[2],
                    description: columns[3] || ''
                };
                
                // Validate data
                if (entry.date && !isNaN(entry.value) && entry.type) {
                    data.push(entry);
                }
            }
        }
        
        return data;
    }

    // Auto-scan functionality
    initializeAutoScan() {
        const settings = this.getSettings();
        const interval = settings.autoScanInterval;
        
        if (interval && interval > 0) {
            setInterval(() => {
                console.log('Автоматична проверка за аномалии...');
                this.runAnomalyCheck();
            }, interval * 1000);
            
            console.log(`Автоматично сканиране активирано: всеки ${interval} секунди`);
        }
    }

    // Utility methods
    formatCurrency(value) {
        return new Intl.NumberFormat('bg-BG', {
            style: 'currency',
            currency: 'BGN'
        }).format(value);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('bg-BG').format(value);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('bg-BG');
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('bg-BG');
    }
}

// Create global instance
const dataManager = new DataManager();

// Global functions for backward compatibility
function addDataEntry(entry) {
    return dataManager.addDataEntry(entry);
}

function runAnomalyCheck() {
    return dataManager.runAnomalyCheck();
}

function clearAllAlerts() {
    return dataManager.clearAllAlerts();
}

function markAllAlertsRead() {
    return dataManager.markAllAlertsAsRead();
}

function saveSettings() {
    const settings = {
        sales: {
            minThreshold: parseFloat(document.getElementById('salesMinThreshold').value),
            maxThreshold: parseFloat(document.getElementById('salesMaxThreshold').value),
            percentChange: parseFloat(document.getElementById('salesPercentChange').value)
        },
        traffic: {
            minThreshold: parseFloat(document.getElementById('trafficMinThreshold').value),
            maxThreshold: parseFloat(document.getElementById('trafficMaxThreshold').value),
            percentChange: parseFloat(document.getElementById('trafficPercentChange').value)
        },
        production: {
            minThreshold: parseFloat(document.getElementById('productionMinThreshold').value),
            maxThreshold: parseFloat(document.getElementById('productionMaxThreshold').value),
            percentChange: parseFloat(document.getElementById('productionPercentChange').value)
        },
        financial: {
            minThreshold: parseFloat(document.getElementById('financialMinThreshold').value),
            maxThreshold: parseFloat(document.getElementById('financialMaxThreshold').value),
            percentChange: parseFloat(document.getElementById('financialPercentChange').value)
        },
        autoScanInterval: parseInt(document.getElementById('autoScanInterval').value)
    };
    
    dataManager.saveSettings(settings);
    showAlert('Настройките са запазени успешно!', 'success');
}

function resetSettings() {
    dataManager.resetSettings();
    loadSettings();
    showAlert('Настройките са възстановени по подразбиране!', 'success');
}

function loadSettings() {
    const settings = dataManager.getSettings();
    
    if (settings.sales) {
        document.getElementById('salesMinThreshold').value = settings.sales.minThreshold;
        document.getElementById('salesMaxThreshold').value = settings.sales.maxThreshold;
        document.getElementById('salesPercentChange').value = settings.sales.percentChange;
    }
    
    if (settings.traffic) {
        document.getElementById('trafficMinThreshold').value = settings.traffic.minThreshold;
        document.getElementById('trafficMaxThreshold').value = settings.traffic.maxThreshold;
        document.getElementById('trafficPercentChange').value = settings.traffic.percentChange;
    }
    
    if (settings.production) {
        document.getElementById('productionMinThreshold').value = settings.production.minThreshold;
        document.getElementById('productionMaxThreshold').value = settings.production.maxThreshold;
        document.getElementById('productionPercentChange').value = settings.production.percentChange;
    }
    
    if (settings.financial) {
        document.getElementById('financialMinThreshold').value = settings.financial.minThreshold;
        document.getElementById('financialMaxThreshold').value = settings.financial.maxThreshold;
        document.getElementById('financialPercentChange').value = settings.financial.percentChange;
    }
    
    if (settings.autoScanInterval !== undefined) {
        document.getElementById('autoScanInterval').value = settings.autoScanInterval;
    }
}

function exportAllData() {
    dataManager.exportAllData();
}

function clearAllData() {
    if (dataManager.clearAllData()) {
        updateDashboard();
        updateDataTable();
        updateAlertsList();
        showAlert('Всички данни са изчистени!', 'success');
    }
}

function backupSystem() {
    dataManager.exportAllData();
    showAlert('Backup файлът е създаден и свален!', 'success');
}

function viewSystemLogs() {
    const stats = dataManager.getStatistics();
    const logWindow = window.open('', '_blank', 'width=600,height=400');
    logWindow.document.write(`
        <html>
        <head><title>Системни Логове</title></head>
        <body style="font-family: monospace; padding: 20px;">
        <h2>Системна Информация</h2>
        <pre>
Общо записи: ${stats.totalRecords}
Общо алерти: ${stats.totalAlerts}
Непрочетени алерти: ${stats.unreadAlerts}
Използвано място: ${stats.storageUsage}
Последна проверка: ${stats.lastCheck || 'Никога'}

Данни по тип:
${Object.entries(stats.dataByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Генериран на: ${new Date().toLocaleString('bg-BG')}
        </pre>
        </body>
        </html>
    `);
}

function initializeAutoScan() {
    dataManager.initializeAutoScan();
}

console.log('Data Manager инициализиран успешно!');