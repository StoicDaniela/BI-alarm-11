// ui-manager.js - User Interface Manager for BI Anomaly Detection System

class UIManager {
    constructor() {
        this.chartColors = {
            primary: '#0D8BB1',
            secondary: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#17a2b8'
        };
        this.csvData = [];
        this.initializeUI();
    }

    initializeUI() {
        console.log('UI Manager инициализиран');
    }

    // Dashboard Management
    updateDashboard() {
        const stats = dataManager.getStatistics();
        
        // Update metric cards
        document.getElementById('totalRecords').textContent = stats.totalRecords;
        document.getElementById('activeAlerts').textContent = stats.unreadAlerts;
        document.getElementById('lastCheck').textContent = stats.lastCheck || '--:--';
        
        // Update changes
        document.getElementById('recordsChange').textContent = `📊 ${stats.totalRecords} записа`;
        document.getElementById('alertsChange').textContent = stats.unreadAlerts > 0 ? 
            `⚠️ ${stats.unreadAlerts} нови` : '✅ Всичко наред';
        document.getElementById('systemStatus').textContent = '🔄 Активно';
        
        // Update admin stats
        document.getElementById('totalDataEntries').textContent = stats.totalRecords;
        document.getElementById('storageUsed').textContent = stats.storageUsage;
        
        // Update alert counts
        document.getElementById('totalAlertsCount').textContent = stats.totalAlerts;
        document.getElementById('highAlertsCount').textContent = stats.highSeverityAlerts;
        document.getElementById('mediumAlertsCount').textContent = stats.mediumSeverityAlerts;
        document.getElementById('lowAlertsCount').textContent = stats.lowSeverityAlerts;
        
        this.updateChart();
        this.updateRecentAlerts();
    }

    updateChart() {
        const chartContainer = document.getElementById('mainChart');
        const data = dataManager.getAllData();
        
        if (data.length === 0) {
            chartContainer.innerHTML = '📊 Графиката ще се покаже тук след добавяне на данни';
            return;
        }

        // Simple text-based chart for now
        const dataByType = {};
        data.forEach(entry => {
            if (!dataByType[entry.type]) {
                dataByType[entry.type] = 0;
            }
            dataByType[entry.type] += entry.value;
        });

        const chartHTML = `
            <div style="padding: 20px;">
                <h4 style="text-align: center; margin-bottom: 20px;">Обща сума по тип данни</h4>
                ${Object.entries(dataByType).map(([type, value]) => `
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>${this.translateDataType(type)}</span>
                            <strong>${dataManager.formatNumber(value)}</strong>
                        </div>
                        <div style="background: #eee; height: 10px; border-radius: 5px;">
                            <div style="
                                background: linear-gradient(45deg, ${this.chartColors.primary}, ${this.chartColors.secondary}); 
                                height: 100%; 
                                width: ${Math.min((value / Math.max(...Object.values(dataByType))) * 100, 100)}%; 
                                border-radius: 5px;
                            "></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        chartContainer.innerHTML = chartHTML;
    }

    updateRecentAlerts() {
        const alerts = dataManager.getAllAlerts().slice(0, 5); // Last 5 alerts
        const container = document.getElementById('recentAlerts');
        
        if (alerts.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Няма алерти за показване</p>';
            return;
        }

        const alertsHTML = alerts.map(alert => `
            <div class="alert alert-${this.getSeverityClass(alert.severity)}" style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${this.translateDataType(alert.dataType)}</strong>
                        <br>
                        <span style="font-size: 14px;">${alert.message}</span>
                    </div>
                    <div style="text-align: right; font-size: 12px; opacity: 0.8;">
                        ${dataManager.formatDateTime(alert.timestamp)}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = alertsHTML;
    }

    // Data Table Management
    updateDataTable() {
        const data = dataManager.getAllData();
        const tableBody = document.getElementById('dataTableBody');
        
        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #999; padding: 40px;">
                        Няма данни за показване. Добавете първите си данни!
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by date descending
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

        const rowsHTML = sortedData.map(entry => `
            <tr>
                <td>${dataManager.formatDate(entry.date)}</td>
                <td>
                    <span class="status-indicator status-active"></span>
                    ${this.translateDataType(entry.type)}
                </td>
                <td><strong>${dataManager.formatNumber(entry.value)}</strong></td>
                <td>${entry.description || '-'}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" 
                            onclick="deleteDataEntry(${entry.id})">
                        🗑️ Изтрий
                    </button>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = rowsHTML;
    }

    // Alerts Management
    updateAlertsList() {
        const alerts = dataManager.getAllAlerts();
        const container = document.getElementById('alertsList');
        
        if (alerts.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Няма алерти за показване</p>';
            return;
        }

        const alertsHTML = alerts.map(alert => `
            <div class="alert alert-${this.getSeverityClass(alert.severity)}" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span class="status-indicator status-${alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'active'}"></span>
                            <strong>${this.translateDataType(alert.dataType)} - ${alert.type === 'threshold' ? 'Праг' : 'Промяна'}</strong>
                            <span style="
                                background: ${alert.severity === 'high' ? '#e74c3c' : alert.severity === 'medium' ? '#f39c12' : '#2ecc71'};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 10px;
                                font-size: 11px;
                                text-transform: uppercase;
                            ">
                                ${alert.severity === 'high' ? 'Висок' : alert.severity === 'medium' ? 'Среден' : 'Нисък'}
                            </span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            ${alert.message}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            📅 ${dataManager.formatDateTime(alert.timestamp)}
                        </div>
                    </div>
                    <div style="margin-left: 15px;">
                        <button class="btn" style="padding: 5px 10px; font-size: 12px;" 
                                onclick="markAlertAsRead(${alert.id})">
                            ✅ Прочети
                        </button>
                        <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" 
                                onclick="deleteAlert(${alert.id})">
                            🗑️ Изтрий
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = alertsHTML;
    }

    // CSV Handling
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.csvData = dataManager.parseCSV(csvText);
                this.showCSVPreview();
            } catch (error) {
                console.error('Грешка при четене на CSV:', error);
                showAlert('Грешка при четене на CSV файла!', 'danger');
            }
        };
        
        reader.readAsText(file);
    }

    showCSVPreview() {
        const previewContainer = document.getElementById('csvPreview');
        const importBtn = document.getElementById('importBtn');
        
        if (this.csvData.length === 0) {
            previewContainer.innerHTML = '<p style="color: #e74c3c;">Няма валидни данни в CSV файла!</p>';
            importBtn.style.display = 'none';
            return;
        }

        const previewHTML = `
            <div style="margin-top: 15px;">
                <h4>📋 Преглед на данните (първите 5 записа):</h4>
                <div class="table-container">
                    <table style="font-size: 14px;">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Стойност</th>
                                <th>Тип</th>
                                <th>Описание</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.csvData.slice(0, 5).map(entry => `
                                <tr>
                                    <td>${entry.date}</td>
                                    <td>${entry.value}</td>
                                    <td>${this.translateDataType(entry.type)}</td>
                                    <td>${entry.description || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p style="color: #666; margin-top: 10px;">
                    Общо записи за импорт: <strong>${this.csvData.length}</strong>
                </p>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        importBtn.style.display = 'inline-block';
    }

    importCSVData() {
        let successCount = 0;
        let errorCount = 0;

        this.csvData.forEach(entry => {
            try {
                dataManager.addDataEntry({
                    ...entry,
                    id: Date.now() + Math.random() // Ensure unique ID
                });
                successCount++;
            } catch (error) {
                console.error('Грешка при добавяне на запис:', entry, error);
                errorCount++;
            }
        });

        // Update UI
        this.updateDataTable();
        this.updateDashboard();

        // Clear preview and reset form
        document.getElementById('csvPreview').innerHTML = '';
        document.getElementById('importBtn').style.display = 'none';
        document.getElementById('csvFile').value = '';
        this.csvData = [];

        // Run anomaly check
        dataManager.runAnomalyCheck();
        this.updateAlertsList();

        // Show result
        if (errorCount === 0) {
            showAlert(`Успешно импортирани ${successCount} записа!`, 'success');
        } else {
            showAlert(`Импортирани ${successCount} записа, ${errorCount} грешки!`, 'warning');
        }
    }

    // Utility Methods
    translateDataType(type) {
        const translations = {
            'sales': 'Продажби',
            'traffic': 'Трафик',
            'production': 'Производство',
            'financial': 'Финансови'
        };
        return translations[type] || type;
    }

    getSeverityClass(severity) {
        const classes = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'success'
        };
        return classes[severity] || 'info';
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Animation and Visual Effects
    animateMetricCard(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
        }, 100);
    }

    showLoadingSpinner(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid ${this.chartColors.primary};
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>Обработка...</p>
            </div>
        `;
    }

    hideLoadingSpinner(containerId) {
        // Will be replaced by actual content
    }
}

// Create global instance
const uiManager = new UIManager();

// Global functions for HTML compatibility
function updateDashboard() {
    uiManager.updateDashboard();
}

function updateDataTable() {
    uiManager.updateDataTable();
}

function updateAlertsList() {
    uiManager.updateAlertsList();
}

function handleCSVUpload(event) {
    uiManager.handleCSVUpload(event);
}

function importCSVData() {
    uiManager.importCSVData();
}

function deleteDataEntry(id) {
    const confirmation = confirm('Сигурни ли сте, че искате да изтриете този запис?');
    if (confirmation) {
        dataManager.deleteDataEntry(id);
        updateDataTable();
        updateDashboard();
        showAlert('Записът е изтрит успешно!', 'success');
    }
}

function markAlertAsRead(id) {
    dataManager.markAlertAsRead(id);
    updateAlertsList();
    updateDashboard();
    showAlert('Алертът е маркиран като прочетен!', 'success');
}

function deleteAlert(id) {
    const confirmation = confirm('Сигурни ли сте, че искате да изтриете този алерт?');
    if (confirmation) {
        dataManager.deleteAlert(id);
        updateAlertsList();
        updateDashboard();
        showAlert('Алертът е изтрит успешно!', 'success');
    }
}

// Enhanced logout function with beautiful modal and real logout
function logout() {
    showLogoutModal();
}

function showLogoutModal() {
    // Create beautiful logout modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            text-align: center;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        ">
            <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Изход от системата</h3>
            <p style="color: #666; margin-bottom: 30px;">
                Сигурни ли сте, че искате да излезете?<br>
                <small>Всички несъхранени данни ще бъдат запазени автоматично.</small>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="confirmLogout()" style="
                    background: linear-gradient(45deg, #0D8BB1, #0A7396);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">✅ Да, излез</button>
                <button onclick="cancelLogout()" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">❌ Отказ</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function confirmLogout() {
    // Save current state
    localStorage.setItem('biSystemLoggedOut', 'true');
    localStorage.setItem('biSystemLogoutTime', new Date().toISOString());
    
    // Clear session data (but keep stored data)
    sessionStorage.clear();
    
    // Show logout message and redirect
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                max-width: 400px;
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">👋</div>
                <h2 style="color: #2c3e50; margin-bottom: 15px;">Довиждане!</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Успешно излязохте от BI системата.<br>
                    Всичките ви данни са запазени.
                </p>
                <button onclick="location.reload()" style="
                    background: linear-gradient(45deg, #0D8BB1, #0A7396);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                ">
                    🔑 Влез отново
                </button>
                <br><br>
                <small style="color: #999;">
                    Време на изход: ${new Date().toLocaleString('bg-BG')}
                </small>
            </div>
        </div>
    `;
}

function cancelLogout() {
    // Remove modal
    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Initialize auto scan when DOM is loaded
function initializeAutoScan() {
    dataManager.initializeAutoScan();
}

// Add styles for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('UI Manager инициализиран успешно!');