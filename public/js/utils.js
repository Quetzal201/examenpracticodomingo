// ===========================
// UTILIDADES GLOBALES
// ===========================

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  let icon = '📱';
  let className = type;

  if (type === 'offline') {
    icon = '🔴';
  } else if (type === 'online') {
    icon = '🟢';
  } else if (type === 'success') {
    icon = '✓';
  } else if (type === 'error') {
    icon = '✗';
  } else if (type === 'warning') {
    icon = '⚠';
  }

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  toast.className = `toast show ${className}`;

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

function showModal(title, content, actionText = 'Confirmar', onAction = null) {
  const backdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const actionBtn = document.getElementById('modalActionBtn');

  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  actionBtn.textContent = actionText;

  window.modalActionCallback = onAction;

  backdrop.classList.remove('hidden');
}

function closeModal() {
  const backdrop = document.getElementById('modalBackdrop');
  backdrop.classList.add('hidden');
  window.modalActionCallback = null;
}

function handleModalAction() {
  if (window.modalActionCallback) {
    window.modalActionCallback();
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getClockIcon() {
  const icons = ['🕐', '🕑', '🕒', '🕓'];
  return icons[Math.floor(Math.random() * icons.length)];
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
