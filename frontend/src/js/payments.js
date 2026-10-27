/**
 * Payment Module for RP Craft
 * Handles selection modal and payment gateway coordination
 */
export default class Payments {
    constructor() {
        this.modal = document.getElementById('paymentModal');
        this.payButton = document.getElementById('confirmPaymentBtn');
        this.init();
    }

    init() {
        if (!this.modal) return;

        // Listen for Alpine.js custom hydrated event to populate checkout data
        window.addEventListener('payment-modal-hydrated', (event) => {
            // Store current data for final submission
            this.currentData = {
                amount: event.detail.amount,
                currency: event.detail.currency,
                plan: event.detail.plan
            };
        });

        // Handle the final "Proceed to Pay" button
        if (this.payButton) {
            this.payButton.addEventListener('click', () => this.handlePayment());
        }

        // A field's error clears as soon as it's edited
        this.modal.addEventListener('input', (event) => {
            if (event.target.classList.contains('is-invalid')) this.markField(event.target, false);
        });
    }

    /** Shows or clears a field's error (its .tw-form-error shows while it has .is-invalid); returns bad */
    markField(input, bad) {
        input.classList.toggle('is-invalid', bad);
        if (bad) {
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.removeAttribute('aria-invalid');
        }
        return bad;
    }

    async handlePayment() {
        const nameInput = this.modal.querySelector('#checkoutName');
        const emailInput = this.modal.querySelector('#checkoutEmail');
        const phoneInput = this.modal.querySelector('#checkoutPhone');

        const userName = nameInput ? nameInput.value.trim() : '';
        const userEmail = emailInput ? emailInput.value.trim() : '';
        const userPhone = phoneInput ? phoneInput.value.trim() : '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalid = [
            [nameInput, !userName],
            [emailInput, !userEmail || !emailRegex.test(userEmail)],
            [phoneInput, !userPhone],
        ].filter(([input, bad]) => input && this.markField(input, bad)).map(([input]) => input);

        if (invalid.length) {
            invalid[0].focus();
            return;
        }

        const selectedGateway = this.modal.querySelector('input[name="paymentGateway"]:checked');
        const isFree = this.currentData.amount === 0;
        const gatewayError = this.modal.querySelector('#paymentGatewayError');

        if (!isFree && !selectedGateway) {
            if (gatewayError) {
                gatewayError.textContent = 'Please select a payment method.';
            } else {
                alert('Please select a payment method.');
            }
            return;
        }
        if (gatewayError) gatewayError.textContent = '';

        const gateway = isFree ? 'free' : selectedGateway.value;

        const csrfToken = document.querySelector('input[name="CRAFT_CSRF_TOKEN"]')?.value
            || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const data = {
            ...this.currentData,
            customerName: userName,
            customerEmail: userEmail,
            customerPhone: userPhone,
            gateway: gateway,
            CRAFT_CSRF_TOKEN: csrfToken
        };

        const originalText = this.payButton.innerHTML;
        this.payButton.disabled = true;
        this.payButton.innerHTML = '<span class="tw-spinner-border me-2"></span>Processing...';

        try {
            // 1. Create Order on Server
            const response = await fetch('/payment-gateway/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            let result;
            try {
                result = await response.json();
            } catch (e) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText}`);
            }

            if (!response.ok || !result.success) {
                alert(result.message || 'Payment initialization failed');
                this.resetButton(originalText);
                return;
            }

            if (isFree && result.success) {
                // Free checkout completed directly via backend
                window.location.href = '/payment-gateway/success?gateway=free';
                return;
            }

            // 2. Load Gateway SDK and Handle Redirection
            if (result.order && result.order.redirect_url) {
                window.location.href = result.order.redirect_url;
                return;
            }

            if (gateway === 'razorpay') {
                this.handleRazorpay(result.order, data, originalText);
            } else if (gateway === 'stripe') {
                this.handleStripe(result.order, data, originalText);
            } else {
                alert(`Gateway ${gateway} is not fully configured for redirection.`);
                this.resetButton(originalText);
            }

        } catch (error) {
            console.error('Payment Error:', error);
            alert(error.message || 'An unexpected error occurred during payment initialization.');
            this.resetButton(originalText);
        }
    }

    // Razorpay's SDK is fetched on first use instead of on every pricing page:
    // it is heavy, and on load it scans the page's forms and throws on any form
    // with a hidden "action" input (Craft's actionInput()).
    loadRazorpay() {
        if (typeof Razorpay !== 'undefined') return Promise.resolve();
        if (!this.razorpayLoader) {
            this.razorpayLoader = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = resolve;
                script.onerror = () => {
                    this.razorpayLoader = null;
                    reject(new Error('Razorpay SDK failed to load.'));
                };
                document.head.appendChild(script);
            });
        }
        return this.razorpayLoader;
    }

    async handleRazorpay(order, data, originalText) {
        try {
            await this.loadRazorpay();
        } catch (error) {
            alert(error.message);
            this.resetButton(originalText);
            return;
        }

        const options = {
            "key": order.key_id,
            "amount": order.amount * 100, // in paise
            "currency": order.currency,
            "name": data.plan || "Payment",
            "order_id": order.order_id,
            "prefill": {
                "name": order.customerName || data.customerName,
                "email": order.customerEmail || data.customerEmail,
                "contact": order.customerPhone || data.customerPhone
            },
            "handler": async (response) => {
                // 3. Verify on server (JS Fallback/Manual success)
                const verifyRes = await fetch('/payment-gateway/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gateway: 'razorpay',
                        order_id: order.order_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        CRAFT_CSRF_TOKEN: data.CRAFT_CSRF_TOKEN
                    })
                });

                const verifyResult = await verifyRes.json();
                if (verifyResult.success) {
                    window.location.href = `/payment-gateway/success?gateway=razorpay&order_id=${order.order_id}&payment_id=${response.razorpay_payment_id}`;
                } else {
                    window.location.href = `/payment-gateway/success?gateway=razorpay&order_id=${order.order_id}&payment_id=${response.razorpay_payment_id}`;
                }
            },
            "modal": {
                "ondismiss": () => {
                    window.location.href = `/payment-gateway/cancel?gateway=razorpay&order_id=${order.order_id}`;
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
        
        // Start polling for status (especially for QR/UPI flows)
        this.startPaymentPolling(order.order_id);
    }

    startPaymentPolling(orderId) {
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;

            try {
                const res = await fetch(`/payment-gateway/check-status?order_id=${orderId}`);
                const data = await res.json();

                if (data.status === 'paid') {
                    clearInterval(interval);
                    window.location.href = `/payment-gateway/success?gateway=razorpay&order_id=${orderId}`;
                }

                // stop after ~2 minutes (40 * 3s)
                if (attempts > 40) {
                    clearInterval(interval);
                    console.warn('Payment polling timeout');
                }

            } catch (err) {
                console.error('Polling error', err);
            }

        }, 3000);
    }

    async handleStripe(order, data, originalText) {
        if (order.redirect_url) {
            window.location.href = order.redirect_url;
        } else {
            alert('Stripe redirect URL not found.');
            this.resetButton(originalText);
        }
    }

    resetButton(text) {
        this.payButton.disabled = false;
        this.payButton.innerHTML = text;
    }
}
