// Logic for Admin Panel behavior (Sidebar, 2FA, etc)

// MFA Logic
window.mfaFactorId = null;

async function openSecurityModal() {
    const modal = document.getElementById('security-modal');
    const step1 = document.getElementById('mfa-step-1');
    const stepSuccess = document.getElementById('mfa-step-success');
    const activeMsg = document.getElementById('mfa-active-msg');
    const qrContainer = document.getElementById('mfa-qr');
    const errorEl = document.getElementById('mfa-error');

    if (!modal) {
        console.error('Security Modal not found in DOM');
        return;
    }

    modal.style.display = 'flex';
    if (errorEl) errorEl.style.display = 'none';

    // Instantiate api.js AuthService
    const auth = new AuthService();
    const enrolledFactors = await auth.listFactors();

    if (enrolledFactors.length > 0) {
        if (step1) step1.style.display = 'none';
        if (stepSuccess) stepSuccess.style.display = 'none';
        if (activeMsg) activeMsg.style.display = 'block';
        return;
    }

    // Not enrolled, start enrollment
    if (step1) step1.style.display = 'block';
    if (stepSuccess) stepSuccess.style.display = 'none';
    if (activeMsg) activeMsg.style.display = 'none';
    if (qrContainer) qrContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando QR Code...';

    const enrollRes = await auth.enrollMFA();

    if (enrollRes.error) {
        if (errorEl) {
            errorEl.textContent = enrollRes.error;
            errorEl.style.display = 'block';
        }
        return;
    }

    window.mfaFactorId = enrollRes.id;
    if (qrContainer) qrContainer.innerHTML = enrollRes.qr_code;
}

function closeSecurityModal() {
    const modal = document.getElementById('security-modal');
    if (modal) modal.style.display = 'none';

    const error = document.getElementById('mfa-error');
    if (error) error.style.display = 'none';

    const input = document.getElementById('mfa-verify-code');
    if (input) input.value = '';
}

async function enableMFA() {
    const codeInput = document.getElementById('mfa-verify-code');
    const errorEl = document.getElementById('mfa-error');
    const code = codeInput ? codeInput.value : '';

    if (code.length !== 6) {
        if (errorEl) {
            errorEl.textContent = 'Digite 6 dígitos';
            errorEl.style.display = 'block';
        }
        return;
    }

    const auth = new AuthService();
    const verifyRes = await auth.challengeAndVerifyMFA(window.mfaFactorId, code);

    if (verifyRes.error) {
        if (errorEl) {
            errorEl.textContent = 'Código inválido ou expirado.';
            errorEl.style.display = 'block';
        }
    } else {
        const step1 = document.getElementById('mfa-step-1');
        const stepSuccess = document.getElementById('mfa-step-success');

        if (step1) step1.style.display = 'none';
        if (stepSuccess) stepSuccess.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
    }
}
