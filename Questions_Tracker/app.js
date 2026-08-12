// Application state
const state = {
    companies: [],
    currentCompany: null,
    allQuestions: {},
    completedQuestions: {},
    searchQuery: '',
    currentFilter: 'all',
    difficultyFilters: { EASY: true, MEDIUM: true, HARD: true }
};

// CSV file names - Only Amazon for now
const CSV_FILES = [
    'Amazon.csv'
];

// Check if we can use fetch or need file input
let useFetch = true;

// Initialize application
async function init() {
    loadCompletedQuestions();
    
    // Try to load via fetch first
    try {
        await loadAllCompanies();
        if (state.companies.length === 0) {
            useFetch = false;
            showFileInputPrompt();
        }
    } catch (error) {
        useFetch = false;
        showFileInputPrompt();
    }
    
    setupEventListeners();
    
    if (state.companies.length > 0) {
        selectCompany(state.companies[0]);
    }
}

// Show file input prompt if fetch doesn't work
function showFileInputPrompt() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">⚠️ Browser Security Restriction</h2>
            <p style="margin-bottom: 20px; color: #64748b;">
                Your browser is blocking access to local CSV files for security reasons.
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Solution: Use a Local Server</h3>
                <p style="margin-bottom: 15px; text-align: left;">Open terminal/command prompt in the questions folder and run:</p>
                <code style="background: #1e293b; color: #10b981; padding: 10px; display: block; border-radius: 4px; margin-bottom: 10px;">
                    python -m http.server 8000
                </code>
                <p style="margin-bottom: 10px; text-align: left;">Then open in your browser:</p>
                <code style="background: #1e293b; color: #10b981; padding: 10px; display: block; border-radius: 4px;">
                    http://localhost:8000
                </code>
            </div>
            <p style="color: #64748b; font-size: 0.9rem;">
                Alternative: Use Chrome with the flag --allow-file-access-from-files
            </p>
        </div>
    `;
}

// Load completed questions from localStorage
function loadCompletedQuestions() {
    const saved = localStorage.getItem('completedQuestions');
    if (saved) {
        try {
            state.completedQuestions = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading completed questions:', e);
            state.completedQuestions = {};
        }
    }
}

// Save completed questions to localStorage
function saveCompletedQuestions() {
    localStorage.setItem('completedQuestions', JSON.stringify(state.completedQuestions));
}

// Parse CSV text to array of objects
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse header line
    const headerLine = lines[0];
    const headers = [];
    let currentHeader = '';
    let insideQuotes = false;
    
    for (let j = 0; j < headerLine.length; j++) {
        const char = headerLine[j];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            headers.push(currentHeader.trim());
            currentHeader = '';
        } else {
            currentHeader += char;
        }
    }
    headers.push(currentHeader.trim());
    
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Handle quoted values that might contain commas
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const question = {};
        headers.forEach((header, index) => {
            question[header] = values[index] || '';
        });
        
        // Normalize field names - handle different CSV formats
        const title = question.Title || question.title || '';
        const difficulty = question.Difficulty || question.difficulty || question[''] || 'MEDIUM';
        const link = question.Link || question.link || '';
        const topics = question.Topics || question.topics || '';
        
        // Skip if no title
        if (!title) continue;
        
        // Create normalized question object
        const normalizedQuestion = {
            Title: title,
            Difficulty: difficulty.toUpperCase() || 'MEDIUM',
            Link: link,
            Topics: topics,
            id: `${title}-${link}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        };
        
        questions.push(normalizedQuestion);
    }
    
    return questions;
}

// Load a single company's CSV file
async function loadCompanyData(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            console.warn(`Failed to load ${filename}: ${response.status}`);
            return [];
        }
        const text = await response.text();
        const questions = parseCSV(text);
        console.log(`Loaded ${questions.length} questions from ${filename}`);
        return questions;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return [];
    }
}

// Load all company data
async function loadAllCompanies() {
    const companyTabs = document.getElementById('companyTabs');
    companyTabs.innerHTML = '<p style="padding: 15px; color: #64748b;">Loading companies...</p>';
    
    for (const filename of CSV_FILES) {
        const questions = await loadCompanyData(filename);
        if (questions.length > 0) {
            const companyName = filename.replace('.csv', '').replace(/([A-Z])/g, ' $1').trim();
            state.companies.push(companyName);
            state.allQuestions[companyName] = questions;
            
            // Initialize completed questions for this company
            if (!state.completedQuestions[companyName]) {
                state.completedQuestions[companyName] = {};
            }
        }
    }
    
    renderCompanyTabs();
    updateOverallStats();
}

// Render company tabs
function renderCompanyTabs() {
    const companyTabs = document.getElementById('companyTabs');
    companyTabs.innerHTML = '';
    
    state.companies.forEach(company => {
        const tab = document.createElement('button');
        tab.className = 'company-tab';
        tab.textContent = company;
        tab.onclick = () => selectCompany(company);
        companyTabs.appendChild(tab);
    });
}

// Select a company and display its questions
function selectCompany(companyName) {
    state.currentCompany = companyName;
    
    // Update active tab
    document.querySelectorAll('.company-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent === companyName);
    });
    
    updateCompanyProgress();
    renderQuestions();
}

// Filter and render questions
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    
    if (!state.currentCompany) {
        container.innerHTML = '<p class="loading-message">Select a company to view questions...</p>';
        return;
    }
    
    const questions = state.allQuestions[state.currentCompany] || [];
    const completed = state.completedQuestions[state.currentCompany] || {};
    
    // Apply filters
    let filtered = questions.filter(q => {
        // Search filter
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            const title = (q.Title || '').toLowerCase();
            const topics = (q.Topics || '').toLowerCase();
            if (!title.includes(query) && !topics.includes(query)) {
                return false;
            }
        }
        
        // Completion filter
        if (state.currentFilter === 'completed' && !completed[q.id]) {
            return false;
        }
        if (state.currentFilter === 'pending' && completed[q.id]) {
            return false;
        }
        
        // Difficulty filter
        const difficulty = (q.Difficulty || 'MEDIUM').toUpperCase();
        if (difficulty && !state.difficultyFilters[difficulty]) {
            return false;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="loading-message">No questions match your filters</p>';
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(question => {
        const card = createQuestionCard(question, completed[question.id]);
        container.appendChild(card);
    });
}

// Create a question card element
function createQuestionCard(question, isCompleted) {
    const card = document.createElement('div');
    card.className = `question-card ${isCompleted ? 'completed' : ''}`;
    
    const title = question.Title || 'Untitled';
    const difficulty = (question.Difficulty || 'MEDIUM').toUpperCase();
    const topics = (question.Topics || '').split(',').map(t => t.trim()).filter(t => t);
    const link = question.Link || '';
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    card.innerHTML = `
        <div class="question-checkbox">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                   onchange="toggleQuestion('${escapeHtml(question.id)}', this.checked)">
        </div>
        <div class="question-content">
            <div class="question-header">
                <span class="question-title">${escapeHtml(title)}</span>
                <span class="difficulty-badge ${difficulty.toLowerCase()}">${difficulty}</span>
            </div>
            ${topics.length > 0 ? `
                <div class="question-topics">
                    ${topics.map(topic => `<span class="topic-tag">${escapeHtml(topic)}</span>`).join('')}
                </div>
            ` : ''}
            ${link ? `
                <div class="question-link">
                    <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">
                        🔗 Open Problem
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Toggle question completion status
window.toggleQuestion = function(questionId, isCompleted) {
    if (!state.currentCompany) return;
    
    if (!state.completedQuestions[state.currentCompany]) {
        state.completedQuestions[state.currentCompany] = {};
    }
    
    if (isCompleted) {
        state.completedQuestions[state.currentCompany][questionId] = true;
    } else {
        delete state.completedQuestions[state.currentCompany][questionId];
    }
    
    saveCompletedQuestions();
    updateCompanyProgress();
    updateOverallStats();
    renderQuestions();
};

// Update company-specific progress
function updateCompanyProgress() {
    if (!state.currentCompany) return;
    
    const questions = state.allQuestions[state.currentCompany] || [];
    const completed = state.completedQuestions[state.currentCompany] || {};
    const completedCount = Object.keys(completed).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    document.getElementById('companyProgressFill').style.width = `${percentage}%`;
    document.getElementById('companyProgressText').textContent = `${completedCount} / ${total} (${percentage}%)`;
}

// Update overall statistics
function updateOverallStats() {
    let totalQuestions = 0;
    let totalCompleted = 0;
    
    state.companies.forEach(company => {
        const questions = state.allQuestions[company] || [];
        const completed = state.completedQuestions[company] || {};
        totalQuestions += questions.length;
        totalCompleted += Object.keys(completed).length;
    });
    
    const percentage = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
    
    document.getElementById('totalCompleted').textContent = totalCompleted;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderQuestions();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentFilter = e.target.dataset.filter;
            renderQuestions();
        });
    });
    
    // Difficulty filters
    document.querySelectorAll('.difficulty-filter input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            state.difficultyFilters[e.target.value] = e.target.checked;
            renderQuestions();
        });
    });
}

// Start the application
init();
