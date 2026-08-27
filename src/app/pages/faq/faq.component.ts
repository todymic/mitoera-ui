import { Component, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements AfterViewInit {
  ngAfterViewInit() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .14 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  toggleFaq(btn: HTMLElement) {
    const item = btn.closest('.faq-item')!;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  }
}
