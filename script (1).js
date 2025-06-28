class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.currentMode = 'camera';
        this.selectedFile = null;
        
        this.initializeElements();
        this.bindEvents();
        this.showStatus('Ready to scan QR codes', 'info');
    }

    initializeElements() {
        // Mode buttons
        this.cameraModeBtn = document.getElementById('camera-mode-btn');
        this.fileModeBtn = document.getElementById('file-mode-btn');
        
        // Sections
        this.cameraSection = document.getElementById('camera-section');
        this.fileSection = document.getElementById('file-section');
        
        // Camera controls
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        
        // File upload
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.scanFileBtn = document.getElementById('scan-file-btn');
        
        // Results
        this.resultsSection = document.getElementById('results-section');
        this.resultContent = document.getElementById('result-content');
        this.copyBtn = document.getElementById('copy-btn');
        this.clearBtn = document.getElementById('clear-btn');
        
        // Status
        this.statusMessage = document.getElementById('status-message');
    }

    bindEvents() {
        // Mode switching
        this.cameraModeBtn.addEventListener('click', () => this.switchMode('camera'));
        this.fileModeBtn.addEventListener('click', () => this.switchMode('file'));
        
        // Camera controls
        this.startBtn.addEventListener('click', () => this.startCamera());
        this.stopBtn.addEventListener('click', () => this.stopCamera());
        
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.scanFileBtn.addEventListener('click', () => this.scanFile());
        
        // Result actions
        this.copyBtn.addEventListener('click', () => this.copyResult());
        this.clearBtn.addEventListener('click', () => this.clearResult());
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        this.cameraModeBtn.classList.toggle('active', mode === 'camera');
        this.fileModeBtn.classList.toggle('active', mode === 'file');
        
        // Update section visibility
        this.cameraSection.classList.toggle('active', mode === 'camera');
        this.fileSection.classList.toggle('active', mode === 'file');
        
        // Stop camera if switching away from camera mode
        if (mode !== 'camera' && this.isScanning) {
            this.stopCamera();
        }
        
        // Clear results when switching modes
        this.clearResult();
        
        this.showStatus(`Switched to ${mode} mode`, 'info');
    }

    async startCamera() {
        try {
            this.html5QrCode = new Html5Qrcode("reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            await this.html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => this.onScanSuccess(decodedText, decodedResult),
                (errorMessage) => this.onScanError(errorMessage)
            );
            
            this.isScanning = true;
            this.startBtn.style.display = 'none';
            this.stopBtn.style.display = 'inline-block';
            this.showStatus('Camera started successfully', 'success');
            
        } catch (err) {
            console.error('Error starting camera:', err);
            this.showStatus(`Failed to start camera: ${err.message}`, 'error');
        }
    }

    async stopCamera() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.html5QrCode = null;
                this.isScanning = false;
                
                this.startBtn.style.display = 'inline-block';
                this.stopBtn.style.display = 'none';
                this.showStatus('Camera stopped', 'info');
                
            } catch (err) {
                console.error('Error stopping camera:', err);
                this.showStatus(`Error stopping camera: ${err.message}`, 'error');
            }
        }
    }

    onScanSuccess(decodedText, decodedResult) {
        console.log('QR Code detected:', decodedText);
        this.displayResult(decodedText);
        this.showStatus('QR Code scanned successfully!', 'success');
        
        // Auto-stop camera after successful scan
        this.stopCamera();
    }

    onScanError(errorMessage) {
        // Don't show every scan error as it's too noisy
        // console.log('Scan error:', errorMessage);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showStatus('Please select an image file', 'error');
            return;
        }
        
        this.selectedFile = file;
        this.uploadArea.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
            </svg>
            <p><strong>${file.name}</strong></p>
            <p>File selected successfully</p>
        `;
        
        this.scanFileBtn.style.display = 'inline-block';
        this.showStatus('Image file selected. Click "Scan Image" to process.', 'info');
    }

    async scanFile() {
        if (!this.selectedFile) {
            this.showStatus('No file selected', 'error');
            return;
        }
        
        try {
            this.showStatus('Scanning image...', 'info');
            
            const html5QrCode = new Html5Qrcode("reader");
            const result = await html5QrCode.scanFile(this.selectedFile, true);
            
            this.displayResult(result);
            this.showStatus('QR Code found in image!', 'success');
            
        } catch (err) {
            console.error('Error scanning file:', err);
            this.showStatus('No QR code found in the image', 'error');
        }
    }

    displayResult(result) {
        this.resultContent.textContent = result;
        this.resultsSection.style.display = 'block';
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    async copyResult() {
        try {
            await navigator.clipboard.writeText(this.resultContent.textContent);
            this.showStatus('Result copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showStatus('Failed to copy to clipboard', 'error');
        }
    }

    clearResult() {
        this.resultsSection.style.display = 'none';
        this.resultContent.textContent = '';
        
        // Reset file upload area if in file mode
        if (this.currentMode === 'file') {
            this.uploadArea.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <p>Drop an image here or click to select</p>
            `;
            this.scanFileBtn.style.display = 'none';
            this.selectedFile = null;
            this.fileInput.value = '';
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.statusMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize the QR Scanner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRScanner();
});