import { AxiosError } from "axios";
const data = {
  "cakes": [
    {
      "id": 1,
      "name": "Малиновий",
      "description": "Торт із ванільного бісквіта з крем-чизом і малиною. У складі також вершки та мигдаль.",
      "basePrice": 850,
      "photoUrl": "/images/raspberry-cake.jpg",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Бісквітні"
      },
      "isAvailable": true,
      "weight": "1.2 кг",
      "isCustomizable": false,
      "ingredients": "Ванільний бісквіт,Крем-чиз,Малина,Вершки,Мигдаль"
    },
    {
      "id": 2,
      "name": "Полуничний",
      "description": "Бісквітний торт із вершковим кремом, полуницею та желе. У смаку поєднуються вершкова основа й полуничні ноти. Желе доповнює ягідну частину торта.",
      "basePrice": 920,
      "photoUrl": "/images/strawberry-cake.jpg",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Бісквітні"
      },
      "isAvailable": true,
      "weight": "1.4 кг",
      "isCustomizable": false,
      "ingredients": "Бісквіт,Вершковий крем,Полуниця,Желе"
    },
    {
      "id": 3,
      "name": "Класичний медовик",
      "description": "Торт із медових коржів зі сметанним кремом і горіхами. Мед надає коржам характерного аромату, а сметанний крем додає кислинку. Горіхи доповнюють медовий смак.",
      "basePrice": 780,
      "photoUrl": "/images/honey-cake.jpg",
      "categoryId": 2,
      "category": {
        "id": 2,
        "name": "Медові"
      },
      "isAvailable": true,
      "weight": "1.6 кг",
      "isCustomizable": false,
      "ingredients": "Медові коржі,Сметанний крем,Горіхи"
    },
    {
      "id": 4,
      "name": "Медовик з горіхами",
      "description": "Медові коржі з карамельним кремом і волоськими горіхами. У смаку поєднуються мед, карамель і горіхові ноти. Варіант для тих, хто обирає торт без ягідної начинки.",
      "basePrice": 820,
      "photoUrl": "/images/honey-nuts-cake.jpg",
      "categoryId": 2,
      "category": {
        "id": 2,
        "name": "Медові"
      },
      "isAvailable": true,
      "weight": "1.5 кг",
      "isCustomizable": false,
      "ingredients": "Медові коржі,Карамельний крем,Волоський горіх"
    },
    {
      "id": 5,
      "name": "Чизкейк Нью-Йорк",
      "description": "Чізкейк із крем-сиру та ванілі на пісочній основі. Основний смак — вершково-сирний, із ванільним ароматом. Пісочна основа відрізняється за текстурою від сирної частини; ягід у складі немає.",
      "basePrice": 950,
      "photoUrl": "/images/new-york-cheesecake.jpg",
      "categoryId": 3,
      "category": {
        "id": 3,
        "name": "Чізкейки"
      },
      "isAvailable": true,
      "weight": "1.3 кг",
      "isCustomizable": false,
      "ingredients": "Пісочна основа,Крем-чиз,Яйця,Цукор,Ваніль"
    },
    {
      "id": 6,
      "name": "Полуничний чизкейк",
      "description": "Чізкейк на пісочній основі з полуницею та желе. Вершково-сирна частина поєднується з полуничним смаком і ягідною кислинкою. На відміну від бісквітного торта, основу тут становить пісочний шар.",
      "basePrice": 990,
      "photoUrl": "/images/strawberry-cheesecake.jpg",
      "categoryId": 3,
      "category": {
        "id": 3,
        "name": "Чізкейки"
      },
      "isAvailable": true,
      "weight": "1.4 кг",
      "isCustomizable": false,
      "ingredients": "Пісочна основа,Крем-чиз,Полуниця,Желе"
    },
    {
      "id": 7,
      "name": "Шоколадний мус",
      "description": "Торт із бісквітною основою, шоколадним мусом і дзеркальною глазур’ю. Основний смак — шоколадний, а мус має повітрянішу текстуру, ніж бісквіт. Глазур утворює гладке покриття поверх торта.",
      "basePrice": 1050,
      "photoUrl": "/images/chocolate-mousse.jpg",
      "categoryId": 4,
      "category": {
        "id": 4,
        "name": "Муссові"
      },
      "isAvailable": true,
      "weight": "1.2 кг",
      "isCustomizable": false,
      "ingredients": "Шоколадний мус,Дзеркальна глазур,Бісквіт"
    },
    {
      "id": 8,
      "name": "Фісташковий мус",
      "description": "Торт із бісквітною основою, фісташковим мусом і праліне. Фісташка задає основний горіховий смак, який доповнює праліне. Мусова частина відрізняється за текстурою від бісквітної основи.",
      "basePrice": 1100,
      "photoUrl": "/images/pistachio-mousse.jpg",
      "categoryId": 4,
      "category": {
        "id": 4,
        "name": "Муссові"
      },
      "isAvailable": true,
      "weight": "1.3 кг",
      "isCustomizable": false,
      "ingredients": "Фісташковий мус,Праліне,Бісквіт"
    },
    {
      "id": 9,
      "name": "Весільний класичний",
      "description": "Торт із ванільного бісквіта з масляним кремом, мастикою та білим декором. Основа смаку — ваніль і вершкові ноти крему. Бажаний напис та деталі оформлення можна вказати в коментарі до замовлення.",
      "basePrice": 2500,
      "photoUrl": "/images/wedding-classic.jpg",
      "categoryId": 5,
      "category": {
        "id": 5,
        "name": "Весільні"
      },
      "isAvailable": true,
      "weight": "3.0 кг",
      "isCustomizable": false,
      "ingredients": "Ванільний бісквіт,Масляний крем,Мастика,Декор"
    },
    {
      "id": 10,
      "name": "Весільний з декором",
      "description": "Бісквітний торт із крем-чизом, ягодами та квітковим оформленням. Крем додає вершково-сирний смак, а ягоди — кислинку. Побажання до квітів і напису вкажіть у коментарі до замовлення.",
      "basePrice": 3200,
      "photoUrl": "/images/wedding-flower-cake.jpg",
      "categoryId": 5,
      "category": {
        "id": 5,
        "name": "Весільні"
      },
      "isAvailable": true,
      "weight": "3.5 кг",
      "isCustomizable": false,
      "ingredients": "Бісквіт,Крем-чиз,Живі квіти,Ягоди"
    },
    {
      "id": 11,
      "name": "Дитячий з декором",
      "description": "Ванільний бісквіт із масляним кремом, мастикою та цукровим декором у вигляді єдинорога. Основа смаку — ваніль і крем. Ім’я, вік та бажані кольори оформлення вкажіть у коментарі до замовлення.",
      "basePrice": 950,
      "photoUrl": "/images/unicorn-cake.jpg",
      "categoryId": 6,
      "category": {
        "id": 6,
        "name": "Дитячі"
      },
      "isAvailable": true,
      "weight": "1.8 кг",
      "isCustomizable": false,
      "ingredients": "Ванільний бісквіт,Масляний крем,Мастика,Цукровий декор"
    },
    {
      "id": 12,
      "name": "Дитячий шоколадний",
      "description": "Шоколадний бісквіт із масляним кремом і шоколадним декором. Шоколад є і в основі торта, і в оформленні. Побажання до напису та декору можна залишити в коментарі до замовлення.",
      "basePrice": 880,
      "photoUrl": "/images/kids-chocolate-cake.jpg",
      "categoryId": 6,
      "category": {
        "id": 6,
        "name": "Дитячі"
      },
      "isAvailable": true,
      "weight": "1.6 кг",
      "isCustomizable": false,
      "ingredients": "Шоколадний бісквіт,Масляний крем,Шоколадний декор"
    },
    {
      "id": 13,
      "name": "Тирамісу",
      "description": "Тирамісу із савоярді, маскарпоне, кавою та какао. Кава надає десерту характерного аромату, маскарпоне — вершкового смаку, а какао додає гірчинку. Основу десерту становить печиво савоярді, яке поєднується з кремом із маскарпоне.",
      "basePrice": 870,
      "photoUrl": "/images/tiramisu-cake.jpg",
      "categoryId": 7,
      "category": {
        "id": 7,
        "name": "Без випікання"
      },
      "isAvailable": true,
      "weight": "1.2 кг",
      "isCustomizable": false,
      "ingredients": "Савоярді,Маскарпоне,Кава,Какао"
    },
    {
      "id": 14,
      "name": "Холодний чизкейк",
      "description": "Сирний торт без випікання на основі з печива, з вершковим сиром, ягодами та желе. Сирна частина має вершковий смак, а ягоди додають кислинку. Замість бісквіта тут використана основа з печива.",
      "basePrice": 750,
      "photoUrl": "/images/no-bake-cheesecake.jpg",
      "categoryId": 7,
      "category": {
        "id": 7,
        "name": "Без випікання"
      },
      "isAvailable": true,
      "weight": "1.1 кг",
      "isCustomizable": false,
      "ingredients": "Печиво,Вершковий сир,Ягоди,Желе"
    },
    {
      "id": 15,
      "name": "Фітнес-торт",
      "description": "Торт на мигдалевому борошні з кокосовим кремом, стевією та ягодами. У смаку поєднуються мигдаль, кокос і ягідна кислинка. Для підсолодження використовується стевія; у складі є горіхи.",
      "basePrice": 980,
      "photoUrl": "/images/no-sugar-gluten-cake.png",
      "categoryId": 8,
      "category": {
        "id": 8,
        "name": "Дієтичні"
      },
      "isAvailable": true,
      "weight": "1.0 кг",
      "isCustomizable": false,
      "ingredients": "Мигдалеве борошно,Стевія,Ягоди,Кокосовий крем"
    },
    {
      "id": 16,
      "name": "Протеїновий торт",
      "description": "Торт із протеїнового бісквіта з йогуртовим кремом і ягодами. Йогуртовий крем і ягоди додають кислинку. Основу становить протеїновий бісквіт, доповнений кремом і ягідною частиною.",
      "basePrice": 1020,
      "photoUrl": "/images/protein-cake.jpg",
      "categoryId": 8,
      "category": {
        "id": 8,
        "name": "Дієтичні"
      },
      "isAvailable": true,
      "weight": "1.1 кг",
      "isCustomizable": false,
      "ingredients": "Протеїновий бісквіт,Йогуртовий крем,Ягоди"
    },
    {
      "id": 17,
      "name": "Індивідуальний дизайн",
      "description": "Оберіть бісквіт і крем у формі замовлення. Побажання до напису й декору вкажіть у коментарі.",
      "basePrice": 900,
      "photoUrl": "/images/your-custom-cake.jpg",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Бісквітні"
      },
      "isAvailable": true,
      "weight": null,
      "isCustomizable": true,
      "ingredients": null
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Бісквітні"
    },
    {
      "id": 2,
      "name": "Медові"
    },
    {
      "id": 3,
      "name": "Чізкейки"
    },
    {
      "id": 4,
      "name": "Муссові"
    },
    {
      "id": 5,
      "name": "Весільні"
    },
    {
      "id": 6,
      "name": "Дитячі"
    },
    {
      "id": 7,
      "name": "Без випікання"
    },
    {
      "id": 8,
      "name": "Дієтичні"
    }
  ],
  "biscuits": [
    {
      "id": 1,
      "name": "Ванільний бісквіт",
      "extraPrice": 0
    },
    {
      "id": 2,
      "name": "Шоколадний бісквіт",
      "extraPrice": 20
    },
    {
      "id": 3,
      "name": "Червоний оксамит",
      "extraPrice": 30
    }
  ],
  "creams": [
    {
      "id": 1,
      "name": "Крем-чиз",
      "extraPrice": 0
    },
    {
      "id": 2,
      "name": "Ванільний крем",
      "extraPrice": 0
    },
    {
      "id": 3,
      "name": "Фісташковий крем",
      "extraPrice": 25
    },
    {
      "id": 4,
      "name": "Вершки",
      "extraPrice": 15
    }
  ]
};

export async function demoAdapter(config) {
  const route = config.url.replace(/^\//, "").split("/");
  const collection = data[route[0]];
  if (config.method === "get" && collection) {
    const result = route[1] ? collection.find(item => String(item.id) === route[1]) : collection;
    if (result) return { data: result, status: 200, statusText: "OK", headers: {}, config };
  }
  throw new AxiosError("У demo-версії доступний перегляд каталогу та форм. Вхід і надсилання замовлень потребують сервера.", "ERR_DEMO", config, null, { data: { message: "Ця дія недоступна в demo-версії." }, status: 503, statusText: "Demo", headers: {}, config });
}
