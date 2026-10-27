/**
 * One line of feedback inside a form, instead of a browser alert(). Visitors
 * never see a server's error text (it can be a PHP exception): failures show
 * the form's data-error-message, or a friendly default, and the details go to
 * the console (docs/43 #56 in Site7 Studio).
 */
const DEFAULT_ERROR = "Sorry, your message couldn't be sent. Please try again later."

const messageEl = (form) => {
  let el = form.querySelector('.form-message')
  if (!el) {
    el = document.createElement('p')
    el.className = 'form-message mt-3 mb-0 text-sm'
    el.setAttribute('role', 'alert')
    form.appendChild(el)
  }
  return el
}

export const showFormError = (form, details = null) => {
  if (details) console.error('Form submission failed:', details)
  const el = messageEl(form)
  el.textContent = form.dataset.errorMessage || DEFAULT_ERROR
  el.classList.remove('text-graphite')
  el.classList.add('text-danger')
}

export const showFormNotice = (form, text) => {
  const el = messageEl(form)
  el.textContent = text
  el.classList.remove('text-danger')
  el.classList.add('text-graphite')
}

export const clearFormMessage = (form) => {
  const el = form.querySelector('.form-message')
  if (el) el.textContent = ''
}
