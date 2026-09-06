export const globalStyleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }
body { margin: 0; }

.pf-btn-primary {
  background: linear-gradient(180deg, #A6DB6B, #8BC34A);
  color: #0A0B08;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: filter 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
}
.pf-btn-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.pf-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

.pf-btn-ghost {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #D7DBD5;
  font-size: 13px;
  font-weight: 500;
  border-radius: 10px;
  padding: 9px 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s ease;
}
.pf-btn-ghost:hover { background: rgba(255,255,255,0.08); }

.pf-btn-danger {
  background: rgba(229,72,77,0.12);
  border: 1px solid rgba(229,72,77,0.4);
  color: #E5484D;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s ease;
}
.pf-btn-danger:hover:not(:disabled) { background: rgba(229,72,77,0.2); }
.pf-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.pf-btn-cancel {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  color: #9BA39A;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.pf-btn-cancel:hover:not(:disabled) {
  color: #E5484D;
  border-color: rgba(229,72,77,0.35);
  background: rgba(229,72,77,0.06);
}
.pf-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.pf-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #6B726A;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.55;
  transition: background 0.15s ease, color 0.15s ease;
}
.pf-nav-item-active {
  color: #F3F5F1;
  cursor: pointer;
  opacity: 1;
  background: rgba(139,195,74,0.1);
}
.pf-nav-item-active:hover { background: rgba(139,195,74,0.16); }

.pf-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(10,11,8,0.25);
  border-top-color: #0A0B08;
  animation: pf-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes pf-spin { to { transform: rotate(360deg); } }

.pf-pulse { animation: pf-pulse-anim 1.4s ease-in-out infinite; }
@keyframes pf-pulse-anim {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pf-indeterminate {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #8BC34A, transparent);
  animation: pf-indeterminate-slide 1.4s ease-in-out infinite;
}
@keyframes pf-indeterminate-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.pf-intro-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,195,74,0.10) 0%, rgba(139,195,74,0) 65%);
  pointer-events: none;
  animation: pf-glow-breathe 8s ease-in-out infinite;
}
@keyframes pf-glow-breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.pf-log-scroll::-webkit-scrollbar { width: 6px; }
.pf-log-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

input[type="range"] { height: 4px; }
input::placeholder, textarea::placeholder { color: #5C645C; }
input:focus, textarea:focus, select:focus { border-color: #8BC34A !important; }
@keyframes pfShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@media (max-width: 860px) {
  .pf-sidebar { display: none; }
}

/* ============================================================
   Añadido — capability IMAGE (selector Standard/Premium,
   secciones colapsables). Todo lo anterior permanece intacto.
   ============================================================ */

.pf-model-toggle button:hover {
  color: #F3F5F1;
}
.pf-model-toggle button[data-active="true"]:hover {
  color: #0A0B08;
}

.pf-accordion-header:hover .pf-accordion-caret {
  color: #9BA39A;
}

@keyframes pf-accordion-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.pf-accordion-content {
  animation: pf-accordion-in 0.18s ease;
}

.pf-panel-transition {
  transition: opacity 0.2s ease;
}
`;