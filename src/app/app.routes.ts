import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'pricing', loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'faq', loadComponent: () => import('./pages/faq/faq.component').then(m => m.FaqComponent) },
  { path: '**', redirectTo: '' },
];
