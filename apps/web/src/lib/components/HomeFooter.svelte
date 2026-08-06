<footer class="home-footer">
  <div class="footer-links">
    <a href="https://github.com/arasovic/dev-utilities" target="_blank" rel="noopener noreferrer" class="footer-link">
      GitHub
    </a>
  </div>
  <p class="footer-copyright">© {new Date().getFullYear()} tols. All rights reserved.</p>
</footer>

<style>
  .home-footer {
    margin-top: var(--space-10);
    padding-top: var(--space-6);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-links {
    display: flex;
    gap: var(--space-4);
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .footer-link:hover {
    color: var(--text-primary);
  }

  .footer-copyright {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin: 0;
  }

  @media (max-width: 640px) {
    .home-footer {
      flex-direction: column;
      gap: var(--space-3);
      text-align: center;
    }
  }
</style>
