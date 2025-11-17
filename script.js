document.getElementById('workoutForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Clear previous messages
    messageDiv.className = 'message';
    messageDiv.textContent = '';
    
    // Show loading message
    messageDiv.className = 'message loading';
    messageDiv.textContent = 'Sending form...';
    messageDiv.style.display = 'block';
    
    try {
        // Get form data
        const formData = new FormData();
        
        // Personal info
        formData.append('name', document.getElementById('name').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('weight', document.getElementById('weight').value);
        formData.append('date', document.getElementById('date').value);
        
        // Exercises - collect sets data dynamically
        for (let i = 1; i <= 4; i++) {
            const numSets = parseInt(document.getElementById(`exercise${i}_sets`).value) || 0;
            formData.append(`exercise${i}_sets`, numSets);
            
            // Collect reps and weight for each set
            for (let j = 1; j <= numSets; j++) {
                const reps = document.getElementById(`exercise${i}_set${j}_reps`)?.value || '';
                const weight = document.getElementById(`exercise${i}_set${j}_weight`)?.value || '';
                formData.append(`exercise${i}_set${j}_reps`, reps);
                formData.append(`exercise${i}_set${j}_weight`, weight);
            }
        }
        
        // Attachment
        const attachment = document.getElementById('attachment').files[0];
        if (attachment) {
            formData.append('attachment', attachment);
        }
        
        // Send to Netlify function
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success
            messageDiv.className = 'message success';
            messageDiv.textContent = '✅ Form submitted successfully! Thank you.';
            
            // Reset form
            document.getElementById('workoutForm').reset();
            // Reset file preview
            fileUploadContent.style.display = 'flex';
            filePreview.style.display = 'none';
            previewImage.src = '';
            previewImage.style.display = 'none';
        } else {
            // Error
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ Error sending form: ' + (result.error || 'Please try again');
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Error sending form. Please check your internet connection and try again.';
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
});

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Function to create set fields dynamically
function createSetFields(exerciseNum, numSets) {
    const container = document.getElementById(`exercise${exerciseNum}_sets_container`);
    container.innerHTML = '';
    
    if (numSets > 0) {
        for (let i = 1; i <= numSets; i++) {
            const setGroup = document.createElement('div');
            setGroup.className = 'set-group';
            setGroup.innerHTML = `
                <div class="set-header">Set ${i}</div>
                <div class="set-fields">
                    <div class="form-group">
                        <label for="exercise${exerciseNum}_set${i}_reps">Reps</label>
                        <input type="number" id="exercise${exerciseNum}_set${i}_reps" name="exercise${exerciseNum}_set${i}_reps" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="exercise${exerciseNum}_set${i}_weight">Weight (kg)</label>
                        <input type="number" id="exercise${exerciseNum}_set${i}_weight" name="exercise${exerciseNum}_set${i}_weight" step="0.1" min="0" required>
                    </div>
                </div>
            `;
            container.appendChild(setGroup);
        }
    }
}

// Add event listeners for sets input changes
for (let i = 1; i <= 4; i++) {
    const setsInput = document.getElementById(`exercise${i}_sets`);
    setsInput.addEventListener('input', function() {
        const numSets = parseInt(this.value) || 0;
        createSetFields(i, numSets);
    });
}

// File Upload Functionality
const fileInput = document.getElementById('attachment');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const fileUploadContent = document.querySelector('.file-upload-content');

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Handle file selection
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Handle file
function handleFile(file) {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('File size exceeds 10MB limit. Please choose a smaller file.');
        fileInput.value = '';
        return;
    }

    // Show preview
    fileUploadContent.style.display = 'none';
    filePreview.style.display = 'block';
    
    // Set file name and size
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // If it's an image, show preview
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.style.display = 'none';
    }
}

// Remove file
removeFileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    fileInput.value = '';
    fileUploadContent.style.display = 'flex';
    filePreview.style.display = 'none';
    previewImage.src = '';
    previewImage.style.display = 'none';
});

// Drag and drop functionality
fileUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.add('dragover');
});

fileUploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('dragover');
});

fileUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        handleFile(files[0]);
    }
});

// Click to upload
fileUploadArea.addEventListener('click', function(e) {
    if (e.target !== removeFileBtn && !filePreview.contains(e.target)) {
        fileInput.click();
    }
});

// Reset preview when form is reset
document.getElementById('workoutForm').addEventListener('reset', function() {
    fileUploadContent.style.display = 'flex';
    filePreview.style.display = 'none';
    previewImage.src = '';
    previewImage.style.display = 'none';
});
