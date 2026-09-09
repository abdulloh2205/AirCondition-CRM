import React, { useState, useRef, useCallback } from 'react';

interface Zone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'good' | 'bad';
  reason?: string;
  badLabel?: string;
}

interface AcUnit {
  x: number;
  y: number;
  valid: boolean;
  zone?: Zone;
}

interface RoomDef {
  id: 'living' | 'bedroom' | 'office';
  label: string;
  labelUz: string;
  icon: string;
  photo: string;
  windows: { x: number; y: number; w: number; h: number; label: string }[];
  doors: { x: number; y: number; w: number; h: number }[];
  furniture: { x: number; y: number; w: number; h: number; label: string; color: string }[];
  zones: Zone[];
}

const ROOMS: RoomDef[] = [
  {
    id: 'living',
    label: 'Гостиная',
    labelUz: 'Mehmonxona',
    icon: '🛋️',
    photo: '/room_living.jpg',
    windows: [
      { x: 20, y: 5, w: 20, h: 2.5, label: 'Окно' },
      { x: 60, y: 5, w: 18, h: 2.5, label: 'Окно' },
    ],
    doors: [{ x: 88, y: 45, w: 7, h: 2.5 }],
    furniture: [
      { x: 28, y: 45, w: 26, h: 14, label: 'Диван', color: '#c8a87a' },
      { x: 34, y: 32, w: 12, h: 11, label: 'Стол', color: '#b8955a' },
      { x: 62, y: 43, w: 22, h: 18, label: 'ТВ-стенд', color: '#8a6d4a' },
      { x: 10, y: 45, w: 10, h: 12, label: 'Кресло', color: '#c8a87a' },
    ],
    zones: [
      { id: 'l-b1', x: 18, y: 5, w: 24, h: 20, type: 'bad',
        reason: 'Прямые солнечные лучи через окно перегрузят компрессор и нарушат работу термостата.', badLabel: 'Под окном ☀️' },
      { id: 'l-b2', x: 58, y: 5, w: 22, h: 20, type: 'bad',
        reason: 'Тепловые потоки от стекла мешают нормальному охлаждению воздуха.', badLabel: 'Под окном ☀️' },
      { id: 'l-b3', x: 26, y: 28, w: 30, h: 22, type: 'bad',
        reason: 'Прямой поток холодного воздуха на сидящих людей — дискомфорт и риск простуды.', badLabel: 'Над диваном 🛋️' },
      { id: 'l-b4', x: 78, y: 38, w: 17, h: 27, type: 'bad',
        reason: 'Рядом с дверью: постоянный приток тёплого воздуха снижает эффективность на 40%.', badLabel: 'У двери 🚪' },
      { id: 'l-g1', x: 6, y: 7, w: 13, h: 30, type: 'good' },
      { id: 'l-g2', x: 45, y: 7, w: 13, h: 20, type: 'good' },
      { id: 'l-g3', x: 6, y: 38, w: 20, h: 25, type: 'good' },
    ],
  },
  {
    id: 'bedroom',
    label: 'Спальня',
    labelUz: 'Yotoqxona',
    icon: '🛏️',
    photo: '/room_bedroom.jpg',
    windows: [
      { x: 35, y: 5, w: 25, h: 2.5, label: 'Окно' },
    ],
    doors: [{ x: 5, y: 40, w: 2.5, h: 12 }],
    furniture: [
      { x: 28, y: 38, w: 30, h: 22, label: 'Кровать', color: '#c8a87a' },
      { x: 62, y: 40, w: 10, h: 20, label: 'Тумба', color: '#b8955a' },
      { x: 75, y: 8, w: 18, h: 28, label: 'Шкаф', color: '#8a6d4a' },
      { x: 8, y: 8, w: 18, h: 25, label: 'Комод', color: '#a87d50' },
    ],
    zones: [
      { id: 'bd-b1', x: 22, y: 25, w: 44, h: 40, type: 'bad',
        reason: 'Прямой поток холодного воздуха во время сна вызывает переохлаждение и нарушение сна.', badLabel: 'Над кроватью 🛏️' },
      { id: 'bd-b2', x: 30, y: 5, w: 33, h: 22, type: 'bad',
        reason: 'Прямое солнечное воздействие и горячие потоки от стекла снизят КПД кондиционера.', badLabel: 'Под окном ☀️' },
      { id: 'bd-b3', x: 5, y: 34, w: 18, h: 30, type: 'bad',
        reason: 'Рядом с дверью: потоки воздуха из коридора нарушают климатическое оборудование.', badLabel: 'У двери 🚪' },
      { id: 'bd-g1', x: 6, y: 7, w: 20, h: 26, type: 'good' },
      { id: 'bd-g2', x: 66, y: 7, w: 8, h: 30, type: 'good' },
      { id: 'bd-g3', x: 8, y: 63, w: 84, h: 4, type: 'good' },
    ],
  },
  {
    id: 'office',
    label: 'Офис',
    labelUz: 'Ofis',
    icon: '🖥️',
    photo: '/room_office.jpg',
    windows: [
      { x: 10, y: 5, w: 15, h: 2.5, label: 'Окно' },
      { x: 70, y: 5, w: 20, h: 2.5, label: 'Окно' },
    ],
    doors: [{ x: 44, y: 62.5, w: 12, h: 2.5 }],
    furniture: [
      { x: 10, y: 20, w: 18, h: 10, label: 'Стол 1', color: '#b8955a' },
      { x: 10, y: 34, w: 18, h: 10, label: 'Стол 2', color: '#b8955a' },
      { x: 10, y: 48, w: 18, h: 10, label: 'Стол 3', color: '#b8955a' },
      { x: 36, y: 20, w: 18, h: 10, label: 'Стол 4', color: '#b8955a' },
      { x: 36, y: 34, w: 18, h: 10, label: 'Стол 5', color: '#b8955a' },
      { x: 62, y: 18, w: 25, h: 40, label: 'Переговор.', color: '#8a6d4a' },
    ],
    zones: [
      { id: 'of-b1', x: 8, y: 16, w: 24, h: 47, type: 'bad',
        reason: 'Прямой поток холодного воздуха на рабочие места — нарушение норм СанПиН 2.2.4.548.', badLabel: 'Над рабочими местами 💼' },
      { id: 'of-b2', x: 34, y: 16, w: 24, h: 47, type: 'bad',
        reason: 'Сотрудники под прямым обдувом — снижение производительности и риск заболеваний.', badLabel: 'Над рабочими местами 💼' },
      { id: 'of-b3', x: 36, y: 52, w: 28, h: 13, type: 'bad',
        reason: 'У входной двери: постоянный теплообмен с коридором снижает эффективность системы.', badLabel: 'У входа 🚪' },
      { id: 'of-b4', x: 8, y: 5, w: 19, h: 15, type: 'bad',
        reason: 'Под окном: попадание прямых лучей на испаритель ведёт к обмерзанию и поломке.', badLabel: 'Под окном ☀️' },
      { id: 'of-g1', x: 67, y: 7, w: 22, h: 10, type: 'good' },
      { id: 'of-g2', x: 30, y: 7, w: 12, h: 10, type: 'good' },
      { id: 'of-g3', x: 62, y: 58, w: 28, h: 6, type: 'good' },
    ],
  },
];

function findZone(zones: Zone[], px: number, py: number): Zone | undefined {
  const bad = zones.filter(z => z.type === 'bad').find(
    z => px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h
  );
  if (bad) return bad;
  return zones.find(z => z.type === 'good' && px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h);
}

interface Props { onClose: () => void; lang: string; }

export const AcPlannerModal: React.FC<Props> = ({ onClose, lang }) => {
  const [roomId, setRoomId] = useState<'living' | 'bedroom' | 'office'>('living');
  const [ac, setAc] = useState<AcUnit | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoverZone, setHoverZone] = useState<Zone | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const room = ROOMS.find(r => r.id === roomId)!;

  const getSvgCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return { px: ((e.clientX - rect.left) / rect.width) * 100, py: ((e.clientY - rect.top) / rect.height) * 70 };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const c = getSvgCoords(e);
    if (!c) return;
    if (c.px < 5 || c.px > 95 || c.py < 5 || c.py > 65) { setCursor(null); setHoverZone(null); return; }
    setCursor({ x: c.px, y: c.py });
    setHoverZone(findZone(room.zones, c.px, c.py) || null);
  }, [getSvgCoords, room]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const c = getSvgCoords(e);
    if (!c || c.px < 5 || c.px > 95 || c.py < 5 || c.py > 65) return;
    const zone = findZone(room.zones, c.px, c.py);
    const isGood = zone?.type !== 'bad';
    setAc({ x: c.px, y: c.py, valid: isGood, zone });
    setWarning(zone?.type === 'bad' ? (zone.reason ?? null) : null);
    setSuccess(isGood);
    if (isGood) setTimeout(() => setSuccess(false), 4000);
  }, [getSvgCoords, room]);

  const changeRoom = (id: 'living' | 'bedroom' | 'office') => {
    setRoomId(id); setAc(null); setWarning(null); setSuccess(false); setHoverZone(null);
  };

  const t = (ru: string, uz: string) => lang === 'ru' ? ru : uz;
  const cursorColor = hoverZone ? (hoverZone.type === 'bad' ? 'rgba(220,50,50,0.9)' : 'rgba(40,160,80,0.9)') : 'rgba(200,132,42,0.85)';

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', animation: 'fadeIn 200ms ease',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '820px', maxHeight: '95vh', overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        animation: 'slideUp 260ms cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* HEADER */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              ❄️ {t('Интерактивный планировщик', 'Interaktiv planer')}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {t('Кликните на план комнаты, чтобы поставить кондиционер — система оценит место.', "Konditsioner joyini belgilash uchun xona rejasiga bosing.")}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* ROOM TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem 0' }}>
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => changeRoom(r.id)} style={{
              flex: 1, padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${roomId === r.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
              background: roomId === r.id ? 'var(--color-primary)' : 'var(--bg-base)',
              color: roomId === r.id ? 'white' : 'var(--text-body)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease',
            }}>
              {r.icon} {lang === 'ru' ? r.label : r.labelUz}
            </button>
          ))}
        </div>

        {/* LEGEND */}
        <div style={{ display: 'flex', gap: '1rem', padding: '0.65rem 1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(40,160,80,0.2)', border: '1.5px solid rgba(40,160,80,0.5)' }} />
            {t('Хорошее место', 'Yaxshi joy')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(220,50,50,0.12)', border: '1.5px solid rgba(220,50,50,0.45)' }} />
            {t('Нежелательная зона', 'Noqulay zona')}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🖱️ {t('Кликните для размещения', 'Joylashtirish uchun bosing')}
          </div>
        </div>

        {/* SVG FLOOR PLAN with real photo background */}
        <div style={{ padding: '0 1.5rem' }}>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--border-color)', cursor: 'crosshair', position: 'relative' }}>
            {/* Real room photo */}
            <img
              key={room.id}
              src={room.photo}
              alt={room.label}
              style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
            />
            {/* SVG overlay - transparent, full coverage */}
            <svg ref={svgRef} viewBox="0 0 100 70"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
              onMouseMove={handleMouseMove} onMouseLeave={() => { setCursor(null); setHoverZone(null); }} onClick={handleClick}>

              {/* Dim overlay on whole photo for better zone visibility */}
              <rect x="0" y="0" width="100" height="70" fill="rgba(0,0,0,0.18)" style={{ pointerEvents: 'none' }} />

              {/* Good zones overlay */}
              {room.zones.filter(z => z.type === 'good').map(z => (
                <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h}
                  fill="rgba(40,200,80,0.15)" stroke="rgba(60,220,90,0.7)"
                  strokeWidth="0.4" strokeDasharray="1.5,0.8" style={{ pointerEvents: 'none' }} />
              ))}

              {/* Bad zones overlay */}
              {room.zones.filter(z => z.type === 'bad').map(z => (
                <g key={z.id} style={{ pointerEvents: 'none' }}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h}
                    fill="rgba(255,50,50,0.13)" stroke="rgba(255,80,80,0.6)"
                    strokeWidth="0.4" strokeDasharray="1.5,0.8" />
                  <text x={z.x + z.w / 2} y={z.y + z.h / 2} textAnchor="middle"
                    dominantBaseline="middle" fontSize="4" fill="rgba(255,100,100,0.7)"
                    style={{ userSelect: 'none' }}>⚠</text>
                </g>
              ))}

              {/* Hover zone highlight */}
              {hoverZone && (
                <rect x={hoverZone.x} y={hoverZone.y} width={hoverZone.w} height={hoverZone.h}
                  fill={hoverZone.type === 'bad' ? 'rgba(220,50,50,0.18)' : 'rgba(40,160,80,0.22)'}
                  stroke={hoverZone.type === 'bad' ? 'rgba(220,50,50,0.7)' : 'rgba(40,160,80,0.7)'}
                  strokeWidth="0.6" style={{ pointerEvents: 'none' }} />
              )}

              {/* Hover tooltip */}
              {hoverZone && cursor && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={cursor.x - 14} y={cursor.y - 10} width="28" height="5.5" rx="1.2"
                    fill={hoverZone.type === 'bad' ? 'rgba(200,40,40,0.92)' : 'rgba(30,140,65,0.92)'} />
                  <text x={cursor.x} y={cursor.y - 7} textAnchor="middle" dominantBaseline="middle"
                    fontSize="2.4" fill="white" fontWeight="bold" style={{ userSelect: 'none' }}>
                    {hoverZone.type === 'bad' ? (hoverZone.badLabel ?? 'Bad zone') : (t('✓ Хорошее место', '✓ Yaxshi joy'))}
                  </text>
                </g>
              )}

              {/* Placed AC */}
              {ac && (
                <g>
                  <circle cx={ac.x} cy={ac.y} r="5.5" fill="none"
                    stroke={ac.valid ? 'rgba(40,160,80,0.4)' : 'rgba(220,50,50,0.4)'}
                    strokeWidth="0.8" strokeDasharray="2,1" />
                  <circle cx={ac.x} cy={ac.y} r="3.5"
                    fill={ac.valid ? 'rgba(40,160,80,0.18)' : 'rgba(220,50,50,0.18)'}
                    stroke={ac.valid ? 'rgba(40,160,80,0.85)' : 'rgba(220,50,50,0.85)'}
                    strokeWidth="0.45" />
                  <text x={ac.x} y={ac.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="4.5" style={{ userSelect: 'none', pointerEvents: 'none' }}>❄️</text>
                  <rect x={ac.x - 8.5} y={ac.y + 4.8} width="17" height="4" rx="1.2"
                    fill={ac.valid ? 'rgba(30,140,65,0.92)' : 'rgba(200,40,40,0.92)'} />
                  <text x={ac.x} y={ac.y + 7.1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="2.2" fill="white" fontWeight="bold" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {ac.valid ? t('✓ Оптимально', '✓ Optimal') : t('✗ Неудачно', '✗ Noqulay')}
                  </text>
                </g>
              )}

              {/* Ghost cursor */}
              {cursor && !ac && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={cursor.x} cy={cursor.y} r="4"
                    fill="transparent" stroke={cursorColor} strokeWidth="0.6" strokeDasharray="1.5,0.8" />
                  <text x={cursor.x} y={cursor.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="4" opacity="0.45" style={{ userSelect: 'none' }}>❄️</text>
                </g>
              )}

              <text x="92" y="8" fontSize="2.2" fill="#a8885a" style={{ userSelect: 'none', pointerEvents: 'none' }}>N↑</text>
            </svg>
          </div>
        </div>

        {/* STATUS */}
        <div style={{ padding: '0.875rem 1.5rem', minHeight: '4rem' }}>
          {warning && (
            <div style={{ background: 'rgba(220,50,50,0.08)', border: '1.5px solid rgba(220,50,50,0.35)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', animation: 'slideUp 200ms ease' }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#c0392b', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                  {t('Нежелательное место установки', "Noqulay o'rnatish joyi")}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{warning}</p>
                <button onClick={() => { setAc(null); setWarning(null); }} style={{ marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ↩ {t('Попробовать другое место', "Boshqa joyni sinab ko'ring")}
                </button>
              </div>
            </div>
          )}
          {success && !warning && (
            <div style={{ background: 'rgba(40,160,80,0.09)', border: '1.5px solid rgba(40,160,80,0.38)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', animation: 'slideUp 200ms ease' }}>
              <span style={{ fontSize: '1.4rem' }}>✅</span>
              <div>
                <strong style={{ color: '#1a7a40', fontSize: '0.85rem', display: 'block', marginBottom: 3 }}>
                  {t('Отличное место!', 'Ajoyib joy!')}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  {t('Оптимальная точка: равномерное распределение воздуха, нет прямого обдува на людей.', "Optimal nuqta: havo teng taqsimlanadi, odamlarga to'g'ridan-to'g'ri esish yo'q.")}
                </p>
              </div>
            </div>
          )}
          {!ac && !warning && !success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span style={{ fontSize: '1.2rem' }}>👆</span>
              {t('Кликните в любое место комнаты — система покажет, подходит ли оно для кондиционера.', "Xonaning istalgan joyiga bosing — tizim konditsioner uchun mosligini ko'rsatadi.")}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('Нужна точная консультация специалиста?', 'Mutaxassis maslahati kerakmi?')}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>+998 90 123-45-67</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => { setAc(null); setWarning(null); setSuccess(false); }} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              🔄 {t('Сброс', 'Tozalash')}
            </button>
            <button onClick={onClose} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              {t('Записаться на замер →', "O'lchov uchun yozilish →")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
