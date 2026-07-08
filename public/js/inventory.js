// Form toggle
function showAddSareeForm() {
    document.getElementById('add-saree-form').style.display = 'block';
    document.getElementById('saree-form').reset();
    clearImagePreview();
}

function hideAddSareeForm() {
    document.getElementById('add-saree-form').style.display = 'none';
}

// Image upload preview
document.getElementById('saree-image')?.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('file-preview').style.display = 'flex';
            document.querySelector('.file-upload-content').style.display = 'none';
        }
        reader.readAsDataURL(e.target.files[0]);
    }
});

function clearImagePreview() {
    document.getElementById('saree-image').value = '';
    document.getElementById('file-preview').style.display = 'none';
    document.querySelector('.file-upload-content').style.display = 'flex';
}

// Submit new saree
document.getElementById('saree-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('saree-name').value);
    formData.append('price', document.getElementById('saree-price').value);
    formData.append('description', document.getElementById('saree-description').value);
    
    const fileInput = document.getElementById('saree-image');
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE}/sarees`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('සාරිය සාර්ථකව එකතු කරන ලදී');
            hideAddSareeForm();
            loadSarees();
            showBarcodePrintModal(result); // Show print modal immediately
        } else {
            const err = await response.json();
            showNotification(err.error || 'දෝෂයක් මතු විය', 'error');
        }
    } catch (err) {
        showNotification('සේවාදායකය හා සම්බන්ධ විය නොහැක', 'error');
    }
});

// Load all sarees
async function loadSarees() {
    try {
        const response = await fetch(`${API_BASE}/sarees`);
        const sarees = await response.json();
        
        const grid = document.getElementById('saree-grid');
        
        if (sarees.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1;" class="empty-state">
                    <span class="empty-icon">👗</span>
                    <p>සාරි එකතු කර නැත</p>
                </div>
            `;
            return;
        }

        let html = '';
        sarees.forEach(saree => {
            const imgHtml = saree.image_path 
                ? `<img src="${saree.image_path}" alt="${saree.name}">` 
                : `<div class="no-img">👗</div>`;
                
            let badgeClass = 'status-available';
            if (saree.status === 'Booking') badgeClass = 'status-booked';
            else if (saree.status === 'රැගෙන ගොස් ඇත') badgeClass = 'status-rented';

            html += `
                <div class="saree-card">
                    <div class="saree-img-wrapper">
                        ${imgHtml}
                        <div class="saree-status-badge ${badgeClass}">${saree.status}</div>
                    </div>
                    <div class="saree-card-body">
                        <div class="saree-title" title="${saree.name}">${saree.name}</div>
                        <div class="saree-barcode">${saree.barcode}</div>
                        <div class="saree-price">${formatCurrency(saree.default_price)}</div>
                        <div class="saree-actions">
                            <button class="btn btn-secondary btn-sm" onclick='showBarcodePrintModal(${JSON.stringify(saree)})'>🖨️ බාර්කෝඩ්</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSaree(${saree.id})">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        showNotification('සාරි ලේඛනය ලබාගැනීමේ දෝෂයක්', 'error');
    }
}

// Delete saree
async function deleteSaree(id) {
    if (confirm('මෙම සාරිය මකා දැමීමට අවශ්‍ය බව විශ්වාසද?')) {
        try {
            const response = await fetch(`${API_BASE}/sarees/${id}`, { method: 'DELETE' });
            if (response.ok) {
                showNotification('සාරිය මකා දමන ලදී');
                loadSarees();
            }
        } catch (err) {
            showNotification('මකා දැමීමේ දෝෂයක්', 'error');
        }
    }
}

// Barcode Printing
function showBarcodePrintModal(saree) {
    document.getElementById('barcode-print-modal').style.display = 'flex';
    document.getElementById('print-saree-name').textContent = saree.name;
    document.getElementById('print-barcode-code').textContent = saree.barcode;
    
    // Generate barcode using JsBarcode
    JsBarcode("#print-barcode-svg", saree.barcode, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: false
    });
}

function closeBarcodePrint(e) {
    if (e && e.target.id !== 'barcode-print-modal' && e.target.className === 'modal-overlay') return;
    document.getElementById('barcode-print-modal').style.display = 'none';
}

function printBarcodeLabel() {
    window.print();
}
