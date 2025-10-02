document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    const transcriptInput = document.getElementById('transcript');
    const generateBtn = document.getElementById('generateBtn');
    const characterCounter = document.getElementById('charCounter');

    if (!transcriptInput || !generateBtn || !characterCounter) return;

    transcriptInput.addEventListener('input', function () {
        const charCount = this.value.length;
        characterCounter.textContent = `${charCount} / 10000`;
        generateBtn.disabled = charCount < 10;
    });

    generateBtn.addEventListener('click', handleGenerateReport);
}

async function handleGenerateReport() {
    const generateBtn = document.getElementById('generateBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');

    resultsSection.classList.add('d-none');
    errorSection.classList.add('d-none');
    loadingSection.classList.remove('d-none');
    generateBtn.disabled = true;

    const transcript = document.getElementById('transcript').value.trim();
    const medications = document.getElementById('medications').value.trim();

    try {
        const response = await fetch('/generate_and_analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, medications }),
            signal: AbortSignal.timeout(65000)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate report');
        }

        if (data.success) {
            displayResults(data);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }

    } catch (error) {
        displayError(error);
    } finally {
        loadingSection.classList.add('d-none');
        generateBtn.disabled = false;
    }
}

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const reportTextarea = document.getElementById('reportTextarea');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const scoreRationale = document.getElementById('scoreRationale');
    const tagsContainer = document.getElementById('tagsContainer');

    const score = data.complaint_capture_score?.score || 0;
    const scoreColor = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
    scoreDisplay.innerHTML = `<span class="badge bg-${scoreColor}" style="font-size: 2rem;">${score}/100</span>`;
    scoreRationale.textContent = data.complaint_capture_score?.rationale || '';

    reportTextarea.value = data.generated_report || '';

    const tags = Array.isArray(data.highlight_tags) ? data.highlight_tags : [];
    tagsContainer.innerHTML = tags.map(tag => `<span class="badge bg-info me-2 mb-2">${tag}</span>`).join('');

    resultsSection.classList.remove('d-none');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyToClipboard() {
    const reportTextarea = document.getElementById('reportTextarea');
    const copyBtn = document.getElementById('copyBtn');

    reportTextarea.select();
    document.execCommand('copy');

    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = 'Copied!';
    copyBtn.classList.add('btn-success');
    copyBtn.classList.remove('btn-outline-primary');

    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('btn-success');
        copyBtn.classList.add('btn-outline-primary');
    }, 2000);
}

function downloadTextFile() {
    const text = document.getElementById('reportTextarea').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_report.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

function displayError(error) {
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');

    let message = 'An error occurred while generating the report.';
    const msg = (error && error.message) ? error.message.toLowerCase() : '';

    if (msg.includes('timeout') || msg.includes('aborterror')) {
        message = 'The request took too long. Please check your internet connection and try again.';
    } else if (error.message) {
        message = error.message;
    }

    errorMessage.textContent = message;
    errorSection.classList.remove('d-none');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}
