(function () {
  const BATCH_ID = "business-card-batch-20260706";
  const VERSION = "20260706-local-002";
  const MARKER = "ocr_customer_batch_import_20260706";
  const CUSTOMERS = [
  {
    "id": "ocr20260706-001",
    "name": "宜昇自動化設備股份有限公司",
    "phone": "03-313-3698",
    "address": "桃園市蘆竹區中興路100巷5號",
    "company_name": "宜昇自動化設備股份有限公司",
    "tax_id": "86246355",
    "invoice_title": "",
    "contacts": [
      {
        "name": "廖茂鈞",
        "role": "董事",
        "phone": "0919-331-107",
        "email": "maochun@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43796_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43796_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43796_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43796_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-002",
    "name": "21世紀不動產中壢環中加盟店",
    "phone": "03-459-7999",
    "address": "桃園市中壢區環中東路二段626號",
    "company_name": "21世紀不動產中壢環中加盟店",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "陳財祿",
        "role": "店東",
        "phone": "0935-173-488",
        "email": "tsailuchen@yahoo.com.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43796_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43796_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43796_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43796_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-003",
    "name": "佳龍科技工程股份有限公司",
    "phone": "03-473-6566",
    "address": "32841桃園市觀音區大潭里環科路323號",
    "company_name": "佳龍科技工程股份有限公司",
    "tax_id": "97211972",
    "invoice_title": "",
    "contacts": [
      {
        "name": "黃城池",
        "role": "專案經理",
        "phone": "0985-027-168",
        "email": "richardhuang@sdti.com.tw",
        "notes": "",
        "primary": true
      },
      {
        "name": "吳界欣",
        "role": "董事長",
        "phone": "0935-837-027",
        "email": "ken_wu@sdti.com.tw",
        "notes": "",
        "primary": false
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43797_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43797_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43797_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43797_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43797_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43797_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-004",
    "name": "沅泰環保科技股份有限公司",
    "phone": "04-836-7298",
    "address": "510彰化縣員林市大峯里阿寶巷56號",
    "company_name": "沅泰環保科技股份有限公司",
    "tax_id": "42568894",
    "invoice_title": "",
    "contacts": [
      {
        "name": "黃宸彥",
        "role": "設計部經理",
        "phone": "0980-880-526",
        "email": "aaron@yuantai-eco.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43798_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43798_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43798_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43798_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43799_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43799_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-005",
    "name": "瑞成土木結構技師事務所",
    "phone": "02-2262-6688",
    "address": "新北市土城區中正路1號10樓之3",
    "company_name": "瑞成土木結構技師事務所",
    "tax_id": "82659967",
    "invoice_title": "",
    "contacts": [
      {
        "name": "張庭瑜",
        "role": "土木、結構技師",
        "phone": "0972-294-028",
        "email": "service@rei-chen.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43800_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43800_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43800_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43800_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43801_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43801_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-006",
    "name": "巨工實業有限公司",
    "phone": "03-539-6167",
    "address": "新竹市香山區樹下街160號1樓",
    "company_name": "巨工實業有限公司",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "劉欣樺",
        "role": "經理",
        "phone": "0916-530-035",
        "email": "jjyun.li5781@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43800_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43800_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43800_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43800_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43801_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43801_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-007",
    "name": "台灣省商業總會",
    "phone": "03-535-9708",
    "address": "300新竹市東區鐵道路一段45號",
    "company_name": "台灣省商業總會",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "羅國銘",
        "role": "理事",
        "phone": "0937-223-442",
        "email": "2012twodesign@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43802_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43802_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43802_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43802_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-008",
    "name": "俯華開發股份有限公司",
    "phone": "02-2278-1855",
    "address": "新北市三重區光復路一段61巷24弄17號",
    "company_name": "俯華開發股份有限公司",
    "tax_id": "28470679",
    "invoice_title": "",
    "contacts": [
      {
        "name": "莊忠宏",
        "role": "",
        "phone": "0928-218-418",
        "email": "andrewyen.design@gmail.com",
        "notes": "",
        "primary": true
      },
      {
        "name": "莊銘芳",
        "role": "助理",
        "phone": "",
        "email": "andrewyen.design@gmail.com",
        "notes": "",
        "primary": false
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43803_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43803_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43803_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43803_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43803_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43803_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-009",
    "name": "國堡營造工程股份有限公司",
    "phone": "03-658-1979",
    "address": "新竹縣竹北市東興路一段79號2F",
    "company_name": "國堡營造工程股份有限公司",
    "tax_id": "86831047",
    "invoice_title": "",
    "contacts": [
      {
        "name": "何朝國",
        "role": "",
        "phone": "0910-177-921",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43804_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43804_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43804_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43804_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-010",
    "name": "華南銀行內壢分行",
    "phone": "03-462-6969",
    "address": "桃園市中壢區環中東路260號",
    "company_name": "華南銀行內壢分行",
    "tax_id": "80354784",
    "invoice_title": "",
    "contacts": [
      {
        "name": "楊玟莘",
        "role": "經理",
        "phone": "0932-359-450",
        "email": "tw2510m@hncb.com.tw",
        "notes": "",
        "primary": true
      },
      {
        "name": "張博森",
        "role": "",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": false
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43805_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43805_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43805_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43805_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43805_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43805_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-011",
    "name": "桃園市智慧產業學院",
    "phone": "",
    "address": "330桃園市桃園區崇法街71號3樓",
    "company_name": "桃園市智慧產業學院",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "洪武忠",
        "role": "執行顧問",
        "phone": "0939-866-701",
        "email": "wu_chung_hung@yahoo.com.tw",
        "notes": "",
        "primary": true
      },
      {
        "name": "鍾書嫚",
        "role": "專員",
        "phone": "0919-331-933",
        "email": "shuyuanchung@gmail.com",
        "notes": "",
        "primary": false
      },
      {
        "name": "葉惠菁",
        "role": "顧問",
        "phone": "0955-849-329",
        "email": "hcddianayeh@gmail.com",
        "notes": "",
        "primary": false
      },
      {
        "name": "吳天勝",
        "role": "院長",
        "phone": "0930-876-822",
        "email": "tension3013wu@yahoo.com.tw",
        "notes": "",
        "primary": false
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43806_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43806_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43806_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43806_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43806_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43806_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43807_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43807_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43808_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43808_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-012",
    "name": "財團法人塑膠工業技術發展中心",
    "phone": "04-2359-5900",
    "address": "40768台中市西屯區工業區三十九路59號",
    "company_name": "財團法人塑膠工業技術發展中心",
    "tax_id": "77253376",
    "invoice_title": "",
    "contacts": [
      {
        "name": "何承育",
        "role": "知識發展部永續發展組",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43807_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43807_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43807_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43807_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-013",
    "name": "桃園市政府社會局",
    "phone": "03-334-8487",
    "address": "33001桃園市桃園區縣府路1號4樓",
    "company_name": "桃園市政府社會局",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "陳寶民",
        "role": "局長",
        "phone": "0933-119-659",
        "email": "10023981@mail.tycg.gov.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43808_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43808_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43808_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43808_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-014",
    "name": "新竹捐血中心",
    "phone": "03-555-6111",
    "address": "新竹縣竹北市光明十一路215巷8號",
    "company_name": "新竹捐血中心",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "Li-Wen Huang",
        "role": "Chief Division of Operation",
        "phone": "",
        "email": "liwen.sc@blood.org.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43809_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43809_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43809_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43809_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-015",
    "name": "桃園市政府警察局中壢分局偵查隊",
    "phone": "03-422-2032",
    "address": "",
    "company_name": "桃園市政府警察局中壢分局偵查隊",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "戴名鈞",
        "role": "副隊長",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": true
      },
      {
        "name": "戴立明",
        "role": "副隊長",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": false
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43809_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43809_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43809_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43809_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      },
      {
        "name": "43810_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43810_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-016",
    "name": "桃園市政府警察局中壢分局",
    "phone": "03-422-4925",
    "address": "320桃園市中壢區延平路607號",
    "company_name": "桃園市政府警察局中壢分局",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "鄭伯群",
        "role": "副分局長",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43810_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43810_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43810_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43810_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-017",
    "name": "桃園市政府警察局中壢分局",
    "phone": "03-426-9850",
    "address": "320680桃園市中壢區延平路607號",
    "company_name": "桃園市政府警察局中壢分局",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "高海源",
        "role": "副分局長",
        "phone": "0911-783-666",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43811_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43811_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43811_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43811_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-018",
    "name": "敬鵬工業股份有限公司",
    "phone": "03-469-0626",
    "address": "324桃園市平鎮區工業二路15號",
    "company_name": "敬鵬工業股份有限公司",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "曾庭芳",
        "role": "品保部工程師",
        "phone": "",
        "email": "B0005401@cppcb.com.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43812_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43812_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43812_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43812_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-019",
    "name": "桃園市楊梅區瑞梅國民小學",
    "phone": "",
    "address": "桃園市楊梅區中山北路一段463號",
    "company_name": "桃園市楊梅區瑞梅國民小學",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "鄭佳柏",
        "role": "家長會長",
        "phone": "0915-599-529",
        "email": "xuanana1000@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43812_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43812_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43812_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43812_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-020",
    "name": "立法委員魯明哲服務團隊",
    "phone": "03-425-2121",
    "address": "桃園市中壢區環北路398號5樓之77",
    "company_name": "立法委員魯明哲服務團隊",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "譚茂仁",
        "role": "秘書",
        "phone": "0913-230-561",
        "email": "jackru1005@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43813_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43813_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43813_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43813_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-021",
    "name": "台灣民眾黨",
    "phone": "",
    "address": "台北市松山區南京東路三段261號3樓",
    "company_name": "台灣民眾黨",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "張清俊",
        "role": "社會發展部主任",
        "phone": "0919-974-698",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43813_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43813_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43813_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43813_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-022",
    "name": "桃園市大園區潮音國民小學",
    "phone": "03-386-2834",
    "address": "33742桃園市大園區潮音路一段188號",
    "company_name": "桃園市大園區潮音國民小學",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "蔣偉民",
        "role": "校長",
        "phone": "0910-116-620",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43814_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43814_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43814_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43814_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-023",
    "name": "敏實科技大學",
    "phone": "03-592-7700",
    "address": "30740新竹縣芎林鄉大華路一號",
    "company_name": "敏實科技大學",
    "tax_id": "48300202",
    "invoice_title": "",
    "contacts": [
      {
        "name": "林文燦",
        "role": "榮譽副校長",
        "phone": "0935-974-888",
        "email": "lin505@mitust.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43814_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43814_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43814_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43814_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-024",
    "name": "國立中興大學森林學系",
    "phone": "04-2284-0345",
    "address": "402台中市南區興大路145號",
    "company_name": "國立中興大學森林學系",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "楊德新",
        "role": "教授",
        "phone": "0932-381-651",
        "email": "tehshinyang@nchu.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43815_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43815_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43815_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43815_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-025",
    "name": "桃園市蘆竹區大華國民小學",
    "phone": "03-323-2664",
    "address": "桃園市蘆竹區大華街98號",
    "company_name": "桃園市蘆竹區大華國民小學",
    "tax_id": "67775312",
    "invoice_title": "",
    "contacts": [
      {
        "name": "黃熠盛",
        "role": "校長",
        "phone": "0920-504-043",
        "email": "jmmeter@ms.tyc.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43815_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43815_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43815_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43815_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-026",
    "name": "國立臺北科技大學材料及資源工程系",
    "phone": "02-2771-2171",
    "address": "10608台北市忠孝東路三段1號",
    "company_name": "國立臺北科技大學材料及資源工程系",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "陳志恆",
        "role": "教授",
        "phone": "",
        "email": "fl0871@ntut.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43816_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43816_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43816_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43816_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-027",
    "name": "元智大學藝術與設計學系",
    "phone": "",
    "address": "320315桃園市中壢區遠東路135號",
    "company_name": "元智大學藝術與設計學系",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "",
        "role": "",
        "phone": "",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43816_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43816_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43816_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43816_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-028",
    "name": "萬能科技大學觀光與休閒事業管理系",
    "phone": "03-451-5811",
    "address": "320676桃園市中壢區萬能路1號",
    "company_name": "萬能科技大學觀光與休閒事業管理系",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "林水泉",
        "role": "副教授",
        "phone": "0936-232-680",
        "email": "scl0712@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43817_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43817_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43817_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43817_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-029",
    "name": "桃園市中壢區新街國民小學",
    "phone": "03-452-3202",
    "address": "320桃園市中壢區延平路176號",
    "company_name": "桃園市中壢區新街國民小學",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "王寵銘",
        "role": "校長",
        "phone": "0928-684-291",
        "email": "head@sies.tyc.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43817_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43817_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43817_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43817_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-030",
    "name": "元智大學教務處招生入學組",
    "phone": "03-463-8800",
    "address": "32003桃園市中壢區遠東路135號",
    "company_name": "元智大學教務處招生入學組",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "周金枚",
        "role": "組長",
        "phone": "",
        "email": "kinmei@saturn.yzu.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43818_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43818_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43818_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43818_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-031",
    "name": "元智大學",
    "phone": "03-462-9136",
    "address": "320315桃園市中壢區遠東路135號",
    "company_name": "元智大學",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "廖慶榮",
        "role": "校長",
        "phone": "",
        "email": "ptdept@saturn.yzu.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43818_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43818_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43818_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43818_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-032",
    "name": "元智大學工業工程與管理學系",
    "phone": "03-463-8800",
    "address": "32003桃園市中壢區遠東路135號",
    "company_name": "元智大學工業工程與管理學系",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "蔡介元",
        "role": "教授兼系主任所長",
        "phone": "",
        "email": "cytasi@saturn.yzu.edu.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43819_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43819_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43819_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43819_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-033",
    "name": "金車大塚股份有限公司",
    "phone": "03-436-0205",
    "address": "320046桃園市中壢區榮民南路412號",
    "company_name": "金車大塚股份有限公司",
    "tax_id": "28644662",
    "invoice_title": "",
    "contacts": [
      {
        "name": "廖振東",
        "role": "販促開發部組長",
        "phone": "0926-633-054",
        "email": "hoe1505@kco.com.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43820_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43820_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43820_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43820_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-034",
    "name": "昕之蜜生技美容美體",
    "phone": "03-482-9243",
    "address": "桃園市楊梅區埔心永美路112號",
    "company_name": "昕之蜜生技美容美體",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "黃意娥",
        "role": "",
        "phone": "0913-915-180",
        "email": "mon.0525@yahoo.com.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43821_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43821_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43821_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43821_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-035",
    "name": "信義房屋",
    "phone": "03-287-8969",
    "address": "桃園市中壢區高鐵站前西路一段282號",
    "company_name": "信義房屋",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "傅琦儒",
        "role": "",
        "phone": "0982-864-161",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43822_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43822_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43822_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43822_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-036",
    "name": "古華花園飯店古華酒藏",
    "phone": "03-281-1398",
    "address": "320015桃園市中壢區民權路398號",
    "company_name": "古華花園飯店古華酒藏",
    "tax_id": "16837146",
    "invoice_title": "",
    "contacts": [
      {
        "name": "謝逸豪",
        "role": "執行董事",
        "phone": "",
        "email": "howard.hsieh@kuva-chateau.com.tw",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43822_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43822_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43822_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43822_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-037",
    "name": "行動屋桃園網通",
    "phone": "",
    "address": "桃園市中壢區新中北路二段223號",
    "company_name": "行動屋桃園網通",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "王洧平",
        "role": "執行長",
        "phone": "0922-515-311",
        "email": "a22515311@gmail.com",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43823_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43823_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43823_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43823_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-038",
    "name": "國際獅子會300B3區蘆竹獅子會",
    "phone": "",
    "address": "桃園市中壢區領航南路四段168號2樓",
    "company_name": "國際獅子會300B3區蘆竹獅子會",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "許家鳴",
        "role": "2025-2026總管",
        "phone": "0960-575-087",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43823_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43823_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43823_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43823_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-039",
    "name": "鉅城廣告股份有限公司",
    "phone": "03-287-6063",
    "address": "桃園市中壢區高鐵站前四路一段286號13樓之5",
    "company_name": "鉅城廣告股份有限公司",
    "tax_id": "83059821",
    "invoice_title": "",
    "contacts": [
      {
        "name": "傅春儒",
        "role": "總經理",
        "phone": "0982-864-161",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43824_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43824_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43824_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43824_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-040",
    "name": "永強不動產仲介有限公司",
    "phone": "03-271-3636",
    "address": "桃園市楊梅區新農街569號",
    "company_name": "永強不動產仲介有限公司",
    "tax_id": "53495380",
    "invoice_title": "",
    "contacts": [
      {
        "name": "梁萬棟",
        "role": "",
        "phone": "0970-893-835",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43824_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43824_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43824_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43824_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-041",
    "name": "桃園大同扶輪社",
    "phone": "03-347-2828",
    "address": "桃園市桃園區鎮四街72-1號2樓",
    "company_name": "桃園大同扶輪社",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "張朝舜",
        "role": "攝影主委",
        "phone": "0928-872-035",
        "email": "tatung97@ms81.hinet.net",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43825_0_card1.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43825_0_card1.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43825_0_card1.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43825_0_card1.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  },
  {
    "id": "ocr20260706-042",
    "name": "永安鐵櫃家具股份有限公司",
    "phone": "02-2311-4679",
    "address": "33463桃園市八德區興豐路1691巷126號",
    "company_name": "永安鐵櫃家具股份有限公司",
    "tax_id": "",
    "invoice_title": "",
    "contacts": [
      {
        "name": "蕭家權",
        "role": "桃竹苗區副總會長",
        "phone": "0937-041-988",
        "email": "",
        "notes": "",
        "primary": true
      }
    ],
    "notes": "",
    "is_active": true,
    "business_card_image": {
      "name": "43825_0_card2.jpg",
      "type": "image/jpeg",
      "src": "business-cards-20260706/43825_0_card2.jpg?v=20260706-crop-002",
      "saved_at": "2026-07-06T00:00:00.000Z"
    },
    "business_card_images": [
      {
        "name": "43825_0_card2.jpg",
        "type": "image/jpeg",
        "src": "business-cards-20260706/43825_0_card2.jpg?v=20260706-crop-002",
        "saved_at": "2026-07-06T00:00:00.000Z"
      }
    ],
    "ocr_batch_id": "business-card-batch-20260706",
    "ocr_batch_version": "20260706-local-001"
  }
];

  function importCustomers() {
    try {
      if (typeof localStorage === "undefined") return;
      const stateRef = typeof state !== "undefined" ? state : null;
      const storageKey = typeof STORAGE_KEY !== "undefined" ? STORAGE_KEY : "materials_quote_clone_state";
      const data = stateRef || JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (!data || !Array.isArray(data.customers)) return;
      if (localStorage.getItem(MARKER) === VERSION && data.customers.some((item) => item.ocr_batch_id === BATCH_ID)) return;
      data.customers = data.customers.filter((item) => item.ocr_batch_id !== BATCH_ID);
      data.customers.push(...CUSTOMERS);
      if (stateRef) stateRef.customers = data.customers;
      if (typeof saveState === "function") saveState();
      else localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(MARKER, VERSION);
      window.__ocrBatchCustomers20260706 = { imported: CUSTOMERS.length, batchId: BATCH_ID, version: VERSION };
    } catch (error) {
      console.warn("OCR batch customer import failed", error);
    }
  }

  importCustomers();
})();
