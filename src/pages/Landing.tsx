import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AcPlannerModal } from '../components/AcPlannerModal';
import { LoginModal } from '../components/LoginModal';

export const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [activeRoom, setActiveRoom] = useState<'living' | 'bedroom' | 'office'>('living');
  const [showPlanner, setShowPlanner] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const planningRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const contactsRef = useRef<HTMLElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const rooms = [
    {
      id: 'living' as const,
      label: 'Гостиная',
      labelUz: 'Mehmonxona',
      img: '/room_living.jpg',
      spots: [
        { x: '28%', y: '22%', label: 'Идеальное место A' },
        { x: '72%', y: '30%', label: 'Идеальное место B' },
      ],
    },
    {
      id: 'bedroom' as const,
      label: 'Спальня',
      labelUz: 'Yotoqxona',
      img: '/room_bedroom.jpg',
      spots: [
        { x: '35%', y: '18%', label: 'Оптимальное место' },
      ],
    },
    {
      id: 'office' as const,
      label: 'Офис',
      labelUz: 'Ofis',
      img: '/room_office.jpg',
      spots: [
        { x: '42%', y: '15%', label: 'Кассетный блок 1' },
        { x: '70%', y: '22%', label: 'Кассетный блок 2' },
      ],
    },
  ];

  const activeRoomData = rooms.find(r => r.id === activeRoom)!;

  const services = [
    {
      icon: '❄️',
      title: lang === 'ru' ? 'Установка кондиционеров' : 'Konditsioner o\'rnatish',
      desc: lang === 'ru'
        ? 'Профессиональная установка сплит-систем, мультизональных и кассетных кондиционеров любой марки.'
        : 'Istalgan brenddagi split-sistemalar, multizonal va kasseta konditsionerlarini professional o\'rnatish.',
    },
    {
      icon: '🔧',
      title: lang === 'ru' ? 'Техническое обслуживание' : 'Texnik xizmat ko\'rsatish',
      desc: lang === 'ru'
        ? 'Регулярный осмотр, чистка фильтров, проверка фреона и профилактика поломок.'
        : 'Muntazam tekshirish, filtrlarni tozalash, freonni tekshirish va nosozliklarning oldini olish.',
    },
    {
      icon: '⚡',
      title: lang === 'ru' ? 'Ремонт и диагностика' : 'Ta\'mirlash va diagnostika',
      desc: lang === 'ru'
        ? 'Быстрая диагностика и ремонт любых неисправностей. Гарантия на все виды работ.'
        : 'Har qanday nosozliklarni tezda aniqlash va ta\'mirlash. Barcha turdagi ishlarga kafolat.',
    },
    {
      icon: '📐',
      title: lang === 'ru' ? 'Планирование размещения' : 'Joylashtirish rejalashtirish',
      desc: lang === 'ru'
        ? 'Рассчитаем оптимальное место для кондиционера с учётом планировки и площади помещения.'
        : 'Xona rejasi va maydonini hisobga olgan holda konditsioner uchun optimal joyni hisoblaymiz.',
    },
    {
      icon: '🏗️',
      title: lang === 'ru' ? 'Проектирование систем' : 'Tizimlarni loyihalash',
      desc: lang === 'ru'
        ? 'Проектирование мультизональных систем вентиляции и кондиционирования для офисов и объектов.'
        : 'Ofislar va ob\'yektlar uchun multizonal ventilyatsiya va konditsionerlash tizimlarini loyihalash.',
    },
    {
      icon: '🤝',
      title: lang === 'ru' ? 'Договорное обслуживание' : 'Shartnomaviy xizmat',
      desc: lang === 'ru'
        ? 'Комплексное обслуживание по договору: два планового визита в год, приоритетный выезд.'
        : 'Shartnoma bo\'yicha kompleks xizmat: yiliga ikki rejalashtirilgan tashrif, ustuvor chiqish.',
    },
  ];

  const contacts = [
    { icon: '📞', label: lang === 'ru' ? 'Телефон' : 'Telefon', value: '+998 90 123-45-67' },
    { icon: '📱', label: lang === 'ru' ? 'WhatsApp' : 'WhatsApp', value: '+998 90 123-45-67' },
    { icon: '📧', label: lang === 'ru' ? 'Эл. почта' : 'Elektron pochta', value: 'info@abdulloh.cloudplus.uz' },
    { icon: '📍', label: lang === 'ru' ? 'Адрес' : 'Manzil', value: lang === 'ru' ? 'г. Ташкент, ул. Амира Темура 22' : 'Toshkent, Amir Temur ko\'ch. 22' },
    { icon: '🕐', label: lang === 'ru' ? 'Режим работы' : 'Ish vaqti', value: lang === 'ru' ? 'Пн–Сб: 09:00–19:00' : 'Du–Sha: 09:00–19:00' },
    { icon: '⭐', label: lang === 'ru' ? 'Рейтинг' : 'Reyting', value: '4.9 / 5.0 (Google)' },
  ];

  return (
    <div>
      {showPlanner && <AcPlannerModal onClose={() => setShowPlanner(false)} lang={lang} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {/* ==================== HEADER ==================== */}

      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">❄️</div>
            <span>Air<span style={{ color: 'var(--color-primary)' }}>Condition</span></span>
          </div>

          <nav className="landing-nav">
            <a href="#" onClick={e => { e.preventDefault(); servicesRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
              {lang === 'ru' ? 'Услуги' : 'Xizmatlar'}
            </a>
            <a href="#" onClick={e => { e.preventDefault(); planningRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
              {lang === 'ru' ? '3D Планировщик' : '3D Planer'}
            </a>
            <a href="#" onClick={e => { e.preventDefault(); contactsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>
              {lang === 'ru' ? 'Контакты' : 'Kontaktlar'}
            </a>
          </nav>

          <div className="landing-header-actions">
            {/* Language toggle */}
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem 0.75rem' }} onClick={() => setLang(lang === 'ru' ? 'uz' : 'ru')}>
              {lang === 'ru' ? 'UZ' : 'RU'}
            </button>

            {/* Day/Night toggle */}
            <button className="theme-btn" onClick={toggleTheme} title={theme === 'light' ? 'Ночной режим' : 'Дневной режим'} aria-label="toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Login button — opens modal */}
            <button
              onClick={() => setShowLogin(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
            >
              {lang === 'ru' ? 'Войти' : 'Kirish'}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section className="landing-hero">
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              ❄️ {lang === 'ru' ? 'Профессиональный климат-контроль' : 'Professional iqlim nazorati'}
            </div>
            <h1 className="hero-title">
              {lang === 'ru' ? (
                <>Комфортный климат<br /><span>в каждом помещении</span></>
              ) : (
                <>Har bir xonada<br /><span>qulay iqlim</span></>
              )}
            </h1>
            <p className="hero-subtitle">
              {lang === 'ru'
                ? 'Профессиональная установка, обслуживание и ремонт кондиционеров в Ташкенте. Гарантия качества, оперативный выезд, честные цены.'
                : 'Toshkentda konditsionerlarni professional o\'rnatish, xizmat ko\'rsatish va ta\'mirlash. Sifat kafolati, tezkor chiqish, halol narxlar.'}
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => contactsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                📞 {lang === 'ru' ? 'Вызвать мастера' : 'Usta chaqirish'}
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => planningRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                📐 {lang === 'ru' ? '3D планировщик' : '3D planer'}
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">500+</div>
                <div className="hero-stat-label">{lang === 'ru' ? 'Установок' : 'O\'rnatishlar'}</div>
              </div>
              <div>
                <div className="hero-stat-num">8+</div>
                <div className="hero-stat-label">{lang === 'ru' ? 'Лет опыта' : 'Yillik tajriba'}</div>
              </div>
              <div>
                <div className="hero-stat-num">4.9★</div>
                <div className="hero-stat-label">{lang === 'ru' ? 'Рейтинг' : 'Reyting'}</div>
              </div>
            </div>
          </div>

          {/* Hero visual — 3D room preview card */}
          <div className="hero-visual">
            <div className="hero-room-card">
              <img src="/room_living.jpg" alt="3D планирование помещения" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Play button overlay - centered, scrolls to planner */}
              <button
                onClick={() => planningRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.28)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0.875rem',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.42)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.28)')}
              >
                <div className="play-circle">
                  <div className="play-triangle" />
                </div>
                <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.03em', margin: 0 }}>
                  {lang === 'ru' ? 'Смотреть 3D' : '3D ko\'rish'}
                </p>
              </button>
              <div className="room-badge">
                <div className="room-badge-dot" />
                {lang === 'ru' ? 'Интерактивный планировщик' : 'Interaktiv planer'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SERVICES ==================== */}
      <section className="landing-section" ref={servicesRef}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">🔧 {lang === 'ru' ? 'Наши услуги' : 'Bizning xizmatlar'}</div>
            <h2 className="section-title">
              {lang === 'ru' ? 'Всё для вашего комфорта' : 'Qulayligingiz uchun hamma narsa'}
            </h2>
            <p className="section-sub">
              {lang === 'ru'
                ? 'Полный спектр услуг по кондиционированию воздуха от сертифицированных специалистов'
                : 'Sertifikatlangan mutaxassislardan konditsionerlash bo\'yicha to\'liq xizmatlar to\'plami'}
            </p>
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <div className="service-card" key={i}>
                <div className="service-icon-wrap">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 3D ROOM PLANNER ==================== */}
      <section className="landing-section landing-section-alt" ref={planningRef}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">📐 {lang === 'ru' ? '3D Планировщик' : '3D Planer'}</div>
            <h2 className="section-title">
              {lang === 'ru' ? 'Где лучше установить кондиционер?' : 'Konditsionerni qayerga o\'rnatish yaxshiroq?'}
            </h2>
            <p className="section-sub">
              {lang === 'ru'
                ? 'Выберите тип помещения и посмотрите оптимальные точки установки с интерактивными маркерами'
                : 'Xona turini tanlang va interaktiv belgilar bilan optimal o\'rnatish nuqtalarini ko\'ring'}
            </p>
          </div>

          <div className="room-planning-grid">
            {/* Room selector + visual */}
            <div>
              {/* Room type tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {rooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoom(r.id)}
                    className={`btn ${activeRoom === r.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, justifyContent: 'center', padding: '0.5rem 0.5rem' }}
                  >
                    {lang === 'ru' ? r.label : r.labelUz}
                  </button>
                ))}
              </div>

              {/* Interactive room visual */}
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1.5px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                aspectRatio: '16/9',
              }}>
                <img
                  src={activeRoomData.img}
                  alt={activeRoomData.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* AC placement dots */}
                {activeRoomData.spots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="room-ac-dot"
                    style={{ left: spot.x, top: spot.y }}
                    data-label={spot.label}
                  />
                ))}
                {/* Bottom overlay */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
                  padding: '2rem 1.25rem 1rem',
                  color: 'white',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, background: 'var(--color-primary)', borderRadius: '50%', border: '2px solid white', flexShrink: 0 }} />
                    {lang === 'ru' ? 'Нажмите на маркер для подробной информации' : 'Batafsil ma\'lumot uchun belgiga bosing'}
                  </div>
                </div>
              </div>
            </div>

            {/* Info panel */}
            <div className="planning-info">
              <h3>
                {lang === 'ru'
                  ? 'Правильное размещение — залог эффективности'
                  : 'To\'g\'ri joylashtirish — samaradorlikning kaliti'}
              </h3>
              <p>
                {lang === 'ru'
                  ? 'Мы анализируем планировку, ориентацию окон, источники тепла и площадь помещения для определения оптимального расположения кондиционера.'
                  : 'Konditsioner uchun optimal joylashuvni aniqlash uchun biz rejani, derazalar yo\'nalishini, issiqlik manbalarini va xona maydonini tahlil qilamiz.'}
              </p>
              <div className="planning-features">
                {[
                  lang === 'ru' ? 'Анализ планировки помещения' : 'Xona rejasini tahlil qilish',
                  lang === 'ru' ? 'Расчёт мощности по площади' : 'Maydonga qarab quvvatni hisoblash',
                  lang === 'ru' ? 'Оптимизация воздушных потоков' : 'Havo oqimlarini optimallashtirish',
                  lang === 'ru' ? 'Минимум шума от наружного блока' : 'Tashqi blokdan minimal shovqin',
                ].map((feat, i) => (
                  <div className="planning-feature" key={i}>
                    <div className="feature-check">✓</div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                <button
                  onClick={() => contactsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-primary btn-lg"
                  style={{ display: 'inline-flex' }}
                >
                  {lang === 'ru' ? 'Получить консультацию' : 'Maslahat olish'}
                </button>
                <button
                  onClick={() => setShowPlanner(true)}
                  className="btn btn-outline btn-lg"
                  style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
                >
                  🗺️ {lang === 'ru' ? 'Открыть интерактивный план' : 'Interaktiv rejani ochish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHY US ==================== */}
      <section className="landing-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">🏆 {lang === 'ru' ? 'Почему мы?' : 'Nima uchun biz?'}</div>
            <h2 className="section-title">
              {lang === 'ru' ? 'Нам доверяют клиенты' : 'Mijozlar bizga ishonishadi'}
            </h2>
          </div>
          <div className="why-grid">
            {[
              { num: '500+', label: lang === 'ru' ? 'Установок' : 'O\'rnatishlar' },
              { num: '8+', label: lang === 'ru' ? 'Лет работы' : 'Yillik ish' },
              { num: '24ч', label: lang === 'ru' ? 'Скорость выезда' : 'Chiqish tezligi' },
              { num: '100%', label: lang === 'ru' ? 'Гарантия' : 'Kafolat' },
              { num: '4.9★', label: lang === 'ru' ? 'Средний рейтинг' : 'O\'rtacha reyting' },
            ].map((item, i) => (
              <div className="why-card" key={i}>
                <div className="why-num">{item.num}</div>
                <div className="why-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CONTACTS ==================== */}
      <section className="landing-section landing-section-alt" ref={contactsRef}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">📍 {lang === 'ru' ? 'Контакты' : 'Kontaktlar'}</div>
            <h2 className="section-title">
              {lang === 'ru' ? 'Свяжитесь с нами' : 'Biz bilan bog\'laning'}
            </h2>
            <p className="section-sub">
              {lang === 'ru'
                ? 'Готовы ответить на все вопросы и выехать на объект в удобное для вас время'
                : 'Barcha savollaringizga javob berish va siz uchun qulay vaqtda ob\'yektga borishga tayyormiz'}
            </p>
          </div>
          <div className="contacts-grid">
            {contacts.map((c, i) => (
              <div className="contact-card" key={i}>
                <div className="contact-icon">{c.icon}</div>
                <div className="contact-label">{c.label}</div>
                <div className="contact-value" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo" style={{ fontSize: '1rem' }}>
            <div className="landing-logo-icon" style={{ width: 32, height: 32, fontSize: '1rem' }}>❄️</div>
            AirCondition
          </div>
          <div className="footer-copy">
            © 2026 AirCondition CRM. {lang === 'ru' ? 'Все права защищены.' : 'Barcha huquqlar himoyalangan.'}
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem' }}
          >
            {lang === 'ru' ? 'Войти в систему' : 'Tizimga kirish'}
          </button>
        </div>
      </footer>
    </div>
  );
};
