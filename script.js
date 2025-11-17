// ============================================
// Formspree Configuration
// ============================================
// Formspree endpoint - emails will be sent to talkhanahmed422@gmail.com
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvgdeevk';

// Set to true to use Formspree, false to use Netlify Functions
const USE_FORMSPREE = true;

// ============================================
// ImgBB Configuration (for image uploads)
// ============================================
// Get your free API key from: https://api.imgbb.com/
// Just sign up and get your key - it's free!
const IMGBB_API_KEY = 'ae7dc70d11418011dd1c6b191414af1e'; // ImgBB API key

// Function to upload image to ImgBB
async function uploadImageToImgBB(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', file);
        
        fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resolve({
                    url: data.data.url,
                    deleteUrl: data.data.delete_url,
                    thumbUrl: data.data.thumb?.url || data.data.url
                });
            } else {
                reject(new Error(data.error?.message || 'Failed to upload image'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

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
        if (USE_FORMSPREE) {
            // ============================================
            // Formspree Submission
            // ============================================
            const formData = new FormData();
            
            // Personal info (name and email are required, others are optional)
            formData.append('name', document.getElementById('name').value);
            formData.append('email', document.getElementById('email').value);
            
            // Optional fields - only append if they have values
            const weight = document.getElementById('weight').value;
            if (weight) {
                formData.append('weight', weight + ' kg');
            }
            
            // Date - use today's date if not provided
            let dateValue = document.getElementById('date').value;
            if (!dateValue) {
                dateValue = new Date().toISOString().split('T')[0];
            }
            formData.append('date', dateValue);
            
            // Build exercises data as formatted text (only include exercises with sets)
            const exerciseNames = [
                '1. Incline DB Press (دامبل عالي للصدر)',
                '2. Tricep Pushdown (تراي بوش داون)',
                '3. Wide Lat Pull Down (سحب عالي واسع)',
                '4. T-Bar Row (سحب عالتي بار)'
            ];
            
            let exercisesText = '';
            let hasExercises = false;
            
            for (let i = 1; i <= 4; i++) {
                const numSets = parseInt(document.getElementById(`exercise${i}_sets`).value) || 0;
                
                // Only include exercise if it has sets
                if (numSets > 0) {
                    hasExercises = true;
                    exercisesText += `\n${exerciseNames[i - 1]}:\n`;
                    exercisesText += `Number of Sets: ${numSets}\n`;
                    
                    for (let j = 1; j <= numSets; j++) {
                        const reps = document.getElementById(`exercise${i}_set${j}_reps`)?.value || 'N/A';
                        const weight = document.getElementById(`exercise${i}_set${j}_weight`)?.value || 'N/A';
                        exercisesText += `  Set ${j}: ${reps} reps × ${weight} kg\n`;
                    }
                }
            }
            
            // Only append exercises if there are any
            if (hasExercises) {
                formData.append('exercises', exercisesText);
            } else {
                formData.append('exercises', 'No exercises recorded');
            }
            
            // Handle attachment - upload image to ImgBB if it's an image
            const attachment = document.getElementById('attachment').files[0];
            let attachmentUrl = null;
            
            if (attachment) {
                // Check if it's an image
                if (attachment.type && attachment.type.startsWith('image/')) {
                    // Upload image to ImgBB
                    try {
                        messageDiv.textContent = 'Uploading image...';
                        const imageData = await uploadImageToImgBB(attachment);
                        attachmentUrl = imageData.url;
                        formData.append('attachment_url', attachmentUrl);
                        formData.append('attachment_info', `Image uploaded: ${attachment.name}\nView image: ${attachmentUrl}`);
                    } catch (error) {
                        console.error('Image upload error:', error);
                        // If upload fails, just include file info
                        formData.append('attachment_info', `Image upload failed: ${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB). Error: ${error.message}`);
                    }
                } else {
                    // For non-image files, just include info
                    formData.append('attachment_info', `File attached: ${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB, Type: ${attachment.type || 'Unknown'})\nNote: Only images can be uploaded. Other file types will be listed in the email.`);
                }
            }
            
            // Send to Formspree
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
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
                
                // Clear sets containers
                for (let i = 1; i <= 4; i++) {
                    document.getElementById(`exercise${i}_sets_container`).innerHTML = '';
                }
            } else {
                // Error - check for specific Formspree errors
                let errorMessage = 'Please try again';
                if (result.error) {
                    errorMessage = result.error;
                    // Handle Formspree specific errors
                    if (result.error.includes('File Uploads Not Permitted') || result.error.includes('file') || result.error.includes('File')) {
                        errorMessage = 'File uploads are not supported in Formspree free plan. Please remove the file and try again, or use Netlify Functions for file uploads.';
                    }
                }
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ Error sending form: ' + errorMessage;
            }
        } else {
            // ============================================
            // Netlify Functions Submission (Original)
            // ============================================
        const formData = new FormData();
        
            // Personal info (name and email are required, others are optional)
        formData.append('name', document.getElementById('name').value);
        formData.append('email', document.getElementById('email').value);
            
            // Optional fields - only append if they have values
            const weight = document.getElementById('weight').value;
            if (weight) {
                formData.append('weight', weight);
            }
            
            // Date - use today's date if not provided
            let dateValue = document.getElementById('date').value;
            if (!dateValue) {
                dateValue = new Date().toISOString().split('T')[0];
            }
            formData.append('date', dateValue);
            
            // Exercises - collect sets data dynamically (only if sets > 0)
            for (let i = 1; i <= 4; i++) {
                const numSets = parseInt(document.getElementById(`exercise${i}_sets`).value) || 0;
                
                if (numSets > 0) {
                    formData.append(`exercise${i}_sets`, numSets);
                    
                    // Collect reps and weight for each set
                    for (let j = 1; j <= numSets; j++) {
                        const reps = document.getElementById(`exercise${i}_set${j}_reps`)?.value || '';
                        const weight = document.getElementById(`exercise${i}_set${j}_weight`)?.value || '';
                        formData.append(`exercise${i}_set${j}_reps`, reps);
                        formData.append(`exercise${i}_set${j}_weight`, weight);
                    }
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
                        <label for="exercise${exerciseNum}_set${i}_reps">Reps ( عدد التكرارات )</label>
                        <input type="number" id="exercise${exerciseNum}_set${i}_reps" name="exercise${exerciseNum}_set${i}_reps" min="0">
                    </div>
                    <div class="form-group">
                        <label for="exercise${exerciseNum}_set${i}_weight">Weight (kg) ( الوزن )</label>
                        <input type="number" id="exercise${exerciseNum}_set${i}_weight" name="exercise${exerciseNum}_set${i}_weight" step="0.1" min="0">
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
