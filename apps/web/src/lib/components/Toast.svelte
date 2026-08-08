<script>
  import { onMount } from 'svelte'
  import { CheckCircle, XCircle, AlertTriangle, Info, X } from '@lucide/svelte'

  export let duration = 3000
  export let position = 'bottom-right'

  let message = ''
  /** @type {'success' | 'error' | 'warning' | 'info'} */
  let toastType = 'success'
  let visible = false
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null
  let progressWidth = 100

  const iconComponents = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  /**
   * @param {string} newMessage
   * @param {'success' | 'error' | 'warning' | 'info'} [newType]
   */
  export function show(newMessage, newType = 'success') {
    if (timeoutId) clearTimeout(timeoutId)
    message = newMessage
    toastType = newType
    visible = true
    progressWidth = 100

    const startTime = Date.now()
    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      progressWidth = remaining

      if (remaining > 0 && visible) {
        requestAnimationFrame(animateProgress)
      }
    }

    requestAnimationFrame(animateProgress)

    timeoutId = setTimeout(() => {
      visible = false
    }, duration)
  }

  function hide() {
    visible = false
    if (timeoutId) clearTimeout(timeoutId)
  }

  onMount(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  })
</script>

{#if visible}
  <div
    class="toast toast-{toastType} toast-{position}"
    role="alert"
    aria-live="polite"
  >
    <div class="toast-content">
      <span class="toast-icon">
        <svelte:component this={iconComponents[toastType]} size={18} />
      </span>
      <span class="toast-message">{message}</span>
    </div>
    <button type="button" class="toast-close" on:click={hide} aria-label="Dismiss notification">
      <X size={14} />
    </button>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="width: {progressWidth}%"></div>
    </div>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    z-index: var(--z-popover);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 260px;
    max-width: 360px;
    animation: slideIn var(--transition) var(--ease-snap);
    overflow: hidden;
  }

  .toast-bottom-right {
    bottom: var(--space-5);
    right: var(--space-5);
  }

  .toast-bottom-left {
    bottom: var(--space-5);
    left: var(--space-5);
  }

  .toast-top-right {
    top: var(--space-5);
    right: var(--space-5);
  }

  .toast-top-left {
    top: var(--space-5);
    left: var(--space-5);
  }

  .toast-top-center {
    top: var(--space-5);
    left: 50%;
    transform: translateX(-50%);
  }

  .toast-bottom-center {
    bottom: var(--space-5);
    left: 50%;
    transform: translateX(-50%);
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-success .toast-icon {
    color: var(--success);
  }

  .toast-error .toast-icon {
    color: var(--error);
  }

  .toast-warning .toast-icon {
    color: var(--warning);
  }

  .toast-info .toast-icon {
    color: var(--info);
  }

  .toast-message {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    line-height: var(--leading-snug);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toast-close {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .toast-close:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border-subtle);
  }

  .toast-progress-bar {
    height: 100%;
    transition: width 50ms linear;
  }

  .toast-success .toast-progress-bar {
    background: var(--success);
  }

  .toast-error .toast-progress-bar {
    background: var(--error);
  }

  .toast-warning .toast-progress-bar {
    background: var(--warning);
  }

  .toast-info .toast-progress-bar {
    background: var(--info);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    .toast {
      left: var(--space-3);
      right: var(--space-3);
      min-width: auto;
      max-width: none;
    }

    .toast-bottom-right,
    .toast-bottom-left,
    .toast-bottom-center {
      bottom: var(--space-3);
    }

    .toast-top-right,
    .toast-top-left,
    .toast-top-center {
      top: var(--space-3);
    }

    .toast-top-center,
    .toast-bottom-center {
      transform: none;
    }
  }
</style>
