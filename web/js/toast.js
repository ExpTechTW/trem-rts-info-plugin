function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Force a reflow to ensure the transition works
    toast.offsetHeight;

    // Add visible class to trigger fade in
    toast.classList.add('visible');

    // Remove the toast after animation
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300); // Match the CSS transition duration
    }, 2000);
}

module.exports = {
    showToast
};