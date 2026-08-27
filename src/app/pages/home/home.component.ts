import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit() {
    this.initReveal();
    this.initCountUp();
  }

  private initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .14 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  private initCountUp() {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { this.countUp(e.target as HTMLElement); cio.unobserve(e.target); } });
    }, { threshold: .5 });
    document.querySelectorAll('.num[data-count]').forEach(el => cio.observe(el));
  }

  private countUp(el: HTMLElement) {
    const target = +el.dataset['count']!, suffix = el.dataset['suffix'] || '', dur = 1500, t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('fr-FR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  switchTab(tab: string, btn: HTMLElement) {
    document.querySelectorAll('.sc-tab').forEach(b => b.classList.remove('sc-tab--active'));
    btn.classList.add('sc-tab--active');
    const isRender = tab === 'render';
    (document.getElementById('scEditor') as HTMLElement).style.display = isRender ? 'none' : 'block';
    (document.getElementById('scRender') as HTMLElement).style.display = isRender ? 'block' : 'none';
    (document.getElementById('scUrl') as HTMLElement).textContent = isRender
      ? 'mitoera.com/render.html?key=pk_pub_…&event=…'
      : 'mitoera.com/admin/plans/palais-de-sport';
    const phone = document.getElementById('scPhone') as HTMLElement;
    phone.classList.toggle('sc-phone--hidden', !isRender);
  }

  readonly RECAPTCHA_SITE_KEY = '6LcmI5stAAAAAPX33gdcNMel6OMVDzrbsx6V2gAg';

  async submitContact(e: Event) {
    e.preventDefault();
    const btn = document.getElementById('contactBtn') as HTMLButtonElement;
    const msg = document.getElementById('contactMsg') as HTMLElement;
    const form = e.target as HTMLFormElement;
    btn.disabled = true; btn.textContent = 'Envoi…';
    const data: Record<string, string> = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try {
      const token = await (window as any).grecaptcha.execute(this.RECAPTCHA_SITE_KEY, { action: 'contact' });
      data['recaptchaToken'] = token;
      const res = await fetch('https://api.mitoera.com/api/public/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) { form.reset(); msg.style.display = 'block'; msg.textContent = '✓ Message envoyé ! Nous vous répondrons très bientôt.'; btn.textContent = 'Envoyé ✓'; }
      else throw new Error();
    } catch {
      btn.disabled = false; btn.textContent = 'Nous contacter →';
      msg.style.display = 'block'; msg.style.color = '#fca5a5';
      msg.textContent = 'Une erreur est survenue, veuillez réessayer.';
    }
  }
}
