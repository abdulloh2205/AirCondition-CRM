import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'uz';

interface Translations {
  [key: string]: {
    ru: string;
    uz: string;
  };
}

// Basic translations dictionary
export const dict: Translations = {
  loginTitle: { ru: 'Вход в CRM', uz: 'CRM ga kirish' },
  loginPlaceholder: { ru: 'Введите логин (boss или manager1)', uz: 'Loginni kiriting (boss yoki manager1)' },
  passwordPlaceholder: { ru: 'Пароль (123)', uz: 'Parol (123)' },
  loginBtn: { ru: 'Войти', uz: 'Kirish' },
  loginError: { ru: 'Неверный логин', uz: 'Noto\'g\'ri login' },
  clients: { ru: 'Клиенты', uz: 'Mijozlar' },
  requests: { ru: 'Заявки', uz: 'Arizalar' },
  myTasks: { ru: 'Мои задачи', uz: 'Mening vazifalarim' },
  dashboard: { ru: 'Сводка', uz: 'Hisobot' },
  logout: { ru: 'Выйти', uz: 'Chiqish' },
  add: { ru: 'Добавить', uz: 'Qo\'shish' },
  save: { ru: 'Сохранить', uz: 'Saqlash' },
  cancel: { ru: 'Отмена', uz: 'Bekor qilish' },
  name: { ru: 'Имя', uz: 'Ism' },
  phone: { ru: 'Телефон', uz: 'Telefon' },
  address: { ru: 'Адрес', uz: 'Manzil' },
  comment: { ru: 'Комментарий', uz: 'Izoh' },
  search: { ru: 'Поиск...', uz: 'Qidiruv...' },
  clientFoundTitle: { ru: 'Клиент найден', uz: 'Mijoz topildi' },
  clientFoundMsg: { ru: 'Клиент с таким телефоном уже существует. Открыть его карточку?', uz: 'Bunday raqamli mijoz mavjud. Uning kartochkasini ochish kerakmi?' },
  yes: { ru: 'Да', uz: 'Ha' },
  no: { ru: 'Нет', uz: 'Yo\'q' },
  statusNew: { ru: 'Новая', uz: 'Yangi' },
  statusInProgress: { ru: 'В работе', uz: 'Jarayonda' },
  statusDone: { ru: 'Выполнена', uz: 'Bajarildi' },
  statusCancelled: { ru: 'Отменена', uz: 'Bekor qilindi' },
  srvInstall: { ru: 'Установка', uz: 'O\'rnatish' },
  srvMaintain: { ru: 'Обслуживание', uz: 'Xizmat ko\'rsatish' },
  srvRepair: { ru: 'Ремонт', uz: 'Ta\'mirlash' },
  requestNumber: { ru: 'Номер', uz: 'Raqam' },
  service: { ru: 'Услуга', uz: 'Xizmat' },
  description: { ru: 'Описание', uz: 'Tavsif' },
  amount: { ru: 'Сумма (сум)', uz: 'Summa (so\'m)' },
  assignee: { ru: 'Ответственный', uz: 'Mas\'ul' },
  status: { ru: 'Статус', uz: 'Holat' },
  date: { ru: 'Дата', uz: 'Sana' },
  cancelReason: { ru: 'Причина отмены', uz: 'Bekor qilish sababi' },
  tasks: { ru: 'Задачи', uz: 'Vazifalar' },
  title: { ru: 'Название', uz: 'Nomi' },
  dueDate: { ru: 'Срок выполнения', uz: 'Bajarish muddati' },
  done: { ru: 'Выполнено', uz: 'Bajarildi' },
  overdue: { ru: 'Просрочено', uz: 'Muddati o\'tgan' },
  totalRequests: { ru: 'Всего заявок', uz: 'Jami arizalar' },
  totalAmount: { ru: 'Сумма выполненных', uz: 'Bajarilganlar summasi' },
  period: { ru: 'Период', uz: 'Davr' },
  allTime: { ru: 'За все время', uz: 'Barcha vaqt uchun' },
  today: { ru: 'Сегодня', uz: 'Bugun' },
  thisWeek: { ru: 'На этой неделе', uz: 'Shu haftada' },
  thisMonth: { ru: 'В этом месяце', uz: 'Shu oyda' },
  requiredField: { ru: 'Обязательное поле', uz: 'To\'ldirilishi shart' },
  positiveAmount: { ru: 'Сумма не может быть отрицательной', uz: 'Summa manfiy bo\'lishi mumkin emas' },
  cancelReasonReq: { ru: 'Причина отмены обязательна', uz: 'Bekor qilish sababi majburiy' },
  notFound: { ru: 'Ничего не найдено', uz: 'Hech narsa topilmadi' },
  alreadyExists: { ru: 'уже используется клиентом:', uz: 'allaqachon mijoz tomonidan ishlatilmoqda:' },
  openClient: { ru: 'Открыть клиента', uz: 'Mijozni ochish' },
  edit: { ru: 'Редактировать', uz: 'Tahrirlash' },
  createRequest: { ru: '+ Создать заявку', uz: '+ Ariza yaratish' },
  history: { ru: 'История статусов', uz: 'Holatlar tarixi' },
  backup: { ru: 'Скачать бэкап', uz: 'Nusxani yuklash' },
  restore: { ru: 'Восстановить', uz: 'Tiklash' },
  demoData: { ru: 'Сброс к демо', uz: 'Demo holatiga qaytarish' },
  taskToday: { ru: 'Сегодня', uz: 'Bugun' },
  taskUpcoming: { ru: 'Предстоящие', uz: 'Kelgusidagi' },
  averageCheck: { ru: 'Средний чек', uz: 'O\'rtacha chek' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && (saved === 'ru' || saved === 'uz')) {
      setLang(saved);
    }
  }, []);

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('app_lang', l);
  };

  const t = (key: string): string => {
    if (dict[key]) {
      return dict[key][lang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
