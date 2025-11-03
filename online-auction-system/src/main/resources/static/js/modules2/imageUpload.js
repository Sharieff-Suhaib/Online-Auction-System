let selectedImageFile = null;

export function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be < 5MB');
        event.target.value = '';
        return;
    }
    if (!file.type.startsWith('image/')) {
        alert('Select an image only');
        event.target.value = '';
        return;
    }

    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

export async function uploadImage(file) {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/upload/image', { method:'POST', body: form });
    if (!res.ok) throw new Error((await res.json()).error);
    return (await res.json()).imageUrl;
}

export function getSelectedFile() {
    return selectedImageFile;
}

export function resetSelectedFile() {
    selectedImageFile = null;
}
