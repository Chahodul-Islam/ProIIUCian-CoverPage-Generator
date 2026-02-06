let mode = '';
let members = [{ name: '', id: '', sec: '' }];

const liveMap = {
    'in-uni': 'out-uni', 'in-dept': 'out-dept', 'in-topic': 'out-topic',
    'in-code': 'out-code', 'in-title': 'out-title', 'in-date': 'out-date',
    'in-tname': 'out-tname', 'in-tdes': 'out-tdes', 'in-team': 'out-team',
    'in-sname': 'render', 'in-sid': 'render', 'in-sec': 'render'
};

function openEditor(selected, icon) {
    mode = selected;
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('editor-page').style.display = 'flex';
    document.getElementById('editor-title').innerText = icon + " " + mode;
    document.getElementById('out-type').innerText = mode;
    if (mode === 'Project Report') {
        document.getElementById('project-fields').style.display = 'block';
        document.getElementById('team-line').style.display = 'block';
        document.getElementById('add-member').style.display = 'block';
    }
    sync();
}

function goHome() { 
    location.reload(); 
}

function addMember() {
    if (members.length < 5) {
        members.push({ name: '', id: '', sec: '' });
        renderMemberInputs();
    }
}

function renderMemberInputs() {
    const container = document.getElementById('student-inputs');
    container.innerHTML = '';
    members.forEach((m, i) => {
        container.innerHTML += `
            <div style="background:#f8fafc; padding:10px; margin-bottom:10px; border-radius:8px;">
                <label>Member ${i+1} Name</label><input type="text" value="${m.name || ''}" oninput="updateM(${i}, 'name', this.value)">
                <div class="row">
                    <div class="input-group">
                        <input type="text" placeholder="ID" value="${m.id || ''}" oninput="updateM(${i}, 'id', this.value)">
                    </div>
                    <div class="input-group">
                        <input type="text" placeholder="Sec" value="${m.sec || ''}" oninput="updateM(${i}, 'sec', this.value)">
                    </div>
                </div>
            </div>`;
    });
}

function updateM(i, f, v) { 
    members[i][f] = v; 
    sync(); 
}

function sync() {
    Object.keys(liveMap).forEach(k => {
        const input = document.getElementById(k);
        if (input && liveMap[k] !== 'render') {
            let value = input.value || input.placeholder || '';
            
            // Format date if it's the date field
            if (k === 'in-date' && input.value) {
                const date = new Date(input.value);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                value = `${day}/${month}/${year}`;
            }
            
            document.getElementById(liveMap[k]).innerText = value;
        }
    });

    // Auto-resize topic text based on length
    const topicEl = document.getElementById('out-topic');
    const topicText = document.getElementById('in-topic').value || 'TOPIC TITLE';
    topicEl.innerText = topicText;
    
    // Dynamic font sizing based on text length
    const textLength = topicText.length;
    if (textLength > 100) {
        topicEl.style.fontSize = '18px';
    } else if (textLength > 80) {
        topicEl.style.fontSize = '20px';
    } else if (textLength > 60) {
        topicEl.style.fontSize = '24px';
    } else if (textLength > 40) {
        topicEl.style.fontSize = '28px';
    } else {
        topicEl.style.fontSize = '32px';
    }

    const mOut = document.getElementById('student-render');
    mOut.innerHTML = '';
    if (mode === 'Project Report') {
        members.forEach(m => {
            if(m.name) mOut.innerHTML += `<div style="margin-bottom:8px"><b>${m.name}</b><br>ID: ${m.id} | Sec: ${m.sec}</div>`;
        });
    } else {
        const n = document.getElementById('in-sname').value || "Your Name";
        const id = document.getElementById('in-sid').value || "ID";
        const s = document.getElementById('in-sec').value || "Section";
        mOut.innerHTML = `<div class="p-name-bold">${n}</div>ID: ${id}<br>Section: ${s}`;
    }
}

// Mobile preview toggle
function togglePreview() {
    const previewArea = document.getElementById('preview-area');
    previewArea.classList.toggle('active');
}

document.querySelectorAll('input').forEach(i => i.addEventListener('input', sync));

document.getElementById('in-logo').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const outImg = document.getElementById('out-img');
            outImg.src = e.target.result;
            outImg.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Improved PDF generation
async function downloadPDF() {
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = '⏳ Generating...';
    btn.disabled = true;

    try {
        const el = document.getElementById('cover-page');
        
        // Store original styles
        const originalTransform = el.style.transform;
        const originalWidth = el.style.width;
        const originalMaxWidth = el.style.maxWidth;
        
        // Reset to A4 size for PDF
        el.style.transform = 'scale(1)';
        el.style.width = '210mm';
        el.style.maxWidth = '210mm';
        
        // Wait for any images to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate canvas with high quality
        const canvas = await html2canvas(el, { 
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: el.offsetWidth,
            height: el.offsetHeight
        });
        
        // Restore original styles
        el.style.transform = originalTransform;
        el.style.width = originalWidth;
        el.style.maxWidth = originalMaxWidth;
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        // Add image to PDF (A4 size: 210mm x 297mm)
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, '', 'FAST');
        
        // Generate filename
        const fileName = `${mode.replace(/\s+/g, '_')}_Cover_${Date.now()}.pdf`;
        
        // Save PDF
        pdf.save(fileName);
        
        btn.innerText = '✅ Downloaded!';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Initialize date input with today's date
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('in-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        sync();
    }
});
