(function () {
  'use strict';

  // The poster is ordinary HTML. This optional enhancement never owns hero content.
  class Hero3D {
    constructor(element) {
      this.element = element;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mobile = matchMedia('(max-width: 780px)');
      this.version = 0;
      this.config = {
        enabled: element.dataset.splineEnabled === 'true',
        sceneUrl: element.dataset.splineSrc || '',
        runtimeUrl: element.dataset.splineRuntime || '',
        allowMobile: element.dataset.splineMobile === 'true'
      };
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        if (this.visible) this.load();
        this.syncPlayback();
      }, { threshold: 0.05 });
      this.observer.observe(element);
      this.onPreference = () => {
        if (!this.eligible()) this.reset();
        else if (this.visible) this.load();
      };
      this.onVisibility = () => this.syncPlayback();
      this.motion.addEventListener('change', this.onPreference);
      this.mobile.addEventListener('change', this.onPreference);
      document.addEventListener('visibilitychange', this.onVisibility);
      navigator.connection?.addEventListener('change', this.onPreference);
      element.hero3D = this;
    }

    configure(options) {
      this.reset();
      Object.assign(this.config, options);
      if (this.visible) this.load();
    }

    eligible() {
      return this.config.enabled && !this.motion.matches &&
        (!this.mobile.matches || this.config.allowMobile) &&
        !navigator.connection?.saveData &&
        !(navigator.deviceMemory && navigator.deviceMemory <= 2) &&
        location.protocol !== 'file:';
    }

    urls() {
      try {
        const scene = new URL(this.config.sceneUrl, document.baseURI);
        const runtime = new URL(this.config.runtimeUrl, document.baseURI);
        if (!this.config.sceneUrl || !this.config.runtimeUrl) return null;
        const local = scene.origin === location.origin;
        if ((!local && (scene.protocol !== 'https:' || scene.hostname !== 'prod.spline.design')) ||
            !scene.pathname.endsWith('.splinecode') || scene.username || scene.password ||
            runtime.origin !== location.origin || !runtime.pathname.endsWith('.js')) return null;
        return { scene: scene.href, runtime: runtime.href };
      } catch { return null; }
    }

    async load() {
      if (this.loading || this.app || this.failed || !this.eligible()) return;
      const urls = this.urls();
      if (!urls) return;
      this.loading = true;
      const version = this.version;
      const controller = new AbortController();
      this.controller = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      let app;
      let canvas;
      try {
        // Verify the supplied asset before downloading or executing a 3D runtime.
        const response = await fetch(urls.scene, { method: 'HEAD', signal: controller.signal });
        if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('Scene unavailable');
        if (controller.signal.aborted || version !== this.version) return;
        const module = await import(urls.runtime);
        if (controller.signal.aborted || !this.eligible() || version !== this.version) return;
        canvas = document.createElement('canvas');
        canvas.className = 'hero-3d-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        this.element.append(canvas);
        this.canvas = canvas;
        app = new module.Application(canvas);
        await Promise.race([
          app.load(urls.scene),
          new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new Error('Scene timed out')), { once: true }))
        ]);
        if (controller.signal.aborted || !this.eligible() || version !== this.version) { app.dispose(); canvas.remove(); return; }
        this.app = app;
        this.element.classList.add('scene-ready');
        this.syncPlayback();
      } catch {
        app?.dispose();
        canvas?.remove();
        if (version === this.version) {
          this.element.classList.remove('scene-ready');
          this.failed = true;
          this.element.dispatchEvent(new CustomEvent('hero3d:fallback'));
        }
      } finally {
        clearTimeout(timeout);
        if (this.controller === controller) this.loading = false;
      }
    }

    syncPlayback() {
      if (!this.app) return;
      if (this.visible && !document.hidden && this.eligible()) this.app.play();
      else this.app.stop();
    }

    reset() {
      this.version++;
      this.controller?.abort();
      this.app?.dispose();
      this.canvas?.remove();
      this.app = null;
      this.loading = false;
      this.failed = false;
      this.element.classList.remove('scene-ready');
    }

    destroy() {
      this.reset();
      this.observer.disconnect();
      this.motion.removeEventListener('change', this.onPreference);
      this.mobile.removeEventListener('change', this.onPreference);
      document.removeEventListener('visibilitychange', this.onVisibility);
      navigator.connection?.removeEventListener('change', this.onPreference);
      delete this.element.hero3D;
    }
  }

  window.Hero3D = Hero3D;
  document.addEventListener('DOMContentLoaded', () => {
    if ('IntersectionObserver' in window) {
      document.querySelectorAll('[data-hero-3d]').forEach(el => new Hero3D(el));
    }
  });
})();
