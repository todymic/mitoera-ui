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
    this.initEditor();
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

  private initEditor() {
    const PRICES: Record<string, number> = { vip: 45, standard: 25, balcon: 15 };
    const CAT_LABEL: Record<string, string> = { vip: 'VIP', standard: 'Standard', balcon: 'Balcon' };
    const rows = [
      { id: 'A', category: 'vip', seats: 10, disabled: [3] },
      { id: 'B', category: 'vip', seats: 10, disabled: [] },
      { id: 'C', category: 'standard', seats: 12, disabled: [5, 6] },
      { id: 'D', category: 'standard', seats: 12, disabled: [] },
      { id: 'E', category: 'standard', seats: 12, disabled: [2] },
      { id: 'F', category: 'balcon', seats: 14, disabled: [9, 10, 11] },
    ];
    const selected: Record<string, { key: string; category: string; price: number }> = {};
    const stageWrap = document.getElementById('stageWrap');
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    if (!stageWrap || !cartList || !cartTotal) return;

    const renderCart = () => {
      const keys = Object.keys(selected);
      cartList.innerHTML = '';
      if (!keys.length) {
        const li = document.createElement('li'); li.className = 'cart-empty'; li.textContent = 'Cliquez sur un siège pour commencer.'; cartList.appendChild(li);
      } else {
        keys.sort().forEach(key => {
          const item = selected[key];
          const li = document.createElement('li'); li.className = 'cart-item';
          const dot = document.createElement('span'); dot.className = 'cart-item__dot';
          dot.style.background = item.category === 'vip' ? 'var(--coral)' : item.category === 'balcon' ? 'var(--ink)' : 'var(--sea)';
          const label = document.createElement('span'); label.className = 'cart-item__label'; label.textContent = 'Siège ' + key.replace('-', '');
          const price = document.createElement('span'); price.className = 'cart-item__price'; price.textContent = item.price + ' €';
          const remove = document.createElement('button'); remove.className = 'cart-item__remove'; remove.innerHTML = '&times;';
          remove.addEventListener('click', () => {
            const seat = stageWrap.querySelector(`[data-key="${key}"]`) as HTMLButtonElement;
            if (seat) { seat.classList.remove('is-selected'); seat.setAttribute('aria-pressed', 'false'); }
            delete selected[key]; renderCart();
          });
          li.append(dot, label, price, remove); cartList.appendChild(li);
        });
      }
      cartTotal!.textContent = keys.reduce((s, k) => s + selected[k].price, 0) + ' €';
    };

    const toggleSeat = (seat: HTMLButtonElement) => {
      const key = seat.dataset['key']!, category = seat.dataset['category']!;
      if (selected[key]) { delete selected[key]; seat.classList.remove('is-selected'); seat.setAttribute('aria-pressed', 'false'); }
      else { selected[key] = { key, category, price: PRICES[category] }; seat.classList.add('is-selected'); seat.setAttribute('aria-pressed', 'true'); }
      renderCart();
    };

    const renderRow = (row: typeof rows[0], isNew: boolean) => {
      const rowEl = document.createElement('div'); rowEl.className = 'stage-row' + (isNew ? ' row-enter' : '');
      const lbl = document.createElement('span'); lbl.className = 'stage-row__label'; lbl.textContent = row.id; rowEl.appendChild(lbl);
      const seatsWrap = document.createElement('div'); seatsWrap.className = 'stage-row__seats';
      const mid = Math.floor(row.seats / 2) - 1;
      for (let i = 0; i < row.seats; i++) {
        const seat = document.createElement('button') as HTMLButtonElement;
        const key = row.id + '-' + i;
        seat.className = 'seat' + (i === mid ? ' aisle-after' : '');
        seat.dataset['key'] = key; seat.dataset['category'] = row.category;
        seat.setAttribute('aria-pressed', 'false');
        if ((row.disabled as number[]).includes(i)) { seat.disabled = true; }
        else { seat.addEventListener('click', () => toggleSeat(seat)); }
        seatsWrap.appendChild(seat);
      }
      rowEl.appendChild(seatsWrap); stageWrap.appendChild(rowEl);
    };

    rows.forEach(r => renderRow(r, false));
    renderCart();

    document.getElementById('addRowBtn')?.addEventListener('click', () => {
      const last = rows[rows.length - 1].id;
      const newRow = { id: String.fromCharCode(last.charCodeAt(0) + 1), category: 'standard', seats: 12, disabled: [] as number[] };
      rows.push(newRow); renderRow(newRow, true);
    });
    document.getElementById('resetToolBtn')?.addEventListener('click', () => {
      Object.keys(selected).forEach(k => delete selected[k]);
      stageWrap.querySelectorAll('.seat.is-selected').forEach((s: Element) => { s.classList.remove('is-selected'); s.setAttribute('aria-pressed', 'false'); });
      renderCart();
    });

    let zoom = 1;
    const zoomLabel = document.getElementById('zoomLabel');
    const applyZoom = () => { stageWrap.style.transform = `scale(${zoom})`; if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + '%'; };
    document.getElementById('zoomIn')?.addEventListener('click', () => { zoom = Math.min(1.3, zoom + .15); applyZoom(); });
    document.getElementById('zoomOut')?.addEventListener('click', () => { zoom = Math.max(.7, zoom - .15); applyZoom(); });
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
