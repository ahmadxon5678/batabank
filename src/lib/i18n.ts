import { cookies } from "next/headers";
import type { InstitutionType, SubmissionStatus } from "@/lib/types";

export type Locale = "uz" | "ru";

export async function getLocale(): Promise<Locale> {
  const locale = (await cookies()).get("batabank-locale")?.value;
  return locale === "ru" ? "ru" : "uz";
}

export const dictionaries = {
  uz: {
    nav: {
      leaderboard: "Reyting",
      dashboard: "Kabinet",
      admin: "Admin",
      login: "Kirish",
    },
    footer: "Ishlatilgan batareyalarni xavfsiz yig'ish uchun jamoaviy platforma.",
    common: {
      join: "Tashkilotni qo'shish",
      login: "Kirish",
      dashboard: "Kabinet",
      saveProfile: "Profilni saqlash",
      submitReview: "Tekshiruvga yuborish",
      reject: "Rad etish",
      approve: "Tasdiqlash",
      noApproved: "Hali tasdiqlangan natijalar yo'q.",
      setupMissing:
        "Supabase ulanishi uchun `.env.local` sozlang. Kerakli nomlar `.env.example` faylida bor.",
    },
    home: {
      eyebrow: "Ekologik mas'uliyat uchun jamoaviy platforma",
      title: "Ishlatilgan batareyalarni xavfsiz yig'ish platformasi",
      body:
        "BataBank maktablar, universitetlar va davlat tashkilotlariga batareyalarni alohida yig'ish, o'z tajribasini boshqalar bilan bo'lishish va tasdiqlangan natijalarni ochiq reytingda ko'rsatishga yordam beradi.",
      leaderboardCta: "Reytingni ko'rish",
      visualText: "",
      metrics: {
        institutions: "Faol tashkilotlar",
        containers: "To'lgan konteynerlar",
        batteries: "Taxminiy batareyalar",
      },
      missionEyebrow: "Nima uchun kerak",
      missionTitle: "Oddiy chiqindiga tashlangan batareya ko'rinmas zarar keltiradi",
      missionText:
        "Batareyalar tuproq va yer osti suvlariga zarar yetkazishi mumkin. BataBank xavfsiz yig'ish odatini tashkilotlar orqali oddiy va nazoratli qiladi.",
      features: [
        {
          title: "Alohida yig'ish",
          text: "Batareyalar kundalik chiqindidan ajratilib, xavfsiz konteynerlarda saqlanadi.",
        },
        {
          title: "Isbot va nazorat",
          text: "Tashkilotlar fotosurat va metrikalarni yuklaydi, admin esa natijani tekshiradi.",
        },
        {
          title: "Ochiq natija",
          text: "Tasdiqlangan yig'imlar reytingga tushadi va jamoaviy ta'sir ko'rinadi.",
        },
      ],
      processEyebrow: "Jarayon",
      processTitle: "Jarayon oddiy: qo'shiling, yig'ing, yuklang, tasdiqlating",
      processText: "",
      steps: [
        "Tashkilot BataBank profilini yaratadi.",
        "Xavfsiz konteynerlar to'lganda metrikalar kiritiladi.",
        "Fotosuratlar yuklanadi va admin tekshiruviga yuboriladi.",
        "Tasdiqlangan natijalar umumiy reytingda ko'rinadi.",
      ],
      partnersEyebrow: "Loyiha manbasi",
      partnersTitle: "BataBank g'oyasi ekologik jamoatchilik va madaniy hamkorlikdan tug'ilgan",
      partnersText:
        "Loyiha O'rikguli tashabbusi bilan shakllangan va Goethe-Institut Uzbekistan ko'magida rivojlantirilmoqda.",
      partners: {
        orikguliName: "Mo'tabar Xushvaqtova (@Urik_guli)",
        orikguliRole: "Ekobloger va jamoatchilik faoli",
        orikguliText: "",
        goetheName: "Goethe-Institut Uzbekistan",
        goetheRole: "Germaniyaning O'zbekistondagi rasmiy madaniyat instituti",
        goetheText: "",
      },
      ctaEyebrow: "Boshlash",
      ctaTitle: "Maktab yoki tashkilotingizni BataBank challengega qo'shing",
      ctaText: "Yig'im madaniyatini ko'rinadigan natijaga aylantiring.",
      addInstitution: "Tashkilotni qo'shish",
    },
    auth: {
      loginTitle: "Tizimga kirish",
      loginText: "Tashkilot profilingiz orqali yig'im natijalarini yuboring va holatini kuzating.",
      loginSideTitle: "Xavfsiz yig'im uchun aniq va ishonchli boshqaruv.",
      loginSideText:
        "Fotosurat, konteyner va batareya sonlari bitta joyda. Tasdiqdan keyin natija ochiq reytingda ko'rinadi.",
      noAccount: "Hali ro'yxatdan o'tmadingizmi?",
      addInstitution: "Tashkilotni qo'shish",
      registerTitle: "Tashkilotni ro'yxatdan o'tkazish",
      registerText:
        "BataBank challengega qo'shilib, ishlatilgan batareyalar yig'imini hujjatlashtiring.",
      fields: {
        institutionName: "Tashkilot nomi",
        institutionType: "Tashkilot turi",
        regionCity: "Hudud/shahar",
        contactPerson: "Mas'ul shaxs",
        contact: "Telefon yoki qo'shimcha email",
        email: "Login email",
        password: "Parol",
      },
      registerButton: "Ro'yxatdan o'tish",
    },
    leaderboard: {
      eyebrow: "Ochiq natijalar",
      title: "BataBank reytingi",
      text:
        "Faqat admin tomonidan tasdiqlangan yig'imlar hisoblanadi. Kamida bitta tasdiqlangan topshirishi bor tashkilotlar ko'rinadi.",
      institutions: "Tashkilotlar",
      containers: "Konteynerlar",
      batteries: "Taxminiy batareyalar",
      rank: "Rank",
      institution: "Tashkilot",
      region: "Hudud",
      batteryWeight: "Batareya / vazn",
    },
    dashboard: {
      panel: "Tashkilot paneli",
      subtitle: "Profil, suratlar va yig'im natijalarini boshqaring.",
      logout: "Chiqish",
      approvedContainers: "Tasdiqlangan konteynerlar",
      approvedBatteries: "Tasdiqlangan batareyalar",
      pending: "Ko'rib chiqilmoqda",
      profile: "Profil",
      loginEmail: "Login email",
      newSubmission: "Yangi yig'im",
      newSubmissionText: "To'lgan konteynerlar va isbot fotosuratlarini yuboring.",
      containersField: "To'lgan xavfsiz konteynerlar",
      batteriesField: "Taxminiy batareya soni",
      weightField: "Taxminiy vazn, kg",
      dateField: "Yig'im sanasi",
      photosField: "Yig'im fotosuratlari",
      mySubmissions: "Mening topshirishlarim",
      empty: "Hali topshirish yuborilmagan.",
      adminNote: "Admin izohi",
      photoAlt: "Yig'im fotosurati",
    },
    admin: {
      eyebrow: "Moderatsiya",
      title: "Admin tekshiruvi",
      text:
        "Pending topshirishlarni ko'rib chiqing, fotosuratlarni tekshiring va yakuniy qarorni kiriting.",
      empty: "Hozir pending topshirish yo'q.",
      unknown: "Noma'lum tashkilot",
      date: "Sana",
      responsible: "Mas'ul",
      contact: "Aloqa",
      notePlaceholder: "Ixtiyoriy admin izohi",
      noPhoto: "Foto yuklanmagan",
      photoAlt: "Pending yig'im fotosurati",
      panel: "Admin panel",
    },
  },
  ru: {
    nav: {
      leaderboard: "Рейтинг",
      dashboard: "Кабинет",
      admin: "Админ",
      login: "Войти",
    },
    footer: "Платформа для безопасного сбора использованных батареек.",
    common: {
      join: "Присоединиться",
      login: "Войти",
      dashboard: "Кабинет",
      saveProfile: "Сохранить профиль",
      submitReview: "Отправить на проверку",
      reject: "Отклонить",
      approve: "Одобрить",
      noApproved: "Пока нет одобренных результатов.",
      setupMissing:
        "Настройте подключение Supabase в `.env.local`. Нужные переменные указаны в `.env.example`.",
    },
    home: {
      eyebrow: "Общественная платформа экологической ответственности",
      title: "Платформа безопасного сбора использованных батареек",
      body:
        "BataBank помогает школам, вузам и государственным учреждениям отдельно собирать батарейки, загружать фото-подтверждения и показывать одобренные результаты в открытом рейтинге.",
      leaderboardCta: "Посмотреть рейтинг",
      visualText:
        "Люди приносят батарейки в безопасный сбор. Платформа делает процесс видимым, измеримым и надежным.",
      metrics: {
        institutions: "Активные учреждения",
        containers: "Заполненные контейнеры",
        batteries: "Оценка батареек",
      },
      missionEyebrow: "Зачем это нужно",
      missionTitle: "Батарейка в обычном мусоре наносит невидимый вред",
      missionText:
        "Батарейки могут загрязнять почву и грунтовые воды. BataBank помогает учреждениям внедрять безопасный сбор простым и контролируемым способом.",
      features: [
        {
          title: "Отдельный сбор",
          text: "Батарейки отделяются от бытовых отходов и хранятся в безопасных контейнерах.",
        },
        {
          title: "Подтверждение и контроль",
          text: "Учреждения загружают фото и метрики, а администратор проверяет результат.",
        },
        {
          title: "Открытый результат",
          text: "Одобренные сборы попадают в рейтинг, и общий вклад становится видимым.",
        },
      ],
      processEyebrow: "Процесс",
      processTitle: "MVP простой: вступить, собрать, загрузить, подтвердить",
      processText:
        "Сейчас платформа закрывает ключевой поток: регистрация, фиксация сбора, проверка администратором и открытый рейтинг.",
      steps: [
        "Учреждение создает профиль BataBank.",
        "Когда безопасные контейнеры заполнены, вносятся метрики.",
        "Фотографии отправляются на проверку администратору.",
        "Одобренные результаты появляются в общем рейтинге.",
      ],
      partnersEyebrow: "Источник проекта",
      partnersTitle: "BataBank вырос из экологической инициативы и культурного партнерства",
      partnersText:
        "Идея проекта сформировалась по инициативе O'rikguli и развивается при поддержке Goethe-Institut Uzbekistan.",
      partners: {
        orikguliName: "Мўътабар Хушвақтова (@Urik_guli)",
        orikguliRole: "Экоблогер и общественная активистка",
        orikguliText:
          "O'rikguli последовательно говорит об экологии города, защите деревьев и личной ответственности жителей простым, смелым и понятным языком. BataBank превращает эту общественную энергию в измеримое действие для школ и организаций.",
        goetheName: "Goethe-Institut Uzbekistan",
        goetheRole: "Официальный культурный институт Германии в Узбекистане",
        goetheText:
          "Goethe-Institut Uzbekistan через немецкий язык, культурный обмен и образовательное сотрудничество связывает местные инициативы с международным опытом. В BataBank институт поддерживает проект, который близок к образованию и развивает экологическую ответственность.",
      },
      ctaEyebrow: "Начать",
      ctaTitle: "Подключите вашу школу или организацию к BataBank",
      ctaText:
        "Превратите культуру сбора в видимый результат. Даже маленькая привычка становится практическим шагом для защиты почвы и воды.",
      addInstitution: "Добавить учреждение",
    },
    auth: {
      loginTitle: "Вход в систему",
      loginText: "Отправляйте результаты сбора и отслеживайте статус через профиль учреждения.",
      loginSideTitle: "Понятное и надежное управление безопасным сбором.",
      loginSideText:
        "Фото, контейнеры и количество батареек в одном месте. После подтверждения результат появляется в открытом рейтинге.",
      noAccount: "Еще нет аккаунта?",
      addInstitution: "Добавить учреждение",
      registerTitle: "Регистрация учреждения",
      registerText:
        "Присоединяйтесь к BataBank и фиксируйте сбор использованных батареек.",
      fields: {
        institutionName: "Название учреждения",
        institutionType: "Тип учреждения",
        regionCity: "Регион/город",
        contactPerson: "Ответственное лицо",
        contact: "Телефон или дополнительный email",
        email: "Email для входа",
        password: "Пароль",
      },
      registerButton: "Зарегистрироваться",
    },
    leaderboard: {
      eyebrow: "Открытые результаты",
      title: "Рейтинг BataBank",
      text:
        "Учитываются только сборы, одобренные администратором. Показываются учреждения минимум с одной подтвержденной заявкой.",
      institutions: "Учреждения",
      containers: "Контейнеры",
      batteries: "Оценка батареек",
      rank: "Место",
      institution: "Учреждение",
      region: "Регион",
      batteryWeight: "Батарейки / вес",
    },
    dashboard: {
      panel: "Панель учреждения",
      subtitle: "Управляйте профилем, фотографиями и результатами сбора.",
      logout: "Выйти",
      approvedContainers: "Одобренные контейнеры",
      approvedBatteries: "Одобренные батарейки",
      pending: "На проверке",
      profile: "Профиль",
      loginEmail: "Email для входа",
      newSubmission: "Новый сбор",
      newSubmissionText: "Отправьте заполненные контейнеры и фотографии-подтверждения.",
      containersField: "Заполненные безопасные контейнеры",
      batteriesField: "Оценочное количество батареек",
      weightField: "Оценочный вес, кг",
      dateField: "Дата сбора",
      photosField: "Фотографии сбора",
      mySubmissions: "Мои заявки",
      empty: "Заявок пока нет.",
      adminNote: "Комментарий администратора",
      photoAlt: "Фото сбора",
    },
    admin: {
      eyebrow: "Модерация",
      title: "Проверка заявок",
      text:
        "Просмотрите заявки на проверке, проверьте фотографии и внесите итоговое решение.",
      empty: "Сейчас нет заявок на проверке.",
      unknown: "Неизвестное учреждение",
      date: "Дата",
      responsible: "Ответственный",
      contact: "Контакт",
      notePlaceholder: "Комментарий администратора",
      noPhoto: "Фото не загружено",
      photoAlt: "Фото заявки на проверке",
      panel: "Панель администратора",
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export const institutionTypeLabelsByLocale: Record<Locale, Record<InstitutionType, string>> = {
  uz: {
    school: "Maktab",
    university: "Universitet",
    government: "Davlat tashkiloti",
    other: "Boshqa",
  },
  ru: {
    school: "Школа",
    university: "Университет",
    government: "Госучреждение",
    other: "Другое",
  },
};

export const statusLabelsByLocale: Record<Locale, Record<SubmissionStatus, string>> = {
  uz: {
    pending: "Ko'rib chiqilmoqda",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
  },
  ru: {
    pending: "На проверке",
    approved: "Одобрено",
    rejected: "Отклонено",
  },
};
