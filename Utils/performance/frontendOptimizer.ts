/**
 * Frontend Performance Optimizer
 * Provides image optimization, lazy loading, and bundle optimization
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  lazy?: boolean;
  placeholder?: string;
}

export interface BundleOptimizationOptions {
  preload?: string[];
  prefetch?: string[];
  defer?: string[];
  async?: string[];
}

export class FrontendOptimizer {
  /**
   * Generate optimized image URL with Next.js Image Optimization
   */
  getOptimizedImageUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const {
      width = 800,
      height,
      quality = 75,
      format = 'webp',
      lazy = true
    } = options;

    // For external images, use Next.js Image Optimization API
    if (src.startsWith('http')) {
      const params = new URLSearchParams({
        url: src,
        w: width.toString(),
        q: quality.toString(),
        f: format
      });

      if (height) {
        params.set('h', height.toString());
      }

      return `/api/image-optimization?${params.toString()}`;
    }

    // For local images, return as-is (Next.js handles optimization automatically)
    return src;
  }

  /**
   * Generate responsive image srcSet
   */
  getResponsiveSrcSet(
    src: string,
    widths: number[] = [320, 640, 768, 1024, 1280],
    options: Omit<ImageOptimizationOptions, 'width'> = {}
  ): string {
    return widths
      .map(width => {
        const optimizedUrl = this.getOptimizedImageUrl(src, { ...options, width });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Generate lazy loading attributes
   */
  getLazyLoadingAttributes(options: { threshold?: number; rootMargin?: string } = {}) {
    const { threshold = 0.1, rootMargin = '50px' } = options;
    
    return {
      loading: 'lazy' as const,
      'data-intersection-threshold': threshold.toString(),
      'data-intersection-root-margin': rootMargin
    };
  }

  /**
   * Generate preload hints for critical resources
   */
  generatePreloadHints(resources: Array<{ href: string; as: string; type?: string }>): string {
    return resources
      .map(resource => {
        const attrs = [
          `href="${resource.href}"`,
          `as="${resource.as}"`
        ];

        if (resource.type) {
          attrs.push(`type="${resource.type}"`);
        }

        return `<link rel="preload" ${attrs.join(' ')} />`;
      })
      .join('\n');
  }

  /**
   * Generate prefetch hints for likely next resources
   */
  generatePrefetchHints(resources: string[]): string {
    return resources
      .map(href => `<link rel="prefetch" href="${href}" />`)
      .join('\n');
  }

  /**
   * Optimize CSS for critical path
   */
  getCriticalCSS(componentName: string): string {
    // In a real implementation, you'd extract critical CSS for each component
    // For now, return a placeholder
    return `
      /* Critical CSS for ${componentName} */
      .${componentName} {
        contain: layout style paint;
        will-change: transform;
      }
    `;
  }

  /**
   * Generate service worker registration
   */
  generateServiceWorkerRegistration(): string {
    return `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    `;
  }

  /**
   * Generate resource hints for performance
   */
  generateResourceHints(options: BundleOptimizationOptions = {}): string {
    const { preload = [], prefetch = [], defer = [], async = [] } = options;
    
    const hints: string[] = [];

    // Preload critical resources
    preload.forEach((resource: string) => {
      hints.push(`<link rel="preload" href="${resource}" as="script" />`);
    });

    // Prefetch likely next resources
    prefetch.forEach((resource: string) => {
      hints.push(`<link rel="prefetch" href="${resource}" />`);
    });

    // Defer non-critical scripts
    defer.forEach((resource: string) => {
      hints.push(`<script src="${resource}" defer></script>`);
    });

    // Async non-blocking scripts
    async.forEach((resource: string) => {
      hints.push(`<script src="${resource}" async></script>`);
    });

    return hints.join('\n');
  }

  /**
   * Optimize fonts loading
   */
  generateFontOptimization(fonts: Array<{ family: string; weights: number[]; display?: string }>): string {
    const fontLinks = fonts.map(font => {
      const weights = font.weights.join(';');
      const display = font.display || 'swap';
      
      return `<link rel="preload" href="/fonts/${font.family.toLowerCase().replace(/\s+/g, '-')}.woff2" as="font" type="font/woff2" crossorigin />`;
    });

    const fontCSS = fonts.map(font => {
      const weights = font.weights.join(' ');
      const display = font.display || 'swap';
      
      return `@font-face {
        font-family: '${font.family}';
        font-weight: ${weights};
        font-display: ${display};
        src: url('/fonts/${font.family.toLowerCase().replace(/\s+/g, '-')}.woff2') format('woff2');
      }`;
    });

    return fontLinks.join('\n') + '\n<style>' + fontCSS.join('\n') + '</style>';
  }

  /**
   * Generate performance monitoring script
   */
  generatePerformanceMonitoring(): string {
    return `
      <script>
        // Performance monitoring
        if ('performance' in window) {
          window.addEventListener('load', () => {
            // Core Web Vitals
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  console.log('LCP:', entry.startTime);
                }
                if (entry.entryType === 'first-input') {
                  console.log('FID:', entry.processingStart - entry.startTime);
                }
                if (entry.entryType === 'layout-shift') {
                  if (!entry.hadRecentInput) {
                    console.log('CLS:', entry.value);
                  }
                }
              }
            });

            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

            // Navigation timing
            const navigation = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', navigation.loadEventEnd - navigation.fetchStart);
          });
        }
      </script>
    `;
  }

  /**
   * Generate bundle analysis script
   */
  generateBundleAnalysis(): string {
    return `
      <script>
        // Bundle size monitoring
        if (typeof window !== 'undefined' && window.performance) {
          const resources = performance.getEntriesByType('resource');
          const scripts = resources.filter(r => r.name.includes('.js'));
          const styles = resources.filter(r => r.name.includes('.css'));
          
          console.log('Scripts loaded:', scripts.length);
          console.log('Styles loaded:', styles.length);
          console.log('Total bundle size:', scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0));
        }
      </script>
    `;
  }

  /**
   * Generate lazy loading implementation
   */
  generateLazyLoadingScript(): string {
    return `
      <script>
        // Lazy loading implementation
        if ('IntersectionObserver' in window) {
          const lazyImages = document.querySelectorAll('img[data-src]');
          const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
              }
            });
          });

          lazyImages.forEach(img => imageObserver.observe(img));
        }
      </script>
    `;
  }

  /**
   * Generate cache optimization headers
   */
  generateCacheHeaders(staticAssets: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {};

    if (staticAssets) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      headers['ETag'] = '"static-asset"';
    } else {
      headers['Cache-Control'] = 'public, max-age=300, s-maxage=3600';
      headers['Vary'] = 'Accept-Encoding';
    }

    return headers;
  }

  /**
   * Optimize API calls with batching
   */
  createApiBatcher<T, R>(
    batchSize: number = 10,
    delay: number = 100
  ): (item: T) => Promise<R> {
    let batch: T[] = [];
    let timeout: NodeJS.Timeout | null = null;

    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        batch.push(item);

        if (batch.length >= batchSize) {
          this.processBatch(batch, resolve, reject);
          batch = [];
        } else if (!timeout) {
          timeout = setTimeout(() => {
            this.processBatch(batch, resolve, reject);
            batch = [];
            timeout = null;
          }, delay);
        }
      });
    };
  }

  private processBatch<T, R>(
    batch: T[],
    resolve: (value: R) => void,
    reject: (reason?: any) => void
  ): void {
    // In a real implementation, you'd batch the API calls
    // For now, process individually
    batch.forEach(item => {
      // Process item and resolve
      resolve(item as unknown as R);
    });
  }
}

// Singleton instance
export const frontendOptimizer = new FrontendOptimizer();
