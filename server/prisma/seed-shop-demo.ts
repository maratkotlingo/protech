import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AuditAction,
  MessageType,
  ObtainingMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Role,
  StockMovementType
} from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const seedTag = "shop-demo-ozon";
const demoAdminEmail = "admin.demo@protech.local";
const demoAdminPassword = "ProTechAdmin123!";
const rub = (value: number) => new Prisma.Decimal(value.toFixed(2));
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const attrKey = (name: string, unit = "") => `${name}\u0000${unit}`;

function at<T>(items: readonly T[], index: number, label: string) {
  const item = items[index];

  if (!item) {
    throw new Error(`${label} is missing item at index ${index}`);
  }

  return item;
}

type SeedAttribute = {
  name: string;
  unit?: string;
  value: string;
};

type SeedProduct = {
  article: string;
  name: string;
  description: string;
  categoryName: string;
  currentPrice: number;
  costPrice: number;
  oldPrice?: number;
  stock: number;
  ozonLink: string;
  images: string[];
  attributes: SeedAttribute[];
};

const categoryNames = [
  "Масла и автохимия",
  "Щетки и свет",
  "Электроника и гаджеты",
  "Инструменты и безопасность",
  "Салон и аксессуары",
  "Расходники и фильтры"
];

const attributeDefs = [
  { name: "Бренд" },
  { name: "Тип" },
  { name: "Объем", unit: "л" },
  { name: "Объем", unit: "мл" },
  { name: "Вязкость SAE" },
  { name: "Класс антифриза" },
  { name: "Напряжение", unit: "В" },
  { name: "Мощность", unit: "Вт" },
  { name: "Производительность", unit: "л/мин" },
  { name: "Длина", unit: "мм" },
  { name: "Длина", unit: "м" },
  { name: "Диагональ экрана", unit: "дюйм" },
  { name: "Разрешение" },
  { name: "Крепление" },
  { name: "Материал" },
  { name: "Цвет" },
  { name: "Количество", unit: "шт" },
  { name: "Макс. нагрузка", unit: "т" },
  { name: "Температура", unit: "K" },
  { name: "Сезонность" },
  { name: "Комплектация" },
  { name: "Совместимость" },
  { name: "Страна" }
] satisfies Array<{ name: string; unit?: string }>;

const products = [
  {
    article: "OZ-MOTUL-8100-5W30-4L",
    name: "MOTUL 8100 X-clean EFE 5W-30, синтетическое масло, 4 л",
    description:
      "Синтетическое моторное масло для современных бензиновых и дизельных двигателей. Подходит для повседневной эксплуатации, хорошо держит вязкость и рассчитано на автомобили с требованиями ACEA C2/C3.",
    categoryName: "Масла и автохимия",
    currentPrice: 4990,
    costPrice: 3980,
    oldPrice: 5790,
    stock: 12,
    ozonLink:
      "https://www.ozon.ru/product/motul-maslo-motornoe-8100-x-clean-efe-5w-30-sinteticheskoe-4-l-576377533/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-c/c1000/6552532044.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-4/8765578804.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-i/7106476806.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "MOTUL" },
      { name: "Тип", value: "Моторное масло" },
      { name: "Объем", unit: "л", value: "4" },
      { name: "Вязкость SAE", value: "5W-30" },
      { name: "Сезонность", value: "Всесезонное" },
      { name: "Страна", value: "Франция" }
    ]
  },
  {
    article: "OZ-SHELL-HELIX-5W40-4L",
    name: "Shell Helix Ultra 5W-40, синтетическое масло, 4 л",
    description:
      "Полностью синтетическое масло для защиты двигателя в городском режиме и на трассе. Подходит для планового ТО, устойчиво к высоким температурам и помогает поддерживать чистоту мотора.",
    categoryName: "Масла и автохимия",
    currentPrice: 4490,
    costPrice: 3560,
    stock: 9,
    ozonLink:
      "https://www.ozon.ru/product/shell-helix-ultra-5w-40-maslo-motornoe-sinteticheskoe-4-l-731652827/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-j/c1000/7227559531.jpg",
      "https://ir.ozone.ru/s3/multimedia-g/c1000/6858415420.jpg",
      "https://ir.ozone.ru/s3/multimedia-4/6586170340.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Shell" },
      { name: "Тип", value: "Моторное масло" },
      { name: "Объем", unit: "л", value: "4" },
      { name: "Вязкость SAE", value: "5W-40" },
      { name: "Сезонность", value: "Всесезонное" },
      { name: "Страна", value: "Германия" }
    ]
  },
  {
    article: "OZ-EURASIA-G12-5KG",
    name: "Евразия Антифриз G12 красный, 5 кг",
    description:
      "Готовая охлаждающая жидкость красного цвета для систем охлаждения легковых автомобилей. Карбоксилатная формула G12 рассчитана на защиту от коррозии и стабильную работу при низких температурах.",
    categoryName: "Масла и автохимия",
    currentPrice: 891,
    costPrice: 620,
    oldPrice: 990,
    stock: 18,
    ozonLink: "https://www.ozon.ru/product/evraziya-antifriz-g12-krasnyy-5-kg-721343821/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-u/6417702954.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-x/c1000/7269594549.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-u/c1000/9087778830.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Евразия" },
      { name: "Тип", value: "Антифриз" },
      { name: "Класс антифриза", value: "G12" },
      { name: "Цвет", value: "Красный" },
      { name: "Объем", unit: "л", value: "5" },
      { name: "Страна", value: "Россия" }
    ]
  },
  {
    article: "OZ-R2R-BRAKE-650",
    name: "R2R Очиститель тормозов, аэрозоль 650 мл",
    description:
      "Аэрозольный очиститель для тормозных дисков, суппортов и деталей сцепления. Быстро испаряется, удаляет технические загрязнения и не оставляет масляной пленки.",
    categoryName: "Масла и автохимия",
    currentPrice: 390,
    costPrice: 240,
    stock: 31,
    ozonLink: "https://www.ozon.ru/product/ochistitel-tormozov-r2r-650-ml-1010-001s-1595024529/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-z/c1000/7046289791.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-z/7691606711.jpg",
      "https://ir.ozone.ru/s3/multimedia-s/c1000/6014351860.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "R2R" },
      { name: "Тип", value: "Очиститель тормозов" },
      { name: "Объем", unit: "мл", value: "650" },
      { name: "Комплектация", value: "1 баллон" },
      { name: "Страна", value: "Россия" }
    ]
  },
  {
    article: "OZ-WIPER-HYBRID-530-500",
    name: "Щетки стеклоочистителя гибридные 530 мм и 500 мм",
    description:
      "Комплект гибридных дворников для крепления крючок. Резинка плотно прилегает к стеклу, а аэродинамический корпус помогает равномерно очищать обзор в дождь и мокрый снег.",
    categoryName: "Щетки и свет",
    currentPrice: 1190,
    costPrice: 760,
    oldPrice: 1490,
    stock: 16,
    ozonLink:
      "https://www.ozon.ru/product/shchetki-stekloochistitelya-dvorniki-gibridnye-530-mm-i-500-mm-1849972411/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-p/8143310509.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-p/c1000/7705354777.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-3/7769378595.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Щетки стеклоочистителя" },
      { name: "Длина", unit: "мм", value: "530/500" },
      { name: "Крепление", value: "Крючок" },
      { name: "Количество", unit: "шт", value: "2" },
      { name: "Сезонность", value: "Всесезонные" }
    ]
  },
  {
    article: "OZ-BOSCH-A331H-330",
    name: "Bosch Aerotwin Rear A331H, задняя щетка 330 мм",
    description:
      "Задняя щетка стеклоочистителя Bosch Aerotwin для автомобилей с посадкой под A331H. Бескаркасная конструкция компактна, тихо работает и хорошо подходит для замены штатного дворника.",
    categoryName: "Щетки и свет",
    currentPrice: 820,
    costPrice: 560,
    stock: 0,
    ozonLink:
      "https://www.ozon.ru/product/shchetka-zadnyaya-bosch-aerotwin-rear-a331h-330mm-3397008713-913688772/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-y/c1000/6605976994.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-d/c1000/7732394617.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-u/c1000/9112983942.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Bosch" },
      { name: "Тип", value: "Задняя щетка" },
      { name: "Длина", unit: "мм", value: "330" },
      { name: "Количество", unit: "шт", value: "1" },
      { name: "Сезонность", value: "Всесезонные" }
    ]
  },
  {
    article: "OZ-STOUN-H7-4300K",
    name: "STOUN LED H7 4300K, автомобильные лампы, 2 шт.",
    description:
      "Комплект светодиодных ламп H7 с теплым белым светом 4300K. Подходит для замены галогенных ламп в ближнем или дальнем свете при совместимой оптике автомобиля.",
    categoryName: "Щетки и свет",
    currentPrice: 1890,
    costPrice: 1240,
    oldPrice: 2490,
    stock: 7,
    ozonLink: "https://www.ozon.ru/product/stoun-lampa-avtomobilnaya-h7-2-sht-art-led-h7-4300k-1819231569/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-d/c1000/6916837261.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-o/c1000/6920002536.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-n/8611440287.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "STOUN" },
      { name: "Тип", value: "LED лампы" },
      { name: "Напряжение", unit: "В", value: "12" },
      { name: "Мощность", unit: "Вт", value: "27" },
      { name: "Температура", unit: "K", value: "4300" },
      { name: "Количество", unit: "шт", value: "2" }
    ]
  },
  {
    article: "OZ-DVR-F70-4K-WIFI",
    name: "Видеорегистратор F70 4K Ultra HD с Wi-Fi",
    description:
      "Компактный видеорегистратор с записью 4K, Wi-Fi для просмотра роликов со смартфона и IPS-экраном. Устанавливается на лобовое стекло и подходит для ежедневной фиксации поездок.",
    categoryName: "Электроника и гаджеты",
    currentPrice: 4290,
    costPrice: 2940,
    oldPrice: 5290,
    stock: 10,
    ozonLink: "https://www.ozon.ru/product/videoregistrator-avtomobilnye-4k-ultra-hd-s-wifi-f70-2945014887/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-d/8956696081.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-k/c1000/7968846152.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-u/8637429378.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Видеорегистратор" },
      { name: "Разрешение", value: "4K Ultra HD" },
      { name: "Диагональ экрана", unit: "дюйм", value: "1.47" },
      { name: "Крепление", value: "На лобовое стекло" },
      { name: "Комплектация", value: "Регистратор, кабель, крепление" }
    ]
  },
  {
    article: "OZ-DVR-SUPERHD-1296",
    name: "Видеорегистратор автомобильный Super HD 1296",
    description:
      "Доступный видеорегистратор с записью до Super HD 1296P. Подойдет как базовое решение для города: пишет дорогу, имеет экран и подключается к питанию автомобиля.",
    categoryName: "Электроника и гаджеты",
    currentPrice: 1790,
    costPrice: 1180,
    stock: 14,
    ozonLink: "https://www.ozon.ru/product/videoregistrator-avtomobilnyy-super-hd-1296-2011345348/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-a/7450913026.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-h/8843519969.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-x/7035734841.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Видеорегистратор" },
      { name: "Разрешение", value: "1296P Super HD" },
      { name: "Крепление", value: "На лобовое стекло" },
      { name: "Напряжение", unit: "В", value: "12" }
    ]
  },
  {
    article: "OZ-BASEUS-CC-30W",
    name: "Baseus автомобильная быстрая зарядка 30W USB/Type-C",
    description:
      "Компактное зарядное устройство в прикуриватель с поддержкой быстрой зарядки. Подходит для смартфонов, навигаторов и аксессуаров, занимает мало места в консоли.",
    categoryName: "Электроника и гаджеты",
    currentPrice: 990,
    costPrice: 610,
    stock: 23,
    ozonLink:
      "https://www.ozon.ru/product/avtomobilnaya-zaryadka-baseus-tiny-star-mini-30w-usb-seryy-2983519325/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-8/7472284244.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-3/8900643675.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-w/c1000/8916054440.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Baseus" },
      { name: "Тип", value: "Автомобильная зарядка" },
      { name: "Мощность", unit: "Вт", value: "30" },
      { name: "Напряжение", unit: "В", value: "12/24" },
      { name: "Цвет", value: "Серый" }
    ]
  },
  {
    article: "OZ-RITMIX-CVC-007",
    name: "RITMIX CVC-007 беспроводной автомобильный пылесос",
    description:
      "Аккумуляторный пылесос для салона автомобиля и дома. Удобен для быстрой уборки крошек, песка и пыли, в комплекте есть насадки для труднодоступных мест.",
    categoryName: "Электроника и гаджеты",
    currentPrice: 3190,
    costPrice: 2140,
    oldPrice: 3990,
    stock: 6,
    ozonLink:
      "https://www.ozon.ru/product/pylesos-dlya-avtomobilya-besprovodnoy-moshchnyy-ritmix-cvc-007-dlya-avtomobilya-i-doma-s-1728094546/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-h/7210609361.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-o/c1000/7650754116.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-o/c1000/7999037448.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "RITMIX" },
      { name: "Тип", value: "Автомобильный пылесос" },
      { name: "Мощность", unit: "Вт", value: "120" },
      { name: "Комплектация", value: "Пылесос, насадки, кабель" },
      { name: "Цвет", value: "Черный" }
    ]
  },
  {
    article: "OZ-COMPRESSOR-2PISTON-12V",
    name: "Компрессор автомобильный двухпоршневой 12V",
    description:
      "Мощный насос для подкачки шин легкового автомобиля, кроссовера и надувных изделий. Подключается к прикуривателю 12 В, комплектуется переходниками и шлангом.",
    categoryName: "Инструменты и безопасность",
    currentPrice: 3590,
    costPrice: 2420,
    stock: 11,
    ozonLink:
      "https://www.ozon.ru/product/kompressor-avtomobilnyy-dvuhporshnevoy-nasos-avtomobilnyy-elektricheskiy-dvuhtsilindrovyy-12v-1378883543/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-5/c600/7381947533.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-w/c600/6917018504.jpg",
      "https://ir.ozone.ru/s3/multimedia-x/c1000/6903724425.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Автокомпрессор" },
      { name: "Напряжение", unit: "В", value: "12" },
      { name: "Производительность", unit: "л/мин", value: "57" },
      { name: "Комплектация", value: "Компрессор, переходники, шланг" },
      { name: "Цвет", value: "Черный" }
    ]
  },
  {
    article: "OZ-CYCLONE-KS312-65",
    name: "Циклон KS-312 компрессор 65 л/мин, 12V",
    description:
      "Двухпоршневой компрессор повышенной производительности для быстрой подкачки шин. Подходит для поездок, сезонной смены колес и хранения в багажнике.",
    categoryName: "Инструменты и безопасность",
    currentPrice: 4990,
    costPrice: 3340,
    oldPrice: 5890,
    stock: 5,
    ozonLink: "https://www.ozon.ru/product/kompressor-avtomobilnyy-65-l-min-nasos-avtomobilnyy-12v-1706369182/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-0/c1000/6806670084.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-5/c600/7381947533.jpg",
      "https://ir.ozone.ru/s3/multimedia-x/c1000/6903724425.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Циклон" },
      { name: "Тип", value: "Автокомпрессор" },
      { name: "Напряжение", unit: "В", value: "12" },
      { name: "Производительность", unit: "л/мин", value: "65" },
      { name: "Комплектация", value: "Компрессор, сумка, переходники" }
    ]
  },
  {
    article: "OZ-SKYWAY-JACK-15T",
    name: "Skyway SUMO домкрат ромбический механический 1.5 т",
    description:
      "Механический ромбический домкрат для легкового автомобиля. Компактно хранится в багажнике, подходит для замены колеса и сезонного обслуживания.",
    categoryName: "Инструменты и безопасность",
    currentPrice: 1790,
    costPrice: 1180,
    stock: 8,
    ozonLink:
      "https://www.ozon.ru/product/domkrat-mehanicheskiy-rombicheskiy-1-5t-h-100-340-skyway-sumo-s01801009-2678128608/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-9/c600/7247209113.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-o/c1000/7071562752.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-l/7886848953.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "Skyway" },
      { name: "Тип", value: "Домкрат" },
      { name: "Макс. нагрузка", unit: "т", value: "1.5" },
      { name: "Материал", value: "Сталь" },
      { name: "Комплектация", value: "Домкрат, рукоятка" }
    ]
  },
  {
    article: "OZ-ROAD-KIT-11",
    name: "Набор автомобилиста аварийный, 11 предметов",
    description:
      "Комплект для багажника на каждый день: аварийный знак, аптечка, перчатки, полезные мелочи и сумка для хранения. Подходит для подготовки автомобиля к дороге.",
    categoryName: "Инструменты и безопасность",
    currentPrice: 4290,
    costPrice: 2820,
    stock: 4,
    ozonLink: "https://www.ozon.ru/product/nabor-avtomobilista-avtomobilnyy-nabor-avariynyy-11-predmetov-1639376777/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-v/9446808955.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-c/c1000/9570317844.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-m/7559280382.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Набор автомобилиста" },
      { name: "Количество", unit: "шт", value: "11" },
      { name: "Комплектация", value: "Сумка, знак, аптечка, перчатки" },
      { name: "Страна", value: "Россия" }
    ]
  },
  {
    article: "OZ-STELS-TOW-5T",
    name: "STELS трос буксировочный 5 т, 5 м, 2 крюка",
    description:
      "Буксировочный трос для легковых автомобилей с двумя металлическими крюками. Яркая стропа заметна на дороге, а компактная упаковка легко помещается в багажник.",
    categoryName: "Инструменты и безопасность",
    currentPrice: 690,
    costPrice: 410,
    stock: 20,
    ozonLink: "https://www.ozon.ru/product/stels-tros-buksirovochnyy-1613649411/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-c/c1000/8330530476.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-d/c1000/8098306321.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-0/c1000/7838641800.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "STELS" },
      { name: "Тип", value: "Трос буксировочный" },
      { name: "Длина", unit: "м", value: "5" },
      { name: "Макс. нагрузка", unit: "т", value: "5" },
      { name: "Материал", value: "Полиэстер, сталь" }
    ]
  },
  {
    article: "OZ-HOLDER-AIRVENT-360",
    name: "Держатель для телефона на воздуховод, поворот 360°",
    description:
      "Универсальный автомобильный держатель для смартфона. Крепится на дефлектор, фиксирует устройство зажимами и позволяет быстро повернуть экран под удобным углом.",
    categoryName: "Салон и аксессуары",
    currentPrice: 590,
    costPrice: 330,
    oldPrice: 790,
    stock: 28,
    ozonLink:
      "https://www.ozon.ru/product/derzhatel-dlya-telefona-avtomobilnyy-na-vozduhovod-universalnyy-ozqzj72-1919565350/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-y/c1000/8353952710.jpg",
      "https://ir.ozone.ru/s3/multimedia-m/w1200/6794176630.jpg",
      "https://ir.ozone.ru/s3/multimedia-i/w1200/6794176734.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Держатель автомобильный" },
      { name: "Крепление", value: "Воздуховод" },
      { name: "Материал", value: "Пластик, силикон" },
      { name: "Совместимость", value: "Смартфоны до 7 дюймов" },
      { name: "Цвет", value: "Черный" }
    ]
  },
  {
    article: "OZ-AROMA-OCEAN-VENT",
    name: "Ароматизатор автомобильный Океан на дефлектор",
    description:
      "Компактный освежитель воздуха для установки на дефлектор. Аромат океана подходит для ежедневных поездок и помогает быстро обновить запах в салоне.",
    categoryName: "Салон и аксессуары",
    currentPrice: 290,
    costPrice: 160,
    oldPrice: 390,
    stock: 42,
    ozonLink: "https://www.ozon.ru/product/aromatizator-avtomobilnyy-okean-3238064441/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-r/c1000/8460832059.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-t/c1000/7023006281.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-a/c1000/8315875918.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Ароматизатор" },
      { name: "Крепление", value: "На дефлектор" },
      { name: "Объем", unit: "мл", value: "8" },
      { name: "Цвет", value: "Синий" },
      { name: "Комплектация", value: "1 флакон" }
    ]
  },
  {
    article: "OZ-MATS-TPE-4",
    name: "Коврики в салон автомобиля TPE, универсальные, 4 шт.",
    description:
      "Комплект универсальных всесезонных ковриков из эластичного материала. Бортики помогают удерживать влагу и грязь, коврики легко вынимаются и моются.",
    categoryName: "Салон и аксессуары",
    currentPrice: 5116,
    costPrice: 3520,
    oldPrice: 11600,
    stock: 3,
    ozonLink: "https://www.ozon.ru/product/kovriki-v-salon-avtomobilya-universalnye-vsesezonnye-1076167272/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-f/c1000/9146148207.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-y/8052653158.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-t/c1000/7369865309.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Коврики в салон" },
      { name: "Материал", value: "TPE" },
      { name: "Количество", unit: "шт", value: "4" },
      { name: "Цвет", value: "Черный" },
      { name: "Сезонность", value: "Всесезонные" }
    ]
  },
  {
    article: "OZ-SEAT-COVERS-ECO",
    name: "Чехлы на сиденья автомобиля, универсальный комплект экокожа",
    description:
      "Универсальный комплект чехлов для защиты салона от износа и пятен. Экокожа легко очищается, а нейтральный дизайн подходит большинству автомобилей.",
    categoryName: "Салон и аксессуары",
    currentPrice: 6990,
    costPrice: 4860,
    oldPrice: 8490,
    stock: 6,
    ozonLink:
      "https://www.ozon.ru/product/chehly-na-sidenya-avtomobilya-universalnye-komplekt-iz-premium-ekokozhi-3863005761/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-n/c1000/7288191131.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-1/c1000/7288174081.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-4/c1000/7288105648.jpg"
    ],
    attributes: [
      { name: "Тип", value: "Чехлы на сиденья" },
      { name: "Материал", value: "Экокожа" },
      { name: "Количество", unit: "шт", value: "9" },
      { name: "Цвет", value: "Черный" },
      { name: "Комплектация", value: "Передний и задний ряд" }
    ]
  },
  {
    article: "OZ-MANN-W811-80",
    name: "MANN FILTER W 811/80 масляный фильтр",
    description:
      "Масляный фильтр для очистки моторного масла и защиты двигателя от загрязнений. Подходит для ряда автомобилей Hyundai и Kia при совпадении каталожного номера.",
    categoryName: "Расходники и фильтры",
    currentPrice: 760,
    costPrice: 480,
    stock: 15,
    ozonLink: "https://www.ozon.ru/product/filtr-maslyanyy-mann-w-811-80-filtr-dlya-masla-avtomobilnyy-3455054747/",
    images: [
      "https://ir.ozone.ru/s3/multimedia-1-o/c1000/8085138252.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-u/c1000/8900260086.jpg",
      "https://ir.ozone.ru/s3/multimedia-1-k/9253268012.jpg"
    ],
    attributes: [
      { name: "Бренд", value: "MANN FILTER" },
      { name: "Тип", value: "Масляный фильтр" },
      { name: "Совместимость", value: "Hyundai, Kia" },
      { name: "Количество", unit: "шт", value: "1" },
      { name: "Страна", value: "Германия" }
    ]
  }
] satisfies SeedProduct[];

const demoUsers = [
  {
    email: "anna.petrovna.demo@protech.local",
    name: "Анна Петрова",
    image: "https://i.pravatar.cc/160?u=anna.petrovna.demo"
  },
  {
    email: "igor.smirnov.demo@protech.local",
    name: "Игорь Смирнов",
    image: "https://i.pravatar.cc/160?u=igor.smirnov.demo"
  },
  {
    email: "dmitry.volkov.demo@protech.local",
    name: "Дмитрий Волков",
    image: "https://i.pravatar.cc/160?u=dmitry.volkov.demo"
  },
  {
    email: "elena.kuznetsova.demo@protech.local",
    name: "Елена Кузнецова",
    image: "https://i.pravatar.cc/160?u=elena.kuznetsova.demo"
  }
];

const faqSeeds = [
  {
    userEmail: at(demoUsers, 0, "demoUsers").email,
    title: "Подойдут ли универсальные коврики для Solaris?",
    comment:
      "Нужен комплект на Hyundai Solaris 2021 года. Можно ли подрезать коврики по месту или лучше брать модельные?",
    answer:
      "Универсальный комплект можно подрезать по штатным линиям, но если нужна посадка без зазоров, лучше выбирать модельные коврики под конкретный кузов."
  },
  {
    userEmail: at(demoUsers, 1, "demoUsers").email,
    title: "Когда появится задняя щетка Bosch 330 мм?",
    comment:
      "Вижу, что товара нет в наличии. Можно ли подписаться на поступление и получить уведомление?",
    answer:
      "Да, нажмите кнопку подписки в карточке товара. После приемки новой партии сайт отправит уведомление в личный кабинет."
  },
  {
    userEmail: at(demoUsers, 2, "demoUsers").email,
    title: "Есть ли гарантия на компрессор?",
    comment: "Интересует двухпоршневой компрессор 12V. Какая гарантия и что делать при неисправности?",
    answer:
      "На компрессоры действует гарантия производителя. Сохраните чек и упаковку; при неисправности поможем оформить проверку качества."
  },
  {
    userEmail: at(demoUsers, 3, "demoUsers").email,
    title: "Можно ли забрать заказ самовывозом?",
    comment:
      "Хочу заказать масло, фильтр и ароматизатор. Подскажите, можно ли выбрать самовывоз вместо доставки?"
  },
  {
    userEmail: at(demoUsers, 0, "demoUsers").email,
    title: "Как понять совместимость масляного фильтра?",
    comment:
      "На странице указан MANN W 811/80. Достаточно ли артикула или нужно сверять VIN автомобиля?",
    answer:
      "Лучше сверять по VIN или каталогу производителя. Артикул помогает быстро найти товар, но применимость зависит от двигателя и года выпуска."
  },
  {
    userEmail: at(demoUsers, 1, "demoUsers").email,
    title: "Сколько держится ароматизатор Океан?",
    comment: "Нужен не слишком резкий запах для ежедневных поездок. На сколько обычно хватает флакона?",
    answer:
      "Интенсивность зависит от температуры и положения заслонки дефлектора. В среднем аромат держится несколько недель при умеренном обдуве."
  },
  {
    userEmail: at(demoUsers, 2, "demoUsers").email,
    title: "Подойдут ли LED H7 для грузовика 24V?",
    comment: "В карточке вижу 12 В. Можно ли поставить эти лампы на грузовой автомобиль с сетью 24 В?"
  },
  {
    userEmail: at(demoUsers, 3, "demoUsers").email,
    title: "Можно ли оплатить заказ при получении?",
    comment:
      "Хочу сначала проверить внешний вид товара. Есть ли вариант оплаты при получении для самовывоза?",
    answer:
      "Да, для части заказов доступна офлайн-оплата при получении. Итоговый вариант оплаты можно выбрать на странице оформления."
  }
];

function priceHistory(product: SeedProduct) {
  const first = product.oldPrice ?? Math.round(product.currentPrice * 1.08);
  const middle = Math.round((first + product.currentPrice) / 2);

  return [
    { value: rub(first), createdAt: daysAgo(42) },
    { value: rub(middle), createdAt: daysAgo(20) },
    { value: rub(product.currentPrice), createdAt: daysAgo(3) }
  ];
}

function reviewCopy(product: SeedProduct, index: number) {
  const variants = [
    {
      rating: product.stock === 0 ? 4 : 5,
      advantages: "Товар пришел целым, фото и описание совпадают.",
      disadvantages: product.stock === 0 ? "Жаль, быстро закончился в наличии." : "",
      comment: `Брал ${product.name.toLowerCase()} для регулярного обслуживания. Упаковка аккуратная, артикул легко сверить.`
    },
    {
      rating: 5,
      advantages: "Хорошее качество за свои деньги, понятные характеристики.",
      disadvantages: "",
      comment: "Заказ оформили быстро, в карточке достаточно данных для выбора. После установки претензий нет."
    },
    {
      rating: 4,
      advantages: "Выглядит надежно, комплектация на месте.",
      disadvantages: "Хотелось бы чуть подробнее инструкцию.",
      comment: "Покупкой доволен. Для теста каталога хорошо видно цену, остаток и отзывы."
    }
  ];

  return at(variants, index % variants.length, "reviewVariants");
}

async function upsertCategories() {
  const categoryByName = new Map<string, number>();

  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });

    categoryByName.set(category.name, category.id);
  }

  return categoryByName;
}

async function upsertAttributes() {
  const attributeByKey = new Map<string, number>();

  for (const attribute of attributeDefs) {
    const unit = attribute.unit ?? "";
    const saved = await prisma.attribute.upsert({
      where: {
        name_unit: {
          name: attribute.name,
          unit
        }
      },
      update: {},
      create: {
        name: attribute.name,
        unit
      }
    });

    attributeByKey.set(attrKey(saved.name, saved.unit), saved.id);
  }

  return attributeByKey;
}

async function upsertProducts(categoryByName: Map<string, number>, attributeByKey: Map<string, number>) {
  const savedProducts = [];

  for (const product of products) {
    const categoryId = categoryByName.get(product.categoryName);

    if (!categoryId) {
      throw new Error(`Category is missing: ${product.categoryName}`);
    }

    const productAttributes = product.attributes.map((attribute) => {
      const attributeId = attributeByKey.get(attrKey(attribute.name, attribute.unit ?? ""));

      if (!attributeId) {
        throw new Error(`Attribute is missing: ${attribute.name} ${attribute.unit ?? ""}`.trim());
      }

      return {
        attributeId,
        value: attribute.value
      };
    });

    const mainImage = at(product.images, 0, `${product.article} images`);
    const additionalImages = product.images.slice(1);
    const baseData = {
      name: product.name,
      description: product.description,
      currentPrice: rub(product.currentPrice),
      costPrice: rub(product.costPrice),
      oldPrice: product.oldPrice ? rub(product.oldPrice) : null,
      mainImage,
      ozonLink: product.ozonLink,
      categoryId,
      isActive: true
    };

    const existing = await prisma.product.findUnique({
      where: { article: product.article },
      select: { id: true }
    });

    const saved = existing
      ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          productImages: {
            deleteMany: {},
            create: additionalImages.map((url) => ({ url }))
          },
          productPrices: {
            deleteMany: {},
            create: priceHistory(product)
          },
          productStocks: {
            deleteMany: {},
            create: {
              quantity: product.stock
            }
          },
          productAttributes: {
            deleteMany: {},
            create: productAttributes
          }
        }
      })
      : await prisma.product.create({
        data: {
          ...baseData,
          article: product.article,
          productImages: {
            create: additionalImages.map((url) => ({ url }))
          },
          productPrices: {
            create: priceHistory(product)
          },
          productStocks: {
            create: {
              quantity: product.stock
            }
          },
          productAttributes: {
            create: productAttributes
          }
        }
      });

    savedProducts.push(saved);
  }

  return savedProducts;
}

async function upsertUsers() {
  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    orderBy: { createdAt: "asc" }
  });

  const demoAdmin = await prisma.user.upsert({
    where: { email: demoAdminEmail },
    update: {
      name: "Администратор ProTech",
      role: Role.ADMIN,
      emailVerified: true
    },
    create: {
      email: demoAdminEmail,
      name: "Администратор ProTech",
      role: Role.ADMIN,
      emailVerified: true
    }
  });

  const adminPasswordHash = await hashPassword(demoAdminPassword);
  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: demoAdmin.id,
      providerId: "credential"
    },
    select: { id: true }
  });

  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: {
        accountId: demoAdmin.id,
        password: adminPasswordHash
      }
    });
  } else {
    await prisma.account.create({
      data: {
        accountId: demoAdmin.id,
        providerId: "credential",
        userId: demoAdmin.id,
        password: adminPasswordHash
      }
    });
  }

  const supportUser = admin ?? demoAdmin;
  const customers = [];

  for (const user of demoUsers) {
    customers.push(await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        image: user.image,
        emailVerified: true,
        role: Role.USER
      },
      create: {
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: true,
        role: Role.USER
      }
    }));
  }

  return { supportUser, customers };
}

async function cleanDemoData(productIds: number[], customerIds: string[]) {
  const seededOrders = await prisma.order.findMany({
    where: {
      payment: {
        is: {
          transactionId: {
            startsWith: seedTag
          }
        }
      }
    },
    select: { id: true }
  });

  await prisma.stockMovement.deleteMany({
    where: {
      reason: {
        startsWith: seedTag
      }
    }
  });

  await prisma.order.deleteMany({
    where: {
      id: {
        in: seededOrders.map((order) => order.id)
      }
    }
  });

  await prisma.auditLog.deleteMany({
    where: {
      summary: {
        startsWith: "[Demo seed]"
      }
    }
  });

  await prisma.message.deleteMany({
    where: {
      message: {
        startsWith: "[Demo]"
      }
    }
  });

  await prisma.favoriteProduct.deleteMany({
    where: {
      userId: { in: customerIds },
      productId: { in: productIds }
    }
  });

  await prisma.productSubscription.deleteMany({
    where: {
      userId: { in: customerIds },
      productId: { in: productIds }
    }
  });

  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        userId: { in: customerIds }
      }
    }
  });

  await prisma.review.deleteMany({
    where: {
      userId: { in: customerIds },
      productId: { in: productIds }
    }
  });

  await prisma.shopQuestion.deleteMany({
    where: {
      userId: { in: customerIds },
      title: {
        in: faqSeeds.map((faq) => faq.title)
      }
    }
  });
}

async function seedStockMovements(savedProducts: Array<{ id: number; article: string }>) {
  for (const [index, product] of savedProducts.entries()) {
    const source = products.find((item) => item.article === product.article)!;

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.ADJUSTMENT,
        quantityDelta: source.stock,
        quantityAfter: source.stock,
        reason: `${seedTag}: initial stock for demo catalog`,
        createdAt: daysAgo(18 - (index % 8))
      }
    });
  }
}

async function seedReviews(
  savedProducts: Array<{ id: number; article: string; mainImage: string }>,
  customers: Array<{ id: string; email: string }>,
  supportUserId: string
) {
  for (const [productIndex, savedProduct] of savedProducts.entries()) {
    const source = products.find((item) => item.article === savedProduct.article)!;
    const reviewCount = productIndex % 4 === 0 ? 3 : productIndex % 2 === 0 ? 2 : 1;

    for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
      const customer = at(customers, (productIndex + reviewIndex) % customers.length, "customers");
      const copy = reviewCopy(source, reviewIndex);
      const answered = reviewIndex === 0 && productIndex % 3 !== 1;

      await prisma.review.create({
        data: {
          userId: customer.id,
          productId: savedProduct.id,
          rating: copy.rating,
          advantages: copy.advantages,
          disadvantages: copy.disadvantages || null,
          comment: copy.comment,
          isAnswered: answered,
          createdAt: daysAgo(16 - ((productIndex + reviewIndex) % 12)),
          reviewPhotos: reviewIndex === 1
            ? {
              create: {
                url: savedProduct.mainImage
              }
            }
            : undefined,
          reviewAnswers: answered
            ? {
              create: {
                text: "Спасибо за отзыв! Рады, что товар подошел. Если понадобится помощь с подбором расходников, напишите нам.",
                userId: supportUserId,
                createdAt: daysAgo(12 - (productIndex % 8))
              }
            }
            : undefined
        }
      });
    }
  }
}

async function seedFaq(customers: Array<{ id: string; email: string }>, supportUserId: string) {
  const userByEmail = new Map(customers.map((user) => [user.email, user.id]));

  for (const [index, faq] of faqSeeds.entries()) {
    const userId = userByEmail.get(faq.userEmail);

    if (!userId) {
      throw new Error(`FAQ user is missing: ${faq.userEmail}`);
    }

    await prisma.shopQuestion.create({
      data: {
        userId,
        title: faq.title,
        comment: faq.comment,
        isAnswered: Boolean(faq.answer),
        createdAt: daysAgo(10 - (index % 6)),
        shopAnswers: faq.answer
          ? {
            create: {
              comment: faq.answer,
              userId: supportUserId,
              createdAt: daysAgo(8 - (index % 5))
            }
          }
          : undefined
      }
    });
  }
}

async function seedCustomerState(
  savedProducts: Array<{ id: number; article: string }>,
  customers: Array<{ id: string; email: string }>
) {
  const byArticle = new Map(savedProducts.map((product) => [product.article, product.id]));
  const firstCustomer = at(customers, 0, "customers");
  const cart = await prisma.cart.upsert({
    where: { userId: firstCustomer.id },
    update: {},
    create: { userId: firstCustomer.id }
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  await prisma.cartItem.createMany({
    data: [
      { cartId: cart.id, productId: byArticle.get("OZ-HOLDER-AIRVENT-360")!, quantity: 1 },
      { cartId: cart.id, productId: byArticle.get("OZ-R2R-BRAKE-650")!, quantity: 2 },
      { cartId: cart.id, productId: byArticle.get("OZ-MANN-W811-80")!, quantity: 1 }
    ]
  });

  await prisma.favoriteProduct.createMany({
    skipDuplicates: true,
    data: [
      { userId: at(customers, 0, "customers").id, productId: byArticle.get("OZ-DVR-F70-4K-WIFI")! },
      { userId: at(customers, 0, "customers").id, productId: byArticle.get("OZ-MATS-TPE-4")! },
      { userId: at(customers, 1, "customers").id, productId: byArticle.get("OZ-MOTUL-8100-5W30-4L")! },
      { userId: at(customers, 1, "customers").id, productId: byArticle.get("OZ-COMPRESSOR-2PISTON-12V")! },
      { userId: at(customers, 2, "customers").id, productId: byArticle.get("OZ-STELS-TOW-5T")! },
      { userId: at(customers, 3, "customers").id, productId: byArticle.get("OZ-SEAT-COVERS-ECO")! }
    ]
  });

  await prisma.productSubscription.createMany({
    skipDuplicates: true,
    data: [
      { userId: at(customers, 0, "customers").id, productId: byArticle.get("OZ-BOSCH-A331H-330")! },
      { userId: at(customers, 2, "customers").id, productId: byArticle.get("OZ-BOSCH-A331H-330")! },
      { userId: at(customers, 3, "customers").id, productId: byArticle.get("OZ-MATS-TPE-4")! }
    ]
  });
}

async function seedOrders(
  savedProducts: Array<{
    id: number;
    article: string;
    name: string;
    currentPrice: Prisma.Decimal;
    costPrice: Prisma.Decimal | null;
    mainImage: string;
    categoryId: number;
  }>,
  customers: Array<{ id: string }>,
) {
  const byArticle = new Map(savedProducts.map((product) => [product.article, product]));
  const orderSeeds = [
    {
      key: "completed-july-service",
      userId: at(customers, 0, "customers").id,
      daysAgo: 9,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.ONLINE,
      obtainingMethod: ObtainingMethod.DELIVERY,
      address: "Москва, Ленинградский проспект, 36",
      items: [
        { article: "OZ-MOTUL-8100-5W30-4L", quantity: 1 },
        { article: "OZ-MANN-W811-80", quantity: 1 },
        { article: "OZ-R2R-BRAKE-650", quantity: 2 }
      ]
    },
    {
      key: "pickup-gadgets",
      userId: at(customers, 1, "customers").id,
      daysAgo: 7,
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.UPON_RECEIPT,
      paymentMethod: PaymentMethod.OFFLINE,
      obtainingMethod: ObtainingMethod.PICKUP,
      items: [
        { article: "OZ-DVR-SUPERHD-1296", quantity: 1 },
        { article: "OZ-BASEUS-CC-30W", quantity: 1 }
      ]
    },
    {
      key: "shipped-tools",
      userId: at(customers, 2, "customers").id,
      daysAgo: 5,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.ONLINE,
      obtainingMethod: ObtainingMethod.DELIVERY,
      address: "Санкт-Петербург, Невский проспект, 84",
      items: [
        { article: "OZ-COMPRESSOR-2PISTON-12V", quantity: 1 },
        { article: "OZ-STELS-TOW-5T", quantity: 1 },
        { article: "OZ-ROAD-KIT-11", quantity: 1 }
      ]
    },
    {
      key: "new-salon",
      userId: at(customers, 3, "customers").id,
      daysAgo: 2,
      status: OrderStatus.NEW,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.ONLINE,
      obtainingMethod: ObtainingMethod.DELIVERY,
      address: "Казань, улица Баумана, 19",
      items: [
        { article: "OZ-HOLDER-AIRVENT-360", quantity: 1 },
        { article: "OZ-AROMA-OCEAN-VENT", quantity: 3 },
        { article: "OZ-MATS-TPE-4", quantity: 1 }
      ]
    },
    {
      key: "cancelled-light",
      userId: at(customers, 0, "customers").id,
      daysAgo: 1,
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
      paymentMethod: PaymentMethod.ONLINE,
      obtainingMethod: ObtainingMethod.PICKUP,
      items: [
        { article: "OZ-STOUN-H7-4300K", quantity: 1 },
        { article: "OZ-WIPER-HYBRID-530-500", quantity: 1 }
      ]
    }
  ];

  for (const orderSeed of orderSeeds) {
    const items = orderSeed.items.map((item) => {
      const product = byArticle.get(item.article);

      if (!product) {
        throw new Error(`Order product is missing: ${item.article}`);
      }

      const quantity = item.quantity;
      const lineTotal = product.currentPrice.mul(quantity);
      const categoryName = products.find((seedProduct) => seedProduct.article === product.article)!.categoryName;

      return {
        product,
        quantity,
        lineTotal,
        data: {
          productId: product.id,
          quantity,
          price: product.currentPrice,
          costPrice: product.costPrice,
          lineTotal,
          productName: product.name,
          productArticle: product.article,
          productMainImage: product.mainImage,
          categoryId: product.categoryId,
          categoryName
        }
      };
    });

    const amount = items.reduce((total, item) => total.add(item.lineTotal), new Prisma.Decimal(0));
    const createdAt = daysAgo(orderSeed.daysAgo);

    const order = await prisma.order.create({
      data: {
        userId: orderSeed.userId,
        obtainingMethod: orderSeed.obtainingMethod,
        orderStatus: orderSeed.status,
        paymentMethod: orderSeed.paymentMethod,
        stockReserved: orderSeed.status !== OrderStatus.CANCELLED,
        createdAt,
        updatedAt: createdAt,
        orderItems: {
          create: items.map((item) => item.data)
        },
        delivery: orderSeed.obtainingMethod === ObtainingMethod.DELIVERY
          ? {
            create: {
              address: orderSeed.address!,
              apartment: "12",
              entrance: "2",
              floor: "5",
              intercom: "12К",
              comment: "Позвонить за 15 минут",
              deliveredAt: orderSeed.status === OrderStatus.COMPLETED ? daysAgo(orderSeed.daysAgo - 2) : null
            }
          }
          : undefined,
        payment: {
          create: {
            paymentStatus: orderSeed.paymentStatus,
            amount,
            transactionId: `${seedTag}-${orderSeed.key}`,
            paidAt: orderSeed.paymentStatus === PaymentStatus.PAID ? daysAgo(orderSeed.daysAgo - 1) : null
          }
        }
      }
    });

    if (orderSeed.status !== OrderStatus.CANCELLED) {
      for (const item of items) {
        const stock = products.find((seedProduct) => seedProduct.article === item.product.article)!.stock;

        await prisma.stockMovement.create({
          data: {
            productId: item.product.id,
            orderId: order.id,
            type: StockMovementType.RESERVE,
            quantityDelta: -item.quantity,
            quantityAfter: Math.max(stock - item.quantity, 0),
            reason: `${seedTag}: reserved for seeded order ${orderSeed.key}`,
            createdAt
          }
        });
      }
    }
  }
}

async function seedMessages(customers: Array<{ id: string }>) {
  await prisma.message.createMany({
    data: [
      {
        userId: at(customers, 0, "customers").id,
        messageType: MessageType.PRICE,
        message: "[Demo] Цена на коврики TPE снижена, старую цену видно в карточке товара.",
        createdAt: daysAgo(4)
      },
      {
        userId: at(customers, 1, "customers").id,
        messageType: MessageType.STOCK,
        message: "[Demo] Вы подписаны на поступление задней щетки Bosch 330 мм.",
        createdAt: daysAgo(3)
      },
      {
        userId: at(customers, 2, "customers").id,
        messageType: MessageType.FAQ_ANSWER,
        message: "[Demo] Магазин ответил на ваш вопрос о гарантии на компрессор.",
        createdAt: daysAgo(2)
      },
      {
        userId: at(customers, 3, "customers").id,
        messageType: MessageType.DELIVERY,
        message: "[Demo] Заказ с аксессуарами для салона ожидает подтверждения.",
        createdAt: daysAgo(1)
      }
    ]
  });
}

async function seedAuditLogs(supportUserId: string, savedProducts: Array<{ id: number; article: string }>) {
  await prisma.auditLog.createMany({
    data: [
      {
        adminId: supportUserId,
        action: AuditAction.CREATE,
        entityType: "product",
        entityId: String(at(savedProducts, 0, "savedProducts").id),
        summary: "[Demo seed] Created OZON-based demo catalog",
        metadata: { seedTag, products: products.length }
      },
      {
        adminId: supportUserId,
        action: AuditAction.STOCK_ADJUSTMENT,
        entityType: "product_stock",
        entityId: "bulk",
        summary: "[Demo seed] Added initial stock movements",
        metadata: { seedTag }
      },
      {
        adminId: supportUserId,
        action: AuditAction.ANSWER,
        entityType: "faq",
        entityId: "bulk",
        summary: "[Demo seed] Added FAQ answers and review replies",
        metadata: { seedTag }
      }
    ]
  });
}

async function main() {
  console.log("Seeding demo shop data from OZON-like catalog...");

  const categoryByName = await upsertCategories();
  const attributeByKey = await upsertAttributes();
  const savedProducts = await upsertProducts(categoryByName, attributeByKey);
  const detailedProducts = await prisma.product.findMany({
    where: {
      article: {
        in: products.map((product) => product.article)
      }
    },
    orderBy: { article: "asc" },
    select: {
      id: true,
      article: true,
      name: true,
      currentPrice: true,
      costPrice: true,
      mainImage: true,
      categoryId: true
    }
  });
  const { supportUser, customers } = await upsertUsers();

  await cleanDemoData(
    detailedProducts.map((product) => product.id),
    customers.map((user) => user.id)
  );

  await seedStockMovements(savedProducts);
  await seedReviews(detailedProducts, customers, supportUser.id);
  await seedFaq(customers, supportUser.id);
  await seedCustomerState(detailedProducts, customers);
  await seedOrders(detailedProducts, customers);
  await seedMessages(customers);
  await seedAuditLogs(supportUser.id, detailedProducts);

  const counts = {
    categories: await prisma.category.count(),
    attributes: await prisma.attribute.count(),
    products: await prisma.product.count(),
    productImages: await prisma.productImage.count(),
    productAttributes: await prisma.productAttribute.count(),
    reviews: await prisma.review.count(),
    faq: await prisma.shopQuestion.count(),
    orders: await prisma.order.count()
  };

  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
